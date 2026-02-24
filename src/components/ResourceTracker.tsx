import React, { useState } from 'react';
import { ResourceData, StaticResource, FolderNode } from '../types';
import DiffViewer from './DiffViewer';
import { downloadAllResources, downloadCategoryResources, exportResourcesAsJson, downloadSingleFile, downloadFolder } from '../utils/downloadResources';
import './ResourceTracker.css';

interface ResourceTrackerProps {
  devResources: ResourceData | null;
  prodResources: ResourceData | null;
}

export const ResourceTracker: React.FC<ResourceTrackerProps> = ({ devResources, prodResources }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'tree' | 'images'>('summary');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<{
    dev?: StaticResource;
    prod?: StaticResource;
    fileName: string;
  } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    isDownloading: boolean;
    current: number;
    total: number;
    environment?: 'dev' | 'prod';
    category?: string;
  }>({ isDownloading: false, current: 0, total: 0 });

  if (!devResources && !prodResources) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDiff = (devValue: number, prodValue: number): string => {
    const diff = prodValue - devValue;
    const sign = diff > 0 ? '+' : '';
    const percentage = devValue > 0 ? ((diff / devValue) * 100).toFixed(1) : '0';
    return `${sign}${diff} (${sign}${percentage}%)`;
  };

  const getStatusClass = (diff: number): string => {
    if (diff > 0) return 'increased';
    if (diff < 0) return 'decreased';
    return 'unchanged';
  };

  const categories = [
    { key: 'scripts', label: 'Scripts', icon: '📜' },
    { key: 'stylesheets', label: 'Stylesheets', icon: '🎨' },
    { key: 'images', label: 'Images', icon: '🖼️' },
    { key: 'fonts', label: 'Fonts', icon: '🔤' },
    { key: 'media', label: 'Media', icon: '🎬' },
    { key: 'other', label: 'Other', icon: '📦' }
  ];

  // Download handlers
  const handleDownloadAll = async (environment: 'dev' | 'prod') => {
    const resources = environment === 'dev' ? devResources : prodResources;
    if (!resources) {
      alert(`No ${environment} resources to download`);
      return;
    }

    setDownloadProgress({ isDownloading: true, current: 0, total: 0, environment });

    try {
      await downloadAllResources(
        resources as any,
        environment,
        (current, total) => {
          setDownloadProgress({ isDownloading: true, current, total, environment });
        }
      );
      alert(`✓ Downloaded all ${environment} resources successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download ${environment} resources: ${error}`);
    } finally {
      setDownloadProgress({ isDownloading: false, current: 0, total: 0 });
    }
  };

  const handleDownloadCategory = async (category: string, environment: 'dev' | 'prod') => {
    const resources = environment === 'dev' ? devResources : prodResources;
    const items = (resources as any)?.[category] || [];
    
    if (items.length === 0) {
      alert(`No ${category} resources in ${environment}`);
      return;
    }

    setDownloadProgress({ isDownloading: true, current: 0, total: 0, environment, category });

    try {
      await downloadCategoryResources(
        items,
        category,
        environment,
        (current, total) => {
          setDownloadProgress({ isDownloading: true, current, total, environment, category });
        }
      );
      alert(`✓ Downloaded ${category} from ${environment} successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download ${category}: ${error}`);
    } finally {
      setDownloadProgress({ isDownloading: false, current: 0, total: 0 });
    }
  };

  const handleExportJson = () => {
    if (!devResources && !prodResources) {
      alert('No resources to export');
      return;
    }
    
    try {
      exportResourcesAsJson(devResources as any || {}, prodResources as any || {});
      alert('✓ Exported resources comparison as JSON!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export: ${error}`);
    }
  };

  const handleDownloadFile = async (resource: StaticResource | undefined, environment: 'dev' | 'prod') => {
    if (!resource) {
      alert('No resource to download');
      return;
    }

    try {
      await downloadSingleFile(resource, environment);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download file: ${error}`);
    }
  };

  const handleDownloadFolderNode = async (node: FolderNode, environment: 'dev' | 'prod') => {
    if (node.type !== 'folder') {
      alert('This is not a folder');
      return;
    }

    // Collect all files in this folder recursively
    const collectFiles = (n: FolderNode): StaticResource[] => {
      const files: StaticResource[] = [];
      if (n.children) {
        for (const child of n.children) {
          if (child.type === 'file' && child.resource) {
            files.push(child.resource);
          } else if (child.type === 'folder') {
            files.push(...collectFiles(child));
          }
        }
      }
      return files;
    };

    const files = collectFiles(node);
    
    if (files.length === 0) {
      alert('No files in this folder');
      return;
    }

    setDownloadProgress({ isDownloading: true, current: 0, total: 0, environment });

    try {
      await downloadFolder(
        files,
        node.path,
        environment,
        (current, total) => {
          setDownloadProgress({ isDownloading: true, current, total, environment });
        }
      );
      alert(`✓ Downloaded folder "${node.name}" successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download folder: ${error}`);
    } finally {
      setDownloadProgress({ isDownloading: false, current: 0, total: 0 });
    }
  };

  const renderSummary = () => (
    <div className="resource-summary">
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-header">
            <span className="card-icon">📊</span>
            <span className="card-title">Total Resources</span>
          </div>
          <div className="card-values">
            <div className="value-item">
              <span className="label">Dev:</span>
              <span className="value">{devResources?.totalRequests || 0}</span>
            </div>
            <div className="value-item">
              <span className="label">Prod:</span>
              <span className="value">{prodResources?.totalRequests || 0}</span>
            </div>
            <div className={`value-item diff ${getStatusClass((prodResources?.totalRequests || 0) - (devResources?.totalRequests || 0))}`}>
              <span className="label">Diff:</span>
              <span className="value">{getDiff(devResources?.totalRequests || 0, prodResources?.totalRequests || 0)}</span>
            </div>
          </div>
        </div>

        <div className="summary-card size">
          <div className="card-header">
            <span className="card-icon">💾</span>
            <span className="card-title">Total Size</span>
          </div>
          <div className="card-values">
            <div className="value-item">
              <span className="label">Dev:</span>
              <span className="value">{formatBytes(devResources?.totalSize || 0)}</span>
            </div>
            <div className="value-item">
              <span className="label">Prod:</span>
              <span className="value">{formatBytes(prodResources?.totalSize || 0)}</span>
            </div>
            <div className={`value-item diff ${getStatusClass((prodResources?.totalSize || 0) - (devResources?.totalSize || 0))}`}>
              <span className="label">Diff:</span>
              <span className="value">{getDiff(devResources?.totalSize || 0, prodResources?.totalSize || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Controls */}
      <div className="download-controls">
        <h3>📥 Download Resources</h3>
        <div className="download-buttons">
          <div className="download-group">
            <h4>Development</h4>
            <button 
              className="download-btn dev-btn"
              onClick={() => handleDownloadAll('dev')}
              disabled={!devResources || downloadProgress.isDownloading}
            >
              📦 Download All Dev Resources
            </button>
          </div>
          <div className="download-group">
            <h4>Production</h4>
            <button 
              className="download-btn prod-btn"
              onClick={() => handleDownloadAll('prod')}
              disabled={!prodResources || downloadProgress.isDownloading}
            >
              📦 Download All Prod Resources
            </button>
          </div>
          <div className="download-group">
            <h4>Export</h4>
            <button 
              className="download-btn export-btn"
              onClick={handleExportJson}
              disabled={(!devResources && !prodResources) || downloadProgress.isDownloading}
            >
              📄 Export as JSON
            </button>
          </div>
        </div>
        
        {downloadProgress.isDownloading && (
          <div className="download-progress">
            <div className="progress-info">
              Downloading {downloadProgress.category || 'all'} resources from {downloadProgress.environment}...
              <span className="progress-count">
                {downloadProgress.current} / {downloadProgress.total}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${downloadProgress.total > 0 ? (downloadProgress.current / downloadProgress.total) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="category-breakdown">
        <h3>Resource Breakdown</h3>
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Dev</th>
              <th>Prod</th>
              <th>Difference</th>
              <th>Download</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const devCount = (devResources as any)?.[cat.key]?.length || 0;
              const prodCount = (prodResources as any)?.[cat.key]?.length || 0;
              const diff = prodCount - devCount;

              return (
                <tr key={cat.key} className={expandedCategory === cat.key ? 'expanded' : ''}>
                  <td>
                    <span className="category-icon">{cat.icon}</span>
                    {cat.label}
                  </td>
                  <td>{devCount}</td>
                  <td>{prodCount}</td>
                  <td className={getStatusClass(diff)}>
                    {diff !== 0 && (diff > 0 ? `+${diff}` : diff)}
                  </td>
                  <td>
                    <div className="category-download-btns">
                      <button
                        className="mini-download-btn dev"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadCategory(cat.key, 'dev');
                        }}
                        disabled={devCount === 0 || downloadProgress.isDownloading}
                        title="Download Dev resources"
                      >
                        ⬇️ Dev
                      </button>
                      <button
                        className="mini-download-btn prod"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadCategory(cat.key, 'prod');
                        }}
                        disabled={prodCount === 0 || downloadProgress.isDownloading}
                        title="Download Prod resources"
                      >
                        ⬇️ Prod
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="expand-btn"
                      onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                    >
                      {expandedCategory === cat.key ? '▼' : '▶'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expandedCategory && renderCategoryDetails(expandedCategory)}
    </div>
  );

  const renderCategoryDetails = (category: string) => {
    const devItems = (devResources as any)?.[category] || [];
    const prodItems = (prodResources as any)?.[category] || [];

    // For images, show actual images
    if (category === 'images') {
      return renderImageGallery(devItems, prodItems);
    }

    // Helper to normalize path (remove host, query params and hash)
    const getNormalizedPath = (url: string): string => {
      try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        
        // Extract from /static if present, otherwise use full path
        const staticIndex = path.indexOf('/static');
        if (staticIndex !== -1) {
          path = path.substring(staticIndex);
        }
        
        return path; // Path without query params or hash
      } catch {
        // If URL parsing fails, extract path from string
        const withoutProtocol = url.replace(/^https?:\/\/[^/]+/, '');
        const pathOnly = withoutProtocol.split('?')[0].split('#')[0];
        
        const staticIndex = pathOnly.indexOf('/static');
        if (staticIndex !== -1) {
          return pathOnly.substring(staticIndex);
        }
        
        return pathOnly;
      }
    };

    // Helper to get path with query params (for URL comparison)
    const getPathWithParams = (url: string): string => {
      try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        
        // Extract from /static if present
        const staticIndex = path.indexOf('/static');
        if (staticIndex !== -1) {
          path = path.substring(staticIndex);
        }
        
        // Include query params
        if (urlObj.search) {
          path += urlObj.search;
        }
        
        return path;
      } catch {
        // If URL parsing fails
        const withoutProtocol = url.replace(/^https?:\/\/[^/]+/, '');
        const pathWithParams = withoutProtocol.split('#')[0];
        
        const staticIndex = pathWithParams.indexOf('/static');
        if (staticIndex !== -1) {
          return pathWithParams.substring(staticIndex);
        }
        
        return pathWithParams;
      }
    };

    // Create maps by normalized path (not full URL) for better matching
    const devMap = new Map(devItems.map((item: any) => [getNormalizedPath(item.url), item]));
    const prodMap = new Map(prodItems.map((item: any) => [getNormalizedPath(item.url), item]));

    // Find unique and common items by normalized path
    const devOnlyItems = devItems.filter((item: any) => !prodMap.has(getNormalizedPath(item.url)));
    const prodOnlyItems = prodItems.filter((item: any) => !devMap.has(getNormalizedPath(item.url)));
    const commonItems = devItems.filter((item: any) => prodMap.has(getNormalizedPath(item.url)));

    return (
      <div className="category-details">
        <h4>{category.charAt(0).toUpperCase() + category.slice(1)} Details</h4>
        
        {/* Legend */}
        <div className="details-legend">
          <span className="legend-item"><span className="legend-dot only-dev"></span> Only in Dev ({devOnlyItems.length})</span>
          <span className="legend-item"><span className="legend-dot only-prod"></span> Only in Prod ({prodOnlyItems.length})</span>
          <span className="legend-item"><span className="legend-dot both"></span> In Both ({commonItems.length})</span>
        </div>

        <div className="details-comparison">
          <div className="details-column">
            <h5>Development ({devItems.length})</h5>
            <ul className="resource-list">
              {devItems.map((item: any, idx: number) => {
                const normalizedPath = getNormalizedPath(item.url);
                const isUnique = !prodMap.has(normalizedPath);
                const prodItem: any = prodMap.get(normalizedPath);
                const hasSizeDiff = prodItem && prodItem.size !== item.size;
                const hasUrlDiff = prodItem && getPathWithParams(prodItem.url) !== getPathWithParams(item.url);
                
                return (
                  <li key={idx} className={`resource-item ${isUnique ? 'unique-dev' : ''} ${hasSizeDiff ? 'size-diff' : ''} ${hasUrlDiff && !isUnique ? 'url-diff' : ''}`}>
                    <span className="resource-url" title={item.url}>
                      {item.url.split('/').pop() || item.url}
                    </span>
                    {item.size && (
                      <span className={`resource-size ${hasSizeDiff ? 'diff-highlight' : ''}`}>
                        {formatBytes(item.size)}
                        {hasSizeDiff && prodItem && (
                          <span className="size-diff-indicator" title={`Prod: ${formatBytes(prodItem.size)}`}>
                            ⚠ ({formatBytes(prodItem.size)} in Prod)
                          </span>
                        )}
                      </span>
                    )}
                    {hasUrlDiff && !isUnique && (
                      <span className="url-diff-badge" title={`Dev: ${item.url}\nProd: ${prodItem.url}`}>
                        🔗 Different URL
                      </span>
                    )}
                    {item.cached && <span className="resource-badge cached">Cached</span>}
                    {isUnique && <span className="resource-badge unique">Only in Dev</span>}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="details-column">
            <h5>Production ({prodItems.length})</h5>
            <ul className="resource-list">
              {prodItems.map((item: any, idx: number) => {
                const normalizedPath = getNormalizedPath(item.url);
                const isUnique = !devMap.has(normalizedPath);
                const devItem: any = devMap.get(normalizedPath);
                const hasSizeDiff = devItem && devItem.size !== item.size;
                const hasUrlDiff = devItem && getPathWithParams(devItem.url) !== getPathWithParams(item.url);
                
                return (
                  <li key={idx} className={`resource-item ${isUnique ? 'unique-prod' : ''} ${hasSizeDiff ? 'size-diff' : ''} ${hasUrlDiff && !isUnique ? 'url-diff' : ''}`}>
                    <span className="resource-url" title={item.url}>
                      {item.url.split('/').pop() || item.url}
                    </span>
                    {item.size && (
                      <span className={`resource-size ${hasSizeDiff ? 'diff-highlight' : ''}`}>
                        {formatBytes(item.size)}
                        {hasSizeDiff && devItem && (
                          <span className="size-diff-indicator" title={`Dev: ${formatBytes(devItem.size)}`}>
                            ⚠ ({formatBytes(devItem.size)} in Dev)
                          </span>
                        )}
                      </span>
                    )}
                    {hasUrlDiff && !isUnique && (
                      <span className="url-diff-badge" title={`Dev: ${devItem.url}\nProd: ${item.url}`}>
                        🔗 Different URL
                      </span>
                    )}
                    {item.cached && <span className="resource-badge cached">Cached</span>}
                    {isUnique && <span className="resource-badge unique">Only in Prod</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderImageGallery = (devImages: StaticResource[], prodImages: StaticResource[]) => {
    return (
      <div className="image-gallery">
        <h4>🖼️ Image Comparison</h4>
        <div className="gallery-comparison">
          <div className="gallery-column">
            <h5>Development ({devImages.length})</h5>
            <div className="image-grid">
              {devImages.map((img, idx) => (
                <div key={idx} className="image-card">
                  <img src={img.url} alt={img.fileName || 'image'} loading="lazy" />
                  <div className="image-info">
                    <div className="image-name" title={img.url}>{img.fileName || img.url.split('/').pop()}</div>
                    <div className="image-size">{formatBytes(img.size || 0)}</div>
                    <div className="image-url">{img.url}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="gallery-column">
            <h5>Production ({prodImages.length})</h5>
            <div className="image-grid">
              {prodImages.map((img, idx) => (
                <div key={idx} className="image-card">
                  <img src={img.url} alt={img.fileName || 'image'} loading="lazy" />
                  <div className="image-info">
                    <div className="image-name" title={img.url}>{img.fileName || img.url.split('/').pop()}</div>
                    <div className="image-size">{formatBytes(img.size || 0)}</div>
                    <div className="image-url">{img.url}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const buildFolderTree = (resources: StaticResource[]): FolderNode => {
    const root: FolderNode = { name: 'root', type: 'folder', path: '/', children: [] };
    
    resources.forEach(resource => {
      try {
        const url = new URL(resource.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        
        // Skip WPS folders (generated by HCL Digital Experience)
        if (pathParts.some(part => part.toLowerCase() === 'wps')) {
          return; // Skip this resource
        }
        
        let currentNode = root;
        const relativePath: string[] = [];
        
        // Build folder structure
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          relativePath.push(part);
          
          let childNode = currentNode.children?.find(c => c.name === part && c.type === 'folder');
          if (!childNode) {
            childNode = {
              name: part,
              type: 'folder',
              path: relativePath.join('/'),
              children: []
            };
            if (!currentNode.children) currentNode.children = [];
            currentNode.children.push(childNode);
          }
          currentNode = childNode;
        }
        
        // Add file
        const fileName = pathParts[pathParts.length - 1] || url.hostname;
        relativePath.push(fileName);
        if (!currentNode.children) currentNode.children = [];
        currentNode.children.push({
          name: fileName,
          type: 'file',
          path: relativePath.join('/'),
          resource: {
            ...resource,
            fileName,
            path: relativePath.slice(0, -1).join('/')
          }
        });
      } catch (e) {
        // Invalid URL, skip
      }
    });
    
    return root;
  };

  // Recursively find a node in tree by path parts
  const findNodeByPath = (tree: FolderNode, pathParts: string[], currentIndex: number = 0): FolderNode | undefined => {
    if (currentIndex >= pathParts.length) {
      return tree;
    }
    
    if (!tree.children) return undefined;
    
    const targetName = pathParts[currentIndex];
    const targetType = currentIndex === pathParts.length - 1 ? 'file' : 'folder';
    
    const childNode = tree.children.find(c => c.name === targetName && c.type === targetType);
    if (!childNode) return undefined;
    
    if (currentIndex === pathParts.length - 1) {
      return childNode; // Found the target
    }
    
    return findNodeByPath(childNode, pathParts, currentIndex + 1);
  };

  // Check if two nodes have content differences
  const hasContentDifference = (devNode: FolderNode | undefined, prodNode: FolderNode | undefined): boolean => {
    if (!devNode || !prodNode) return false;
    if (devNode.type !== 'file' || prodNode.type !== 'file') return false;
    
    const devContent = devNode.resource?.content || '';
    const prodContent = prodNode.resource?.content || '';
    
    return devContent !== prodContent;
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (devRes: StaticResource | undefined, prodRes: StaticResource | undefined, fileName: string) => {
    if (devRes || prodRes) {
      setSelectedFile({ dev: devRes, prod: prodRes, fileName });
    }
  };

  const renderFolderTree = (node: FolderNode, devTree: FolderNode, prodTree: FolderNode, isDev: boolean, level: number = 0, parentPath: string[] = []) => {
    if (!node.children || node.children.length === 0) return null;

    const otherTree = isDev ? prodTree : devTree;
    const environment = isDev ? 'dev' : 'prod';
    
    return (
      <ul className={`folder-tree level-${level}`}>
        {node.children.map((child, idx) => {
          const isExpanded = expandedFolders.has(child.path);
          const isFolder = child.type === 'folder';
          
          // Build current path for recursive lookup
          const currentPath = [...parentPath, child.name];
          
          // Find matching node in other tree using recursive path lookup
          const otherNode = findNodeByPath(otherTree, currentPath);
          const existsInBoth = !!otherNode;
          const onlyInThis = !existsInBoth;
          
          // Check if file content differs
          const hasDiff = hasContentDifference(
            isDev ? child : otherNode,
            isDev ? otherNode : child
          );
          
          return (
            <li key={idx} className={`tree-item ${isFolder ? 'folder' : 'file'} ${onlyInThis ? 'unique' : ''} ${hasDiff ? 'has-diff' : ''}`}>
              <div className="tree-item-content">
                {isFolder && (
                  <span className="folder-icon" onClick={() => toggleFolder(child.path)}>
                    {isExpanded ? '📂' : '📁'}
                  </span>
                )}
                {!isFolder && <span className="file-icon">📄</span>}
                <span 
                  className={`tree-item-name ${!isFolder && existsInBoth ? 'clickable' : ''}`}
                  onClick={() => {
                    if (!isFolder && existsInBoth) {
                      handleFileClick(
                        isDev ? child.resource : otherNode?.resource,
                        isDev ? otherNode?.resource : child.resource,
                        child.name
                      );
                    } else if (isFolder) {
                      toggleFolder(child.path);
                    }
                  }}
                >
                  {child.name}
                </span>
                {!isFolder && child.resource?.size && (
                  <span className="file-size">{formatBytes(child.resource.size)}</span>
                )}
                {onlyInThis && <span className="badge unique-badge">Only in {isDev ? 'Dev' : 'Prod'}</span>}
                {!isFolder && existsInBoth && !hasDiff && <span className="badge same-badge">✓ Same</span>}
                {!isFolder && hasDiff && <span className="badge diff-badge">⚠ Different</span>}
                
                {/* Download buttons */}
                <div className="tree-item-actions">
                  {isFolder && (
                    <button
                      className="tree-download-btn folder-download"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFolderNode(child, environment);
                      }}
                      disabled={downloadProgress.isDownloading}
                      title={`Download folder "${child.name}"`}
                    >
                      📦
                    </button>
                  )}
                  {!isFolder && child.resource && (
                    <button
                      className="tree-download-btn file-download"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(child.resource, environment);
                      }}
                      disabled={downloadProgress.isDownloading}
                      title={`Download "${child.name}"`}
                    >
                      ⬇️
                    </button>
                  )}
                </div>
              </div>
              {isFolder && isExpanded && renderFolderTree(child, devTree, prodTree, isDev, level + 1, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTreeView = () => {
    const devTree = buildFolderTree([...(devResources?.scripts || []), ...(devResources?.stylesheets || [])]);
    const prodTree = buildFolderTree([...(prodResources?.scripts || []), ...(prodResources?.stylesheets || [])]);

    return (
      <div className="tree-view">
        <h3>📁 Folder Structure (Scripts & Stylesheets)</h3>
        <div className="tree-comparison">
          <div className="tree-column dev-column">
            <h4 className="dev-header">🟢 Development</h4>
            {renderFolderTree(devTree, devTree, prodTree, true)}
          </div>
          <div className="tree-column prod-column">
            <h4 className="prod-header">🔵 Production</h4>
            {renderFolderTree(prodTree, devTree, prodTree, false)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="resource-tracker">
      <div className="resource-header">
        <h2>🗂️ Static Resources Analysis</h2>
        <div className="view-toggle">
          <button
            className={viewMode === 'summary' ? 'active' : ''}
            onClick={() => setViewMode('summary')}
          >
            📊 Summary
          </button>
          <button
            className={viewMode === 'tree' ? 'active' : ''}
            onClick={() => setViewMode('tree')}
          >
            📁 Tree View
          </button>
          <button
            className={viewMode === 'images' ? 'active' : ''}
            onClick={() => setViewMode('images')}
          >
            🖼️ Images
          </button>
        </div>
      </div>

      {viewMode === 'summary' && renderSummary()}
      {viewMode === 'tree' && renderTreeView()}
      {viewMode === 'images' && renderImageGallery(devResources?.images || [], prodResources?.images || [])}

      {selectedFile && (
        <div className="file-diff-modal">
          <div className="modal-overlay" onClick={() => setSelectedFile(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>📄 File Comparison: {selectedFile.fileName}</h3>
              <button className="close-btn" onClick={() => setSelectedFile(null)}>✕</button>
            </div>
            <div className="modal-body">
              <DiffViewer 
                devHTML={selectedFile.dev?.content || '// File not found in Development'}
                prodHTML={selectedFile.prod?.content || '// File not found in Production'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
