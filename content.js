const script = document.createElement('script');
script.src = chrome.runtime.getURL('storage.js');
document.documentElement.appendChild(script);

const messagesScript = document.createElement('script');
messagesScript.src = chrome.runtime.getURL('messages.js');
document.documentElement.appendChild(messagesScript);

let customHotkey = null;

async function loadHotkey() {
  customHotkey = await new Promise((resolve) => {
    chrome.storage.sync.get(['customHotkey'], (result) => {
      resolve(result.customHotkey);
    });
  });
}

loadHotkey();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.customHotkey) {
    customHotkey = changes.customHotkey.newValue;
  }
});

document.addEventListener("keydown", async (e) => {
  if (!customHotkey) return;

  const matches = 
    (customHotkey.ctrl === e.ctrlKey) &&
    (customHotkey.shift === e.shiftKey) &&
    (customHotkey.alt === e.altKey) &&
    (customHotkey.meta === e.metaKey) &&
    (customHotkey.key.toUpperCase() === e.key.toUpperCase());

  if (matches) {
    e.preventDefault();
    
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
      chrome.runtime.sendMessage(
        createMessage(MESSAGE_TYPES.OPEN_POPUP, { text: selectedText }),
        () => {}
      );
    }
  }
});
