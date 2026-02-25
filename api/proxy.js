// Vercel Serverless Function for CORS Proxy
// This file is ONLY used in production (Vercel)
// Development uses src/setupProxy.js instead

const fetch = require('node-fetch');

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
  
  console.log(`🔄 [Vercel] Proxying: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // For images, CSS, JS - return as buffer
    if (contentType.includes('image/') || 
        contentType.includes('text/css') || 
        contentType.includes('javascript') ||
        contentType.includes('font')) {
      const buffer = await response.buffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(buffer);
    }
    
    // For text content
    const text = await response.text();
    res.setHeader('Content-Type', contentType);
    res.send(text);
    
  } catch (error) {
    console.error(`❌ Proxy error: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      url
    });
  }
};
