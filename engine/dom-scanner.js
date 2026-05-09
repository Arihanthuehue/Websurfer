// engine/dom-scanner.js

const DOMScanner = {
  platforms: [],
  observer: null,
  lastScrollY: 0,
  scrollTimeout: null,
  
  selectors: [
    'button', '[role="button"]',
    'a[href]',
    'input[type="submit"]', 'input[type="button"]',
    '[role="dialog"]', '[role="modal"]',
    'nav', 'header',
    'label', '.card', '.badge',
    'ytd-thumbnail', 'a#thumbnail',
    // Chat Message Bubbles (WhatsApp & Instagram)
    '.message-in', '.message-out',
    'div[data-preplain-text]',
    'div[role="row"]', 'div[data-id]',
    'div[dir="auto"]', 'span[dir="auto"]'
  ].join(','),

  init(onScanComplete) {
    this.lastScrollY = window.scrollY;
    this.onScanComplete = onScanComplete;
    
    this.scan();

    // Scroll listener with throttle
    window.addEventListener('scroll', () => {
      if (!this.scrollTimeout) {
        this.scrollTimeout = setTimeout(() => {
          this.scan();
          this.scrollTimeout = null;
        }, 100);
      }
    });

    // Mutation observer for DOM changes
    let mutationTimeout = null;
    this.observer = new MutationObserver(() => {
      if (!mutationTimeout) {
        mutationTimeout = setTimeout(() => {
          this.scan();
          mutationTimeout = null;
        }, 200);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  },

  scan() {
    const elements = document.querySelectorAll(this.selectors);
    const newPlatforms = [];
    
    // Performance cap
    const maxPlatforms = 200;
    let count = 0;

    for (let i = 0; i < elements.length; i++) {
      if (count >= maxPlatforms) break;
      
      const el = elements[i];
      // Skip hidden elements or SVG inner elements
      if (el.offsetParent === null && el.tagName !== 'BODY') continue;
      
      const rect = el.getBoundingClientRect();
      
      // Filter out small elements
      if (rect.height < 4 || rect.width < 20) continue;
      // Filter out elements entirely outside viewport + buffer
      if (rect.bottom < -500 || rect.top > window.innerHeight + 500) continue;

      const isModal = el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'modal';
      
      newPlatforms.push({
        x: rect.left,
        y: rect.top, // y is relative to viewport, so it matches canvas space since canvas is fixed
        width: rect.width,
        height: rect.height,
        tag: el.tagName.toLowerCase(),
        isWide: rect.width > 80,
        isModal: isModal,
        element: el // keep reference if needed
      });
      
      count++;
    }

    this.platforms = newPlatforms;
    if (this.onScanComplete) {
      this.onScanComplete(this.platforms);
    }
  },

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('scroll', this.scan);
  }
};
