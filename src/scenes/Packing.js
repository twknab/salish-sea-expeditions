// Pack the folding kayak (US4, FR-007): dry bags go in through the cockpit — there are no
// hatches — into flotation bags fore and aft; a few things ride on deck. Tap an item, then a place.
import Phaser from 'phaser';
import { text, button, glass, lessonCard, fadeIn } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { drawKayakTop } from '../render/kayakArt.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { GEAR, gearById } from '../content/gear.js';
import { ZONES, assess, handlingPenalty } from '../sim/packing.js';
import { lessonById } from '../content/lessons.js';
import { trip, lesson, go } from '../state.js';
import { sound } from '../audio/soundscape.js';

const ZONE_NAME = { bowEnd: 'Bow — far end', bowMid: 'Bow — near cockpit', sternMid: 'Stern — near cockpit', sternEnd: 'Stern — far end', deck: 'On deck' };

export class Packing extends Phaser.Scene {
  constructor() { super('Packing'); }

  create() {
    fadeIn(this);
    backdrop(this, { lat: 48.5392, lon: -123.0185, viewW: 420, minute: 520, dim: 0.6, drift: 0.5 });
    const W = layout.W, top = layout.safe.top;
    this.t = trip();
    this.p = this.t.packing;
    text(this, W / 2, top + 14, 'Pack for the night', 24, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    text(this, W / 2, top + 46, 'Tap an item, then where it goes. No hatches — everything loads through the cockpit.', 12.5, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: W - 40 }).setDepth(10);

    // Boat diagram (left) with zones; gear list (right).
    this.bx = 70; this.by = top + 100; this.bh = layout.H - top - layout.safe.bottom - 250;
    this.boat = this.add.graphics().setDepth(10);
    this.zoneG = this.add.graphics().setDepth(11);
    this.zoneLabels = {};
    this.selected = null;
    this.items = {};
    this.list = this.add.container(0, 0).setDepth(12);
    this.trimG = this.add.graphics().setDepth(12);
    this.trimT = text(this, 18, this.by + this.bh + 22, '', 12.5, { color: CSS.fog, wrap: W - 36 }).setDepth(12);
    this.build();
    this.input.on('pointerdown', (ptr) => this.tapZone(ptr));
    lesson('trim');
    this.card = lessonCard(this, lessonById.trim, { y: layout.safe.top + 8, depth: 40, autoHide: 8000 });
    button(this, W / 2, layout.H - layout.safe.bottom - 34, 'Done packing', () => this.done(), { w: 220, h: 46 }).setDepth(20);
  }

  zoneRects() {
    const x = this.bx, y = this.by, h = this.bh;
    const L = h * 0.94;
    const y0 = y + (h - L) / 2;
    return {
      bowEnd: { x: x - 28, y: y0, w: 56, h: L * 0.22 },
      bowMid: { x: x - 28, y: y0 + L * 0.22, w: 56, h: L * 0.22 },
      deck: { x: x - 28, y: y0 + L * 0.44, w: 56, h: L * 0.12 },
      sternMid: { x: x - 28, y: y0 + L * 0.56, w: 56, h: L * 0.22 },
      sternEnd: { x: x - 28, y: y0 + L * 0.78, w: 56, h: L * 0.22 },
    };
  }

