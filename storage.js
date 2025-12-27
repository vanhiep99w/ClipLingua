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
    // Load API key from local storage
    chrome.storage.local.get(['groqApiKey'], (localResult) => {
      // Load other settings from sync storage
      chrome.storage.sync.get(null, (syncResult) => {
        const settings = { ...STORAGE_DEFAULTS, ...syncResult, ...localResult };
        resolve(settings);
      });
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
    // Use local storage for API key, sync for everything else
    const storage = key === 'groqApiKey' ? chrome.storage.local : chrome.storage.sync;
    storage.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : STORAGE_DEFAULTS[key]);
    });
  });
}

async function updateSetting(key, value) {
  return new Promise((resolve) => {
    // Use local storage for API key, sync for everything else
    const storage = key === 'groqApiKey' ? chrome.storage.local : chrome.storage.sync;
    storage.set({ [key]: value }, () => {
      resolve();
    });
  });
}

async function initializeStorage() {
  // Migrate API key from sync to local storage (one-time migration)
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groqApiKey'], (syncResult) => {
      if (syncResult.groqApiKey) {
        // Found API key in sync storage, migrate to local
        chrome.storage.local.set({ groqApiKey: syncResult.groqApiKey }, () => {
          // Remove from sync storage after migration
          chrome.storage.sync.remove(['groqApiKey'], () => {
            console.log('[Storage] Migrated API key from sync to local storage');
            resolve();
          });
        });
      } else {
        // Check if we need to initialize defaults
        chrome.storage.local.get(['groqApiKey'], (localResult) => {
          if (localResult.groqApiKey === undefined) {
            chrome.storage.local.set({ groqApiKey: STORAGE_DEFAULTS.groqApiKey }, resolve);
          } else {
            resolve();
          }
        });
      }
    });
  });
}
