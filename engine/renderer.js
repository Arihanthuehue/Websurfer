// engine/renderer.js

const Renderer = {
  ctx: null,
  canvas: null,
  frameCount: 0,
  hudTimer: 300, // Show hints for ~5 seconds at 60fps
  startTimer: 180, // "MAKE IT TO THE END" for 3 seconds
  playerName: "Surfer",
  playerColor: "#3b6fd4",
  confetti: [],
  
  init(canvas, name = "Surfer", color = "#3b6fd4") {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.playerName = name;
    this.playerColor = color;
    this.confetti = [];
  },

  draw(physics, input, dt) {
    const p = physics.player;
    this.frameCount++;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw platforms
    this.ctx.lineWidth = 1;
    for (const plat of physics.platforms) {
      if (p.onPlatform === plat) {
        this.ctx.fillStyle = 'rgba(99, 179, 255, 0.2)';
      } else {
        this.ctx.fillStyle = 'rgba(99, 179, 255, 0.08)';
      }
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      
      // Top dashed border
      this.ctx.beginPath();
      this.ctx.setLineDash([4, 2]);
      this.ctx.strokeStyle = 'rgba(99, 179, 255, 0.35)';
      this.ctx.moveTo(plat.x, plat.y);
      this.ctx.lineTo(plat.x + plat.width, plat.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      if (input.debugToggled) {
        this.ctx.fillStyle = '#63b3ff';
        this.ctx.font = '9px monospace';
        this.ctx.fillText(plat.tag, plat.x, plat.y - 4);
      }
    }

    // Draw shadow
    this.drawShadow(p, physics.platforms);

    // Draw Player Name
    this.ctx.font = 'bold 9px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.fillText(this.playerName, p.x + p.width/2, p.y - 6);

    // Draw Player
    this.ctx.save();
    
    // Move to player center bottom for scaling/flipping
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height;
    
    this.ctx.translate(cx, cy);
    if (!p.facingRight) {
      this.ctx.scale(-1, 1);
    }
    
    // Shift up by player height to draw from top-left
    this.ctx.translate(-p.width / 2, -p.height);

    this.drawCharacter(p);
    
    this.ctx.restore();

    // Draw HUD
    this.drawHUD(physics, input);
  },

  drawShadow(p, platforms) {
    let nearestDist = window.innerHeight;
    
    if (p.onGround) {
      nearestDist = 0;
    } else {
      for (const plat of platforms) {
        if (p.x < plat.x + plat.width && p.x + p.width > plat.x && plat.y >= p.y + p.height) {
          const dist = plat.y - (p.y + p.height);
          if (dist < nearestDist) nearestDist = dist;
        }
      }
    }

    // Scale shadow
    if (nearestDist < 200) {
      const alpha = Math.max(0.02, 0.18 - (nearestDist / 200) * 0.16);
      const shadowWidth = Math.max(4, p.width - (nearestDist / 200) * 10);
      
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height + nearestDist;

      this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, shadowWidth, 3, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  },

  drawCharacter(p) {
    const isRunning = Math.abs(p.vx) > 0.5 && p.onGround;
    const isFalling = p.vy > 1;
    const isJumping = p.vy < 0;

    let bobOffset = 0;
    if (p.onGround && !isRunning) {
      bobOffset = (this.frameCount % 40 < 20) ? 1 : 0; // subtle 1px bob
    }

    // Hat / Headband
    this.ctx.fillStyle = this.playerColor; // match shirt
    this.ctx.fillRect(3, bobOffset - 2, 10, 3);

    // Head (skin tone)
    this.ctx.fillStyle = '#FFCD94';
    this.ctx.fillRect(3, bobOffset + 1, 10, 9);
    
    // Sunglasses (Cool factor)
    this.ctx.fillStyle = '#111111';
    this.ctx.fillRect(7, 3 + bobOffset, 6, 3);
    this.ctx.fillRect(13, 3 + bobOffset, 1, 2);

    // Body (Jacket + Shirt)
    // Jacket left
    this.ctx.fillStyle = this.playerColor;
    this.ctx.fillRect(3, 10 + bobOffset, 2, 10);
    // Shirt middle
    this.ctx.fillStyle = '#ffffff'; 
    this.ctx.fillRect(5, 10 + bobOffset, 6, 10);
    // Jacket right
    this.ctx.fillStyle = this.playerColor;
    this.ctx.fillRect(11, 10 + bobOffset, 2, 10);

    // Backpack
    this.ctx.fillStyle = '#444444';
    this.ctx.fillRect(1, 11 + bobOffset, 3, 7);

    // Legs
    this.ctx.fillStyle = '#2b3a67'; // Denim pants
    let leftLegY = 20;
    let rightLegY = 20;
    let legH = 4;

    if (isRunning) {
      const runCycle = Math.floor(this.frameCount / 5) % 4;
      if (runCycle === 0 || runCycle === 2) {
        // both down
      } else if (runCycle === 1) {
        leftLegY -= 2;
      } else {
        rightLegY -= 2;
      }
    } else if (isJumping) {
      leftLegY -= 3;
      rightLegY -= 3;
      legH = 3;
    } else if (isFalling) {
      leftLegY -= 1;
      rightLegY -= 2;
    }

    this.ctx.fillRect(4, leftLegY + bobOffset, 3, legH);
    this.ctx.fillRect(9, rightLegY + bobOffset, 3, legH);
    
    // Shoes
    this.ctx.fillStyle = '#e6e6e6'; // White sneakers
    this.ctx.fillRect(4, leftLegY + legH + bobOffset, 4, 2);
    this.ctx.fillRect(9, rightLegY + legH + bobOffset, 4, 2);

    // Arms
    this.ctx.fillStyle = this.playerColor; // Jacket sleeves
    let leftArmY = 11;
    let rightArmY = 11;

    if (isRunning) {
      const runCycle = Math.floor(this.frameCount / 5) % 4;
      if (runCycle === 1) leftArmY -= 2;
      else if (runCycle === 3) rightArmY -= 2;
    } else if (isJumping) {
      leftArmY -= 4;
      rightArmY -= 4;
    } else if (isFalling) {
      leftArmY -= 2;
      rightArmY -= 3;
    }

    this.ctx.fillRect(1, leftArmY + bobOffset, 3, 6);
    // Hand
    this.ctx.fillStyle = '#FFCD94';
    this.ctx.fillRect(1, leftArmY + 6 + bobOffset, 2, 2);
  },

  drawHUD(physics, input) {
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'right';
    
    // Top right pill
    const txt = `Plats: ${physics.platforms.length} | State: ${physics.player.onGround ? 'GND' : 'AIR'}`;
    const w = this.ctx.measureText(txt).width;
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.beginPath();
    this.ctx.roundRect(this.canvas.width - w - 30, 10, w + 20, 24, 12);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(txt, this.canvas.width - 20, 26);

    // Hints
    if (this.hudTimer > 0) {
      this.hudTimer--;
      this.ctx.textAlign = 'center';
      const alpha = Math.min(1, this.hudTimer / 30); // fade out last 30 frames
      
      this.ctx.fillStyle = `rgba(0,0,0,${alpha * 0.7})`;
      this.ctx.beginPath();
      this.ctx.roundRect(this.canvas.width/2 - 120, 50, 240, 40, 8);
      this.ctx.fill();

      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this.ctx.font = '11px monospace';
      this.ctx.fillText("Arrows to Move | Space to Jump", this.canvas.width/2, 66);
      this.ctx.fillText("Escape to Disable", this.canvas.width/2, 80);
    }

    // Start Message
    if (this.startTimer > 0) {
      this.startTimer--;
      const alpha = Math.min(1, this.startTimer / 30);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 40px monospace';
      this.ctx.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
      this.ctx.fillText("MAKE IT TO THE END", this.canvas.width/2 + 4, this.canvas.height/2 + 4);
      this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      this.ctx.fillText("MAKE IT TO THE END", this.canvas.width/2, this.canvas.height/2);
    }

    // Win Animation
    if (physics.gameState === 'WON') {
      this.drawWinAnimation();
    }
  },

  drawWinAnimation() {
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 60px monospace';
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillText("YOU WIN!", this.canvas.width/2 + 4, this.canvas.height/3 + 4);
    this.ctx.fillStyle = '#63b3ff';
    this.ctx.fillText("YOU WIN!", this.canvas.width/2, this.canvas.height/3);

    // Confetti logic
    if (this.confetti.length < 100) {
      this.confetti.push({
        x: this.canvas.width/2 + (Math.random() - 0.5) * 400,
        y: this.canvas.height/3,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 1) * 10 - 5,
        color: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00'][Math.floor(Math.random() * 5)],
        size: Math.random() * 6 + 4
      });
    }

    for (let c of this.confetti) {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.2; // gravity
      this.ctx.fillStyle = c.color;
      this.ctx.fillRect(c.x, c.y, c.size, c.size);
    }
  }
};
