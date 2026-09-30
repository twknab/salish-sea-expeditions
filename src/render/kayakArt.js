// Procedural kayak art. Everything drawn in code (Principle VIII) from the real proportions of a
// 16 ft × 22.5 in folding sea kayak, slightly widened so it reads at phone size.

export const HULL = { player: 0xb8402c, partner: 0x2d7f86 };
export const PFD = { player: 0xf2b441, partner: 0xe9f1ee };

function halfWidth(s, B) {
  return (B / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.94 + 0.03)), 0.62) * (1 - 0.06 * (1 - s));
}

function hullOutline(L, B, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n; // 0 bow → 1 stern
    pts.push({ x: halfWidth(s, B), y: -L / 2 + s * L });
  }
  const back = pts.slice(1, -1).reverse().map((p) => ({ x: -p.x, y: p.y }));
  return [...pts, ...back];
}

const toHex = (c, d) => (c == null ? d : typeof c === 'number' ? c : parseInt(c.slice(1), 16));

/** One half (side = +1 starboard, −1 port) of a band across the deck between stations s0..s1. */
function deckBand(L, B, s0, s1, side, inset = 0.93, n = 8) {
  const pts = [{ x: 0, y: -L / 2 + s0 * L }];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    pts.push({ x: side * halfWidth(s, B) * inset, y: -L / 2 + s * L });
  }
  pts.push({ x: 0, y: -L / 2 + s1 * L });
  return pts;
}

/**
 * Draw a kayak from above, bow toward −y. `phase` animates the paddle (0..1 per stroke pair);
 * `lean` (−1..1) shifts the paddler with the edge; `resting` lays the paddle across the deck.
 * `skin` (content/skins.js) gives the real design language: deck colour inside a black perimeter
 * line, a panel and chevron on the stern deck, crisscross bungees, a black coaming and seat on a
 * light interior. The ridge splits each colour into a lit (port) and shaded (starboard) half.
 */
