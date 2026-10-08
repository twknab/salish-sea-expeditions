import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../server/server.mjs';
import { precompress } from '../server/precompress.mjs';

let server, base;
before(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sse-'));
  mkdirSync(path.join(dir, 'assets'));
  writeFileSync(path.join(dir, 'index.html'), `<!doctype html><title>t</title>${'x'.repeat(2000)}`);
  writeFileSync(path.join(dir, 'assets', 'app-abc.js'), `console.log(1);${' '.repeat(3000)}`);
  writeFileSync(path.join(dir, 'sw.js'), 'self');
  writeFileSync(path.join(dir, 'game.wasm'), Buffer.alloc(50000, 7));
  precompress(dir);
  server = createServer(dir).listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('health answers ok', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'ok');
});

test('hashed assets are immutable and gzipped; HTML and the service worker revalidate', async () => {
  const a = await fetch(`${base}/assets/app-abc.js`, { headers: { 'accept-encoding': 'gzip' } });
  assert.match(a.headers.get('cache-control'), /immutable/);
  assert.equal(a.headers.get('content-encoding'), 'gzip');
  const h = await fetch(`${base}/`);
  assert.equal(h.headers.get('cache-control'), 'no-cache');
  const s = await fetch(`${base}/sw.js`);
  assert.equal(s.headers.get('cache-control'), 'no-cache');
  assert.equal(h.headers.get('x-content-type-options'), 'nosniff');
});

test('unknown paths fall back to the game; traversal is refused', async () => {
  const r = await fetch(`${base}/some/deep/link`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<title>t<\/title>/);
  const t = await fetch(`${base}/..%2f..%2fetc%2fpasswd`);
  assert.equal(t.status, 403);
});

test('a precompressed sibling is served with its encoding; without one, gzip on the fly', async () => {
  const br = await fetch(`${base}/game.wasm`, { headers: { 'accept-encoding': 'br, gzip' } });
  assert.equal(br.headers.get('content-encoding'), 'br');
  assert.equal(br.headers.get('content-type'), 'application/wasm');
  assert.ok(+br.headers.get('content-length') < 50000, 'the brotli file is what went over the wire');
  assert.equal((await br.arrayBuffer()).byteLength, 50000, 'and it decodes to the original');
  const gz = await fetch(`${base}/game.wasm`, { headers: { 'accept-encoding': 'gzip' } });
  assert.equal(gz.headers.get('content-encoding'), 'gzip');
  assert.ok(gz.headers.get('content-length'), 'the gzip sibling has a known length');
  const raw = await fetch(`${base}/game.wasm`, { headers: { 'accept-encoding': 'identity' } });
  assert.equal(raw.headers.get('content-encoding'), null);
  assert.equal(raw.headers.get('content-length'), '50000');
});

test('every file carries an ETag and revalidates to a 304', async () => {
  const first = await fetch(`${base}/game.wasm`);
  const etag = first.headers.get('etag');
  assert.ok(etag, 'ETag present');
  const again = await fetch(`${base}/game.wasm`, { headers: { 'if-none-match': etag } });
  assert.equal(again.status, 304);
});

test('only GET and HEAD', async () => {
  const r = await fetch(`${base}/`, { method: 'POST' });
  assert.equal(r.status, 405);
});
