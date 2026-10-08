// The export in a wide desktop window (no touch), as the owner sees it in the artifact panel.
import { chromium } from 'playwright';
import { createServer } from '../../server/server.mjs';
const server = createServer(process.argv[2] || 'build/web');
await new Promise((r) => server.listen(+(process.env.PORT || 4178), r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1400), H = +(process.env.H || 730), DPR = +(process.env.DPR || 1), MOBILE = process.env.MOBILE === '1';
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: MOBILE, hasTouch: MOBILE });
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${process.env.PORT || 4178}/` + (process.argv[3] || ''));
await page.waitForTimeout(+(process.env.WAIT || 25000));
// KEYS="w:12000,a:3000" holds keys for that many ms (in sequence) before the shot: a paddling check.
for (const spec of (process.env.KEYS || '').split(',').filter(Boolean)) {
  const [key, ms] = spec.split(':');
  await page.mouse.click(W / 2, H * 0.08); // focus the canvas, above the water (a click on it would be a tap stroke)
  await page.keyboard.down(key); await page.waitForTimeout(+ms || 1000); await page.keyboard.up(key);
}
await page.screenshot({ path: process.env.OUT || 'tests/smoke/out/godot-desktop.png', timeout: 90000 });
console.log((process.env.LOGS === 'all' ? logs : logs.filter((l) => /error|ERROR|warn/i.test(l)).slice(0, 20)).join('\n'));
await browser.close(); server.close();
// A page error or a GDScript error is a failed build, not a note in a log nobody reads.
const bad = logs.filter((l) => /^pageerror:|SCRIPT ERROR|USER ERROR|SHADER ERROR/.test(l));
if (bad.length) { console.error(`${bad.length} error(s) in the page:\n` + bad.slice(0, 10).join('\n')); process.exit(1); }
