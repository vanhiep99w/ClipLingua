async function sendMessageToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

async function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      resolve(response);
    });
  });
}

async function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

async function executeScriptInTab(tabId, func) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func
      },
      (results) => {
        resolve(results?.[0]?.result);
      }
    );
  });
}

async function openTab(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url }, (tab) => {
      resolve(tab);
    });
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}

async function showNotification(title, message, options = {}) {
  return new Promise((resolve) => {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title,
        message,
        ...options
      },
      (notificationId) => {
        resolve(notificationId);
      }
    );
  });
}

function detectLanguage(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  
  return vietnameseChars.test(text) ? "vi" : "en";
}
