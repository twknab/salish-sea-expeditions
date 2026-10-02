// A 3D model for every field-guide species, built from a few parametric families: cetaceans,
// pinnipeds, otters, birds, sea stars, jellies, seaweeds, trees. Field marks come from the field
// guides cited in credits.js. Units are metres; +x forward (head), +y up, +z to the animal's right.
import * as THREE from 'three';
import { loft, flat, fbm, lin, buildOrca, buildSeal, buildRock } from './wildlife.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
const vtx = (o = {}) => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, ...o });
const hex3 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = true;
  return m;
}
function at(m, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  if (Array.isArray(s)) m.scale.set(...s); else m.scale.setScalar(s);
  return m;
}
/** A capsule between two points. */
function limb(a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const m = mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 12), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize());
  return m;
}
/** Colour a geometry per vertex from its position (sRGB in, linear stored). */
function paint(geo, fn) {
  const p = geo.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) col.push(...lin(fn(p.getX(i), p.getY(i), p.getZ(i))));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
function ellipsoid(rx, ry, rz, seg = 32) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  g.scale(rx, ry, rz);
  return g;
}

// ---------- Cetaceans ----------

/**
 * A whale or porpoise lofted from sections. `colour(t, up, lat)` gives sRGB per vertex: t is 0 at
 * the snout → 1 at the tail, `up` is +1 on top and −1 underneath, `lat` 0 on the midline → 1 at
 * the flanks.
 */
function cetacean(o) {
  const L = o.L, girth = L * o.girth;
  const profile = (t) => {
    const nose = Math.min(1, t / o.nose), tail = Math.max(0, (t - o.taper) / (1 - o.taper));
    const s = Math.pow(Math.sin((Math.PI / 2) * nose), o.head ?? 0.5) * (1 - Math.pow(tail, 1.5) * 0.93);
    return { w: girth * s, h: girth * (o.deep ?? 1.05) * s, y: 0 };
  };
  const g = new THREE.Group();
  g.add(mesh(loft(L, profile, (t, a) => o.colour(t, Math.cos(a), Math.abs(Math.sin(a)))), vtx({ roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.25 })));
  const fin = phys({ color: o.finColour ?? 0x0a0c0e, roughness: 0.32, clearcoat: 0.6 });
  if (o.dorsal) {
    const d = o.dorsal, h = L * d.h, b = L * d.base, s = new THREE.Shape();
    s.moveTo(b * 0.5, 0);
    if (d.falcate) { s.quadraticCurveTo(b * 0.2, h * 0.75, -b * 0.35, h); s.quadraticCurveTo(-b * 0.25, h * 0.45, -b * 0.5, 0); }
    else { s.lineTo(0.02 * b, h); s.lineTo(-b * 0.5, 0); }
    s.closePath();
    const m = flat(s, girth * 0.08, d.mat ?? fin);
    m.position.set(L / 2 - d.at * L, girth * (o.deep ?? 1.05) * 0.92, 0);
    g.add(m);
    if (d.tip) {
      const tip = flat(new THREE.Shape([new THREE.Vector2(0.02 * b, h), new THREE.Vector2(-b * 0.12, h * 0.6), new THREE.Vector2(b * 0.2, h * 0.6)]), girth * 0.09, std(d.tip, { roughness: 0.4 }));
      tip.position.copy(m.position); g.add(tip);
    }
  }
  if (o.flipper) {
    const f = o.flipper, s = new THREE.Shape();
    const len = L * f.len, wid = L * f.wid;
    s.moveTo(0, 0); s.quadraticCurveTo(-wid * 0.2, -len * 0.5, -wid * 0.1, -len);
    s.quadraticCurveTo(wid * 0.6, -len * 0.6, wid * 0.7, 0); s.closePath();
    for (const side of [-1, 1]) {
      const m = flat(s, girth * 0.06, f.mat ?? fin);
      m.rotation.set(side * 0.9, 0, -0.5);
      m.position.set(L / 2 - f.at * L, -girth * 0.45, side * girth * 0.85);
      g.add(m);
    }
  }
  const span = L * o.flukes, k = new THREE.Shape();
  k.moveTo(0, 0); k.quadraticCurveTo(-span * 0.35, span * 0.85, -span * 0.9, span); k.quadraticCurveTo(-span * 0.5, span * 0.3, -span * 0.7, 0);
  k.quadraticCurveTo(-span * 0.5, -span * 0.3, -span * 0.9, -span); k.quadraticCurveTo(-span * 0.35, -span * 0.85, 0, 0);
  const fl = flat(k, girth * 0.06, o.flukeMat ?? fin);
  fl.rotation.x = Math.PI / 2; fl.position.set(-L / 2 + 0.04 * L, 0, 0);
  g.add(fl);
  if (o.knobs) {
    // Humpback tubercles: knobs on the head, each with a hair follicle.
    const knob = std(0x2a2e33, { roughness: 0.4 });
    for (let i = 0; i < 14; i++) {
      const t = 0.02 + (i % 7) * 0.025, side = i < 7 ? -1 : 1;
      at(g.add(mesh(new THREE.SphereGeometry(girth * 0.05, 10, 8), knob)).children.at(-1), L / 2 - t * L, girth * 0.55, side * girth * (0.12 + (i % 3) * 0.1));
    }
  }
  g.userData = { length: L, girth };
  return g;
}

const BLACK = [0.04, 0.045, 0.05], WHITE = [0.93, 0.94, 0.95];

export function humpback() {
  const grey = [0.16, 0.17, 0.19];
  return cetacean({
    L: 13, girth: 0.1, nose: 0.2, head: 0.75, taper: 0.55, flukes: 0.17, knobs: true,
    colour: (t, up, lat) => (up < -0.45 ? mix(grey, [0.85, 0.85, 0.86], Math.min(1, (-up - 0.45) * 3)) : grey),
    dorsal: { at: 0.64, h: 0.035, base: 0.07, falcate: false },
    flipper: { at: 0.27, len: 0.3, wid: 0.07, mat: phys({ color: 0xd9dcdc, roughness: 0.35, clearcoat: 0.5 }) },
    flukeMat: phys({ color: 0x24282c, roughness: 0.35, clearcoat: 0.5 }),
  });
}

