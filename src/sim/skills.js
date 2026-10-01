// Skills improve with practice (Principle VI): the tenth roll is easier than the first.

export const SKILLS = {
  fit: 'Boat fit',
  edging: 'Edging',
  forward: 'Forward stroke',
  sweep: 'Sweep turns',
  brace: 'Bracing & hip snap',
  roll: 'Rolling',
  rescue: 'Rescues',
  navigation: 'Navigation',
  campcraft: 'Campcraft',
};

export const level = (xp = 0) => Math.floor(Math.sqrt(Math.max(0, xp) / 20));

/** Progress 0..1 toward the next level. */
export function progress(xp = 0) {
  const l = level(xp);
  const lo = 20 * l * l, hi = 20 * (l + 1) * (l + 1);
  return (xp - lo) / (hi - lo);
}

export function award(skills, id, xp) {
  if (!(id in SKILLS)) throw new Error(`unknown skill ${id}`);
  const before = level(skills[id]);
  skills[id] = (skills[id] ?? 0) + xp;
  return level(skills[id]) > before; // levelled up
}
