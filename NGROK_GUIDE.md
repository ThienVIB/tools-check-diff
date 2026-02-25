# 🌐 Expose Local Server to Internet

## Giải pháp: Chạy local + Ngrok tunnel

Thay vì deploy lên Vercel (bị WAF chặn), bạn chạy local và expose port ra ngoài.

## 🚀 Quick Start

### Bước 1: Cài Ngrok (1 lần duy nhất)

```bash
# macOS
brew install ngrok/ngrok/ngrok

# Hoặc tải từ: https://ngrok.com/download
```

### Bước 2: Chạy tool

```bash
./start-with-ngrok.sh
```

Script sẽ tự động:
1. ✅ Start React server (localhost:3000)
2. ✅ Start ngrok tunnel
3. ✅ Hiện public URL

### Bước 3: Chia sẻ URL

Bạn sẽ thấy output:

```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

**Copy URL `https://abc123.ngrok.io`** và gửi cho team!

## 📋 Cách dùng thủ công (nếu script lỗi)

**Terminal 1:**
```bash
npm start
```

**Terminal 2:**
```bash
ngrok http 3000
```

## 🎯 Alternatives

### 1. Cloudflared (Cloudflare Tunnel)

```bash
# Cài đặt
brew install cloudflare/cloudflare/cloudflared

# Chạy
cloudflared tunnel --url http://localhost:3000
```

**Ưu điểm:**
- ✅ Free vĩnh viễn
- ✅ Không cần account
- ✅ URL ngắn hơn

### 2. Localtunnel

```bash
# Cài đặt
npm install -g localtunnel

# Chạy
lt --port 3000
```

### 3. Ngrok (Recommended)

```bash
# Free tier
ngrok http 3000

# Với custom domain (trả phí)
ngrok http 3000 --domain=vib-tools.ngrok.io
```

## ⚙️ So sánh:

| Tool | Free? | Custom Domain | Speed | Stable |
|------|-------|---------------|-------|--------|
| **Ngrok** | ✅ | Trả phí ($8/mo) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Cloudflared** | ✅ | ✅ Free | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Localtunnel** | ✅ | ❌ | ⭐⭐⭐ | ⭐⭐⭐ |

## 🔐 Security Notes

### Ngrok Free Tier:
- ⚠️ URL thay đổi mỗi lần restart
- ⚠️ Giới hạn 40 requests/phút
- ⚠️ Session timeout sau 2 giờ

### Để có URL cố định:

**Option 1: Ngrok Pro ($8/month)**
```bash
ngrok http 3000 --domain=vib-tools.ngrok.io
```

**Option 2: Cloudflared với Tunnel**
```bash
cloudflared tunnel create vib-tools
cloudflared tunnel route dns vib-tools vib-tools.yourdomain.com
cloudflared tunnel run vib-tools
```

## 💡 Best Practices

### 1. Cho team nhỏ (<5 người):
```bash
# Chạy khi cần
./start-with-ngrok.sh
```

### 2. Cho team lớn hoặc dùng thường xuyên:
- Deploy lên **Oracle Cloud FREE tier** (IP tĩnh, free forever)
- Hoặc dùng **Cloudflared Tunnel** (free, URL cố định)

### 3. Production:
- Deploy lên VPS (Digital Ocean, Linode)
- Có thể whitelist IP nếu cần

## 🆘 Troubleshooting

### Lỗi: "port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
./start-with-ngrok.sh
```

### Lỗi: "ngrok command not found"
```bash
brew install ngrok/ngrok/ngrok
```

### Server chậm qua ngrok:
- Bình thường! Có thêm 100-300ms latency
- Nếu quá chậm: Dùng Cloudflared

### URL bị block:
- Một số firewall chặn *.ngrok.io
- Dùng Cloudflared hoặc custom domain

## 📞 Support

Gặp vấn đề? Check:
1. Server local có chạy không: `http://localhost:3000`
2. Ngrok có running: `curl http://127.0.0.1:4040/api/tunnels`
3. Port có bị block: `lsof -ti:3000`