export function minke() {
  const back = [0.2, 0.22, 0.25], pale = [0.85, 0.86, 0.87];
  return cetacean({
    L: 8, girth: 0.085, nose: 0.2, head: 1.2, taper: 0.55, flukes: 0.13,
    colour: (t, up, lat) => {
      // Dark back, pale belly, and the lighter chevrons on the flank behind the flippers.
      if (up < -0.3) return pale;
      if (t > 0.28 && t < 0.4 && up < 0.25 && lat > 0.6) return [0.55, 0.57, 0.6];
      return back;
    },
    dorsal: { at: 0.64, h: 0.045, base: 0.07, falcate: true },
    // A white band across each flipper (a texture down the middle of an otherwise dark fin).
    flipper: { at: 0.27, len: 0.13, wid: 0.04, mat: phys({ map: bandTexture(), roughness: 0.3, clearcoat: 0.6 }) },
  });
}

function bandTexture() {
  if (typeof document === 'undefined') return null; // geometry tests run without a DOM
  const c = document.createElement('canvas'); c.width = 4; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#2a2e33'; g.fillRect(0, 0, 4, 64);
  g.fillStyle = '#f2f3f3'; g.fillRect(0, 22, 4, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function dallsPorpoise() {
  return cetacean({
    L: 2.1, girth: 0.14, nose: 0.16, head: 1.1, taper: 0.62, flukes: 0.16,
    colour: (t, up, lat) => (t > 0.33 && t < 0.66 && up < 0.15 ? WHITE : BLACK),
    dorsal: { at: 0.45, h: 0.08, base: 0.12, falcate: false, tip: 0xc8ccd0 },
    flipper: { at: 0.2, len: 0.12, wid: 0.05 },
  });
}

export function harbourPorpoise() {
  const grey = [0.3, 0.33, 0.36], pale = [0.78, 0.8, 0.82];
  return cetacean({
    L: 1.6, girth: 0.12, nose: 0.16, head: 1.1, taper: 0.6, flukes: 0.15, finColour: 0x2a2e33,
    colour: (t, up) => (up < -0.2 ? pale : up < 0.15 ? mix(pale, grey, (up + 0.2) / 0.35) : grey),
    dorsal: { at: 0.48, h: 0.07, base: 0.12, falcate: false },
    flipper: { at: 0.2, len: 0.12, wid: 0.05 },
  });
}

// ---------- Pinnipeds and otters ----------

/** A sea lion hauled out, propped on its fore-flippers. */
function seaLion({ L, girth, coat, belly, muzzle = 0.06, crest = false, neck = 1 }) {
  const g = new THREE.Group();
  const profile = (t) => {
    const head = t < 0.1 ? Math.sin((Math.PI / 2) * (t / 0.1)) * 0.55 : t < 0.2 ? 0.55 + (t - 0.1) * 2.6 * neck : 1;
    const tail = Math.max(0, (t - 0.45) / 0.55);
    return { w: girth * Math.min(1, head) * (1 - Math.pow(tail, 1.3) * 0.85), h: girth * 0.9 * Math.min(1, head) * (1 - Math.pow(tail, 1.3) * 0.8), y: girth * 0.9 };
  };
  const body = mesh(loft(L, profile, (t, a, side, x, y, z) => {
    const n = fbm(x * 3, y * 3, z * 3);
    const c = Math.cos(a) < -0.4 ? belly : coat;
    return c.map((v) => v * (0.88 + 0.24 * n));
  }, 120, 48), vtx({ roughness: 0.55, clearcoat: 0.3 }));
  // Head and chest raised: the front third tilts up.
  body.rotation.z = 0.18;
  g.add(body);
  const dark = std(0x241a12, { roughness: 0.45 });
  const coatMat = std(new THREE.Color(...coat), { roughness: 0.6 });
  const head = at(mesh(ellipsoid(girth * 0.62, girth * 0.5, girth * 0.5), coatMat), L / 2 - 0.05 * L, girth * 2.0, 0);
  g.add(head);
  g.add(at(mesh(ellipsoid(girth * 0.4 + muzzle, girth * 0.28, girth * 0.3), coatMat), L / 2 + girth * 0.25, girth * 1.85, 0));
  g.add(at(mesh(new THREE.SphereGeometry(girth * 0.07, 10, 8), dark), L / 2 + girth * 0.62 + muzzle, girth * 1.9, 0));
  for (const s of [-1, 1]) {
    g.add(at(mesh(new THREE.SphereGeometry(girth * 0.06, 10, 8), dark), L / 2 + girth * 0.2, girth * 2.15, s * girth * 0.28));
    g.add(at(mesh(new THREE.ConeGeometry(girth * 0.05, girth * 0.14, 8), dark), L / 2 - girth * 0.25, girth * 2.25, s * girth * 0.42, s * 0.6, 0, 0));
    // Big fore-flippers planted on the rock, and the hind flippers turned forward.
    g.add(at(mesh(ellipsoid(girth * 0.6, girth * 0.06, girth * 0.28), dark), L * 0.22, 0.04, s * girth * 1.05, 0, s * 0.5, 0));
    g.add(at(mesh(ellipsoid(girth * 0.55, girth * 0.05, girth * 0.22), dark), -L / 2 + girth * 0.2, 0.04, s * girth * 0.5, 0, s * 0.9, 0));
  }
  if (crest) g.add(at(mesh(ellipsoid(girth * 0.3, girth * 0.22, girth * 0.25), coatMat), L / 2 - 0.12 * L, girth * 2.4, 0));
  g.userData = { length: L, centreY: girth };
  return g;
}

export const stellerSeaLion = () => seaLion({ L: 3, girth: 0.42, coat: [0.72, 0.56, 0.36], belly: [0.55, 0.42, 0.28], muzzle: 0.02, neck: 1.2 });
export const californiaSeaLion = () => seaLion({ L: 2.2, girth: 0.3, coat: [0.24, 0.17, 0.12], belly: [0.3, 0.22, 0.16], muzzle: 0.07, crest: true });

export function seaOtter() {
  // Floating on its back at the surface, paws on its chest, the pale grizzled head up.
  const g = new THREE.Group();
  const brown = [0.3, 0.22, 0.15], cream = [0.85, 0.78, 0.66];
  const L = 1.25;
  const profile = (t) => {
    const s = t < 0.15 ? 0.7 : t < 0.2 ? 0.75 : 1;
    const tail = Math.max(0, (t - 0.55) / 0.45);
    return { w: 0.18 * s * (1 - tail * 0.6), h: 0.14 * s * (1 - tail * 0.75), y: 0 };
  };
  const body = mesh(loft(L, profile, (t, a, side, x, y, z) => {
    const n = fbm(x * 9, y * 9, z * 9);
    return (t < 0.17 ? cream : brown).map((v) => v * (0.85 + 0.3 * n));
  }, 100, 40), vtx({ roughness: 0.7 }));
  body.rotation.x = Math.PI; // belly up
  g.add(body);
  const fur = std(0x3a2a1c, { roughness: 0.8 });
  for (const s of [-1, 1]) {
    g.add(limb([0.25, 0.08, s * 0.14], [0.36, 0.16, s * 0.05], 0.04, fur));
    g.add(at(mesh(ellipsoid(0.16, 0.03, 0.08), fur), -0.62, 0.05, s * 0.09, 0, s * 0.3, 0));
  }
  g.add(at(mesh(new THREE.SphereGeometry(0.035, 12, 8), std(0x1a1410)), 0.66, 0.12, 0));
  g.add(at(mesh(new THREE.SphereGeometry(0.02, 8, 6), std(0x050505, { roughness: 0.2 })), 0.6, 0.15, -0.06));
  g.add(at(mesh(new THREE.SphereGeometry(0.02, 8, 6), std(0x050505, { roughness: 0.2 })), 0.6, 0.15, 0.06));
  g.userData = { length: L };
  return g;
}

export function riverOtter() {
  // On a rock: long sleek body, long thick tapering tail, short legs.
  const g = new THREE.Group();
  const brown = [0.32, 0.22, 0.14], throat = [0.62, 0.52, 0.4];
  const L = 1.15;
  const profile = (t) => {
    const head = t < 0.1 ? 0.55 + 0.45 * Math.sin((Math.PI / 2) * (t / 0.1)) : t < 0.16 ? 0.8 : 1;
    const tail = Math.max(0, (t - 0.55) / 0.45);
    return { w: 0.1 * head * (1 - tail * 0.8), h: 0.09 * head * (1 - tail * 0.8), y: 0.16 };
  };
  g.add(mesh(loft(L, profile, (t, a, side, x, y, z) => ((Math.cos(a) < -0.3 && t < 0.25) ? throat : brown).map((v) => v * (0.85 + 0.3 * fbm(x * 12, y * 12, z * 12)))), vtx({ roughness: 0.4, clearcoat: 0.5 })));
  const fur = std(0x2a1c12, { roughness: 0.6 });
  for (const s of [-1, 1]) for (const x of [0.3, -0.1]) g.add(limb([x, 0.12, s * 0.07], [x + 0.02, 0.02, s * 0.08], 0.03, fur));
  g.add(at(mesh(new THREE.SphereGeometry(0.022, 10, 8), std(0x0a0806)), L / 2 + 0.01, 0.17, 0));
  for (const s of [-1, 1]) g.add(at(mesh(new THREE.SphereGeometry(0.012, 8, 6), std(0x050505, { roughness: 0.2 })), L / 2 - 0.06, 0.2, s * 0.04));
  const rock = buildRock();
  rock.scale.set(0.11, 0.12, 0.06); rock.position.y = -0.03;
  g.add(rock);
  g.userData = { length: L };
  return g;
}

// ---------- Birds ----------

/**
 * A bird. `colour(x, y, z)` paints the body (sRGB); the head has its own colour function.
 * pose 'perch' stands it on a base; 'soar' spreads the wings flat for views from above.
 */
function bird(o) {
  const g = new THREE.Group();
  const s = o.size;
  const body = mesh(paint(ellipsoid(s * 0.5, s * 0.28, s * 0.26, 40), (x, y, z) => o.body(x / s, y / s, z / s)), vtx({ roughness: 0.75, sheen: 0.4 }));
  const head = mesh(paint(new THREE.SphereGeometry(s * 0.15, 32, 24), (x, y, z) => (o.head ?? o.body)(x / s, y / s, z / s)), vtx({ roughness: 0.7 }));
  const tilt = o.pose === 'soar' ? 0 : o.tilt ?? 0.6;
  const torso = new THREE.Group();
  torso.add(body);
  const neckLen = s * (o.neck ?? 0.1);
  const hx = s * 0.42 + neckLen * 0.8, hy = s * 0.18 + neckLen * 0.6;
  if (o.neck) torso.add(limb([s * 0.3, s * 0.1, 0], [hx, hy, 0], s * 0.08, std(new THREE.Color(...lin(o.body(0.5, 0.3, 0))), { roughness: 0.7 })));
  head.position.set(hx, hy, 0);
  torso.add(head);
  // Bill.
  const bill = mesh(new THREE.ConeGeometry(s * (o.billW ?? 0.05), s * o.bill, 12), std(o.billColour, { roughness: 0.4 }));
  bill.rotation.z = -Math.PI / 2 - (o.billDroop ?? 0);
  bill.position.set(hx + s * 0.13 + (s * o.bill) / 2, hy - s * 0.02, 0);
  torso.add(bill);
  if (o.hook) torso.add(at(mesh(new THREE.SphereGeometry(s * 0.035, 10, 8), std(o.billColour)), hx + s * 0.13 + s * o.bill, hy - s * 0.04, 0));
  for (const z of [-1, 1]) {
    torso.add(at(mesh(new THREE.SphereGeometry(s * 0.025, 10, 8), std(0x050505, { roughness: 0.15 })), hx + s * 0.08, hy + s * 0.04, z * s * 0.11));
    if (o.eyeRing) torso.add(at(mesh(new THREE.TorusGeometry(s * 0.03, s * 0.009, 6, 16), std(o.eyeRing)), hx + s * 0.08, hy + s * 0.04, z * s * 0.115, 0, Math.PI / 2, 0));
  }
  if (o.crest) for (let i = 0; i < 4; i++) torso.add(at(mesh(new THREE.ConeGeometry(s * 0.04, s * 0.14, 8), std(o.crest, { roughness: 0.8 })), hx - s * (0.04 + i * 0.04), hy + s * 0.15, 0, 0, 0, 0.9 + i * 0.15));
  // Tail.
  const tailMat = std(o.tail ?? new THREE.Color(...lin(o.body(-0.5, 0.1, 0))), { roughness: 0.7 });
  torso.add(at(mesh(ellipsoid(s * (o.tailLen ?? 0.3), s * 0.025, s * 0.12), tailMat), -s * 0.62, s * 0.02, 0, 0, 0, 0.1));
  // Wings: folded along the sides, or spread.
  const wingMat = std(o.wing, { roughness: 0.75 });
  if (o.pose === 'soar') {
    const span = s * (o.span ?? 2.2), sh = new THREE.Shape();
    sh.moveTo(0, -s * 0.18); sh.lineTo(span * 0.5, -s * 0.05); sh.quadraticCurveTo(span * 0.55, s * 0.1, span * 0.48, s * 0.16);
    for (let i = 0; i < 5; i++) sh.lineTo(span * (0.46 - i * 0.03), s * (0.2 + (i % 2) * 0.05)); // primaries, fingered
    sh.lineTo(0, s * 0.2); sh.closePath();
    for (const side of [-1, 1]) {
      const wgeo = new THREE.ShapeGeometry(sh, 16);
      const w = mesh(wgeo, phys({ color: o.wing, roughness: 0.8, side: THREE.DoubleSide }));
      w.rotation.set(-Math.PI / 2, 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);
      w.scale.set(1, 1, 1);
      w.position.set(0, s * 0.12, 0);
      if (side < 0) w.scale.x = -1;
      torso.add(w);
    }
  } else {
    for (const side of [-1, 1]) torso.add(at(mesh(ellipsoid(s * 0.48, s * 0.16, s * 0.05), wingMat), -s * 0.08, s * 0.06, side * s * 0.24, 0, 0, 0.08));
  }
  torso.rotation.z = tilt;
  torso.position.y = o.pose === 'soar' ? 0 : s * (o.legLen ?? 0.25) + s * 0.25;
  g.add(torso);
  if (o.pose !== 'soar') {
    const leg = std(o.legColour ?? 0x2a2a2a, { roughness: 0.6 });
    for (const z of [-1, 1]) {
      g.add(limb([-s * 0.02, torso.position.y - s * 0.15, z * s * 0.08], [0, 0.01, z * s * 0.09], s * 0.025, leg));
      g.add(at(mesh(ellipsoid(s * 0.1, s * 0.012, s * 0.05), leg), s * 0.05, 0.01, z * s * 0.09));
    }
    if (o.base) g.add(o.base);
  }
  g.userData = { length: s };
  return g;
}

const perchRock = (r = 0.5) => { const k = buildRock(); k.scale.set(r * 0.06, r * 0.16, r * 0.075); k.position.y = -r * 0.07; return k; };

export const baldEagle = (pose = 'perch') => bird({
  size: 0.85, pose, tilt: 0.75, bill: 0.2, billW: 0.06, billColour: 0xe8b52a, hook: true, legColour: 0xe8b52a, legLen: 0.18,
  body: (x, y) => (x < -0.55 ? [0.95, 0.95, 0.92] : [0.24, 0.16, 0.1]), head: () => [0.96, 0.96, 0.93], tail: 0xf2f2ee,
  wing: 0x2e2014, span: 2.3, base: perchRock(1.2),
});

export const peregrine = () => bird({
  size: 0.42, pose: 'perch', tilt: 0.95, bill: 0.07, billW: 0.035, billColour: 0x3a3a40, hook: true, legColour: 0xe8c040, eyeRing: 0xf0c040,
  body: (x, y, z) => (y < -0.05 && Math.abs(z) < 0.2 ? (Math.sin(x * 60) > 0.6 ? [0.35, 0.33, 0.33] : [0.9, 0.87, 0.8]) : [0.33, 0.37, 0.42]),
  head: (x, y, z) => (y < -0.02 && x > 0.06 && Math.abs(z) < 0.08 ? [0.92, 0.9, 0.86] : [0.12, 0.13, 0.16]),
  wing: 0x46505a, base: perchRock(0.7),
});

export const kingfisher = () => bird({
  size: 0.3, pose: 'perch', tilt: 0.75, bill: 0.24, billW: 0.035, billColour: 0x1a1a1c, legColour: 0x3a3a3a, legLen: 0.12,
  body: (x, y, z) => {
    if (y < -0.02 && x > 0.15 && x < 0.3) return [0.38, 0.5, 0.62]; // blue breast band
    if (y < -0.02 && x > -0.05 && x <= 0.15) return [0.66, 0.36, 0.2]; // the female's rusty band
    if (y < -0.02) return [0.94, 0.94, 0.92];
    return [0.36, 0.48, 0.6];
  },
  head: (x, y) => (y < 0.12 && x > 0.4 ? [0.95, 0.95, 0.93] : [0.33, 0.45, 0.58]), crest: 0x3a5068,
  wing: 0x3a5068, base: (() => { const b = new THREE.Group(); b.add(limb([-0.25, 0.01, 0], [0.3, 0.03, 0], 0.025, std(0x5a4430, { roughness: 0.9 }))); return b; })(),
});

export const oystercatcher = () => bird({
  size: 0.4, pose: 'perch', tilt: 0.35, bill: 0.38, billW: 0.025, billColour: 0xe2501e, legColour: 0xe0b0a0, legLen: 0.35, eyeRing: 0xe2501e,
  body: () => [0.09, 0.08, 0.08], wing: 0x161412, base: perchRock(0.8),
});

export const pelagicCormorant = (base = true) => bird({
  size: 0.5, pose: 'perch', tilt: 1.1, neck: 0.42, bill: 0.17, billW: 0.022, billColour: 0x1a1c1c, hook: true, legColour: 0x111111, legLen: 0.12,
  body: (x, y, z) => (x < -0.15 && x > -0.4 && Math.abs(z) > 0.18 && y < 0.05 ? [0.92, 0.92, 0.9] : [0.05, 0.08, 0.07]),
  head: (x, y) => (x > 0.55 && y < 0.6 ? [0.6, 0.12, 0.1] : [0.05, 0.09, 0.08]),
  wing: 0x0c1412, tailLen: 0.35, base: base ? perchRock(0.9) : null,
});

/** A pelagic cormorant rookery: a sea cliff with narrow ledges, nests, birds and whitewash. */
export function cormorantRookery() {
  const g = new THREE.Group();
  const W = 6, H = 5, geo = new THREE.BoxGeometry(W, H, 1.6, 60, 50, 6);
  const p = geo.attributes.position, col = [];
  const ledges = [1.0, 2.1, 3.3, 4.2];
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i) + H / 2, z = p.getZ(i);
    const n = fbm(x * 1.4, y * 1.4, z * 1.4);
    if (z > 0.7) { // the cliff face, with ledges cut into it
      let dz = (n - 0.5) * 0.5;
      for (const ly of ledges) if (y > ly - 0.03 && y < ly + 0.12) dz += 0.3;
      z += dz;
    }
    p.setXYZ(i, x, y, z);
    let c = [0.34 + 0.12 * n, 0.33 + 0.1 * n, 0.3 + 0.1 * n];
    for (const ly of ledges) {
      const xs = [-1.8, -0.4, 1.1, 2.0].map((v, k) => v + (ly * 1.7 + k) % 0.8);
      for (const nx of xs) if (y < ly && y > ly - 1.1 && Math.abs(x - nx) < 0.18 * (1 - (ly - y) / 1.2) + 0.03 * fbm(x * 9, y * 9, 0)) c = [0.9, 0.9, 0.86]; // whitewash below each nest
    }
    if (y < 0.4) c = [0.16, 0.15, 0.13];
    col.push(...lin(c));
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  g.add(mesh(geo, vtx({ roughness: 0.95 })));
  const nest = std(0x5a4a2a, { roughness: 1 });
  ledges.forEach((ly, k) => [-1.8, -0.4, 1.1, 2.0].forEach((nx, j) => {
    if ((k + j) % 3 === 2) return;
    const x = nx + (ly * 1.7 + j) % 0.8;
    g.add(at(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.08, 14), nest), x, ly + 0.05, 1.05));
    const b = pelagicCormorant(false);
    b.scale.setScalar(0.7); b.position.set(x, ly + 0.08, 1.05); b.rotation.y = -Math.PI / 2 + ((j * 0.7) % 1 - 0.5);
    g.add(b);
  }));
  g.userData = { centreY: H / 2 };
  return g;
}

