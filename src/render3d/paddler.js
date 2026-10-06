// The paddler in 3D, posed from stroke.js: drysuit, PFD, sun hat, gloves, a spray skirt sealing
// the cockpit, and a Greenland paddle: one piece of cedar, long narrow unfeathered blades. Built fresh for
// each pose (cheap: a few dozen primitives) and photographed by the studio.
import * as THREE from 'three';
import { strokePose, restPose, shoulders, elbow, paddleLine } from './stroke.js';
import { KAYAK, deckY, buildKayak } from './kayak.js';

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/** The seat in kayak coordinates; everything in stroke.js is relative to it. */
export const SEAT = [-0.06, 0.08, 0];

export const PFD_COLOURS = { yellow: 0xe7a33a, white: 0xe6ece9, red: 0xd2453a };

function limb(a, b, r, mat) {
  const A = V(a), B = V(b), len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true;
  return m;
}

/**
 * A Greenland paddle, carved from one piece of cedar: a short oval loom, shoulders, and two long,
 * narrow, unfeathered blades with a gentle diamond cross-section that taper to 9 cm tips. Built
 * along +y from tip to tip, centred at the origin. `PADDLE.length` matches stroke.js.
 */
export const PADDLE = { length: 2.2, loom: 0.5, tipWidth: 0.09, rootWidth: 0.04, loomWidth: 0.035, thick: 0.03 };

