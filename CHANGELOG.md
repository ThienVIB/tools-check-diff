# 📋 Changelog - URL Comparison Tool

## [Version 2.0] - 2026-02-24

### 🎉 Major Features Added

#### 1. Visual Image Comparison
- **Hiển thị hình ảnh thật** thay vì chỉ text
- Side-by-side image gallery cho Dev vs Prod
- Lazy loading để tối ưu performance
- Hiển thị đầy đủ: image preview, filename, size, URL
- **Use case**: Phát hiện images khác nhau mặc dù cùng tên file

#### 2. Deep Folder Structure Analysis
- **Tree View** hiển thị cấu trúc folder như DevTools Sources
- Expandable/collapsible folders
- Click vào file để xem **deep diff** giữa Dev và Prod
- Highlight files chỉ có ở một environment
- **Fetch file content** tự động cho Scripts & Stylesheets
- Modal popup với full diff viewer

#### 3. Synchronized Scroll in Diff Viewer
- **Auto-sync scroll** giữa Dev và Prod panes
- Giống VS Code compare view
- Support cả vertical và horizontal scrolling
- Debounced để smooth performance

---

### 🔧 Technical Improvements

#### Type System Updates
**File**: `src/types.ts`
- Added `content?: string` to `StaticResource` - store file content
- Added `path?: string` and `fileName?: string` - folder structure info
- Added `FolderNode` interface - tree structure representation
- Added `folderStructure?: FolderNode` to `ResourceData`

#### Component Updates

**ResourceTracker.tsx**:
- New state: `selectedFile` - track clicked file for diff
- New state: `expandedFolders` - track expanded folders in tree
- New view modes: `'summary' | 'tree' | 'images'`
- New function: `buildFolderTree()` - convert flat list to tree
- New function: `renderImageGallery()` - display images grid
- New function: `renderTreeView()` - display folder structure
- New function: `handleFileClick()` - open diff modal
- Modal integration với DiffViewer component

**DiffViewer.tsx**:
- Added refs: `prodPaneRef`, `devPaneRef` - DOM access for scroll
- Added ref: `isScrollingRef` - prevent scroll loop
- Added useEffect: scroll event listeners with sync logic
- Debounced scroll sync với 10ms timeout
- Cleanup listeners on unmount

#### Utility Updates

**resourceTracker.ts**:
- Changed `analyzeResourcesFromHTML` to async function
- Added `fetchContent()` helper - fetch file content via HTTP
- Added `extractPathInfo()` helper - parse URL to path/filename
- Parallel content fetching với Promise.all
- Error handling cho failed fetches
- Auto-populate `content`, `path`, `fileName` fields

**App.tsx**:
- Updated to await async `analyzeResourcesFromHTML()`
- Parallel resource analysis cho Dev và Prod
- Error handling maintained

#### CSS Updates

**ResourceTracker.css**:
- Added `.image-gallery` styles - grid layout cho images
- Added `.image-card` styles - card với hover effects
- Added `.tree-view` styles - folder tree styling
- Added `.folder-tree` styles - indentation theo level
- Added `.tree-item` styles - folder/file items
- Added `.file-diff-modal` styles - fullscreen modal
- Added `.modal-overlay` và `.modal-content` - modal structure
- Badge styles: `.unique-badge`, `.both-badge`
- Responsive grid layouts

---

### 🎯 User Experience Improvements

#### Before:
- ❌ Chỉ thấy text info về images
- ❌ Flat list khó navigate
- ❌ Scroll Dev/Prod độc lập
- ❌ Không xem được code bên trong files

#### After:
- ✅ Xem hình ảnh thật để compare
- ✅ Folder tree structure rõ ràng
- ✅ Sync scroll như VS Code
- ✅ Click file để diff deep
- ✅ Auto-fetch file content

---

### 📊 Performance Optimizations

1. **Lazy Loading Images**
   - `loading="lazy"` attribute
   - Chỉ load khi scroll vào viewport
   - Giảm initial page load

2. **Parallel Fetching**
   - Promise.all cho multiple files
   - Reduce total waiting time
   - Better user experience

3. **Debounced Scroll**
   - 10ms timeout prevent loop
   - Smooth synchronized scrolling
   - Không lag khi scroll nhanh

4. **Conditional Rendering**
   - Tree chỉ render khi expand
   - Modal chỉ mount khi cần
   - Giảm DOM nodes

---

### 🐛 Bug Fixes & Stability

- Fixed TypeScript compilation errors
- Added error handling cho fetch failures
- Fallback nếu image load fail
- Cleanup event listeners properly
- Memory leak prevention

---

### 📚 Documentation

- Created `FEATURES_UPDATE.md` - detailed feature guide
- This `CHANGELOG.md` - version history
- Inline code comments cho complex logic
- Use case examples

---

### 🔮 Future Enhancements (Not Included)

Những tính năng có thể thêm sau:
- [ ] Binary file comparison (images pixel diff)
- [ ] Export folder structure to JSON
- [ ] Filter tree by file type
- [ ] Search trong folder tree
- [ ] Download file content từ UI
- [ ] Compare 3+ environments
- [ ] Real-time sync với file system

---

### 🚀 Migration Guide

#### Không cần action gì!
Tất cả tính năng mới **backward compatible**:
- Existing code vẫn chạy bình thường
- No breaking changes
- Data structure extended, not changed

#### Để sử dụng tính năng mới:
1. Chạy tool như bình thường: `npm start`
2. Click tab "Resources" sau khi compare
3. Chọn view mode: Summary / Tree View / Images
4. Click file trong Tree View để xem diff

---

### 🎓 Technical Notes

#### Architecture Decisions

1. **Why async resource fetching?**
   - Need file content for deep comparison
   - Better than storing in localStorage (size limit)
   - Fetch on-demand khi cần

2. **Why folder tree instead of flat list?**
   - HCL DX có nhiều static files
   - Tree structure dễ navigate
   - Professional UX

3. **Why modal for diff?**
   - Fullscreen view cho code
   - Không ảnh hưởng main UI
   - Easy to close và back

4. **Why synchronized scroll?**
   - Standard trong code comparison tools
   - Essential cho long files
   - Improve review efficiency

---

## [Version 1.0] - Previous

All features from README_NEW.md:
- CLI tool với Commander.js
- Lighthouse integration
- Visual regression testing
- Alert system
- History timeline
- Multi-page crawling
- PDF export
- Core comparison features

---

**Phát triển bởi**: GitHub Copilot  
**Ngày**: February 24, 2026  
**Status**: ✅ Production Ready
