// Credits (Principle VIII, FR-022): every source, its licence and what it was used for.
import Phaser from 'phaser';
import { text, button, fadeIn } from '../ui/widgets.js';
import { backdrop, scrollable } from '../ui/backdrop.js';
import { CSS, layout } from '../ui/theme.js';
import { CREDITS } from '../content/credits.js';
import { go } from '../state.js';

export class Credits extends Phaser.Scene {
  constructor() { super('Credits'); }

  create() {
    fadeIn(this);
    backdrop(this, { minute: 1200, dim: 0.82 }).world.shader.setScrollFactor(0);
    const W = layout.W;
    let y = layout.safe.top + 18;
    text(this, W / 2, y, 'Credits & sources', 26, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    y += 44;
    text(this, 20, y, 'Items marked ◇ are pending verification against the source before public release.', 11.5, { color: CSS.mist, wrap: W - 40 }).setDepth(10);
    y += 40;
    for (const c of CREDITS) {
      const t1 = text(this, 20, y, `${c.verify ? '◇ ' : ''}${c.title}`, 13.5, { weight: '600', wrap: W - 40 }).setDepth(10);
      y += t1.height / layout.S + 2;
      const t2 = text(this, 20, y, `${c.author} · ${c.licence}`, 11.5, { color: CSS.sun, wrap: W - 40 }).setDepth(10);
      y += t2.height / layout.S + 2;
      const t3 = text(this, 20, y, `${c.usedFor}${c.url ? `\n${c.url}` : ''}`, 11.5, { color: CSS.fog, wrap: W - 40 }).setDepth(10);
      y += t3.height / layout.S + 16;
    }
    button(this, W / 2, y + 20, 'Back', () => go(this, 'About'), { primary: false }).setDepth(10);
    scrollable(this, y + 80);
  }
}
