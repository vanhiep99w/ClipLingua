// This script runs in the page context (not content script isolated world)
// It can access CKEditor globals that content scripts cannot see

(function() {
  'use strict';
  
  // Listen for messages from content script
  window.addEventListener('__cliplingua_set_ck_text', function(event) {
    const { selector, text, requestId } = event.detail;
    
    try {
      const root = document.querySelector(selector);
      if (!root) {
        console.warn('[ClipLingua Bridge] Element not found:', selector);
        window.dispatchEvent(new CustomEvent('__cliplingua_set_ck_text_response', {
          detail: { requestId, success: false, error: 'Element not found' }
        }));
        return;
      }

      let success = false;

      // Try CKEditor 4 API
      if (window.CKEDITOR && window.CKEDITOR.instances) {
        const instance = Object.values(window.CKEDITOR.instances).find(
          e => e.editable && e.editable.$ === root
        );
        if (instance) {
          console.log('[ClipLingua Bridge] Found CKEditor 4 instance');
          instance.setData(text);
          success = true;
        }
      }

      // Try CKEditor 5 API - search for editor instance
      if (!success && root.ckeditorInstance) {
        console.log('[ClipLingua Bridge] Found CKEditor instance on element');
        if (typeof root.ckeditorInstance.setData === 'function') {
          root.ckeditorInstance.setData(text);
          success = true;
        }
      }

      // Search window globals for CKEditor 5 instances
      if (!success) {
        for (const key in window) {
          try {
            const val = window[key];
            if (val && val.model && val.editing && typeof val.setData === 'function') {
              const editorRoot = val.editing && val.editing.view && 
                                val.editing.view.document && 
                                val.editing.view.document.getRoot();
              if (editorRoot) {
                console.log('[ClipLingua Bridge] Found CKEditor 5 instance in window.' + key);
                val.setData(text);
                success = true;
                break;
              }
            }
          } catch (e) {
            // Ignore cross-origin or blocked properties
          }
        }
      }

      // Fallback: Direct DOM manipulation
      if (!success) {
        console.log('[ClipLingua Bridge] No CKEditor instance found, trying DOM manipulation');
        root.innerHTML = '';
        const p = document.createElement('p');
        p.textContent = text;
        root.appendChild(p);
        
        root.dispatchEvent(new Event('input', { bubbles: true }));
        root.dispatchEvent(new Event('change', { bubbles: true }));
        root.focus();
        
        success = true;
      }

      // Send response back to content script
      window.dispatchEvent(new CustomEvent('__cliplingua_set_ck_text_response', {
        detail: { requestId, success, error: success ? null : 'Unknown error' }
      }));
      
    } catch (error) {
      console.error('[ClipLingua Bridge] Error:', error);
      window.dispatchEvent(new CustomEvent('__cliplingua_set_ck_text_response', {
        detail: { requestId, success: false, error: error.message }
      }));
    }
  });

  console.log('[ClipLingua Bridge] Installed');
})();
