// Render the PNG app icons from public/icons/icon.svg (one mark, everywhere).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
for (const size of [180, 192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: `public/icons/icon-${size}.png`, omitBackground: true });
  await page.close();
}
await browser.close();
