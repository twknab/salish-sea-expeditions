// Smoke test (tasks.md T038): build must exist (npm run build). Serves dist/, opens every scene at
// iPhone size in headless Chromium, fails on any page error, and saves a screenshot per scene.
// Frame rates here come from software rendering and say nothing about a phone.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  try { res.writeHead(200, { 'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
mkdirSync('tests/smoke/out', { recursive: true });

const SCENES = ['', 'Acknowledgment', 'StartChoice', 'Ferry', 'BoatSchool', 'Paddle&mode=school', 'Assembly', 'Packing', 'Planning', 'Paddle&mode=trip', 'Camp', 'TidePools', 'Debrief', 'FieldGuide', 'Credits', 'About'];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = 0;
for (const q of SCENES) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/${q ? `?scene=${q}` : ''}`);
  await page.waitForTimeout(3500);
  const name = (q || 'Title').replace('&mode=', '-');
  await page.screenshot({ path: `tests/smoke/out/${name}.png` });
  const active = await page.evaluate(() => window.__sse?.scene.getScenes(true).map((s) => s.sys.settings.key));
  const ok = errors.length === 0 && active?.length;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(16)} ${active?.join(',') ?? ''} ${errors.slice(0, 2).join(' | ')}`);
  await page.close();
}
await browser.close();
server.close();
if (failed) { console.error(`${failed} scene(s) failed`); process.exit(1); }
