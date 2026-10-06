// Smoke the Godot web export: serve build/web with the production server, load it in headless
// Chromium (SwiftShader WebGL2), wait for the engine to start, and screenshot.
//   node tests/smoke/godot-shot.mjs [out.png] [waitMs]
import { chromium } from 'playwright';
import { createServer } from '../../server/server.mjs';
const [,, out = 'tests/smoke/out/godot.png', wait = '20000'] = process.argv;
const server = createServer('build/web');
await new Promise((r) => server.listen(4175, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto('http://localhost:4175/');
await page.waitForTimeout(+wait);
if (process.env.ACTIONS) {
  for (const a of JSON.parse(process.env.ACTIONS)) {
    if (a.swipe) {
      const [x1, y1, x2, y2, ms = 400] = a.swipe;
      await page.mouse.move(x1, y1); await page.mouse.down();
      const n = 12;
      for (let i = 1; i <= n; i++) { await page.mouse.move(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n); await page.waitForTimeout(ms / n); }
      await page.mouse.up();
    }
    if (a.key) await page.keyboard.press(a.key);
    if (a.wait) await page.waitForTimeout(a.wait);
    if (a.shot) await page.screenshot({ path: a.shot });
  }
}
await page.screenshot({ path: out });
const bad = logs.filter((l) => /error|pageerror/i.test(l) && !/GPU stall|WebGL warning|deprecated/i.test(l));
console.log(logs.slice(0, 20).join('\n'));
await browser.close();
server.close();
if (bad.length) { console.error('errors:\n' + bad.join('\n')); process.exit(1); }
console.log('ok');
