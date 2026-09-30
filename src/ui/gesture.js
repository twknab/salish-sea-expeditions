// A gesture pad for step-by-step activities (assembly, rescues). Each gesture returns a quality
// 0..1 so the sim can decide success (sim/rescue.js, sim/assembly.js).
import Phaser from 'phaser';
import { COLOR, CSS, layout, px, textStyle } from './theme.js';
import { sound } from '../audio/soundscape.js';

const HINT = {
  hold: 'Press and hold',
  swipeDown: 'Swipe down',
  swipeUp: 'Swipe up',
  swipeOut: 'Swipe outward',
  circle: 'Trace a circle',
  tapRhythm: 'Tap with the pulses',
  snap: 'Flick — fast and sharp',
};

export class GesturePad {
  constructor(scene, { x, y, r = 110, depth = 70 }) {
    this.scene = scene;
    this.x = x; this.y = y; this.r = r;
    this.c = scene.add.container(px(x), px(y)).setDepth(depth);
    this.bg = scene.add.graphics();
    this.fg = scene.add.graphics();
    this.hint = scene.add.text(0, px(r + 22), '', textStyle(13, { color: CSS.mist })).setOrigin(0.5);
    this.c.add([this.bg, this.fg, this.hint]);
    this.active = null;
    this.drawBase();
    this.onDown = (p) => this.down(p);
    this.onMove = (p) => this.move(p);
    this.onUp = (p) => this.up(p);
    scene.input.on('pointerdown', this.onDown);
    scene.input.on('pointermove', this.onMove);
    scene.input.on('pointerup', this.onUp);
    scene.events.on('update', this.tick, this);
  }

  destroy() {
    const s = this.scene;
    s.input.off('pointerdown', this.onDown);
    s.input.off('pointermove', this.onMove);
    s.input.off('pointerup', this.onUp);
    s.events.off('update', this.tick, this);
    this.c.destroy();
  }

  drawBase() {
    const g = this.bg;
    g.clear();
    g.fillStyle(COLOR.ink, 0.55);
    g.fillCircle(0, 0, px(this.r));
    g.lineStyle(px(1), 0xffffff, 0.15);
    g.strokeCircle(0, 0, px(this.r));
  }

  /** Ask for a gesture. Resolves with a quality 0..1. */
  ask(kind) {
    this.kind = kind;
    this.hint.setText(HINT[kind] ?? kind);
    this.state = { t0: performance.now(), pts: [], angle: 0, lastAng: null, holding: false, held: 0, taps: [], beats: [] };
    if (kind === 'tapRhythm') {
      const now = performance.now() + 700;
      this.state.beats = [0, 1, 2, 3].map((i) => now + i * 620);
    }
    return new Promise((res) => { this.resolve = res; });
  }

  finish(q) {
    const r = this.resolve;
    this.resolve = null;
    this.kind = null;
    this.fg.clear();
    this.hint.setText('');
    q = Phaser.Math.Clamp(q, 0, 1);
    if (q >= 0.6) sound.ui('tap');
    r?.(q);
  }

  local(p) {
    return { x: p.x / layout.S - this.x, y: p.y / layout.S - this.y, t: p?.event?.timeStamp ?? performance.now() };
  }

  inside(l) {
    return Math.hypot(l.x, l.y) < this.r * 1.25;
  }

  down(p) {
    if (!this.kind) return;
    const l = this.local(p);
    if (!this.inside(l) && this.kind !== 'tapRhythm') return;
    sound.unlock();
    const s = this.state;
    s.down = l; s.pts = [l];
    if (this.kind === 'hold') { s.holding = true; s.holdStart = l.t; }
    if (this.kind === 'tapRhythm') {
      s.taps.push(l.t);
      this.flashTap();
      if (s.taps.length >= 4) {
        const errs = s.beats.map((b, i) => Math.abs((s.taps[i] ?? b + 999) - b));
        const q = errs.reduce((a, e) => a + Phaser.Math.Clamp(1 - e / 320, 0, 1), 0) / 4;
        this.finish(0.3 + 0.7 * q);
      }
    }
  }

  move(p) {
    if (!this.kind || !this.state.down) return;
    const l = this.local(p);
    const s = this.state;
    s.pts.push(l);
    if (this.kind === 'hold' && Math.hypot(l.x - s.down.x, l.y - s.down.y) > 30) {
      s.holding = false;
      this.finish(s.held * 0.8);
    }
    if (this.kind === 'circle') {
      const a = Math.atan2(l.y, l.x);
      if (s.lastAng != null) {
        let d = a - s.lastAng;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        s.angle += d;
      }
      s.lastAng = a;
      if (Math.abs(s.angle) > Math.PI * 1.7) {
        const rs = s.pts.map((q) => Math.hypot(q.x, q.y));
        const m = rs.reduce((x, y) => x + y, 0) / rs.length;
        const sd = Math.sqrt(rs.reduce((x, y) => x + (y - m) ** 2, 0) / rs.length);
        this.finish(Phaser.Math.Clamp(1.1 - sd / (m + 1), 0.3, 1));
      }
    }
  }

