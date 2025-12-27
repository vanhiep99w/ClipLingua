let customHotkey = null;
let floatingPopup = null;

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

function removeFloatingPopup() {
  if (floatingPopup && floatingPopup.parentNode) {
    floatingPopup.remove();
  }
  floatingPopup = null;
}

function createFloatingPopup(x, y) {
  removeFloatingPopup();

  floatingPopup = document.createElement('iframe');
  floatingPopup.id = 'cliplingua-floating-popup';
  floatingPopup.src = chrome.runtime.getURL('floating-popup.html');
  floatingPopup.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    border: none;
    width: 400px;
    height: auto;
    min-height: 150px;
    max-height: 500px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    border-radius: 8px;
  `;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = x + 10;
  let top = y + 10;

  if (left + 400 > viewportWidth) {
    left = viewportWidth - 410;
  }
  if (top + 300 > viewportHeight) {
    top = y - 310;
  }

  floatingPopup.style.left = `${Math.max(10, left)}px`;
  floatingPopup.style.top = `${Math.max(10, top)}px`;

  document.body.appendChild(floatingPopup);

  setTimeout(() => {
    if (floatingPopup) {
      const iframe = floatingPopup;
      iframe.style.height = (iframe.contentWindow.document.body.scrollHeight + 20) + 'px';
    }
  }, 100);
}

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
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      chrome.runtime.sendMessage({
        type: "OPEN_POPUP",
        payload: { text: selectedText },
        timestamp: Date.now()
      });

      createFloatingPopup(rect.right, rect.bottom);
    }
  }
});

document.addEventListener('click', (e) => {
  if (floatingPopup && !floatingPopup.contains(e.target)) {
    removeFloatingPopup();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && floatingPopup) {
    removeFloatingPopup();
  }
});
