chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // If no active tab (e.g., on a settings page), stop
    if (!tabs[0]) return;
    
    // Send the command ID (e.g., "toggle-voice", "toggle-sidebar") 
    // directly to content.js to handle the action
    chrome.tabs.sendMessage(tabs[0].id, { action: command });
  });
});