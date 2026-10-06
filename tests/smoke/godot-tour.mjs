// Screenshot every opening scene of the Godot export via ?scene=, with a few taps where a screen
// pages. One browser per scene so a stall in one does not hide the others.
//   node tests/smoke/godot-tour.mjs [waitMs]
import { chromium } from 'playwright';
import { createServer } from '../../server/server.mjs';
const wait = +(process.argv[2] || 25000);
const server = createServer('build/web');
await new Promise((r) => server.listen(4177, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// Buttons sit at the bottom-right of the card; "Next" is the rightmost. Tap points are CSS px.
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const TOURS_ALL = {
  title: [],
  acknowledgment: [{ tap: [330, 700] }, { wait: 1500 }],
  outfit: [{ shot: 'outfit-0' }, { tap: [340, 760] }, { wait: 1500 }, { shot: 'outfit-1' }, { tap: [340, 760] }, { wait: 1200 }, { tap: [340, 760] }, { wait: 1200 }, { tap: [340, 760] }, { wait: 1200 }, { tap: [340, 760] }, { wait: 1500 }, { shot: 'outfit-5' }, { tap: [340, 760] }, { wait: 1500 }],
  ferry: [{ wait: 6000 }],
  school: [{ tap: [340, 770] }, { wait: 1500 }, { tap: [340, 770] }, { wait: 2500 }],
  trip: [{ swipe: [100, 660, 100, 757, 400] }, { wait: 2500 }],
};
const TOURS = Object.fromEntries(Object.entries(TOURS_ALL).filter(([k]) => !ONLY.length || ONLY.includes(k)));
let failed = 0;
for (const [scene, steps] of Object.entries(TOURS)) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:4177/?scene=${scene}`);
  await page.waitForTimeout(wait);
  for (const a of steps) {
    if (a.tap) { await page.mouse.move(a.tap[0], a.tap[1]); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); }
    if (a.wait) await page.waitForTimeout(a.wait);
    if (a.shot) await page.screenshot({ path: `tests/smoke/out/godot-${a.shot}.png`, timeout: 90000 }).catch(() => {});
    if (a.swipe) { const [x1, y1, x2, y2, ms] = a.swipe; await page.mouse.move(x1, y1); await page.mouse.down(); for (let i = 1; i <= 12; i++) { await page.mouse.move(x1 + ((x2 - x1) * i) / 12, y1 + ((y2 - y1) * i) / 12); await page.waitForTimeout(ms / 12); } await page.mouse.up(); }
  }
  await page.screenshot({ path: `tests/smoke/out/godot-${scene}.png`, timeout: 90000 }).catch((e) => logs.push('[pageerror] screenshot ' + e.message));
  const bad = logs.filter((l) => /SCRIPT ERROR|pageerror|ERROR:/.test(l));
  console.log(`${scene}: ${bad.length ? 'ERRORS' : 'ok'}`);
  for (const l of bad.slice(0, 6)) console.log('   ' + l);
  if (bad.length) failed++;
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
