let currentHotkey = STORAGE_DEFAULTS.customHotkey;
let isCapturingHotkey = false;

async function loadCurrentSettings() {
  const settings = await loadSettings();
  
  document.getElementById("api-key").value = settings.groqApiKey || "";
  document.getElementById("model-select").value = settings.selectedModel || DEFAULT_MODEL;
  
  currentHotkey = settings.customHotkey || STORAGE_DEFAULTS.customHotkey;
  updateHotkeyDisplay();
  updateHotkeyCheckboxes();
  
  document.getElementById("auto-copy").checked = settings.preferences?.autoCopy || false;
  document.getElementById("show-notification").checked = settings.preferences?.showNotification !== false;
  document.getElementById("keep-popup-open").checked = settings.preferences?.keepPopupOpen || false;
  document.getElementById("save-history").checked = settings.preferences?.saveHistory !== false;
  document.getElementById("theme-select").value = settings.preferences?.theme || "light";
}

function updateHotkeyDisplay() {
  const parts = [];
  if (currentHotkey.ctrl) parts.push("Ctrl");
  if (currentHotkey.shift) parts.push("Shift");
  if (currentHotkey.alt) parts.push("Alt");
  if (currentHotkey.meta) parts.push("Meta");
  if (currentHotkey.key) parts.push(currentHotkey.key.toUpperCase());
  
  document.getElementById("current-hotkey").textContent = parts.join("+") || "None";
  document.getElementById("hotkey-input").value = parts.join("+") || "";
}

function updateHotkeyCheckboxes() {
  document.getElementById("hotkey-ctrl").checked = currentHotkey.ctrl;
  document.getElementById("hotkey-shift").checked = currentHotkey.shift;
  document.getElementById("hotkey-alt").checked = currentHotkey.alt;
  document.getElementById("hotkey-meta").checked = currentHotkey.meta;
}

function validateSettings() {
  let isValid = true;
  
  document.getElementById("api-key-error").classList.add("hidden");
  document.getElementById("hotkey-error").classList.add("hidden");
  
  const apiKey = document.getElementById("api-key").value.trim();
  if (!apiKey) {
    document.getElementById("api-key-error").textContent = "API key is required";
    document.getElementById("api-key-error").classList.remove("hidden");
    isValid = false;
  }
  
  if (!currentHotkey.key) {
    document.getElementById("hotkey-error").textContent = "Please configure a hotkey";
    document.getElementById("hotkey-error").classList.remove("hidden");
    isValid = false;
  }
  
  return isValid;
}

async function saveCurrentSettings() {
  if (!validateSettings()) {
    return;
  }
  
  const settings = {
    groqApiKey: document.getElementById("api-key").value.trim(),
    selectedModel: document.getElementById("model-select").value,
    customHotkey: currentHotkey,
    preferences: {
      autoCopy: document.getElementById("auto-copy").checked,
      showNotification: document.getElementById("show-notification").checked,
      keepPopupOpen: document.getElementById("keep-popup-open").checked,
      saveHistory: document.getElementById("save-history").checked,
      theme: document.getElementById("theme-select").value
    }
  };
  
  await saveSettings(settings);
  
  showStatus("Settings saved successfully! ✅", "success");
}

function showStatus(message, type) {
  const statusEl = document.getElementById("save-status");
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.classList.remove("hidden");
  
  setTimeout(() => {
    statusEl.classList.add("hidden");
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentSettings();
  
  const theme = await getSetting("preferences.theme") || "light";
  document.body.classList.toggle("dark", theme === "dark");
  
  document.getElementById("save-btn").addEventListener("click", saveCurrentSettings);
  
  document.getElementById("reset-btn").addEventListener("click", async () => {
    if (confirm("Reset all settings to defaults?")) {
      await saveSettings(STORAGE_DEFAULTS);
      await loadCurrentSettings();
      showStatus("Settings reset to defaults", "success");
    }
  });
  
  const hotkeyInput = document.getElementById("hotkey-input");
  hotkeyInput.addEventListener("focus", () => {
    isCapturingHotkey = true;
    hotkeyInput.value = "Press key combination...";
  });
  
  hotkeyInput.addEventListener("blur", () => {
    isCapturingHotkey = false;
    updateHotkeyDisplay();
  });
  
  hotkeyInput.addEventListener("keydown", (e) => {
    if (!isCapturingHotkey) return;
    
    e.preventDefault();
    
    if (e.key === "Escape") {
      hotkeyInput.blur();
      return;
    }
    
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
      return;
    }
    
    currentHotkey = {
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      key: e.key.toUpperCase()
    };
    
    updateHotkeyDisplay();
    updateHotkeyCheckboxes();
    hotkeyInput.blur();
  });
  
  ["ctrl", "shift", "alt", "meta"].forEach(modifier => {
    document.getElementById(`hotkey-${modifier}`).addEventListener("change", (e) => {
      currentHotkey[modifier] = e.target.checked;
      updateHotkeyDisplay();
    });
  });
});
