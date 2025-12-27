# ClipLingua - Chrome Extension

Auto-detect language and translate between English/Vietnamese with grammar correction using Groq AI.

## 🚀 Installation

### 1. Get Groq API Key
Visit [Groq Console](https://console.groq.com/keys) and create a free API key.

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `ClipLingua` directory
5. The extension icon should appear in your toolbar

### 3. Configure Settings

1. Click the ClipLingua icon and select **Settings**
2. Enter your Groq API key
3. Configure your keyboard shortcut (default: `Ctrl+Shift+T`)
4. Adjust preferences as needed
5. Click **Save Settings**

## 📖 Usage

1. Select any text on a webpage
2. Press your configured hotkey (default: `Ctrl+Shift+T`)
3. The popup will show:
   - **English text**: Grammar correction + Vietnamese translation
   - **Vietnamese text**: English translation
4. Click the **Copy** button to copy results to clipboard

## ⚙️ Features

- ✅ Auto language detection (English/Vietnamese)
- ✅ Grammar & typo correction for English
- ✅ Natural translation using Groq AI
- ✅ Custom keyboard shortcuts
- ✅ Translation history (optional)
- ✅ Light/Dark theme support
- ✅ Copy to clipboard

## 🛠️ Development

### File Structure
```
ClipLingua/
├── manifest.json         # Extension manifest
├── background.js         # Service worker
├── content.js           # Content script
├── popup.html/js        # Popup UI
├── settings.html/js     # Settings page
├── storage.js           # Storage helpers
├── utils.js             # Utility functions
├── groq-client.js       # Groq API client
├── messages.js          # Message contracts
└── styles.css           # Shared styles
```

### Issue Tracking
This project uses `bd` (beads) for issue tracking. See `.beads/` directory.

## 🔒 Security

- API keys are stored in `chrome.storage.sync` (encrypted by Chrome)
- Never committed to version control
- Only sent to Groq API endpoints

## 📝 License

MIT License

## 🐛 Troubleshooting

**Extension doesn't load:**
- Check Chrome Developer Tools console for errors
- Ensure all files are present
- Create placeholder icons if missing (see `icons/README.md`)

**Translation fails:**
- Verify API key is valid
- Check network connection
- Ensure you have Groq API credits

**Hotkey doesn't work:**
- Configure it in Settings
- Or use `chrome://extensions/shortcuts` to set Chrome's built-in shortcut
