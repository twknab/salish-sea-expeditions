// Dev helper: screenshot a scene at iPhone size. node tests/smoke/shot.mjs "Paddle&mode=trip" out.png [waitMs] [script]
import { chromium } from 'playwright';
const [,, q = '', out = 'tests/smoke/out/shot.png', wait = '3000'] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const url = `http://localhost:4173/${q ? `?scene=${q}` : ''}`;
await page.goto(url);
await page.waitForTimeout(+wait);
if (process.env.ACTIONS) {
  for (const a of JSON.parse(process.env.ACTIONS)) {
    if (a.tap) await page.touchscreen.tap(a.tap[0], a.tap[1]);
    if (a.click) { await page.mouse.move(a.click[0], a.click[1]); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); }
    if (a.wait) await page.waitForTimeout(a.wait);
    if (a.key) await page.keyboard.press(a.key);
    if (a.swipe) {
      const [x1, y1, x2, y2, ms = 400] = a.swipe;
      await page.mouse.move(x1, y1); await page.mouse.down();
      const n = 12;
      for (let i = 1; i <= n; i++) { await page.mouse.move(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n); await page.waitForTimeout(ms / n); }
      await page.mouse.up();
    }
    if (a.eval) logs.push('eval: ' + JSON.stringify(await page.evaluate(a.eval)));
    if (a.shot) await page.screenshot({ path: a.shot });
  }
}
await page.screenshot({ path: out });
const fps = await page.evaluate(() => window.__sse?.loop?.actualFps);
console.log('fps', fps?.toFixed?.(1));
console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 30).join('\n'));
await browser.close();
