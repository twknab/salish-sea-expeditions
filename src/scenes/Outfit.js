// Outfitting (spec 003), once per trip after the start choice: your boat, what you wear, what you
// carry. Three pages; every tap target is also on the focus ring, and the scene can be paused.
import Phaser from 'phaser';
import { text, button, lessonCard, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { loadArt } from '../render/art.js';
import { drawKayakTop } from '../render/kayakArt.js';
import { focusRing } from '../ui/focus.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { SKINS, skinOf, hex, signature } from '../content/skins.js';
import { LAYERS, KIT, KIT_GROUPS, LEGAL } from '../content/kit.js';
import { state, persist, go, trip } from '../state.js';
import { sound } from '../audio/soundscape.js';
import { pauseButton } from '../ui/pause.js';

const PAGES = ['boat', 'wear', 'kit'];

export class Outfit extends Phaser.Scene {
  constructor() { super('Outfit'); }

  create() {
    fadeIn(this);
    backdrop(this, { lat: 48.5392, lon: -123.0185, viewW: 700, minute: 450, dim: 0.72, drift: 1 });
    this.layer = [];
    this.handles = [];
    if (!state.save.skin) { state.save.skin = SKINS[0].id; persist(); }
    this.showPage(0);
    pauseButton(this);
  }

  clear() {
    this.layer.forEach((o) => o.destroy());
    this.layer = [];
    this.handles.forEach((h) => h.remove());
    this.handles = [];
    this.card?.active && this.card.destroy();
    this.card = null;
    this.gen = (this.gen ?? 0) + 1; // stale async art loads check this
  }

  keep(o) { this.layer.push(o); return o; }

  header(kicker, title, sub) {
    const W = layout.W, top = layout.safe.top;
    this.keep(text(this, W / 2, top + 14, kicker, 12, { tracking: 4, color: CSS.fog, origin: [0.5, 0] }).setDepth(10));
    this.keep(text(this, W / 2, top + 32, title, 28, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10));
    if (sub) this.keep(text(this, W / 2, top + 72, sub, 12.5, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: W - 60 }).setDepth(10));
  }

  /** Page dots and Back / Next along the bottom. */
  nav(i, nextLabel, onNext) {
    const W = layout.W, y = layout.H - layout.safe.bottom - 34;
    const dots = this.keep(this.add.graphics().setDepth(10));
    PAGES.forEach((_, k) => { dots.fillStyle(k === i ? COLOR.sun : 0xffffff, k === i ? 1 : 0.3); dots.fillCircle(px(W / 2 - 16 + k * 16), px(y - 42), px(3.5)); });
    if (i > 0) this.keep(button(this, 70, y, 'Back', () => this.showPage(i - 1), { primary: false, w: 110, h: 44, size: 14 }).setDepth(20));
    this.nextBtn = this.keep(button(this, i > 0 ? W - 120 : W / 2, y, nextLabel, onNext, { w: i > 0 ? 200 : 240, h: 48, size: 15 }).setDepth(20));
    return this.nextBtn;
  }

  showPage(i) {
    this.clear();
    this.cameras.main.scrollY = 0;
    [() => this.pageBoat(), () => this.pageWear(), () => this.pageKit()][i]();
  }

  // ---------- 1. Your boat ----------

  pageBoat() {
    const W = layout.W, top = layout.safe.top;
    this.header('OUTFITTING', 'Your boat', 'A 16 ft folding sea kayak: an aluminium frame in a tough skin, packed into one wheeled bag about 104 cm tall.');
    const gen = this.gen;
    const sideY = top + 170, topY = top + 262;
    const deck = this.keep(this.add.graphics().setDepth(10));
    let side = null;
    const name = this.keep(text(this, W / 2, top + 312, '', 17, { serif: true, weight: '600', origin: [0.5, 0], color: CSS.sun }).setDepth(10));
    const draw = async () => {
      const sk = skinOf(state.save.skin);
      name.setText(sk.name);
      deck.setPosition(px(W / 2), px(topY)).setRotation(-Math.PI / 2);
      drawKayakTop(deck, px(Math.min(W - 40, 360)), { empty: true, skin: sk });
      const key = await loadArt(this, 'kayakSide', sk.id, px(W - 16));
      if (gen !== this.gen) return;
      if (side) side.setTexture(key); else side = this.keep(this.add.image(px(W / 2), px(sideY), key).setDepth(10));
    };
    draw();
    // Five colourways as swatches: deck and stern-panel colours, split.
    const n = SKINS.length, gap = Math.min(66, (W - 40) / n), x0 = W / 2 - (gap * (n - 1)) / 2, y = top + 380;
    const sw = this.keep(this.add.graphics().setDepth(10));
    const drawSwatches = () => {
      sw.clear();
      SKINS.forEach((sk, k) => {
        const cx = x0 + k * gap, on = sk.id === state.save.skin;
        sw.fillStyle(0xf4f4f1, 1); sw.fillCircle(px(cx), px(y), px(24));
        sw.fillStyle(hex(sk.deck), 1); sw.slice(px(cx), px(y), px(22), Math.PI * 0.75, Math.PI * 1.75, false); sw.fillPath();
        sw.fillStyle(hex(signature(sk) === sk.deck ? sk.mark : signature(sk)), 1); sw.slice(px(cx), px(y), px(22), Math.PI * 1.75, Math.PI * 2.75, false); sw.fillPath();
        sw.lineStyle(px(on ? 3 : 1), on ? COLOR.sun : 0xffffff, on ? 1 : 0.35); sw.strokeCircle(px(cx), px(y), px(on ? 28 : 24));
      });
    };
    drawSwatches();
    const pick = (sk) => { state.save.skin = sk.id; persist(); sound.unlock(); sound.ui('tap'); drawSwatches(); draw(); };
    SKINS.forEach((sk, k) => {
      const cx = x0 + k * gap;
      const z = this.keep(this.add.zone(px(cx - 28), px(y - 28), px(56), px(56)).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(11));
      z.on('pointerup', () => pick(sk));
      this.handles.push(focusRing(this).add({ alive: () => z.active, bounds: () => ({ x: cx - 28, y: y - 28, w: 56, h: 56 }), activate: () => pick(sk), onFocus: () => pick(sk) }));
    });
    this.keep(text(this, W / 2, y + 44, 'Every hull is white below a black perimeter line, so an upturned boat is easy to spot. The frame is colour-coded — blue tubes forward, red aft — so it goes together the same way every time.', 12.5, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: W - 50, lineSpacing: 3 }).setDepth(10));
    this.nav(0, 'Next: what you wear', () => this.showPage(1));
  }

  // ---------- 2. What you wear ----------

  async pageWear() {
    const W = layout.W, H = layout.H, top = layout.safe.top;
    this.header('DRESS FOR A SWIM', 'What you wear', 'The Salish Sea is 8 °C in winter and 10–12 °C in summer. Dress for the water, not the air.');
    const gen = this.gen;
    const figH = Math.min(340, H - top - 440), figW = figH / 2, cy = top + 100 + figH / 2;
    this.worn = 0;
    const imgs = [];
    const keys = await Promise.all(LAYERS.map((l) => loadArt(this, l.art, 'none', px(figW))));
    if (gen !== this.gen) return;
    keys.forEach((k, i) => imgs.push(this.keep(this.add.image(px(W / 2), px(cy), k).setDepth(10 + i).setAlpha(i === 0 ? 1 : 0))));
    // Step dots, one per layer.
    const steps = this.keep(this.add.graphics().setDepth(10));
    const drawSteps = () => {
      steps.clear();
      LAYERS.forEach((_, i) => { steps.fillStyle(i <= this.worn ? COLOR.good : 0xffffff, i <= this.worn ? 1 : 0.3); steps.fillCircle(px(W / 2 - 32 + i * 16), px(cy + figH / 2 + 12), px(4)); });
    };
    const show = (i) => {
      this.card?.active && this.card.destroy();
      const l = LAYERS[i];
      this.card = lessonCard(this, { title: `${i + 1}. ${l.name}`, text: l.text, sourceIds: l.sourceIds }, { y: cy + figH / 2 + 26, depth: 30 });
    };
    drawSteps();
    show(0);
    const next = this.nav(1, `Put on: ${LAYERS[1].name.toLowerCase()}`, () => {
      if (this.worn >= LAYERS.length - 1) { this.showPage(2); return; }
      this.worn++;
      sound.unlock(); sound.ui('tap');
      this.tweens.add({ targets: imgs[this.worn], alpha: 1, duration: 450, ease: 'Sine.easeOut' });
      imgs[this.worn].setAlpha(0.999); // visible even where tweens barely run (tests)
      drawSteps();
      show(this.worn);
      next.label.setText(this.worn < LAYERS.length - 1 ? `Put on: ${LAYERS[this.worn + 1].name.toLowerCase()}` : 'Next: what you carry');
    });
  }

  // ---------- 3. What you carry ----------

  async pageKit() {
    const W = layout.W, H = layout.H, top = layout.safe.top;
    this.header('ONE NIGHT ON JONES ISLAND', 'What you carry', 'Tap anything to see what it is for.');
    const gen = this.gen;
    const iw = Math.min(W - 24, (H - top - 250) * 0.7), ih = iw / 0.7, x0 = (W - iw) / 2, y0 = top + 96;
    const key = await loadArt(this, 'kitFlatlay', 'none', px(iw));
    if (gen !== this.gen) return;
    this.keep(this.add.image(px(W / 2), px(y0 + ih / 2), key).setDepth(10));
    // Band labels.
    const bandY = { pfd: 0.03, deck: 0.345, inside: 0.665 };
    for (const g of KIT_GROUPS) this.keep(text(this, x0 + 18, y0 + ih * bandY[g.id], g.name.toUpperCase(), 10, { tracking: 2, color: '#6b5a3a', weight: '600' }).setDepth(11));
    const seen = new Set();
    const dots = this.keep(this.add.graphics().setDepth(12));
    const drawDots = () => {
      dots.clear();
      for (const k of KIT) {
        const x = x0 + k.x * iw, y = y0 + k.y * ih + ih * 0.07;
        dots.fillStyle(seen.has(k.id) ? COLOR.good : COLOR.sun, 0.95);
        dots.fillCircle(px(x), px(y), px(4));
      }
    };
    drawDots();
    const open = (k) => {
      seen.add(k.id);
      sound.unlock(); sound.ui('tap');
      drawDots();
      this.card?.active && this.card.destroy();
      const g = KIT_GROUPS.find((q) => q.id === k.group);
      this.card = lessonCard(this, { title: k.name, text: `${k.text}\n\n${g.name}: ${g.text}`, sourceIds: k.sourceIds }, { y: k.y > 0.5 ? y0 + 8 : y0 + ih * 0.52, depth: 40, autoHide: 12000 });
    };
    for (const k of KIT) {
      const x = x0 + k.x * iw, y = y0 + k.y * ih, r = iw * 0.13;
      const z = this.keep(this.add.zone(px(x - r), px(y - r * 0.8), px(r * 2), px(r * 1.6)).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(11));
      z.on('pointerup', () => open(k));
      this.handles.push(focusRing(this).add({ alive: () => z.active, bounds: () => ({ x: x - r, y: y - r * 0.8, w: r * 2, h: r * 1.6 }), activate: () => open(k) }));
    }
    const lawY = y0 + ih + 26;
    this.keep(button(this, W / 2, lawY, 'What the law asks for', () => this.showLaw(), { primary: false, w: 240, h: 40, size: 13.5 }).setDepth(20));
    this.nav(2, trip()?.start === 'ferry' ? 'To the ferry' : 'To the beach', () => this.finish());
  }

  showLaw() {
    this.card?.active && this.card.destroy();
    const body = LEGAL.map((l) => `${l.country}: ${l.items.join('; ')}.`).join('\n\n');
    this.card = lessonCard(this, { title: 'The legal minimum — two countries', text: `${body}\n\nThis first trip stays in US waters; later ones cross into Canada, so the kit here covers both lists.`, sourceIds: [...new Set(LEGAL.flatMap((l) => l.sourceIds))] }, { y: layout.safe.top + 110, depth: 40 });
  }

  finish() {
    const t = trip();
    if (t) t.outfitted = true;
    persist();
    go(this, t?.start === 'ferry' ? 'Ferry' : 'BoatSchool');
  }
}
