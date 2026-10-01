// Illustrated top-down sprites for the water view: kayak decks per skin, a paddler animated through
// the stroke, orcas, harbour seals on their rock, and the ferry. Each is an SVG built here once,
// rasterised by the browser at device size, and then reused every frame as a plain image — far
// richer than drawing shapes per frame, and cheaper too.
import { FRAME } from '../content/skins.js';

const pending = new Map();

/**
 * Ensure a texture exists for `key`, building it from `svg()` at `w × h` device pixels.
 * Returns true when it is ready to use; until then callers draw a simple fallback.
 */
export function ensureSprite(scene, key, svg, w, h) {
  if (scene.textures.exists(key)) return true;
  if (pending.has(key)) return false;
  const img = new Image();
  pending.set(key, img);
  let s = svg();
  s = s.replace(/width="[\d.]+" height="[\d.]+"/, `width="${Math.round(w)}" height="${Math.round(h)}"`);
  img.onload = () => { if (!scene.textures.exists(key)) scene.textures.addImage(key, img); pending.delete(key); };
  img.onerror = () => pending.delete(key);
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
  return false;
}

const f = (n) => Math.round(n * 10) / 10;
const pathOf = (pts, close = true) => `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L')}${close ? ' Z' : ''}`;

// ---------- Kayak deck (bow up) ----------
// Canvas 600 × 800 units; the hull is 800 long (the full height) and 120 wide, centred at x = 300.
// The paddler frames share the canvas so the two images line up exactly.
export const BOAT_CANVAS = { w: 600, h: 800, L: 800, B: 120 };

function halfWidth(s, B) {
  return (B / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.94 + 0.03)), 0.62) * (1 - 0.06 * (1 - s));
}

function outline(L, B, cx = 300, cy = 400, n = 48) {
  const right = [], left = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, w = halfWidth(s, B), y = cy - L / 2 + s * L;
    right.push([cx + w, y]);
    left.push([cx - w, y]);
  }
  return [...right, ...left.slice(1, -1).reverse()];
}

/** The band of deck between stations s0..s1 on one side (+1 starboard, −1 port). */
function band(s0, s1, side, inset = 0.93, n = 10) {
  const { L, B } = BOAT_CANVAS;
  const pts = [[300, 400 - L / 2 + s0 * L]];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    pts.push([300 + side * halfWidth(s, B) * inset, 400 - L / 2 + s * L]);
  }
  pts.push([300, 400 - L / 2 + s1 * L]);
  return pts;
}

