# Vercel Deployment Guide

## ✅ Deployed Successfully!

### Production URLs:
- **Main App**: https://tools-3rtujo2fh-thienvibs-projects.vercel.app
- **API Render**: https://tools-3rtujo2fh-thienvibs-projects.vercel.app/api/render?url=YOUR_URL
- **API Proxy**: https://tools-3rtujo2fh-thienvibs-projects.vercel.app/api/proxy?url=YOUR_URL

### Test API Endpoints:

```bash
# Test render endpoint
curl "https://tools-3rtujo2fh-thienvibs-projects.vercel.app/api/render?url=https://www.vib.com.vn"

# Test proxy endpoint
curl "https://tools-3rtujo2fh-thienvibs-projects.vercel.app/api/proxy?url=https://www.vib.com.vn/static/logo.png"
```

### Vercel Hobby Plan Limits:
- ⚠️ Memory: 1024MB (may not be enough for complex pages)
- ⚠️ Timeout: 10s (may timeout on slow sites)
- ⚠️ Build time: ~2-3 minutes

### Optimizations Applied:
- ✅ Wait times reduced: 5s → 1s total
- ✅ Scroll speed increased: 100ms → 50ms delay
- ✅ Scroll steps: 300px → 500px
- ✅ Removed networkidle0 (too slow)
- ✅ ESLint warnings disabled (CI=false)

### Known Issues:
- May miss some lazy-load images due to short timeout
- Complex pages with heavy JavaScript may timeout
- Background images from CSS may not be fully captured

### Upgrade to Pro Plan for better performance:
- Memory: 3008MB
- Timeout: 60s
- Cost: $20/month

### Auto-deploy:
Vercel will auto-deploy when you push to GitHub `main` branch.

### Manual deploy:
```bash
npx vercel --prod
```

### View deployment logs:
https://vercel.com/thienvibs-projects/tools
