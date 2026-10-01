// Names and frames of the baked 3D images — kept free of three.js so the game can draw with them
// (and fall back without them) before the 3D chunk has even loaded.
const L = 4.88;

/** Frame of every baked image in metres, so WorldView can place them at true scale. */
export const FRAMES = {
  boat: { w: 256, h: 1024, spanX: L + 0.2, spanZ: (L + 0.2) / 4 },
  paddler: { w: 256, h: 256, spanX: 2.6, spanZ: 2.6, cx: 0.15 },
  orca: { w: 128, h: 512, spanX: 8.4, spanZ: 2.1, tilt: 0.35 },
  rock: { w: 512, h: 512, spanX: 16, spanZ: 16 },
  seal: { w: 64, h: 128, spanX: 2, spanZ: 1 },
  sealHead: { w: 64, h: 64, spanX: 1, spanZ: 1 },
  ferry: { w: 128, h: 512, spanX: 120, spanZ: 30, tilt: 0.12 },
};
export const STROKE_FRAMES = 16;
export const ORCA_DEPTHS = [-1.6, -1.05, -0.85, -0.7]; // body centre, in girths: deep → back and fin out

export const k3 = {
  deck: (skinId) => `k3-deck-${skinId}`,
  up: 'k3-up',
  paddler: (tone, f) => `k3-pad-${tone}-${f}`,
  orca: (kind, d) => `k3-orca-${kind}-${d}`,
  rock: 'k3-rock', seal: (i) => `k3-seal-${i % 3}`, sealHead: 'k3-seal-head', ferry: 'k3-ferry',
};
