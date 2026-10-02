// Bake the 3D models into Phaser textures, once per session: kayak decks per skin, the upturned
// hull, the paddler through the stroke, orcas surfacing, the seal reef and the ferry. Canvases are
// powers of two so Phaser can mipmap them (crisp when small, smooth when turning). Baking yields
// between renders so a scene never stalls; until a texture exists, the 2D sprites stand in.
import { Group, Vector3 } from 'three';
import { capture, dispose, getStudio } from './studio.js';
import { buildKayak } from './kayak.js';
import { skinOf } from '../content/skins.js';
const skinOfDefault = () => skinOf(typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('sse.save.v1') ?? '{}').skin : undefined);
import { buildPaddler, deckShadowCatcher, buildGreenlandPaddle, PADDLE } from './paddler.js';
import { buildOrca, buildSeal, buildRock, buildFerry } from './wildlife.js';

import { SPECIES_MODELS } from './species3d.js';
import { FRAMES, STROKE_FRAMES, ORCA_DEPTHS, k3, kSp } from './keys.js';

const yieldFrame = () => new Promise((r) => setTimeout(r, 0));
const queued = new Set();

function put(scene, key, canvas) {
  if (!canvas || scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, canvas);
}

async function job(scene, key, make) {
  if (scene.textures.exists(key) || queued.has(key)) return;
  queued.add(key);
  try {
    await yieldFrame();
    if (!scene.sys?.isActive?.() && !scene.sys?.isVisible?.()) { queued.delete(key); return; }
    const { object, frame } = make();
    put(scene, key, capture(object, frame));
    dispose(object);
  } catch (e) {
    console.warn('bake failed', key, e);
  }
}


/** Queue everything the water view needs for these skins. Safe to call repeatedly. */
export async function bakeWater(scene, skins, { tones = ['yellow', 'white'], wildlife = true, ferry = true } = {}) {
  if (!getStudio()) return false;
  for (const sk of skins) await job(scene, k3.deck(sk.id), () => ({ object: buildKayak(sk).group, frame: FRAMES.boat }));
  await job(scene, k3.up, () => {
    const g = buildKayak(skins[0]).group;
    g.rotation.x = Math.PI; // keel up: the white hull is what a rescuer sees
    return { object: g, frame: FRAMES.boat };
  });
  for (const tone of tones) {
    const frames = [...Array.from({ length: STROKE_FRAMES }, (_, i) => i), 'rest']; // 'rest' last: it marks the set complete
    for (const f of frames) {
      await job(scene, k3.paddler(tone, f), () => {
        const g = new Group();
        g.add(buildPaddler(f === 'rest' ? { rest: true, pfd: tone } : { phase: f / STROKE_FRAMES, pfd: tone }));
        g.add(deckShadowCatcher());
        return { object: g, frame: FRAMES.paddler };
      });
    }
  }
  // Boats and paddlers are complete: the water view may switch to 3D (WorldView.drawBoat3d).
  scene.ready3d = true;
  if (wildlife) {
    for (const kind of ['bull', 'cow']) ORCA_DEPTHS.forEach((d, i) => job(scene, k3.orca(kind, i), () => {
      const o = buildOrca({ bull: kind === 'bull' });
      o.position.y = d * o.userData.girth;
      return { object: o, frame: { ...FRAMES.orca, water: i > 0 } };
    }));
    await job(scene, k3.rock, () => ({ object: buildRock(), frame: FRAMES.rock }));
    for (let i = 0; i < 3; i++) await job(scene, k3.seal(i), () => ({ object: buildSeal({ tone: i, seed: i * 7 }), frame: { ...FRAMES.seal, water: false } }));
    await job(scene, k3.sealHead, () => {
      const s = buildSeal({ tone: 1 });
      s.rotation.z = 1.2; s.position.set(-0.3, -0.55, 0); // upright in the water, head out
      return { object: s, frame: { ...FRAMES.sealHead, cx: 0.15 } };
    });
  }
  if (ferry) await job(scene, k3.ferry, () => ({ object: buildFerry(), frame: FRAMES.ferry }));
  return true;
}

/**
 * The side view (bow left) for Kayak School, Assembly and Outfitting, `w` pixels wide in the same
 * 1000 × 150 window the 2D illustration used, plus each named part projected into that window's
 * design units (x 0..1000, y 105..255 of a 1000 × 300 drawing) so hotspots land on the model.
 */
export function bakeSide(scene, sk, w, { ghost = true } = {}) {
  const key = `k3-side-${sk.id}-${ghost ? 'g' : 's'}-${Math.round(w)}`;
  const spanX = 5.12, spanY = spanX * 0.15;
  const { group, anchors } = buildKayak(sk, { ghost });
  const frame = { w: Math.round(w), h: Math.round(w * 0.15), spanX, spanZ: spanY, cx: 0, cz: 0.1, view: 'side', water: false };
  const canvas = capture(group, frame);
  if (!canvas) { dispose(group); return null; }
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
  const cam = canvas.camera, out = {};
  for (const [id, p] of Object.entries(anchors)) {
    const v = new Vector3(...p).project(cam);
    out[id] = [((v.x + 1) / 2) * 1000, 105 + ((1 - v.y) / 2) * 150];
  }
  dispose(group);
  return { key, anchors: out };
}

