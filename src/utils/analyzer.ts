import { DOMData, SEOData, PerformanceData } from '../types';

export const analyzeHTML = (html: string, url: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const domData = analyzeDOMStructure(doc);
  const seoData = analyzeSEO(doc, url);
  const performanceData = analyzePerformance(html, domData);

  return { dom: domData, seo: seoData, performance: performanceData };
};

const analyzeDOMStructure = (doc: Document): DOMData => {
  const allElements = doc.querySelectorAll('*');
  const scripts = doc.querySelectorAll('script');
  const styles = doc.querySelectorAll('style, link[rel="stylesheet"]');
  const images = doc.querySelectorAll('img');
  const links = doc.querySelectorAll('a');
  const forms = doc.querySelectorAll('form');
  const metas = doc.querySelectorAll('meta');

  const h1Elements = doc.querySelectorAll('h1');
  const h1Texts = Array.from(h1Elements).map(h => h.textContent?.trim() || '');

  // Extract detailed script info
  const detailedScripts = Array.from(scripts).map(script => ({
    src: script.getAttribute('src') || undefined,
    content: script.src ? undefined : script.textContent?.substring(0, 100),
    attributes: {
      async: script.async ? 'true' : 'false',
      defer: script.defer ? 'true' : 'false',
      type: script.type || 'text/javascript',
    }
  }));

  // Extract detailed styles info
  const detailedStyles = Array.from(styles).map(style => ({
    href: style.getAttribute('href') || undefined,
    content: style.tagName === 'STYLE' ? style.textContent?.substring(0, 100) : undefined,
    attributes: {
      rel: style.getAttribute('rel') || '',
      media: style.getAttribute('media') || 'all',
    }
  }));

  // Extract detailed images info
  const detailedImages = Array.from(images).map(img => ({
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '(no alt)',
    attributes: {
      width: img.getAttribute('width') || 'auto',
      height: img.getAttribute('height') || 'auto',
      loading: img.getAttribute('loading') || 'eager',
    }
  }));

  // Extract detailed links info
  const detailedLinks = Array.from(links).map(link => ({
    href: link.getAttribute('href') || '',
    text: link.textContent?.trim().substring(0, 50) || '(empty)',
    attributes: {
      target: link.getAttribute('target') || '_self',
      rel: link.getAttribute('rel') || '',
    }
  }));

  // Extract meta tags info
  const detailedMetas = Array.from(metas).map(meta => ({
    attributes: {
      name: meta.getAttribute('name') || meta.getAttribute('property') || '',
      content: meta.getAttribute('content') || '',
      charset: meta.getAttribute('charset') || '',
    }
  }));

  // Extract detailed headings info (H1-H6)
  const detailedHeadings: any[] = [];
  for (let level = 1; level <= 6; level++) {
    const headings = doc.querySelectorAll(`h${level}`);
    Array.from(headings).forEach(heading => {
      detailedHeadings.push({
        level: level as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading.textContent?.trim() || '(empty)',
        id: heading.id || undefined,
        className: heading.className || undefined,
      });
    });
  }

  return {
    totalElements: allElements.length,
    scripts: scripts.length,
    styles: styles.length,
    images: images.length,
    links: links.length,
    forms: forms.length,
    headings: {
      h1: doc.querySelectorAll('h1').length,
      h2: doc.querySelectorAll('h2').length,
      h3: doc.querySelectorAll('h3').length,
      h4: doc.querySelectorAll('h4').length,
      h5: doc.querySelectorAll('h5').length,
      h6: doc.querySelectorAll('h6').length,
    },
    h1Texts,
    detailedScripts,
    detailedStyles,
    detailedImages,
    detailedLinks,
    detailedMetas,
    detailedHeadings,
  };
};

