# 🔧 VIB Tools - Local Only Solution

## ⚠️ QUAN TRỌNG: Chỉ chạy được LOCAL

### Vấn đề khi deploy lên Vercel/Cloud:

VIB website có **WAF/Firewall policy** chặn requests từ:
- ❌ Cloud providers (Vercel, AWS, Google Cloud, Azure)
- ❌ Data centers
- ❌ Known bot IPs

Nhưng cho phép:
- ✅ IP cá nhân (máy local của bạn)
- ✅ IP được whitelist

```
Local (your IP) → VIB ✅ OK
Vercel (cloud IP) → VIB ❌ 403 Forbidden (WAF blocked)
```

## ✅ Giải pháp: Chỉ dùng Local

### Cách dùng hàng ngày:

```bash
# 1. Clone repository (chỉ lần đầu)
git clone https://github.com/ThienVIB/tools-check-diff
cd tools-check-diff

# 2. Install (chỉ lần đầu hoặc khi update)
npm install

# 3. Start dev server
npm start

# 4. Mở browser
http://localhost:3000
```

### Cho team members:

Mỗi người chạy trên máy của mình:
1. Clone repo về
2. `npm install`
3. `npm start`
4. Done! ✅

## 🚀 Alternative: Deploy lên VPS (nếu muốn share)

Nếu cần share tool cho team mà không muốn mọi người phải cài:

### Option 1: Oracle Cloud (FREE forever)
- 2 VMs, 24GB RAM, miễn phí vĩnh viễn
- IP tĩnh (có thể whitelist nếu cần)

**Setup:**
```bash
# Trên VPS
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

git clone https://github.com/ThienVIB/tools-check-diff
cd tools-check-diff
npm install
npm run build

# Serve với PM2
npm install -g pm2 serve
pm2 start "serve -s build -l 80" --name vib-tools
pm2 save
pm2 startup
```

Access: `http://VPS_IP`

### Option 2: Railway.app (có free tier)
Deploy như Vercel nhưng có IP riêng, ít bị chặn hơn.

## ❌ Tại sao không dùng Proxy?

Có thể dùng proxy services như:
- ScraperAPI ($29/tháng)
- Bright Data ($500/tháng)  
- Oxylabs ($99/tháng)

Nhưng **đắt và không cần thiết** cho internal tool.

## 📊 So sánh giải pháp:

| Method | Chi phí | Hoạt động? | Khuyến nghị |
|--------|---------|------------|-------------|
| **npm start (local)** | Free | ✅ Yes | ⭐ **Best** |
| **Vercel** | Free | ❌ No | WAF chặn |
| **VPS (Oracle)** | Free | ✅ Yes | Good cho team |
| **Railway** | $5/mo | ✅ Maybe | Chưa test |
| **Proxy service** | $30-500 | ✅ Yes | Quá đắt |

## 🎯 Kết luận:

**➡️ Chỉ cần `npm start` trên máy local!**

- Free ✅
- Nhanh ✅  
- Không bị chặn ✅
- Đơn giản ✅

Nếu muốn share: Deploy lên Oracle Cloud FREE tier.

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
