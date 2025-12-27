// Auto-reload when extension context is invalidated
if (!chrome.runtime?.id) {
  console.log('Extension context invalidated, reloading page...');
  window.location.reload();
}

// Inject page-context bridge for CKEditor access
(function injectBridge() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('ckeditor-bridge.js');
  script.onload = function() {
    this.remove();
    console.log('[ClipLingua] CKEditor bridge injected');
  };
  (document.head || document.documentElement).appendChild(script);
})();

let customHotkey = null;
let floatingPopup = null;
let activeInputField = null;
let pendingText = null;

let lastShiftTime = 0;
const DOUBLE_SHIFT_DELAY = 300;

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
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    border-radius: 8px;
    opacity: 0;
    transition: opacity 0.2s, height 0.2s ease;
  `;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = x + 15;
  let initialTop = y + 5;

  if (left + 380 > viewportWidth) {
    left = x - 395;
  }
  if (left < 10) {
    left = 10;
  }
  
  if (initialTop < 10) {
    initialTop = 10;
  }

  floatingPopup.style.left = `${left}px`;
  floatingPopup.style.top = `${initialTop}px`;

  document.body.appendChild(floatingPopup);
}

window.addEventListener('message', (event) => {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    window.location.reload();
    return;
  }
  
  // Security: Validate message origin and source
  const extensionOrigin = chrome.runtime.getURL('').slice(0, -1);
  
  // Only accept messages from extension iframe
  if (event.origin !== extensionOrigin) {
    return;
  }
  
  if (floatingPopup && event.source !== floatingPopup.contentWindow) {
    return;
  }
  
  if (event.data.type === 'POPUP_READY' && floatingPopup) {
    const textToSend = pendingText || window.getSelection().toString().trim();
    const isInputContext = !!activeInputField;
    floatingPopup.contentWindow.postMessage({
      type: 'SELECTION_DATA',
      text: textToSend,
      isInputContext: isInputContext
    }, extensionOrigin);
    pendingText = null;
  } else if (event.data.type === 'CLOSE_POPUP') {
    removeFloatingPopup();
  } else if (event.data.type === 'SET_HEIGHT' && event.data.height) {
    const height = Math.min(event.data.height, 600);
    floatingPopup.style.height = `${height}px`;
    
    const viewportHeight = window.innerHeight;
    const currentTop = parseFloat(floatingPopup.style.top);
    if (currentTop + height > viewportHeight) {
      const newTop = Math.max(10, viewportHeight - height - 20);
      floatingPopup.style.top = `${newTop}px`;
    }
    floatingPopup.style.opacity = '1';
  } else if (event.data.type === 'COPY_TEXT' && event.data.text) {
    navigator.clipboard.writeText(event.data.text).catch(err => {
      console.error('Copy failed:', err);
    });
  } else if (event.data.type === 'APPLY_TO_INPUT' && event.data.text) {
    if (activeInputField) {
      if (activeInputField.isContentEditable) {
        activeInputField.textContent = event.data.text;
        activeInputField.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        activeInputField.value = event.data.text;
        activeInputField.dispatchEvent(new Event('input', { bubbles: true }));
        activeInputField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE_SELECTION' && message.text) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    createFloatingPopup(rect.right, rect.bottom);
  }
});

document.addEventListener("keydown", async (e) => {
  // Double Shift detection for quick apply
  if (e.key === 'Shift') {
    const now = Date.now();
    if (now - lastShiftTime < DOUBLE_SHIFT_DELAY) {
      // Double Shift detected
      e.preventDefault();
      const target = document.activeElement;
      const isInputField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      if (isInputField) {
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
          console.log('[ClipLingua] Extension context invalidated, reloading page...');
          window.location.reload();
          return;
        }
        
        // Quick apply - check grammar and apply directly
        const textToCheck = target.isContentEditable 
          ? target.textContent.trim()
          : (target.value || '').trim();
        
        if (textToCheck) {
          try {
            const response = await chrome.runtime.sendMessage({
              type: MESSAGE_TYPES.CHECK_GRAMMAR,
              text: textToCheck
            });
            
            if (response && response.success && response.result) {
              if (target.isContentEditable) {
                const isLexical = isLexicalEditorElement(target);
                const isCk = isCKEditorElement(target);

                if (isLexical) {
                  await replaceLexicalEditorText(target, response.result);
                } else if (isCk) {
                  await replaceCKEditorText(target, response.result);
                } else {
                  target.textContent = response.result;
                  target.dispatchEvent(
                    new InputEvent('input', { bubbles: true, inputType: 'insertText' })
                  );
                }
              } else {
                target.value = response.result;
                
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                
                if (target.tagName === 'INPUT') {
                  nativeInputValueSetter.call(target, response.result);
                } else if (target.tagName === 'TEXTAREA') {
                  nativeTextAreaValueSetter.call(target, response.result);
                }
                
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          } catch (err) {
            console.error('[ClipLingua] Quick apply failed:', err);
          }
        }
      }
      lastShiftTime = 0;
      return;
    }
    lastShiftTime = now;
  }

  if (!customHotkey) return;

  const matches = 
    (customHotkey.ctrl === e.ctrlKey) &&
    (customHotkey.shift === e.shiftKey) &&
    (customHotkey.alt === e.altKey) &&
    (customHotkey.meta === e.metaKey) &&
    (customHotkey.key.toUpperCase() === e.key.toUpperCase());

  if (matches) {
    e.preventDefault();
    
    const target = e.target;
    const isInputField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    
    if (isInputField) {
      const textToProcess = target.isContentEditable 
        ? window.getSelection().toString().trim()
        : (target.value || '');
      
      activeInputField = target;
      
      console.log('[content] Input field detected - target:', target.tagName, 'isContentEditable:', target.isContentEditable, 'activeInputField:', activeInputField, 'textToProcess:', textToProcess);
      
      if (textToProcess) {
        pendingText = textToProcess;
        const rect = target.getBoundingClientRect();
        createFloatingPopup(rect.right, rect.bottom);
      }
    } else {
      activeInputField = null;
      pendingText = null;
      const selectedText = window.getSelection().toString().trim();
      
      console.log('[content] Regular selection - selectedText:', selectedText);
      
      if (selectedText) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        createFloatingPopup(rect.right, rect.bottom);
      }
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

function isLexicalEditorElement(el) {
  return (
    el.closest('[data-lexical-editor="true"]') ||
    el.hasAttribute('data-lexical-editor')
  );
}

function isCKEditorElement(el) {
  if (!el) return false;
  const hasTeamsTid = el.getAttribute('data-tid') === 'ckeditor';
  const hasCKEditorClasses = el.classList.contains('ck') &&
    el.classList.contains('ck-content') &&
    el.classList.contains('ck-editor__editable');
  return hasTeamsTid || hasCKEditorClasses;
}

async function replaceLexicalEditorText(editableEl, newText) {
  editableEl.focus();

  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const selectAllEventInit = {
    bubbles: true,
    cancelable: true,
    key: 'a',
    code: 'KeyA',
    [isMac ? 'metaKey' : 'ctrlKey']: true,
  };

  // Let Lexical handle "Select All"
  editableEl.dispatchEvent(new KeyboardEvent('keydown', selectAllEventInit));
  editableEl.dispatchEvent(new KeyboardEvent('keyup', selectAllEventInit));

  // Give Lexical a tick to update its selection
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Let Lexical handle delete of current selection
  const backspaceInit = {
    bubbles: true,
    cancelable: true,
    key: 'Backspace',
    code: 'Backspace',
  };
  editableEl.dispatchEvent(new KeyboardEvent('keydown', backspaceInit));
  editableEl.dispatchEvent(new KeyboardEvent('keyup', backspaceInit));

  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Insert replacement text - ONLY use beforeinput, not input
  const beforeInput = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: newText,
  });
  editableEl.dispatchEvent(beforeInput);
  
  // Do NOT dispatch a second 'input' event - Lexical will insert twice!
}

async function replaceCKEditorText(rootElement, newText) {
  // 1. Find the actual editable element CKEditor uses
  const editable =
    rootElement.matches('[contenteditable="true"]')
      ? rootElement
      : rootElement.querySelector('[contenteditable="true"]');

  if (!editable) {
    console.warn('[ClipLingua] CKEditor editable element not found');
    return;
  }

  // 2. Focus and select all content
  editable.focus();

  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editable);
  sel.removeAllRanges();
  sel.addRange(range);

  // 3. Try execCommand approach (may trigger trusted beforeinput/input)
  try {
    const oldText = editable.textContent.trim();
    
    // Clear content using execCommand so CKEditor sees it
    document.execCommand('delete', false, null);

    // Insert the new text via execCommand
    const success = document.execCommand('insertText', false, newText);
    
    console.log('[ClipLingua] execCommand insertText result:', success);

    // Trigger change events
    editable.dispatchEvent(new Event('input', { bubbles: true }));
    editable.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait a moment and verify text actually changed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentText = editable.textContent.trim();
    if (currentText === newText) {
      console.log('[ClipLingua] execCommand succeeded');
      return;
    }
    
    console.warn('[ClipLingua] execCommand returned true but text unchanged:', currentText);
  } catch (e) {
    console.warn('[ClipLingua] execCommand failed:', e);
  }

  // 4. Fallback: try page-context bridge
  console.log('[ClipLingua] Trying page-context bridge');
  const bridgeId = 'cliplingua-' + Date.now();
  editable.setAttribute('data-cliplingua-id', bridgeId);
  const selector = `[data-cliplingua-id="${bridgeId}"]`;
  
  try {
    const requestId = 'req-' + Date.now() + '-' + Math.random();
    
    // Wait for response from page context
    const result = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({ success: false, error: 'Timeout' });
      }, 2000);
      
      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('__cliplingua_set_ck_text_response', handler);
      };
      
      const handler = (event) => {
        if (event.detail.requestId === requestId) {
          cleanup();
          resolve(event.detail);
        }
      };
      
      window.addEventListener('__cliplingua_set_ck_text_response', handler);
      
      // Send request to page context
      window.dispatchEvent(new CustomEvent('__cliplingua_set_ck_text', {
        detail: { selector, text: newText, requestId }
      }));
    });
    
    editable.removeAttribute('data-cliplingua-id');
    
    if (result.success) {
      console.log('[ClipLingua] Bridge succeeded');
      return;
    } else {
      console.warn('[ClipLingua] Bridge failed:', result.error);
    }
  } catch (e) {
    console.error('[ClipLingua] Bridge error:', e);
    editable.removeAttribute('data-cliplingua-id');
  }

  console.warn('[ClipLingua] All CKEditor replacement methods failed');
}
