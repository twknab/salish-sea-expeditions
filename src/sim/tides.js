import { TRIP_DAY } from '../content/tripDay.js';
import { rad, ms } from './geo.js';

function bracket(events, t) {
  for (let i = 0; i < events.length - 1; i++) {
    if (t >= events[i].t && t <= events[i + 1].t) return [events[i], events[i + 1]];
  }
  return t < events[0].t ? [events[0], events[0]] : [events.at(-1), events.at(-1)];
}

/** Tide height at Friday Harbor (m above MLLW). Cosine between high and low water. */
export function tideHeight(t, day = TRIP_DAY) {
  const [a, b] = bracket(day.tides, t);
  if (a === b) return a.h;
  const f = (t - a.t) / (b.t - a.t);
  return a.h + ((b.h - a.h) * (1 - Math.cos(Math.PI * f))) / 2;
}

/**
 * Channel current in knots (+ flood, − ebb). Currents rise fast from slack and linger near
 * maximum, so the curve is a quarter sine from slack to max and a quarter cosine back down.
 */
export function channelCurrentKn(t, day = TRIP_DAY) {
  const [a, b] = bracket(day.current, t);
  if (a === b) return a.kn;
  const f = (t - a.t) / (b.t - a.t);
  if (a.kn === 0) return b.kn * Math.sin((Math.PI / 2) * f);
  if (b.kn === 0) return a.kn * Math.cos((Math.PI / 2) * f);
  return a.kn + (b.kn - a.kn) * f;
}

/** Next slack water at or after t (minutes), or null. */
export function nextSlack(t, day = TRIP_DAY) {
  const s = day.current.find((e) => e.kn === 0 && e.t >= t);
  return s ? s.t : null;
}

/** Channel current as a velocity in m/s: {x, y}. */
export function channelCurrent(t, day = TRIP_DAY) {
  const kn = channelCurrentKn(t, day);
  const set = rad(day.floodSetDeg);
  const v = ms(kn);
  return { x: Math.sin(set) * v, y: Math.cos(set) * v, kn };
}

/** Is the tide rising at t? */
export function rising(t, day = TRIP_DAY) {
  return tideHeight(t + 1, day) > tideHeight(t, day);
}

/** Highest water between t0 and t1 (minutes). */
export function highestBetween(t0, t1, day = TRIP_DAY) {
  let h = -Infinity;
  for (let t = t0; t <= t1; t += 5) h = Math.max(h, tideHeight(t, day));
  return h;
}
