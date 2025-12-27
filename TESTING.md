# ClipLingua - Testing Guide

## Manual Test Plan

### 1. Installation & Setup
- [ ] Load unpacked extension in Chrome
- [ ] Extension icon appears in toolbar
- [ ] Click icon → Shows "Welcome" screen (no API key)
- [ ] Click "Go to Settings" → Opens settings page
- [ ] Enter API key → Save → Success message appears
- [ ] Refresh settings page → API key persisted

### 2. Basic Translation (English → Vietnamese)
- [ ] Select English text: "Hello world"
- [ ] Press Ctrl+Shift+T
- [ ] Popup opens and shows loading state
- [ ] Results appear: Corrected English + Vietnamese translation
- [ ] Click "Copy" on corrected → Text copied to clipboard
- [ ] Click "Copy" on Vietnamese → Text copied to clipboard

### 3. Grammar Correction
- [ ] Select text with errors: "Hello wrold, how are yu?"
- [ ] Press Ctrl+Shift+T
- [ ] Corrected shows: "Hello world, how are you?"
- [ ] Vietnamese translation appears

### 4. Vietnamese → English Translation
- [ ] Select Vietnamese text: "Xin chào, tôi đang học lập trình"
- [ ] Press Ctrl+Shift+T
- [ ] Only English translation appears (no correction section)
- [ ] Translation is natural and accurate

### 5. Language Detection
- [ ] Test with mixed content
- [ ] Vietnamese chars (à,á,ă,â,đ,etc) → Detected as Vietnamese
- [ ] Pure ASCII English → Detected as English

### 6. Settings Configuration
- [ ] Change model selection → Save → Reopen settings → Persisted
- [ ] Toggle preferences (auto-copy, notifications, etc) → Persists
- [ ] Change theme to dark → UI updates to dark mode
- [ ] Keyboard shortcut capture works
- [ ] Reset to defaults works

### 7. Error Handling
- [ ] Invalid API key → Error message shown
- [ ] Network disconnected → Network error shown
- [ ] Empty selection → Notification shown
- [ ] Retry button works after error

### 8. First-Run Experience
- [ ] Fresh install → "Welcome" screen shown
- [ ] No API key → Cannot translate
- [ ] After entering key → Normal flow works

### 9. Edge Cases
- [ ] Very long text (>1000 chars) → Handles gracefully
- [ ] Single word → Works
- [ ] Numbers only → Handles gracefully
- [ ] Special characters → Preserved in translation
- [ ] Whitespace-only → Shows error

### 10. History & Stats (if enabled)
- [ ] Enable "Save history" in settings
- [ ] Do 3 translations
- [ ] Check chrome.storage → History entries present
- [ ] Stats updated (count, chars processed)

## Chrome Extension Specific Tests

### Permissions
- [ ] Storage permission works
- [ ] Active tab permission works
- [ ] Clipboard permission works
- [ ] Notifications permission works

### Background Script
- [ ] Service worker stays alive during translation
- [ ] Commands listener registered
- [ ] Message passing works (content ↔ background ↔ popup)

### Content Script
- [ ] Injected on all pages
- [ ] Custom hotkey listener works
- [ ] Doesn't interfere with page functionality

## Performance Tests
- [ ] Popup opens quickly (<100ms)
- [ ] Translation completes in <3s for short text
- [ ] No memory leaks (check DevTools)
- [ ] Extension size <100KB

## Browser Compatibility
- [ ] Works on Chrome
- [ ] Works on Edge (Chromium)
- [ ] Works on Brave

## Issues Found
Document any bugs discovered during testing here:

1. 
2. 
3. 

## Test Completed By
- Name:
- Date:
- Chrome Version:
