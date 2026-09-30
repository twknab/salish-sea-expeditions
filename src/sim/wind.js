import { TRIP_DAY } from '../content/tripDay.js';
import { rad, ms, clamp } from './geo.js';
import { channelCurrent } from './tides.js';

/** Wind at time t: { kn, fromDeg, x, y } where x,y is the velocity the air moves (m/s). */
export function wind(t, day = TRIP_DAY) {
  const ev = day.wind;
  let a = ev[0], b = ev.at(-1);
  for (let i = 0; i < ev.length - 1; i++) {
    if (t >= ev[i].t && t <= ev[i + 1].t) { a = ev[i]; b = ev[i + 1]; break; }
  }
  const f = a === b || b.t === a.t ? 0 : clamp((t - a.t) / (b.t - a.t), 0, 1);
  const kn = a.kn + (b.kn - a.kn) * f;
  const fromDeg = a.fromDeg + (b.fromDeg - a.fromDeg) * f;
  const to = rad(fromDeg + 180);
  const v = ms(kn);
  return { kn, fromDeg, x: Math.sin(to) * v, y: Math.cos(to) * v };
}

/**
 * Sea state 0..1. Wind builds waves; when wind blows AGAINST the current the waves shorten and
 * steepen — the classic dangerous chop. Wind WITH the current flattens them.
 * `currentScale` lets callers apply local current strength (off points, in eddies).
 */
export function seaState(t, currentScale = 1, day = TRIP_DAY) {
  const w = wind(t, day);
  const c = channelCurrent(t, day);
  const cx = c.x * currentScale, cy = c.y * currentScale;
  const windWave = clamp(w.kn / 25, 0, 1);
  const wSpeed = Math.hypot(w.x, w.y), cSpeed = Math.hypot(cx, cy);
  let opposing = 0;
  if (wSpeed > 0.01 && cSpeed > 0.01) {
    const dot = (w.x * cx + w.y * cy) / (wSpeed * cSpeed); // -1 = directly opposed
    opposing = clamp(-dot, 0, 1) * clamp(cSpeed / 1.0, 0, 1.5); // ~2 kn of opposing current = strong effect
  }
  return clamp(windWave * (0.55 + 1.1 * opposing), 0, 1);
}

/** True when wind and current are opposed strongly enough to matter — for teaching prompts. */
export function windAgainstTide(t, day = TRIP_DAY) {
  const w = wind(t, day);
  const c = channelCurrent(t, day);
  if (w.kn < 6 || Math.abs(c.kn) < 0.7) return false;
  return w.x * c.x + w.y * c.y < 0;
}
