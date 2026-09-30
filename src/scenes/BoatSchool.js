// Boat School, on the beach (US0): the boat, the body, the paddle — then calm-water drills.
import Phaser from 'phaser';
import { text, button, glass, lessonCard, meter, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { drawKayakSide } from '../render/kayakArt.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { KAYAK_PARTS, BODY_POINTS, PADDLE_PARTS } from '../content/anatomy.js';
import { lessonById } from '../content/lessons.js';
import { state, lesson, go, persist } from '../state.js';
import { award } from '../sim/skills.js';
import { sound } from '../audio/soundscape.js';

export class BoatSchool extends Phaser.Scene {
  constructor() { super('BoatSchool'); }

  create() {
    fadeIn(this);
    backdrop(this, { lat: 48.5392, lon: -123.0185, viewW: 420, minute: 460, dim: 0.5, drift: 0.5 });
    this.layer = [];
    this.stageBoat();
  }

  clear() {
    this.layer.forEach((o) => o.destroy());
    this.layer = [];
    this.card?.active && this.card.destroy();
  }

  header(title, sub) {
    const W = layout.W, y = layout.safe.top + 18;
    this.layer.push(text(this, W / 2, y, 'BOAT SCHOOL', 11, { tracking: 3, color: CSS.mist, origin: [0.5, 0] }).setDepth(10));
    this.layer.push(text(this, W / 2, y + 20, title, 26, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10));
    this.layer.push(text(this, W / 2, y + 58, sub, 13.5, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: W - 50 }).setDepth(10));
  }

  showCard(item) {
    this.card?.active && this.card.destroy();
    const c = lessonCard(this, { title: item.name ?? item.title, text: item.text, sourceIds: item.sourceIds }, { y: 0, depth: 40 });
    c.y = px(layout.H - layout.safe.bottom - c.height - 86);
    this.card = c;
  }

  // 1. The boat.
  stageBoat() {
    this.clear();
    this.header('Know your boat', 'A folding sea kayak: 16 ft, 22.5 in wide, about 22 kg. Tap each part.');
    const W = layout.W;
    const bw = W - 36, cx = W / 2, cy = layout.H * 0.36;
    const g = this.add.graphics().setDepth(10).setPosition(px(cx), px(cy));
    const { H } = drawKayakSide(g, px(bw));
    this.layer.push(g);
    const seen = new Set();
    const dots = this.add.graphics().setDepth(12);
    this.layer.push(dots);
    const spots = KAYAK_PARTS.map((p) => ({ p, x: cx + (p.x - 0.5) * bw, y: cy + ((p.y - 0.5) * 2.4 * H) / layout.S }));
    const draw = () => {
      dots.clear();
      for (const s of spots) {
        const on = seen.has(s.p.id);
        dots.fillStyle(on ? COLOR.good : COLOR.sun, 0.95);
        dots.fillCircle(px(s.x), px(s.y), px(on ? 3.5 : 5));
        dots.lineStyle(px(1), 0xffffff, 0.7);
        dots.strokeCircle(px(s.x), px(s.y), px(8));
      }
    };
    draw();
    this.tweens.addCounter({ from: 0, to: 1, duration: 1200, repeat: -1, yoyo: true, onUpdate: (tw) => dots.setAlpha(0.75 + 0.25 * tw.getValue()) });
    const counter = text(this, W / 2, cy + 70, `0 of ${spots.length} parts`, 12, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    this.layer.push(counter);
    const onTap = (ptr) => {
      const x = ptr.x / layout.S, y = ptr.y / layout.S;
      let best = null, bd = 26;
      for (const s of spots) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
      if (!best) return;
      sound.unlock(); sound.ui('tap');
      seen.add(best.p.id);
      draw();
      counter.setText(`${seen.size} of ${spots.length} parts`);
      this.showCard(best.p);
      if (seen.size >= 5 && !this.nextBtn) {
        this.nextBtn = button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Next: your body', () => { this.input.off('pointerdown', onTap); this.nextBtn = null; this.stageBody(); }, { w: 240 }).setDepth(45);
        this.layer.push(this.nextBtn);
      }
    };
    this.input.on('pointerdown', onTap);
  }

  // 2. The body: you wear a kayak.
  stageBody() {
    this.clear();
    lesson('wearTheBoat');
    this.header('You wear a kayak', 'Fit yourself to the boat, from the feet up. Tap each point in order.');
    const W = layout.W, cx = W / 2, cy = layout.H * 0.37;
    const g = this.add.graphics().setDepth(10);
    this.layer.push(g);
    // Side view of a paddler in the cockpit (legs forward, knees up into the thigh braces).
    const s = 1.15;
    const P = (x, y) => ({ x: px(cx + x * s), y: px(cy + y * s) });
    g.fillStyle(0xb8402c, 1);
    g.fillRoundedRect(P(-150, 20).x, P(-150, 20).y, px(300 * s), px(30 * s), px(14));
    g.fillStyle(0x16181a, 1);
    g.fillRect(P(-40, 14).x, P(-40, 14).y, px(110 * s), px(8 * s));
    // Legs: hip → knee (up into brace) → foot on peg.
    g.lineStyle(px(12), 0x3a4a52, 1);
    g.lineBetween(P(40, 8).x, P(40, 8).y, P(-20, -10).x, P(-20, -10).y);
    g.lineBetween(P(-20, -10).x, P(-20, -10).y, P(-85, 14).x, P(-85, 14).y);
    // Torso, head, backband.
    g.fillStyle(0xf2b441, 1);
    g.fillRoundedRect(P(30, -78).x, P(30, -78).y, px(32 * s), px(88 * s), px(10));
    g.fillStyle(0xd9c9a3, 1);
    g.fillCircle(P(46, -96).x, P(46, -96).y, px(15 * s));
    g.lineStyle(px(5), 0x16181a, 1);
    g.lineBetween(P(66, -22).x, P(66, -22).y, P(66, 10).x, P(66, 10).y);
    // Thigh brace and foot peg.
    g.lineStyle(px(5), 0x16181a, 1);
    g.lineBetween(P(-40, -20).x, P(-40, -20).y, P(-5, -20).x, P(-5, -20).y);
    g.lineBetween(P(-92, 4).x, P(-92, 4).y, P(-92, 22).x, P(-92, 22).y);
    const pts = { feet: [-88, 10], knees: [-20, -14], hips: [42, 6], back: [66, -8], head: [46, -96] };
    const order = BODY_POINTS.map((b) => b.id);
    let idx = 0;
    const dots = this.add.graphics().setDepth(12);
    this.layer.push(dots);
    const fit = meter(this, 40, cy + 90, W - 80, 7, COLOR.good).setDepth(10);
    fit.set(0);
    this.layer.push(fit, text(this, W / 2, cy + 104, 'CONNECTION TO THE BOAT', 9.5, { tracking: 1.2, color: CSS.mist, origin: [0.5, 0] }).setDepth(10));
    const draw = () => {
      dots.clear();
      order.forEach((id, i) => {
        const [x, y] = pts[id];
        const p = P(x, y);
        dots.fillStyle(i < idx ? COLOR.good : i === idx ? COLOR.sun : 0xffffff, i <= idx ? 0.95 : 0.35);
        dots.fillCircle(p.x, p.y, px(i === idx ? 9 : 6));
      });
    };
    draw();
    const onTap = (ptr) => {
      if (idx >= order.length) return;
      const [x, y] = pts[order[idx]];
      const p = P(x, y);
      if (Math.hypot(p.x - ptr.x, p.y - ptr.y) > px(34)) return;
      sound.ui('tap');
      this.showCard(BODY_POINTS[idx]);
      idx++;
      fit.set(idx / order.length);
      draw();
      if (idx === order.length) {
        state.save.fitScore = 0.95;
        award(state.save.skills, 'fit', 25);
        lesson('wearTheBoat', 'demonstrated');
        persist();
        this.input.off('pointerdown', onTap);
        this.layer.push(button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Next: the paddle', () => this.stagePaddle(), { w: 240 }).setDepth(45));
      }
    };
    this.input.on('pointerdown', onTap);
  }

  // 3. The paddle.
  stagePaddle() {
    this.clear();
    this.header('Your paddle', 'Power comes from the torso, not the arms. Tap each part.');
    const W = layout.W, cx = W / 2, cy = layout.H * 0.34;
    const g = this.add.graphics().setDepth(10);
    this.layer.push(g);
    const half = (W - 60) / 2;
    g.lineStyle(px(6), 0x2b2b2b, 1);
    g.lineBetween(px(cx - half + 30), px(cy), px(cx + half - 30), px(cy));
    g.fillStyle(0xe8e3d4, 1);
    g.fillEllipse(px(cx - half + 20), px(cy), px(46), px(26));
    // The feathered blade, seen edge-on-ish.
    g.fillEllipse(px(cx + half - 20), px(cy), px(46), px(9));
    // Hands in the paddler's box.
    g.fillStyle(0xd9c9a3, 1);
    g.fillCircle(px(cx - 58), px(cy), px(9));
    g.fillCircle(px(cx + 58), px(cy), px(9));
    g.lineStyle(px(1.5), COLOR.sun, 0.6);
    g.strokeRect(px(cx - 70), px(cy - 50), px(140), px(90));
    const spots = { blade: [cx - half + 20, cy], shaft: [cx + 58, cy], feather: [cx + half - 20, cy], box: [cx, cy - 50] };
    const seen = new Set();
    const dots = this.add.graphics().setDepth(12);
    this.layer.push(dots);
    const draw = () => {
      dots.clear();
      for (const [id, [x, y]] of Object.entries(spots)) {
        dots.fillStyle(seen.has(id) ? COLOR.good : COLOR.sun, 0.95);
        dots.fillCircle(px(x), px(y - 22), px(6));
      }
    };
    draw();
    const onTap = (ptr) => {
      for (const [id, [x, y]] of Object.entries(spots)) {
        if (Math.hypot(px(x) - ptr.x, px(y - 22) - ptr.y) < px(30) || Math.hypot(px(x) - ptr.x, px(y) - ptr.y) < px(26)) {
          sound.ui('tap');
          seen.add(id); draw();
          this.showCard(PADDLE_PARTS.find((p) => p.id === id));
        }
      }
      if (seen.size === 4 && !this.done) {
        this.done = true;
        lesson('rotation');
        this.input.off('pointerdown', onTap);
        this.layer.push(button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Into the calm water', () => go(this, 'Paddle', { mode: 'school' }), { w: 260 }).setDepth(45));
      }
    };
    this.input.on('pointerdown', onTap);
  }
}
