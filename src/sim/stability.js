// Heel, bracing and capsize.
//
// A kayak has good "secondary stability" up to a point — you can edge it a long way — and then it
// goes over. What saves you is the brace: a flat blade on the water for support, and a hip snap
// that rights the boat while the head stays down. Lift the head first and the body follows it:
// the brace fails. The sim models exactly that, so the controls teach the real motion.
import { clamp } from './geo.js';

export const EDGE_ANGLE = 0.38; // ~22° — a firm edge
export const DANGER = 0.62;     // ~35° — past the edge, falling
export const CAPSIZE = 1.25;    // ~72° — over

// Smooth, repeatable "wave" disturbance: sum of a few sines of time and position.
export function waveTorque(t, x, y, sea) {
  const a = Math.sin(t * 1.3 + x * 0.013) * 0.6 + Math.sin(t * 2.1 + y * 0.011) * 0.4
    + Math.sin(t * 0.7 + (x + y) * 0.007) * 0.5;
  return a * sea * sea * 1.6;
}

/**
 * Advance heel by dt. Returns an event: 'capsize', 'braced', 'wobble' or null.
 * `fit` (0..1) is how well the paddler is connected to the boat; `braceSkill` scales the snap.
 */
export function stepHeel(k, input, env, dt, fit = 1, braceSkill = 0) {
  if (!k.upright) return null;
  const target = input.edge * EDGE_ANGLE * (0.4 + 0.6 * fit);
  const h = k.heel;
  const past = Math.abs(h) - DANGER;
  // Restoring force from the hull shape, which fades once you're past the edge.
  let acc = past < 0 ? -9 * (h - target) : Math.sign(h) * 5.5 * past;
  acc += waveTorque(env.time, k.x, k.y, env.sea);
  acc -= 3.2 * k.heelVel;

  let event = null;
  const low = h > 0 ? 'right' : 'left';
  const bracing = input.brace && input.brace.side === low;
  if (bracing && input.headDown) {
    // The flat blade buys a moment of support; it is the hip snap that rights the boat.
    acc -= Math.sign(h) * 2.5 * Math.min(1, Math.abs(h) / DANGER);
  }
  if (bracing) {
    if (input.hipSnap) {
      // Head up first and the body follows it: the blade dives and the snap has nothing to push on.
      const snap = input.headDown ? 4.2 * (0.6 + 0.4 * fit) * (1 + 0.04 * braceSkill) : 0.4;
      k.heelVel -= Math.sign(h) * snap;
      if (input.headDown && Math.abs(h) > DANGER * 0.7) event = 'braced';
    }
  }
  k.heelVel += acc * dt;
  k.heel = clamp(k.heel + k.heelVel * dt, -1.6, 1.6);
  if (Math.abs(k.heel) >= CAPSIZE) {
    k.upright = false;
    k.heel = Math.sign(k.heel) * Math.PI;
    k.heelVel = 0;
    return 'capsize';
  }
  if (!event && Math.abs(k.heel) > DANGER && Math.abs(h) <= DANGER) event = 'wobble';
  return event;
}
