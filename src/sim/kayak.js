// Kayak physics, one seat. Pure: no rendering, no randomness.
//
// Teaching rules baked in (FR-000b):
// - A stroke driven by torso rotation gives more speed for less energy than an arm stroke.
// - Arm strokes also yaw the boat more, so they zig-zag.
// - Edging the boat toward the sweep side sharpens a sweep turn.
// - Rocker (hull jacks): less rocker tracks straighter, more rocker turns quicker.
import { clamp, dir } from './geo.js';
import { rotationQuality } from './input.js';
import { stepHeel } from './stability.js';

export function createKayak(opts = {}) {
  return {
    x: 0, y: 0, heading: 0, speed: 0, turnRate: 0,
    edge: 0, heel: 0, heelVel: 0, upright: true, cockpitWater: 0,
    rocker: 0.4, assembly: 1, trim: { pitch: 0, list: 0 }, buoyancy: 1,
    vx: 0, vy: 0, // velocity over ground (m/s), for display and tracks
    ...opts,
  };
}

const MAX_SPEED = 2.4; // m/s ≈ 4.7 kn, a hard sprint
const STROKE_DV = 0.34;

/** Speed multiplier from cockpit water, trim and energy. */
function efficiency(k, energy) {
  const water = 1 - 0.6 * k.cockpitWater;
  const trim = 1 - 0.25 * Math.min(1, Math.abs(k.trim.pitch)) - 0.15 * Math.min(1, Math.abs(k.trim.list));
  const tired = 0.45 + 0.55 * clamp(energy, 0, 1);
  return water * trim * tired;
}

/**
 * Advance one seat's kayak by dt seconds.
 * env: { time (s, for waves), current: {x,y}, wind: {x,y}, sea: 0..1 }
 * paddler: { energy, fit, skills }
 * Returns { events: string[], cost: number (energy spent) }.
 */
export function stepKayak(k, input, env, paddler, dt) {
  const events = [];
  let cost = 0;
  const skill = (id) => paddler.skills?.[id] ?? 0;
  if (input.rocker != null) k.rocker = clamp(input.rocker, 0, 1);
  k.edge += (clamp(input.edge, -1, 1) - k.edge) * Math.min(1, dt * 8);

  if (k.upright && input.stroke) {
    const s = input.stroke;
    const side = s.side === 'left' ? -1 : 1;
    const q = rotationQuality(s);
    const eff = efficiency(k, paddler.energy);
    if (s.kind === 'forward') {
      const power = STROKE_DV * (0.35 + 0.65 * q) * (1 + 0.02 * skill('forward'));
      k.speed += power * eff;
      // A stroke on the left pushes the bow right. Arm strokes (low q) yaw far more.
      const yaw = 0.05 * (1.6 - q) * (0.6 + 0.8 * k.rocker);
      k.turnRate += -side * yaw;
      cost += 0.012 * (1.5 - q);
      events.push(q >= 0.7 ? 'strokeGood' : 'strokeArms');
    } else if (s.kind === 'sweep') {
      const edgeHelp = 1 + 0.9 * clamp(k.edge * side, 0, 1); // tilt toward the sweep side
      const turn = 0.22 * edgeHelp * (0.6 + 0.8 * k.rocker) * (1 + 0.03 * skill('sweep'));
      k.turnRate += -side * turn;
      k.speed += 0.06 * eff;
      cost += 0.01;
      events.push(edgeHelp > 1.4 ? 'sweepEdged' : 'sweepFlat');
    } else if (s.kind === 'reverse') {
      k.speed -= 0.25;
      k.turnRate += side * 0.12;
      cost += 0.01;
      events.push('reverse');
    }
  }

  // Hull: drag and tracking. A loosely assembled hull wanders (FR-006).
  const drag = 0.1 + 0.12 * Math.abs(k.speed) + 0.6 * k.cockpitWater;
  k.speed -= Math.sign(k.speed) * Math.min(Math.abs(k.speed), drag * Math.abs(k.speed) * dt + 0.01 * dt);
  k.speed = clamp(k.speed, -0.8, MAX_SPEED);
  const trackDamp = 2.2 - 1.2 * k.rocker;
  k.turnRate -= k.turnRate * Math.min(1, trackDamp * dt);
  const wander = (1 - k.assembly) * 0.08 * Math.sin(env.time * 0.9) + 0.05 * k.trim.list;
  k.turnRate += wander * dt;
  k.heading = (k.heading + k.turnRate * dt + Math.PI * 2) % (Math.PI * 2);

  // Ground velocity = boat through water + current + a little wind drift.
  const d = dir(k.heading);
  const drift = k.upright ? 0.025 : 0.04;
  k.vx = d.x * k.speed + env.current.x + env.wind.x * drift;
  k.vy = d.y * k.speed + env.current.y + env.wind.y * drift;
  k.x += k.vx * dt;
  k.y += k.vy * dt;

  const heelEvent = stepHeel(k, input, env, dt, paddler.fit ?? 1, skill('brace'));
  if (heelEvent) events.push(heelEvent);

  // Holding pace costs a little; resting recovers.
  cost += 0.0008 * Math.abs(k.speed) * dt;
  return { events, cost };
}
