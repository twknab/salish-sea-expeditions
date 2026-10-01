// Packing a folding kayak: no hatches — dry bags go in through the cockpit into flotation bags
// fore and aft, with a few things on deck. Zones: bowEnd, bowMid, sternMid, sternEnd, deck.
import { gearById } from '../content/gear.js';

export const ZONES = ['bowEnd', 'bowMid', 'sternMid', 'sternEnd', 'deck'];
const ARM = { bowEnd: 2, bowMid: 1, sternMid: -1, sternEnd: -2, deck: 0 };

export function emptyPacking() {
  return Object.fromEntries(ZONES.map((z) => [z, []]));
}

/**
 * Trim and handling from a packing layout.
 * pitch: + bow heavy, − stern heavy (−1..1). ends: share of mass at the ends (sluggish turning).
 * topHeavy: mass on deck beyond a few kilos (less stable). missing: essentials left behind.
 */
export function assess(packing) {
  let total = 0, moment = 0, ends = 0, deck = 0;
  const packed = new Set();
  for (const z of ZONES) {
    for (const id of packing[z] ?? []) {
      const g = gearById[id];
      packed.add(id);
      total += g.massKg;
      moment += g.massKg * ARM[z];
      if (z.endsWith('End')) ends += g.massKg;
      if (z === 'deck') deck += g.massKg;
    }
  }
  const pitch = total ? Math.max(-1, Math.min(1, moment / (total * 1.2))) : 0;
  const missing = Object.values(gearById).filter((g) => g.essential && !packed.has(g.id)).map((g) => g.id);
  const enables = new Set([...packed].flatMap((id) => gearById[id].enables));
  return {
    total, pitch,
    ends: total ? ends / total : 0,
    topHeavy: Math.max(0, (deck - 3) / 6),
    missing, packed, enables,
  };
}

/** Handling penalty 0..1 for the HUD and physics. */
export function handlingPenalty(a) {
  return Math.min(1, Math.abs(a.pitch) * 0.8 + a.ends * 0.4 + a.topHeavy * 0.6);
}
