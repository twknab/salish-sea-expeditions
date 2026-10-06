// The forward stroke as poses, for animating the paddler. Pure maths (no three.js) so it can be
// tested. Metres, in the boat's frame: +x forward, +y up, +z starboard, origin at the seat.
//
// A good forward stroke: wind the torso up so the stroke-side shoulder reaches forward, plant the
// blade by the feet, then unwind — the torso, not the arms, pulls the boat past the blade — and
// lift it out at the hip. The top hand stays at about eye level and pushes across. Then the other
// side. (ACA Coastal Kayaking curriculum.)

export const BODY = {
  shoulderY: 0.52, shoulderHalf: 0.2, upperArm: 0.29, forearm: 0.27, paddleLen: 2.2, grip: 0.62,
};

const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** The pose part-way (`pull` 0 → 1) through a stroke on `side` (+1 starboard, −1 port). */
function drive(side, pull) {
  const twist = side * lerp(0.5, -0.32, pull); // + = starboard shoulder forward
  const bottom = [lerp(0.55, 0.08, pull), lerp(0.2, 0.26, pull), side * lerp(0.34, 0.4, pull)];
  const top = [lerp(0.36, 0.3, pull), lerp(0.66, 0.6, pull), side * lerp(-0.06, 0.06, pull)];
  return side > 0 ? { R: bottom, L: top, twist } : { R: top, L: bottom, twist };
}

/**
 * Pose at `phase` (0..1 through a starboard-then-port stroke pair).
 * Returns hands R and L, torso twist, and which blade (if any) is in the water.
 */
export function strokePose(phase) {
  const ph = ((phase % 1) + 1) % 1;
  const side = ph < 0.5 ? 1 : -1;
  const p = (ph % 0.5) / 0.5;
  const pull = smooth(0.05, 0.78, p);
  const swap = smooth(0.78, 1, p); // exit, then reach for the other side's catch
  const a = drive(side, pull), b = drive(-side, 0);
  const R = lerp3(a.R, b.R, swap), L = lerp3(a.L, b.L, swap);
  const twist = lerp(a.twist, b.twist, swap);
  const wet = p > 0.05 && p < 0.8 ? side : 0;
  return { R, L, twist, wet };
}

/** Resting: paddle across the deck in front, hands on the shaft, torso square. */
export function restPose() {
  return { R: [0.32, 0.22, 0.3], L: [0.32, 0.22, -0.3], twist: 0, wet: 0 };
}

/** Shoulder positions for a torso twist. */
export function shoulders(twist) {
  const { shoulderY: y, shoulderHalf: h } = BODY;
  // Rotating about the vertical: + twist brings the starboard shoulder forward.
  return { R: [Math.sin(twist) * h, y, Math.cos(twist) * h], L: [-Math.sin(twist) * h, y, -Math.cos(twist) * h] };
}

/** Two-bone IK: the elbow for a shoulder S reaching hand H, bending out and down. */
export function elbow(S, H, side) {
  const a = BODY.upperArm, b = BODY.forearm;
  const d0 = [H[0] - S[0], H[1] - S[1], H[2] - S[2]];
  const dist = Math.hypot(...d0);
  const d = Math.min(dist, (a + b) * 0.999);
  const u = d0.map((v) => v / (dist || 1));
  const pole = [-0.3, -0.7, side * 0.8];
  const dot = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2];
  let v = pole.map((p, i) => p - u[i] * dot);
  const vl = Math.hypot(...v) || 1;
  v = v.map((x) => x / vl);
  const cosA = Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d)));
  const sinA = Math.sqrt(1 - cosA * cosA);
  return [0, 1, 2].map((i) => S[i] + u[i] * a * cosA + v[i] * a * sinA);
}

/** The paddle through both hands: centre, unit direction (R hand → L hand), and both tips. */
export function paddleLine(R, L) {
  const c = lerp3(R, L, 0.5);
  const d0 = [L[0] - R[0], L[1] - R[1], L[2] - R[2]];
  const n = Math.hypot(...d0) || 1;
  const d = d0.map((v) => v / n);
  const h = BODY.paddleLen / 2;
  return { c, d, tipR: c.map((v, i) => v - d[i] * h), tipL: c.map((v, i) => v + d[i] * h) };
}
