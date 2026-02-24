# 🎉 Các Tính Năng Mới - URL Comparison Tool

## Tổng Quan Cải Tiến

Tool đã được nâng cấp với 3 tính năng chính:

### 1. 🖼️ **Hiển Thị Hình Ảnh Thật (Visual Image Comparison)**

#### Trước đây:
- Chỉ hiển thị text (URL, tên file, kích thước)
- Không thể so sánh trực quan

#### Bây giờ:
- ✅ Hiển thị hình ảnh thật từ cả Dev và Prod
- ✅ Side-by-side comparison với thumbnail
- ✅ Lazy loading để tối ưu performance
- ✅ Hiển thị URL đầy đủ để verify source
- ✅ Hover để xem thông tin chi tiết

**Cách sử dụng:**
1. Click tab "Resources" sau khi compare
2. Click button "🖼️ Images" 
3. Xem tất cả hình ảnh từ Dev (bên trái) và Prod (bên phải)
4. So sánh bằng mắt thay vì chỉ dựa vào tên file

**Tại sao cần?**
- Nhiều khi 2 server có tên file giống nhau nhưng hình ảnh khác nhau
- Visual comparison giúp phát hiện sự khác biệt nhanh hơn

---

### 2. 📁 **Craw Toàn Bộ Folder Structure (Deep File Tree Analysis)**

#### Trước đây:
- Danh sách file phẳng, khó theo dõi
- Không thấy được cấu trúc thư mục

#### Bây giờ:
- ✅ Hiển thị cấu trúc folder như DevTools Sources tab
- ✅ Expandable/collapsible folder tree
- ✅ Highlight files chỉ có ở Dev hoặc Prod
- ✅ Click vào file để xem diff chi tiết
- ✅ Áp dụng cho Scripts và Stylesheets

**Cách sử dụng:**
1. Click tab "Resources"
2. Click button "📁 Tree View"
3. Browse folder structure:
   - 📂 Click folder icon để expand/collapse
   - 📄 Click file name (có underline) để view diff
   - Badge "Only in Dev/Prod" → file unique
   - Badge "Click to diff" → file có ở cả 2 server

**Tính năng Deep Diff:**
- Click vào file name (màu xanh, có underline)
- Modal popup hiển thị code diff giữa Dev vs Prod
- Synchronized scrolling (2 panes scroll cùng nhau)
- Highlight thay đổi (added/removed/modified)

**Tại sao cần?**
- Dễ dàng navigate qua folder structure phức tạp
- Nhanh chóng identify file nào bị thay đổi
- So sánh code chi tiết giữa 2 environments

---

### 3. 🔄 **Synchronized Scroll trong Diff Viewer**

#### Trước đây:
- Scroll Dev và Prod độc lập
- Khó so sánh khi file dài

#### Bây giờ:
- ✅ Scroll 1 pane → pane kia tự động scroll theo
- ✅ Giống VS Code compare view
- ✅ Cả vertical và horizontal scroll đều sync

**Cách sử dụng:**
- Tự động hoạt động khi xem Split View
- Scroll bằng mouse wheel hoặc scrollbar
- Cả 2 panes luôn giữ vị trí tương ứng

**Tại sao cần?**
- Dễ dàng đối chiếu code line-by-line
- Giảm effort khi compare file lớn
- UX giống professional tools

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh

### Bước 1: Chạy Tool
```bash
npm start
```

### Bước 2: Nhập URL và Compare
- Dev URL: `https://pws-dev.vib/`
- Prod URL: `https://pws.vib/`
- Click "Compare URLs"

### Bước 3: Xem Resources
- Click tab **"Resources"**
- Chọn view mode:

#### 📊 Summary View
- Tổng quan số lượng resources
- Breakdown theo category
- Click expand để xem list

#### 📁 Tree View (MỚI)
- Folder structure đầy đủ
- Click folder để expand
- Click file để view diff

#### 🖼️ Images View (MỚI)
- Gallery hiển thị tất cả hình
- Side-by-side Dev vs Prod
- Hover để xem URL

### Bước 4: Deep Diff Files
1. Trong Tree View, tìm file có badge "Click to diff"
2. Click vào tên file (màu xanh)
3. Modal popup với diff viewer
4. Scroll để xem thay đổi (auto-sync)
5. Click ✕ để đóng modal

---

## 🎯 Use Cases Thực Tế

### Case 1: So sánh images giữa Dev và Prod
```
Problem: Dev có logo cũ, Prod có logo mới nhưng tên file giống nhau
Solution: 
1. Click Resources → Images
2. Nhìn visual comparison
3. Phát hiện ngay sự khác biệt
```

### Case 2: Tìm file JS bị missing trong Prod
```
Problem: Dev có file utils.js nhưng Prod không có
Solution:
1. Click Resources → Tree View
2. Browse folder /assets/js/
3. Thấy badge "Only in Dev" ở utils.js
4. Identify missing file ngay lập tức
```

### Case 3: Compare code giữa 2 stylesheet files
```
Problem: main.css khác nhau giữa Dev và Prod
Solution:
1. Tree View → /assets/css/main.css
2. Click vào main.css
3. Diff viewer hiển thị changes
4. Scroll cả 2 panes cùng lúc để review
```

---

## 🔧 Technical Details

### Image Loading
- Lazy loading với `loading="lazy"`
- Fallback nếu image load fail
- Object-fit: contain để giữ aspect ratio

### Folder Tree Structure
- Recursive parsing URL paths
- Build tree từ flat resource list
- Match files giữa Dev và Prod by path

### Content Fetching
- Async fetch file content cho Scripts & Stylesheets
- Parallel requests với Promise.all
- Error handling nếu fetch fail

### Scroll Synchronization
- useRef để access DOM elements
- Scroll event listeners
- Debounce với setTimeout để tránh loop
- Support cả scrollTop và scrollLeft

---

## 📊 Performance Considerations

- **Image Gallery**: Lazy loading → chỉ load khi scroll vào view
- **Content Fetching**: Parallel fetch → tối ưu thời gian
- **Folder Tree**: Chỉ render khi expand → giảm DOM nodes
- **Scroll Sync**: Debounce → tránh quá nhiều event handlers

---

## 🐛 Troubleshooting

### Images không hiển thị?
- Kiểm tra CORS policy của server
- Verify image URLs có accessible không
- Check browser console cho errors

### File content không load?
- Chỉ fetch được Scripts và Stylesheets (text-based)
- Images/fonts không fetch content (binary)
- Check network tab nếu request fail

### Scroll không sync?
- Đảm bảo đang ở Split View mode
- Check browser compatibility (modern browsers only)
- Try refresh page nếu bị lag

---

## 🎓 Best Practices

1. **So sánh Images**:
   - Luôn check visual thay vì chỉ dựa vào tên file
   - Verify URL để đảm bảo đúng source

2. **Browse Folder Tree**:
   - Expand từng folder để explore structure
   - Chú ý badges "Only in..." để tìm differences

3. **Deep Diff Files**:
   - Sử dụng synchronized scroll cho files lớn
   - Focus vào highlighted changes
   - Close modal khi done để giữ performance

4. **Performance**:
   - Đóng tabs/views không dùng
   - Collapse folders không cần thiết
   - Clear history định kỳ

---

## 🚀 Next Steps

Tool này đã sẵn sàng sử dụng cho môi trường **HCL Digital Experience**:
- ✅ Track static resources như DevTools Sources
- ✅ Visual comparison cho images
- ✅ Deep diff cho code files
- ✅ Professional UX như VS Code

**Enjoy comparing!** 🎉
