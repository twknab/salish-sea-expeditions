// The folding sea kayak in 3D: a 4.88 m × 0.57 m hard-chine hull lofted from cross-sections, its
// skin painted per colourway (deck, stern panel, chevron, perimeter line, bungees), the coaming,
// seat and a glimpse of the colour-coded frame. Units are metres; +x is the bow, +y up, +z
// starboard, the waterline at y = 0 and the cockpit centre at the origin.
import * as THREE from 'three';
import { FRAME } from '../content/skins.js';

export const KAYAK = { L: 4.88, B: 0.57, cockpitS: 0.52, cockpitX: 0.42, cockpitZ: 0.2 };

/** Height of the deck surface at station s and lateral offset z (metres). */
export function deckY(s, z) {
  const h = heights(s), w = Math.max(halfBeam(s) * 0.97, 1e-4), t = Math.max(0, 1 - Math.abs(z) / w);
  return h.sheer + (h.ridge - h.sheer) * Math.sin((t * Math.PI) / 2);
}

/** Half-beam at station s (0 bow → 1 stern). */
export function halfBeam(s) {
  // Fine ends that close to a stem; fullest just aft of midships.
  const t = Math.min(1, Math.max(0, s));
  return (KAYAK.B / 2) * Math.pow(Math.sin(Math.PI * t), 0.7) * (1 - 0.06 * (1 - t));
}

/** x (metres, bow positive) of station s, with the cockpit centre at x = 0. */
export const xAt = (s) => (KAYAK.cockpitS - s) * KAYAK.L;

/** Heights along the hull: sheer, deck ridge and keel, with rocker and the upswept bow. */
export function heights(s) {
  const e = Math.abs(s - 0.5) * 2; // 0 midships → 1 at the ends
  const bow = s < 0.5 ? Math.pow(1 - s / 0.5, 3) : 0, stern = s > 0.5 ? Math.pow((s - 0.5) / 0.5, 3) : 0;
  const sheer = 0.15 + 0.12 * bow + 0.07 * stern;
  const cockpit = Math.exp(-Math.pow((s - KAYAK.cockpitS) / 0.08, 2)); // deck is lowest at the cockpit
  const fore = s < KAYAK.cockpitS ? 1 : 0.6; // a higher foredeck sheds waves and makes room for knees
  let ridge = sheer + 0.11 * fore * (1 - Math.pow(e, 3)) - 0.035 * cockpit + 0.015 * bow;
  // Around the cockpit the deck is shaped level, so the coaming sits flat on it.
  const near = Math.exp(-Math.pow((s - KAYAK.cockpitS) / 0.075, 4));
  ridge = ridge + (0.255 - ridge) * near;
  // Keel with rocker, sweeping up into a raked stem at each end.
  let keel = -0.15 * (1 - Math.pow(e, 2.4));
  const k = Math.min(1, Math.max(0, (e - 0.62) / 0.38));
  const stem = k * k * (3 - 2 * k);
  keel = keel + (sheer - 0.002 - keel) * Math.pow(stem, 2.2); // the stem meets the sheer at the tip
  const chine = keel + (Math.max(keel, sheer * 0.35) - keel) * 0.45;
  return { sheer, ridge, keel, chine };
}

/** One side's cross-section at s, from keel to ridge: [z, y] pairs and the panel each point starts. */
function section(s, side) {
  const w = halfBeam(s), h = heights(s);
  const pts = [
    [0, h.keel, 'bottom'],
    [0.86 * w, h.chine, 'side'],
    [w, h.sheer * 0.55, 'side'],
    [0.97 * w, h.sheer, 'deck'],
  ];
  // The deck arches from the sheer up to the ridge.
  for (let i = 1; i <= 5; i++) {
    const t = i / 5;
    pts.push([0.97 * w * (1 - t), h.sheer + (h.ridge - h.sheer) * Math.sin((t * Math.PI) / 2), 'deck']);
  }
  return pts.map(([z, y, panel]) => ({ z: z * side, y, panel }));
}

