// Wildlife and the ferry in 3D. Units are metres; +x forward (head / bow), +y up, +z starboard,
// the sea surface at y = 0. Colours come from real field marks: an orca's eye patch and grey
// saddle, a harbour seal's spotted coat, a granite haul-out rock with lichen and rockweed.
import * as THREE from 'three';

// A small deterministic noise, so every render of a model is identical.
function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let acc = 0;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) {
    const wgt = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    acc += wgt * hash(xi + dx, yi + dy, zi + dz);
  }
  return acc;
}
/** Colours are authored in sRGB; vertex colours are linear. */
export const lin = (c) => c.map((v) => Math.pow(v, 2.2));

export const fbm = (x, y, z) => noise3(x, y, z) * 0.55 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.15;

/**
 * Loft a body along x from elliptical sections. `profile(t)` → { w, h, y } half-width, half-height
 * and centre height at t (0 = nose, 1 = tail); `colour(t, a, side)` → [r, g, b] per vertex, where a
 * is the angle round the section (0 = top, π = bottom). Returns a BufferGeometry with colours.
 */
export function loft(length, profile, colour, nT = 160, nA = 72) {
  const pos = [], col = [], idx = [];
  for (let i = 0; i <= nT; i++) {
    const t = i / nT, x = length / 2 - t * length, p = profile(t);
    for (let j = 0; j <= nA; j++) {
      const a = (j / nA) * Math.PI * 2;
      const z = Math.sin(a) * p.w, y = p.y + Math.cos(a) * p.h;
      pos.push(x, y, z);
      col.push(...lin(colour(t, a, Math.sign(z) || 1, x, y, z)));
    }
  }
  for (let i = 0; i < nT; i++) for (let j = 0; j < nA; j++) {
    const a = i * (nA + 1) + j, b = a + 1, c = a + nA + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function flat(shape, depth, mat) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: depth * 0.5, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  return m;
}

// ---------- Orca ----------

/** An orca: `bull` has the tall straight dorsal fin; others a shorter, curved (falcate) one. */
export function buildOrca({ bull = false, calf = false, openSaddle = false } = {}) {
  const L = calf ? 3 : bull ? 7.5 : 6.2;
  const girth = L * 0.105;
  const black = [0.03, 0.035, 0.04], white = [0.92, 0.94, 0.95], grey = [0.42, 0.45, 0.48];
  const profile = (t) => {
    const nose = Math.min(1, t / 0.12), tail = Math.max(0, (t - 0.5) / 0.5);
    const s = Math.sqrt(Math.sin((Math.PI / 2) * nose)) * (1 - Math.pow(tail, 1.6) * 0.92);
    return { w: girth * s, h: girth * 1.1 * s, y: 0 };
  };
  const colour = (t, a, side) => {
    const up = Math.cos(a), lat = Math.abs(Math.sin(a));
    // Eye patch: a white oval above and behind the eye, on each side.
    const eye = ((t - 0.165) / 0.045) ** 2 + ((up - 0.3) / 0.2) ** 2 < 1 && lat > 0.6;
    // Grey saddle just behind the dorsal fin, swept back, on the top of the back.
    const st = (t - 0.46) / 0.09;
    const saddle = st > 0 && st < 1 && up > 0.78 + 0.18 * Math.abs(st - 0.4);
    const notch = openSaddle && saddle && Math.abs(Math.sin(a)) < 0.07 && st > 0.25 && st < 0.75;
    // White chin and belly, and the flank sweep behind.
    const belly = (up < -0.5 && t < 0.62) || (up < -0.1 && lat > 0.6 && t > 0.56 && t < 0.68);
    return eye || belly ? white : saddle && !notch ? grey : black;
  };
  const skin = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const finMat = new THREE.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.3, clearcoat: 0.7 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(loft(L, profile, colour), skin);
  body.castShadow = true;
  g.add(body);
  // Dorsal fin, standing on the back at about 40% of the length.
  const fh = bull ? L * 0.24 : L * 0.12;
  const s = new THREE.Shape();
  if (bull) { s.moveTo(0.35, 0); s.lineTo(0.06, fh); s.quadraticCurveTo(-0.02, fh, -0.08, fh * 0.9); s.lineTo(-0.5, 0); }
  else { s.moveTo(0.45, 0); s.quadraticCurveTo(0.3, fh * 0.7, -0.12, fh); s.quadraticCurveTo(-0.15, fh * 0.6, -0.4, 0); }
  s.closePath();
  const fin = flat(s, 0.06, finMat);
  fin.position.set(L / 2 - 0.42 * L, girth * 1.05, 0);
  g.add(fin);
  // Pectoral flippers: broad paddles, angled down and out.
  const p = new THREE.Shape();
  p.absellipse(0, 0, L * 0.09, L * 0.05, 0, Math.PI * 2);
  for (const side of [-1, 1]) {
    const f = flat(p, 0.05, finMat);
    f.rotation.x = Math.PI / 2 - side * 0.5;
    f.position.set(L / 2 - 0.24 * L, -girth * 0.5, side * girth * 1.25);
    g.add(f);
  }
  // Flukes.
  const k = new THREE.Shape();
  const span = L * 0.13;
  k.moveTo(0, 0); k.quadraticCurveTo(-span * 0.4, span * 0.9, -span * 0.95, span * 1.05);
  k.quadraticCurveTo(-span * 0.55, span * 0.3, -span * 0.75, 0);
  k.quadraticCurveTo(-span * 0.55, -span * 0.3, -span * 0.95, -span * 1.05);
  k.quadraticCurveTo(-span * 0.4, -span * 0.9, 0, 0);
  const fl = flat(k, 0.05, finMat);
  fl.rotation.x = Math.PI / 2;
  fl.position.set(-L / 2 + 0.06, 0, 0);
  g.add(fl);
  g.userData = { length: L, girth };
  return g;
}

// ---------- Harbour seal and the haul-out rock ----------

export function buildSeal({ tone = 0, seed = 1 } = {}) {
  const L = 1.6;
  const base = [[0.55, 0.53, 0.48], [0.42, 0.4, 0.36], [0.66, 0.63, 0.56]][tone % 3];
  const profile = (t) => {
    const head = t < 0.16 ? Math.sin((Math.PI / 2) * Math.min(1, t / 0.08)) * (0.62 + 0.38 * Math.cos((t / 0.16) * Math.PI) * 0) : 1;
    const neck = t > 0.12 && t < 0.2 ? 0.86 : 1;
    const tail = Math.max(0, (t - 0.45) / 0.55);
    const s = head * neck * (1 - Math.pow(tail, 1.4) * 0.85);
    return { w: 0.2 * s, h: 0.16 * s, y: 0.16 * s };
  };
  const colour = (t, a, side, x, y, z) => {
    const n = fbm(x * 9 + seed, y * 9, z * 9);
    const spot = n > 0.62 ? 0.45 : 1;
    const under = Math.cos(a) < -0.3 ? 1.25 : 1;
    return base.map((c) => Math.min(1, c * spot * under));
  };
  const g = new THREE.Group();
  const body = new THREE.Mesh(loft(L, profile, colour, 60, 28), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, clearcoat: 0.4 }));
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.2 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), dark);
    eye.position.set(L / 2 - 0.1, 0.24, side * 0.07);
    g.add(eye);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color(...base.map((c) => c * 0.6)), roughness: 0.5 }));
    fl.scale.set(0.12, 0.025, 0.05); fl.position.set(L / 2 - 0.45, 0.06, side * 0.19); fl.rotation.y = side * 0.5;
    g.add(fl);
    const hind = fl.clone(); hind.scale.set(0.16, 0.02, 0.06); hind.position.set(-L / 2 - 0.08, 0.04, side * 0.07); hind.rotation.y = side * 0.35;
    g.add(hind);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.4 }));
  nose.position.set(L / 2 + 0.01, 0.17, 0);
  g.add(nose);
  return g;
}

