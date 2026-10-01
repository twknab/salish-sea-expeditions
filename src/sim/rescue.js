// Rescues as ordered steps (FR-012, FR-013). The player picks each next step — learning the order —
// then performs its gesture. Wrong choices and failed gestures cost time in cold water.
import { clamp } from './geo.js';
import { coldStrength } from './coldWater.js';

export const RESCUES = {
  roll: {
    title: 'Roll', lessonId: 'roll', skill: 'roll', requires: [],
    steps: [
      { id: 'tuck', label: 'Tuck forward, paddle along the side', gesture: 'hold', seconds: 3 },
      { id: 'sweep', label: 'Sweep the blade out on the surface', gesture: 'swipeOut', seconds: 2 },
      { id: 'snap', label: 'Hip snap — boat first', gesture: 'snap', seconds: 1 },
      { id: 'head', label: 'Head comes up last', gesture: 'hold', seconds: 1 },
    ],
    difficulty: 0.62,
  },
  paddleFloat: {
    title: 'Paddle-float re-entry', lessonId: 'pfRescue', skill: 'rescue', requires: ['pfRescue'],
    steps: [
      { id: 'wetExit', label: 'Wet exit — pull the grab loop', gesture: 'swipeDown', seconds: 10 },
      { id: 'hold', label: 'Keep hold of boat and paddle', gesture: 'hold', seconds: 5 },
      { id: 'right', label: 'Flip the kayak upright', gesture: 'swipeUp', seconds: 15 },
      { id: 'float', label: 'Fit and inflate the paddle float', gesture: 'tapRhythm', seconds: 45 },
      { id: 'rig', label: 'Blade under the deck lines behind the cockpit', gesture: 'swipeOut', seconds: 15 },
      { id: 'kick', label: 'Kick up onto the back deck, weight on the float', gesture: 'swipeUp', seconds: 15 },
      { id: 'leg', label: 'Hook a leg in, turn, and slide down', gesture: 'circle', seconds: 20 },
      { id: 'pump', label: 'Skirt on, pump out', gesture: 'tapRhythm', seconds: 60 },
    ],
    difficulty: 0.45,
  },
  scramble: {
    title: 'Re-entry without a float', lessonId: 'noFloat', skill: 'rescue', requires: [],
    steps: [
      { id: 'wetExit', label: 'Wet exit — pull the grab loop', gesture: 'swipeDown', seconds: 10 },
      { id: 'hold', label: 'Keep hold of boat and paddle', gesture: 'hold', seconds: 5 },
      { id: 'right', label: 'Flip the kayak upright', gesture: 'swipeUp', seconds: 15 },
      { id: 'scramble', label: 'Kick flat and scramble onto the back deck, belly low', gesture: 'swipeUp', seconds: 25 },
      { id: 'balance', label: 'Stay low and balance, paddle across the deck', gesture: 'hold', seconds: 10 },
      { id: 'slide', label: 'Slide forward into the seat', gesture: 'circle', seconds: 20 },
      { id: 'pump', label: 'Skirt on, pump out', gesture: 'tapRhythm', seconds: 60 },
    ],
    difficulty: 0.68,
  },
  tRescue: {
    title: 'Assisted T-rescue', lessonId: 'tRescue', skill: 'rescue', requires: [],
    steps: [
      { id: 'wetExit', label: 'Wet exit — pull the grab loop', gesture: 'swipeDown', seconds: 10 },
      { id: 'hold', label: 'Keep hold of boat and paddle', gesture: 'hold', seconds: 5 },
      { id: 'signal', label: 'Signal your partner — paddle up, call out', gesture: 'swipeUp', seconds: 5 },
      { id: 'bow', label: 'Move to your partner’s bow and hold on', gesture: 'hold', seconds: 20 },
      { id: 'drain', label: 'Partner lifts and drains your kayak', gesture: 'swipeUp', seconds: 20 },
      { id: 'steady', label: 'Partner rights it and holds it steady', gesture: 'hold', seconds: 10 },
      { id: 'reenter', label: 'Climb in from the side, heels first', gesture: 'circle', seconds: 20 },
      { id: 'pump', label: 'Skirt on, pump the last water out', gesture: 'tapRhythm', seconds: 30 },
    ],
    difficulty: 0.3,
  },
};

/** Which rescues are available given packed gear, the partner and the paddler. */
export function availableRescues(enabled, partnerNear) {
  return Object.entries(RESCUES)
    .filter(([id, r]) => r.requires.every((e) => enabled.has(e)) && (id !== 'tRescue' || partnerNear))
    .map(([id]) => id);
}

/** Three choices for the next step: the right one plus two others from the sequence. */
export function stepChoices(rescueId, index, seed = 0) {
  const steps = RESCUES[rescueId].steps;
  const correct = steps[index];
  const others = steps.filter((s, i) => i !== index);
  const set = [correct];
  for (let n = 0; n < others.length && set.length < 3; n++) set.push(others[(seed * 7 + n) % others.length]);
  // Deterministic shuffle.
  return set.map((s, i) => ({ s, k: (i * 5 + seed) % 7 })).sort((a, b) => a.k - b.k).map((x) => x.s);
}

/**
 * Does a performed gesture succeed? `quality` 0..1 from the gesture; the bar rises with sea state
 * and cold, and falls with skill level and a good fit.
 */
export function stepSucceeds(rescueId, quality, { sea = 0, secondsInWater = 0, skillLevel = 0, fit = 1 }) {
  const r = RESCUES[rescueId];
  const bar = clamp(r.difficulty + 0.3 * sea - 0.05 * skillLevel - 0.1 * (fit - 0.5), 0.1, 0.95);
  return quality * coldStrength(secondsInWater) >= bar;
}
