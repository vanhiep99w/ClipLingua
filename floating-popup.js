document.getElementById('close-btn').addEventListener('click', () => {
  window.close();
});

chrome.runtime.sendMessage({ type: 'GET_SELECTION' }, async (response) => {
  if (!response || !response.text) {
    showError('No text selected');
    return;
  }

  const text = response.text;
  document.getElementById('original-text').textContent = text;

  try {
    const apiKey = await getSetting('groqApiKey');
    if (!apiKey) {
      showError('API key not configured. Please go to Settings.');
      return;
    }

    const language = detectLanguage(text);
    if (!language) {
      showError('Could not detect language');
      return;
    }

    const result = await translateAndCorrect(text, language);
    displayResult(result);
  } catch (error) {
    showError(error.message || 'Translation failed');
  }
});

function displayResult(result) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('result').classList.add('show');

  if (result.language === 'en') {
    document.getElementById('corrected-section').style.display = 'block';
    document.getElementById('corrected-text').textContent = result.corrected;
    document.getElementById('translated-title').textContent = '🇻🇳 Vietnamese';
    document.getElementById('translated-text').textContent = result.translated;
  } else {
    document.getElementById('corrected-section').style.display = 'none';
    document.getElementById('translated-title').textContent = '🇬🇧 English';
    document.getElementById('translated-text').textContent = result.translated;
  }
}

function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').textContent = message;
  document.getElementById('error').style.display = 'block';
}

document.getElementById('copy-corrected').addEventListener('click', async () => {
  const text = document.getElementById('corrected-text').textContent;
  await navigator.clipboard.writeText(text);
  document.getElementById('copy-corrected').textContent = 'Copied ✓';
  setTimeout(() => {
    document.getElementById('copy-corrected').textContent = 'Copy';
  }, 2000);
});

document.getElementById('copy-translated').addEventListener('click', async () => {
  const text = document.getElementById('translated-text').textContent;
  await navigator.clipboard.writeText(text);
  document.getElementById('copy-translated').textContent = 'Copied ✓';
  setTimeout(() => {
    document.getElementById('copy-translated').textContent = 'Copy';
  }, 2000);
});

async function getSetting(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

function detectLanguage(text) {
  if (!text || text.trim().length === 0) return null;
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnameseChars.test(text) ? "vi" : "en";
}

async function translateAndCorrect(text, language) {
  const apiKey = await getSetting('groqApiKey');
  const selectedModel = await getSetting('selectedModel') || 'llama-3.3-70b-versatile';

  let systemPrompt, userPrompt;

  if (language === 'en') {
    systemPrompt = 'You are a helpful assistant that fixes English grammar and typos, then translates to natural Vietnamese.';
    userPrompt = `Fix any grammar errors and typos in this English text, then translate it to natural Vietnamese. Return ONLY a JSON object with this exact format: {"corrected": "corrected English text", "translated": "Vietnamese translation"}`;
  } else {
    systemPrompt = 'You are a helpful assistant that translates Vietnamese to natural English.';
    userPrompt = `Translate this Vietnamese text to natural, fluent English. Return ONLY a JSON object with this exact format: {"translated": "English translation"}`;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userPrompt}\n\nText: ${text}` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from API');

  const result = JSON.parse(content);

  if (language === 'en') {
    return {
      language: 'en',
      original: text,
      corrected: result.corrected,
      translated: result.translated
    };
  } else {
    return {
      language: 'vi',
      original: text,
      translated: result.translated
    };
  }
}
