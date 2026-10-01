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
];

/** Species newly sighted at (x, y), given those already seen. */
export function sightingsAt(x, y, seen) {
  return SIGHTINGS.filter((s) => !seen.has(s.speciesId) && Math.hypot(x - s.x, y - s.y) < s.r).map((s) => s.speciesId);
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

export function createOrcaPass(player, t, route = ORCA_ROUTE) {
  const mover = createMover(route, 2.6, Math.max(0, nearestAlong(route, player.x, player.y) - 1300));
  return {
    speciesId: 'orca', kind: 'orca', mover,
    x: mover.x, y: mover.y, heading: mover.heading, speed: 2.6,
    members: [{ dx: 0, dy: 0, bull: true }, { dx: -40, dy: 30 }, { dx: 30, dy: -45 }, { dx: -15, dy: -80, calf: true }],
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
  const rule = speciesById.orca.approachMetres;
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
