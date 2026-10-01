// Rasterise the chart's islands (and kelp) into a texture the world shader reads.
// R = shoreline (lightly blurred land), G = nearness to land (widely blurred, for shallows and
// shore light), B = kelp beds. Row 0 is the north edge.
import { ISLANDS, KELP } from '../content/chart.js';

export const MASK = { res: 6, pad: 1200 }; // metres per pixel; padding around the chart bounds

function boxBlur(src, w, h, r, passes) {
  let a = src, b = new Float32Array(w * h);
  for (let p = 0; p < passes; p++) {
    // Horizontal
    for (let y = 0; y < h; y++) {
      let acc = 0; const row = y * w;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / (2 * r + 1);
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    // Vertical
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * r + 1);
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

// Deterministic fractal coastline: subdivide each edge and push midpoints in or out, so simplified
// polygons draw as natural shores. Visual only — at most a few tens of metres from the sim's line.
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function roughen(poly, seed, depth = 5, amp = 0.085) {
  let pts = poly.map((p) => ({ x: p.x, y: p.y }));
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = -(b.y - a.y) / (len || 1), ny = (b.x - a.x) / (len || 1);
      const off = (hash(seed + d * 1000 + i * 7.3) - 0.5) * 2 * amp * Math.min(len, 400);
      out.push(a, { x: (a.x + b.x) / 2 + nx * off, y: (a.y + b.y) / 2 + ny * off });
    }
    pts = out;
    amp *= 0.62;
  }
  return pts;
}

/** Build the mask canvas for a world rectangle {minX,minY,maxX,maxY}. */
export function buildLandMask(bounds) {
  const { res, pad } = MASK;
  const minX = bounds.minX - pad, maxX = bounds.maxX + pad;
  const minY = bounds.minY - pad, maxY = bounds.maxY + pad;
  const w = Math.ceil((maxX - minX) / res), h = Math.ceil((maxY - minY) / res);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const toPx = (p) => [(p.x - minX) / res, (maxY - p.y) / res];

  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  ISLANDS.forEach((is, n) => {
    g.beginPath();
    roughen(is.poly, n * 97 + 13).forEach((p, i) => { const [x, y] = toPx(p); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath(); g.fill();
  });
  const land = g.getImageData(0, 0, w, h).data;
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = land[i * 4] / 255;
  const sharp = boxBlur(L.slice(), w, h, 2, 2);
  const wide = boxBlur(L.slice(), w, h, 9, 3);

  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  for (const k of KELP) {
    const [x, y] = toPx(k);
    const rg = g.createRadialGradient(x, y, 0, x, y, k.r / res);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.7, 'rgba(255,255,255,.6)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, k.r / res, 0, Math.PI * 2); g.fill();
  }
  const kelp = g.getImageData(0, 0, w, h).data;

  const out = g.createImageData(w, h);
  const o = out.data;
  for (let i = 0; i < w * h; i++) {
    o[i * 4] = Math.round(sharp[i] * 255);
    o[i * 4 + 1] = Math.round(Math.min(1, wide[i] * 1.6) * 255);
    o[i * 4 + 2] = kelp[i * 4];
    o[i * 4 + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return { canvas: cv, minX, minY, width: maxX - minX, height: maxY - minY };
}
