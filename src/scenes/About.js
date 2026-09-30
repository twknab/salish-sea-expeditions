// About: the acknowledgment and safety note (always reachable), settings, credits.
import Phaser from 'phaser';
import { focusRing } from '../ui/focus.js';
import { text, button, meter, fadeIn } from '../ui/widgets.js';
import { backdrop, scrollable } from '../ui/backdrop.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { ACKNOWLEDGMENT, SAFETY_NOTE } from '../content/acknowledgment.js';
import { CHART_APPROXIMATE } from '../content/chart.js';
import { state, persist, go } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class About extends Phaser.Scene {
  constructor() { super('About'); }

  create() {
    fadeIn(this);
    backdrop(this, { minute: 1230, dim: 0.8 }).world.shader.setScrollFactor(0);
    const W = layout.W;
    this.onBack = () => go(this, 'Title');
    let y = layout.safe.top + 18;
    text(this, W / 2, y, 'About', 28, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    y += 56;
    const block = (title, paras) => {
      text(this, 20, y, title, 17, { serif: true, weight: '600', color: CSS.sun }).setDepth(10);
      y += 28;
      for (const p of paras) { const t = text(this, 20, y, p, 13.5, { wrap: W - 40, lineSpacing: 4 }).setDepth(10); y += t.height / layout.S + 10; }
      y += 10;
    };
    block(ACKNOWLEDGMENT.title, [...ACKNOWLEDGMENT.paragraphs, ACKNOWLEDGMENT.note]);
    block(SAFETY_NOTE.title, SAFETY_NOTE.paragraphs);
    if (CHART_APPROXIMATE) block('About the chart', ['Island outlines in this version are simplified from general geography, and the tide day is a realistic example rather than a real prediction. Both will be replaced with NOAA data.']);

    // Settings: three volume buses and the cockpit-view prototype.
    text(this, 20, y, 'Sound', 17, { serif: true, weight: '600', color: CSS.sun }).setDepth(10);
    y += 30;
    const s = state.save.settings;
    for (const [k, label] of [['sea', 'Sea & wind'], ['wildlife', 'Wildlife'], ['music', 'Music']]) {
      text(this, 20, y, label, 13).setDepth(10);
      const m = meter(this, 130, y + 6, W - 150, 8, COLOR.foam).setDepth(10);
      m.set(s[k]);
      const zone = this.add.zone(px(120), px(y - 6), px(W - 130), px(30)).setOrigin(0).setInteractive().setDepth(11);
      const setFrom = (p) => { s[k] = Math.max(0, Math.min(1, (p.x / layout.S - 130) / (W - 150))); m.set(s[k]); sound.unlock(); sound.setVolumes(s); persist(); };
      zone.on('pointerdown', setFrom);
      const yy = y;
      focusRing(this).add({ scroll: true, bounds: () => ({ x: 14, y: yy - 8, w: W - 28, h: 30 }), activate: () => {}, adjust: (d) => { s[k] = Math.max(0, Math.min(1, s[k] + d * 0.1)); m.set(s[k]); sound.unlock(); sound.setVolumes(s); persist(); } });
      zone.on('pointermove', (p) => p.isDown && setFrom(p));
      y += 38;
    }
    const pov = button(this, W / 2, y + 16, `Cockpit view in tide rips: ${s.pov ? 'on' : 'off'}`, () => { s.pov = !s.pov; pov.label.setText(`Cockpit view in tide rips: ${s.pov ? 'on' : 'off'}`); persist(); }, { primary: false, w: W - 60, h: 42, size: 13.5 }).setDepth(10);
    y += 56;
    const nm = () => `Soundtrack: ${s.soundtrack !== false ? 'on' : 'off'}`;
    const nmb = button(this, W / 2, y + 16, nm(), () => {
      s.soundtrack = s.soundtrack === false; nmb.label.setText(nm()); persist();
      sound.unlock(); sound.soundtrack(s.soundtrack);
    }, { primary: false, w: W - 60, h: 42, size: 13.5 }).setDepth(10);
    y += 70;
    button(this, W / 2, y, 'Credits & sources', () => go(this, 'Credits'), { primary: false }).setDepth(10);
    button(this, W / 2, y + 60, 'Back', () => go(this, 'Title')).setDepth(10);
    text(this, W / 2, y + 100, `Salish Sea Expeditions · v${__APP_VERSION__}`, 11, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    scrollable(this, y + 150);
  }
}
