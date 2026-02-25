// Vercel Serverless Function for Puppeteer rendering
// This file is ONLY used in production (Vercel)
// Development uses src/setupProxy.js instead

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Vercel serverless function
module.exports = async (req, res) => {
  // Enable CORS
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
  
  console.log(`🚀 [Vercel] Rendering URL: ${url}`);
  
  let browser;
  try {
    // Launch Chrome with serverless-optimized binary
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });
    
    // Set realistic User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Set extra headers
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
    
    // Anti-bot detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['vi-VN', 'vi', 'en-US', 'en'] });
      window.chrome = { runtime: {} };
      
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
    
    await page.setBypassCSP(true);
    
    // Navigate and wait
    await page.goto(url, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 8000 // Hobby plan has 10s timeout total
    });
    
    console.log(`⏳ Quick JS wait...`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Minimal wait
    
    // Quick interactions (optimized for 10s timeout)
    console.log(`📜 Quick interactions...`);
    await page.evaluate(async () => {
      const waitForMutations = (timeout = 500) => {
        return new Promise(resolve => {
          let timer;
          const observer = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              observer.disconnect();
              resolve();
            }, 100);
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
      
      // Quick scroll (50ms delay)
      const scrollStep = 500;
      const scrollDelay = 50;
      const maxScroll = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      
      for (let y = 0; y < maxScroll; y += scrollStep) {
        window.scrollTo(0, y);
        window.dispatchEvent(new Event('scroll'));
        await new Promise(r => setTimeout(r, scrollDelay));
      }
      
      // Key positions (200ms each)
      window.scrollTo(0, maxScroll);
      window.dispatchEvent(new Event('scroll'));
      await new Promise(r => setTimeout(r, 200));
      
      window.scrollTo(0, maxScroll / 2);
      window.dispatchEvent(new Event('scroll'));
      await new Promise(r => setTimeout(r, 200));
      
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('scroll'));
      await new Promise(r => setTimeout(r, 200));
      
      // Trigger events
      ['scroll', 'resize', 'load', 'DOMContentLoaded'].forEach(eventType => {
        window.dispatchEvent(new Event(eventType));
        document.dispatchEvent(new Event(eventType));
      });
      
      await waitForMutations(500);
      
      // Force lazy-load
      const lazySelectors = [
        'img[data-src]', 'img[data-lazy]', 'img[data-original]', 
        'img[data-lazy-src]', 'img[data-lazyload]', 'source[data-srcset]',
        '[data-bg]', '[data-background]', '[data-background-image]', '[data-bgset]'
      ];
      
      const lazyElements = document.querySelectorAll(lazySelectors.join(','));
      
      lazyElements.forEach((el) => {
        if (el.tagName === 'IMG' || el.tagName === 'SOURCE') {
          const src = el.getAttribute('data-src') || 
                     el.getAttribute('data-lazy') || 
                     el.getAttribute('data-original') ||
                     el.getAttribute('data-lazy-src') ||
                     el.getAttribute('data-lazyload');
          
          if (src) {
            if (el.tagName === 'IMG') {
              el.setAttribute('src', src);
            } else if (el.tagName === 'SOURCE') {
              el.setAttribute('srcset', src);
            }
          }
        }
        
        const bg = el.getAttribute('data-bg') ||
                  el.getAttribute('data-background') ||
                  el.getAttribute('data-background-image') ||
                  el.getAttribute('data-bgset');
        
        if (bg) {
          el.style.backgroundImage = `url(${bg})`;
        }
      });
      
      // Copy computed background-images to inline
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const bgImage = computedStyle.backgroundImage;
        
        if (bgImage && bgImage !== 'none' && !el.style.backgroundImage) {
          el.style.backgroundImage = bgImage;
        }
      });
      
      await waitForMutations(500);
    });
    
    console.log(`⏳ Final quick wait...`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Minimal final wait
    
    // Get HTML
    const html = await page.content();
    console.log(`✅ Got HTML (${html.length} chars)`);
    
    // Check if blocked
    if (html.includes('403 Forbidden') || html.includes('Access Denied')) {
      console.warn(`⚠️ Got blocked, trying fallback...`);
      
      const fetch = require('node-fetch');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });
      
      const fallbackHtml = await response.text();
      return res.json({ html: fallbackHtml, url, method: 'fallback' });
    }
    
    res.json({ html, url, method: 'serverless-chromium' });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