export function kayakTopSVG(sk) {
  const { L, B } = BOAT_CANVAS;
  const yAt = (s) => 400 - L / 2 + s * L;
  const wAt = (s, k = 0.8) => halfWidth(s, B) * k;
  const bungee = (s0, s1) => {
    const a = yAt(s0), b = yAt(s1), wa = wAt(s0), wb = wAt(s1);
    return `<path d="M${f(300 - wa)} ${f(a)} L${f(300 + wb)} ${f(b)} M${f(300 + wa)} ${f(a)} L${f(300 - wb)} ${f(b)}"/>`;
  };
  const fit = (s) => `<circle cx="${f(300 - wAt(s))}" cy="${f(yAt(s))}" r="2.6"/><circle cx="${f(300 + wAt(s))}" cy="${f(yAt(s))}" r="2.6"/>`;
  const chev = sk.mark ? (() => {
    const yA = yAt(0.83), yB = yAt(0.7), t = 28, w = halfWidth(0.7, B) * 0.93;
    return `<path d="${pathOf([[300, yA], [300 - w, yB], [300 - w, yB - t], [300, yA - t * 1.1]])}" fill="${sk.mark}"/>
      <path d="${pathOf([[300, yA], [300 + w, yB], [300 + w, yB - t], [300, yA - t * 1.1]])}" fill="${sk.markLo}"/>`;
  })() : '';
  const panel = sk.panel ? `<path d="${pathOf(band(0.66, 0.86, -1))}" fill="${sk.panel}"/><path d="${pathOf(band(0.66, 0.86, 1))}" fill="${sk.panelLo}"/>` : '';
  const cy = yAt(0.52);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="dk" x1="${300 - B / 2}" y1="0" x2="${300 + B / 2}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${sk.deckHi}"/><stop offset="0.42" stop-color="${sk.deck}"/><stop offset="0.5" stop-color="${sk.deck}"/><stop offset="0.56" stop-color="${sk.deckLo}"/><stop offset="1" stop-color="${sk.deckLo}"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="inside" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f1f3f1"/><stop offset="1" stop-color="#b9c1c1"/>
    </linearGradient>
  </defs>
  <path d="${pathOf(outline(L * 1.004, B * 1.08))}" fill="#f6f6f2"/>
  <path d="${pathOf(outline(L, B * 1.0))}" fill="#0f1113"/>
  <path d="${pathOf(outline(L * 0.985, B * 0.92))}" fill="url(#dk)"/>
  ${panel}${chev}
  <path d="${pathOf(outline(L * 0.985, B * 0.92))}" fill="url(#gloss)"/>
  <path d="M300 ${f(yAt(0.02))} L300 ${f(yAt(0.42))} M300 ${f(yAt(0.62))} L300 ${f(yAt(0.98))}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
  <path d="${pathOf(outline(L * 0.9, B * 0.78))}" fill="none" stroke="#0b0c0e" stroke-width="2.2" stroke-opacity="0.85"/>
  <g stroke="#000000" stroke-opacity="0.35" stroke-width="4" transform="translate(2 3)">${bungee(0.2, 0.28)}${bungee(0.28, 0.36)}${bungee(0.62, 0.7)}</g>
  <g stroke="#0b0c0e" stroke-width="3" stroke-linecap="round">${bungee(0.2, 0.28)}${bungee(0.28, 0.36)}${bungee(0.62, 0.7)}</g>
  <g fill="#3a3f44">${fit(0.2)}${fit(0.28)}${fit(0.36)}${fit(0.62)}${fit(0.7)}</g>
  <ellipse cx="300" cy="${f(cy)}" rx="${f(B * 0.39)}" ry="${f(L * 0.094)}" fill="#0b0c0e"/>
  <ellipse cx="300" cy="${f(cy)}" rx="${f(B * 0.31)}" ry="${f(L * 0.078)}" fill="url(#inside)"/>
  <path d="M${f(300 - B * 0.36)} ${f(cy - L * 0.04)} C${f(300 - B * 0.3)} ${f(cy - L * 0.085)} ${f(300 + B * 0.2)} ${f(cy - L * 0.095)} ${f(300 + B * 0.3)} ${f(cy - L * 0.07)}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2.5" fill="none"/>
  <path d="M${f(300 - B * 0.16)} ${f(cy - L * 0.07)} L${f(300 - B * 0.16)} ${f(cy - L * 0.01)} M${f(300 + B * 0.16)} ${f(cy - L * 0.07)} L${f(300 + B * 0.16)} ${f(cy - L * 0.01)}" stroke="${FRAME.fore}" stroke-width="3"/>
  <rect x="${f(300 - B * 0.2)}" y="${f(cy + L * 0.005)}" width="${f(B * 0.4)}" height="${f(L * 0.05)}" rx="8" fill="#1a1d20"/>
  <rect x="${f(300 - B * 0.22)}" y="${f(cy + L * 0.05)}" width="${f(B * 0.44)}" height="10" rx="5" fill="#2a2f33"/>
  <path d="M296 6 C286 -2 282 14 294 16 M304 794 C314 802 318 786 306 784" stroke="#0b0c0e" stroke-width="3" fill="none"/>
</svg>`;
}

/** The upturned hull: white, what a rescuer looks for. */
export function hullUpSVG() {
  const { L, B } = BOAT_CANVAS;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs><linearGradient id="h" x1="${300 - B / 2}" y1="0" x2="${300 + B / 2}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#eef0ee"/><stop offset="1" stop-color="#b8c1c1"/></linearGradient></defs>
  <path d="${pathOf(outline(L, B * 1.02))}" fill="#0f1113"/>
  <path d="${pathOf(outline(L * 0.99, B * 0.96))}" fill="url(#h)"/>
  <path d="M300 10 L300 790" stroke="#8d989a" stroke-width="3"/>
  <path d="${pathOf(outline(L * 0.86, B * 0.62))}" fill="none" stroke="#a8b2b3" stroke-width="2"/>
</svg>`;
}

