// content.js

// Do not inject into cross-origin iframes
if (window.self !== window.top) {
  console.log("WebSurfer: Running in iframe, aborting.");
} else {

  let isActive = false;
  let canvas = null;
  let animationFrameId = null;
  let lastTime = 0;

  function initWebSurfer(name = "Surfer", color = "#3b6fd4") {
    if (isActive) return;
    isActive = true;

    // Create canvas
    canvas = document.createElement('canvas');
    canvas.id = 'websurfer-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none'; // Passthrough clicks
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Initialize engines
    Renderer.init(canvas, name, color);
    
    Input.init(() => {
      // Escape callback
      disableWebSurfer();
    });

    DOMScanner.init((platforms) => {
      Physics.updatePlatforms(platforms);
    });

    // Start player top center
    Physics.init(window.innerWidth / 2 - 8, -50);

    // SPA Navigation listener
    window.addEventListener('popstate', handleSPA);
    window.addEventListener('hashchange', handleSPA);

    lastTime = performance.now();
    loop(lastTime);
  }

  function handleSPA() {
    setTimeout(() => {
      if (isActive) DOMScanner.scan();
    }, 300);
  }

  function loop(time) {
    if (!isActive) return;
    
    const dt = time - lastTime;
    lastTime = time;

    // We can use fixed timestep or just frame-based. Prompt asked for "frame-based manual physics loop"
    // that completes in under 4ms. We will just step once per RAF.
    
    Input.update();
    Physics.step(Input);
    Renderer.draw(Physics, Input, dt);

    animationFrameId = requestAnimationFrame(loop);
  }

  function disableWebSurfer() {
    if (!isActive) return;
    isActive = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    
    DOMScanner.cleanup();
    
    window.removeEventListener('popstate', handleSPA);
    window.removeEventListener('hashchange', handleSPA);

    // Notify popup/storage to stay synced
    chrome.storage.local.get([`websurfer_${chrome.runtime.id}`], () => {
      // It's hard to get the tab id here cleanly without async to background,
      // but we can just send a message to background to update state if needed,
      // or the popup will just read off next time.
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_WEBSURFER') {
      if (message.enabled) {
        initWebSurfer(message.name, message.color);
      } else {
        disableWebSurfer();
      }
    }
  });

  // Check initial state
  chrome.runtime.sendMessage({type: "CHECK_STATE"}, (response) => {
      // Actually, we can just let the popup push state on open, or read storage here
      // But we need the tabId for storage. We can just rely on the background or popup to tell us,
      // or use a generic storage key. Let's just default to off and wait for popup toggle.
  });
}
