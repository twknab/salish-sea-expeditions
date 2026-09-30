// Trip score and debrief (FR-018). Capsizing costs nothing: practising rescues is how you learn.

export function tripScore(r) {
  const parts = [
    ['Nautical miles', Math.round(r.nm * 100)],
    ['Nights out', (r.nights ?? 0) * 300],
    ['Species in the field guide', (r.newSpecies ?? 0) * 50],
    ['Wildlife given room', (r.respectful ?? 0) * 150],
    ['Too close to wildlife', -(r.violations ?? 0) * 200],
    ['Clean camp', r.cleanCamp ? 250 : 0],
    ['Lessons demonstrated', (r.demonstrated ?? 0) * 40],
    ['Rescues completed', (r.rescues ?? 0) * 100],
    ['Launched at a good time', r.goodWindow ? 200 : 0],
  ].filter(([, v]) => v !== 0);
  return { parts, total: Math.max(0, parts.reduce((s, [, v]) => s + v, 0)) };
}
