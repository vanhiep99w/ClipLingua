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
let inlineApplyButton = null;
let currentObservedInput = null;
let inputHandlers = new WeakMap();

const inlineButtonCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap');

.cliplingua-inline-button-group {
  position: fixed !important;
  display: flex !important;
  gap: 4px !important;
  z-index: 2147483646 !important;
  opacity: 0 !important;
  transform: translate(-100%, calc(-50% - 2px)) !important;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  pointer-events: none !important;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15)) !important;
  background: white !important;
  padding: 3px !important;
  border-radius: 8px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  will-change: transform, opacity !important;
  visibility: hidden !important;
}

.cliplingua-inline-button-group.visible {
  opacity: 1 !important;
  transform: translate(-100%, calc(-50% - 2px)) !important;
  pointer-events: auto !important;
  visibility: visible !important;
}

.cliplingua-inline-btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  height: 22px !important;
  width: 22px !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 5px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
  margin: 0 !important;
  position: relative !important;
  overflow: hidden !important;
}

.cliplingua-inline-btn::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0)) !important;
  opacity: 0 !important;
  transition: opacity 0.15s !important;
}

.cliplingua-inline-btn:hover::before {
  opacity: 1 !important;
}

.cliplingua-inline-btn-apply {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%) !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
}

.cliplingua-inline-btn-apply:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
  background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%) !important;
}

.cliplingua-inline-btn-apply:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
}

.cliplingua-inline-btn-detail {
  background: #fff !important;
  color: #0891b2 !important;
  border: 1.5px solid #0891b2 !important;
  box-shadow: 0 1px 3px rgba(8, 145, 178, 0.1) !important;
}

.cliplingua-inline-btn-detail:hover {
  background: #ecfeff !important;
  color: #0e7490 !important;
  border-color: #06b6d4 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 10px rgba(6, 182, 212, 0.2) !important;
}

.cliplingua-inline-btn-detail:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
}