/** A soft shadow under any hull; drawn offset toward the sun's opposite side. */
export function shadowSVG(wUnits, hUnits) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wUnits} ${hUnits}" width="${wUnits}" height="${hUnits}">
  <defs><radialGradient id="b" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#00161c" stop-opacity="0.5"/><stop offset="0.55" stop-color="#00161c" stop-opacity="0.3"/><stop offset="1" stop-color="#00161c" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="${wUnits / 2}" cy="${hUnits / 2}" rx="${f(wUnits * 0.16)}" ry="${f(hUnits * 0.5)}" fill="url(#b)"/>
</svg>`;
}

// ---------- Paddler (bow up, same canvas as the deck) ----------

export const STROKE_FRAMES = 16;

/**
 * The paddler from above at `phase` (0..1 through a left-right stroke pair), or resting with the
 * paddle across the deck. The torso rotates into each catch — the engine of a good stroke.
 */
export function paddlerTopSVG(phase, pfd, resting = false) {
  const { L, B } = BOAT_CANVAS;
  const cx = 300, cy = 400 - L / 2 + 0.515 * L;
  const ang = Math.PI * 2 * phase;
  const swing = resting ? Math.PI / 2 : Math.PI / 2 + Math.sin(ang) * 0.62;
  const reach = L * 0.3;
  const ax = Math.cos(swing) * reach, ay = -Math.sin(swing) * reach * 0.5 + (resting ? 0 : Math.cos(ang) * L * 0.02);
  const A = [cx + ax, cy - L * 0.03 + ay], Bp = [cx - ax, cy - L * 0.03 - ay];
  const twist = resting ? 0 : Math.sin(ang) * 0.32; // torso rotation, radians
  const sh = B * 0.27;
  const sL = [cx - Math.cos(twist) * sh, cy + Math.sin(twist) * sh * 0.6];
  const sR = [cx + Math.cos(twist) * sh, cy - Math.sin(twist) * sh * 0.6];
  const hand = (t) => [A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t];
  // Hands a little wider than the shoulders on the shaft; elbows bend out and down.
  const hR = hand(0.33), hL = hand(0.67);
  const elbow = (s, h, side) => [(s[0] + h[0]) / 2 + side * 12, (s[1] + h[1]) / 2 + 10];
  const eR = elbow(sR, hR, 1), eL = elbow(sL, hL, -1);
  const blade = (P, dir) => {
    // Asymmetric, slightly dihedral blade on the end of the shaft.
    const dx = (P[0] - cx), dy = (P[1] - cy);
    const a = Math.atan2(dy, dx), len = 64, wid = 24;
    const c = Math.cos(a), s = Math.sin(a);
    const pt = (u, v) => [P[0] + u * c - v * s, P[1] + u * s + v * c];
    return pathOf([pt(-8, -wid * 0.35), pt(len * 0.5, -wid * 0.55), pt(len, -wid * 0.42), pt(len + 4, 0), pt(len, wid * 0.5), pt(len * 0.5, wid * 0.6), pt(-8, wid * 0.4)]) + (dir ? '' : '');
  };
  // Which blade is in the water: the lower one in the stroke.
  const wetA = !resting && Math.sin(ang) > 0.15, wetB = !resting && Math.sin(ang) < -0.15;
  const ripple = (P) => `<ellipse cx="${f(P[0])}" cy="${f(P[1])}" rx="46" ry="30" fill="none" stroke="#e8f4f1" stroke-opacity="0.45" stroke-width="3"/>`;
  const tipA = [A[0] + (A[0] - cx) * 0.18, A[1] + (A[1] - cy) * 0.18], tipB = [Bp[0] + (Bp[0] - cx) * 0.18, Bp[1] + (Bp[1] - cy) * 0.18];
  const arm = (s, e, h) => `<path d="M${f(s[0])} ${f(s[1])} L${f(e[0])} ${f(e[1])} L${f(h[0])} ${f(h[1])}" stroke="url(#suit)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const rotDeg = (-twist * 180) / Math.PI;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a7c8a"/><stop offset="1" stop-color="#2b4450"/></linearGradient>
    <radialGradient id="pfd" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${pfd.hi}"/><stop offset="0.6" stop-color="${pfd.base}"/><stop offset="1" stop-color="${pfd.lo}"/></radialGradient>
    <radialGradient id="hat" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#efe4c6"/><stop offset="1" stop-color="#b3a47c"/></radialGradient>
    <linearGradient id="bl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#c9c2b0"/></linearGradient>
  </defs>
  ${wetA ? ripple(tipA) : ''}${wetB ? ripple(tipB) : ''}
  <g opacity="0.3" transform="translate(6 9)"><path d="M${f(A[0])} ${f(A[1])} L${f(Bp[0])} ${f(Bp[1])}" stroke="#00161c" stroke-width="7"/></g>
  <path d="${blade(A)}" fill="url(#bl)" stroke="#1a1d20" stroke-width="2" opacity="${wetA ? 0.75 : 1}"/>
  <path d="${blade(Bp)}" fill="url(#bl)" stroke="#1a1d20" stroke-width="2" opacity="${wetB ? 0.75 : 1}"/>
  <path d="M${f(A[0])} ${f(A[1])} L${f(Bp[0])} ${f(Bp[1])}" stroke="#202326" stroke-width="7" stroke-linecap="round"/>
  <path d="M${f(A[0])} ${f(A[1] - 2)} L${f(Bp[0])} ${f(Bp[1] - 2)}" stroke="#6b7378" stroke-width="1.5" opacity="0.7"/>
  <ellipse cx="${cx}" cy="${f(cy + 14)}" rx="${f(B * 0.3)}" ry="22" fill="#15181b"/>
  ${arm(sL, eL, hL)}${arm(sR, eR, hR)}
  <g transform="rotate(${f(rotDeg)} ${cx} ${f(cy)})">
    <ellipse cx="${cx}" cy="${f(cy)}" rx="${f(sh + 7)}" ry="25" fill="url(#suit)"/>
    <path d="M${f(cx - sh + 2)} ${f(cy - 8)} C${f(cx - sh + 4)} ${f(cy - 24)} ${f(cx + sh - 4)} ${f(cy - 24)} ${f(cx + sh - 2)} ${f(cy - 8)} L${f(cx + sh - 4)} ${f(cy + 18)} C${f(cx + 12)} ${f(cy + 28)} ${f(cx - 12)} ${f(cy + 28)} ${f(cx - sh + 4)} ${f(cy + 18)} Z" fill="url(#pfd)"/>
    <path d="M${cx} ${f(cy - 20)} L${cx} ${f(cy + 24)}" stroke="#000" stroke-opacity="0.25" stroke-width="2"/>
    <rect x="${f(cx - sh + 6)}" y="${f(cy - 12)}" width="10" height="5" rx="2" fill="#dfe6e8"/>
    <rect x="${f(cx + sh - 16)}" y="${f(cy - 12)}" width="10" height="5" rx="2" fill="#dfe6e8"/>
    <circle cx="${cx}" cy="${f(cy - 2)}" r="25" fill="#000" opacity="0.18"/>
    <circle cx="${cx}" cy="${f(cy - 4)}" r="23" fill="url(#hat)"/>
    <circle cx="${cx}" cy="${f(cy - 4)}" r="23" fill="none" stroke="#8a7a54" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${f(cy - 6)}" r="13" fill="#cdbf98"/>
    <circle cx="${cx}" cy="${f(cy - 6)}" r="13" fill="none" stroke="#5a4f36" stroke-width="2.5" stroke-opacity="0.8"/>
    <path d="M${f(cx - 8)} ${f(cy - 26)} L${f(cx + 8)} ${f(cy - 26)}" stroke="#20292e" stroke-width="3" stroke-linecap="round"/>
  </g>
  <circle cx="${f(hL[0])}" cy="${f(hL[1])}" r="8" fill="#20262a"/><circle cx="${f(hR[0])}" cy="${f(hR[1])}" r="8" fill="#20262a"/>
