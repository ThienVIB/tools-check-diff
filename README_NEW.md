# 🔍 URL Comparison Tool - Professional Edition

> **Production-ready URL comparison suite for development and production environments with comprehensive analysis, automated alerts, history tracking, and CLI support.**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### Core Analysis
- **📊 DOM Structure Comparison** - Detailed element-by-element comparison with expandable tag details
- **🎯 SEO Analysis** - Meta tags, Open Graph, structured data with actionable recommendations
- **⚡ Performance Metrics** - Scoring system with optimization tips
- **📝 HTML Diff Viewer** - Side-by-side and unified diff views
- **🗂️ Static Resource Tracking** - Track all scripts, styles, images, fonts from DevTools Sources tab
- **🔦 Lighthouse Integration** - Core Web Vitals, Performance, Accessibility, SEO scores

### Advanced Features
- **🚨 Automated Alerts** - Configurable threshold validation with error/warning/info levels
- **📈 History & Timeline** - Track all comparisons with statistics and trend analysis
- **💾 Export Capabilities** - JSON, CSV, PDF report generation
- **🖼️ Visual Regression** - Pixel-perfect screenshot comparison
- **🔗 Link Analysis** - Detect broken links, redirects, external links
- **📱 Mobile Comparison** - Viewport simulation for responsive testing
- **🕷️ Multi-page Crawling** - Sitemap-based bulk comparison
- **🔒 Security Headers** - Check for critical security headers

### Developer Experience
- **⌨️ CLI Tool** - Full-featured command-line interface
- **⚙️ Configuration File** - `.compare-config.json` for project-specific settings
- **🔌 CORS Proxy** - Built-in proxy for internal company URLs
- **📚 TypeScript** - Full type safety with comprehensive interfaces

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Initialize configuration
npm run cli:init
```

### Basic Usage

#### Web UI
1. Open http://localhost:3000
2. Enter Development URL and Production URL
3. Click "Compare URLs"
4. Explore results across different tabs

#### CLI Usage

```bash
# Basic comparison
npm run compare -- --dev https://dev.example.com --prod https://example.com

# With all features enabled
npm run compare -- \
  --dev https://dev.example.com \
  --prod https://example.com \
  --lighthouse \
  --links \
  --visual \
  --resources \
  --output ./results.json

# View history
npm run cli:history

# Multi-page crawl
node cli.js crawl \
  --dev https://dev.example.com/sitemap.xml \
  --prod https://example.com/sitemap.xml \
  --limit 20
```

## 📋 Configuration

### `.compare-config.json`

```json
{
  "devUrl": "https://pws-dev.vib/",
  "prodUrl": "https://pws.vib/",
  "viewport": {
    "width": 1920,
    "height": 1080,
    "deviceScaleFactor": 1,
    "isMobile": false
  },
  "alerts": {
    "enabled": true,
    "thresholds": {
      "htmlSizeDiff": 20,
      "scriptCountDiff": 5,
      "imageCountDiff": 10,
      "performanceScoreDiff": 10,
      "brokenLinksMax": 0,
      "lighthousePerformanceMin": 80
    },
    "notifyOn": ["error", "warning"]
  },
  "features": {
    "lighthouse": true,
    "linkAnalysis": true,
    "visualRegression": true,
    "resourceTracking": true
  }
}
```

## 🎯 Use Cases

### Pre-deployment Validation
Check if production deployment will break anything before going live:
```bash
npm run compare -- --dev https://dev.myapp.com --prod https://staging.myapp.com --lighthouse --visual
```

### CI/CD Integration
Add to your GitHub Actions or Jenkins pipeline:
```yaml
- name: Compare URLs
  run: |
    npm run compare -- \
      --dev ${{ env.DEV_URL }} \
      --prod ${{ env.PROD_URL }} \
      --output ./comparison.json
    
    # Exit with error code if critical alerts found
    if [ $? -ne 0 ]; then
      echo "❌ Comparison failed threshold validation"
      exit 1
    fi
