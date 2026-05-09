chrome.runtime.onInstalled.addListener(() => {
  console.log("WebSurfer installed.");
});

// Pass messages from popup to the active tab's content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_WEBSURFER') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});