const analyzeSEO = (doc: Document, url: string): SEOData => {
  const getMetaContent = (name: string): string => {
    const meta = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta?.getAttribute('content') || '';
  };

  const title = doc.querySelector('title')?.textContent || '';
  const description = getMetaContent('description');
  const keywords = getMetaContent('keywords');
  const ogTitle = getMetaContent('og:title');
  const ogDescription = getMetaContent('og:description');
  const ogImage = getMetaContent('og:image');
  const ogUrl = getMetaContent('og:url');

  const h1Elements = doc.querySelectorAll('h1');
  const h1Count = h1Elements.length;
  const h1Texts = Array.from(h1Elements).map(h => h.textContent?.trim() || '');

  // Extract structured data (JSON-LD)
  const structuredData: any[] = [];
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      structuredData.push(data);
    } catch (e) {
      // Invalid JSON-LD
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];
  
  // Title analysis
  if (!title) {
    recommendations.push('❌ CRITICAL: Missing page title - Add <title> tag');
  } else {
    if (title.length < 30) recommendations.push(`⚠️ Title too short (${title.length} chars). Recommended: 30-60 chars`);
    else if (title.length > 60) recommendations.push(`⚠️ Title too long (${title.length} chars). Recommended: 30-60 chars`);
    else recommendations.push(`✅ Title length optimal (${title.length} chars)`);
  }
  
  // Description analysis
  if (!description) {
    recommendations.push('❌ CRITICAL: Missing meta description - Add <meta name="description">');  
  } else {
    if (description.length < 120) recommendations.push(`⚠️ Description too short (${description.length} chars). Recommended: 120-160 chars`);
    else if (description.length > 160) recommendations.push(`⚠️ Description too long (${description.length} chars). Recommended: 120-160 chars`);
    else recommendations.push(`✅ Description length optimal (${description.length} chars)`);
  }
  
  // H1 analysis
  if (h1Count === 0) {
    recommendations.push('❌ CRITICAL: No H1 tag found - Add one H1 per page');
  } else if (h1Count > 1) {
    recommendations.push(`⚠️ Multiple H1 tags found (${h1Count}). Best practice: Use only 1 H1 per page`);
  } else {
    recommendations.push('✅ Single H1 tag (best practice)');
  }

  // Open Graph analysis
  if (!ogTitle && !ogDescription && !ogImage) {
    recommendations.push('⚠️ No Open Graph tags - Add for better social media sharing');
  } else {
    if (!ogTitle) recommendations.push('⚠️ Missing Open Graph title (og:title)');
    if (!ogDescription) recommendations.push('⚠️ Missing Open Graph description (og:description)');
    if (!ogImage) recommendations.push('⚠️ Missing Open Graph image (og:image)');
    if (ogTitle && ogDescription && ogImage) recommendations.push('✅ Complete Open Graph tags');
  }

  // Canonical URL
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!canonical) recommendations.push('⚠️ Missing canonical URL - Add <link rel="canonical">');
  else recommendations.push('✅ Canonical URL present');

  // Structured data analysis
  if (structuredData.length === 0) {
    recommendations.push('💡 ENHANCEMENT: Add structured data (JSON-LD) for rich snippets');
  } else {
    recommendations.push(`✅ ${structuredData.length} structured data item(s) found`);
  }
  
  // Viewport meta tag
  const viewport = doc.querySelector('meta[name="viewport"]');
  if (!viewport) recommendations.push('⚠️ Missing viewport meta tag for mobile optimization');
  else recommendations.push('✅ Viewport meta tag present');
  
  // Robots meta
  const robots = getMetaContent('robots');
  if (robots.includes('noindex') || robots.includes('nofollow')) {
    recommendations.push(`⚠️ Robots meta: ${robots} - Page may not be indexed`);
  }

  return {
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    h1Count,
    h1Texts,
    structuredData,
    recommendations,
  };
};

