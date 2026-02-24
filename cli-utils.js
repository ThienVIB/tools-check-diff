/**
 * CLI Utilities for URL Comparison Tool
 * Contains core analysis functions for CLI operations
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const axios = require('axios');
const cheerio = require('cheerio');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const parseXml = promisify(parseString);

/**
 * Analyze and compare two URLs
 */
async function analyzeURLs(options) {
  const {
    devUrl,
    prodUrl,
    lighthouse: runLighthouse,
    linkAnalysis,
    visualRegression,
    resourceTracking,
    viewport,
    screenshot,
    auth,
    verbose
  } = options;

  if (verbose) console.log('Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // Analyze Dev URL
    if (verbose) console.log(`\n📊 Analyzing Dev: ${devUrl}`);
    const devData = await analyzeURL(browser, devUrl, {
      runLighthouse,
      linkAnalysis,
      resourceTracking,
      viewport,
      screenshot,
      auth,
      verbose
    });

    // Analyze Prod URL
    if (verbose) console.log(`\n📊 Analyzing Prod: ${prodUrl}`);
    const prodData = await analyzeURL(browser, prodUrl, {
      runLighthouse,
      linkAnalysis,
      resourceTracking,
      viewport,
      screenshot,
      auth,
      verbose
    });

    // Visual regression
    let visualDiff = null;
    if (visualRegression && devData.screenshot && prodData.screenshot) {
      if (verbose) console.log('\n🖼️  Running visual regression...');
      visualDiff = await compareScreenshots(devData.screenshot, prodData.screenshot);
      if (verbose) console.log(`   Pixel difference: ${visualDiff.percentageDiff.toFixed(2)}%`);
    }

    return {
      devUrl,
      prodUrl,
      timestamp: Date.now(),
      dev: devData,
      prod: prodData,
      visualDiff,
      comparison: generateComparison(devData, prodData)
    };

  } finally {
    await browser.close();
  }
}

/**
 * Analyze a single URL
 */
async function analyzeURL(browser, url, options) {
  const page = await browser.newPage();
  
  try {
    // Set viewport
    if (options.viewport) {
      await page.setViewport(options.viewport);
    }

    // Set authentication headers
    if (options.auth?.headers) {
      await page.setExtraHTTPHeaders(options.auth.headers);
    }

    // Track resources
    const resources = [];
    if (options.resourceTracking) {
      page.on('response', async (response) => {
        try {
          const url = response.url();
          const request = response.request();
          
          resources.push({
            url,
            type: request.resourceType(),
            status: response.status(),
            mimeType: response.headers()['content-type'],
            cached: response.fromCache(),
            fromServiceWorker: response.fromServiceWorker(),
            size: parseInt(response.headers()['content-length'] || '0')
          });
        } catch (err) {
          // Ignore errors for failed requests
        }
      });
    }

    // Navigate to URL
    if (options.verbose) console.log(`   Loading page...`);
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Get HTML content
    const html = await page.content();

    // Analyze DOM
    const domData = await page.evaluate(() => {
      const getDetailedElements = (selector) => {
        return Array.from(document.querySelectorAll(selector)).map(el => {
          const attrs = {};
          for (const attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }
          return {
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.substring(0, 100),
            attributes: attrs,
            src: el.src,
            href: el.href,
            alt: el.alt,
            content: el.content
          };
        });
      };

      return {
        totalElements: document.querySelectorAll('*').length,
        scripts: document.scripts.length,
        styles: document.styleSheets.length,
        images: document.images.length,
        links: document.links.length,
        forms: document.forms.length,
        detailedScripts: getDetailedElements('script'),
        detailedStyles: getDetailedElements('link[rel="stylesheet"], style'),
        detailedImages: getDetailedElements('img'),
        detailedLinks: getDetailedElements('a'),
        detailedMetas: getDetailedElements('meta')
      };
    });

    // Analyze SEO
    const seoData = await page.evaluate(() => {
      const getMeta = (name) => {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return el ? el.content : '';
      };

      return {
        title: document.title,
        description: getMeta('description'),
        keywords: getMeta('keywords'),
        ogTitle: getMeta('og:title'),
        ogDescription: getMeta('og:description'),
        ogImage: getMeta('og:image'),
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        h1Count: document.querySelectorAll('h1').length,
        h1Texts: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim())
      };
    });

    // Process resources
    let resourceData = null;
    if (options.resourceTracking) {
      resourceData = processResources(resources);
      if (options.verbose) console.log(`   Resources tracked: ${resourceData.totalRequests}`);
    }

    // Link analysis
    let linkData = null;
    if (options.linkAnalysis) {
      if (options.verbose) console.log(`   Analyzing links...`);
      linkData = await analyzeLinks(page, url);
      if (options.verbose) console.log(`   Links checked: ${linkData.totalLinks} (${linkData.brokenLinks} broken)`);
    }

    // Lighthouse
    let lighthouseData = null;
    if (options.runLighthouse) {
      if (options.verbose) console.log(`   Running Lighthouse...`);
      lighthouseData = await runLighthouseAudit(url, options.viewport?.isMobile);
      if (options.verbose) console.log(`   Performance score: ${lighthouseData.performance}`);
    }

    // Screenshot
    let screenshotBase64 = null;
    if (options.screenshot) {
      const screenshot = await page.screenshot({ fullPage: true });
      screenshotBase64 = screenshot.toString('base64');
    }

    return {
      url,
      html,
      dom: domData,
      seo: seoData,
      resources: resourceData,
      links: linkData,
      lighthouse: lighthouseData,
      screenshot: screenshotBase64
    };

  } finally {
    await page.close();
  }
}

