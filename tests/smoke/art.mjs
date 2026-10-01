// Dev helper: screenshot the 3D art preview page. node tests/smoke/art.mjs out.png [query] [width]
import { chromium } from 'playwright';
const [,, out = 'tests/smoke/out/art.png', q = '', width = '1100'] = process.argv;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +width, height: 900 }, deviceScaleFactor: 2 });
const logs = [];
p.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await p.goto(`http://localhost:5173/tools/art-preview.html${q ? `?${q}` : ''}`);
await p.waitForFunction(() => window.done === true, null, { timeout: 120000 }).catch(() => logs.push('timeout'));
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
console.log(logs.filter((l) => !/GPU stall|Automatic fallback/.test(l)).slice(0, 20).join('\n'));
await b.close();
