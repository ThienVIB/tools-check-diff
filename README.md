# 🔍 URL Comparison Tool

Tool để so sánh DOM, SEO và Performance giữa Dev và Production URLs

![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Tính năng

### 📊 DOM Comparison
- So sánh tổng số elements
- Đếm scripts, styles, images, links, forms
- Phân tích cấu trúc heading (H1-H6)
- Hiển thị nội dung H1 tags
- Color-coded comparison (Dev = 🟢 Green, Prod = 🔵 Blue)

### 🎯 SEO Analysis
- **Meta Tags Analysis**:
  - Title (kiểm tra độ dài tối ưu: 30-60 ký tự)
  - Description (tối ưu: 120-160 ký tự)
  - Keywords
- **Open Graph Tags**:
  - OG Title, Description, Image, URL
- **H1 Tags Analysis**:
  - Đếm số lượng H1 (best practice: 1 H1)
  - Hiển thị nội dung H1
- **Structured Data**:
  - Phát hiện và hiển thị JSON-LD
- **SEO Recommendations**:
  - Đề xuất cải thiện SEO dựa trên best practices

### ⚡ Performance Metrics
- **HTML Size**: Kích thước file HTML
- **Resource Counts**:
  - Scripts
  - Stylesheets
  - Images
  - Total resources
- **Performance Score** (0-100):
  - Tính toán dựa trên HTML size và số lượng resources
  - Visual score circle với màu sắc động
- **Optimization Recommendations**:
  - Bundle/minify scripts
  - Lazy loading images
  - Combine CSS files

### 📝 HTML Diff Viewer
- Line-by-line comparison
- Filter theo Added/Removed/All
- Search functionality
- Syntax highlighting
- Color-coded diff (🟢 Added, 🔴 Removed)

## 🚀 Cài đặt

```bash
cd /Users/caohoaithien/Downloads/VIB/Tools
npm install
```

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.2",
  "diff": "^5.1.0"
}
```

## 🏃‍♂️ Chạy ứng dụng

```bash
npm start
```

App sẽ mở tại: [http://localhost:3000](http://localhost:3000)

## 📂 Cấu trúc Project

```
Tools/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── URLInputForm.tsx          # Form nhập 2 URLs
│   │   ├── URLInputForm.css
│   │   ├── DOMCompare.tsx            # So sánh cấu trúc DOM
│   │   ├── DOMCompare.css
│   │   ├── SEOAnalysis.tsx           # Phân tích SEO tags
│   │   ├── SEOAnalysis.css
│   │   ├── PerformanceMetrics.tsx    # Metrics & score
│   │   ├── PerformanceMetrics.css
│   │   ├── DiffViewer.tsx            # HTML line-by-line diff
│   │   └── DiffViewer.css
│   ├── utils/
│   │   ├── analyzer.ts               # HTML analysis logic
│   │   └── helpers.ts                # Helper functions
│   ├── types.ts                      # TypeScript types
│   ├── App.tsx                       # Main component
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 UI Features

- **Responsive Design**: Tương thích mobile & desktop
- **Color-coded Comparisons**:
  - 🟢 Dev = Green
  - 🔵 Prod = Blue
- **Visual Diff Indicators**:
  - ✅ Good/Best practice
  - ⚠️ Warning/Needs improvement
  - ❌ Error/Missing
- **Tab-based Navigation**: Dễ dàng chuyển đổi giữa các phân tích
- **Smooth Animations**: fadeIn, slideDown effects
- **Modern Gradient**: Purple gradient background

## 🔧 Cách sử dụng

1. **Nhập URLs**:
   - Nhập Dev URL (ví dụ: `https://dev.example.com`)
   - Nhập Production URL (ví dụ: `https://example.com`)
   - Click "🚀 Compare URLs"

2. **Xem kết quả**:
   - **DOM Comparison**: So sánh số lượng elements
   - **SEO Analysis**: Kiểm tra meta tags, H1, structured data
   - **Performance**: Xem score và recommendations
   - **HTML Diff**: Xem chi tiết thay đổi từng dòng HTML

3. **Filter & Search**:
   - Trong HTML Diff, filter theo Added/Removed
   - Sử dụng search để tìm specific changes

## ⚠️ Lưu ý

- **CORS**: App sử dụng CORS proxy (`https://api.allorigins.win/raw?url=`) để fetch URLs
- Một số website có thể block CORS requests
- Đề xuất test với URLs cho phép cross-origin access

## 🎯 Performance Scoring

Score được tính dựa trên:
- HTML size (penalize nếu > 100KB, 200KB, 500KB)
- Total resources (penalize nếu > 30, 50, 100)
- Scripts count (penalize nếu > 10, 20)

Score range:
- **80-100**: ✅ Excellent
- **60-79**: ⚠️ Good
- **0-59**: ❌ Needs improvement

## 📊 SEO Best Practices

- **Title**: 30-60 characters
- **Description**: 120-160 characters
- **H1 Tags**: Exactly 1 H1 per page
- **Open Graph**: Complete OG tags for social sharing
- **Structured Data**: JSON-LD for rich snippets

## 🛠️ Build

```bash
npm run build
```

Build output trong folder `build/`

## 📄 License

MIT License

## 👨‍💻 Tác giả

Tool được phát triển để hỗ trợ so sánh và kiểm tra chất lượng khi deploy code lên production.

---

**Happy Coding! 🚀**
