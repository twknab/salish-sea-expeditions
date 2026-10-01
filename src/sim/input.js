// PaddlerInput — see specs/001-first-voyage/contracts/paddler-input.md.
// Every seat (player, computer partner, later a remote player) produces one of these per tick.

export function emptyInput() {
  return { stroke: null, edge: 0, brace: null, hipSnap: false, headDown: true, rocker: null, rest: false };
}

/**
 * How much of a stroke's power came from the torso rather than the arms, 0..1.
 * A long reach (catch near the feet), a steady pull and an exit at the hip are what rotation
 * looks like from the outside; a short jab that ends behind the hip is an arm stroke.
 */
export function rotationQuality(stroke) {
  if (!stroke) return 0;
  const q = 0.1 + 0.45 * stroke.reach + 0.3 * stroke.smoothness + (stroke.exitAtHip ? 0.15 : 0);
  return Math.max(0, Math.min(1, q));
}
