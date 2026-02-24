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
      
      // Navigate and wait for network idle
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Simulate scroll to trigger lazy loading
      console.log(`📜 Simulating scroll to trigger lazy load...`);
      await page.evaluate(async () => {
        // Scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 1000));
        
        // Scroll to middle
        window.scrollTo(0, document.body.scrollHeight / 2);
        await new Promise(r => setTimeout(r, 1000));
        
        // Scroll to top
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 1000));
        
        // Dispatch events
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
      });
      
      // Wait for lazy content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
