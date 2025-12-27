let selectedTextForPopup = null;
let isInputContext = false;

document.getElementById('close-btn').addEventListener('click', () => {
  window.parent.postMessage({ type: 'CLOSE_POPUP' }, '*');
});

window.addEventListener('message', async (event) => {
  // Security: Only accept messages from parent window (content script)
  if (event.source !== window.parent) {
    return;
  }
  
  if (event.data.type === 'SELECTION_DATA') {
    const text = event.data.text;
    selectedTextForPopup = text;
    isInputContext = event.data.isInputContext || false;
    console.log('[popup] Received SELECTION_DATA - text:', text, 'isInputContext:', isInputContext);

    if (!text) {
      showError('No text selected');
      return;
    }

    try {
      const apiKey = await getSetting('groqApiKey');
      if (!apiKey) {
        showError('API key not configured.\nGo to Settings to add your key.');
        return;
      }

      const result = await translateText(text, apiKey);
      displayResult(result);
    } catch (error) {
      showError(error.message || 'Translation failed');
    }
  }
});

window.parent.postMessage({ type: 'POPUP_READY' }, '*');

function displayResult(result) {
  console.log('[popup] displayResult called with:', result);
  console.log('[popup] isInputContext:', isInputContext);
  
  document.getElementById('loading').style.display = 'none';
  document.getElementById('result').classList.add('show');

  const applyBtn = document.getElementById('apply-corrected');
  const correctedSection = document.getElementById('corrected-section');

  if (result.language === 'en') {
    console.log('[popup] English detected, showing corrected section');
    correctedSection.style.display = 'block';
    document.getElementById('corrected-text').textContent = result.corrected;
    document.getElementById('translated-title').innerHTML = '🌏 Vietnamese';
    document.getElementById('translated-text').textContent = result.translated;
    
    if (isInputContext && applyBtn) {
      console.log('[popup] Showing Apply button');
      applyBtn.style.display = 'block';
      correctedSection.classList.add('has-apply-btn');
    } else {
      console.log('[popup] Hiding Apply button - isInputContext:', isInputContext);
      correctedSection.classList.remove('has-apply-btn');
    }
  } else {
    console.log('[popup] Vietnamese detected, hiding corrected section');
    correctedSection.style.display = 'none';
    document.getElementById('translated-title').innerHTML = '🌍 English';
    document.getElementById('translated-text').textContent = result.translated;
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      const header = document.querySelector('.header');
      const result = document.getElementById('result');
      const cards = result ? result.querySelectorAll('.card') : [];
      
      let contentHeight = 0;
      cards.forEach((card, index) => {
        const isVisible = card.style.display !== 'none';
        const cardHeight = card.offsetHeight;
        const cardStyle = window.getComputedStyle(card);
        const marginTop = parseFloat(cardStyle.marginTop);
        const marginBottom = parseFloat(cardStyle.marginBottom);
        
        console.log(`[popup] Card ${index} (${card.id}): visible=${isVisible}, height=${cardHeight}, margins=${marginTop}+${marginBottom}`);
        
        if (isVisible) {
          contentHeight += cardHeight + marginTop + marginBottom;
        }
      });
      
      const headerHeight = header ? header.offsetHeight : 0;
      const totalHeight = headerHeight + contentHeight;
      
      console.log('[popup] Final - header:', headerHeight, 'contentHeight:', contentHeight, 'total:', totalHeight);
      
      window.parent.postMessage({ 
        type: 'SET_HEIGHT', 
        height: totalHeight
      }, '*');
    }, 100);
  });
}

function showError(message) {
  document.getElementById('loading').style.display = 'none';
  const errorEl = document.getElementById('error');
  errorEl.querySelector('.error-text').textContent = message;
  errorEl.style.display = 'block';
  
  // Set height so popup becomes visible
  setTimeout(() => {
    const totalHeight = document.body.scrollHeight;
    window.parent.postMessage({ 
      type: 'SET_HEIGHT', 
      height: totalHeight
    }, '*');
  }, 50);
}

function copyToClipboard(btn, text) {
  window.parent.postMessage({ 
    type: 'COPY_TEXT', 
    text: text 
  }, '*');
  
  btn.classList.add('copied');
  setTimeout(() => {
    btn.classList.remove('copied');
  }, 1500);
}

document.getElementById('copy-corrected').addEventListener('click', function() {
  const text = document.getElementById('corrected-text').textContent;
  copyToClipboard(this, text);
});

document.getElementById('copy-translated').addEventListener('click', function() {
  const text = document.getElementById('translated-text').textContent;
  copyToClipboard(this, text);
});

document.getElementById('apply-corrected').addEventListener('click', function() {
  const text = document.getElementById('corrected-text').textContent;
  window.parent.postMessage({ 
    type: 'APPLY_TO_INPUT', 
    text: text 
  }, '*');
  
  this.classList.add('applied');
  this.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  
  setTimeout(() => {
    this.classList.remove('applied');
    this.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z"/></svg>';
  }, 1500);
});

async function getSetting(key) {
  return new Promise((resolve) => {
    // Use local storage for API key, sync for everything else
    const storage = key === 'groqApiKey' ? chrome.storage.local : chrome.storage.sync;
    storage.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

async function translateText(text, apiKey) {
  const selectedModel = await getSetting('selectedModel') || DEFAULT_MODEL;
  
  const systemPrompt = `You are a smart translation assistant.
- If text is Vietnamese, translate to English
- If text is English, fix grammar/typos and translate to Vietnamese  
- If text is another language, translate to Vietnamese
Return ONLY a JSON object with this format:
- For English input: {"language": "en", "corrected": "corrected text", "translated": "Vietnamese translation"}
- For Vietnamese/other input: {"language": "vi", "translated": "English translation"}`;

  const response = await fetch(GROQ_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Process this text:\n\n${text}` }
      ],
      ...API_CONFIG
    })
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Invalid API key');
  }

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from API');

  const result = JSON.parse(content);
  console.log('[translateText] AI response:', result);
  
  return {
    language: result.language || 'vi',
    original: text,
    corrected: result.corrected,
    translated: result.translated
  };
}
