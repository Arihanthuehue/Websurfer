// engine/physics.js

const Physics = {
  GRAVITY: 0.45,
  JUMP_FORCE: -9.5,
  WALK_SPEED: 3.2,
  GROUND_FRICTION: 0.78,
  AIR_FRICTION: 0.92,
  MAX_FALL_SPEED: 14,
  COYOTE_FRAMES: 6,
  JUMP_BUFFER_FRAMES: 8,

  gameState: 'PLAYING', // 'PLAYING' or 'WON'

  player: {
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    width: 16,
    height: 24,
    onGround: false,
    onPlatform: null,
    facingRight: true,
    isJumping: false,
    coyoteTime: 0,
    jumpBufferTime: 0,
    dropThroughTime: 0
  },

  platforms: [],
  lastScrollY: 0,

  init(startX, startY) {
    this.player.x = startX;
    this.player.y = startY;
    this.lastScrollY = window.scrollY;
    this.gameState = 'PLAYING';
  },

  updatePlatforms(newPlatforms) {
    this.platforms = newPlatforms;
    // Check if current platform is still there
    if (this.player.onPlatform) {
      const stillExists = this.platforms.find(p => p.element === this.player.onPlatform.element);
      if (!stillExists) {
        this.player.onGround = false;
        this.player.onPlatform = null;
      }
    }
  },

  step(input) {
    const p = this.player;
    const prevY = p.y;
    
    // Handle Input for horizontal movement
    if (this.gameState === 'PLAYING' && input.keys.left) {
      p.vx -= 1.5; // Acceleration
      p.facingRight = false;
    } else if (this.gameState === 'PLAYING' && input.keys.right) {
      p.vx += 1.5;
      p.facingRight = true;
    }

    // Clamp horizontal speed
    if (p.vx > this.WALK_SPEED) p.vx = this.WALK_SPEED;
    if (p.vx < -this.WALK_SPEED) p.vx = -this.WALK_SPEED;

    // Fast Fall
    if (this.gameState === 'PLAYING' && input.keys.down && !p.onGround) {
      p.vy *= 1.6;
    }

    // Drop through platform
    if (this.gameState === 'PLAYING' && input.keys.drop && p.onGround) {
      p.dropThroughTime = 12;
      p.onGround = false;
      p.onPlatform = null;
    }

    // Jump Buffering
    if (this.gameState === 'PLAYING' && input.keys.jump && !p.isJumping) {
      p.jumpBufferTime = this.JUMP_BUFFER_FRAMES;
    } else if (p.jumpBufferTime > 0) {
      p.jumpBufferTime--;
    }

    // Jumping logic (Coyote time & Buffer)
    if (p.jumpBufferTime > 0 && (p.onGround || p.coyoteTime > 0)) {
      p.vy = this.JUMP_FORCE;
      p.onGround = false;
      p.onPlatform = null;
      p.coyoteTime = 0;
      p.jumpBufferTime = 0;
      p.isJumping = true;
    }

    // Variable jump height
    if (this.gameState === 'PLAYING' && p.vy < -4 && !input.keys.jump) {
      p.vy *= 0.78;
    }

    // Apply gravity
    let currentGravity = this.GRAVITY;
    if (p.vy > 0) currentGravity *= 1.35; // Asymmetric jump arc
    
    p.vy += currentGravity;
    if (p.vy > this.MAX_FALL_SPEED) p.vy = this.MAX_FALL_SPEED;

    // Apply friction
    if (!input.keys.left && !input.keys.right) {
      p.vx *= p.onGround ? this.GROUND_FRICTION : this.AIR_FRICTION;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    // Mid-air direction change (65% of ground speed limit effectively handled by friction diff, 
    // but we can cap it slightly if needed, though pure acceleration feels better)
    
    // Integrate position
    p.x += p.vx;
    p.y += p.vy;

    if (p.dropThroughTime > 0) {
      p.dropThroughTime--;
    }

    // Viewport bounds
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    } else if (p.x + p.width > window.innerWidth) {
      p.x = window.innerWidth - p.width;
      p.vx = 0;
    }

    // Scroll simulation
    const currentScrollY = window.scrollY;
    if (currentScrollY !== this.lastScrollY) {
      const deltaScroll = currentScrollY - this.lastScrollY;
      p.y += deltaScroll; // Reversed
      
      if (deltaScroll > 0) {
        p.vy += deltaScroll * 0.3; // Reversed nudge
      } else {
        p.vy -= Math.abs(deltaScroll) * 0.1; // Reversed nudge
      }
      this.lastScrollY = currentScrollY;
    }

    // Fallback floor if no platforms
    if (this.platforms.length === 0) {
      const floorY = window.innerHeight - 30;
      if (p.y + p.height >= floorY) {
        p.y = floorY - p.height;
        p.vy = 0;
        p.onGround = true;
        p.coyoteTime = this.COYOTE_FRAMES;
      }
    }

    // Platform Collisions
    let landed = false;
    if (p.vy >= 0 && p.dropThroughTime === 0) { // Only resolve if falling or neutral
      for (const plat of this.platforms) {
        // AABB
        if (p.x < plat.x + plat.width &&
            p.x + p.width > plat.x &&
            p.y + p.height >= plat.y &&
            p.y < plat.y + plat.height) {
          
          // Was player above platform in prev frame?
          // prevY + playerHeight <= plat.y + tolerance
          // We must account for high velocities, so tolerance is p.vy + scroll delta
          if (prevY + p.height <= plat.y + p.vy + 5) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.onGround = true;
            p.onPlatform = plat;
            p.coyoteTime = this.COYOTE_FRAMES;
            p.isJumping = false;
            landed = true;
            break; // Land on highest/first intersecting
          }
        }
      }
    }

    if (!landed) {
      p.onGround = false;
      if (p.coyoteTime > 0) p.coyoteTime--;
    }

    // Win condition check
    if (this.gameState === 'PLAYING' && p.onGround) {
      let isAtBottom = false;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      
      if (docHeight > winHeight + 50) {
        if (currentScrollY + winHeight >= docHeight - 50) {
          isAtBottom = true;
        }
      } else if (p.onPlatform && p.onPlatform.element) {
        let container = p.onPlatform.element.parentElement;
        while (container && container !== document.body && container !== document.documentElement) {
          if (container.scrollHeight > container.clientHeight + 20) {
            const style = window.getComputedStyle(container);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll' || container.scrollTop > 0) {
              if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
                isAtBottom = true;
              }
              break;
            }
          }
          container = container.parentElement;
        }
      }

      if (isAtBottom) {
        this.gameState = 'WON';
        p.vx = 0;
        p.vy = -12; // celebratory jump
        p.onGround = false;
        p.isJumping = true;
      }
    }

    // Safety fallback - if fell out of world
    if (p.y > window.innerHeight + 200) {
      p.y = -50; // respawn at top
      p.vy = 0;
    }
  }
};