  build() {
    const W = layout.W;
    // Boat: drawn top-down, bow up.
    const L = px(this.bh * 0.94);
    this.boat.setPosition(px(this.bx), px(this.by + this.bh / 2));
    drawKayakTop(this.boat, L, { empty: true });
    // Gear chips.
    const x0 = 140, w = W - x0 - 14;
    let y = this.by;
    for (const g of GEAR) {
      const c = this.add.container(px(x0), px(y));
      const bg = this.add.graphics();
      const t = text(this, 12, 7, `${g.name}`, 13, { weight: '600' });
      const kg = text(this, w - 10, 8, `${g.massKg} kg`, 11, { color: CSS.mist, origin: [1, 0] });
      c.add([bg, t, kg]);
      c.setSize(px(w), px(30)).setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, px(w), px(30)), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
      c.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation?.(); this.select(g.id); });
      this.items[g.id] = { c, bg, w };
      this.list.add(c);
      y += 34;
    }
    this.refresh();
  }

  where(id) {
    return ZONES.find((z) => this.p[z].includes(id)) ?? null;
  }

  select(id) {
    sound.unlock(); sound.ui('tap');
    this.selected = this.selected === id ? null : id;
    if (id === 'paddleFloat' || id === 'pump') { lesson('paddleFloat'); this.card?.active && this.card.destroy(); this.card = lessonCard(this, lessonById.paddleFloat, { y: layout.safe.top + 8, depth: 40, autoHide: 8000 }); }
    this.refresh();
  }

  tapZone(ptr) {
    if (!this.selected) return;
    const x = ptr.x / layout.S, y = ptr.y / layout.S;
    const rects = this.zoneRects();
    for (const z of ZONES) {
      const r = rects[z];
      if (x > r.x - 10 && x < r.x + r.w + 10 && y > r.y && y < r.y + r.h) {
        for (const zz of ZONES) this.p[zz] = this.p[zz].filter((i) => i !== this.selected);
        this.p[z].push(this.selected);
        sound.stroke(0.4, 0);
        this.selected = null;
        this.refresh();
        return;
      }
    }
  }

  refresh() {
    const rects = this.zoneRects();
    const g = this.zoneG;
    g.clear();
    for (const z of ZONES) {
      const r = rects[z];
      const n = this.p[z].length;
      g.lineStyle(px(1), this.selected ? COLOR.sun : 0xffffff, this.selected ? 0.8 : 0.25);
      g.strokeRoundedRect(px(r.x), px(r.y + 2), px(r.w), px(r.h - 4), px(10));
      if (n) { g.fillStyle(COLOR.sun, 0.12 + 0.08 * n); g.fillRoundedRect(px(r.x), px(r.y + 2), px(r.w), px(r.h - 4), px(10)); }
      if (!this.zoneLabels[z]) this.zoneLabels[z] = text(this, r.x + r.w + 4, r.y + 4, '', 9, { color: CSS.mist }).setDepth(12);
      this.zoneLabels[z].setText(n ? `${n}` : '');
    }
    for (const g2 of GEAR) {
      const it = this.items[g2.id];
      const at = this.where(g2.id);
      it.bg.clear();
      const sel = this.selected === g2.id;
      it.bg.fillStyle(sel ? COLOR.sun : at ? COLOR.sea : COLOR.ink, sel ? 0.9 : at ? 0.7 : 0.5);
      it.bg.fillRoundedRect(0, 0, px(it.w), px(30), px(10));
      if (g2.essential && !at) { it.bg.lineStyle(px(1), COLOR.danger, 0.7); it.bg.strokeRoundedRect(0, 0, px(it.w), px(30), px(10)); }
      it.c.list[1].setColor(sel ? CSS.ink : CSS.foam);
      it.c.list[2].setText(at ? ZONE_NAME[at].split(' — ')[0].replace('On deck', 'Deck') : `${g2.massKg} kg`);
    }
    const a = assess(this.p);
    const pen = handlingPenalty(a);
    const tg = this.trimG;
    tg.clear();
    const W = layout.W, y = this.by + this.bh + 6;
    tg.fillStyle(0xffffff, 0.15);
    tg.fillRoundedRect(px(18), px(y), px(W - 36), px(6), px(3));
    tg.fillStyle(pen < 0.25 ? COLOR.good : pen < 0.5 ? COLOR.sun : COLOR.danger, 1);
    tg.fillCircle(px(W / 2 + a.pitch * (W / 2 - 24)), px(y + 3), px(7));
    const trimWord = Math.abs(a.pitch) < 0.15 ? 'Level trim' : a.pitch > 0 ? 'Bow-heavy — it will plough' : 'Stern-heavy — it will weathercock';
    const miss = a.missing.map((id) => gearById[id].name.toLowerCase());
    this.trimT.setText(`${trimWord}${a.topHeavy > 0 ? ' · top-heavy deck' : ''} · ${a.total.toFixed(1)} kg aboard${miss.length ? `\nStill on the beach: ${miss.join(', ')}` : '\nAll the essentials are aboard.'}`);
    this.trimT.setColor(miss.length ? CSS.madrona : CSS.good);
  }

  done() {
    const a = assess(this.p);
    if (a.missing.length && !this.warned) {
      this.warned = true;
      sound.warn();
      lesson('essentials');
      this.card?.active && this.card.destroy();
      this.card = lessonCard(this, lessonById.essentials, { y: layout.safe.top + 8, depth: 40, autoHide: 9000 });
      this.trimT.setText(`${this.trimT.text}\nTap “Done packing” again to launch without them.`);
      return;
    }
    go(this, 'Planning');
  }
}
