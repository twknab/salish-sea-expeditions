import Phaser from 'phaser';
import { text, button, glass, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { CSS, layout } from '../ui/theme.js';
import { newTrip, go } from '../state.js';
import { PLACES_INFO } from '../content/places.js';

export class StartChoice extends Phaser.Scene {
  constructor() { super('StartChoice'); }

  create() {
    fadeIn(this);
    backdrop(this, { minute: 430, dim: 0.6 });
    const W = layout.W;
    let y = layout.safe.top + 40;
    text(this, W / 2, y, 'Your first voyage', 28, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    text(this, W / 2, y + 42, 'Friday Harbor to Jones Island · about 4½ nautical miles', 13, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    y += 96;
    const card = (title, body, cta, onPick, h = 200) => {
      glass(this, 20, y, W - 40, h, { alpha: 0.7 }).setDepth(10);
      text(this, 38, y + 18, title, 19, { serif: true, weight: '600', color: CSS.sun }).setDepth(10);
      text(this, 38, y + 50, body, 14, { wrap: W - 76, lineSpacing: 5 }).setDepth(10);
      button(this, W / 2, y + h - 34, cta, onPick, { w: 240, h: 44, size: 15 }).setDepth(11);
      y += h + 16;
    };
    const ana = PLACES_INFO.find((p) => p.id === 'anacortes');
    const fh = PLACES_INFO.find((p) => p.id === 'fridayHarbor');
    card('Walk on the ferry at Anacortes', `${ana.text} Watch the islands go by and learn the route on the chart.`, 'Take the ferry', () => { newTrip('ferry'); go(this, 'Ferry'); }, 214);
    card('Start in Friday Harbor', fh.text, 'Go to the beach', () => { newTrip('fridayHarbor'); go(this, 'BoatSchool'); }, 190);
  }
}
