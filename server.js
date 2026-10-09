const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Health check endpoint for external pingers or self-ping
  if (req.url === '/ping' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('pong');
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Fallback to index.html
      fs.readFile(path.join(__dirname, 'index.html'), (err2, fallback) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallback);
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Automatic self-ping for Render Web Service (uses Render's built-in RENDER_EXTERNAL_URL env var)
const siteUrl = process.env.RENDER_EXTERNAL_URL;
if (siteUrl) {
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes (prevents 15-minute spin-down)
  setInterval(() => {
    const pingTarget = `${siteUrl}/ping`;
    const client = pingTarget.startsWith('https') ? https : http;
    client.get(pingTarget, (res) => {
      console.log(`[Keep-Alive] Self-ping status: ${res.statusCode} at ${new Date().toLocaleTimeString()}`);
    }).on('error', (err) => {
      console.log('[Keep-Alive Note]:', err.message);
    });
  }, PING_INTERVAL);
  console.log(`[Keep-Alive] Scheduled self-ping for ${siteUrl} every 10 minutes.`);
}