export function greenlandPaddleGeometry() {
  const { length: L, loom, tipWidth, rootWidth, loomWidth, thick } = PADDLE;
  const n = 72, pos = [], idx = [];
  const half = L / 2;
  // Half-width and half-thickness along the paddle, by distance from the centre.
  const prof = (d) => {
    const a = Math.abs(d);
    if (a < loom / 2) return { w: loomWidth / 2, t: thick / 2 * 1.05, round: 1 };
    const u = (a - loom / 2) / (half - loom / 2); // 0 at the shoulder → 1 at the tip
    const shoulder = Math.min(1, u / 0.06); // the loom flares into the blade root
    const w = (rootWidth / 2) * (1 - shoulder) + shoulder * ((rootWidth / 2) + (tipWidth / 2 - rootWidth / 2) * Math.pow(u, 0.85));
    const t = (thick / 2) * (1 - 0.55 * u) * (0.6 + 0.4 * (1 - shoulder) + 0.4 * shoulder);
    return { w, t, round: 1 - shoulder * 0.7 };
  };
  const ring = 16;
  for (let i = 0; i <= n; i++) {
    const d = -half + (i / n) * L, { w, t, round } = prof(d);
    const tipRound = 1 - Math.pow(Math.max(0, (Math.abs(d) - half + 0.03) / 0.03), 2); // rounded tips
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      // Blend between an ellipse (loom) and a diamond (blade): the Greenland cross-section.
      const ex = c * w, ez = sn * t;
      const dx = Math.sign(c) * w * (1 - Math.abs(sn)), dz = Math.sign(sn) * t * (1 - Math.abs(c));
      pos.push((ex * round + dx * (1 - round)) * Math.max(0.15, tipRound), d, (ez * round + dz * (1 - round)) * Math.max(0.15, tipRound));
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < ring; j++) {
    const a = i * ring + j, b = i * ring + ((j + 1) % ring), c = a + ring, dd = b + ring;
    idx.push(a, c, b, b, c, dd);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function cedarTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 64; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#c9a068'; g.fillRect(0, 0, 64, 1024);
  for (let y = 0; y < 1024; y += 1) {
    const grain = 0.5 + 0.5 * Math.sin(y * 0.11 + Math.sin(y * 0.013) * 6) + 0.25 * Math.sin(y * 0.53);
    g.fillStyle = `rgba(120,70,30,${0.08 + 0.16 * grain})`; g.fillRect(0, y, 64, 1);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The paddle as a mesh, oiled cedar, with named anchor points for the lesson. */
export function buildGreenlandPaddle() {
  const geo = greenlandPaddleGeometry();
  // Planar UVs along the length so the grain runs the right way.
  const p = geo.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push((p.getX(i) + 0.05) * 5, (p.getY(i) + 1.1) / 2.2 * 4);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const mat = new THREE.MeshPhysicalMaterial({ map: cedarTexture(), color: 0xffffff, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3 });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  const g = new THREE.Group();
  g.add(m);
  const h = PADDLE.length / 2, l = PADDLE.loom / 2;
  g.userData.anchors = { blade: [0, -(l + (h - l) * 0.55), 0], loom: [0, 0, 0], shoulder: [0, l + 0.03, 0], tip: [0, h - 0.04, 0] };
  return g;
}

/**
 * Build the posed paddler. `phase` 0..1 through a stroke pair, or `rest` to sit with the paddle
 * across the deck. Returns a group in kayak coordinates.
 */
export function buildPaddler({ phase = 0, rest = false, pfd = 'yellow', legs = false } = {}) {
  const pose = rest ? restPose() : strokePose(phase);
  const at = (p) => [p[0] + SEAT[0], p[1] + SEAT[1], p[2] + SEAT[2]];
  const g = new THREE.Group();
  const suit = new THREE.MeshPhysicalMaterial({ color: 0x34505c, roughness: 0.6, sheen: 0.4, sheenColor: 0x6b8f9c });
  const vest = new THREE.MeshStandardMaterial({ color: PFD_COLOURS[pfd] ?? PFD_COLOURS.yellow, roughness: 0.85 });
  const neo = new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.7 });
  const glove = new THREE.MeshStandardMaterial({ color: 0x1f2428, roughness: 0.6 });

  // Spray skirt over the cockpit, and its tunnel up the torso.
  const ry = deckY(KAYAK.cockpitS, 0);
  const deck = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), neo);
  deck.scale.set(KAYAK.cockpitX + 0.01, 0.035, KAYAK.cockpitZ + 0.01);
  deck.position.set(0, ry, 0);
  deck.receiveShadow = true; deck.castShadow = true;
  g.add(deck);
  const grab = limb([KAYAK.cockpitX + 0.01, ry + 0.01, -0.04], [KAYAK.cockpitX + 0.04, ry + 0.01, 0.04], 0.01, new THREE.MeshStandardMaterial({ color: 0xf08a24, roughness: 0.6 }));
  g.add(grab);

  if (legs) {
    // Seated: thighs up under the deck into the thigh braces, shins down to the foot pegs.
    const hip = at([-0.02, 0.02, 0]), knee = (z) => [hip[0] + 0.62, hip[1] + 0.16, z], foot = (z) => [hip[0] + 1.08, hip[1] - 0.12, z];
    for (const z of [-0.14, 0.14]) {
      g.add(limb(hip, knee(z), 0.075, suit));
      g.add(limb(knee(z), foot(z), 0.06, suit));
      const boot = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.12, 6, 12), neo);
      boot.position.set(foot(z)[0] + 0.05, foot(z)[1] - 0.02, z); boot.rotation.z = Math.PI / 2 - 0.5; boot.castShadow = true;
      g.add(boot);
    }
    g.userData.anchors = { feet: foot(0.14), knees: knee(0.14), hips: hip, back: at([-0.22, 0.3, 0]), head: at([0, 0.72, 0]) };
  }

  // Torso, turned with the stroke.
  const torso = new THREE.Group();
  torso.position.set(...at([0, 0, 0]));
  torso.rotation.y = pose.twist;
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.18, 24), neo);
  tunnel.position.y = 0.16; tunnel.scale.set(0.85, 1, 1.05); tunnel.castShadow = true;
  torso.add(tunnel);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.26, 8, 20), suit);
  body.position.y = 0.38; body.scale.set(0.82, 1, 1.45); body.castShadow = true;
  torso.add(body);
  const jacket = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.2, 8, 20), vest);
  jacket.position.y = 0.38; jacket.scale.set(0.88, 1, 1.42); jacket.castShadow = true;
  torso.add(jacket);
  // PFD shoulder straps and a reflective patch on each.
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.06), vest);
    strap.position.set(0, 0.52, side * 0.13); torso.add(strap);
    const refl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.032, 0.05), new THREE.MeshStandardMaterial({ color: 0xdfe6e8, roughness: 0.3, metalness: 0.2 }));
    refl.position.set(0.04, 0.53, side * 0.13); torso.add(refl);
  }
  // Head with sunglasses-dark visor line and a wide sun hat.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.08, 16), suit);
  neck.position.y = 0.58; torso.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 18), new THREE.MeshStandardMaterial({ color: 0x20292e, roughness: 0.5 }));
  head.position.y = 0.68; head.scale.set(1.05, 1.1, 0.95); head.castShadow = true; torso.add(head);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd8caa2, roughness: 0.9 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.16, 0.012, 40), hatMat);
  brim.position.y = 0.74; brim.castShadow = true; torso.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.1, 32), hatMat);
  crown.position.y = 0.795; crown.castShadow = true; torso.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.101, 0.101, 0.022, 32), new THREE.MeshStandardMaterial({ color: 0x4a4030, roughness: 0.8 }));
  band.position.y = 0.758; torso.add(band);
  g.add(torso);

  // Arms by two-bone IK from the turned shoulders to the hands on the shaft.
  const sh = shoulders(pose.twist);
  for (const [side, S0, H0] of [[1, sh.R, pose.R], [-1, sh.L, pose.L]]) {
    const S = at(S0), H = at(H0), E = elbow(S, H, side);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 12), suit);
    ball.position.set(...S); ball.castShadow = true; g.add(ball);
    g.add(limb(S, E, 0.05, suit));
    g.add(limb(E, H, 0.044, suit));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), glove);
    hand.position.set(...H); hand.scale.set(1.2, 0.9, 0.9); hand.castShadow = true; g.add(hand);
  }

  // The paddle: one Greenland stick through both hands, unfeathered, so both blades lie flat.
  const pl = paddleLine(at(pose.R), at(pose.L));
  const paddle = buildGreenlandPaddle();
  const dir = V(pl.d);
  paddle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  // Roll about the shaft until the blades' wide axis lies flat (horizontal), as a paddler holds it.
  const ex = new THREE.Vector3(1, 0, 0).applyQuaternion(paddle.quaternion);
  const flat = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
  if (flat.lengthSq() > 1e-6) paddle.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.atan2(new THREE.Vector3().crossVectors(ex, flat).dot(dir), ex.dot(flat)));
  paddle.position.set(...pl.c);
  g.add(paddle);

  // Where a blade is in, the water rings around it.
  if (pose.wet) {
    const tip = pose.wet > 0 ? pl.tipR : pl.tipL;
    const root = pl.c, t = root[1] / (root[1] - tip[1]);
    if (t > 0 && t < 1) {
      const p = [0, 1, 2].map((i) => root[i] + (tip[i] - root[i]) * t);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.11, 32), new THREE.MeshBasicMaterial({ color: 0xeaf6f3, transparent: true, opacity: 0.55 }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(p[0], 0.004, p[2]); ring.scale.set(1.4, 1, 1);
      g.add(ring);
      const swirl = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.17, 32, 1, 0, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color: 0xeaf6f3, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      swirl.rotation.x = -Math.PI / 2; swirl.position.set(p[0] - 0.06, 0.004, p[2]);
      g.add(swirl);
    }
  }
  return g;
}

/**
 * A shadow-only copy of the kayak, so the paddler's shadow falls on the deck in the paddler's
 * sprite (the boat itself is a separate sprite underneath).
 */
export function deckShadowCatcher() {
  const { group } = buildKayak({ deck: '#000', deckLo: '#000', deckHi: '#000' });
  const catcher = new THREE.ShadowMaterial({ opacity: 0.35 });
  group.traverse((o) => { if (o.isMesh) { o.material = catcher; o.castShadow = false; o.receiveShadow = true; } });
  return group;
}
