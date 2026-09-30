// Procedural kayak art. Everything drawn in code (Principle VIII) from the real proportions of a
// 16 ft × 22.5 in folding sea kayak, slightly widened so it reads at phone size.

export const HULL = { player: 0xb8402c, partner: 0x2d7f86 };
export const PFD = { player: 0xf2b441, partner: 0xe9f1ee };

function hullOutline(L, B, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n; // 0 bow → 1 stern
    const w = (B / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.94 + 0.03)), 0.62) * (1 - 0.06 * (1 - s));
    pts.push({ x: w, y: -L / 2 + s * L });
  }
  const back = pts.slice(1, -1).reverse().map((p) => ({ x: -p.x, y: p.y }));
  return [...pts, ...back];
}

/**
 * Draw a kayak from above, bow toward −y. `phase` animates the paddle (0..1 per stroke pair);
 * `lean` (−1..1) shifts the paddler with the edge; `resting` lays the paddle across the deck.
 */
export function drawKayakTop(g, L, opts = {}) {
  const B = L * 0.15;
  const hull = opts.hull ?? HULL.player;
  const pfd = opts.pfd ?? PFD.player;
  g.clear();
  // Soft shadow in the water.
  g.fillStyle(0x00161c, 0.28);
  g.fillPoints(hullOutline(L * 1.02, B * 1.25).map((p) => ({ x: p.x + L * 0.02, y: p.y + L * 0.03 })), true);
  // Hull and deck.
  const outline = hullOutline(L, B);
  g.fillStyle(hull, 1);
  g.fillPoints(outline, true);
  g.lineStyle(Math.max(1, L * 0.012), 0x1a1a1a, 0.45);
  g.strokePoints(outline, true);
  // Light on the deck ridge.
  g.lineStyle(Math.max(1, L * 0.01), 0xffffff, 0.25);
  g.lineBetween(0, -L * 0.47, 0, -L * 0.12);
  g.lineBetween(0, L * 0.1, 0, L * 0.47);
  // Deck lines (bungees) fore and aft.
  g.lineStyle(Math.max(1, L * 0.007), 0x111111, 0.7);
  for (const y of [-0.3, -0.22]) g.lineBetween(-B * 0.3, L * y, B * 0.3, L * (y + 0.05));
  for (const y of [-0.3, -0.22]) g.lineBetween(B * 0.3, L * y, -B * 0.3, L * (y + 0.05));
  for (const y of [0.24, 0.32]) { g.lineBetween(-B * 0.3, L * y, B * 0.3, L * (y + 0.05)); g.lineBetween(B * 0.3, L * y, -B * 0.3, L * (y + 0.05)); }
  // Cockpit coaming and spray skirt.
  g.fillStyle(0x16181a, 1);
  g.fillEllipse(0, L * 0.02, B * 0.72, L * 0.17);
  g.fillStyle(0x2a2f33, 1);
  g.fillEllipse(0, L * 0.02, B * 0.6, L * 0.14);

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
