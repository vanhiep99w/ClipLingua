importScripts("storage.js", "utils.js", "messages.js");

let selectedText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isValidMessage(message)) {
    return false;
  }

  if (message.type === MESSAGE_TYPES.GET_SELECTION) {
    sendResponse({ text: selectedText });
    selectedText = "";
    return false;
  }

  return false;
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "translate-selection") {
    const tab = await getActiveTab();
    if (!tab) return;

    const result = await executeScriptInTab(tab.id, () => {
      return window.getSelection().toString().trim();
    });

    if (result && result.length > 0) {
      selectedText = result;
      chrome.action.openPopup();
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
});
