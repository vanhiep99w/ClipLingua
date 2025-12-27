# 🚀 Quick Start Guide - ClipLingua

## Prerequisites
- Google Chrome (or Chromium-based browser)
- Groq API key ([Get free key](https://console.groq.com/keys))

## Installation (5 minutes)

### Step 1: Load Extension
```bash
# Option A: Using Chrome UI
1. Open Chrome
2. Go to chrome://extensions/
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the ClipLingua folder
```

### Step 2: Configure API Key
```bash
1. Click the ClipLingua icon in Chrome toolbar
2. Click "Go to Settings"
3. Paste your Groq API key
4. Click "Save Settings"
```

### Step 3: Test It
```bash
1. Go to any webpage
2. Select some English text
3. Press Ctrl+Shift+T
4. Watch the magic happen! ✨
```

## Usage Examples

### English Grammar Correction + Translation
```
Input: "Hello wrold, how are yu today?"
Output: 
- ✅ Corrected: "Hello world, how are you today?"
- 🇻🇳 Vietnamese: "Xin chào thế giới, hôm nay bạn thế nào?"
```

### Vietnamese → English
```
Input: "Tôi đang học lập trình"
Output:
- 🇬🇧 English: "I am learning programming"
```

## Keyboard Shortcuts

**Default:** `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)

**Customize:**
1. Settings page → Keyboard Shortcut section
2. Click the hotkey input field
3. Press your desired key combination
4. Save

## Tips & Tricks

✅ **Auto-copy mode**: Enable in Settings → Preferences  
✅ **Dark theme**: Settings → Preferences → Theme  
✅ **Save history**: Keep track of last 10 translations  
✅ **Choose model**: Fast, Balanced, or Long Context  

## Troubleshooting

### Extension doesn't appear
- Refresh the extensions page
- Check for console errors (F12)
- Ensure all files are present

### Translation fails
- Verify API key is valid
- Check internet connection
- Ensure Groq API has credits

### Hotkey doesn't work
- Try the default Chrome shortcut at `chrome://extensions/shortcuts`
- Ensure no conflicts with other extensions

## File Structure
```
ClipLingua/
├── manifest.json       # Extension config
├── background.js       # Service worker
├── content.js         # Content script (hotkey)
├── popup.html/js      # Main UI
├── settings.html/js   # Settings page
├── groq-client.js     # API client
├── storage.js         # Settings storage
├── utils.js           # Helper functions
├── messages.js        # Message contracts
├── styles.css         # Styling
└── icons/            # Extension icons
```

## Development

### Debug Mode
```bash
# View background script logs
chrome://extensions/ → ClipLingua → Service worker → "Inspect views"

# View popup logs  
Right-click popup → Inspect

# View content script logs
F12 on any page → Console
```

### Update Code
After making changes:
1. Go to `chrome://extensions/`
2. Click refresh icon on ClipLingua card
3. Test your changes

## What's Next?

After installation, you can:
1. ✅ Test the extension with the [TESTING.md](TESTING.md) checklist
2. 🎨 Customize icons (see `icons/README.md`)
3. 🔧 Adjust settings to your preference
4. 📝 Report issues using `bd create`

## Support

- 📖 Full documentation: [README.md](README.md)
- 🧪 Testing guide: [TESTING.md](TESTING.md)  
- 🐛 Track issues: `bd ready` (beads issue tracker)

---

**Enjoy translating! 🌍✨**
