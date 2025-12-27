# 🔧 Hướng Dẫn Sử Dụng ClipLingua (Tiếng Việt)

## Cài Đặt Nhanh (5 phút)

### Bước 1: Lấy API Key từ Groq (Miễn phí)
1. Truy cập: https://console.groq.com/keys
2. Đăng ký/Đăng nhập
3. Tạo API key mới
4. Copy API key

### Bước 2: Load Extension vào Chrome
```
1. Mở Chrome
2. Vào: chrome://extensions/
3. Bật "Developer mode" (góc trên bên phải)
4. Nhấn "Load unpacked"
5. Chọn thư mục ClipLingua
```

### Bước 3: Cấu Hình
```
1. Nhấn vào icon ClipLingua trên thanh toolbar Chrome
2. Nhấn "Go to Settings"
3. Dán API key vào
4. Nhấn "Save Settings"
```

### Bước 4: Test Thử
```
1. Vào bất kỳ trang web nào (VD: Wikipedia)
2. Bôi đen 1 đoạn text tiếng Anh
3. Nhấn Ctrl+Shift+A
4. Popup sẽ hiện lên với kết quả!
```

## ⚠️ Lưu Ý Quan Trọng

### Sau khi cài đặt, bạn PHẢI:
1. **Reload extension**: 
   - Vào `chrome://extensions/`
   - Nhấn nút reload (⟳) ở card ClipLingua
   
2. **Reload trang web**:
   - Nhấn F5 ở trang web bạn muốn dùng
   - Content script cần được inject lại

### Nếu Ctrl+Shift+A không hoạt động:
1. Kiểm tra trang web đã reload chưa
2. Thử click icon ClipLingua → popup mở được không?
3. Xem console log (F12) có lỗi gì không

## Cách Sử Dụng

### Sửa Lỗi Tiếng Anh + Dịch sang Tiếng Việt
```
1. Bôi đen: "Hello wrold, how are yu?"
2. Nhấn: Ctrl+Shift+A
3. Nhận:
   ✅ Sửa lỗi: "Hello world, how are you?"
   🇻🇳 Tiếng Việt: "Xin chào thế giới, bạn khỏe không?"
```

### Dịch Tiếng Việt sang Tiếng Anh
```
1. Bôi đen: "Tôi đang học lập trình"
2. Nhấn: Ctrl+Shift+A
3. Nhận:
   🇬🇧 English: "I am learning programming"
```

## Tính Năng

- 🔥 **Tự động nhận diện** ngôn ngữ
- ⚡ **Dịch nhanh** với Groq AI
- 📋 **Copy** nhanh vào clipboard
- ⌨️ **Phím tắt** tùy chỉnh
- 🎨 **Dark mode**
- 📝 **Lịch sử** 10 lần dịch gần nhất

## Phím Tắt

**Mặc định:** `Ctrl+Shift+A` (Windows/Linux) hoặc `Cmd+Shift+A` (Mac)

**Thay đổi:**
- Settings → Keyboard Shortcut
- Nhấn vào ô input và nhấn tổ hợp phím mong muốn
- Save

**Hoặc dùng Chrome shortcuts:**
- Vào: `chrome://extensions/shortcuts`
- Tìm ClipLingua
- Đặt phím tắt tại đó

## Debug Nếu Lỗi

### Extension không hiện
- Kiểm tra `chrome://extensions/` có ClipLingua chưa
- Nhấn reload extension

### Dịch không được
- Check API key đúng chưa (Settings)
- Kiểm tra internet
- Xem Groq API còn credits không

### Nhấn Ctrl+Shift+A không có gì xảy ra
```bash
# Debug steps:
1. F12 (mở DevTools)
2. Tab Console
3. Nhấn Ctrl+Shift+A
4. Xem có lỗi gì xuất hiện không

# Common issues:
- Extension chưa reload
- Trang web chưa reload (F5)
- Content script chưa inject
```

### Xem Background Script Logs
```
1. chrome://extensions/
2. Tìm ClipLingua
3. Nhấn "service worker" (inspect views)
4. Xem console logs
```

## Test Extension

### Test 1: Click Icon
```
1. Click icon ClipLingua trên toolbar
2. Popup có mở không?
3. Hiện "Welcome" hoặc "No API key" → OK
```

### Test 2: Keyboard Shortcut
```
1. Vào bất kỳ trang web
2. Bôi đen text: "Hello world"
3. Nhấn Ctrl+Shift+A
4. Popup mở và dịch → OK
```

### Test 3: Settings
```
1. Click icon → Settings
2. Nhập API key
3. Save
4. Reload settings page
5. API key vẫn còn → OK
```

## Tips

💡 **Bật auto-copy**: Settings → Auto-copy translation result  
💡 **Dark theme**: Settings → Theme → Dark  
💡 **Đổi model**: Settings → Model (Fast/Balanced/Long)  

## Lỗi Thường Gặp

**"Please select some text first"**
- Bạn chưa bôi đen text
- Hoặc bôi đen ở nơi không cho phép (VD: PDF embed)

**"Invalid API key"**
- API key sai hoặc hết hạn
- Vào Groq console tạo key mới

**Popup không mở**
- Extension chưa reload
- Trang web chưa reload
- Thử click icon thay vì dùng hotkey

---

**Chúc bạn dùng vui! 🚀**

Nếu có lỗi, check console (F12) và báo lại nhé!
