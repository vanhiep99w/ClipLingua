let currentHotkey = STORAGE_DEFAULTS.customHotkey;
let isCapturingHotkey = false;

async function loadCurrentSettings() {
  const settings = await loadSettings();
  
  document.getElementById("api-key").value = settings.groqApiKey || "";
  document.getElementById("model-select").value = settings.selectedModel || DEFAULT_MODEL;
  
  currentHotkey = settings.customHotkey || STORAGE_DEFAULTS.customHotkey;
  updateHotkeyDisplay();
  updateHotkeyCheckboxes();
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
  
  const apiKeyError = document.getElementById("api-key-error");
  const hotkeyError = document.getElementById("hotkey-error");
  const apiKeyInput = document.getElementById("api-key");
  
  apiKeyError.classList.remove("visible");
  hotkeyError.classList.remove("visible");
  apiKeyInput.classList.remove("invalid");
  
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    apiKeyError.textContent = "API key is required";
    apiKeyError.classList.add("visible");
    apiKeyInput.classList.add("invalid");
    isValid = false;
  }
  
  if (!currentHotkey.key) {
    hotkeyError.textContent = "Please configure a hotkey";
    hotkeyError.classList.add("visible");
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
    customHotkey: currentHotkey
  };
  
  await saveSettings(settings);
  
  showStatus("Settings saved successfully!", "success");
}

function showStatus(message, type) {
  const statusEl = document.getElementById("save-status");
  statusEl.textContent = message;
  statusEl.className = `status ${type} visible`;
  
  setTimeout(() => {
    statusEl.classList.remove("visible");
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentSettings();
  
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
