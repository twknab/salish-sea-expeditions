// The computer partner: a PaddlerInput controller (contracts/paddler-input.md). It sees what a
// human would see — positions, current, the other boat — and never touches kayak state directly.
import { emptyInput } from './input.js';
import { bearing, angleDiff, dir, clamp } from './geo.js';
import { shoreDistance } from './field.js';

/**
 * Steer around land: if the water ahead along `track` runs out within `look` metres, turn toward
 * whichever side stays clear longest. Returns an adjusted track.
 */
export function avoidLand(x, y, track, look = 80) {
  const clear = (h) => {
    let min = Infinity;
    for (const d of [look * 0.35, look * 0.7, look]) min = Math.min(min, shoreDistance(x + Math.sin(h) * d, y + Math.cos(h) * d));
    return min;
  };
  if (clear(track) > 25) return track;
  for (const off of [0.35, 0.7, 1.05, 1.4, 1.8]) {
    const l = clear(track - off), r = clear(track + off);
    if (l > 25 || r > 25) return l >= r ? track - off : track + off;
  }
  return track + Math.PI; // boxed in: back out
}

/**
 * Heading to steer so that boat velocity + current points along `track` (a ferry angle).
 * Returns the heading, or the plain bearing if the current is too strong to cancel.
 */
export function ferryHeading(track, boatSpeed, current) {
  const d = dir(track);
  // Component of current across the track must be cancelled by the boat.
  const cross = current.x * d.y - current.y * d.x; // + means current pushes to the right of track
  const s = Math.max(0.3, boatSpeed);
  const a = Math.asin(clamp(cross / s, -0.95, 0.95));
  return track - a; // point up into the current
}

export function createPartner() {
  return { cadence: 0, side: 'left', mode: 'escort', restTimer: 0 };
}

/**
 * world: { me (kayak), player (kayak), current (at me), target: {x,y}, playerResting, playerCapsized }
 */
export function partnerInput(brain, world, dt) {
  const inp = emptyInput();
  const { me, player } = world;
  if (!me.upright) return inp;

  // Station: 14 m off the player's shoulder on the side toward the target, or go to them if capsized.
  let goal;
  if (world.playerCapsized) {
    goal = { x: player.x, y: player.y };
  } else {
    const h = player.heading;
    goal = { x: player.x + Math.cos(h) * 14 - Math.sin(h) * 6, y: player.y - Math.sin(h) * 14 - Math.cos(h) * 6 };
  }
  const dist = Math.hypot(goal.x - me.x, goal.y - me.y);
  if (world.playerResting && dist < 25 && !world.playerCapsized) {
    inp.rest = true;
    return inp;
  }
  // Lead toward the goal, plus some of the player's own direction so we travel together.
  const rawTrack = dist > 3 ? bearing(me.x, me.y, goal.x, goal.y) : player.heading;
  const track = avoidLand(me.x, me.y, rawTrack);
  const want = ferryHeading(track, Math.max(0.6, me.speed), world.current);
  const err = angleDiff(want, me.heading);
  brain.cadence -= dt;
  const pace = clamp(dist / 30, 0.25, 1) * (world.playerCapsized ? 1.4 : 1);
  if (brain.cadence <= 0) {
    brain.cadence = 0.75 / pace;
    if (Math.abs(err) > 0.5) {
      // Sweep on the side away from the turn, edged.
      const side = err > 0 ? 'left' : 'right';
      inp.stroke = { side, kind: 'sweep', reach: 0.9, smoothness: 0.9, exitAtHip: true };
      inp.edge = side === 'left' ? -0.6 : 0.6;
    } else if (dist > 6 || world.playerCapsized) {
      // Correct small errors by choosing which side to stroke on.
      const side = Math.abs(err) > 0.08 ? (err > 0 ? 'left' : 'right') : brain.side;
      brain.side = brain.side === 'left' ? 'right' : 'left';
      inp.stroke = { side, kind: 'forward', reach: 0.95, smoothness: 0.95, exitAtHip: true };
    }
  }
  return inp;
}
