const http = require('http');
const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'frontend', 'build');
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html';
  if (file.endsWith('.js')) return 'application/javascript';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.json')) return 'application/json';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(buildDir, decodeURIComponent(urlPath));

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // fallback to index.html for SPA routes
      const index = path.join(buildDir, 'index.html');
      fs.readFile(index, (e, data) => {
        if (e) {
          res.writeHead(500);
          res.end('Build not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Serving frontend build at http://localhost:${port}`);
});
