// The top-down world view: the shader, a camera in metres, and the things that float on it.
import Phaser from 'phaser';
import { WORLD_FRAG, daylight } from './waterShader.js';
import { buildLandMask } from './landMask.js';
import { drawKayakTop, HULL, PFD } from './kayakArt.js';
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

  /** Draw a kayak (id → graphics). Visual size is never smaller than `minPt` points. */
  drawBoat(id, k, opts = {}) {
    let g = this.boats.get(id);
    if (!g) {
      g = this.scene.add.graphics().setDepth(8);
      this.boats.set(id, g);
    }
    const L = Math.max(4.9 * this.ppm, px(opts.minPt ?? 58));
    const s = this.toScreen(k.x, k.y);
    g.setPosition(s.x, s.y);
    g.setRotation(k.heading);
    const heelVis = k.upright ? Math.cos(Math.min(1.2, Math.abs(k.heel))) : 1;
    g.setScale(heelVis, 1);
    if (!k.upright) {
      g.clear();
      // Upturned hull.
      g.fillStyle(0x00161c, 0.3);
      g.fillEllipse(L * 0.02, L * 0.03, L * 0.2, L * 1.02);
      g.fillStyle(0x3a3f44, 1);
      g.fillEllipse(0, 0, L * 0.16, L);
      g.lineStyle(Math.max(1, L * 0.01), 0x9fb8b3, 0.6);
      g.lineBetween(0, -L * 0.48, 0, L * 0.48);
      return g;
    }
    drawKayakTop(g, L, {
      hull: opts.hull ?? HULL.player, pfd: opts.pfd ?? PFD.player, accent: opts.accent, hullHi: opts.hullHi,
      phase: opts.phase ?? 0, lean: k.edge, resting: opts.resting,
    });
    return g;
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

/** Draw an orca pod (dorsal fins, backs, blows) onto a graphics layer. */
export function drawOrcas(world, pod, t) {
  const g = world.overG;
  const ppm = world.ppm;
  const size = Math.max(7 * ppm, px(22));
  for (const [i, m] of pod.members.entries()) {
    const x = pod.x + m.dx, y = pod.y + m.dy;
    const s = world.toScreen(x, y);
    const cyc = (t * 0.35 + i * 0.27) % 1; // surfacing cycle
    const up = cyc < 0.35 ? Math.sin((cyc / 0.35) * Math.PI) : 0;
    const L = size * (m.calf ? 0.6 : 1);
    if (up > 0.05) {
      g.fillStyle(0x0c0f12, 0.95 * up);
      g.fillEllipse(s.x, s.y, L * 0.28, L);
      // Saddle patch and eye patch.
      g.fillStyle(0xd8dde0, 0.7 * up);
      g.fillEllipse(s.x, s.y + L * 0.18, L * 0.16, L * 0.14);
      // Dorsal fin: tall on the bull.
      g.fillStyle(0x05070a, up);
      const fin = L * (m.bull ? 0.42 : 0.2);
      g.fillTriangle(s.x - L * 0.05, s.y, s.x + L * 0.05, s.y, s.x, s.y - fin);
    } else {
      g.fillStyle(0x0c0f12, 0.25);
      g.fillEllipse(s.x, s.y, L * 0.2, L * 0.8);
    }
    // Blow: a brief white plume as they surface.
    if (cyc > 0.02 && cyc < 0.12) {
      const b = 1 - Math.abs(cyc - 0.07) / 0.05;
      g.fillStyle(0xffffff, 0.55 * b);
      g.fillCircle(s.x, s.y - L * 0.25, L * 0.18 * (0.6 + b));
    }
  }
}

/** Draw hauled-out seals on their rocks. */
export function drawSeals(world, rock, state, t) {
  const g = world.overG;
  const s = world.toScreen(rock.x, rock.y);
  const R = Math.max(18 * world.ppm, px(26));
  g.fillStyle(0x5a574f, 1);
  g.fillEllipse(s.x, s.y, R * 2.2, R * 1.3);
  g.fillStyle(0x7a766b, 1);
  g.fillEllipse(s.x - R * 0.2, s.y - R * 0.15, R * 1.6, R * 0.8);
  const n = state === 'flushed' ? 0 : 5;
  for (let i = 0; i < n; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const x = s.x + Math.cos(a) * R * 0.55, y = s.y + Math.sin(a) * R * 0.3;
    g.fillStyle([0x8a8578, 0x6e6a60, 0xa39e8e][i % 3], 1);
    g.fillEllipse(x, y, R * 0.42, R * 0.2);
    if (state === 'alert') { g.fillStyle(0x3a3833, 1); g.fillCircle(x + R * 0.2, y - R * 0.08, R * 0.08); }
  }
  if (state === 'flushed') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t;
      g.fillStyle(0x3a3833, 0.8);
      g.fillCircle(s.x + Math.cos(a) * R * 1.4, s.y + Math.sin(a) * R * 0.9, R * 0.1);
    }
  }
}

/** A Washington State Ferries–style vessel from above: long white hull, green trim. */
export function drawFerry(world, f) {
  const g = world.overG;
  const s = world.toScreen(f.x, f.y);
  const L = Math.max(110 * world.ppm, px(60));
  const B = L * 0.2;
  g.save?.();
  const c = Math.cos(f.heading), sn = Math.sin(f.heading);
  const pt = (x, y) => ({ x: s.x + x * c - y * sn, y: s.y + x * sn + y * c });
  const hull = [pt(0, -L / 2), pt(B / 2, -L * 0.36), pt(B / 2, L * 0.36), pt(0, L / 2), pt(-B / 2, L * 0.36), pt(-B / 2, -L * 0.36)];
  g.fillStyle(0x00161c, 0.3);
  g.fillPoints(hull.map((p) => ({ x: p.x + L * 0.02, y: p.y + L * 0.03 })), true);
  g.fillStyle(0xf4f4ef, 1);
  g.fillPoints(hull, true);
  g.fillStyle(0x2f7a4a, 1);
  const deck = [pt(B * 0.32, -L * 0.3), pt(B * 0.32, L * 0.3), pt(-B * 0.32, L * 0.3), pt(-B * 0.32, -L * 0.3)];
  g.fillPoints(deck, true);
  g.fillStyle(0xe9e9e2, 1);
  g.fillPoints([pt(B * 0.22, -L * 0.12), pt(B * 0.22, L * 0.12), pt(-B * 0.22, L * 0.12), pt(-B * 0.22, -L * 0.12)], true);
}

export function ring(world, x, y, r, color, alpha = 0.5) {
  const s = world.toScreen(x, y);
  world.overG.lineStyle(px(1.5), color, alpha);
  world.overG.strokeCircle(s.x, s.y, r * world.ppm);
}
