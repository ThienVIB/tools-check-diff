// Vercel Serverless với Proxy fallback
// Sử dụng khi VIB chặn IP của Vercel

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Proxy configuration (nếu cần)
const PROXY_URL = process.env.PROXY_URL; // Set trong Vercel env vars

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  // Validate URL
  try {
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      return res.status(400).json({ 
        error: 'Invalid URL protocol. Must be http or https',
        url: url
      });
    }
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    const validTLDs = ['com', 'net', 'org', 'vn', 'edu', 'gov', 'mil', 'io', 'co', 'app', 'dev'];
    if (parts.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid domain. Must include TLD (e.g., .com, .vn)',
        url: url
      });
    }
    if (!validTLDs.includes(tld) && tld.length < 3) {
      return res.status(400).json({ 
        error: `Invalid or uncommon TLD ".${tld}". Did you mean one of these?`,
        url: url,
        suggestions: [
          url.replace(hostname, hostname + '.com.vn'),
          url.replace(hostname, hostname + '.com'),
          url.replace('.' + tld, '.com.vn'),
          url.replace('.' + tld, '.com')
        ]
      });
    }
  } catch (e) {
    return res.status(400).json({ 
      error: 'Invalid URL format',
      url: url,
      details: e.message
    });
  }
  
  console.log(`🚀 [Vercel] Rendering: ${url}`);
  
  let browser;
  try {
    const launchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    };
    
    // Add proxy if configured
    if (PROXY_URL) {
      console.log(`🔄 Using proxy: ${PROXY_URL}`);
      launchOptions.args.push(`--proxy-server=${PROXY_URL}`);
    }
    
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Try to render
    await page.goto(url, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 8000
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Quick scroll and lazy-load
    await page.evaluate(async () => {
      const waitForMutations = (timeout = 500) => {
        return new Promise(resolve => {
          let timer;
          const observer = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => { observer.disconnect(); resolve(); }, 100);
          });
          observer.observe(document.body, {
            childList: true, subtree: true, attributes: true,
            attributeFilter: ['style', 'class', 'src', 'data-src']
          });
          setTimeout(() => { observer.disconnect(); resolve(); }, timeout);
        });
      };
      
      const scrollStep = 500, scrollDelay = 50;
      const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      
      for (let y = 0; y < maxScroll; y += scrollStep) {
        window.scrollTo(0, y);
        window.dispatchEvent(new Event('scroll'));
        await new Promise(r => setTimeout(r, scrollDelay));
      }
      
      window.scrollTo(0, maxScroll);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, maxScroll / 2);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 200));
      
      ['scroll', 'resize', 'load'].forEach(e => {
        window.dispatchEvent(new Event(e));
        document.dispatchEvent(new Event(e));
      });
      
      await waitForMutations(500);
      
      // Force lazy-load
      const lazySelectors = [
        'img[data-src]', 'img[data-lazy]', 'img[data-original]',
        'img[data-lazy-src]', '[data-bg]', '[data-background]'
      ];
      document.querySelectorAll(lazySelectors.join(',')).forEach(el => {
        const src = el.getAttribute('data-src') || el.getAttribute('data-lazy') || 
                    el.getAttribute('data-original') || el.getAttribute('data-lazy-src');
        if (src && el.tagName === 'IMG') el.setAttribute('src', src);
        
        const bg = el.getAttribute('data-bg') || el.getAttribute('data-background');
        if (bg) el.style.backgroundImage = `url(${bg})`;
      });
      
      // Copy computed background-images
      document.querySelectorAll('*').forEach(el => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage !== 'none' && !el.style.backgroundImage) {
          el.style.backgroundImage = bgImage;
        }
      });
      
      await waitForMutations(500);
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const html = await page.content();
    console.log(`✅ Got HTML (${html.length} chars)`);
    
    res.json({ html, url, method: 'serverless-chromium' });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    // Check if blocked by WAF
    if (error.message.includes('net::ERR_') || error.message.includes('Navigation')) {
      return res.status(403).json({ 
        error: 'Request blocked by target server (likely WAF/Firewall)',
        details: error.message,
        suggestion: 'This URL may block requests from cloud providers. Try: 1) Deploy to VPS with whitelisted IP, 2) Use local development mode, 3) Contact IT to whitelist Vercel IPs',
        url: url
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (browser) await browser.close();
  }
};
