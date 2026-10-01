// Boat School, on the beach (US0): the boat, the body, the paddle — then calm-water drills.
// Each stage is an illustration (src/art) with tap targets; every target is also reachable with
// the keyboard (Tab / arrows, Enter).
import Phaser from 'phaser';
import { text, button, lessonCard, meter, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { loadArt, ART, sideAnchors } from '../render/art.js';
import { focusRing } from '../ui/focus.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { KAYAK_PARTS, BODY_POINTS, PADDLE_PARTS } from '../content/anatomy.js';
import { state, lesson, go, persist } from '../state.js';
import { DEFAULT_SKIN } from '../content/skins.js';
import { award } from '../sim/skills.js';
import { sound } from '../audio/soundscape.js';
import { pauseButton } from '../ui/pause.js';

// Tap targets in each illustration's own units.
const BODY_SPOTS = { feet: [262, 378], knees: [462, 340], hips: [615, 388], back: [690, 360], head: [598, 138] };
const PADDLE_SPOTS = { blade: [80, 200], shaft: [640, 196], feather: [930, 190], box: [500, 120] };

export class BoatSchool extends Phaser.Scene {
  constructor() { super('BoatSchool'); }

  create() {
    fadeIn(this);
    backdrop(this, { lat: 48.5392, lon: -123.0185, viewW: 420, minute: 460, dim: 0.55, drift: 0.5 });
    this.layer = [];
    this.skin = state.save.skin ?? DEFAULT_SKIN;
    this.onBack = () => go(this, 'Title');
    this.stageBoat();
    pauseButton(this);
  }

  clear() {
    this.layer.forEach((o) => o.destroy());
    this.layer = [];
    this.handles?.forEach((h) => h.remove());
    this.handles = [];
    this.card?.active && this.card.destroy();
    this.input.removeAllListeners('pointerdown');
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

  /**
   * Place an illustration, centred at `cy` (points), `width` points wide. Resolves with a mapper
   * from illustration units to screen points.
   */
  async art(name, cy, width, pan = null) {
    const a = ART[name];
    const key = await loadArt(this, name, this.skin, px(width));
    const h = (width * a.h) / a.w;
    const img = this.add.image(px(layout.W / 2), px(cy), key).setDepth(10);
    this.layer.push(img);
    const vx = a.view?.[0] ?? 0, vy = a.view?.[1] ?? 0;
    const offset = () => (pan ? pan.x : 0);
    if (pan) pan.apply = () => img.setX(px(layout.W / 2 + pan.x));
    const x0 = () => layout.W / 2 - width / 2 + offset(), y0 = cy - h / 2;
    return (x, y) => ({ get x() { return x0() + ((x - vx) / a.w) * width; }, y: y0 + ((y - vy) / a.h) * h });
  }

  /**
   * Hotspots: spots = [{ id, x, y (points), item }]. `ordered` means only the next one in order
   * counts. Calls onDone once enough have been visited.
   */
  hotspots(spots, { ordered = false, need = spots.length, onVisit, onDone, onFocus }) {
    const seen = new Set();
    const dots = this.add.graphics().setDepth(12);
    this.layer.push(dots);
    let idx = 0;
    const draw = () => {
      dots.clear();
      spots.forEach((s, i) => {
        const on = seen.has(s.id);
        const current = ordered ? i === idx : !on;
        dots.fillStyle(on ? COLOR.good : current ? COLOR.sun : 0xffffff, on || current ? 0.95 : 0.35);
        dots.fillCircle(px(s.x), px(s.y), px(on ? 4 : 5.5));
        dots.lineStyle(px(1.2), 0xffffff, current ? 0.85 : 0.35);
        dots.strokeCircle(px(s.x), px(s.y), px(10));
      });
    };
    const visit = (s) => {
      if (ordered && spots[idx] !== s) return;
      onFocus?.(s);
      sound.unlock(); sound.ui('tap');
      seen.add(s.id);
      if (ordered) idx++;
      this.showCard(s.item);
      draw();
      onVisit?.(seen.size);
      if (seen.size >= need && !dots.done) { dots.done = true; onDone(); }
    };
    draw();
    this.tweens.addCounter({ from: 0, to: 1, duration: 1100, repeat: -1, yoyo: true, onUpdate: (tw) => dots.active && dots.setAlpha(0.75 + 0.25 * tw.getValue()) });
    this.input.on('pointerdown', (ptr) => {
      const x = ptr.x / layout.S, y = ptr.y / layout.S;
      let best = null, bd = 30;
      for (const s of spots) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
      if (best) visit(best);
    });
    const ring = focusRing(this);
    for (const s of spots) {
      this.handles.push(ring.add({
        alive: () => dots.active && (!ordered || spots[idx] === s),
        bounds: () => ({ x: s.x - 12, y: s.y - 12, w: 24, h: 24 }),
        activate: () => visit(s),
        onFocus: () => onFocus?.(s),
      }));
    }
    return { draw };
  }

  // 1. The boat: drawn large, and dragged side to side to see it all.
  async stageBoat() {
    this.clear();
    this.header('Know your boat', 'A folding sea kayak: 16 ft long, 22.5 in wide, about 22 kg. Tap each part; drag to see the whole boat.');
    const W = layout.W, width = W * 2.8, cy = layout.safe.top + 215;
    const maxPan = (width - W) / 2 + 8;
    const pan = { x: 0 };
    const map = await this.art('kayakSide', cy, width, pan);
    const a = ART.kayakSide;
    const spots = KAYAK_PARTS.map((p) => ({ id: p.id, item: p, pos: map(...(sideAnchors[p.id] ?? [p.x * 1000, p.y * 300])), get x() { return this.pos.x; }, get y() { return this.pos.y; } }));
    const counter = text(this, W / 2, cy + 62, `0 of ${spots.length} parts · the ghosted lines are the frame, jacks and flotation inside`, 11, { color: CSS.mist, origin: [0.5, 0], align: 'center', wrap: W - 40 }).setDepth(10);
    const hint = text(this, W / 2, cy - 60, '‹  drag  ›', 11, { color: CSS.sun, origin: [0.5, 0], tracking: 2 }).setDepth(10);
    this.layer.push(counter, hint);
    let ui;
    const setPan = (x, animate = false) => {
      const to = Math.max(-maxPan, Math.min(maxPan, x));
      if (!animate) { pan.x = to; pan.apply(); ui?.draw(); return; }
      this.tweens.add({ targets: pan, x: to, duration: 450, ease: 'Sine.easeInOut', onUpdate: () => { pan.apply(); ui?.draw(); } });
    };
    ui = this.hotspots(spots, {
      need: 5,
      onFocus: (s) => setPan(pan.x + (W / 2 - s.x), true),
      onVisit: (n) => counter.setText(`${n} of ${spots.length} parts · the ghosted lines are the frame, jacks and flotation inside`),
      onDone: () => this.layer.push(button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Next: your body', () => this.stageBody(), { w: 240 }).setDepth(45)),
    });
    // Drag to pan.
    let drag = null;
    this.input.on('pointerdown', (p) => { if (Math.abs(p.y / layout.S - cy) < 90) drag = { x: p.x, from: pan.x }; });
    this.input.on('pointermove', (p) => { if (drag && p.isDown) { setPan(drag.from + (p.x - drag.x) / layout.S); hint.setAlpha(0.3); } });
    this.input.on('pointerup', () => { drag = null; });
    this.arrowsClaimed = false;
  }

  // 2. The body: you wear a kayak.
  async stageBody() {
    this.clear();
    lesson('wearTheBoat');
    this.header('You wear a kayak', 'Fit yourself to the boat, from the feet up. Tap each point in order.');
    const W = layout.W, width = W, cy = layout.safe.top + 260;
    const map = await this.art('paddlerSide', cy, width);
    const spots = BODY_POINTS.map((b) => ({ id: b.id, item: b, ...map(...BODY_SPOTS[b.id]) }));
    const fit = meter(this, 40, cy + 146, W - 80, 7, COLOR.good).setDepth(10);
    fit.set(0);
    this.layer.push(fit, text(this, W / 2, cy + 160, 'CONNECTION TO THE BOAT', 9.5, { tracking: 1.2, color: CSS.mist, origin: [0.5, 0] }).setDepth(10));
    this.hotspots(spots, {
      ordered: true,
      onVisit: (n) => fit.set(n / spots.length),
      onDone: () => {
        state.save.fitScore = 0.95;
        award(state.save.skills, 'fit', 25);
        lesson('wearTheBoat', 'demonstrated');
        persist();
        this.layer.push(button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Next: the paddle', () => this.stagePaddle(), { w: 240 }).setDepth(45));
      },
    });
  }

  // 3. The paddle.
  async stagePaddle() {
    this.clear();
    this.header('Your paddle', 'Power comes from the torso, not the arms. Tap each part.');
    const W = layout.W, width = W - 12, cy = layout.safe.top + 200;
    const map = await this.art('paddle', cy, width);
    // The paddler's box: hands a little wider than the shoulders, in front of the chest.
    const tl = map(300, 60), br = map(700, 300);
    const box = this.add.graphics().setDepth(11);
    box.lineStyle(px(1.5), COLOR.sun, 0.7);
    for (let x = tl.x; x < br.x; x += 10) { box.lineBetween(px(x), px(tl.y), px(Math.min(x + 5, br.x)), px(tl.y)); box.lineBetween(px(x), px(br.y), px(Math.min(x + 5, br.x)), px(br.y)); }
    for (let y = tl.y; y < br.y; y += 10) { box.lineBetween(px(tl.x), px(y), px(tl.x), px(Math.min(y + 5, br.y))); box.lineBetween(px(br.x), px(y), px(br.x), px(Math.min(y + 5, br.y))); }
    this.layer.push(box, text(this, (tl.x + br.x) / 2, tl.y - 16, "THE PADDLER'S BOX", 9.5, { tracking: 1.2, color: CSS.sun, origin: [0.5, 0] }).setDepth(11));
    const spots = PADDLE_PARTS.map((p) => ({ id: p.id, item: p, ...map(...PADDLE_SPOTS[p.id]) }));
    this.hotspots(spots, {
      onDone: () => {
        lesson('rotation');
        this.layer.push(button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Into the calm water', () => go(this, 'Paddle', { mode: 'school' }), { w: 260 }).setDepth(45));
      },
    });
  }
}
