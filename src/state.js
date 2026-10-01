// The one shared game state: the save (contracts/save-format.md) plus the trip in progress.
import { load, save } from './sim/save.js';
import { emptyPacking } from './sim/packing.js';

const storage = (() => { try { return window.localStorage; } catch { return null; } })();

export const state = {
  save: load(storage),
};

export function persist() {
  save(storage, state.save);
}

export function newTrip(start) {
  state.save.trip = {
    scene: 'BoatSchool', start,
    launchMinute: 480, packing: emptyPacking(), assembly: 1, rocker: 0.35,
    kayak: null, minute: 480, log: [],
    record: { nm: 0, nights: 0, newSpecies: 0, respectful: 0, violations: 0, cleanCamp: false, demonstrated: 0, rescues: 0, capsizes: 0, goodWindow: false },
    sightings: [], lessons: [],
  };
  persist();
  return state.save.trip;
}

export const trip = () => state.save.trip;

/** Mark a lesson met (shown) or demonstrated (performed). Returns true if newly demonstrated. */
export function lesson(id, how = 'met') {
  const cur = state.save.lessons[id];
  if (cur === 'demonstrated' || cur === how) return false;
  state.save.lessons[id] = how;
  const t = trip();
  if (t && !t.lessons.includes(id)) t.lessons.push(id);
  if (how === 'demonstrated' && t) t.record.demonstrated++;
  return how === 'demonstrated';
}

/** Record a species in the field guide. Returns true if new. */
export function observe(speciesId) {
  const t = trip();
  if (t && !t.sightings.includes(speciesId)) t.sightings.push(speciesId);
  if (state.save.fieldGuide[speciesId]) return false;
  state.save.fieldGuide[speciesId] = new Date().toISOString().slice(0, 10);
  if (t) t.record.newSpecies++;
  return true;
}

/** Go to a scene, saving at the boundary (SC-008). */
export function go(scene, target, data) {
  const t = trip();
  if (t) t.scene = target;
  persist();
  scene.cameras.main.fadeOut(420, 11, 43, 51);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(target, data));
}
