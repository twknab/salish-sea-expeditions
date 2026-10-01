// The top-down world view: the shader, a camera in metres, and the things that float on it.
import Phaser from 'phaser';
import { WORLD_FRAG, daylight } from './waterShader.js';
import { buildLandMask } from './landMask.js';
import { drawKayakTop, HULL, PFD } from './kayakArt.js';
import {
  ensureSprite, kayakTopSVG, hullUpSVG, shadowSVG, paddlerTopSVG, PFD_TONES,
  orcaSVG, sealSVG, sealHeadSVG, sealRockSVG, ferrySVG,
} from './sprites.js';

// Sprite raster sizes (device pixels). The stroke is drawn in 12 frames.
const RES = { boat: 320, orca: 256, rock: 360, seal: 120, ferry: 512 };
const FRAMES = 12;
import { BOUNDS, RIPS } from '../content/chart.js';
import { layout, px } from '../ui/theme.js';

let maskInfo = null;

export function ensureLandMask(scene) {
  if (!maskInfo) maskInfo = buildLandMask(BOUNDS);
  if (!scene.textures.exists('landmask')) scene.textures.addCanvas('landmask', maskInfo.canvas);
  return maskInfo;
}

export class WorldView {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.mask = ensureLandMask(scene);
    this.cam = { x: 0, y: 0, viewW: opts.viewW ?? 320 };
    this.u = {
      time: 0, sun: [0.3, -0.5, 0.8], sky: [0.5, 0.65, 0.75], light: [1, 1, 1], day: 1,
      wind: [0, 0], cur: [0, 0], sea: 0.1, fog: 0, boat: [0, 0], glow: 0, q: 1,
      rips: [[0, 0, 1, 0], [0, 0, 1, 0]],
    };
    const W = px(layout.W), H = px(layout.H);
    const u = this.u, m = this.mask;
    this.shader = scene.add.shader({
      name: 'world',
      fragmentSource: WORLD_FRAG,
      initialUniforms: { uMask: 0 },
      setupUniforms: (set) => {
        const vw = this.cam.viewW, vh = vw * (layout.H / layout.W);
        set('uMaskMin', [m.minX, m.minY]);
        set('uMaskSize', [m.width, m.height]);
        set('uCam', [this.cam.x, this.cam.y]);
        set('uView', [vw, vh]);
        set('uTime', u.time);
        set('uSun', u.sun);
        set('uSky', u.sky);
        set('uLightCol', u.light);
        set('uDay', u.day);
        set('uWind', u.wind);
        set('uCur', u.cur);
        set('uSea', u.sea);
        set('uFog', u.fog);
        set('uBoat', u.boat);
        set('uRip0', u.rips[0]);
        set('uRip1', u.rips[1]);
        set('uQ', u.q);
        set('uGlow', u.glow);
      },
    }, W / 2, H / 2, W, H, ['landmask']);
    this.shader.setScrollFactor(0).setDepth(0);