// ---------- Sea stars ----------

function seaStar({ arms, R, inner, thick, colour, spines }) {
  const s = new THREE.Shape();
  for (let i = 0; i <= arms * 8; i++) {
    const a = (i / (arms * 8)) * Math.PI * 2, f = (Math.cos(a * arms) + 1) / 2;
    const r = inner + (R - inner) * Math.pow(f, 1.8);
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: thick * 0.4, bevelEnabled: true, bevelThickness: thick * 0.6, bevelSize: thick * 0.7, bevelSegments: 6, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2);
  paint(geo, (x, y, z) => colour(Math.hypot(x, z) / R, fbm(x * 30 + 3, y * 30, z * 30)));
  const g = new THREE.Group();
  g.add(mesh(geo, vtx({ roughness: 0.75 })));
  if (spines) {
    const m = std(spines, { roughness: 0.5 });
    for (let i = 0; i < arms * 9; i++) {
      const a = (i / (arms * 9)) * Math.PI * 2 * 1.0 + (i % 3) * 0.05, f = (Math.cos(a * arms) + 1) / 2;
      const r = (inner + (R - inner) * Math.pow(f, 1.8)) * (0.25 + 0.6 * ((i * 7) % 9) / 9);
      g.add(at(mesh(new THREE.SphereGeometry(R * 0.022, 8, 6), m), Math.cos(a) * r, thick * 1.05 + 0.002, Math.sin(a) * r));
    }
  }
  return g;
}