/**
 * Build one panel strip (bottom, side or deck) for one side, with UVs:
 * deck → (s, lateral 0..1 port→starboard, as seen from above); others → (s, height 0..1).
 */
function panelGeometry(panel, side, n = 120) {
  const pos = [], uv = [], idx = [];
  const first = { bottom: 0, side: 1, deck: 3 }[panel], last = { bottom: 1, side: 3, deck: 8 }[panel];
  const cols = last - first + 1;
  for (let i = 0; i <= n; i++) {
    const s = i / n, x = xAt(s), sec = section(s, side), w = Math.max(halfBeam(s), 1e-4);
    for (let j = first; j <= last; j++) {
      const p = sec[j];
      pos.push(x, p.y, p.z);
      if (panel === 'deck') uv.push(s, 0.5 + 0.5 * (p.z / w));
      else uv.push(s, (j - first) / (cols - 1));
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** All hull panels, both sides — exported for the geometry test. */
export function hullGeometries() {
  const out = {};
  for (const panel of ['bottom', 'side', 'deck']) out[panel] = [panelGeometry(panel, 1), panelGeometry(panel, -1)];
  return out;
}

// ---------- The painted skin ----------

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Coated-fabric grain: fine noise that gives the skin its sheen under the sun. */
function grain(ctx, w, h, amount = 10) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** The deck as seen from above, laid out in (station, lateral) space. */
export function paintDeck(sk, W = 2048, H = 512) {
  const c = canvas(W, H), g = c.getContext('2d');
  const X = (s) => s * W, Y = (lat) => (0.5 - 0.5 * lat) * H; // lat −1 port … +1 starboard (canvas is flipped: v = 1 is the top)
  g.fillStyle = sk.deck; g.fillRect(0, 0, W, H);
  grain(g, W, H, 8);
  // Stern-deck panel and chevron (pointing aft).
  if (sk.panel) {
    g.fillStyle = sk.panelLo ?? sk.panel; g.fillRect(X(0.66), 0, X(0.86) - X(0.66), H / 2);
    g.fillStyle = sk.panel; g.fillRect(X(0.66), H / 2, X(0.86) - X(0.66), H / 2);
  }
  if (sk.mark) {
    const t = 0.035;
    for (const [side, col] of [[-1, sk.mark], [1, sk.markLo ?? sk.mark]]) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(X(0.83), Y(0)); g.lineTo(X(0.7), Y(side * 0.95)); g.lineTo(X(0.7 - t), Y(side * 0.95)); g.lineTo(X(0.83 - t * 1.1), Y(0));
      g.closePath(); g.fill();
    }
  }
  // Perimeter deck lines and crisscross bungees, with a little shadow under each cord.
  const cord = (pts, wpx) => {
    for (const [col, off, lw] of [['rgba(0,0,0,0.35)', 3, wpx + 2], ['#0c0d0f', 0, wpx]]) {
      g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
      g.beginPath();
      pts.forEach(([s, lat], i) => (i ? g.lineTo(X(s) + off, Y(lat) + off) : g.moveTo(X(s) + off, Y(lat) + off)));
      g.stroke();
    }
  };
  for (const lat of [-0.82, 0.82]) cord([[0.04, lat * 0.6], [0.2, lat], [0.42, lat], [0.62, lat], [0.8, lat], [0.96, lat * 0.6]], 5);
  for (const [a, b] of [[0.2, 0.28], [0.28, 0.36], [0.62, 0.7]]) { cord([[a, -0.8], [b, 0.8]], 6); cord([[a, 0.8], [b, -0.8]], 6); }
  // Fittings where the cords meet the deck.
  g.fillStyle = '#3a3f44';
  for (const s of [0.2, 0.28, 0.36, 0.62, 0.7]) for (const lat of [-0.82, 0.82]) { g.beginPath(); g.arc(X(s), Y(lat), 7, 0, Math.PI * 2); g.fill(); }
  // The cockpit opening: transparent, so the deck has a real hole the coaming sits around.
  const s0 = KAYAK.cockpitS, hs = KAYAK.cockpitX / KAYAK.L, hl = KAYAK.cockpitZ / halfBeam(s0);
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.ellipse(X(s0), Y(0), hs * W, (hl * H) / 2, 0, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'source-over';
  return c;
}

/** The hull sides: white, under a black perimeter band at the sheer. */
export function paintSide(W = 1024, H = 128) {
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#f4f5f2'; g.fillRect(0, 0, W, H);
  grain(g, W, H, 6);
  g.fillStyle = '#0f1113'; g.fillRect(0, 0, W, H * 0.16); // top of the canvas = the sheer
  return c;
}

function texture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** A tube along points, for the coaming rim, frame tubes and so on. */
function tube(points, r, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), r, 10, closed), mat);
}

