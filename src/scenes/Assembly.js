// Assemble the folding kayak on the beach (US4, FR-006). Ordered steps, a gesture each; the
// heritage lesson plays while the frame goes together. Rushing a tension step costs tracking.
import Phaser from 'phaser';
import { text, button, lessonCard, meter, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { GesturePad } from '../ui/gesture.js';
import { loadArt } from '../render/art.js';
import { SKINS, DEFAULT_SKIN, hex } from '../content/skins.js';
import { focusRing } from '../ui/focus.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { ASSEMBLY_STEPS, assemblyQuality } from '../sim/assembly.js';
import { lessonById } from '../content/lessons.js';
import { trip, lesson, go, state, persist } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class Assembly extends Phaser.Scene {
  constructor() { super('Assembly'); }

  create() {
    fadeIn(this);
    backdrop(this, { lat: 48.5392, lon: -123.0185, viewW: 420, minute: 500, dim: 0.55, drift: 0.5 });
    const W = layout.W, top = layout.safe.top;
    text(this, W / 2, top + 18, 'ON THE BEACH', 11, { tracking: 3, color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    text(this, W / 2, top + 38, 'Assemble your kayak', 26, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    this.stepText = text(this, W / 2, top + 80, '', 15, { origin: [0.5, 0], align: 'center', wrap: W - 50, color: CSS.sun }).setDepth(10);
    this.boatY = top + 200;
    this.progress = meter(this, 40, top + 130, W - 80, 5, COLOR.sun).setDepth(10);
    this.progress.set(0);
    this.results = {};
    this.rush = button(this, W / 2, layout.H - layout.safe.bottom - 42, 'Rush this step', () => this.skip(), { primary: false, w: 180, h: 40, size: 14 }).setDepth(20);
    this.i = 0;
    this.rush.setVisible(false);
    this.chooseSkin();
  }

  // Choose the skin before the frame goes in. Colourways inspired by the real ones; every skin is
  // white below the waterline so an upturned boat is easy to spot.
  chooseSkin() {
    const W = layout.W, top = layout.safe.top;
    this.stepText.setText('Choose your skin');
    const layer = [];
    const note = text(this, W / 2, top + 146, 'Every skin is white below the waterline — easy to spot if the boat is upside down.', 12, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: W - 50 }).setDepth(10);
    layer.push(note);
    const cols = 3, cw = (W - 24) / cols, y0 = top + 290;
    SKINS.forEach((sk, i) => {
      const cx = 12 + cw * (i % cols) + cw / 2, cy = y0 + Math.floor(i / cols) * 104;
      const g = this.add.graphics().setDepth(10);
      // A little hull cross-section: deck colour over the white bottom, with the accent stripe.
      g.fillStyle(0xf4f3ee, 1); g.fillEllipse(px(cx), px(cy + 6), px(88), px(40));
      g.fillStyle(hex(sk.deck), 1); g.fillEllipse(px(cx), px(cy - 4), px(88), px(34));
      g.fillStyle(hex(sk.deckHi), 0.9); g.fillEllipse(px(cx - 6), px(cy - 12), px(56), px(10));
      g.lineStyle(px(3), hex(sk.accent), 1); g.lineBetween(px(cx - 42), px(cy + 6), px(cx + 42), px(cy + 6));
      const t = text(this, cx, cy + 34, sk.name, 12, { weight: '600', origin: [0.5, 0] }).setDepth(10);
      const pick = () => { state.save.skin = sk.id; persist(); sound.success(); layer.forEach((o) => o.destroy()); this.startAssembly(); };
      const zone = this.add.zone(px(cx - cw / 2), px(cy - 30), px(cw), px(84)).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(11);
      zone.on('pointerup', pick);
      focusRing(this).add({ alive: () => zone.active, bounds: () => ({ x: cx - cw / 2 + 6, y: cy - 30, w: cw - 12, h: 84 }), activate: pick });
      layer.push(g, t, zone);
    });
  }

  async startAssembly() {
    this.rush.setVisible(true);
    const W = layout.W;
    this.pad = new GesturePad(this, { x: W / 2, y: layout.H - layout.safe.bottom - 190, r: 96 });
    const key = await loadArt(this, 'kayakSide', state.save.skin ?? DEFAULT_SKIN, px(W - 20));
    this.boat = this.add.image(px(W / 2), px(this.boatY), key).setDepth(10);
    this.drawBoat();
    this.next();
  }

  drawBoat() {
    const q = this.i / ASSEMBLY_STEPS.length;
    const g = this.boat;
    if (!g) return;
    // The skin fills out as the frame goes in and the jacks are tensioned.
    g.setAlpha(0.3 + 0.7 * q);
    g.setScale(0.85 + 0.15 * q, 0.45 + 0.55 * Math.min(1, q * 1.3));
  }

  async next() {
    const s = ASSEMBLY_STEPS[this.i];
    if (!s) return this.finish();
    this.stepText.setText(`${this.i + 1}. ${s.label}`);
    this.rush.setVisible(s.id.startsWith('jack') || s.id === 'check');
    if (s.id === 'insert') { lesson('kayakHeritage'); this.showCard(lessonById.kayakHeritage); }
    if (s.id === 'jackSides') { lesson('hullJacks'); this.showCard(lessonById.hullJacks); }
    this.current = s;
    const q = await this.pad.ask(s.gesture);
    if (this.current !== s) return; // skipped
    this.results[s.id] = q;
    if (q < 0.5) { sound.warn(); this.stepText.setText(`${this.i + 1}. ${s.label}\nNot quite — once more.`); return this.retry(s); }
    sound.success();
    this.advance();
  }

  async retry(s) {
    const q = await this.pad.ask(s.gesture);
    if (this.current !== s) return;
    this.results[s.id] = Math.max(this.results[s.id] ?? 0, q);
    this.advance();
  }

  skip() {
    const s = this.current;
    if (!s) return;
    this.results[s.id] = 0.25;
    this.current = null;
    this.pad.finish(0);
    this.advance();
  }

  advance() {
    this.i++;
    this.progress.set(this.i / ASSEMBLY_STEPS.length);
    this.drawBoat();
    this.time.delayedCall(250, () => this.next());
  }

  showCard(l) {
    this.card?.active && this.card.destroy();
    this.card = lessonCard(this, l, { y: layout.safe.top + 250, depth: 30, autoHide: 12000 });
  }

  finish() {
    const q = assemblyQuality(this.results);
    const t = trip();
    t.assembly = q;
    this.pad.destroy();
    this.rush.destroy();
    this.stepText.setText(q > 0.85 ? 'Skin tight, frame seated. She’ll track true.' : 'Assembled — but a slack hull will wander. You can live with it, or not.');
    this.card?.active && this.card.destroy();
    button(this, layout.W / 2, layout.H - layout.safe.bottom - 60, 'Pack the boat', () => go(this, 'Packing')).setDepth(20);
  }
}
