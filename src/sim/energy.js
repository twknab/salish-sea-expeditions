import { clamp } from './geo.js';

/**
 * Energy after dt seconds. Resting recovers; sheltered water (kelp, eddy, lee) recovers faster
 * because you are not paddling to hold position. Paddling costs what the stroke cost.
 */
export function stepEnergy(energy, { cost = 0, resting = false, shelter = 0, cold = 0 }, dt) {
  let e = energy - cost;
  if (resting) e += dt * 0.012 * (1 + 2.5 * clamp(shelter, 0, 1));
  e -= dt * 0.004 * cold; // cold water saps strength
  return clamp(e, 0, 1);
}