/**
 * Build the whole kayak for a skin. `ghost` makes the skin translucent and shows the frame,
 * jacks and flotation bags inside (Boat School). Returns { group, anchors } where anchors are
 * named 3D points for labelling parts in a render.
 */
export function buildKayak(sk, { ghost = false } = {}) {
  const group = new THREE.Group();
  const skinOpts = ghost ? { transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide } : { side: THREE.DoubleSide };
  const deckMat = new THREE.MeshPhysicalMaterial({ map: texture(paintDeck(sk)), alphaTest: 0.5, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4, ...skinOpts });
  const sideMat = new THREE.MeshPhysicalMaterial({ map: texture(paintSide()), roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.45, ...skinOpts });
  const bottomMat = new THREE.MeshPhysicalMaterial({ color: 0xeef0ec, roughness: 0.5, clearcoat: 0.2, ...skinOpts });
  const hull = hullGeometries();
  for (const [panel, mat] of [['deck', deckMat], ['side', sideMat], ['bottom', bottomMat]]) {
    for (const geo of hull[panel]) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = !ghost; m.receiveShadow = true;
      group.add(m);
    }
  }

  // Cockpit: an oval opening in the deck with a black coaming rim, a light interior and the seat.
  const h = heights(KAYAK.cockpitS);
  const ax = KAYAK.cockpitX, az = KAYAK.cockpitZ, ry = deckY(KAYAK.cockpitS, 0) - 0.02;
  const ring = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, x = Math.cos(a) * ax, z = Math.sin(a) * az;
    // Level, a touch higher at the front, as real coamings are.
    ring.push([x, ry + 0.03 + 0.012 * (x / ax), z]);
  }
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0c0d0f, roughness: 0.35, clearcoat: 0.6 });
  const rim = tube(ring, 0.022, black, true);
  rim.castShadow = true;
  group.add(rim);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0xdfe3e1, roughness: 0.8 }));
  hole.scale.set(ax - 0.01, az - 0.01, 1);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = ry - 0.12;
  hole.receiveShadow = true;
  group.add(hole);
  // Skirt deck lip (dark rim inside the coaming) so the opening reads as depth.
  const lip = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 48), new THREE.MeshStandardMaterial({ color: 0x2a2f33, roughness: 0.7, side: THREE.DoubleSide }));
  lip.scale.set(ax, az, 1); lip.rotation.x = -Math.PI / 2; lip.position.y = ry - 0.02;
  group.add(lip);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: 0.75 });
  const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.12, 4, 12), seatMat);
  seat.rotation.z = Math.PI / 2; seat.scale.set(1, 1, 1.15);
  seat.position.set(-0.12, ry - 0.09, 0);
  seat.receiveShadow = true;
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.3), seatMat);
  back.position.set(-0.3, ry - 0.02, 0); back.rotation.z = 0.25;
  group.add(back);
  // Frame tubes glimpsed in the cockpit: blue forward of it, red aft.
  const fore = new THREE.MeshStandardMaterial({ color: FRAME.fore, roughness: 0.3, metalness: 0.6 });
  const aft = new THREE.MeshStandardMaterial({ color: FRAME.aft, roughness: 0.3, metalness: 0.6 });
  for (const z of [-0.13, 0.13]) {
    const t = tube([[0.4, ry - 0.06, z], [0.18, ry - 0.08, z]], 0.012, fore);
    group.add(t);
  }

  // Carry toggles at the ends.
  const tog = new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.6 });
  const hb = heights(0.01), hs = heights(0.99);
  group.add(tube([[xAt(0.0) + 0.02, hb.ridge, -0.04], [xAt(0.0) + 0.08, hb.ridge + 0.02, 0], [xAt(0.0) + 0.02, hb.ridge, 0.04]], 0.008, tog));
  group.add(tube([[xAt(1) - 0.02, hs.ridge, -0.04], [xAt(1) - 0.08, hs.ridge + 0.02, 0], [xAt(1) - 0.02, hs.ridge, 0.04]], 0.008, tog));

  if (ghost) {
    // The frame inside: gunwale, chine and keel tubes, blue forward and red aft; carbon ribs.
    const rib = new THREE.MeshStandardMaterial({ color: FRAME.rib, roughness: 0.4, metalness: 0.3 });
    const line = (z0, yfn, s0, s1, mat) => {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const s = s0 + ((s1 - s0) * i) / 12; pts.push([xAt(s), yfn(s), z0 * halfBeam(s)]); }
      group.add(tube(pts, 0.011, mat));
    };
    for (const [s0, s1, mat] of [[0.04, 0.47, fore], [0.53, 0.96, aft]]) {
      for (const side of [-1, 1]) {
        line(side * 0.92, (s) => heights(s).sheer * 0.9, s0, s1, mat);
        line(side * 0.8, (s) => heights(s).chine + 0.01, s0, s1, mat);
      }
      line(0, (s) => heights(s).keel + 0.02, s0, s1, mat);
    }
    for (const s of [0.2, 0.36, 0.66, 0.82]) {
      const sec = section(s, 1), x = xAt(s);
      const pts = [...sec.slice(0, 4).reverse().map((p) => [x, p.y, -p.z]), ...sec.slice(1, 4).map((p) => [x, p.y, p.z])];
      group.add(tube(pts.map(([px, py, pz]) => [px, py, pz * 0.95]), 0.016, rib));
    }
    // Flotation bags fore and aft (grey), and the three jacks (silver with blue fittings).
    const bagMat = new THREE.MeshStandardMaterial({ color: FRAME.bag, roughness: 0.85 });
    for (const [s, len] of [[0.17, 1.0], [0.82, 1.0]]) {
      const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, len, 6, 16), bagMat);
      bag.rotation.z = Math.PI / 2; bag.position.set(xAt(s), 0.02, 0); bag.scale.set(1, 1, 1.15);
      group.add(bag);
    }
    const jack = new THREE.MeshStandardMaterial({ color: FRAME.jack, roughness: 0.25, metalness: 0.9 });
    for (const [y, z] of [[heights(0.5).sheer * 0.8, 0.18], [heights(0.5).sheer * 0.8, -0.18], [heights(0.5).keel + 0.04, 0]]) {
      group.add(tube([[0.35, y, z], [-0.25, y, z]], 0.014, jack));
      const fit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), fore);
      fit.position.set(0.05, y, z); group.add(fit);
    }
  }

  const hb2 = heights(0.5);
  const anchors = {
    bow: [xAt(0.01), heights(0.01).ridge, 0], stern: [xAt(0.99), heights(0.99).ridge, 0],
    deck: [xAt(0.25), heights(0.25).ridge, 0], hull: [xAt(0.3), heights(0.3).chine, 0.2],
    keel: [xAt(0.48), hb2.keel, 0], chine: [xAt(0.76), heights(0.76).chine, 0.2],
    cockpit: [0.35, ry + 0.02, 0], skirt: [0, ry + 0.03, 0], frame: [xAt(0.15), heights(0.15).sheer * 0.9, 0.2],
    jacks: [0.05, hb2.sheer * 0.8, 0.18], float: [xAt(0.82), 0.02, 0.1],
  };
  return { group, anchors };
}