/** Just the deck from above, for the skin picker. Synchronous; returns the texture key or null. */
export function bakeDeck(scene, sk) {
  const key = k3.deck(sk.id);
  if (scene.textures.exists(key)) return key;
  const { group } = buildKayak(sk);
  const c = capture(group, FRAMES.boat);
  dispose(group);
  if (!c) return null;
  scene.textures.addCanvas(key, c);
  return key;
}

// ---------- Species (spec 005) ----------

/** A field-guide portrait. Synchronous; returns the key, or null without a studio or model. */
export function bakePortrait(scene, id, size = 256) {
  const key = kSp.portrait(id), m = SPECIES_MODELS[id];
  if (scene.textures.exists(key)) return key;
  if (!m || !getStudio()) return null;
  const obj = m.build();
  const c = capture(obj, { w: size, h: size, view: 'orbit', az: m.portrait.az, el: m.portrait.el, water: false });
  dispose(obj);
  if (!c) return null;
  scene.textures.addCanvas(key, c);
  return key;
}

/**
 * How a species looks from above on the water. Cetaceans get two images — a dim body below the
 * surface ('a') and the back breaking it ('b'); birds are photographed soaring; jellies and kelp
 * without the water plane so they show through it.
 */
export function bakeTop(scene, id) {
  const m = SPECIES_MODELS[id], t = m?.top;
  if (!t || !getStudio()) return null;
  const size = t.span > 6 ? 256 : 128;
  const frame = (o) => ({ w: size, h: size, spanX: t.span, spanZ: t.span, ...o });
  const shoot = (v, make, f) => {
    const key = kSp.top(id, v);
    if (scene.textures.exists(key)) return key;
    const obj = make();
    const c = capture(obj, frame(f));
    dispose(obj);
    if (c) scene.textures.addCanvas(key, c);
    return key;
  };
  const make = t.build ?? m.build;
  if (t.depths) {
    shoot('a', make, { water: false });
    shoot('b', () => { const o = make(); o.position.y = -(o.userData.girth ?? 0.3) * 0.75; return o; }, { water: true });
  } else shoot('a', make, { water: !!t.water });
  return kSp.top(id, 'a');
}

/** Queue the water views for the species sighted on this trip. */
export async function bakeSightings(scene, ids) {
  if (!getStudio()) return;
  for (const id of new Set(ids)) {
    if (!SPECIES_MODELS[id]?.top) continue;
    await yieldFrame();
    if (!scene.sys?.isActive?.()) return;
    try { bakeTop(scene, id); } catch (e) { console.warn('bake failed', id, e); }
  }
}

/**
 * The Greenland paddle for the paddle lesson, lying across the screen `w` pixels wide, with its
 * named points projected into design units (x 0..1000, y 0..H in a 1000-wide drawing).
 */
export function bakePaddle(scene, w) {
  const key = `k3-paddle-${Math.round(w)}`;
  const aspect = 0.22, span = PADDLE.length + 0.12;
  const g = buildGreenlandPaddle();
  g.rotation.z = Math.PI / 2; // along x, bow to the left
  g.rotation.y = 0.35; // a little turned, so the blade's diamond section reads
  const frame = { w: Math.round(w), h: Math.round(w * aspect), spanX: span, spanZ: span * aspect, view: 'side', water: false };
  const canvas = scene.textures.exists(key) ? null : capture(g, frame);
  const anchors = {};
  if (canvas || scene.textures.exists(key)) {
    const cam = canvas?.camera;
    if (canvas) scene.textures.addCanvas(key, canvas);
    if (cam) for (const [id, p] of Object.entries(g.userData.anchors)) {
      const v = new Vector3(...p).applyMatrix4(g.matrixWorld.identity().compose(g.position, g.quaternion, g.scale)).project(cam);
      anchors[id] = [((v.x + 1) / 2) * 1000, ((1 - v.y) / 2) * 1000 * aspect];
    }
  }
  dispose(g);
  return { key, anchors, aspect };
}

/**
 * The seated paddler in a see-through kayak, from the side, for the "you wear a kayak" lesson:
 * feet on the pegs, knees up under the deck, hips in the seat, back on the backband, head up.
 */
export function bakeSeated(scene, w) {
  const key = `k3-seated-${Math.round(w)}`;
  const aspect = 0.5, spanX = 2.6, cx = 0.3;
  const g = new Group();
  const boat = buildKayak(skinOfDefault(), { ghost: true }).group;
  const who = buildPaddler({ phase: 0.1, legs: true });
  g.add(boat, who);
  const frame = { w: Math.round(w), h: Math.round(w * aspect), spanX, spanZ: spanX * aspect, cx, cz: 0.42, view: 'side', water: false };
  const anchors = {};
  const canvas = scene.textures.exists(key) ? null : capture(g, frame);
  if (canvas) scene.textures.addCanvas(key, canvas);
  const cam = canvas?.camera;
  if (cam) for (const [id, p] of Object.entries(who.userData.anchors)) {
    const v = new Vector3(...p).project(cam);
    anchors[id] = [((v.x + 1) / 2) * 1000, ((1 - v.y) / 2) * 1000 * aspect];
  }
  dispose(g);
  return { key, anchors, aspect };
}