    this.wakeG = scene.add.graphics().setDepth(5);
    this.overG = scene.add.graphics().setDepth(6); // wildlife, ferry, rings
    this.pool = []; // reusable images for sprites, re-dealt every frame
    this.poolIdx = 0;
    this.boats = new Map();
    this.wakes = new Map();
  }

  /** Pixels per metre at the current zoom. */
  get ppm() {
    return px(layout.W) / this.cam.viewW;
  }

  toScreen(x, y) {
    const ppm = this.ppm;
    return { x: px(layout.W) / 2 + (x - this.cam.x) * ppm, y: px(layout.H) / 2 - (y - this.cam.y) * ppm };
  }

  toWorld(sx, sy) {
    const ppm = this.ppm;
    return { x: this.cam.x + (sx - px(layout.W) / 2) / ppm, y: this.cam.y - (sy - px(layout.H) / 2) / ppm };
  }

  /** Set time-of-day, weather and water uniforms. */
  setConditions({ minute, wind, current, sea, fog = 0, boat, glow = 0, time, ripStrength = [0, 0] }) {
    const d = daylight(minute);
    Object.assign(this.u, {
      q: this.u.q, time, sun: d.sun, sky: d.sky, light: d.light, day: d.day,
      wind: [wind.x, wind.y], cur: [current.x, current.y], sea, fog, boat: [boat.x, boat.y], glow,
    });
    this.u.rips = RIPS.slice(0, 2).map((r, i) => [r.x, r.y, r.r, ripStrength[i] ?? 0]);
  }

  /** Start a frame: clear the overlay and take back every sprite. */
  beginFrame() {
    this.overG.clear();
    for (const im of this.pool) im.setVisible(false);
    this.poolIdx = 0;
  }

  /** Place a pooled sprite: centre (x, y) in device pixels, display size w × h. */
  spr(key, x, y, w, h, rot = 0, alpha = 1, depth = 6) {
    let im = this.pool[this.poolIdx];
    if (!im) { im = this.scene.add.image(0, 0, key); this.pool.push(im); }
    this.poolIdx++;
    if (im.texture.key !== key) im.setTexture(key);
    im.clearTint?.();
    return im.setPosition(x, y).setDisplaySize(w, h).setRotation(rot).setAlpha(alpha).setDepth(depth).setVisible(true);
  }

  /** Draw a kayak (id → graphics). Visual size is never smaller than `minPt` points. */
  drawBoat(id, k, opts = {}) {
    let g = this.boats.get(id);
    if (!g) {
      g = this.scene.add.graphics().setDepth(8);
      this.boats.set(id, g);
    }
    const L = Math.max(4.9 * this.ppm, px(opts.minPt ?? 58));
    const s = this.toScreen(k.x, k.y);
    if (this.drawBoatSprite(g, k, L, s, opts)) return g;
    g.setVisible(true);
    g.setPosition(s.x, s.y);
    g.setRotation(k.heading);
    const heelVis = k.upright ? Math.cos(Math.min(1.2, Math.abs(k.heel))) : 1;
    g.setScale(heelVis, 1);
    if (!k.upright) {
      g.clear();
      // Upturned hull.
      g.fillStyle(0x00161c, 0.3);
      g.fillEllipse(L * 0.02, L * 0.03, L * 0.2, L * 1.02);
      // Upturned: the white hull is what a rescuer sees, which is why the hulls are white.
      g.fillStyle(0x101214, 1);
      g.fillEllipse(0, 0, L * 0.165, L * 1.005);
      g.fillStyle(0xf2f3f0, 1);
      g.fillEllipse(0, 0, L * 0.15, L * 0.99);
      g.lineStyle(Math.max(1, L * 0.01), 0x9aa6a8, 0.8);
      g.lineBetween(0, -L * 0.48, 0, L * 0.48);
      return g;
    }
    drawKayakTop(g, L, {
      skin: opts.skin, hull: opts.hull ?? HULL.player, pfd: opts.pfd ?? PFD.player,
      phase: opts.phase ?? 0, lean: k.edge, resting: opts.resting,
    });
    return g;
  }

  /** The illustrated boat: shadow, deck (or upturned hull), and the paddler mid-stroke. */
  drawBoatSprite(g, k, L, s, opts) {
    const sc = this.scene, sk = opts.skin;
    if (!sk) return false;
    const R = RES.boat, w = R * 0.75;
    const deckKey = `kdeck-${sk.id}`, upKey = 'khull-up', shKey = 'kshadow';
    const ok = ensureSprite(sc, deckKey, () => kayakTopSVG(sk), w, R)
      & ensureSprite(sc, upKey, hullUpSVG, w, R) & ensureSprite(sc, shKey, () => shadowSVG(600, 800), w * 0.5, R * 0.5);
    const tone = opts.pfd === 0xe9f1ee ? 'white' : 'yellow';
    const frame = opts.resting ? 'rest' : Math.floor(((((opts.phase ?? 0) % 1) + 1) % 1) * FRAMES) % FRAMES;
    const pKey = `kpad-${tone}-${frame}`;
    const pOk = ensureSprite(sc, pKey, () => paddlerTopSVG(frame === 'rest' ? 0 : frame / FRAMES, PFD_TONES[tone], frame === 'rest'), w, R);
    // Warm the rest of the stroke so the animation never waits on a frame.
    if (pOk) for (let i = 0; i < FRAMES; i++) ensureSprite(sc, `kpad-${tone}-${i}`, () => paddlerTopSVG(i / FRAMES, PFD_TONES[tone]), w, R);
    if (!ok) return false;
    g.setVisible(false);
    const heelVis = k.upright ? Math.cos(Math.min(1.2, Math.abs(k.heel))) : 1;
    const W = L * 0.75, rot = k.heading;
    this.spr(shKey, s.x + L * 0.025, s.y + L * 0.035, W * heelVis, L * 1.02, rot, 0.9, 7);
    if (!k.upright) { this.spr(upKey, s.x, s.y, W, L, rot, 1, 8); return true; }
    this.spr(deckKey, s.x, s.y, W * heelVis, L, rot, 1, 8);
    if (pOk) {
      // The paddler sits up out of the boat: lean shifts them toward the edge.
      const lean = (k.edge ?? 0) * L * 0.012;
      this.spr(pKey, s.x + Math.cos(rot) * lean, s.y + Math.sin(rot) * lean, W, L, rot, 1, 9);
    }
    return true;
  }

  /** Record and draw fading wakes behind moving boats. */
  drawWakes(entries, dt) {
    const g = this.wakeG;
    g.clear();
    for (const [id, k] of entries) {
      let w = this.wakes.get(id);
      if (!w) { w = []; this.wakes.set(id, w); }
      const sp = Math.abs(k.speed);
      if (sp > 0.2 && k.upright) {
        const last = w.at(-1);
        if (!last || Math.hypot(k.x - last.x, k.y - last.y) > Math.max(1.2, 3 / this.ppm * layout.S)) {
          w.push({ x: k.x, y: k.y, h: k.heading, age: 0, sp });
        }
      }
      for (const p of w) p.age += dt;
      while (w.length && w[0].age > 9) w.shift();
      const L = Math.max(4.9 * this.ppm, px(58));
      for (const p of w) {
        const a = Math.max(0, 1 - p.age / 9);
        const s = this.toScreen(p.x, p.y);
        const spread = (0.25 + p.age * 0.9) * L * 0.18;
        const px0 = Math.cos(p.h) * spread, py0 = Math.sin(p.h) * spread;
        g.fillStyle(0xeaf4f1, 0.32 * a * Math.min(1, p.sp));
        g.fillCircle(s.x + px0, s.y + py0, Math.max(1, L * 0.018));
        g.fillCircle(s.x - px0, s.y - py0, Math.max(1, L * 0.018));
      }
    }
  }

  follow(x, y, lead = { x: 0, y: 0 }, dt = 0.016) {
    const k = Math.min(1, dt * 2.5);
    this.cam.x += (x + lead.x - this.cam.x) * k;
    this.cam.y += (y + lead.y - this.cam.y) * k;
  }
}

