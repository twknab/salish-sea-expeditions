import Phaser from 'phaser';
import { WorldView } from '../render/world.js';
import { button, text, fadeIn } from '../ui/widgets.js';
import { CSS, layout, px } from '../ui/theme.js';
import { state, newTrip, go } from '../state.js';
import { sound } from '../audio/soundscape.js';
import { openLink, LINKS } from '../ui/link.js';
import { focusRing } from '../ui/focus.js';
import { toLocal } from '../sim/geo.js';
import { wind } from '../sim/wind.js';

export class Title extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    fadeIn(this);
    const W = layout.W, H = layout.H;
    // A slow drift over the channel at golden hour.
    this.world = new WorldView(this, { viewW: 1500 });
    this.p = toLocal(48.575, -123.03);
    this.world.cam.x = this.p.x; this.world.cam.y = this.p.y;
    this.t = 0;

    const g = this.add.graphics();
    g.fillGradientStyle(0x0b2b33, 0x0b2b33, 0x0b2b33, 0x0b2b33, 0.75, 0.75, 0, 0);
    g.fillRect(0, 0, px(W), px(H * 0.42));
    g.fillGradientStyle(0x0b2b33, 0x0b2b33, 0x0b2b33, 0x0b2b33, 0, 0, 0.85, 0.85);
    g.fillRect(0, px(H * 0.55), px(W), px(H * 0.45));

    const top = layout.safe.top + H * 0.1;
    text(this, W / 2, top, 'SALISH SEA', 15, { tracking: 6, color: CSS.fog, origin: [0.5, 0] });
    text(this, W / 2, top + 26, 'Expeditions', 46, { serif: true, weight: '600', origin: [0.5, 0] });
    text(this, W / 2, top + 88, 'A sea-kayak journey through the\nSan Juan and Gulf Islands', 15, { color: CSS.fog, align: 'center', origin: [0.5, 0], serif: true });

    const by = H - layout.safe.bottom - 190;
    const hasTrip = !!state.save.trip;
    button(this, W / 2, by, hasTrip ? 'Continue the trip' : 'Begin', () => this.start(hasTrip));
    if (hasTrip) button(this, W / 2, by + 62, 'Start a new trip', () => this.start(false), { primary: false });
    const row = by + (hasTrip ? 124 : 70);
    button(this, W / 2 - 88, row, 'Field guide', () => go(this, 'FieldGuide'), { primary: false, w: 150, h: 42, size: 14 });
    button(this, W / 2 + 88, row, 'About', () => go(this, 'About'), { primary: false, w: 150, h: 42, size: 14 });
    const nights = state.save.totals.nights;
    // A quiet credit line at the foot of the home screen.
    const foot = text(this, W / 2, H - layout.safe.bottom - 14, 'Made by Tim Knab · timknab.dev', 11.5, { color: CSS.mist, origin: [0.5, 1] })
      .setInteractive({ useHandCursor: true });
    foot.on('pointerup', () => openLink(LINKS.maker));
    focusRing(this).add({ bounds: () => ({ x: W / 2 - foot.width / layout.S / 2 - 6, y: H - layout.safe.bottom - 14 - foot.height / layout.S, w: foot.width / layout.S + 12, h: foot.height / layout.S }), activate: () => openLink(LINKS.maker) });
    if (nights) text(this, W / 2, row + 40, `${nights} night${nights > 1 ? 's' : ''} out · ${state.save.totals.nm.toFixed(1)} nm paddled`, 12, { color: CSS.mist, origin: [0.5, 0] });
    this.input.once('pointerdown', () => sound.unlock());
    sound.mood('calm');
  }

  start(resume) {
    sound.unlock();
    if (resume && state.save.trip) {
      const t = state.save.trip;
      go(this, t.scene, t.scene === 'Paddle' ? { mode: 'trip', resume: { minute: t.minute, kayak: t.kayak, energy: t.energy } } : undefined);
      return;
    }
    if (!state.save.seenIntro) { go(this, 'Acknowledgment'); return; }
    go(this, 'StartChoice');
  }

  update(_t, dms) {
    const dt = dms / 1000;
    this.t += dt;
    sound.update(dt);
    sound.ambience({ sea: 0.35, wind: 0.2 });
    const w = this.world;
    w.cam.x = this.p.x + Math.sin(this.t * 0.03) * 300;
    w.cam.y = this.p.y + this.t * 4;
    const m = 1180 + Math.sin(this.t * 0.02) * 30; // late-afternoon light
    w.setConditions({ minute: m, wind: wind(m), current: { x: -0.2, y: 0.4 }, sea: 0.3, boat: w.cam, time: this.t, ripStrength: [0.6, 0.3] });
  }
}