.cliplingua-inline-btn:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.cliplingua-inline-btn-icon {
  font-size: 11px !important;
  line-height: 1 !important;
}
`;

if (!document.getElementById('cliplingua-inline-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'cliplingua-inline-styles';
  styleEl.textContent = inlineButtonCSS;
  document.head.appendChild(styleEl);
}

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

function removeInlineButton() {
  if (inlineApplyButton && inlineApplyButton.parentNode) {
    inlineApplyButton.remove();
  }
  inlineApplyButton = null;
}

function isLexicalEditorElement(el) {
  return (
    el.closest('[data-lexical-editor="true"]') ||
    el.hasAttribute('data-lexical-editor')
  );
}

function isCKEditorElement(el) {
  // Teams: data-tid + CKEditor classes
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

function positionInlineButton(inputElement) {
  if (!inlineApplyButton) return;
  
  requestAnimationFrame(() => {
    const rect = inputElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const SAFE_MARGIN = 16;
    
    let anchorX = rect.right;
    let anchorY = rect.top + rect.height / 2;
    
    anchorX = Math.min(Math.max(anchorX, SAFE_MARGIN), viewportWidth - SAFE_MARGIN);
    anchorY = Math.min(Math.max(anchorY, SAFE_MARGIN), viewportHeight - SAFE_MARGIN);
    
    inlineApplyButton.style.left = `${anchorX}px`;
    inlineApplyButton.style.top = `${anchorY}px`;
  });
}

function showInlineButton(inputElement) {
  if (!inlineApplyButton) {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'cliplingua-inline-button-group';
    
    const applyBtn = document.createElement('button');
    applyBtn.className = 'cliplingua-inline-btn cliplingua-inline-btn-apply';
    applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">✓</span>';
    applyBtn.title = 'Check and apply correction';
    
    const detailBtn = document.createElement('button');
    detailBtn.className = 'cliplingua-inline-btn cliplingua-inline-btn-detail';
    detailBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">⋯</span>';
    detailBtn.title = 'Show detailed translation';
    
    buttonGroup.appendChild(applyBtn);
    buttonGroup.appendChild(detailBtn);
    
    document.body.appendChild(buttonGroup);
    inlineApplyButton = buttonGroup;
    
    applyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[ClipLingua] Apply button clicked');
      
      const textToCheck = inputElement.isContentEditable 
        ? inputElement.textContent.trim()
        : (inputElement.value || '').trim();
      
      console.log('[ClipLingua] Text to check:', textToCheck);
      
      if (!textToCheck) {
        console.log('[ClipLingua] No text to check');
        return;
      }
      
      if (!inlineApplyButton) return;
      applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">⏳</span>';
      applyBtn.disabled = true;
      detailBtn.disabled = true;
      
      try {
        console.log('[ClipLingua] Sending CHECK_GRAMMAR message');
        const response = await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.CHECK_GRAMMAR,
          text: textToCheck
        });
        
        console.log('[ClipLingua] Response:', response);
        
        if (response && response.success && response.result) {
          console.log('[ClipLingua] Applying result to input:', response.result);
          console.log('[ClipLingua] Input element:', inputElement);
          console.log('[ClipLingua] Is contentEditable:', inputElement.isContentEditable);
          
          if (inputElement.isContentEditable) {
            console.log('[ClipLingua] ContentEditable detected');

            const isLexical = isLexicalEditorElement(inputElement);
            const isCk = isCKEditorElement(inputElement);

            try {
              if (isLexical) {
                console.log('[ClipLingua] Lexical editor detected, using Lexical-safe replacement');
                await replaceLexicalEditorText(inputElement, response.result);
              } else if (isCk) {
                console.log('[ClipLingua] CKEditor detected, using CKEditor-safe replacement');
                await replaceCKEditorText(inputElement, response.result);
              } else {
                console.log('[ClipLingua] Generic contentEditable, using simple replacement');
                inputElement.textContent = response.result;
                inputElement.dispatchEvent(
                  new InputEvent('input', { bubbles: true, inputType: 'insertText' })
                );
              }

              console.log('[ClipLingua] Text replacement complete');
            } catch (error) {
              console.error('[ClipLingua] Error during text replacement:', error);
            }
          } else {
            console.log('[ClipLingua] Setting value to:', response.result);
            inputElement.value = response.result;
            console.log('[ClipLingua] Value after set:', inputElement.value);
            
            // Trigger React/Vue onChange by setting native value setter
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            
            if (inputElement.tagName === 'INPUT') {
              nativeInputValueSetter.call(inputElement, response.result);
            } else if (inputElement.tagName === 'TEXTAREA') {
              nativeTextAreaValueSetter.call(inputElement, response.result);
            }
            
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (inlineApplyButton) {
            applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">✓</span>';
            setTimeout(() => {
              removeInlineButton();
            }, 800);
          }
        } else {
          console.error('[ClipLingua] Check failed:', response ? response.error : 'No response');
          applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">✗</span>';
          setTimeout(() => {
            if (inlineApplyButton) {
              applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">✓</span>';
              applyBtn.disabled = false;
              detailBtn.disabled = false;
            }
          }, 1500);
        }
      } catch (err) {
        console.error('[ClipLingua] Inline check failed:', err);
        if (inlineApplyButton) {
          applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">✗</span>';
          setTimeout(() => {
            if (inlineApplyButton) {
              applyBtn.innerHTML = '<span class="cliplingua-inline-btn-icon">✓</span>';
              applyBtn.disabled = false;
              detailBtn.disabled = false;
            }
          }, 1500);
        }
      }
    });
    
    detailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[ClipLingua] Detail button clicked');
      
      const textToTranslate = inputElement.isContentEditable 
        ? inputElement.textContent.trim()
        : (inputElement.value || '').trim();
      
      if (!textToTranslate) return;
      
      pendingText = textToTranslate;
      activeInputField = inputElement;
      
      const rect = inputElement.getBoundingClientRect();
      createFloatingPopup(rect.right, rect.bottom);
      
      removeInlineButton();
    });
  }
  
  positionInlineButton(inputElement);
  
  requestAnimationFrame(() => {
    if (inlineApplyButton) {
      inlineApplyButton.classList.add('visible');
    }
  });
}

function observeInputChanges(inputElement) {
  if (currentObservedInput === inputElement) return;
  
  // Remove old listeners properly using stored handlers
  const existingHandlers = inputHandlers.get(currentObservedInput);
  if (currentObservedInput && existingHandlers) {
    currentObservedInput.removeEventListener('input', existingHandlers.handleInputChange);
    currentObservedInput.removeEventListener('blur', existingHandlers.handleInputBlur);
  }
  
  const handleInputChange = () => {
    const text = inputElement.isContentEditable 
      ? inputElement.textContent.trim()
      : (inputElement.value || '').trim();
    
    if (text && text.length > 0) {
      showInlineButton(inputElement);
    } else {
      removeInlineButton();
    }
  };
  
  const handleInputBlur = () => {
    setTimeout(() => {
      if (!inlineApplyButton || !inlineApplyButton.matches(':hover')) {
        removeInlineButton();
        currentObservedInput = null;
      }
    }, 200);
  };
  
  // Store handlers for this element
  inputHandlers.set(inputElement, { handleInputChange, handleInputBlur });
  
  currentObservedInput = inputElement;
  inputElement.addEventListener('input', handleInputChange);
  inputElement.addEventListener('blur', handleInputBlur);
  
  const text = inputElement.isContentEditable 
    ? inputElement.textContent.trim()
    : (inputElement.value || '').trim();
  if (text && text.length > 0) {
    showInlineButton(inputElement);
  }
}

document.addEventListener('focusin', (e) => {
  const target = e.target;
  const isInputField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  
  if (isInputField) {
    observeInputChanges(target);
  }
});

let scrollTimeout;
window.addEventListener('scroll', () => {
  if (!inlineApplyButton || !currentObservedInput) return;
  
  // Throttle scroll updates to reduce jank
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
    if (inlineApplyButton && currentObservedInput) {
      positionInlineButton(currentObservedInput);
    }
  }, 16); // ~60fps
}, { passive: true });

let resizeTimeout;
window.addEventListener('resize', () => {
  if (!inlineApplyButton || !currentObservedInput) return;
  
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (inlineApplyButton && currentObservedInput) {
      positionInlineButton(currentObservedInput);
    }
  }, 100);
});