export const ochreStar = () => seaStar({ arms: 5, R: 0.13, inner: 0.035, thick: 0.02, colour: (r, n) => mix([0.42, 0.16, 0.42], [0.3, 0.1, 0.32], n), spines: 0xe8e0f0 });
export const sunflowerStar = () => seaStar({ arms: 20, R: 0.42, inner: 0.17, thick: 0.03, colour: (r, n) => mix([0.86, 0.46, 0.24], [0.62, 0.32, 0.55], Math.min(1, r * 0.8 + n * 0.4)), spines: 0xf2c49a });

// ---------- Jellies ----------

function jelly({ R, colour, opacity = 0.55, gonads, tentacles = 0, tentacleLen = 0.4, tentacleColour, yolk, canals, oralArms = 4, armColour }) {
  const g = new THREE.Group();
  const bellGeo = new THREE.SphereGeometry(R, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  bellGeo.scale(1, 0.5, 1);
  g.add(mesh(bellGeo, phys({ color: colour, transparent: true, opacity, roughness: 0.08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }), false));
  const rim = mesh(new THREE.TorusGeometry(R * 0.99, R * 0.025, 8, 64), phys({ color: colour, transparent: true, opacity: Math.min(1, opacity + 0.2), roughness: 0.2, emissive: canals ? 0x2aff9a : 0x000000, emissiveIntensity: canals ? 0.6 : 0 }), false);
  rim.rotation.x = Math.PI / 2; g.add(rim);
  if (gonads) for (let i = 0; i < 4; i++) {
    const t = mesh(new THREE.TorusGeometry(R * 0.2, R * 0.05, 8, 24, Math.PI * 1.5), std(gonads, { roughness: 0.4 }), false);
    t.rotation.set(Math.PI / 2, 0, (i / 4) * Math.PI * 2);
    t.position.set(Math.cos((i / 4) * Math.PI * 2) * R * 0.28, R * 0.25, Math.sin((i / 4) * Math.PI * 2) * R * 0.28);
    g.add(t);
  }
  if (yolk) g.add(at(mesh(ellipsoid(R * 0.42, R * 0.18, R * 0.42), std(yolk, { roughness: 0.35 }), false), 0, R * 0.2, 0));
  if (canals) for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, r = R * (0.15 + 0.84 * t); pts.push(new THREE.Vector3(Math.cos(a) * r, R * 0.5 * Math.cos((t * Math.PI) / 2) * 0.98, Math.sin(a) * r)); }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, R * 0.006, 4), std(0xd8f8ee, { emissive: 0x2a8a6a, emissiveIntensity: 0.5 }), false));
  }
  const tmat = std(tentacleColour ?? colour, { roughness: 0.5, transparent: true, opacity: 0.85 });
  for (let i = 0; i < tentacles; i++) {
    const a = (i / tentacles) * Math.PI * 2, r0 = R * (0.97 - (i % 4) * 0.06), pts = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      pts.push(new THREE.Vector3(Math.cos(a) * r0 * (1 + t * 0.15) + Math.sin(t * 6 + i) * R * 0.12 * t, -t * tentacleLen * (0.6 + 0.4 * ((i * 0.37) % 1)), Math.sin(a) * r0 * (1 + t * 0.15) + Math.cos(t * 5 + i) * R * 0.12 * t));
    }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, R * 0.008, 4), tmat, false));
  }
  const amat = std(armColour ?? colour, { roughness: 0.3, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < oralArms; i++) {
    const a = (i / oralArms) * Math.PI * 2 + 0.4, pts = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector3(Math.cos(a) * R * 0.15 * (1 + t), -t * R * 1.1, Math.sin(a) * R * 0.15 * (1 + t) + Math.sin(t * 7) * R * 0.05)); }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, R * 0.045, 6), amat, false));
  }
  g.userData = { centreY: -R * 0.2 };
  return g;
}