export function drawKayakTop(g, L, opts = {}) {
  const B = L * 0.15;
  const sk = opts.skin;
  const deck = toHex(sk?.deck, opts.hull ?? HULL.player);
  const deckLo = toHex(sk?.deckLo, deck);
  const pfd = opts.pfd ?? PFD.player;
  const lw = (f) => Math.max(1, L * f);
  g.clear();
  // Soft shadow in the water.
  g.fillStyle(0x00161c, 0.28);
  g.fillPoints(hullOutline(L * 1.02, B * 1.25).map((p) => ({ x: p.x + L * 0.02, y: p.y + L * 0.03 })), true);
  // A sliver of white hull, the black perimeter line, then the deck.
  g.fillStyle(0xf4f4f1, 1);
  g.fillPoints(hullOutline(L * 1.005, B * 1.06), true);
  g.fillStyle(0x101214, 1);
  g.fillPoints(hullOutline(L, B), true);
  g.fillStyle(deck, 1);
  g.fillPoints(hullOutline(L * 0.985, B * 0.9), true);
  // The ridge: starboard half in shade.
  g.fillStyle(deckLo, 0.45);
  g.fillPoints(deckBand(L * 0.985, B * 0.9, 0.01, 0.99, 1, 1, 20), true);
  // Stern-deck panel and chevron (pointing aft).
  if (sk?.panel) {
    g.fillStyle(toHex(sk.panel), 1); g.fillPoints(deckBand(L, B, 0.66, 0.86, -1), true);
    g.fillStyle(toHex(sk.panelLo), 1); g.fillPoints(deckBand(L, B, 0.66, 0.86, 1), true);
  }
  if (sk?.mark) {
    const yA = -L / 2 + 0.83 * L, yB = -L / 2 + 0.7 * L, t = L * 0.035;
    for (const side of [-1, 1]) {
      const w = halfWidth(0.7, B) * 0.93 * side;
      g.fillStyle(toHex(side < 0 ? sk.mark : sk.markLo), 1);
      g.fillPoints([{ x: 0, y: yA }, { x: w, y: yB }, { x: w, y: yB - t }, { x: 0, y: yA - t * 1.1 }], true);
    }
  }
  // Perimeter deck lines and crisscross bungees, fore and aft.
  g.lineStyle(lw(0.006), 0x0c0d0f, 0.85);
  const X = (s0, s1) => {
    const a = -L / 2 + s0 * L, b = -L / 2 + s1 * L, wa = halfWidth(s0, B) * 0.8, wb = halfWidth(s1, B) * 0.8;
    g.lineBetween(-wa, a, wb, b); g.lineBetween(wa, a, -wb, b);
  };
  X(0.2, 0.28); X(0.28, 0.36);
  X(0.62, 0.7);
  g.lineStyle(lw(0.004), 0x0c0d0f, 0.6);
  g.strokePoints(hullOutline(L * 0.9, B * 0.78), true);
  // Cockpit: black coaming around a light interior, black seat, a glimpse of blue frame.
  const cy0 = L * 0.02;
  g.fillStyle(0x0c0e10, 1);
  g.fillEllipse(0, cy0, B * 0.74, L * 0.18);
  g.fillStyle(0xdfe3e1, 1);
  g.fillEllipse(0, cy0, B * 0.6, L * 0.15);
  g.lineStyle(lw(0.004), 0x2c86cf, 0.9);
  g.lineBetween(-B * 0.16, cy0 - L * 0.065, -B * 0.16, cy0 - L * 0.01);
  g.fillStyle(0x1a1d20, 1);
  g.fillRoundedRect(-B * 0.2, cy0 + L * 0.005, B * 0.4, L * 0.055, B * 0.08);
  if (opts.empty) return { B };
  // Paddler.
  const lean = (opts.lean ?? 0) * B * 0.08;
  const px = lean;
  const phase = opts.phase ?? 0;
  const resting = !!opts.resting;
  // Paddle angle: sweeps side to side with each stroke.
  const swing = resting ? Math.PI / 2 : Math.PI / 2 + Math.sin(phase * Math.PI * 2) * 0.62;
  const reach = L * 0.3;
  const cx = px, cy = L * 0.0;
  const ax = Math.cos(swing) * reach, ay = -Math.sin(swing) * reach * 0.5 + (resting ? 0 : Math.cos(phase * Math.PI * 2) * L * 0.02);
  const bx = -ax, by = -ay;
  // Paddle shaft and blades.
  g.lineStyle(Math.max(1.5, L * 0.016), 0x2b2b2b, 1);
  g.lineBetween(cx + ax, cy + ay, cx + bx, cy + by);
  g.fillStyle(0xe8e3d4, 1);
  const blade = (x, y, ang) => {
    const w = L * 0.055, h = L * 0.13;
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const ex = Math.cos(a) * w * 0.5, ey = Math.sin(a) * h * 0.5;
      pts.push({ x: x + ex * Math.cos(ang) - ey * Math.sin(ang), y: y + ex * Math.sin(ang) + ey * Math.cos(ang) });
    }
    g.fillPoints(pts, true);
  };
  const shaftAng = Math.atan2(by - ay, bx - ax);
  blade(cx + ax * 1.08, cy + ay * 1.08, shaftAng + Math.PI / 2);
  blade(cx + bx * 1.08, cy + by * 1.08, shaftAng + Math.PI / 2);
  // Arms to the shaft.
  g.lineStyle(Math.max(1.5, L * 0.022), 0x3a4a52, 1);
  g.lineBetween(cx - B * 0.2, cy + L * 0.01, cx + ax * 0.42, cy + ay * 0.42);
  g.lineBetween(cx + B * 0.2, cy + L * 0.01, cx + bx * 0.42, cy + by * 0.42);
  // PFD (torso) and head with a sun hat.
  g.fillStyle(pfd, 1);
  g.fillEllipse(cx, cy + L * 0.015, B * 0.62, L * 0.075);
  g.fillStyle(0xd9c9a3, 1);
  g.fillCircle(cx, cy - L * 0.005, L * 0.034);
  g.lineStyle(Math.max(1, L * 0.006), 0x7a6a4a, 0.8);
  g.strokeCircle(cx, cy - L * 0.005, L * 0.034);
  return { B };
}

