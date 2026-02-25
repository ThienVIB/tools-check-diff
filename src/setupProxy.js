const { createProxyMiddleware } = require('http-proxy-middleware');
const puppeteer = require('puppeteer');

module.exports = function(app) {
  // API endpoint for client-side rendered HTML using Puppeteer
  app.get('/api/render', async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`🚀 Rendering URL with Puppeteer: ${url}`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode (harder to detect)
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-blink-features=AutomationControlled', // Hide "automated" flag
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1920,1080'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set realistic viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });
      
      // Set realistic User-Agent (Chrome on Windows)
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Set extra headers to look like real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      });
      
      // Override navigator properties to hide headless mode
      await page.evaluateOnNewDocument(() => {
        // Override the navigator.webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        
        // Override the navigator.plugins to fake plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        
        // Override the navigator.languages property
        Object.defineProperty(navigator, 'languages', {
          get: () => ['vi-VN', 'vi', 'en-US', 'en']
        });
        
        // Pass the Chrome Test
        window.chrome = {
          runtime: {}
        };
        
        // Pass the Permissions Test
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });
      
      // Ignore SSL errors
      await page.setBypassCSP(true);
      
      // Navigate and wait for EVERYTHING to load
      await page.goto(url, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'], // Wait for ALL network requests
        timeout: 60000
      });
      
      console.log(`⏳ Waiting for client-side JavaScript to execute...`);
      // Wait for client-side JS frameworks to render (React, Vue, Angular, etc.)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Simulate scroll to trigger lazy loading & client-side rendering
      console.log(`📜 Simulating user interactions to trigger CSR...`);
      await page.evaluate(async () => {
        // Helper: Wait for mutations
        const waitForMutations = (timeout = 2000) => {
          return new Promise(resolve => {
            let timer;
            const observer = new MutationObserver(() => {
              clearTimeout(timer);
              timer = setTimeout(() => {
                observer.disconnect();
                resolve();
              }, 500); // 500ms after last mutation
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class', 'src', 'data-src']
            });
            
            setTimeout(() => {
              observer.disconnect();
              resolve();
            }, timeout);
          });
        };
        
        // Progressive scroll to trigger IntersectionObservers
        console.log('Starting progressive scroll...');
        const scrollStep = 200;
        const scrollDelay = 150;
        const maxScroll = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        
        for (let y = 0; y < maxScroll; y += scrollStep) {
          window.scrollTo(0, y);
          window.dispatchEvent(new Event('scroll'));
          await new Promise(r => setTimeout(r, scrollDelay));
        }
        
        // Scroll to key positions
        window.scrollTo(0, maxScroll); // Bottom
        window.dispatchEvent(new Event('scroll'));
        await new Promise(r => setTimeout(r, 1000));
        
        window.scrollTo(0, maxScroll / 2); // Middle
        window.dispatchEvent(new Event('scroll'));
        await new Promise(r => setTimeout(r, 1000));
        
        window.scrollTo(0, 0); // Top
        window.dispatchEvent(new Event('scroll'));
        await new Promise(r => setTimeout(r, 1000));
        
        // Trigger all possible lazy-load events
        console.log('Dispatching events...');
        ['scroll', 'resize', 'load', 'DOMContentLoaded', 'readystatechange'].forEach(eventType => {
          window.dispatchEvent(new Event(eventType));
          document.dispatchEvent(new Event(eventType));
        });
        
        // Wait for any DOM mutations from lazy-load
        console.log('Waiting for DOM mutations...');
        await waitForMutations(3000);
        
        // Force apply lazy-load attributes to actual attributes
        console.log('Force applying lazy-load attributes...');
        const lazySelectors = [
          'img[data-src]', 'img[data-lazy]', 'img[data-original]', 
          'img[data-lazy-src]', 'img[data-lazyload]', 'source[data-srcset]',
          '[data-bg]', '[data-background]', '[data-background-image]', '[data-bgset]'
        ];
        
        const lazyElements = document.querySelectorAll(lazySelectors.join(','));
        console.log(`Found ${lazyElements.length} lazy-load elements`);
        
        lazyElements.forEach((el) => {
          // Handle img tags
          if (el.tagName === 'IMG' || el.tagName === 'SOURCE') {
            const src = el.getAttribute('data-src') || 
                       el.getAttribute('data-lazy') || 
                       el.getAttribute('data-original') ||
                       el.getAttribute('data-lazy-src') ||
                       el.getAttribute('data-lazyload');
            
            if (src) {
              if (el.tagName === 'IMG') {
                el.setAttribute('src', src);
                el.removeAttribute('data-src');
                el.removeAttribute('data-lazy');
                el.removeAttribute('data-original');
                el.removeAttribute('data-lazy-src');
                el.removeAttribute('data-lazyload');
              } else if (el.tagName === 'SOURCE') {
                el.setAttribute('srcset', src);
              }
            }
          }
          
          // Handle background images
          const bg = el.getAttribute('data-bg') ||
                    el.getAttribute('data-background') ||
                    el.getAttribute('data-background-image') ||
                    el.getAttribute('data-bgset');
          
          if (bg) {
            el.style.backgroundImage = `url(${bg})`;
            el.removeAttribute('data-bg');
            el.removeAttribute('data-background');
            el.removeAttribute('data-background-image');
            el.removeAttribute('data-bgset');
          }
        });
        
        // Find ALL elements with background-image set by JS (not CSS)
        console.log('Scanning for JS-set background images...');
        const allElements = document.querySelectorAll('*');
        let bgCount = 0;
        allElements.forEach((el) => {
          const computedStyle = window.getComputedStyle(el);
          const bgImage = computedStyle.backgroundImage;
          
          // If has background-image but not in inline style, it might be set by JS
          if (bgImage && bgImage !== 'none' && !el.style.backgroundImage) {
            // Copy computed background-image to inline style so we can capture it
            el.style.backgroundImage = bgImage;
            bgCount++;
          }
        });
        console.log(`Applied ${bgCount} background-images from computed styles`);
        
        // Final mutation wait
        await waitForMutations(2000);
      });
      
      console.log(`⏳ Final wait for all resources to load...`);
      // Final wait for images to actually load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get rendered HTML
      const html = await page.content();
      console.log(`✅ Got rendered HTML (${html.length} chars)`);
      
      // Check if we got blocked (403 Forbidden)
      if (html.includes('403 Forbidden') || html.includes('Access Denied')) {
        console.warn(`⚠️ Got blocked by anti-bot, trying direct fetch...`);
        
        // Fallback to direct fetch with headers
        const fetch = require('node-fetch');
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        
        const fallbackHtml = await response.text();
        console.log(`✅ Fallback fetch got HTML (${fallbackHtml.length} chars)`);
        
        return res.json({ html: fallbackHtml, url, method: 'fallback' });
      }
      
      res.json({ html, url, method: 'puppeteer' });
      
    } catch (error) {
      console.error(`❌ Render error: ${error.message}`);
      res.status(500).json({ error: error.message });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

  app.use(
    '/api/proxy',
    createProxyMiddleware({
      target: 'http://placeholder.com',
      changeOrigin: true,
      secure: false,
      router: (req) => {
        const url = req.query.url;
        if (url) {
          try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}`;
          } catch (e) {
            return 'http://placeholder.com';
          }
        }
        return 'http://placeholder.com';
      },
      pathRewrite: (path, req) => {
        const url = req.query.url;
        if (url) {
          try {
            const urlObj = new URL(url);
            return urlObj.pathname + urlObj.search + urlObj.hash;
          } catch (e) {
            return '/';
          }
        }
        return '/';
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      },
      onError: (err, req, res) => {
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
          error: err.message,
          message: 'Proxy failed'
        }));
      }
    })
  );
};