export const moonJelly = () => jelly({ R: 0.18, colour: 0xe4ecf4, opacity: 0.4, gonads: 0xb08ad0, tentacles: 90, tentacleLen: 0.05, oralArms: 4 });
export const lionsMane = () => jelly({ R: 0.3, colour: 0xa8542a, opacity: 0.75, tentacles: 110, tentacleLen: 0.7, tentacleColour: 0xe0a070, oralArms: 8, armColour: 0xb05a30 });
export const friedEggJelly = () => jelly({ R: 0.25, colour: 0xf0eadc, opacity: 0.5, yolk: 0xf0b820, tentacles: 64, tentacleLen: 0.6, oralArms: 6, armColour: 0xf2e6c4 });
export const waterJelly = () => jelly({ R: 0.12, colour: 0xe6f6f2, opacity: 0.22, canals: true, tentacles: 100, tentacleLen: 0.12, oralArms: 0 });

// ---------- Seaweeds ----------

/** A ribbon blade from a start point along a curve, `ruffle` waves along its edges. */
function blade(points, width, colour, { ruffle = 0, opacity = 1, bumps = 0, bumpColour } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const n = 80, pos = [], idx = [], uv = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPoint(t), tan = curve.getTangent(t);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const w = width(t);
    for (const s of [-1, 0, 1]) {
      const r = s === 0 ? 0 : Math.sin(t * 46) * ruffle * w; // both edges flute together; the midrib stays flat
      pos.push(p.x + side.x * w * s, p.y + r, p.z + side.z * w * s);
      uv.push(t, (s + 1) / 2);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const g = new THREE.Group();
  g.add(mesh(geo, phys({ color: colour, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide, transparent: opacity < 1, opacity })));
  if (bumps) {
    const m = std(bumpColour ?? colour, { roughness: 0.4 });
    for (let i = 0; i < bumps; i++) {
      const t = 0.05 + 0.9 * ((i * 0.618) % 1), p = curve.getPoint(t), w = width(t) * (((i * 0.37) % 1) * 1.6 - 0.8);
      const tan = curve.getTangent(t), side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      g.add(at(mesh(new THREE.SphereGeometry(width(0.5) * 0.06, 6, 4), m), p.x + side.x * w, p.y + 0.004, p.z + side.z * w));
    }
  }
  return g;
}

export function bullKelp() {
  // The float at the surface and its long blades trailing down-current.
  const g = new THREE.Group();
  const brown = 0x6a5220;
  g.add(at(mesh(new THREE.SphereGeometry(0.07, 24, 18), phys({ color: 0x7a6028, roughness: 0.25, clearcoat: 0.8 })), 0, 0.02, 0));
  g.add(limb([0.06, 0.0, 0], [0.5, -0.25, 0], 0.025, std(0x6a5220, { roughness: 0.4 })));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18 - 0.5) * 0.9, len = 1.6 + (i % 5) * 0.25;
    const pts = [[-0.03, 0.02, 0]];
    for (let k = 1; k <= 5; k++) { const t = k / 5; pts.push([-Math.cos(a) * len * t, 0.01 - t * 0.04, Math.sin(a) * len * t + Math.sin(t * 4 + i) * 0.08]); }
    g.add(blade(pts, (t) => 0.025 + 0.035 * Math.sin(Math.PI * Math.min(1, t * 1.2)), brown, { ruffle: 0.25 }));
  }
  return g;
}

