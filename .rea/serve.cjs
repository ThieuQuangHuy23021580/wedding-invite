const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || 5174);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

http
  .createServer((req, res) => {
    let url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (url === '/' || url === '') url = '/index.html';
    const file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) return res.writeHead(403).end('403');
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404');
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log('serving on', PORT));