/**
 * Process collected resources into structured data
 */
function processResources(resources) {
  const categorized = {
    scripts: [],
    stylesheets: [],
    images: [],
    fonts: [],
    media: [],
    other: []
  };

  let totalSize = 0;

  resources.forEach(resource => {
    totalSize += resource.size || 0;

    if (resource.type === 'script') {
      categorized.scripts.push(resource);
    } else if (resource.type === 'stylesheet') {
      categorized.stylesheets.push(resource);
    } else if (resource.type === 'image') {
      categorized.images.push(resource);
    } else if (resource.type === 'font') {
      categorized.fonts.push(resource);
    } else if (resource.type === 'media') {
      categorized.media.push(resource);
    } else {
      categorized.other.push(resource);
    }
  });

  return {
    all: resources,
    scripts: categorized.scripts,
    stylesheets: categorized.stylesheets,
    images: categorized.images,
    fonts: categorized.fonts,
    media: categorized.media,
    other: categorized.other,
    totalSize,
    totalRequests: resources.length
  };
}

/**
 * Analyze all links on the page
 */
async function analyzeLinks(page, baseUrl) {
  const links = await page.evaluate((base) => {
    const isExternal = (url) => {
      try {
        const linkUrl = new URL(url, base);
        const baseUrl = new URL(base);
        return linkUrl.hostname !== baseUrl.hostname;
      } catch {
        return false;
      }
    };

    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      url: a.href,
      text: a.textContent.trim().substring(0, 100),
      isExternal: isExternal(a.href),
      target: a.target,
      rel: a.rel
    }));
  }, baseUrl);

  // Check link status (sample first 50 to avoid too many requests)
  const linksToCheck = links.slice(0, 50);
  let brokenCount = 0;

  for (const link of linksToCheck) {
    try {
      const response = await axios.head(link.url, {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: () => true
      });
      
      link.status = response.status;
      link.isBroken = response.status >= 400;
      
      if (link.isBroken) brokenCount++;
      
      if (response.status >= 300 && response.status < 400) {
        link.redirectsTo = response.headers.location;
      }
    } catch (error) {
      link.isBroken = true;
      link.status = 0;
      brokenCount++;
    }
  }

  return {
    totalLinks: links.length,
    internalLinks: links.filter(l => !l.isExternal).length,
    externalLinks: links.filter(l => l.isExternal).length,
    brokenLinks: brokenCount,
    links: linksToCheck
  };
}

/**
 * Run Lighthouse audit
 */
async function runLighthouseAudit(url, isMobile = false) {
  const flags = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    formFactor: isMobile ? 'mobile' : 'desktop',
    screenEmulation: {
      mobile: isMobile,
      width: isMobile ? 375 : 1920,
      height: isMobile ? 667 : 1080,
      deviceScaleFactor: isMobile ? 2 : 1
    }
  };

  try {
    const result = await lighthouse(url, flags);
    const categories = result.lhr.categories;
    const audits = result.lhr.audits;

    return {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
      pwa: Math.round(categories.pwa.score * 100),
      metrics: {
        firstContentfulPaint: audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: audits['largest-contentful-paint'].numericValue,
        totalBlockingTime: audits['total-blocking-time'].numericValue,
        cumulativeLayoutShift: audits['cumulative-layout-shift'].numericValue,
        speedIndex: audits['speed-index'].numericValue,
        timeToInteractive: audits['interactive'].numericValue
      },
      opportunities: Object.values(audits)
        .filter(audit => audit.details?.type === 'opportunity' && audit.numericValue > 0)
        .map(audit => ({
          title: audit.title,
          description: audit.description,
          savings: audit.numericValue
        }))
        .slice(0, 10)
    };
  } catch (error) {
    console.error('Lighthouse error:', error.message);
    return null;
  }
}