/** Draw an orca pod: illustrated backs and dorsal fins as they surface, a shadow when down, and blows. */
export function drawOrcas(world, pod, t) {
  const g = world.overG, sc = world.scene;
  const ppm = world.ppm;
  // Never smaller than the boats (which are shown at least 58 pt for a 4.9 m hull).
  const size = Math.max(7 * ppm, px(82));
  const ready = ensureSprite(sc, 'orca-bull', () => orcaSVG(true), RES.orca / 4, RES.orca)
    & ensureSprite(sc, 'orca', () => orcaSVG(false), RES.orca / 4, RES.orca);
  for (const [i, m] of pod.members.entries()) {
    const x = pod.x + m.dx, y = pod.y + m.dy;
    const s = world.toScreen(x, y);
    const cyc = (t * 0.35 + i * 0.27) % 1; // surfacing cycle
    const up = cyc < 0.35 ? Math.sin((cyc / 0.35) * Math.PI) : 0;
    const L = size * (m.calf ? 0.6 : 1);
    const rot = (pod.heading ?? 0) + Math.sin(t * 0.4 + i) * 0.06;
    if (ready) {
      // Below the surface the body is a dim green-black shape; breaking the surface it sharpens.
      world.spr(m.bull ? 'orca-bull' : 'orca', s.x, s.y, L / 4, L, rot, 0.22 + 0.78 * up, 6);
    } else if (up > 0.05) {
      g.fillStyle(0x0c0f12, 0.95 * up);
      g.fillEllipse(s.x, s.y, L * 0.28, L);
    }
    if (up > 0.05) {
      // A thin wash of white water around the back as it rolls.
      g.fillStyle(0xe8f4f1, 0.08 * up);
      g.fillEllipse(s.x, s.y, L * 0.34, L * 0.8);
    }
    // Blow: a brief white plume as they surface.
    if (cyc > 0.02 && cyc < 0.12) {
      const b = 1 - Math.abs(cyc - 0.07) / 0.05;
      const hx = s.x + Math.sin(rot) * L * 0.38, hy = s.y - Math.cos(rot) * L * 0.38;
      for (let j = 0; j < 4; j++) {
        g.fillStyle(0xffffff, 0.22 * b);
        g.fillCircle(hx + Math.sin(j * 2.1) * L * 0.04, hy + Math.cos(j * 1.7) * L * 0.04, L * (0.08 + 0.06 * j) * (0.6 + b));
      }
    }
  }
}

