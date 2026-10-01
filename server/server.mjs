// Production server: serves the built game from dist/. No dependencies, no server-side data.
//   GET /health  -> "ok"
//   GET /*       -> static files; unknown paths fall back to index.html
import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg',
};
const ZIP = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt']);

export function createServer(root) {
  const ROOT = path.resolve(root);
  async function serveStatic(req, res) {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
    let file = path.join(ROOT, p);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
    let st = await stat(file).catch(() => null);
    if (!st || st.isDirectory()) { file = path.join(ROOT, 'index.html'); st = await stat(file); p = '/index.html'; }
    const ext = path.extname(file);
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Hashed build assets never change; everything else (HTML, sw.js, manifest) must revalidate.
      'Cache-Control': p.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    };
    if (ZIP.has(ext) && st.size > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
      if (req.method === 'HEAD') return res.end();
      return createReadStream(file).pipe(createGzip()).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  }
  return http.createServer((req, res) => {
    if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); return res.end('ok'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    serveStatic(req, res).catch((e) => { console.error(e); if (!res.headersSent) res.writeHead(500); res.end(); });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = +process.env.PORT || 8080;
  createServer(process.env.STATIC_DIR || 'dist').listen(port, () => console.log(`salish-sea-expeditions on :${port}`));
}
