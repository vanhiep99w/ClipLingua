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

### Quick Apply (Double Shift)
1. Click into any input field or textarea
2. Type your text
3. Press **Shift twice** quickly (within 300ms)
4. Text is automatically grammar-checked and corrected in place

### Detailed Translation (Custom Hotkey)
1. Select any text on a webpage or in an input field
2. Press your configured hotkey (default: `Ctrl+Shift+T`)
3. A floating popup will show:
   - **English text**: Grammar correction + Vietnamese translation
   - **Vietnamese text**: English translation
4. Use the popup buttons to:
   - **Copy**: Copy translation to clipboard
   - **Apply**: Replace text in input field (if applicable)

## ⚙️ Features

- ✅ **Double Shift Quick Apply**: Instant grammar check in input fields
- ✅ Auto language detection (English/Vietnamese)
- ✅ Grammar & typo correction for English
- ✅ Natural, fluent translation using Groq AI
- ✅ Preserves UPPERCASE_CONSTANTS and acronyms (PSP, API, etc.)
- ✅ Improves awkward sentence structures
- ✅ Custom keyboard shortcuts
- ✅ Works with React, Vue, Lexical, and CKEditor inputs
- ✅ Floating popup with detailed results
- ✅ Copy to clipboard
- ✅ Apply directly to input fields

## 🛠️ Development

### File Structure
```
ClipLingua/
├── manifest.json         # Extension manifest
├── background.js         # Service worker
├── content.js           # Content script (double-shift, floating popup)
├── popup.html/js        # Extension popup
├── floating-popup.html/js # Floating translation popup
├── settings.html/js     # Settings page
├── storage.js           # Storage helpers
├── utils.js             # Utility functions
├── groq-client.js       # Groq API client with optimized prompts
├── messages.js          # Message contracts
├── ckeditor-bridge.js   # CKEditor integration
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

**Double Shift doesn't trigger:**
- Make sure you're focused in an input field
- Press Shift twice within 300ms
- Try reloading the extension if context is invalidated
