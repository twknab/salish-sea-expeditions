// Current, shelter and hazards at a point: the channel current shaped by the chart.
import { ISLANDS, KELP, EDDIES, RIPS } from '../content/chart.js';
import { inside, edgeDistance, clamp } from './geo.js';
import { channelCurrent } from './tides.js';

/** Distance to the nearest shore (negative if on land). */
export function shoreDistance(x, y) {
  let best = Infinity;
  for (const is of ISLANDS) {
    const d = edgeDistance(is.poly, x, y);
    if (inside(is.poly, x, y)) return -d;
    best = Math.min(best, d);
  }
  return best;
}

export function onLand(x, y) {
  return ISLANDS.some((is) => inside(is.poly, x, y));
}

function falloff(p, x, y) {
  const d = Math.hypot(x - p.x, y - p.y);
  return d >= p.r ? 0 : 1 - d / p.r;
}

export function kelpAt(x, y) {
  return KELP.reduce((m, k) => Math.max(m, falloff(k, x, y)), 0);
}

export function ripAt(x, y) {
  return RIPS.reduce((m, k) => Math.max(m, falloff(k, x, y)), 0);
}

/**
 * Local current {x, y, kn, scale, eddy}: channel current slowed near shore and in kelp, sped up in
 * rips, and turned back on itself in an active eddy.
 */
export function currentAt(t, x, y) {
  const c = channelCurrent(t);
  const shore = shoreDistance(x, y);
  let scale = clamp(shore / 450, 0.12, 1);
  scale *= 1 - 0.7 * kelpAt(x, y);
  scale *= 1 + 0.5 * ripAt(x, y);
  const phase = c.kn >= 0 ? 'flood' : 'ebb';
  let eddy = 0;
  for (const e of EDDIES) {
    if (e.during !== phase) continue;
    eddy = Math.max(eddy, falloff(e, x, y));
  }
  // In an eddy the flow reverses (weakly) near the middle.
  const k = scale * (1 - 1.5 * eddy);
  return { x: c.x * k, y: c.y * k, kn: c.kn * k, scale: Math.abs(k), eddy, shore };
}
