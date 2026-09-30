// Where the voyage begins, chosen from two illustrated postcards (spec 003, FR-001).
import Phaser from 'phaser';
import { text, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { loadArt } from '../render/art.js';
import { focusRing } from '../ui/focus.js';
import { CSS, layout, px } from '../ui/theme.js';
import { newTrip, go } from '../state.js';
import { sound } from '../audio/soundscape.js';

const CARDS = [
  { id: 'ferry', art: 'postcardAnacortes', kicker: 'WALK ON AT ANACORTES', title: 'Take the ferry', line: 'Your kayak rides as luggage in its wheeled bag. Watch the islands go by and learn the route on the chart.' },
  { id: 'fridayHarbor', art: 'postcardFridayHarbor', kicker: 'SAN JUAN ISLAND', title: 'Start in Friday Harbor', line: 'The islands’ harbour town: marina masts, the ferry landing, floatplanes — and a beach to build your boat on.' },
];

export class StartChoice extends Phaser.Scene {
  constructor() { super('StartChoice'); }

  async create() {
    fadeIn(this);
    backdrop(this, { minute: 430, dim: 0.66 });
    this.onBack = () => go(this, 'Title');
    const W = layout.W, H = layout.H;
    let y = layout.safe.top + 16;
    text(this, W / 2, y, 'Your first voyage', 26, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    text(this, W / 2, y + 36, 'Friday Harbor to Jones Island · about 4½ nautical miles', 12.5, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    y += 70;
    // Two postcards, sized to fit the screen with their captions.
    const cw = W - 32, avail = H - y - layout.safe.bottom - 20, ch = Math.min(cw * (380 / 600), (avail - 2 * 86) / 2);
    const iw = ch * (600 / 380);
    const keys = await Promise.all(CARDS.map((c) => loadArt(this, c.art, 'none', px(iw))));
    CARDS.forEach((c, i) => {
      const top = y + i * (ch + 96);
      const img = this.add.image(px(W / 2), px(top + ch / 2), keys[i]).setDepth(10);
      // Rounded corners: a mask the shape of the card.
      const m = this.make.graphics({}, false);
      m.fillStyle(0xffffff, 1); m.fillRoundedRect(px(W / 2 - iw / 2), px(top), px(iw), px(ch), px(16));
      img.setMask(m.createGeometryMask());
      const shade = this.add.graphics().setDepth(11);
      shade.fillGradientStyle(0x06202a, 0x06202a, 0x06202a, 0x06202a, 0, 0, 0.78, 0.78);
      shade.fillRect(px(W / 2 - iw / 2), px(top + ch * 0.55), px(iw), px(ch * 0.45));
      shade.setMask(m.createGeometryMask());
      text(this, W / 2 - iw / 2 + 16, top + ch - 50, c.kicker, 10.5, { tracking: 2, color: CSS.fog }).setDepth(12);
      text(this, W / 2 - iw / 2 + 16, top + ch - 34, c.title, 21, { serif: true, weight: '600' }).setDepth(12);
      text(this, W / 2 - iw / 2 + 16, top + ch - 34, '→', 21, { weight: '600', color: CSS.sun }).setDepth(12).setX(px(W / 2 + iw / 2 - 34));
      text(this, W / 2, top + ch + 10, c.line, 12.5, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: iw - 10, lineSpacing: 3 }).setDepth(10);
      const pick = () => { sound.unlock(); sound.ui('tap'); newTrip(c.id); go(this, 'Outfit'); };
      const z = this.add.zone(px(W / 2 - iw / 2), px(top), px(iw), px(ch)).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(13);
      z.on('pointerup', pick);
      focusRing(this).add({ bounds: () => ({ x: W / 2 - iw / 2, y: top, w: iw, h: ch }), activate: pick });
    });
  }
}
