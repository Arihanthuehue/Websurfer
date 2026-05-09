// engine/input.js

const Input = {
  keys: {
    left: false,
    right: false,
    jump: false,
    down: false,
    drop: false, // Shift + S
    debug: false,
    debugHeldFrames: 0,
    escape: false
  },
  
  isSuspended: false,
  debugToggled: false,
  
  init(onEscape) {
    this.onEscape = onEscape;
    
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Suspend inputs if typing in an input field
    document.addEventListener('focusin', this.checkSuspension.bind(this));
    document.addEventListener('focusout', this.checkSuspension.bind(this));
  },

  checkSuspension() {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      this.isSuspended = true;
      this.resetKeys();
    } else {
      this.isSuspended = false;
    }
  },

  resetKeys() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.keys.down = false;
    this.keys.drop = false;
  },

  isGameKey(e) {
    const code = e.code;
    return ['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'Space', 'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'Escape', 'KeyD'].includes(code);
  },

  handleKeyDown(e) {
    if (this.isSuspended) return;
    if (!this.isGameKey(e)) return;
    
    // Only stop propagation for game keys if we are capturing them
    if (e.code !== 'Escape' && e.code !== 'KeyD' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.stopPropagation();
        e.preventDefault();
    }

    switch(e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD': // Note D is also used for debug toggle below if held
        this.keys.right = true;
        if (e.code === 'KeyD') this.keys.debug = true;
        break;
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.keys.jump = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = true;
        if (e.shiftKey) {
          this.keys.drop = true;
        }
        break;
      case 'Escape':
        if (this.onEscape) this.onEscape();
        break;
    }
  },

  handleKeyUp(e) {
    if (this.isSuspended) return;
    
    switch(e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        this.keys.debug = false;
        this.keys.debugHeldFrames = 0;
        break;
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.keys.jump = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = false;
        this.keys.drop = false;
        break;
    }
  },

  update() {
    if (this.keys.debug) {
      this.keys.debugHeldFrames++;
      if (this.keys.debugHeldFrames === 60) { // Approx 1 second at 60fps
        this.debugToggled = !this.debugToggled;
      }
    } else {
      this.keys.debugHeldFrames = 0;
    }
  }
};