export function buildRock() {
  const geo = new THREE.IcosahedronGeometry(1, 6);
  const p = geo.attributes.position, col = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.8 + 3, v.y * 1.8, v.z * 1.8);
    const big = fbm(v.x * 0.7 + 11, v.y * 0.7, v.z * 0.7);
    const r = 0.55 + 0.35 * n + 0.6 * big;
    v.multiplyScalar(r);
    v.set(v.x * 6.5, v.y * 1.3 - 0.35, v.z * 4.2); // a long, low granite reef
    p.setXYZ(i, v.x, v.y, v.z);
    const lichen = fbm(v.x * 1.2 + 9, 0, v.z * 1.2);
    let c = [0.2 + 0.12 * n, 0.2 + 0.1 * n, 0.19 + 0.09 * n]; // grey granite (the noon sun is strong)
    if (v.y > 0.35 && fbm(v.x * 3 + 9, 0, v.z * 3) > 0.66) c = [0.42, 0.34, 0.14]; // yellow-orange lichen
    if (v.y > 0.7 && lichen < 0.25) c = [0.4, 0.4, 0.38]; // bird-whitened top
    if (v.y < 0.18) c = [0.14, 0.13, 0.12]; // wet rock near the water
    if (v.y < 0.08) c = [0.55, 0.53, 0.48]; // a band of barnacles
    if (v.y < 0.0) c = [0.26, 0.2, 0.08]; // rockweed
    col.push(...lin(c));
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: false }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** Where seals lie on the rock (metres, rock frame) with their heading. */
export const SEAL_SPOTS = [[-3.2, 0.95, -1.2, 0.6], [-1.2, 1.15, 0.6, 2.4], [0.9, 1.2, -0.8, -0.4], [2.8, 0.95, 1.0, 3.6], [4.2, 0.75, -0.6, 1.2]];

