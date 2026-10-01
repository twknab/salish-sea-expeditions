// The paddler in 3D, posed from stroke.js: drysuit, PFD, sun hat, gloves, a spray skirt sealing
// the cockpit, and a real paddle — carbon shaft, asymmetric blades feathered 30°. Built fresh for
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

function bladeGeometry() {
  // Asymmetric touring blade, 0.47 m × 0.17 m, root at the origin, tip along +y.
  const s = new THREE.Shape();
  s.moveTo(-0.022, 0);
  s.bezierCurveTo(-0.06, 0.08, -0.085, 0.25, -0.078, 0.4);
  s.bezierCurveTo(-0.07, 0.46, 0.02, 0.48, 0.07, 0.43);
  s.bezierCurveTo(0.09, 0.3, 0.06, 0.1, 0.022, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -0.003);
  return g;
}

/**
 * Build the posed paddler. `phase` 0..1 through a stroke pair, or `rest` to sit with the paddle
 * across the deck. Returns a group in kayak coordinates.
 */
export function buildPaddler({ phase = 0, rest = false, pfd = 'yellow' } = {}) {
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

  // The paddle.
  const pl = paddleLine(at(pose.R), at(pose.L));
  const shaft = limb(pl.tipR, pl.tipL, 0.016, new THREE.MeshPhysicalMaterial({ color: 0x1c1f22, roughness: 0.3, clearcoat: 0.8 }));
  g.add(shaft);
  const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0xf2eee3, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide });
  const edge = new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.5 });
  const bg = bladeGeometry();
  for (const [tip, sign, feather] of [[pl.tipR, -1, 0], [pl.tipL, 1, Math.PI / 6]]) {
    const dir = V(pl.d).multiplyScalar(sign);
    const blade = new THREE.Mesh(bg, bladeMat);
    blade.castShadow = true;
    // Long axis along the shaft, outward; face roughly vertical, feathered on the left blade.
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const spin = new THREE.Quaternion().setFromAxisAngle(dir, feather + Math.PI / 2);
    blade.quaternion.copy(spin.multiply(q));
    blade.position.copy(V(tip)).sub(dir.clone().multiplyScalar(0.48));
    g.add(blade);
    const tipBand = limb(V(tip).sub(dir.clone().multiplyScalar(0.03)).toArray(), tip, 0.02, edge);
    g.add(tipBand);
  }

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