export function sugarKelp() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.SphereGeometry(0.05, 12, 8), std(0x4a3a1a)), 0, 0, 0, 0, 0, 0, [1, 0.4, 1]));
  g.add(limb([0, 0, 0], [0.2, 0.02, 0], 0.012, std(0x6a5220)));
  const pts = [[0.2, 0.02, 0], [0.7, 0.06, 0.05], [1.3, 0.04, -0.05], [1.9, 0.02, 0.06]];
  g.add(blade(pts, (t) => 0.04 + 0.11 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)), 0xa88a3a, { ruffle: 0.35 }));
  return g;
}

export function seaLettuce() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, len = 0.22 + (i % 3) * 0.06;
    const pts = [[0, 0.01 + i * 0.004, 0], [Math.cos(a) * len * 0.5, 0.02 + i * 0.004, Math.sin(a) * len * 0.5], [Math.cos(a + 0.3) * len, 0.015 + i * 0.004, Math.sin(a + 0.3) * len]];
    g.add(blade(pts, (t) => 0.04 + 0.08 * Math.sin(Math.PI * t), 0x7ad04a, { ruffle: 0.45, opacity: 0.85 }));
  }
  return g;
}

export function turkishTowel() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i - 1) * 0.5, len = 0.4 + i * 0.05;
    g.add(blade([[0, 0.01 + i * 0.01, 0], [Math.cos(a) * len * 0.5, 0.02, Math.sin(a) * len * 0.5], [Math.cos(a) * len, 0.015, Math.sin(a) * len]],
      (t) => 0.02 + 0.09 * Math.sin(Math.PI * Math.min(1, t * 1.1)), 0x8a2a3a, { ruffle: 0.3, bumps: 160, bumpColour: 0x9a3242 }));
  }
  return g;
}