// ---------- The ferry ----------

/** A large double-ended island ferry, about 110 m: white, a green stripe, two pilothouses. */
export function buildFerry() {
  const L = 110, B = 26;
  const g = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6f4, roughness: 0.45, clearcoat: 0.3 });
  const green = new THREE.MeshStandardMaterial({ color: 0x2f7d5a, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d2a2f, roughness: 0.2, metalness: 0.4 });
  const deck = new THREE.MeshStandardMaterial({ color: 0x8a9496, roughness: 0.85 });
  const hullShape = new THREE.Shape();
  hullShape.moveTo(L / 2, 0);
  hullShape.bezierCurveTo(L / 2, B * 0.35, L * 0.38, B / 2, L * 0.3, B / 2);
  hullShape.lineTo(-L * 0.3, B / 2);
  hullShape.bezierCurveTo(-L * 0.38, B / 2, -L / 2, B * 0.35, -L / 2, 0);
  hullShape.bezierCurveTo(-L / 2, -B * 0.35, -L * 0.38, -B / 2, -L * 0.3, -B / 2);
  hullShape.lineTo(L * 0.3, -B / 2);
  hullShape.bezierCurveTo(L * 0.38, -B / 2, L / 2, -B * 0.35, L / 2, 0);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 7, bevelEnabled: false, curveSegments: 24 }), white);
  hull.rotation.x = -Math.PI / 2; hull.position.y = -2; hull.castShadow = true;
  g.add(hull);
  const stripe = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 0.8, bevelEnabled: false, curveSegments: 24 }), green);
  stripe.rotation.x = -Math.PI / 2; stripe.position.y = 4.2; stripe.scale.set(1.002, 1.002, 1);
  g.add(stripe);
  const carDeck = new THREE.Mesh(new THREE.BoxGeometry(L * 0.92, 0.2, B * 0.78), deck);
  carDeck.position.y = 5.05; g.add(carDeck);
  // Passenger deck house, two pilothouses, the stack, life rafts along the rails.
  const house = new THREE.Mesh(new THREE.BoxGeometry(L * 0.62, 5, B * 0.82), white);
  house.position.y = 7.5; house.castShadow = true; g.add(house);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(L * 0.6, 0.4, B * 0.7), new THREE.MeshStandardMaterial({ color: 0xdfe5e4, roughness: 0.8 }));
  roof.position.y = 10.2; g.add(roof);
  const windows = new THREE.Mesh(new THREE.BoxGeometry(L * 0.6, 1.2, B * 0.83), dark);
  windows.position.y = 8.6; g.add(windows);
  for (const end of [-1, 1]) {
    const ph = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 10), white);
    ph.position.set(end * L * 0.27, 12, 0); ph.castShadow = true; g.add(ph);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5.1, 1, 10.1), dark);
    glass.position.set(end * L * 0.27, 12.6, 0); g.add(glass);
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const raft = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.2, 14), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 }));
      raft.rotation.z = Math.PI / 2; raft.position.set(end * (L * 0.12 + i * 3.2), 10.8, side * B * 0.36); g.add(raft);
    }
  }
  const stack = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 3), white);
  stack.position.set(0, 12.6, 0); stack.castShadow = true; g.add(stack);
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.05, 1, 3.05), dark);
  top.position.set(0, 14.6, 0); g.add(top);
  return g;
}