/**
 * Compare two screenshots
 */
async function compareScreenshots(screenshot1Base64, screenshot2Base64) {
  const img1 = PNG.sync.read(Buffer.from(screenshot1Base64, 'base64'));
  const img2 = PNG.sync.read(Buffer.from(screenshot2Base64, 'base64'));

  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const percentageDiff = (numDiffPixels / totalPixels) * 100;

  return {
    pixelDiff: numDiffPixels,
    percentageDiff,
    totalPixels,
    diffImageBase64: PNG.sync.write(diff).toString('base64'),
    passed: percentageDiff < 5, // 5% threshold
    threshold: 5
  };
}

/**
 * Generate comparison summary
 */
function generateComparison(devData, prodData) {
  const comparison = {
    dom: {
      totalElementsDiff: prodData.dom.totalElements - devData.dom.totalElements,
      scriptsDiff: prodData.dom.scripts - devData.dom.scripts,
      stylesDiff: prodData.dom.styles - devData.dom.styles,
      imagesDiff: prodData.dom.images - devData.dom.images
    },
    seo: {
      titleMatch: devData.seo.title === prodData.seo.title,
      descriptionMatch: devData.seo.description === prodData.seo.description,
      h1Match: JSON.stringify(devData.seo.h1Texts) === JSON.stringify(prodData.seo.h1Texts)
    },
    performance: {},
    lighthouse: {}
  };

  if (devData.resources && prodData.resources) {
    comparison.resources = {
      totalSizeDiff: prodData.resources.totalSize - devData.resources.totalSize,
      totalRequestsDiff: prodData.resources.totalRequests - devData.resources.totalRequests
    };
  }

  if (devData.lighthouse && prodData.lighthouse) {
    comparison.lighthouse = {
      performanceDiff: prodData.lighthouse.performance - devData.lighthouse.performance,
      accessibilityDiff: prodData.lighthouse.accessibility - devData.lighthouse.accessibility,
      seoDiff: prodData.lighthouse.seo - devData.lighthouse.seo
    };
  }

  return comparison;
}

/**
 * Check thresholds and generate alerts
 */
function checkThresholds(results, thresholds) {
  const alerts = [];

  if (!results.comparison) return alerts;

  // HTML size difference
  if (thresholds.htmlSizeDiff && results.dev.html && results.prod.html) {
    const devSize = results.dev.html.length;
    const prodSize = results.prod.html.length;
    const diffPercent = Math.abs(((prodSize - devSize) / devSize) * 100);
    
    if (diffPercent > thresholds.htmlSizeDiff) {
      alerts.push({
        type: 'warning',
        category: 'Performance',
        message: `HTML size difference: ${diffPercent.toFixed(1)}% (threshold: ${thresholds.htmlSizeDiff}%)`
      });
    }
  }

  // Script count difference
  if (thresholds.scriptCountDiff) {
    const diff = Math.abs(results.comparison.dom.scriptsDiff);
    if (diff > thresholds.scriptCountDiff) {
      alerts.push({
        type: 'warning',
        category: 'DOM',
        message: `Script count difference: ${diff} (threshold: ${thresholds.scriptCountDiff})`
      });
    }
  }

  // Broken links
  if (thresholds.brokenLinksMax !== undefined && results.prod.links) {
    if (results.prod.links.brokenLinks > thresholds.brokenLinksMax) {
      alerts.push({
        type: 'error',
        category: 'Links',
        message: `Broken links found: ${results.prod.links.brokenLinks} (max allowed: ${thresholds.brokenLinksMax})`
      });
    }
  }

  // Lighthouse performance
  if (thresholds.lighthousePerformanceMin && results.prod.lighthouse) {
    if (results.prod.lighthouse.performance < thresholds.lighthousePerformanceMin) {
      alerts.push({
        type: 'error',
        category: 'Performance',
        message: `Lighthouse performance score: ${results.prod.lighthouse.performance} (minimum: ${thresholds.lighthousePerformanceMin})`
      });
    }
  }

  return alerts;
}

/**
 * Generate report in different formats
 */
function generateReport(results, format, outputPath) {
  if (format === 'html') {
    return generateHTMLReport(results);
  } else if (format === 'pdf') {
    return generatePDFReport(results, outputPath);
  }
  return JSON.stringify(results, null, 2);
}

