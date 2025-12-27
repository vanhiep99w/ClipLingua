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
    width: 380px;
    height: 100px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    border-radius: 8px;
    opacity: 0;
    transition: opacity 0.2s;
  `;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = x + 15;
  let top = y + 5;

  if (left + 380 > viewportWidth) {
    left = x - 395;
  }
  if (left < 10) {
    left = 10;
  }
  
  if (top < 10) {
    top = 10;
  }

  floatingPopup.style.left = `${left}px`;
  floatingPopup.style.top = `${top}px`;

  document.body.appendChild(floatingPopup);

  const adjustHeight = () => {
    try {
      const iframeDoc = floatingPopup.contentDocument || floatingPopup.contentWindow.document;
      const body = iframeDoc.body;
      
      if (body && body.scrollHeight > 0) {
        const height = Math.min(body.scrollHeight + 20, 600);
        floatingPopup.style.height = height + 'px';
        
        if (top + height > viewportHeight) {
          const newTop = Math.max(10, viewportHeight - height - 20);
          floatingPopup.style.top = newTop + 'px';
        }
        
        floatingPopup.style.opacity = '1';
      } else {
        setTimeout(adjustHeight, 50);
      }
    } catch (e) {
      floatingPopup.style.height = '280px';
      floatingPopup.style.opacity = '1';
    }
  };

  floatingPopup.addEventListener('load', () => {
    setTimeout(adjustHeight, 100);
    
    const observer = new MutationObserver(() => {
      adjustHeight();
    });
    
    try {
      const iframeDoc = floatingPopup.contentDocument || floatingPopup.contentWindow.document;
      observer.observe(iframeDoc.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    } catch (e) {
      console.log('Could not observe iframe mutations');
    }
  });
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
