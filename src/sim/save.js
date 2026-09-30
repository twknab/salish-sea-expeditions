// Save format: specs/001-first-voyage/contracts/save-format.md. Storage is injected so this runs
// under node:test; in the browser it is localStorage.

export const SAVE_KEY = 'sse.save.v1';

export function freshSave() {
  return {
    v: 1, seenIntro: false,
    skills: {}, totals: { nm: 0, nights: 0, trips: 0, score: 0 },
    fieldGuide: {}, lessons: {}, trip: null,
    settings: { sea: 0.9, wildlife: 0.9, music: 0.4, pov: true },
  };
}

export function load(storage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return freshSave();
    const s = JSON.parse(raw);
    if (s?.v !== 1) return freshSave();
    const f = freshSave();
    return { ...f, ...s, totals: { ...f.totals, ...s.totals }, settings: { ...f.settings, ...s.settings } };
  } catch {
    return freshSave();
  }
}

export function save(storage, state) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
