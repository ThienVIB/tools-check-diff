# 🔧 Hướng dẫn Fix vấn đề CORS với URL nội bộ

## Vấn đề
URL nội bộ công ty (VD: `https://pws-dev.vib/`) không fetch được do:
- CORS policy chặn request từ localhost
- URL chỉ truy cập được trong mạng nội bộ công ty

## Giải pháp đã implement

### 1. **setupProxy.js** - Local Proxy Server
File `/src/setupProxy.js` tạo proxy server chạy cùng với React dev server để bypass CORS.

### 2. **App.tsx** - Smart Fetch với 3 fallback levels
Code sẽ tự động thử 3 cách fetch theo thứ tự:

1. **Direct Fetch** (ưu tiên nhất)
   - Fetch trực tiếp URL
   - Hoạt động nếu URL cho phép CORS hoặc cùng origin
   
2. **Local Proxy** (nếu direct fail)
   - Fetch qua `/api/fetch?url=...`
   - Proxy server sẽ fetch thay và trả về kết quả
   - **Giải pháp tốt nhất cho URL nội bộ**
   
3. **Public CORS Proxy** (nếu cả 2 cách trên fail)
   - Dùng `https://api.allorigins.win`
   - Cho URL public (google.com, etc.)

## Cách sử dụng

### Bước 1: Start server
```bash
npm start
```

### Bước 2: Test với URL nội bộ
Ví dụ:
- **Dev URL**: `https://pws-dev.vib/`
- **Prod URL**: `https://pws.vib.com.vn/`

### Bước 3: Xem console log
Mở DevTools (F12) → Console để xem:
- Fetch method nào được dùng
- Lỗi gì nếu có

## Lưu ý quan trọng

### ⚠️ Đảm bảo có kết nối mạng nội bộ
- URL dev chỉ truy cập được khi máy bạn kết nối VPN/mạng công ty
- Nếu không kết nối được, cả 3 method đều sẽ fail

### 🔐 HTTPS với Self-Signed Certificate
Nếu URL dev dùng HTTPS với certificate tự ký:
- Browser có thể block request
- **Giải pháp**: Truy cập URL dev trong tab mới trước → Accept certificate → Reload tool

### 🚀 Production Build
Khi build production, proxy không hoạt động. Cần:
1. Setup proxy trên production server (nginx, apache)
2. Hoặc config CORS header trên dev/prod server

## Troubleshooting

### Lỗi: "Failed to fetch"
✅ **Check**:
1. URL có đúng không? (có http:// hoặc https://)
2. Bạn có kết nối mạng nội bộ không?
3. Thử truy cập URL trong browser trước

### Lỗi: "Proxy Error"
✅ **Check**:
1. Dev server có đang chạy không? (`npm start`)
2. setupProxy.js có bị lỗi syntax không?
3. Xem console log để biết chi tiết

### Lỗi: "Cannot find module 'http-proxy-middleware'"
✅ **Fix**:
```bash
npm install
```

## Testing

### Test Direct Fetch
Mở Console và chạy:
```javascript
fetch('https://pws-dev.vib/')
  .then(r => r.text())
  .then(html => console.log('Direct fetch OK:', html.length))
```

### Test Local Proxy
```javascript
fetch('/api/fetch?url=' + encodeURIComponent('https://pws-dev.vib/'))
  .then(r => r.text())
  .then(html => console.log('Proxy fetch OK:', html.length))
```

## Cấu trúc code

```
src/
├── setupProxy.js          ← Proxy server config
├── App.tsx               ← Smart fetch logic
└── components/
    └── URLInputForm.tsx  ← Input URLs
```

## Tham khảo
- [Create React App Proxying](https://create-react-app.dev/docs/proxying-api-requests-in-development/)
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
