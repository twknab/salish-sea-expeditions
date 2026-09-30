// Assemble the folding kayak on the beach (US4, FR-006). Ordered steps, a gesture each; the
// heritage lesson plays while the frame goes together. Rushing a tension step costs tracking.
import Phaser from 'phaser';
import { text, button, lessonCard, meter, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { GesturePad } from '../ui/gesture.js';
import { drawKayakSide } from '../render/kayakArt.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { ASSEMBLY_STEPS, assemblyQuality } from '../sim/assembly.js';
import { lessonById } from '../content/lessons.js';
import { trip, lesson, go } from '../state.js';
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
    this.boat = this.add.graphics().setDepth(10).setPosition(px(W / 2), px(top + 190));
    this.progress = meter(this, 40, top + 130, W - 80, 5, COLOR.sun).setDepth(10);
    this.progress.set(0);
    this.pad = new GesturePad(this, { x: W / 2, y: layout.H - layout.safe.bottom - 190, r: 96 });
    this.results = {};
    this.rush = button(this, W / 2, layout.H - layout.safe.bottom - 42, 'Rush this step', () => this.skip(), { primary: false, w: 180, h: 40, size: 14 }).setDepth(20);
    this.i = 0;
    this.drawBoat();
    this.next();
  }

  drawBoat() {
    const q = this.i / ASSEMBLY_STEPS.length;
    const g = this.boat;
    g.setAlpha(0.25 + 0.75 * q);
    drawKayakSide(g, px(layout.W - 50) * (0.7 + 0.3 * Math.min(1, q * 1.5)));
    g.setScale(1, 0.4 + 0.6 * Math.min(1, q * 1.3));
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