const analyzePerformance = (html: string, domData: DOMData): PerformanceData => {
  const htmlSize = new Blob([html]).size;
  const totalResources = domData.scripts + domData.styles + domData.images;

  // Calculate performance score (0-100)
  let score = 100;
  
  // Penalize for large HTML size
  if (htmlSize > 500000) score -= 20; // > 500KB
  else if (htmlSize > 200000) score -= 10; // > 200KB
  else if (htmlSize > 100000) score -= 5; // > 100KB

  // Penalize for too many resources
  if (totalResources > 100) score -= 20;
  else if (totalResources > 50) score -= 10;
  else if (totalResources > 30) score -= 5;

  // Penalize for too many scripts
  if (domData.scripts > 20) score -= 10;
  else if (domData.scripts > 10) score -= 5;

  score = Math.max(0, score);

  // Generate detailed recommendations
  const recommendations: string[] = [];
  
  // HTML Size analysis
  if (htmlSize > 500000) {
    recommendations.push(`❌ CRITICAL: Very large HTML (${(htmlSize / 1024).toFixed(2)} KB). Minify HTML and remove unused code.`);
  } else if (htmlSize > 200000) {
    recommendations.push(`⚠️ Large HTML size (${(htmlSize / 1024).toFixed(2)} KB). Consider minification.`);
  } else if (htmlSize > 100000) {
    recommendations.push(`💡 HTML size (${(htmlSize / 1024).toFixed(2)} KB) is acceptable but could be optimized.`);
  } else {
    recommendations.push(`✅ Good HTML size (${(htmlSize / 1024).toFixed(2)} KB)`);
  }

  // Scripts analysis
  if (domData.scripts > 20) {
    recommendations.push(`❌ Too many scripts (${domData.scripts}). Bundle & minify JavaScript. Use code splitting.`);
  } else if (domData.scripts > 10) {
    recommendations.push(`⚠️ Many scripts (${domData.scripts}). Consider bundling/minification and async/defer loading.`);
  } else if (domData.scripts > 5) {
    recommendations.push(`💡 ${domData.scripts} scripts. Ensure they use async/defer attributes.`);
  } else {
    recommendations.push(`✅ Good number of scripts (${domData.scripts})`);
  }

  // Images analysis
  if (domData.images > 50) {
    recommendations.push(`❌ Too many images (${domData.images}). Implement lazy loading and use modern formats (WebP, AVIF).`);
  } else if (domData.images > 20) {
    recommendations.push(`⚠️ Many images (${domData.images}). Use lazy loading, responsive images (srcset), and WebP format.`);
  } else if (domData.images > 10) {
    recommendations.push(`💡 ${domData.images} images. Consider lazy loading for below-fold images.`);
  } else {
    recommendations.push(`✅ Good number of images (${domData.images})`);
  }

  // Styles analysis
  if (domData.styles > 10) {
    recommendations.push(`❌ Too many stylesheets (${domData.styles}). Combine and minify CSS. Use critical CSS.`);
  } else if (domData.styles > 5) {
    recommendations.push(`⚠️ Multiple stylesheets (${domData.styles}). Consider combining CSS and inlining critical styles.`);
  } else if (domData.styles > 2) {
    recommendations.push(`💡 ${domData.styles} stylesheets. Inline critical CSS for faster rendering.`);
  } else {
    recommendations.push(`✅ Good number of stylesheets (${domData.styles})`);
  }

  // Additional performance tips
  if (score < 80) {
    recommendations.push('💡 TIPS: Enable compression (gzip/brotli), use CDN, implement browser caching.');
  }
  
  if (totalResources > 50) {
    recommendations.push('💡 Consider HTTP/2 for better resource loading or reduce total resource count.');
  }

  // Overall performance
  if (score >= 90) {
    recommendations.push('✅ Overall performance: Excellent! Keep it up.');
  } else if (score >= 80) {
    recommendations.push('✅ Overall performance: Very Good. Minor optimizations possible.');
  } else if (score >= 60) {
    recommendations.push('⚠️ Overall performance: Good, but significant improvements recommended.');
  } else if (score >= 40) {
    recommendations.push('⚠️ Overall performance: Fair. Multiple optimizations needed.');
  } else {
    recommendations.push('❌ Overall performance: Poor. Critical optimizations required.');
  }

  return {
    htmlSize,
    resourceCounts: {
      scripts: domData.scripts,
      styles: domData.styles,
      images: domData.images,
      total: totalResources,
    },
    score,
    recommendations,
  };
};