// ---------- Trees ----------

function foliage(radius, colour, seed, squash = [1, 0.8, 1]) {
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 6 + seed, v.y * 6, v.z * 6);
    v.multiplyScalar(0.75 + 0.5 * n);
    p.setXYZ(i, v.x * squash[0], v.y * squash[1], v.z * squash[2]);
  }
  geo.computeVertexNormals();
  return mesh(geo, std(colour, { roughness: 0.8, flatShading: true }));
}

export function redCedar() {
  const g = new THREE.Group();
  const bark = std(0x7a4a32, { roughness: 0.95 });
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.7, 4, 16), bark).translateY(2));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.25, 14, 12), bark).translateY(11));
  // Tiers of drooping branch sprays, narrowing to a nodding leader.
  for (let i = 0; i < 16; i++) {
    const y = 3 + i * 0.85, r = 3.2 * (1 - i / 17) + 0.4;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + i * 0.7;
      const spray = foliage(r * 0.45, i % 2 ? 0x3e5a2a : 0x46632e, i * 6 + k, [1.3, 0.35, 0.8]);
      spray.position.set(Math.cos(a) * r * 0.6, y - r * 0.12, Math.sin(a) * r * 0.6);
      spray.rotation.set(0, -a, -0.35);
      g.add(spray);
    }
  }
  g.add(at(foliage(0.5, 0x46632e, 99, [0.6, 1.2, 0.6]), 0.3, 17.6, 0, 0, 0, -0.5));
  return g;
}

export function madrone() {
  // A twisting red trunk leaning out over the water, smooth where the bark has peeled.
  const g = new THREE.Group();
  const bark = phys({ color: 0xb5482d, roughness: 0.3, clearcoat: 0.4 });
  const peel = std(0x6a3a22, { roughness: 0.9 });
  const trunk = new THREE.CatmullRomCurve3([[0, 0, 0], [0.6, 2, 0.2], [0.4, 4, -0.3], [1.5, 6, 0.2], [2.6, 7.4, 0]].map((p) => new THREE.Vector3(...p)));
  g.add(mesh(new THREE.TubeGeometry(trunk, 40, 0.32, 12), bark));
  for (let i = 0; i < 10; i++) { const p = trunk.getPoint(0.1 + i * 0.08); g.add(at(mesh(ellipsoid(0.2, 0.08, 0.05), peel), p.x + 0.3, p.y, p.z, 0, i, 0.4)); }
  const limbs = [[[0.4, 4, -0.3], [-1.2, 6, -0.8], [-2, 7.2, -1]], [[1.5, 6, 0.2], [2.4, 6.6, 1.4], [3.4, 7.2, 1.8]], [[2.6, 7.4, 0], [3.4, 8.6, -0.6]]];
  for (const l of limbs) g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(l.map((p) => new THREE.Vector3(...p))), 20, 0.14, 8), bark));
  for (const [x, y, z, r] of [[-2, 7.6, -1, 1.5], [3.4, 7.6, 1.8, 1.4], [3.4, 9, -0.6, 1.6], [1.6, 8.6, 0.3, 1.8], [-0.6, 8.2, -0.4, 1.3]]) g.add(at(foliage(r, 0x2f5a26, x * 3 + z, [1.2, 0.75, 1.1]), x, y, z));
  return g;
}