/** Harbour seals hauled out on their rock; alert ones turn to watch you; flushed ones are heads in the water. */
export function drawSeals(world, rock, state, t, from = null) {
  const g = world.overG, sc = world.scene;
  const s = world.toScreen(rock.x, rock.y);
  const R = Math.max(18 * world.ppm, px(44));
  const ready = ensureSprite(sc, 'seal-rock', sealRockSVG, RES.rock, RES.rock * 0.65)
    & [0, 1, 2].map((v) => ensureSprite(sc, `seal-${v}`, () => sealSVG(v), RES.seal / 3, RES.seal)).every(Boolean)
    & ensureSprite(sc, 'seal-head', sealHeadSVG, RES.seal / 2, RES.seal / 2);
  if (!ready) {
    g.fillStyle(0x5a574f, 1);
    g.fillEllipse(s.x, s.y, R * 2.2, R * 1.3);
    return;
  }
  world.spr('seal-rock', s.x, s.y, R * 2.4, R * 1.56, 0, 1, 5);
  const look = from ? Math.atan2(from.x - rock.x, from.y - rock.y) : null;
  const n = state === 'flushed' ? 0 : 5;
  for (let i = 0; i < n; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const x = s.x + Math.cos(a) * R * 0.55, y = s.y + Math.sin(a) * R * 0.3;
    const rest = a + Math.PI / 2 + Math.sin(i * 3.1) * 0.5;
    const rot = state === 'alert' && look != null ? look : rest;
    world.spr(`seal-${i % 3}`, x, y, R * 0.2, R * 0.6, rot, 1, 6);
  }
  if (state === 'flushed') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 0.3;
      world.spr('seal-head', s.x + Math.cos(a) * R * 1.5, s.y + Math.sin(a) * R * 1.0, R * 0.45, R * 0.45, 0, 0.9, 6);
    }
  }
}

/** A large double-ended island ferry from above. */
export function drawFerry(world, f) {
  const g = world.overG, sc = world.scene;
  const s = world.toScreen(f.x, f.y);
  const L = Math.max(110 * world.ppm, px(60));
  if (ensureSprite(sc, 'ferry', ferrySVG, RES.ferry / 5, RES.ferry)) {
    world.spr('ferry', s.x + L * 0.015, s.y + L * 0.02, L * 0.21, L * 1.01, f.heading, 0.3, 6).setTint?.(0x00161c);
    world.spr('ferry', s.x, s.y, L * 0.2, L, f.heading, 1, 7).clearTint?.();
    return;
  }
  const B = L * 0.2;
  const c = Math.cos(f.heading), sn = Math.sin(f.heading);
  const pt = (x, y) => ({ x: s.x + x * c - y * sn, y: s.y + x * sn + y * c });
  g.fillStyle(0xf4f4ef, 1);
  g.fillPoints([pt(0, -L / 2), pt(B / 2, -L * 0.36), pt(B / 2, L * 0.36), pt(0, L / 2), pt(-B / 2, L * 0.36), pt(-B / 2, -L * 0.36)], true);
}

export function ring(world, x, y, r, color, alpha = 0.5) {
  const s = world.toScreen(x, y);
  world.overG.lineStyle(px(1.5), color, alpha);
  world.overG.strokeCircle(s.x, s.y, r * world.ppm);
}
