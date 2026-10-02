// Wildlife encounters under Be Whale Wise rules (FR-015, US6).
import { toLocal, clamp } from './geo.js';
import { speciesById } from '../content/species.js';
import { ORCA_ROUTE } from '../content/chart.js';
import { createMover, stepMover, pathLength, pointAt } from './route.js';

// Where things are seen. `r` is sighting radius; encounters with rules are handled separately.
export const SIGHTINGS = [
  { speciesId: 'baldEagle', ...toLocal(48.5560, -123.0190), r: 400 },
  { speciesId: 'pigeonGuillemot', ...toLocal(48.5635, -123.0160), r: 300 },
  { speciesId: 'bullKelp', ...toLocal(48.5605, -123.0200), r: 200 },
  { speciesId: 'heron', ...toLocal(48.5745, -123.0300), r: 350 },
  { speciesId: 'riverOtter', ...toLocal(48.5790, -123.0360), r: 250 },
  { speciesId: 'harbourPorpoise', ...toLocal(48.5780, -123.0200), r: 450 },
  { speciesId: 'rhinoAuklet', ...toLocal(48.5960, -123.0330), r: 400 },
  { speciesId: 'madrona', ...toLocal(48.5850, -123.0440), r: 300 },
  { speciesId: 'douglasFir', ...toLocal(48.5500, -123.0170), r: 400 },
  { speciesId: 'moonJelly', ...toLocal(48.6105, -123.0440), r: 250 },
  { speciesId: 'oystercatcher', ...toLocal(48.6118, -123.0400), r: 250 },
  // Spec 005. Placed by habitat near the route (open water, near shore, or on the shore itself);
  // the places are illustrative, not records. `chance` = how often the animal is there on a trip.
  { speciesId: 'waterJelly', x: -98, y: 24, r: 300 },
  { speciesId: 'kingfisher', x: -272, y: 490, r: 350 },
  { speciesId: 'californiaSeaLion', x: 648, y: 289, r: 300 },
  { speciesId: 'garryOak', x: -249, y: 569, r: 350 },
  { speciesId: 'sugarKelp', x: 133, y: 1101, r: 300 },
  { speciesId: 'dallsPorpoise', x: 266, y: 1774, r: 700 },
  { speciesId: 'lionsMane', x: 205, y: 2490, r: 300 },
  { speciesId: 'redCedar', x: -377, y: 2620, r: 350 },
  { speciesId: 'peregrine', x: -664, y: 2865, r: 350 },
  { speciesId: 'seaOtter', x: -1282, y: 3612, r: 300, chance: 0.3 },
  { speciesId: 'pelagicCormorant', x: -624, y: 6058, r: 350, rookery: true },
  { speciesId: 'minke', x: -1626, y: 5073, r: 700, chance: 0.6 },
  { speciesId: 'stellerSeaLion', x: -2387, y: 5359, r: 300 },
  { speciesId: 'friedEggJelly', x: -1661, y: 6281, r: 300 },
  { speciesId: 'humpback', x: -2784, y: 6424, r: 700, chance: 0.6 },
];

/** The sightings present on this trip: the rarer animals are not always there. */
export function tripSightings(rand = Math.random) {
  return SIGHTINGS.filter((s) => !s.chance || rand() < s.chance);
}

/** Species newly sighted at (x, y), given those already seen. */
export function sightingsAt(x, y, seen, list = SIGHTINGS) {
  return list.filter((s) => !seen.has(s.speciesId) && Math.hypot(x - s.x, y - s.y) < s.r).map((s) => s.speciesId);
}

// The orca pod travels up the channel along ORCA_ROUTE (always on the water), starting about
// 1.3 km behind the point on the route nearest the player.
function nearestAlong(path, x, y) {
  let best = 0, bd = Infinity;
  for (let d = 0; d <= pathLength(path); d += 25) {
    const p = pointAt(path, d);
    const dd = Math.hypot(p.x - x, p.y - y);
    if (dd < bd) { bd = dd; best = d; }
  }
  return best;
}

/**
 * The two orca ecotypes that share these waters and never mix. Bigg's hunt mammals in small,
 * quiet family groups and are now the more often seen; Southern Residents eat salmon and travel in
 * larger, more vocal groups. `roll` (0..1) picks one; tests pass it to be deterministic.
 */
export const ECOTYPES = {
  biggsOrca: { members: [{ dx: 0, dy: 0, bull: true }, { dx: -40, dy: 30 }, { dx: 30, dy: -45 }, { dx: -15, dy: -80, calf: true }] },
  southernResident: { members: [{ dx: 0, dy: 0, bull: true }, { dx: -45, dy: 35 }, { dx: 35, dy: -40 }, { dx: -20, dy: -85, calf: true }, { dx: 70, dy: 40 }, { dx: -80, dy: -30 }, { dx: 20, dy: 110, bull: true }] },
};

export function createOrcaPass(player, t, route = ORCA_ROUTE, roll = Math.random()) {
  const mover = createMover(route, 2.6, Math.max(0, nearestAlong(route, player.x, player.y) - 1300));
  const speciesId = roll < 0.6 ? 'biggsOrca' : 'southernResident';
  return {
    speciesId, kind: 'orca', mover,
    x: mover.x, y: mover.y, heading: mover.heading, speed: 2.6,
    members: ECOTYPES[speciesId].members.map((m) => ({ ...m })),
    started: t, closest: Infinity, violation: false, respectful: true, state: 'approaching',
  };
}

/** Advance the pod; judge the player's behaviour against the rule. */
export function stepOrcaPass(pod, player, dt) {
  if (pod.mover) {
    stepMover(pod.mover, dt);
    pod.x = pod.mover.x; pod.y = pod.mover.y; pod.heading = pod.mover.heading;
  } else {
    pod.x += Math.sin(pod.heading) * pod.speed * dt;
    pod.y += Math.cos(pod.heading) * pod.speed * dt;
  }
  const dx = pod.x - player.x, dy = pod.y - player.y;
  const d = Math.hypot(dx, dy);
  pod.closest = Math.min(pod.closest, d);
  const rule = speciesById[pod.speciesId ?? 'biggsOrca'].approachMetres;
  // Closing speed: the part of the player's ground velocity pointing at the whales.
  const closing = d > 0 ? (player.vx * dx + player.vy * dy) / d : 0;
  let warn = false;
  if (d < rule && closing > 0.35) {
    warn = true;
    pod.violation = true;
    pod.respectful = false;
  }
  const past = pod.mover ? pod.mover.done || (pod.closest < Infinity && d > pod.closest + 1200 && pod.y > player.y) : pod.y > player.y + 1500;
  if (past) pod.state = 'gone';
  else if (d < rule) pod.state = 'passing';
  return { distance: d, warn, rule };
}

// Harbour seals hauled out on the rocks.
export function sealState(distance) {
  if (distance < 50) return 'flushed';
  if (distance < 91) return 'alert';
  return 'resting';
}

export function sealScore(minDistance) {
  return clamp(minDistance, 0, 400) >= 91;
}