/** Side view for Boat School anatomy. Returns part anchor positions in local coordinates. */
export function drawKayakSide(g, W, opts = {}) {
  const H = W * 0.11;
  const hull = opts.hull ?? HULL.player;
  g.clear();
  const deck = [], keel = [];
  for (let i = 0; i <= 40; i++) {
    const s = i / 40;
    const x = -W / 2 + s * W;
    const rocker = Math.pow(Math.abs(s - 0.5) * 2, 2.4) * H * 0.55; // ends rise
    const sheer = Math.pow(Math.abs(s - 0.5) * 2, 3) * H * 0.3;
    deck.push({ x, y: -H * 0.35 - sheer * 0.6 + rocker * 0.2 });
    keel.push({ x, y: H * 0.55 - rocker * 1.3 });
  }
  const shape = [...deck, ...keel.slice().reverse()];
  // Water line and reflection.
  g.fillStyle(0x0e3a45, 0.6);
  g.fillRect(-W * 0.6, H * 0.18, W * 1.2, H * 1.6);
  g.lineStyle(2, 0x9fb8b3, 0.5);
  g.lineBetween(-W * 0.6, H * 0.18, W * 0.6, H * 0.18);
  g.fillStyle(hull, 1);
  g.fillPoints(shape, true);
  // Chine highlight.
  g.lineStyle(Math.max(1, W * 0.004), 0xffffff, 0.22);
  g.strokePoints(keel.map((p) => ({ x: p.x, y: p.y - H * 0.28 })).slice(4, 37), false);
  g.lineStyle(Math.max(1, W * 0.003), 0x1a1a1a, 0.5);
  g.strokePoints(shape, true);
  // Frame, seen through the skin (ribs and stringers, faint).
  g.lineStyle(Math.max(1, W * 0.002), 0xffffff, 0.18);
  for (let i = 1; i < 12; i++) {
    const x = -W / 2 + (i / 12) * W;
    g.lineBetween(x, -H * 0.28, x, H * 0.42 - Math.pow(Math.abs(i / 12 - 0.5) * 2, 2.4) * H * 0.7);
  }
  // Flotation bags (ghosted).
  g.fillStyle(0xf2c572, 0.18);
  g.fillEllipse(-W * 0.3, H * 0.08, W * 0.26, H * 0.5);
  g.fillEllipse(W * 0.3, H * 0.08, W * 0.26, H * 0.5);
  // Hull jacks (three: two sides, one keel).
  g.fillStyle(0xe9f1ee, 0.85);
  g.fillRect(W * 0.06, -H * 0.05, W * 0.012, H * 0.4);
  g.fillRect(-W * 0.02, H * 0.2, W * 0.14, H * 0.05);
  // Cockpit coaming and spray skirt.
  g.fillStyle(0x16181a, 1);
  g.fillRoundedRect(-W * 0.06, -H * 0.55, W * 0.16, H * 0.22, H * 0.08);
  // Deck lines.
  g.lineStyle(Math.max(1, W * 0.003), 0x111111, 0.8);
  g.lineBetween(-W * 0.36, -H * 0.4, -W * 0.14, -H * 0.37);
  g.lineBetween(W * 0.18, -H * 0.37, W * 0.38, -H * 0.4);
  // Paddler silhouette (optional).
  if (opts.paddler) {
    g.fillStyle(0xf2b441, 1);
    g.fillRoundedRect(-W * 0.015, -H * 1.35, W * 0.07, H * 0.85, H * 0.15);
    g.fillStyle(0xd9c9a3, 1);
    g.fillCircle(W * 0.02, -H * 1.6, H * 0.24);
  }
  return { H };
}

/**
 * A paddler seated in a cutaway sea kayak, side view, bow to the left, at the catch of a forward
 * stroke. Drysuit, PFD, sun hat, sunglasses and a neck gaiter: a real paddler's kit, and a figure
 * that reads as a person without implying anyone's race or gender.
 * `P(x, y)` maps design units (origin at the seat, y down) to device pixels; `u` is px per unit.
 * Returns the anatomy points used for Boat School's fit taps.
 */
