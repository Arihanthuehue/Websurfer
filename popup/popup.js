document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const playerName = document.getElementById('playerName');
  const playerColor = document.getElementById('playerColor');

  // Load global settings
  chrome.storage.local.get(['websurfer_name', 'websurfer_color'], (res) => {
    if (res.websurfer_name) playerName.value = res.websurfer_name;
    if (res.websurfer_color) playerColor.value = res.websurfer_color;
  });

  // Save settings on change
  const saveSettings = () => {
    chrome.storage.local.set({
      websurfer_name: playerName.value,
      websurfer_color: playerColor.value
    });
  };

  playerName.addEventListener('input', saveSettings);
  playerColor.addEventListener('input', saveSettings);

  // Load current state for this tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const tabId = tabs[0].id;
    
    // Check storage for this tab's state
    chrome.storage.local.get([`websurfer_${tabId}`], (result) => {
      toggleSwitch.checked = !!result[`websurfer_${tabId}`];
    });

    toggleSwitch.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      
      // Save state
      const storageObj = {};
      storageObj[`websurfer_${tabId}`] = isEnabled;
      chrome.storage.local.set(storageObj);

      // Send message to content script
      chrome.tabs.sendMessage(tabId, {
        type: 'TOGGLE_WEBSURFER',
        enabled: isEnabled,
        name: playerName.value || "Surfer",
        color: playerColor.value || "#3b6fd4"
      });
    });
  });
});