```

### HCL Digital Experience Tracking
Track static resources in HCL DX environments:
- Monitor JavaScript modules and WebDAV resources
- Compare theme resources between environments
- Track image and CSS file changes
- Verify portlet JavaScript loading

### Regular Monitoring
Set up cron job for daily comparisons:
```bash
0 9 * * * cd /path/to/project && npm run compare -- --dev https://dev.site.com --prod https://site.com
```

## 📊 Features Deep Dive

### DOM Comparison
- Total element count with percentage difference
- Scripts with async/defer detection
- Stylesheets with media queries
- Images with lazy loading and dimensions
- Links with target and rel attributes
- Meta tags with name/property/content
- Heading structure (H1-H6) with hierarchy

### SEO Analysis
- Title length validation (recommended: 50-60 chars)
- Meta description (recommended: 150-160 chars)
- Open Graph tags for social sharing
- Canonical URL verification
- H1 tag analysis
- Structured data (JSON-LD) detection
- **Recommendations** with CRITICAL/WARNING/ENHANCEMENT levels

### Performance Metrics
- HTML size comparison
- Resource count tracking
- Performance score (0-100)
- **Optimization recommendations** for:
  - Script optimization
  - Image compression
  - CSS minification
  - HTML structure

### Resource Tracking
Comprehensive tracking of all static resources similar to Chrome DevTools Sources tab:
- **Scripts**: JavaScript files, inline scripts, modules
- **Stylesheets**: CSS files, inline styles
- **Images**: All image formats (JPG, PNG, WebP, SVG)
- **Fonts**: Web fonts (WOFF, WOFF2, TTF)
- **Media**: Videos and audio files
- **Caching**: Detect cached vs. network resources
- **Service Workers**: Track SW-cached resources

### Alert System
Configurable threshold-based validation:
- **Error**: Critical issues that should block deployment
- **Warning**: Issues that need attention
- **Info**: Informational differences

Categories:
- Performance (HTML size, script count)
- DOM (structural changes)
- SEO (meta tag issues)
- Links (broken links)
- Visual (screenshot differences)

### History & Timeline
- Track up to 100 recent comparisons
- Statistics dashboard
- Filter by errors/warnings
- Export to JSON/CSV
- Trend analysis
- Most compared URLs

## 🔧 Advanced Features

### Visual Regression Testing
```bash
npm run compare -- --dev URL --prod URL --visual --screenshot
```
- Pixel-by-pixel comparison
- Configurable threshold (default: 5%)
- Diff image generation
- Pass/fail status

### Lighthouse Integration
- Performance score
- Accessibility score
- Best Practices score
- SEO score
- PWA score
- Core Web Vitals:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Total Blocking Time (TBT)
  - Cumulative Layout Shift (CLS)
  - Speed Index
  - Time to Interactive (TTI)

### Link Analysis
- Check up to 50 links per page
- Detect broken links (4xx, 5xx)
- Track redirects (3xx)
- Identify external vs internal links
- Check target and rel attributes

## 🛠️ Development

### Project Structure
```
├── cli.js                    # CLI entry point
├── cli-utils.js              # CLI utility functions
├── src/
│   ├── App.tsx               # Main React app
│   ├── types.ts              # TypeScript interfaces
│   ├── components/           # React components
│   │   ├── AlertDisplay.tsx  # Alert system UI
│   │   ├── DOMCompare.tsx    # DOM comparison
│   │   ├── HistoryTimeline.tsx # History UI
│   │   ├── LighthouseReport.tsx # Lighthouse UI
│   │   ├── ResourceTracker.tsx # Resource tracking UI
│   │   └── ...
│   └── utils/                # Utility modules
│       ├── alertSystem.ts    # Alert validation
│       ├── historyManager.ts # History storage
│       ├── resourceTracker.ts # Resource analysis
│       └── ...
└── .compare-config.json      # Configuration file
```

## 🐛 Troubleshooting

### CORS Issues with Internal URLs
The tool uses a 3-tier fetch strategy:
1. **Direct fetch** - Try fetching the URL directly
2. **Local proxy** - Use built-in proxy at `/api/proxy`
3. **Public CORS proxy** - Fallback to public proxy

For internal company URLs (like HCL DX), ensure:
- You're on the company network
- `setupProxy.js` is configured
- Development server is running

### Lighthouse Not Running
Lighthouse requires Puppeteer which may fail on some systems:
```bash
# Install Chromium dependencies (Linux)
sudo apt-get install -y chromium-browser

# macOS - ensure Xcode Command Line Tools
xcode-select --install
```

## 📄 License

MIT License

## 👨‍💻 Author

Built for VIB - HCL Digital Experience monitoring and comparison

---

**Need help?** Check [PROXY_GUIDE.md](./PROXY_GUIDE.md) for CORS troubleshooting
