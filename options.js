// options.js

const apiKeyEl = document.getElementById('apiKey');
const saveBtn = document.getElementById('save');
const status = document.getElementById('status');

// Load stored key
chrome.storage.sync.get(['openai_api_key'], (res) => {
  apiKeyEl.value = res.openai_api_key || '';
});

// Save key
saveBtn.addEventListener('click', () => {
  const k = apiKeyEl.value.trim();
  chrome.storage.sync.set({ openai_api_key: k }, () => {
    status.textContent = 'Saved successfully!';
    setTimeout(() => status.textContent = '', 2000);
  });
});


// ADDED FIX: Request microphone permission on page load
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    status.textContent = 'Microphone permission granted.';
    stream.getTracks().forEach(track => track.stop()); // Immediately stop tracks to save resources
  })
  .catch(function(err) {
    if (err.name === 'NotAllowedError') {
      status.textContent = 'Microphone access denied. Voice commands will not work.';
    } else {
      status.textContent = 'Microphone error: ' + err.name;
    }
  });