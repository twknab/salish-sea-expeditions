// First launch: the land acknowledgment frames the whole game (Principle III), then the safety
// note (Principle IV). Both stay reachable from About.
import Phaser from 'phaser';
import { text, button, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { CSS, layout } from '../ui/theme.js';
import { ACKNOWLEDGMENT, SAFETY_NOTE } from '../content/acknowledgment.js';
import { state, persist, go } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class Acknowledgment extends Phaser.Scene {
  constructor() { super('Acknowledgment'); }

  create() {
    fadeIn(this);
    backdrop(this, { lat: 48.60, lon: -123.04, minute: 360, dim: 0.62, viewW: 2600, fog: 0.5 });
    this.page(ACKNOWLEDGMENT, () => this.page(SAFETY_NOTE, () => {
      state.save.seenIntro = true;
      persist();
      go(this, 'StartChoice');
    }, 'I understand'));
    sound.ambience({ sea: 0.3, wind: 0.15 });
  }

  page(content, next, label = 'Continue') {
    this.group?.forEach((o) => o.destroy());
    const W = layout.W;
    let y = layout.safe.top + layout.H * 0.14;
    const objs = [];
    objs.push(text(this, W / 2, y, content.title, 28, { serif: true, weight: '600', origin: [0.5, 0], align: 'center', wrap: W - 60 }));
    y += 64;
    for (const p of content.paragraphs) {
      const t = text(this, W / 2, y, p, 17, { serif: true, origin: [0.5, 0], align: 'center', wrap: W - 64, lineSpacing: 7, color: CSS.foam });
      objs.push(t);
      y += t.height / layout.S + 18;
    }
    if (content.note) objs.push(text(this, W / 2, y + 4, content.note, 11, { color: CSS.mist, origin: [0.5, 0], align: 'center', wrap: W - 80 }));
    objs.push(button(this, W / 2, layout.H - layout.safe.bottom - 70, label, () => { sound.unlock(); next(); }));
    objs.forEach((o, i) => { o.setDepth(10); o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, delay: 250 + i * 260, duration: 700 }); });
    this.group = objs;
  }
}
