# 🔧 CÁCH TEST SAU KHI FIX

## Bước 1: Reload Extension
```
1. Mở: chrome://extensions/
2. Tìm ClipLingua
3. Click nút reload (⟳)
```

## Bước 2: Reload Trang Web
```
1. Vào bất kỳ trang web (VD: https://en.wikipedia.org)
2. Nhấn F5 để reload
```

## Bước 3: Test Click Icon Trước
```
1. Click icon ClipLingua trên toolbar
2. Popup có mở không? → Nếu mở được → OK
3. Nếu chưa có API key → Nhập API key vào Settings
```

## Bước 4: Test Phím Tắt
```
1. Vào Wikipedia hoặc trang web bất kỳ
2. Bôi đen 1 đoạn text: "Hello world"
3. Nhấn: Ctrl+Shift+A
4. Popup có mở và dịch không?
```

## Nếu Vẫn Lỗi:

### Debug Console
```bash
# Mở DevTools:
F12

# Xem tab Console
# Nhấn Ctrl+Shift+A và xem có lỗi gì

# Nếu thấy lỗi, chụp lại và báo
```

### Kiểm Tra Background Service Worker
```
1. chrome://extensions/
2. Tìm ClipLingua
3. Click "service worker" (bên dưới "Inspect views")
4. Xem console có lỗi gì không
```

## Những Gì Đã Fix:

✅ Bỏ `createMessage` và `MESSAGE_TYPES` khỏi content.js
✅ Gửi message trực tiếp dạng plain object
✅ Bỏ web_accessible_resources (không cần thiết)
✅ Đơn giản hóa content script

## Expected Behavior:

1. **Click icon** → Popup mở với "Welcome" hoặc form nhập text
2. **Bôi đen text + Ctrl+Shift+A** → Popup mở và auto-dịch

Thử lại và cho tôi biết kết quả nhé! 🚀