  up(p) {
    if (!this.kind || !this.state.down) return;
    const l = this.local(p);
    const s = this.state;
    s.pts.push(l);
    const a = s.down;
    const dx = l.x - a.x, dy = l.y - a.y, dist = Math.hypot(dx, dy), dur = l.t - a.t;
    const k = this.kind;
    s.down = null;
    if (k === 'hold') { if (s.holding) this.finish(s.held); return; }
    let path = 0;
    for (let i = 1; i < s.pts.length; i++) path += Math.hypot(s.pts[i].x - s.pts[i - 1].x, s.pts[i].y - s.pts[i - 1].y);
    const straight = path > 0 ? dist / path : 0;
    const len = Phaser.Math.Clamp(dist / (this.r * 1.1), 0, 1);
    if (k === 'swipeDown') this.finish(dy > 30 ? len * (0.5 + 0.5 * straight) : 0.1);
    else if (k === 'swipeUp') this.finish(dy < -30 ? len * (0.5 + 0.5 * straight) : 0.1);
    else if (k === 'swipeOut') this.finish(Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) ? len * (0.5 + 0.5 * straight) : 0.1);
    else if (k === 'snap') this.finish(dist > 50 ? Phaser.Math.Clamp(1.2 - dur / 400, 0.2, 1) : 0.1);
  }

  flashTap() {
    const g = this.fg;
    g.fillStyle(COLOR.foam, 0.3);
    g.fillCircle(0, 0, px(this.r * 0.9));
  }

  tick() {
    if (!this.kind) return;
    const g = this.fg, s = this.state, now = performance.now();
    g.clear();
    const R = px(this.r);
    if (this.kind === 'hold') {
      if (s.holding) s.held = Phaser.Math.Clamp((now - s.holdStart) / 1100, 0, 1);
      g.lineStyle(px(6), COLOR.sun, 0.9);
      g.beginPath(); g.arc(0, 0, R * 0.7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.held); g.strokePath();
      g.fillStyle(COLOR.foam, s.holding ? 0.5 : 0.18);
      g.fillCircle(0, 0, R * 0.35);
      if (s.held >= 1 && s.holding) { s.holding = false; this.finish(1); }
    } else if (this.kind === 'tapRhythm') {
      for (const b of s.beats) {
        const d = (b - now) / 620;
        if (d > -0.3 && d < 1.2) {
          g.lineStyle(px(3), COLOR.sun, Phaser.Math.Clamp(1 - Math.abs(d), 0, 1));
          g.strokeCircle(0, 0, R * (0.3 + Math.max(0, d) * 0.6));
        }
      }
      g.fillStyle(COLOR.foam, 0.25);
      g.fillCircle(0, 0, R * 0.3);
      if (now > s.beats[3] + 900 && s.taps.length < 4) this.finish(s.taps.length * 0.12);
    } else if (this.kind === 'circle') {
      g.lineStyle(px(2), 0xffffff, 0.25);
      g.strokeCircle(0, 0, R * 0.65);
      g.lineStyle(px(5), COLOR.sun, 0.9);
      const a0 = -Math.PI / 2;
      g.beginPath(); g.arc(0, 0, R * 0.65, a0, a0 + Phaser.Math.Clamp(s.angle, -Math.PI * 2, Math.PI * 2), s.angle < 0); g.strokePath();
    } else {
      // Directional hint: a chevron that drifts in the gesture's direction.
      const dir = { swipeDown: [0, 1], swipeUp: [0, -1], swipeOut: [1, 0], snap: [1, -1] }[this.kind];
      const ph = ((now / 900) % 1);
      g.fillStyle(COLOR.sun, 0.9 * (1 - ph));
      const cx = dir[0] * R * (ph - 0.3) * 0.9, cy = dir[1] * R * (ph - 0.3) * 0.9;
      const a = Math.atan2(dir[1], dir[0]);
      const tip = { x: cx + Math.cos(a) * R * 0.18, y: cy + Math.sin(a) * R * 0.18 };
      const l1 = { x: cx + Math.cos(a + 2.5) * R * 0.18, y: cy + Math.sin(a + 2.5) * R * 0.18 };
      const l2 = { x: cx + Math.cos(a - 2.5) * R * 0.18, y: cy + Math.sin(a - 2.5) * R * 0.18 };
      g.fillTriangle(tip.x, tip.y, l1.x, l1.y, l2.x, l2.y);
    }
  }
}
