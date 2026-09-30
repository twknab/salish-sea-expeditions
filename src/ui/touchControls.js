// Touch controls → PaddlerInput (contracts/paddler-input.md, research.md R7).
//
// Two thumb zones (one per paddle side) and a hips strip between them. The gestures are the
// technique: a long, smooth swipe from reach to hip IS torso rotation; a flick on the hips strip
// IS the hip snap; holding the blade on the low side IS the brace.
import Phaser from 'phaser';
import { emptyInput, rotationQuality } from '../sim/input.js';
import { COLOR, CSS, layout, px, textStyle } from './theme.js';

const HIP_LINE = 0.78; // fraction of zone height where the hip is

// Gesture timing from the input event itself, not the frame clock (robust at low frame rates).
const stamp = (p) => p?.event?.timeStamp ?? performance.now();

export class TouchControls {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.events = new Phaser.Events.EventEmitter();
    this.edge = 0;
    this.edgeHeld = false;
    this.brace = null;
    this.pending = [];
    this.hipSnap = false;
    this.headDown = true;
    this.lastBraceRelease = -1;
    this.tracks = new Map();
    this.hipsPointer = null;
    this.enabled = true;
    this.height = opts.height ?? 200;
    this.build();
    this.keys();
    scene.events.on('relayout', () => this.layoutGraphics());
  }

  zones() {
    const W = layout.W, H = layout.H, b = layout.safe.bottom, h = this.height;
    const top = H - b - h;
    const hipsH = 46;
    const zh = h - hipsH - 10;
    return {
      left: { x: 8, y: top, w: W / 2 - 12, h: zh },
      right: { x: W / 2 + 4, y: top, w: W / 2 - 12, h: zh },
      hips: { x: 8, y: top + zh + 8, w: W - 16, h: hipsH },
    };
  }

  build() {
    const s = this.scene;
    this.g = s.add.graphics().setScrollFactor(0).setDepth(40);
    this.knob = s.add.graphics().setScrollFactor(0).setDepth(41);
    this.fx = s.add.graphics().setScrollFactor(0).setDepth(42);
    this.labels = [
      s.add.text(0, 0, 'LEFT BLADE', textStyle(9.5, { color: CSS.mist, tracking: 1.2 })).setScrollFactor(0).setDepth(41).setOrigin(0.5),
      s.add.text(0, 0, 'HIPS', textStyle(9.5, { color: CSS.mist, tracking: 1.2 })).setScrollFactor(0).setDepth(41).setOrigin(0.5),
      s.add.text(0, 0, 'RIGHT BLADE', textStyle(9.5, { color: CSS.mist, tracking: 1.2 })).setScrollFactor(0).setDepth(41).setOrigin(0.5),
    ];
    this.feedback = s.add.text(0, 0, '', textStyle(13, { color: CSS.sun, weight: '600' })).setScrollFactor(0).setDepth(43).setOrigin(0.5).setAlpha(0);
    this.layoutGraphics();

    s.input.on('pointerdown', (p) => this.down(p));
    s.input.on('pointermove', (p) => this.move(p));
    s.input.on('pointerup', (p) => this.up(p));
    s.input.on('pointerupoutside', (p) => this.up(p));
  }

  layoutGraphics() {
    const z = this.zones();
    const g = this.g;
    g.clear();
    for (const k of ['left', 'right']) {
      const r = z[k];
      g.fillStyle(COLOR.ink, 0.28);
      g.fillRoundedRect(px(r.x), px(r.y), px(r.w), px(r.h), px(22));
      g.lineStyle(px(1), 0xffffff, 0.1);
      g.strokeRoundedRect(px(r.x), px(r.y), px(r.w), px(r.h), px(22));
      // Feet (reach) at the top, hip line near the bottom.
      g.lineStyle(px(1), COLOR.sun, 0.35);
      const hy = r.y + r.h * HIP_LINE;
      g.lineBetween(px(r.x + 14), px(hy), px(r.x + r.w - 14), px(hy));
      g.fillStyle(0xffffff, 0.12);
      for (let i = 0; i < 3; i++) g.fillTriangle(px(r.x + r.w / 2 - 6), px(r.y + 24 + i * 30), px(r.x + r.w / 2 + 6), px(r.y + 24 + i * 30), px(r.x + r.w / 2), px(r.y + 32 + i * 30));
    }
    const h = z.hips;
    g.fillStyle(COLOR.ink, 0.35);
    g.fillRoundedRect(px(h.x), px(h.y), px(h.w), px(h.h), px(h.h / 2));
    g.lineStyle(px(1), 0xffffff, 0.12);
    g.strokeRoundedRect(px(h.x), px(h.y), px(h.w), px(h.h), px(h.h / 2));
    g.lineStyle(px(1), 0xffffff, 0.25);
    g.lineBetween(px(h.x + h.w / 2), px(h.y + 8), px(h.x + h.w / 2), px(h.y + h.h - 8));
    this.labels[0].setPosition(px(z.left.x + z.left.w / 2), px(z.left.y + z.left.h - 11));
    this.labels[1].setPosition(px(h.x + 40), px(h.y + h.h / 2));
    this.labels[2].setPosition(px(z.right.x + z.right.w / 2), px(z.right.y + z.right.h - 11));
    this.drawKnob();
  }

  drawKnob() {
    const h = this.zones().hips;
    const x = h.x + h.w / 2 + (this.edge * (h.w / 2 - h.h / 2));
    this.knob.clear();
    this.knob.fillStyle(COLOR.foam, this.edgeHeld ? 0.95 : 0.7);
    this.knob.fillCircle(px(x), px(h.y + h.h / 2), px(h.h / 2 - 6));
    // Tilt marks: which knee is up.
    if (Math.abs(this.edge) > 0.1) {
      this.knob.fillStyle(COLOR.sun, 0.5 * Math.abs(this.edge));
      const cx = h.x + h.w / 2;
      this.knob.fillRoundedRect(px(Math.min(cx, x)), px(h.y + h.h / 2 - 3), px(Math.abs(x - cx)), px(6), px(3));
    }
  }

  which(p) {
    const z = this.zones();
    const x = p.x / layout.S, y = p.y / layout.S;
    for (const k of ['left', 'hips', 'right']) {
      const r = z[k];
      const pad = k === 'hips' ? 6 : 0;
      if (x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad) return k;
    }
    return null;
  }

  down(p) {
    if (!this.enabled) return;
    const k = this.which(p);
    if (!k) return;
    this.events.emit('touch');
    const now = stamp(p);
    if (k === 'hips') {
      this.hipsPointer = { id: p.id, lastX: p.x, lastT: now, v: 0 };
      this.edgeHeld = true;
      this.setEdgeFrom(p.x);
      return;
    }
    this.tracks.set(p.id, { zone: k, pts: [{ x: p.x / layout.S, y: p.y / layout.S, t: now }], start: now, braced: false });
  }

  move(p) {
    if (!this.enabled) return;
    const now = stamp(p);
    if (this.hipsPointer && this.hipsPointer.id === p.id) {
      const dt = Math.max(1, now - this.hipsPointer.lastT);
      const h = this.zones().hips;
      const v = ((p.x - this.hipsPointer.lastX) / layout.S) / (h.w / 2) / (dt / 1000); // strip half-widths per second
      this.hipsPointer.v = v;
      this.hipsPointer.lastX = p.x; this.hipsPointer.lastT = now;
      const before = this.edge;
      this.setEdgeFrom(p.x);
      // A fast move back toward centre (or through it) is the hip snap.
      if (Math.abs(v) > 5 && Math.sign(v) === -Math.sign(before || v)) this.snap();
      return;
    }
    const tr = this.tracks.get(p.id);
    if (!tr) return;
    tr.pts.push({ x: p.x / layout.S, y: p.y / layout.S, t: now });
    if (tr.braced) {
      const a = tr.pts[0], b = tr.pts.at(-1);
      if (Math.hypot(b.x - a.x, b.y - a.y) > 24) { tr.braced = false; this.brace = null; }
    }
  }

  up(p) {
    if (this.hipsPointer && this.hipsPointer.id === p.id) {
      this.hipsPointer = null;
      this.edgeHeld = false;
      return;
    }
    const tr = this.tracks.get(p.id);
    if (!tr) return;
    this.tracks.delete(p.id);
    if (tr.braced) {
      this.brace = null;
      this.lastBraceRelease = stamp(p);
      return;
    }
    const st = this.evaluate(tr);
    if (st) {
      this.pending.push(st);
      this.last = { ...st, n: tr.pts.length, dur: tr.pts.at(-1).t - tr.pts[0].t };
      this.events.emit('stroke', st);
      this.flash(st);
    }
  }

  setEdgeFrom(x) {
    const h = this.zones().hips;
    const rel = (x / layout.S - (h.x + h.w / 2)) / (h.w / 2 - h.h / 2);
    this.edge = Phaser.Math.Clamp(rel, -1, 1);
    this.drawKnob();
  }

  snap() {
    // The head stays down only if the blade is still braced when the hips snap.
    this.hipSnap = true;
    this.headDown = !!this.brace;
    this.events.emit('snap', this.headDown);
  }

  /** Turn a finished touch into a stroke. */
  evaluate(tr) {
    const z = this.zones()[tr.zone];
    const a = tr.pts[0], b = tr.pts.at(-1);
    const dx = b.x - a.x, dy = b.y - a.y;
    const dur = Math.max(1, b.t - a.t);
    const side = tr.zone;
    const outward = side === 'left' ? -dx : dx;
    if (Math.abs(dx) > z.w * 0.3 && Math.abs(dx) > Math.abs(dy) * 0.8) {
      return { side, kind: outward > 0 ? 'sweep' : 'reverse', reach: 0.9, smoothness: 0.9, exitAtHip: true };
    }
    if (dy < -z.h * 0.25) return { side, kind: 'reverse', reach: 0.5, smoothness: 0.8, exitAtHip: true };
    if (dy < z.h * 0.2) return null;
    const reach = Phaser.Math.Clamp(1 - ((a.y - z.y) / z.h - 0.08) * 2.2, 0, 1);
    const hipY = z.y + z.h * HIP_LINE;
    const exitAtHip = Math.abs(b.y - hipY) < z.h * 0.13;
    // Smoothness: a steady pull that keeps moving toward the hip in a clean line, and not a jab.
    let path = 0, forward = 0;
    for (let i = 1; i < tr.pts.length; i++) {
      const p0 = tr.pts[i - 1], p1 = tr.pts[i];
      const seg = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      path += seg;
      if (p1.y - p0.y >= -0.5) forward += seg;
    }
    const straight = path > 0 ? Math.hypot(dx, dy) / path : 1;
    const monotone = path > 0 ? forward / path : 1;
    let smooth = Phaser.Math.Clamp((straight - 0.6) / 0.35, 0, 1) * 0.5 + monotone * 0.5;
    smooth = Math.min(smooth, Phaser.Math.Clamp((dur - 80) / 220, 0.15, 1));
    return { side, kind: 'forward', reach, smoothness: smooth, exitAtHip };
  }

  flash(st) {
    const z = this.zones()[st.side];
    const q = rotationQuality(st);
    const label = st.kind !== 'forward' ? (st.kind === 'sweep' ? 'Sweep' : 'Reverse') : q >= 0.7 ? 'Rotation' : st.reach < 0.4 ? 'Reach further' : !st.exitAtHip ? 'Exit at the hip' : 'Arms — rotate';
    this.feedback.setText(label).setColor(st.kind !== 'forward' || q >= 0.7 ? CSS.good : CSS.sun);
    this.feedback.setPosition(px(z.x + z.w / 2), px(z.y - 14)).setAlpha(1);
    this.scene.tweens.killTweensOf(this.feedback);
    this.scene.tweens.add({ targets: this.feedback, alpha: 0, delay: 500, duration: 500 });
    const f = this.fx;
    f.clear();
    f.fillStyle(st.kind === 'forward' && q < 0.7 ? COLOR.sun : COLOR.good, 0.18);
    f.fillRoundedRect(px(z.x), px(z.y), px(z.w), px(z.h), px(22));
    this.scene.tweens.addCounter({ from: 1, to: 0, duration: 380, onUpdate: (tw) => f.setAlpha(tw.getValue()) });
  }

  /** Called each frame: detect held braces. */
  update() {
    const now = performance.now();
    for (const tr of this.tracks.values()) {
      if (tr.braced) continue;
      const a = tr.pts[0], b = tr.pts.at(-1);
      if (now - tr.start > 140 && Math.hypot(b.x - a.x, b.y - a.y) < 14) {
        tr.braced = true;
        this.brace = { side: tr.zone };
        this.events.emit('brace', tr.zone);
      }
    }
    if (!this.edgeHeld && this.edge !== 0) {
      this.edge *= 0.86;
      if (Math.abs(this.edge) < 0.02) this.edge = 0;
      this.drawKnob();
    }
  }

  /** The PaddlerInput for this tick; one-shot events are consumed. */
  poll() {
    const inp = emptyInput();
    inp.edge = this.edge;
    inp.brace = this.brace;
    inp.hipSnap = this.hipSnap;
    inp.headDown = this.headDown;
    inp.strokes = this.pending;
    this.pending = [];
    this.hipSnap = false;
    this.headDown = true;
    return inp;
  }

  setVisible(v) {
    for (const o of [this.g, this.knob, this.fx, ...this.labels]) o.setVisible(v);
    this.enabled = v;
  }

  keys() {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    const good = (side, kind = 'forward') => ({ side, kind, reach: 0.9, smoothness: 0.9, exitAtHip: true });
    kb.on('keydown-A', () => { const s = good('left'); this.pending.push(s); this.flash(s); });
    kb.on('keydown-D', () => { const s = good('right'); this.pending.push(s); this.flash(s); });
    kb.on('keydown-Z', () => { const s = good('left', 'sweep'); this.pending.push(s); this.flash(s); });
    kb.on('keydown-C', () => { const s = good('right', 'sweep'); this.pending.push(s); this.flash(s); });
    kb.on('keydown-Q', () => { this.edge = -1; this.edgeHeld = true; this.drawKnob(); });
    kb.on('keyup-Q', () => { this.edgeHeld = false; });
    kb.on('keydown-E', () => { this.edge = 1; this.edgeHeld = true; this.drawKnob(); });
    kb.on('keyup-E', () => { this.edgeHeld = false; });
    kb.on('keydown-J', () => { this.brace = { side: 'left' }; this.events.emit('brace', 'left'); });
    kb.on('keyup-J', () => { this.brace = null; });
    kb.on('keydown-L', () => { this.brace = { side: 'right' }; this.events.emit('brace', 'right'); });
    kb.on('keyup-L', () => { this.brace = null; });
    kb.on('keydown-K', () => this.snap());
  }
}
