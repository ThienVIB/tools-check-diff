# 🔧 Bug Fixes & Improvements - Version 2.1

## 📅 February 24, 2026

### 🐛 Critical Bug Fixes

#### 1. ✅ Tree Structure Matching Fixed
**Problem**: Files/folders giống nhau bị hiển thị "Only in Dev" và "Only in Prod"  
**Root Cause**: Matching logic dùng absolute path → khác nhau giữa dev/prod URLs  
**Solution**: Match by `name + type`, dùng relative path  
**Impact**: Tree view hiện chính xác, badge "Click to diff" hoạt động đúng

#### 2. ✅ CORS Error Fixed  
**Problem**: Fetch file content bị CORS block  
**Solution**: Dùng proxy `/api/proxy?url=...` thay vì direct fetch  
**Impact**: Deep diff functionality hoạt động, không còn CORS errors

#### 3. ✅ Scroll Sync Fixed
**Problem**: HTML Diff Viewer không sync scroll  
**Solution**: Move ref từ `.pane-content` → `.split-pane`  
**Impact**: Scroll 1 pane → pane kia tự động follow (giống VS Code)

#### 4. ✅ Color Coding Added
**Enhancement**: Dev (green) vs Prod (blue) để dễ phân biệt  
**Impact**: UX improvement, professional appearance

---

## 🔍 Technical Details

### File Changes:
- `ResourceTracker.tsx`: Fixed tree matching + colors
- `resourceTracker.ts`: Proxy fetch
- `DiffViewer.tsx`: Scroll sync fix
- `ResourceTracker.css`: Color styles

### Testing: 
✅ 0 TypeScript errors  
✅ 0 Breaking changes  
✅ All features working

---

Xem [IMPROVEMENTS_OLD.md](IMPROVEMENTS_OLD.md) cho roadmap đầy đủ.
