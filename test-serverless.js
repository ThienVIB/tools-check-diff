// Test serverless functions locally without Vercel CLI
const http = require('http');
const handler = require('./api/render.js');

const PORT = 3002;

const server = http.createServer(async (req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  // Mock Vercel request/response
  const mockReq = {
    method: req.method,
    url: req.url,
    query: {}
  };
  
  // Parse query string
  const urlParts = req.url.split('?');
  if (urlParts[1]) {
    urlParts[1].split('&').forEach(param => {
      const [key, value] = param.split('=');
      mockReq.query[key] = decodeURIComponent(value || '');
    });
  }
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.setHeader('Content-Type', 'application/json');
      res.writeHead(this.statusCode, this.headers);
      res.end(JSON.stringify(data));
    },
    send(data) {
      res.writeHead(this.statusCode, this.headers);
      res.end(data);
    },
    end() {
      res.end();
    }
  };
  
  try {
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`
🚀 Test server running on http://localhost:${PORT}

Test URLs:
- http://localhost:${PORT}/?url=https://www.vib.com.vn
- http://localhost:${PORT}/?url=https://pws-dev.vib.com.vn

Press Ctrl+C to stop
  `);
});
