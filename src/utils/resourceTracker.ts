/**
 * Enhanced Resource Tracker
 * Tracks all static resources loaded by the page (similar to DevTools Sources tab)
 */

import { StaticResource, ResourceData } from '../types';

export class ResourceTracker {
  private resources: StaticResource[] = [];
  private observer: PerformanceObserver | null = null;

  /**
   * Start tracking resources
   */
  start(): void {
    // Track resources already loaded
    this.trackExistingResources();

    // Track new resources via Performance Observer
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.addResource(entry as PerformanceResourceTiming);
          }
        }
      });

      this.observer.observe({ entryTypes: ['resource'] });
    }

    // Track resources via fetch/XHR interception
    this.interceptFetch();
    this.interceptXHR();
  }

  /**
   * Stop tracking resources
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Get all tracked resources
   */
  getResources(): ResourceData {
    const categorized = {
      scripts: [] as StaticResource[],
      stylesheets: [] as StaticResource[],
      images: [] as StaticResource[],
      fonts: [] as StaticResource[],
      media: [] as StaticResource[],
      other: [] as StaticResource[]
    };

    let totalSize = 0;

    this.resources.forEach(resource => {
      totalSize += resource.size || 0;

      switch (resource.type) {
        case 'script':
          categorized.scripts.push(resource);
          break;
        case 'stylesheet':
          categorized.stylesheets.push(resource);
          break;
        case 'image':
          categorized.images.push(resource);
          break;
        case 'font':
          categorized.fonts.push(resource);
          break;
        case 'media':
          categorized.media.push(resource);
          break;
        default:
          categorized.other.push(resource);
      }
    });

    return {
      all: this.resources,
      scripts: categorized.scripts,
      stylesheets: categorized.stylesheets,
      images: categorized.images,
      fonts: categorized.fonts,
      media: categorized.media,
      other: categorized.other,
      totalSize,
      totalRequests: this.resources.length
    };
  }

  /**
   * Track resources that are already loaded
   */
  private trackExistingResources(): void {
    // Get all performance entries
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    entries.forEach(entry => {
      this.addResource(entry);
    });

    // Track inline scripts and styles
    this.trackInlineResources();
  }

  /**
   * Track inline scripts and styles
   */
  private trackInlineResources(): void {
    // Inline scripts
    document.querySelectorAll('script:not([src])').forEach((script, index) => {
      const content = script.textContent || '';
      this.resources.push({
        url: `inline-script-${index}`,
        type: 'script',
        size: content.length,
        mimeType: 'text/javascript',
        cached: false
      });
    });

    // Inline styles
    document.querySelectorAll('style').forEach((style, index) => {
      const content = style.textContent || '';
      this.resources.push({
        url: `inline-style-${index}`,
        type: 'stylesheet',
        size: content.length,
        mimeType: 'text/css',
        cached: false
      });
    });
  }

  /**
   * Add a resource from PerformanceResourceTiming
   */
  private addResource(entry: PerformanceResourceTiming): void {
    const resource: StaticResource = {
      url: entry.name,
      type: this.getResourceType(entry),
      size: entry.transferSize || entry.encodedBodySize || 0,
      cached: entry.transferSize === 0 && entry.encodedBodySize > 0,
      fromServiceWorker: entry.transferSize === 0 && entry.decodedBodySize > 0,
      initiator: entry.initiatorType
    };

    // Avoid duplicates
    if (!this.resources.some(r => r.url === resource.url)) {
      this.resources.push(resource);
    }
  }

  /**
   * Determine resource type from PerformanceResourceTiming
   */
  private getResourceType(entry: PerformanceResourceTiming): StaticResource['type'] {
    const url = entry.name.toLowerCase();
    const initiator = entry.initiatorType;

    if (initiator === 'script' || url.includes('.js')) {
      return 'script';
    } else if (initiator === 'link' || url.includes('.css')) {
      return 'stylesheet';
    } else if (initiator === 'img' || /\.(jpg|jpeg|png|gif|webp|svg|ico)/.test(url)) {
      return 'image';
    } else if (/\.(woff|woff2|ttf|eot|otf)/.test(url)) {
      return 'font';
    } else if (/\.(mp4|webm|ogg|mp3|wav)/.test(url)) {
      return 'media';
    } else if (url.includes('document') || initiator === 'navigation') {
      return 'document';
    }

    return 'other';
  }

  /**
   * Intercept fetch API
   */
  private interceptFetch(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const response = await originalFetch(input, init);
      
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url) {
        const contentType = response.headers.get('content-type') || '';
        const contentLength = response.headers.get('content-length');
        
        self.resources.push({
          url,
          type: self.getMimeType(contentType),
          size: contentLength ? parseInt(contentLength) : 0,
          status: response.status,
          mimeType: contentType,
          cached: response.headers.get('x-cache') === 'HIT'
        });
      }

      return response;
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const self = this;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      this.addEventListener('load', function() {
        const contentType = this.getResponseHeader('content-type') || '';
        const contentLength = this.getResponseHeader('content-length');

        self.resources.push({
          url: url.toString(),
          type: self.getMimeType(contentType),
          size: contentLength ? parseInt(contentLength) : 0,
          status: this.status,
          mimeType: contentType
        });
      });

      return originalOpen.call(this, method, url, async, username, password);
    };
  }

  /**
   * Get resource type from MIME type
   */
  private getMimeType(contentType: string): StaticResource['type'] {
    if (contentType.includes('javascript')) {
      return 'script';
    } else if (contentType.includes('css')) {
      return 'stylesheet';
    } else if (contentType.includes('image')) {
      return 'image';
    } else if (contentType.includes('font')) {
      return 'font';
    } else if (contentType.includes('video') || contentType.includes('audio')) {
      return 'media';
    } else if (contentType.includes('html')) {
      return 'document';
    }
    return 'other';
  }

  /**
   * Clear all tracked resources
   */
  clear(): void {
    this.resources = [];
  }
}

