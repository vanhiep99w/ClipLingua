let currentText = "";
let currentResult = null;

const states = {
  INITIAL: "initial-state",
  NO_API_KEY: "no-api-key-state",
  LOADING: "loading-state",
  RESULT: "result-state",
  ERROR: "error-state"
};

function showState(stateName) {
  Object.values(states).forEach(state => {
    document.getElementById(state).classList.add("hidden");
  });
  document.getElementById(stateName).classList.remove("hidden");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2000);
}

async function processText(text) {
  currentText = text;
  
  const apiKey = await getSetting("groqApiKey");
  if (!apiKey) {
    showState(states.NO_API_KEY);
    return;
  }

  showState(states.LOADING);
  document.getElementById("selected-text-display").textContent = text;

  try {
    const language = detectLanguage(text);
    if (!language) {
      throw new Error("Could not detect language");
    }

    const result = await translateAndCorrect(text, language);
    currentResult = result;
    displayResult(result);
    
    const prefs = await getSetting("preferences");
    if (prefs?.autoCopy) {
      const textToCopy = result.language === "en" ? result.translated : result.translated;
      await copyToClipboard(textToCopy);
      if (prefs?.showNotification) {
        showToast("Copied! ✅");
      }
    }

    await updateStats(text.length);
    if (prefs?.saveHistory) {
      await saveToHistory(result);
    }

  } catch (error) {
    showError(error);
  }
}

function displayResult(result) {
  showState(states.RESULT);
  
  document.getElementById("original-text-display").textContent = result.original;

  if (result.language === "en") {
    document.getElementById("corrected-section").classList.remove("hidden");
    document.getElementById("corrected-text").textContent = result.corrected;
    document.getElementById("translated-title").textContent = "🇻🇳 Vietnamese";
    document.getElementById("translated-text").textContent = result.translated;
  } else {
    document.getElementById("corrected-section").classList.add("hidden");
    document.getElementById("translated-title").textContent = "🇬🇧 English";
    document.getElementById("translated-text").textContent = result.translated;
  }
}

function showError(error) {
  showState(states.ERROR);
  
  let errorMessage = "Something went wrong";
  
  if (error.type === ERROR_TYPES.AUTH_ERROR) {
    errorMessage = "Invalid API key. Please check your settings.";
  } else if (error.type === ERROR_TYPES.NETWORK_ERROR) {
    errorMessage = "Network error. Please check your connection.";
  } else if (error.type === ERROR_TYPES.RATE_LIMIT) {
    errorMessage = "Rate limit exceeded. Please try again later.";
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  document.getElementById("error-message").textContent = errorMessage;
}

async function updateStats(charCount) {
  const stats = await getSetting("stats") || STORAGE_DEFAULTS.stats;
  stats.translationCount++;
  stats.lastUsed = Date.now();
  stats.totalCharactersProcessed += charCount;
  await updateSetting("stats", stats);
}

async function saveToHistory(result) {
  const history = await getSetting("history") || [];
  const entry = {
    id: `${Date.now()}-${Math.random()}`,
    ...result,
    timestamp: Date.now()
  };
  
  history.unshift(entry);
  if (history.length > 10) {
    history.pop();
  }
  
  await updateSetting("history", history);
}

document.addEventListener("DOMContentLoaded", async () => {
  const apiKey = await getSetting("groqApiKey");
  if (!apiKey) {
    showState(states.NO_API_KEY);
  } else {
    chrome.runtime.sendMessage(createMessage(MESSAGE_TYPES.GET_SELECTION), (response) => {
      if (response && response.text) {
        processText(response.text);
      } else {
        showState(states.INITIAL);
      }
    });
  }

  document.getElementById("settings-btn").addEventListener("click", () => {
    openTab("settings.html");
  });

  document.getElementById("go-to-settings-btn").addEventListener("click", () => {
    openTab("settings.html");
  });

  document.getElementById("copy-corrected-btn").addEventListener("click", async () => {
    if (currentResult?.corrected) {
      await copyToClipboard(currentResult.corrected);
      showToast("Copied! ✅");
    }
  });

  document.getElementById("copy-translated-btn").addEventListener("click", async () => {
    if (currentResult?.translated) {
      await copyToClipboard(currentResult.translated);
      showToast("Copied! ✅");
    }
  });

  document.getElementById("retry-btn").addEventListener("click", () => {
    if (currentText) {
      processText(currentText);
    }
  });

  document.getElementById("open-settings-btn").addEventListener("click", () => {
    openTab("settings.html");
  });

  const prefs = await getSetting("preferences") || STORAGE_DEFAULTS.preferences;
  const theme = prefs.theme || "light";
  document.body.classList.toggle("dark", theme === "dark");
});
