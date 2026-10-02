// Kayak School, on the beach (US0): the boat, the body, the paddle — then calm-water drills.
// Rule: everything fits on the screen. The boat is shown whole, then each part on its own zoomed
// screen; nothing is panned or clipped. Every control is also reachable with the keyboard.
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
    this.input.keyboard?.removeAllListeners('keydown-RIGHT');
    this.input.keyboard?.removeAllListeners('keydown-LEFT');
  }

  header(title, sub) {
    const W = layout.W, y = layout.safe.top + 18;
    this.layer.push(text(this, W / 2, y, 'KAYAK SCHOOL', 11, { tracking: 3, color: CSS.mist, origin: [0.5, 0] }).setDepth(10));
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

  // 1. The boat: shown whole, then part by part, each zoomed to fill the frame.
  async stageBoat() {
    this.clear();
    this.header('Know your boat', 'A folding sea kayak: 16 ft long, 22.5 in wide, about 22 kg. Step through it, part by part.');
    const W = layout.W, frameW = W - 24, frameH = Math.round(frameW * 0.42), fx = 12, fy = layout.safe.top + 118;
    // The frame the boat is seen through: a rounded window with the water behind it.
    const frame = this.add.graphics().setDepth(9);
    frame.fillStyle(0x0b2b33, 0.55); frame.fillRoundedRect(px(fx), px(fy), px(frameW), px(frameH), px(18));
    frame.lineStyle(px(1), 0xffffff, 0.18); frame.strokeRoundedRect(px(fx), px(fy), px(frameW), px(frameH), px(18));
    this.layer.push(frame);
    const maskG = this.make.graphics({}, false);
    maskG.fillStyle(0xffffff, 1); maskG.fillRoundedRect(px(fx + 1), px(fy + 1), px(frameW - 2), px(frameH - 2), px(17));
    const mask = maskG.createGeometryMask();
    // The side view at three times the frame width, so a zoomed part is still sharp.
    const key = await loadArt(this, 'kayakSide', this.skin, px(frameW * 3));
    const a = ART.kayakSide, baseW = frameW, baseH = (baseW * a.h) / a.w;
    const img = this.add.image(px(fx + frameW / 2), px(fy + frameH / 2), key).setDepth(10).setDisplaySize(px(baseW), px(baseH)).setMask(mask);
    this.layer.push(img);
    const dot = this.add.graphics().setDepth(12).setMask(mask);
    this.layer.push(dot);
    const vy = a.view?.[1] ?? 0;
    const anchorOf = (p) => sideAnchors[p.id] ?? [p.x * 1000, p.y * 300];
    const parts = KAYAK_PARTS;
    const counter = text(this, W / 2, fy + frameH + 10, '', 11, { color: CSS.mist, origin: [0.5, 0], tracking: 1 }).setDepth(10);
    this.layer.push(counter);
    let i = -1, zoomTween = null;
    const show = (n) => {
      i = n;
      zoomTween?.stop();
      const whole = n < 0;
      const zoom = whole ? 1 : 2.8;
      const w = baseW * zoom, h = baseH * zoom;
      let cx = fx + frameW / 2, cy = fy + frameH / 2;
      if (!whole) {
        const [ax, ay] = anchorOf(parts[n]);
        // Centre the part in the frame, but keep the picture covering the frame.
        const px0 = (ax / a.w) * w, py0 = ((ay - vy) / a.h) * h;
        cx = fx + frameW / 2 - (px0 - w / 2);
        cy = fy + frameH / 2 - (py0 - h / 2);
        cx = Math.min(fx + w / 2, Math.max(fx + frameW - w / 2, cx));
        cy = Math.min(fy + h / 2 + 4, Math.max(fy + frameH - h / 2 - 4, cy));
      }
      zoomTween = this.tweens.add({ targets: img, x: px(cx), y: px(cy), displayWidth: px(w), displayHeight: px(h), duration: 520, ease: 'Sine.easeInOut', onUpdate: drawDot, onComplete: drawDot });
      counter.setText(whole ? `${parts.length} parts · Next to begin` : `${parts[n].name.toUpperCase()}  ·  ${n + 1} of ${parts.length}`);
      if (whole) { this.card?.active && this.card.destroy(); this.card = null; } else { this.showCard(parts[n]); this.card.y = px(fy + frameH + 36); sound.unlock(); sound.ui('tap'); }
      prev.setEnabled(!whole);
      next.label.setText(n >= parts.length - 1 ? 'Next: your body' : whole ? 'Begin' : 'Next part');
    };
    const drawDot = () => {
      dot.clear();
      if (i < 0) return;
      const [ax, ay] = anchorOf(parts[i]);
      const w = img.displayWidth / layout.S, h = img.displayHeight / layout.S;
      const x = img.x / layout.S - w / 2 + (ax / a.w) * w, y = img.y / layout.S - h / 2 + ((ay - vy) / a.h) * h;
      dot.lineStyle(px(2), COLOR.sun, 0.95); dot.strokeCircle(px(x), px(y), px(16));
      dot.fillStyle(COLOR.sun, 0.9); dot.fillCircle(px(x), px(y), px(4));
    };
    const by = layout.H - layout.safe.bottom - 44;
    const prev = button(this, 70, by, 'Back', () => show(i - 1), { primary: false, w: 110, h: 44, size: 14 }).setDepth(45);
    const next = button(this, W - 120, by, 'Begin', () => {
      if (i >= parts.length - 1) { this.stageBody(); return; }
      show(i + 1);
    }, { w: 200, h: 48, size: 15 }).setDepth(45);
    this.layer.push(prev, next);
    this.input.keyboard?.on('keydown-RIGHT', () => i < parts.length - 1 && show(i + 1));
    this.input.keyboard?.on('keydown-LEFT', () => i >= 0 && show(i - 1));
    show(-1);
  }

  // 2. The body: you wear a kayak.
  async stageBody() {
    this.clear();
    lesson('wearTheBoat');
    this.header('You wear a kayak', 'Fit yourself to the boat, from the feet up. Tap each point in order.');
    const W = layout.W, width = W, cy = layout.safe.top + 260;
    const m = await import('../render3d/bake.js').catch(() => null);
    const r = m?.bakeSeated(this, px(width - 8));
    let spots;
    if (r?.key && this.sys.isActive()) {
      const w = width - 8, h = w * r.aspect;
      const img = this.add.image(px(W / 2), px(cy), r.key).setDepth(10).setDisplaySize(px(w), px(h));
      this.layer.push(img);
      const x0 = W / 2 - w / 2, y0 = cy - h / 2;
      spots = BODY_POINTS.map((b) => { const [ax, ay] = r.anchors[b.id]; return { id: b.id, item: b, x: x0 + (ax / 1000) * w, y: y0 + (ay / (1000 * r.aspect)) * h }; });
    } else {
      const map = await this.art('paddlerSide', cy, width);
      spots = BODY_POINTS.map((b) => ({ id: b.id, item: b, ...map(...BODY_SPOTS[b.id]) }));
    }
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

  // 3. The paddle: a Greenland paddle, from the 3D model.
  async stagePaddle() {
    this.clear();
    this.header('Your paddle', 'A Greenland paddle: cedar, long and narrow, unfeathered. Power comes from the torso. Tap each part.');
    const W = layout.W, width = W - 16, cy = layout.safe.top + 200;
    const m = await import('../render3d/bake.js').catch(() => null);
    const r = m?.bakePaddle(this, px(width));
    let map;
    if (r?.key && this.sys.isActive()) {
      const h = width * r.aspect;
      const img = this.add.image(px(W / 2), px(cy), r.key).setDepth(10).setDisplaySize(px(width), px(h));
      this.layer.push(img);
      const x0 = W / 2 - width / 2, y0 = cy - h / 2;
      map = (x, y) => ({ x: x0 + (x / 1000) * width, y: y0 + (y / (1000 * r.aspect)) * h });
      this.paddleAnchors = r.anchors;
    } else {
      map = await this.art('paddle', cy, width);
      this.paddleAnchors = null;
    }
    const anchors = this.paddleAnchors ?? { blade: [160, 110], loom: [500, 110], shoulder: [620, 110], tip: [980, 110] };
    // The paddler's box: hands a little wider than the shoulders, in front of the chest.
    const bx = cy + 90;
    const box = this.add.graphics().setDepth(11);
    box.lineStyle(px(1.5), COLOR.sun, 0.7);
    const bl = W / 2 - 90, br = W / 2 + 90, bt = bx, bb = bx + 70;
    for (let x = bl; x < br; x += 10) { box.lineBetween(px(x), px(bt), px(Math.min(x + 5, br)), px(bt)); box.lineBetween(px(x), px(bb), px(Math.min(x + 5, br)), px(bb)); }
    for (let y = bt; y < bb; y += 10) { box.lineBetween(px(bl), px(y), px(bl), px(Math.min(y + 5, bb))); box.lineBetween(px(br), px(y), px(br), px(Math.min(y + 5, bb))); }
    this.layer.push(box, text(this, W / 2, bt - 16, "THE PADDLER'S BOX", 9.5, { tracking: 1.2, color: CSS.sun, origin: [0.5, 0] }).setDepth(11));
    const spots = PADDLE_PARTS.map((p) => ({ id: p.id, item: p, ...(p.id === 'box' ? { x: W / 2, y: (bt + bb) / 2 } : map(...(anchors[p.id] ?? anchors.loom))) }));
    this.hotspots(spots, {
      onDone: () => {
        lesson('rotation');
        this.layer.push(button(this, W / 2, layout.H - layout.safe.bottom - 44, 'Into the calm water', () => go(this, 'Paddle', { mode: 'school' }), { w: 260 }).setDepth(45));
      },
    });
  }
}