export function garryOak() {
  // Gnarled, spreading limbs and a broad, rounded crown in an open meadow.
  const g = new THREE.Group();
  const bark = std(0x5a5650, { roughness: 1 });
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.55, 3, 12), bark).translateY(1.5));
  const limbs = [[[0, 3, 0], [-2, 5, 0.5], [-3.6, 6, 0.8]], [[0, 3, 0], [2.2, 5.2, -0.4], [3.8, 6.2, -0.4]], [[0, 3, 0], [0.4, 5.6, 1.6], [0.6, 7, 2.4]], [[0, 3, 0], [-0.4, 6, -1.6]]];
  for (const l of limbs) g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(l.map((p) => new THREE.Vector3(...p))), 20, 0.18, 8), bark));
  for (const [x, y, z, r] of [[-3.4, 6.6, 0.8, 1.9], [3.6, 6.8, -0.4, 2], [0.6, 7.6, 2.2, 1.8], [-0.4, 7.4, -1.6, 2], [0, 8.2, 0, 2.2]]) g.add(at(foliage(r, 0x4a6a2a, x * 5 + z, [1.2, 0.7, 1.2]), x, y, z));
  const grass = mesh(new THREE.CircleGeometry(6, 40), std(0xb8a860, { roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; g.add(grass);
  return g;
}

export function douglasFir() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.6, 22, 12), std(0x5a4234, { roughness: 1 })).translateY(11));
  for (let i = 0; i < 18; i++) {
    const y = 4 + i * 1.05, r = 3.6 * (1 - i / 19) + 0.3;
    g.add(at(foliage(r, i % 2 ? 0x24402a : 0x2a4a30, i * 3, [1, 0.32, 1]), 0, y, 0));
  }
  return g;
}

// ---------- The registry ----------

/**
 * species id → how to build it and how to photograph it. `portrait` is a three-quarter view
 * (az, el); `top` (if present) is how it appears on the water from above, in metres.
 */
export const SPECIES_MODELS = {
  biggsOrca: { build: () => buildOrca({ bull: true }), portrait: { az: 2.2, el: 0.35 } },
  southernResident: { build: () => buildOrca({ bull: true, openSaddle: true }), portrait: { az: 2.2, el: 0.35 } },
  humpback: { build: humpback, portrait: { az: 2.3, el: 0.35 }, top: { span: 16, depths: true } },
  minke: { build: minke, portrait: { az: 2.2, el: 0.35 }, top: { span: 10, depths: true } },
  dallsPorpoise: { build: dallsPorpoise, portrait: { az: 2.2, el: 0.3 }, top: { span: 3, depths: true } },
  harbourPorpoise: { build: harbourPorpoise, portrait: { az: 2.2, el: 0.3 }, top: { span: 2.4, depths: true } },
  harbourSeal: { build: () => buildSeal({ tone: 0 }), portrait: { az: 0.9, el: 0.45 } },
  stellerSeaLion: { build: stellerSeaLion, portrait: { az: 0.9, el: 0.3 }, top: { span: 4 } },
  californiaSeaLion: { build: californiaSeaLion, portrait: { az: 0.9, el: 0.3 }, top: { span: 3 } },
  seaOtter: { build: seaOtter, portrait: { az: 0.8, el: 0.6 }, top: { span: 1.8, water: true } },
  riverOtter: { build: riverOtter, portrait: { az: 0.9, el: 0.3 }, top: { span: 1.6 } },
  baldEagle: { build: () => baldEagle('perch'), portrait: { az: 0.9, el: 0.25 }, top: { span: 2.6, build: () => baldEagle('soar'), fly: true } },
  peregrine: { build: peregrine, portrait: { az: 0.9, el: 0.2 } },
  kingfisher: { build: kingfisher, portrait: { az: 0.9, el: 0.2 } },
  oystercatcher: { build: oystercatcher, portrait: { az: 0.9, el: 0.25 }, top: { span: 1.2 } },
  pelagicCormorant: { build: () => pelagicCormorant(true), portrait: { az: 0.9, el: 0.2 } },
  cormorantRookery: { build: cormorantRookery, portrait: { az: 0.25, el: 0.15 } },
  seaStar: { build: ochreStar, portrait: { az: 0.6, el: 1.0 } },
  sunflowerStar: { build: sunflowerStar, portrait: { az: 0.6, el: 1.05 } },
  moonJelly: { build: moonJelly, portrait: { az: 0.5, el: 0.35 }, top: { span: 0.6, under: true } },
  lionsMane: { build: lionsMane, portrait: { az: 0.5, el: 0.3 }, top: { span: 1.2, under: true } },
  friedEggJelly: { build: friedEggJelly, portrait: { az: 0.5, el: 0.35 }, top: { span: 0.9, under: true } },
  waterJelly: { build: waterJelly, portrait: { az: 0.5, el: 0.35 }, top: { span: 0.4, under: true } },
  bullKelp: { build: bullKelp, portrait: { az: 0.7, el: 0.9 }, top: { span: 4, bed: true } },
  sugarKelp: { build: sugarKelp, portrait: { az: 0.6, el: 0.85 }, top: { span: 2.2, bed: true } },
  seaLettuce: { build: seaLettuce, portrait: { az: 0.6, el: 1.0 } },
  turkishTowel: { build: turkishTowel, portrait: { az: 0.6, el: 1.0 } },
  redCedar: { build: redCedar, portrait: { az: 0.7, el: 0.12 } },
  madrona: { build: madrone, portrait: { az: 0.7, el: 0.12 } },
  garryOak: { build: garryOak, portrait: { az: 0.7, el: 0.15 } },
  douglasFir: { build: douglasFir, portrait: { az: 0.7, el: 0.12 } },
};