export function drawPaddlerSide(g, P, u, opts = {}) {
  const hull = opts.hull ?? HULL.player;
  const suit = 0x2f6f73, suitDark = 0x24585c, pfd = opts.pfd ?? PFD.player, ink = 0x16181a;
  const tone = 0xb7c4bf; // a stylised neutral, not a skin tone
  const poly = (pts, color, alpha = 1) => { g.fillStyle(color, alpha); g.fillPoints(pts.map(([x, y]) => P(x, y)), true); };
  const limb = (a, b, w, color) => {
    const A = P(...a), B = P(...b);
    g.lineStyle(w * u, color, 1);
    g.lineBetween(A.x, A.y, B.x, B.y);
    g.fillStyle(color, 1);
    g.fillCircle(A.x, A.y, (w * u) / 2);
    g.fillCircle(B.x, B.y, (w * u) / 2);
  };
  const curve = (x0, x1, f, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / n; return [x, f(x)]; });

  // Water.
  const W0 = P(-600, 16), W1 = P(600, 90);
  g.fillStyle(0x0e3a45, 0.55);
  g.fillRect(W0.x, W0.y, W1.x - W0.x, W1.y - W0.y);
  g.lineStyle(1.5 * u, 0x9fb8b3, 0.5);
  g.lineBetween(W0.x, W0.y, W1.x, W0.y);

  // Hull: deck sheer rising to the bow, rockered keel.
  const deck = (x) => -6 - Math.pow(Math.max(0, -x - 60) / 110, 2) * 16 - Math.pow(Math.max(0, x - 80) / 90, 2) * 8;
  const keel = (x) => 34 - Math.pow(Math.abs(x + 15) / 185, 2.2) * 34;
  const top = curve(-205, 185, deck), bottom = curve(185, -205, keel);
  poly([...top, ...bottom], hull);
  // Cutaway: the inside of the boat, where the legs go.
  const cavTop = curve(-150, 70, (x) => deck(x) + 4), cavBot = curve(70, -150, (x) => Math.min(keel(x) - 6, 26));
  poly([...cavTop, ...cavBot], 0x6e2418, 0.92);
  // Frame ribs, faint.
  g.lineStyle(1 * u, 0xffffff, 0.12);
  for (let x = -140; x <= 60; x += 25) { const a = P(x, deck(x) + 4), b = P(x, Math.min(keel(x) - 6, 26)); g.lineBetween(a.x, a.y, b.x, b.y); }
  // Deck lines and the chine highlight.
  g.lineStyle(1.2 * u, 0xffffff, 0.22);
  g.strokePoints(curve(-200, 180, (x) => keel(x) - 12).map(([x, y]) => P(x, y)), false);

  // Seat, backband, thigh brace, foot peg.
  poly([[16, 20], [66, 20], [66, 26], [16, 26]], 0x1f2326);
  poly([[60, -22], [70, -24], [72, 8], [62, 10]], 0x2a2f33);
  poly([[-60, -6], [-18, -6], [-20, -1], [-58, -1]], 0x2a2f33);
  poly([[-130, 4], [-124, 4], [-124, 24], [-130, 24]], 0x2a2f33);

  // Legs in the drysuit: hip → knee up under the brace → foot on the peg.
  const hip = [38, 14], knee = [-36, -5], ankle = [-112, 15], toe = [-122, 5];
  limb(hip, knee, 17, suitDark);
  limb(knee, ankle, 13, suitDark);
  limb(ankle, toe, 9, ink);

  // Coaming and spray skirt, sealing the paddler in.
  poly([[-44, -8], [70, -8], [70, -3], [-44, -3]], ink);
  poly([[-44, -8], [70, -8], [60, -22], [22, -24]], 0x1f2326);

  // Torso: sitting tall, a slight forward lean, rotated into the catch.
  const chest = [[22, -24], [60, -22], [58, -60], [52, -72], [30, -74], [18, -62]];
  poly(chest, suit);
  // PFD over the drysuit: panels, a pocket and the zip.
  poly([[20, -28], [60, -26], [57, -64], [26, -68]], pfd);
  g.lineStyle(1.2 * u, ink, 0.55);
  const z0 = P(38, -30), z1 = P(40, -66); g.lineBetween(z0.x, z0.y, z1.x, z1.y);
  poly([[24, -46], [36, -46], [36, -38], [24, -38]], 0x000000, 0.18);

  // Neck gaiter, head in profile facing the bow, sunglasses and sun hat.
  poly([[30, -74], [50, -74], [48, -82], [32, -82]], suitDark);
  const head = P(40, -94);
  g.fillStyle(tone, 1);
  g.fillEllipse(head.x, head.y, 25 * u, 28 * u);
  poly([[28, -94], [24, -90], [28, -88]], tone); // nose
  poly([[26, -99], [44, -99], [44, -94], [27, -94]], ink); // sunglasses
  g.fillStyle(0xd9cfb8, 1);
  const brim0 = P(14, -104), brim1 = P(66, -104);
  g.fillEllipse((brim0.x + brim1.x) / 2, brim0.y, brim1.x - brim0.x, 6 * u);
  g.fillEllipse(head.x, head.y - 12 * u, 26 * u, 16 * u);

  // Arms and paddle at the catch: lower arm reaching forward, top hand at eye level.
  const shoulder = [44, -64], topHand = [4, -76], lowHand = [-26, -40];
  limb(shoulder, [18, -58], 11, suit); limb([18, -58], topHand, 10, suit);
  limb(shoulder, [8, -46], 11, suit); limb([8, -46], lowHand, 10, suit);
  // The shaft runs past the lower hand down to a blade planted beside the feet.
  const bladeTip = [-112, 46];
  limb([22, -104], bladeTip, 4.5, 0x2b2b2b);
  const bt = P(-104, 32);
  g.fillStyle(0xe8e3d4, 1);
  g.fillEllipse(bt.x, bt.y, 13 * u, 34 * u);
  g.fillStyle(0x0e3a45, 0.55); // the part of the blade under water
  const wl = P(-118, 16), wr = P(-90, 52);
  g.fillRect(wl.x, wl.y, wr.x - wl.x, wr.y - wl.y);
  g.lineStyle(1.2 * u, 0xe9f1ee, 0.7); // a little splash ring where it enters
  const sp = P(-104, 16); g.strokeEllipse(sp.x, sp.y, 26 * u, 5 * u);
  g.fillStyle(ink, 1);
  for (const h of [topHand, lowHand]) { const q = P(...h); g.fillCircle(q.x, q.y, 6 * u); }

  return { feet: [-118, 10], knees: [-36, -6], hips: [38, 14], back: [64, -8], head: [40, -94] };
}