</svg>`;
}

export const PFD_TONES = {
  yellow: { hi: '#f9d27c', base: '#e7a33a', lo: '#a8661c' },
  white: { hi: '#ffffff', base: '#e2e9e7', lo: '#a9b5b2' },
  red: { hi: '#f28a7a', base: '#d2453a', lo: '#8f241c' },
};

// ---------- Orca (head up) ----------
// Canvas 200 × 800: an orca about 7 m long. The dorsal fin is drawn leaning a little, with its
// shadow, so it reads from above; the saddle patch sits just behind it.
export function orcaSVG(bull = false) {
  const finH = bull ? 150 : 80, finW = bull ? 26 : 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 800" width="200" height="800">
  <defs>
    <linearGradient id="bd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3138"/><stop offset="0.35" stop-color="#0b0e11"/><stop offset="1" stop-color="#05070a"/></linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M100 30 C130 34 150 90 156 190 C162 300 150 430 132 540 C122 600 112 640 106 680 L94 680 C88 640 78 600 68 540 C50 430 38 300 44 190 C50 90 70 34 100 30 Z" fill="url(#bd)"/>
  <path d="M70 160 C40 170 18 210 22 250 C40 236 58 214 72 196 Z" fill="#090b0e"/>
  <path d="M130 160 C160 170 182 210 178 250 C160 236 142 214 128 196 Z" fill="#05070a"/>
  <path d="M100 672 C70 700 30 728 14 760 C46 758 80 742 100 716 C120 742 154 758 186 760 C170 728 130 700 100 672 Z" fill="#06080b"/>
  <path d="M100 40 C112 42 122 100 124 200 C126 300 118 420 108 520" stroke="url(#sh)" stroke-width="10" fill="none"/>
  <path d="M52 120 C48 104 54 92 62 96 C60 108 58 116 52 120 Z" fill="#e9eef0"/>
  <path d="M148 120 C152 104 146 92 138 96 C140 108 142 116 148 120 Z" fill="#c9d0d4"/>
  <path d="M74 380 C86 364 114 364 126 380 C122 410 110 430 100 434 C90 430 78 410 74 380 Z" fill="#9ea7ad" opacity="0.85"/>
  <path d="M${100 - finW / 2} 340 L${100 + finW / 2} 340 L${f(100 + finH * 0.55)} ${f(330 + finH * 0.5)} Z" fill="#00161c" opacity="0.45"/>
  <path d="M100 286 C${100 - finW / 2} 300 ${100 - finW / 2} 340 100 352 C${100 + finW / 2} 340 ${100 + finW / 2} 300 100 286 Z" fill="#030405"/>
  <path d="M100 ${330 - finH * 0.55} C${100 + finW * 0.7} ${330 - finH * 0.3} ${100 + finW * 0.6} 320 ${100 + finW / 2} 340 L${100 - finW / 2} 340 C${100 - finW * 0.3} 320 ${100 - finW * 0.1} ${330 - finH * 0.3} 100 ${330 - finH * 0.55} Z" fill="#0d1115"/>
  <path d="M100 ${330 - finH * 0.55} C${100 + finW * 0.7} ${330 - finH * 0.3} ${100 + finW * 0.6} 320 ${100 + finW / 2} 340" stroke="#7d8a96" stroke-width="3" fill="none"/>
</svg>`;
}

