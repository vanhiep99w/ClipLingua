const STORAGE_DEFAULTS = {
  groqApiKey: null,
  apiKeyLastValidated: null,
  selectedModel: "llama-3.3-70b-versatile",
  customHotkey: {
    ctrl: true,
    shift: true,
    alt: false,
    meta: false,
    key: "A"
  },
  preferences: {
    autoCopy: false,
    showNotification: true,
    keepPopupOpen: false,
    saveHistory: true,
    theme: "light"
  },
  stats: {
    translationCount: 0,
    lastUsed: null,
    totalCharactersProcessed: 0
  },
  history: []
};

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (items) => {
      const settings = { ...STORAGE_DEFAULTS, ...items };
      resolve(settings);
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

async function getSetting(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : STORAGE_DEFAULTS[key]);
    });
  });
}

async function updateSetting(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      resolve();
    });
  });
}

async function initializeStorage() {
  const currentSettings = await loadSettings();
  if (currentSettings.groqApiKey === null) {
    await saveSettings(STORAGE_DEFAULTS);
  }
}
