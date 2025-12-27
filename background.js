importScripts("storage.js", "utils.js", "messages.js", "groq-client.js");

let selectedText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  
  if (!isValidMessage(message)) {
    console.log('[Background] Invalid message');
    return false;
  }

  if (message.type === MESSAGE_TYPES.GET_SELECTION) {
    sendResponse({ text: selectedText });
    selectedText = "";
    return false;
  }

  if (message.type === MESSAGE_TYPES.OPEN_POPUP) {
    selectedText = message.payload.text;
    return false;
  }

  if (message.type === MESSAGE_TYPES.CHECK_GRAMMAR) {
    console.log('[Background] Handling CHECK_GRAMMAR');
    handleGrammarCheck(message.text, sendResponse);
    return true;
  }

  return false;
});

async function handleGrammarCheck(text, sendResponse) {
  console.log('[Background] handleGrammarCheck called with text:', text);
  try {
    const apiKey = await getSetting('groqApiKey');
    const selectedModel = await getSetting('selectedModel') || DEFAULT_MODEL;
    
    if (!apiKey) {
      console.log('[Background] No API key');
      sendResponse({ success: false, error: 'API key not configured' });
      return;
    }

    console.log('[Background] Calling Groq API...');
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{
          role: 'user',
          content: `Check and correct the grammar, spelling, and punctuation of the following text. Return ONLY the corrected text without any explanations or additional formatting:\n\n${text}`
        }],
        ...API_CONFIG
      })
    });

    if (response.status === 401 || response.status === 403) {
      sendResponse({ success: false, error: 'Invalid API key' });
      return;
    }

    if (response.status === 429) {
      sendResponse({ success: false, error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    if (!response.ok) {
      sendResponse({ success: false, error: `API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    console.log('[Background] API response received');
    
    if (data.choices && data.choices[0]) {
      const result = { 
        success: true, 
        result: data.choices[0].message.content.trim() 
      };
      console.log('[Background] Sending success response');
      sendResponse(result);
    } else if (data.error) {
      console.log('[Background] API error:', data.error);
      sendResponse({ success: false, error: data.error.message || 'API error' });
    } else {
      console.log('[Background] Invalid API response structure');
      sendResponse({ success: false, error: 'Invalid response' });
    }
  } catch (error) {
    console.error('[Background] Grammar check failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "translate-selection") {
    const tab = await getActiveTab();
    if (!tab) return;

    const result = await executeScriptInTab(tab.id, () => {
      return window.getSelection().toString().trim();
    });

    if (result && result.length > 0) {
      selectedText = result;
    } else {
      await showNotification(
        "ClipLingua",
        "Please select some text first"
      );
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
  
  chrome.contextMenus.create({
    id: 'cliplingua-translate',
    title: 'Translate with ClipLingua',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'cliplingua-translate' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'TRANSLATE_SELECTION',
      text: info.selectionText
    });
  }
});
