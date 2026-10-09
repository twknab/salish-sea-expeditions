// Every station of the Godot export, each from its check URL, each in a fresh page: the sweep that
// catches a script error in a screen no single-scene smoke opens. A page error or a GDScript error
// anywhere fails the run; the screenshots land in tests/smoke/out for the eye.
//   PORT=4190 WAIT=12000 node tests/smoke/godot-stations.mjs build/web
import { chromium } from 'playwright';
import { createServer } from '../../server/server.mjs';
const root = process.argv[2] || 'build/web';
const port = +(process.env.PORT || 4190);
const wait = +(process.env.WAIT || 12000);
const STATIONS = [
  ['title', ''],
  ['about', '?about=1'],
  ['acknowledgment', '?scene=acknowledgment'],
  ['outfit', '?scene=outfit'],
  ['ferry', '?scene=ferry&at=0.3'],
  ['ferry-home', '?scene=ferry&home=1&at=0.3&view=rail'],
  ['assemble', '?scene=assemble&step=3'],
  ['school-drill', '?scene=school&drill=rescue'],
  ['school-compass', '?scene=school&drill=compass'],
  ['pack', '?scene=pack&pack=ideal'],
  ['plan', '?scene=plan&step=1'],
  ['trip', '?scene=trip'],
  ['trip-ferry', '?scene=trip&near=ferry'],
  ['trip-whales', '?scene=trip&leg=1&near=orcas&close=1'],
  ['trip-fleet', '?scene=trip&leg=1&near=fleet'],
  ['trip-wind', '?scene=trip&launch=15'],
  ['trip-september', '?scene=trip&day=september&launch=13'],
  ['trip-dark', '?scene=trip&day=september&hour=20&near=jones'],
  ['trip-squall', '?scene=trip&day=september&hour=14&near=jones'],
  ['trip-capsize', '?scene=trip&capsize=1'],
  ['trip-fog', '?scene=trip&leg=2&launch=6&near=ferry&fog=1'],
  ['trip-fog-lifts', '?scene=trip&leg=2&launch=6&fog=lift'],
  ['camp-night', '?scene=camp&step=4&glow=1'],
  ['camp-floated', '?scene=camp&step=4&boat=edge'],
  ['camp-raccoons', '?scene=camp&step=2&food=tent'],
  ['camp-water', '?scene=camp&leg=1&step=1&water=fill'],
  ['takeout', '?scene=camp&leg=2&step=1'],
  ['takeout-close', '?scene=camp&leg=2&step=3&close=forgot'],
  ['debrief', '?scene=debrief&demo=1'],
  ['debrief-chart', '?scene=debrief&demo=1&at=chart'],
  ['guide', '?scene=guide&at=credits'],
];
const only = (process.env.ONLY || '').split(',').filter(Boolean);
const concurrency = Math.max(1, +(process.env.CONCURRENCY || 3)); // pages at once: the sweep is a wait, not a load
const server = createServer(root);
await new Promise((r) => server.listen(port, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const queue = STATIONS.filter(([name]) => !only.length || only.includes(name));
let failed = 0;
async function visit([name, url]) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 730 } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:${port}/${url}`);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `tests/smoke/out/station-${name}.png`, timeout: 90000 }).catch((e) => logs.push('pageerror: screenshot ' + e.message));
  const bad = logs.filter((l) => /^pageerror:|SCRIPT ERROR|USER ERROR|SHADER ERROR/.test(l));
  console.log(`${name.padEnd(14)} ${bad.length ? 'ERRORS' : 'ok'}  ${url}`);
  for (const l of bad) console.log('   ' + l);
  if (bad.length) failed++;
  await page.close();
}
// A small pool: each worker takes the next station until the queue is empty, so a slow page does
// not hold the others, and the order of the report is the order of finishing.
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
  while (queue.length) await visit(queue.shift());
}));
await browser.close();
server.close();
if (failed) { console.error(`${failed} station(s) with errors`); process.exit(1); }
