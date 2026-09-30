// Routes for things that move on their own (ferries, orcas): polylines that must stay on the
// water. `clearance` lets a test prove a route never crosses land.
import { shoreDistance } from './field.js';

export function pathLength(path) {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  return d;
}

/** Position and compass heading at `dist` metres along the path (clamped to its ends). */
export function pointAt(path, dist) {
  let left = Math.max(0, dist);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    const heading = Math.atan2(b.x - a.x, b.y - a.y);
    if (left <= seg || i === path.length - 1) {
      const f = seg ? Math.min(1, left / seg) : 0;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, heading, done: left >= seg && i === path.length - 1 };
    }
    left -= seg;
  }
  const p = path.at(-1);
  return { x: p.x, y: p.y, heading: 0, done: true };
}

/**
 * Smallest distance to shore along the path, sampled every `step` metres, ignoring the first and
 * last `endSkip` metres (a ferry has to reach its dock).
 */
export function clearance(path, { step = 10, endSkip = 0 } = {}) {
  const L = pathLength(path);
  let min = Infinity;
  for (let d = endSkip; d <= L - endSkip; d += step) {
    const p = pointAt(path, d);
    min = Math.min(min, shoreDistance(p.x, p.y));
  }
  return min;
}

/** A mover travelling along a path at `speed` m/s. */
export function createMover(path, speed, startAt = 0) {
  const p = pointAt(path, startAt);
  return { path, speed, dist: startAt, x: p.x, y: p.y, heading: p.heading, done: false };
}

export function stepMover(m, dt) {
  m.dist += m.speed * dt;
  const p = pointAt(m.path, m.dist);
  // Turn smoothly rather than snapping at each waypoint.
  let dh = p.heading - m.heading;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  m.heading += dh * Math.min(1, dt * 0.8);
  m.x = p.x; m.y = p.y; m.done = p.done;
  return m;
}