/**
 * Track resources for a given HTML content
 * Now using server-side Puppeteer rendering API to catch lazy-loaded and dynamically rendered content
 */
export async function analyzeResourcesFromHTML(html: string, baseUrl: string): Promise<ResourceData> {
  console.log(`🚀 Starting resource analysis for: ${baseUrl}`);
  
  // Call server-side Puppeteer API to get client-rendered HTML
  let renderedHtml = html;
  try {
    console.log(`📄 Fetching client-rendered HTML from API...`);
    const response = await fetch(`/api/render?url=${encodeURIComponent(baseUrl)}`);
    
    if (response.ok) {
      const data = await response.json();
      renderedHtml = data.html;
      console.log(`✅ Got client-side rendered HTML (${renderedHtml.length} chars)`);
    } else {
      console.warn(`⚠️ API render failed, falling back to static HTML`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not fetch rendered HTML, using static HTML:`, error);
  }
  
  // Parse the rendered HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(renderedHtml, 'text/html');

  const resources: StaticResource[] = [];

  // Helper to extract path and filename from URL
  const extractPathInfo = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const fileName = pathParts[pathParts.length - 1] || urlObj.hostname;
      const path = '/' + pathParts.slice(0, -1).join('/');
      return { fileName, path };
    } catch {
      return { fileName: url, path: '/' };
    }
  };

  // Helper to check if URL is a raster image (not SVG)
  const isRasterImage = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    // Filter out SVG - only keep raster images
    if (lowerUrl.includes('.svg') || lowerUrl.includes('image/svg')) {
      return false;
    }
    // Check for common raster image extensions
    return /\.(jpg|jpeg|png|gif|webp|bmp|ico)(?:[?#]|$)/i.test(url) || 
           lowerUrl.includes('image/');
  };

  // Helper to extract URLs from background-image CSS
  const extractBackgroundImages = (cssText: string): string[] => {
    const urls: string[] = [];
    // Match: background-image: url(...) or background: url(...)
    const bgMatches = cssText.matchAll(/background(?:-image)?:\s*url\(['"]?([^'"()]+)['"]?\)/gi);
    
    for (const match of bgMatches) {
      const url = match[1].trim();
      // Filter out data URIs, SVG, and non-image URLs
      if (!url.startsWith('data:') && !url.startsWith('#') && isRasterImage(url)) {
        urls.push(url);
      }
    }
    return urls;
  };

  // Helper to fetch resource content
  const fetchContent = async (url: string, type: string): Promise<string | undefined> => {
    // Only fetch text-based resources (scripts, stylesheets)
    if (type !== 'script' && type !== 'stylesheet') {
      return undefined;
    }

    try {
      // Use proxy to avoid CORS issues
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.warn(`Failed to fetch ${url}:`, e);
    }
    return undefined;
  };

  // Scripts
  const scriptPromises: Promise<void>[] = [];
  doc.querySelectorAll('script[src]').forEach(script => {
    const src = (script as HTMLScriptElement).src;
    const fullUrl = new URL(src, baseUrl).href;
    const { fileName, path } = extractPathInfo(fullUrl);
    
    scriptPromises.push(
      fetchContent(fullUrl, 'script').then(content => {
        resources.push({
          url: fullUrl,
          type: 'script',
          mimeType: 'text/javascript',
          fileName,
          path,
          content
        });
      })
    );
  });

  // Stylesheets (with background-image extraction)
  const stylePromises: Promise<void>[] = [];
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = (link as HTMLLinkElement).href;
    const fullUrl = new URL(href, baseUrl).href;
    const { fileName, path } = extractPathInfo(fullUrl);
    
    stylePromises.push(
      fetchContent(fullUrl, 'stylesheet').then(content => {
        // Add stylesheet resource
        resources.push({
          url: fullUrl,
          type: 'stylesheet',
          mimeType: 'text/css',
          fileName,
          path,
          content
        });

        // Extract background-image URLs from fetched CSS
        if (content) {
          const bgUrls = extractBackgroundImages(content);
          bgUrls.forEach(url => {
            try {
              const bgFullUrl = new URL(url, fullUrl).href; // Resolve relative to CSS file
              const bgPathInfo = extractPathInfo(bgFullUrl);
              
              resources.push({
                url: bgFullUrl,
                type: 'image',
                mimeType: 'image/*',
                fileName: bgPathInfo.fileName,
                path: bgPathInfo.path
              });
            } catch (e) {
              // Invalid URL
            }
          });
        }
      })
    );
  });

  // Images from <img> tags (excluding SVG)
  doc.querySelectorAll('img[src]').forEach(img => {
    const src = (img as HTMLImageElement).src;
    const fullUrl = new URL(src, baseUrl).href;
    
    // Only process raster images, skip SVG
    if (isRasterImage(fullUrl)) {
      const { fileName, path } = extractPathInfo(fullUrl);
      
      resources.push({
        url: fullUrl,
        type: 'image',
        mimeType: 'image/*',
        fileName,
        path
      });
    }
  });

  // Lazy-loaded images from data attributes
  // Common patterns: data-src, data-lazy, data-original, data-bg, data-background-image
  const lazySelectors = [
    'img[data-src]',
    'img[data-lazy]',
    'img[data-original]',
    'img[data-lazy-src]',
    '[data-bg]',
    '[data-background]',
    '[data-background-image]',
    '[data-bgset]'
  ];

  lazySelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(element => {
      const el = element as HTMLElement;
      
      // Try different attribute names
      const lazyUrl = el.getAttribute('data-src') ||
                      el.getAttribute('data-lazy') ||
                      el.getAttribute('data-original') ||
                      el.getAttribute('data-lazy-src') ||
                      el.getAttribute('data-bg') ||
                      el.getAttribute('data-background') ||
                      el.getAttribute('data-background-image') ||
                      el.getAttribute('data-bgset');

      if (lazyUrl) {
        try {
          // data-bgset might have multiple URLs, take the first one
          const url = lazyUrl.split(',')[0].trim().split(' ')[0];
          const fullUrl = new URL(url, baseUrl).href;
          
          if (isRasterImage(fullUrl)) {
            const { fileName, path } = extractPathInfo(fullUrl);
            
            resources.push({
              url: fullUrl,
              type: 'image',
              mimeType: 'image/*',
              fileName,
              path
            });
          }
        } catch (e) {
          // Invalid URL
        }
      }
    });
  });

  // Images from inline style="background-image:url(...)"
  doc.querySelectorAll('[style*="background"]').forEach(element => {
    const style = (element as HTMLElement).getAttribute('style') || '';
    const bgUrls = extractBackgroundImages(style);
    
    bgUrls.forEach(url => {
      try {
        const fullUrl = new URL(url, baseUrl).href;
        const { fileName, path } = extractPathInfo(fullUrl);
        
        resources.push({
          url: fullUrl,
          type: 'image',
          mimeType: 'image/*',
          fileName,
          path
        });
      } catch (e) {
        // Invalid URL
      }
    });
  });

  // Images and Fonts from <style> tags
  doc.querySelectorAll('style').forEach(style => {
    const content = style.textContent || '';
    
    // Extract background-image URLs
    const bgUrls = extractBackgroundImages(content);
    bgUrls.forEach(url => {
      try {
        const fullUrl = new URL(url, baseUrl).href;
        const { fileName, path } = extractPathInfo(fullUrl);
        
        resources.push({
          url: fullUrl,
          type: 'image',
          mimeType: 'image/*',
          fileName,
          path
        });
      } catch (e) {
        // Invalid URL
      }
    });
    
    // Extract font URLs
    const fontMatches = content.matchAll(/url\(['"]?([^'"()]+\.(?:woff2?|ttf|eot|otf))['"]?\)/gi);
    for (const match of fontMatches) {
      try {
        const fullUrl = new URL(match[1], baseUrl).href;
        const { fileName, path } = extractPathInfo(fullUrl);
        
        resources.push({
          url: fullUrl,
          type: 'font',
          mimeType: 'font/*',
          fileName,
          path
        });
      } catch (e) {
        // Invalid URL
      }
    }
  });

  // Wait for all content fetches to complete
  await Promise.all([...scriptPromises, ...stylePromises]);

  // Deduplicate resources by URL (vì background-image có thể trùng)
  const uniqueResourcesMap = new Map<string, StaticResource>();
  resources.forEach(resource => {
    if (!uniqueResourcesMap.has(resource.url)) {
      uniqueResourcesMap.set(resource.url, resource);
    }
  });
  const uniqueResources = Array.from(uniqueResourcesMap.values());

  console.log(`📊 Found ${uniqueResources.length} unique resources`);

  // Categorize
  const categorized = {
    scripts: uniqueResources.filter(r => r.type === 'script'),
    stylesheets: uniqueResources.filter(r => r.type === 'stylesheet'),
    images: uniqueResources.filter(r => r.type === 'image'),
    fonts: uniqueResources.filter(r => r.type === 'font'),
    media: uniqueResources.filter(r => r.type === 'media'),
    other: uniqueResources.filter(r => r.type === 'other')
  };

  return {
    all: uniqueResources,
    scripts: categorized.scripts,
    stylesheets: categorized.stylesheets,
    images: categorized.images,
    fonts: categorized.fonts,
    media: categorized.media,
    other: categorized.other,
    totalSize: 0, // Will be calculated when actually fetched
    totalRequests: uniqueResources.length
  };
}