// ---------- Harbour seals and their rock ----------

export function sealSVG(tone = 0) {
  const base = ['#8a8578', '#6e6a60', '#a39e8e'][tone % 3], dark = ['#4a473f', '#3a3833', '#5d594f'][tone % 3];
  const spots = [[44, 90], [62, 120], [38, 150], [70, 170], [50, 200], [34, 112], [66, 222], [44, 240], [58, 80], [30, 186]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${3 + (i % 3)}" ry="${2 + (i % 2)}" fill="${dark}" opacity="0.7"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300" width="100" height="300">
  <defs><radialGradient id="sb" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#d6d1c2"/><stop offset="0.4" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient></defs>
  <path d="M50 18 C64 18 70 34 70 46 C80 70 84 120 80 170 C78 210 70 240 58 262 L42 262 C30 240 22 210 20 170 C16 120 20 70 30 46 C30 34 36 18 50 18 Z" fill="url(#sb)"/>
  ${spots}
  <path d="M42 260 C34 276 24 288 14 292 C28 294 42 284 50 270 C58 284 72 294 86 292 C76 288 66 276 58 260 Z" fill="${dark}"/>
  <path d="M24 104 C12 112 8 126 10 138 C20 130 26 120 28 112 Z M76 104 C88 112 92 126 90 138 C80 130 74 120 72 112 Z" fill="${dark}"/>
  <ellipse cx="50" cy="20" rx="9" ry="8" fill="#3a3833" opacity="0.6"/>
  <circle cx="43" cy="34" r="3.5" fill="#0d0e0f"/><circle cx="57" cy="34" r="3.5" fill="#0d0e0f"/>
  <circle cx="44" cy="33" r="1" fill="#ffffff" opacity="0.8"/><circle cx="58" cy="33" r="1" fill="#ffffff" opacity="0.8"/>
</svg>`;
}

export function sealHeadSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <ellipse cx="60" cy="60" rx="52" ry="40" fill="none" stroke="#e8f4f1" stroke-opacity="0.5" stroke-width="3"/>
  <ellipse cx="60" cy="60" rx="18" ry="20" fill="#5d594f"/><ellipse cx="60" cy="52" rx="10" ry="8" fill="#3a3833"/>
  <circle cx="54" cy="58" r="3" fill="#0d0e0f"/><circle cx="66" cy="58" r="3" fill="#0d0e0f"/>
</svg>`;
}

export function sealRockSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
  <defs>
    <radialGradient id="rk" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#a49e8e"/><stop offset="0.6" stop-color="#7c776b"/><stop offset="1" stop-color="#4f4b43"/></radialGradient>
    <filter id="tx"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.19  0 0 0 0 0.16  0 0 0 0.5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  </defs>
  <path d="M30 140 C20 90 70 40 150 30 C230 18 320 40 360 90 C392 130 380 190 330 220 C270 252 160 250 90 230 C50 218 36 180 30 140 Z" fill="#3d5a3a"/>
  <path d="M40 138 C34 96 80 52 152 42 C226 32 312 52 348 96 C374 130 364 184 322 208 C266 238 164 238 98 218 C62 206 46 176 40 138 Z" fill="url(#rk)"/>
  <path d="M40 138 C34 96 80 52 152 42 C226 32 312 52 348 96 C374 130 364 184 322 208 C266 238 164 238 98 218 C62 206 46 176 40 138 Z" fill="#fff" filter="url(#tx)"/>
  <g fill="#e2d9a8" opacity="0.55"><ellipse cx="120" cy="90" rx="22" ry="12"/><ellipse cx="260" cy="70" rx="16" ry="9"/><ellipse cx="300" cy="170" rx="18" ry="10"/></g>
  <path d="M60 170 C80 200 120 218 170 222 M330 120 C344 150 336 180 316 196" stroke="#2f2c27" stroke-width="3" fill="none" opacity="0.5"/>
  <g fill="#7a5a2a" opacity="0.8"><circle cx="58" cy="190" r="5"/><circle cx="72" cy="204" r="4"/><circle cx="340" cy="186" r="5"/><circle cx="356" cy="160" r="4"/><circle cx="90" cy="216" r="4"/></g>
</svg>`;
}

// ---------- Ferry (bow up; double-ended) ----------
// Canvas 160 × 800: a large ferry about 110 m long.
export function ferrySVG() {
  const win = Array.from({ length: 22 }, (_, i) => `<rect x="34" y="${170 + i * 21}" width="5" height="12" fill="#1d2a2f"/><rect x="121" y="${170 + i * 21}" width="5" height="12" fill="#1d2a2f"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 800" width="160" height="800">
  <defs>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#eef1ef"/><stop offset="1" stop-color="#c6cecd"/></linearGradient>
    <linearGradient id="rf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f8f7"/><stop offset="1" stop-color="#d4dbda"/></linearGradient>
  </defs>
  <path d="M80 4 C120 30 150 90 152 160 L152 640 C150 710 120 770 80 796 C40 770 10 710 8 640 L8 160 C10 90 40 30 80 4 Z" fill="url(#hl)"/>
  <path d="M80 4 C120 30 150 90 152 160 L152 640 C150 710 120 770 80 796 C40 770 10 710 8 640 L8 160 C10 90 40 30 80 4 Z" fill="none" stroke="#2f7d5a" stroke-width="5"/>
  <path d="M26 110 L134 110 L134 690 L26 690 Z" fill="#3a4246"/>
  <g fill="#c9d0d2" opacity="0.8">${Array.from({ length: 12 }, (_, i) => `<rect x="${32 + (i % 4) * 25}" y="${116 + Math.floor(i / 4) * 30}" width="18" height="24" rx="4"/><rect x="${32 + (i % 4) * 25}" y="${590 + Math.floor(i / 4) * 30}" width="18" height="24" rx="4"/>`).join('')}</g>
  <rect x="30" y="160" width="100" height="480" rx="10" fill="url(#rf)"/>
  ${win}
  <rect x="44" y="176" width="72" height="448" rx="6" fill="#e3e8e7"/>
  <path d="M30 170 L130 170 M30 630 L130 630" stroke="#2f7d5a" stroke-width="4"/>
  <rect x="58" y="186" width="44" height="26" rx="4" fill="#ffffff" stroke="#9aa6a8"/><rect x="62" y="192" width="36" height="7" fill="#1d2a2f"/>
  <rect x="58" y="588" width="44" height="26" rx="4" fill="#ffffff" stroke="#9aa6a8"/><rect x="62" y="601" width="36" height="7" fill="#1d2a2f"/>
  <rect x="66" y="360" width="28" height="36" rx="6" fill="#ffffff" stroke="#9aa6a8"/><rect x="66" y="360" width="28" height="9" rx="3" fill="#1d2a2f"/>
  <rect x="66" y="404" width="28" height="36" rx="6" fill="#ffffff" stroke="#9aa6a8"/><rect x="66" y="431" width="28" height="9" rx="3" fill="#1d2a2f"/>
  <g fill="#f08a24">${[250, 290, 490, 530].map((y) => `<rect x="48" y="${y}" width="12" height="22" rx="5"/><rect x="100" y="${y}" width="12" height="22" rx="5"/>`).join('')}</g>
</svg>`;
}