function generateHTMLReport(results) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>URL Comparison Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .alert { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .alert.error { background: #ffebee; border-left: 4px solid #f44336; }
    .alert.warning { background: #fff3e0; border-left: 4px solid #ff9800; }
    .metric { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
    .score { font-size: 24px; font-weight: bold; color: #007bff; }
  </style>
</head>
<body>
  <div class="container">
    <h1>URL Comparison Report</h1>
    <p><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
    
    <div class="section">
      <h2>URLs</h2>
      <div class="metric"><span>Development:</span><span>${results.devUrl}</span></div>
      <div class="metric"><span>Production:</span><span>${results.prodUrl}</span></div>
    </div>

    ${results.alerts && results.alerts.length > 0 ? `
    <div class="section">
      <h2>Alerts</h2>
      ${results.alerts.map(alert => `
        <div class="alert ${alert.type}">
          <strong>[${alert.category}]</strong> ${alert.message}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="section">
      <h2>DOM Comparison</h2>
      <div class="comparison">
        <div>
          <h3>Development</h3>
          <div class="metric"><span>Total Elements:</span><span>${results.dev.dom.totalElements}</span></div>
          <div class="metric"><span>Scripts:</span><span>${results.dev.dom.scripts}</span></div>
          <div class="metric"><span>Styles:</span><span>${results.dev.dom.styles}</span></div>
          <div class="metric"><span>Images:</span><span>${results.dev.dom.images}</span></div>
        </div>
        <div>
          <h3>Production</h3>
          <div class="metric"><span>Total Elements:</span><span>${results.prod.dom.totalElements}</span></div>
          <div class="metric"><span>Scripts:</span><span>${results.prod.dom.scripts}</span></div>
          <div class="metric"><span>Styles:</span><span>${results.prod.dom.styles}</span></div>
          <div class="metric"><span>Images:</span><span>${results.prod.dom.images}</span></div>
        </div>
      </div>
    </div>

    ${results.prod.lighthouse ? `
    <div class="section">
      <h2>Lighthouse Scores</h2>
      <div class="comparison">
        <div>
          <h3>Development</h3>
          <div class="metric"><span>Performance:</span><span class="score">${results.dev.lighthouse.performance}</span></div>
          <div class="metric"><span>Accessibility:</span><span>${results.dev.lighthouse.accessibility}</span></div>
          <div class="metric"><span>SEO:</span><span>${results.dev.lighthouse.seo}</span></div>
        </div>
        <div>
          <h3>Production</h3>
          <div class="metric"><span>Performance:</span><span class="score">${results.prod.lighthouse.performance}</span></div>
          <div class="metric"><span>Accessibility:</span><span>${results.prod.lighthouse.accessibility}</span></div>
          <div class="metric"><span>SEO:</span><span>${results.prod.lighthouse.seo}</span></div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}

async function generatePDFReport(results, outputPath) {
  // This would require puppeteer to convert HTML to PDF
  const html = generateHTMLReport(results);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();
}

/**
 * Crawl multiple pages from sitemap
 */
async function crawlAndCompare(options) {
  const { devSitemapUrl, prodSitemapUrl, limit, outputDir } = options;

  // Fetch sitemaps
  const devUrls = await fetchSitemap(devSitemapUrl);
  const prodUrls = await fetchSitemap(prodSitemapUrl);

  const urlsToCompare = devUrls.slice(0, limit);
  const results = [];

  for (let i = 0; i < urlsToCompare.length; i++) {
    const devUrl = urlsToCompare[i];
    const prodUrl = prodUrls[i] || devUrl.replace(new URL(devSitemapUrl).origin, new URL(prodSitemapUrl).origin);

    console.log(`\n[${i + 1}/${urlsToCompare.length}] Comparing:`);
    console.log(`  Dev:  ${devUrl}`);
    console.log(`  Prod: ${prodUrl}`);

    try {
      const result = await analyzeURLs({
        devUrl,
        prodUrl,
        resourceTracking: true,
        verbose: false
      });
      
      results.push({
        url: devUrl,
        status: 'success',
        comparison: result.comparison
      });
    } catch (error) {
      results.push({
        url: devUrl,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Save results
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'crawl-results.json'),
    JSON.stringify(results, null, 2)
  );

  return {
    completed: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    results
  };
}

async function fetchSitemap(sitemapUrl) {
  const response = await axios.get(sitemapUrl);
  const xml = await parseXml(response.data);
  
  const urls = [];
  if (xml.urlset && xml.urlset.url) {
    xml.urlset.url.forEach(entry => {
      if (entry.loc && entry.loc[0]) {
        urls.push(entry.loc[0]);
      }
    });
  }
  
  return urls;
}

module.exports = {
  analyzeURLs,
  analyzeURL,
  processResources,
  analyzeLinks,
  runLighthouseAudit,
  compareScreenshots,
  generateComparison,
  checkThresholds,
  generateReport,
  crawlAndCompare,
  fetchSitemap
};
