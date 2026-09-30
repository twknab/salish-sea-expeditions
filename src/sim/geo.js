// Local metric grid around Friday Harbor. x = metres east, y = metres north.
// Headings are radians, 0 = north, clockwise positive (a compass bearing).

export const ORIGIN = { lat: 48.538, lon: -123.013 };
export const M_PER_NM = 1852;
export const MS_PER_KNOT = 1852 / 3600;
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

export function toLocal(lat, lon) {
  return { x: (lon - ORIGIN.lon) * M_PER_DEG_LON, y: (lat - ORIGIN.lat) * M_PER_DEG_LAT };
}

export function toLatLon(x, y) {
  return { lat: ORIGIN.lat + y / M_PER_DEG_LAT, lon: ORIGIN.lon + x / M_PER_DEG_LON };
}

export const knots = (ms) => ms / MS_PER_KNOT;
export const ms = (kn) => kn * MS_PER_KNOT;
export const nm = (m) => m / M_PER_NM;

/** Unit vector for a compass bearing. */
export function dir(bearing) {
  return { x: Math.sin(bearing), y: Math.cos(bearing) };
}

/** Compass bearing from (x1,y1) to (x2,y2), 0..2π. */
export function bearing(x1, y1, x2, y2) {
  const b = Math.atan2(x2 - x1, y2 - y1);
  return b < 0 ? b + Math.PI * 2 : b;
}

/** Smallest signed difference a - b, in -π..π. */
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const deg = (r) => (r * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Point-in-polygon (ray cast). poly = [{x,y}, ...]. */
export function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/** Distance from (x,y) to the nearest edge of a polygon. */
export function edgeDistance(poly, x, y) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / len2, 0, 1);
    const px = a.x + t * dx - x, py = a.y + t * dy - y;
    best = Math.min(best, Math.hypot(px, py));
  }
  return best;
}

/** "HH:MM" for minutes since midnight. */
export function clock(minute) {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
