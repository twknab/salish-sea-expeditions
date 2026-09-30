// Camp on Jones Island (US5): pitch above the night's high water, keep food from the raccoons,
// leave no trace; the night passes and the tide shows you whether you chose well.
import Phaser from 'phaser';
import { text, button, glass, lessonCard, fadeIn } from '../ui/widgets.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { TENT_SITES, FOOD_OPTIONS, night } from '../sim/camp.js';
import { tideHeight } from '../sim/tides.js';
import { clock } from '../sim/geo.js';
import { lessonById } from '../content/lessons.js';
import { PLACES_INFO } from '../content/places.js';
import { trip, lesson, observe, go, persist, state } from '../state.js';
import { award } from '../sim/skills.js';
import { sound } from '../audio/soundscape.js';
import { pauseButton } from '../ui/pause.js';

const SITE_X = { beach: 0.36, wrack: 0.58, terrace: 0.82 };

export class Camp extends Phaser.Scene {
  constructor() { super('Camp'); }

  create() {
    fadeIn(this);
    this.t = trip();
    this.minute = Math.max(this.t.minute ?? 720, 600);
    this.arrive = this.minute;
    this.sky = this.add.graphics();
    this.land = this.add.graphics();
    this.water = this.add.graphics();
    this.fx = this.add.graphics();
    this.ui = [];
    this.stars = Array.from({ length: 60 }, (_, i) => ({ x: (i * 53) % 390, y: (i * 37) % 300, s: 0.6 + (i % 3) * 0.5 }));
    this.draw();
    const info = PLACES_INFO.find((p) => p.id === 'jones');
    this.card = lessonCard(this, { title: 'Jones Island', text: info.text, sourceIds: info.sourceIds }, { y: layout.safe.top + 12, depth: 50, autoHide: 6500 });
    this.time.delayedCall(1200, () => this.chooseSite());
    sound.ambience({ sea: 0.2, wind: 0.1, surf: 0.7, rip: 0 });
    sound.mood('calm');
    this.clock = text(this, layout.W - 58, layout.safe.top + 14, '', 14, { serif: true, weight: '600', origin: [1, 0] }).setDepth(40);
    pauseButton(this);
  }

  // Elevation (m above MLLW) → screen y (points).
  ey(e) { return layout.H * 0.66 - e * 34; }

  terrain(x) {
    // x: 0..1 across the screen; returns ground elevation.
    if (x < 0.62) return -1.2 + x * 5.6;          // beach slope up to ~2.3 m
    if (x < 0.7) return 2.3 + (x - 0.62) * 30;     // bank up to the terrace
    return 4.7 + Math.sin(x * 20) * 0.1;
  }

  draw(opts = {}) {
    const W = layout.W, H = layout.H;
    const m = this.minute % 1440;
    const dayF = m < 330 || m > 1290 ? 0 : Math.min(1, Math.min(m - 330, 1290 - m) / 90);
    this.dayF = dayF;
    const sky = this.sky;
    sky.clear();
    const top = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x0a1428), Phaser.Display.Color.ValueToColor(0x6fa3c0), 100, dayF * 100);
    const bot = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x1a2440), Phaser.Display.Color.ValueToColor(m > 1150 && m < 1320 ? 0xf2a36b : 0xcfe0e0), 100, Math.max(dayF, m > 1150 && m < 1320 ? 0.8 : 0) * 100);
    const c1 = Phaser.Display.Color.GetColor(top.r, top.g, top.b), c2 = Phaser.Display.Color.GetColor(bot.r, bot.g, bot.b);
    sky.fillGradientStyle(c1, c1, c2, c2, 1);
    sky.fillRect(0, 0, px(W), px(H * 0.62));
    if (dayF < 0.3) for (const s of this.stars) { sky.fillStyle(0xffffff, (0.3 - dayF) * 2.5); sky.fillCircle(px(s.x * W / 390), px(s.y), px(s.s)); }
    // Distant islands across the water.
    sky.fillStyle(dayF > 0.3 ? 0x3d5a55 : 0x141c22, 1);
    sky.fillEllipse(px(W * 0.2), px(H * 0.62), px(W * 0.7), px(60));
    sky.fillEllipse(px(W * 0.85), px(H * 0.625), px(W * 0.5), px(40));

    // Terrain.
    const g = this.land;
    g.clear();
    const pts = [];
    for (let i = 0; i <= 60; i++) { const x = i / 60; pts.push({ x: px(x * W), y: px(this.ey(this.terrain(x))) }); }
    pts.push({ x: px(W), y: px(H) }, { x: 0, y: px(H) });
    const light = 0.35 + 0.65 * dayF;
    const shade = (c) => Phaser.Display.Color.GetColor(((c >> 16) & 255) * light, ((c >> 8) & 255) * light, (c & 255) * light);
    g.fillStyle(shade(0xb09a74), 1);
    g.fillPoints(pts, true);
    // Pebbles and the wrack line (drift logs, dried seaweed).
    const wrackY = this.ey(2.35);
    g.fillStyle(shade(0x6b5a44), 1);
    for (let i = 0; i < 5; i++) g.fillRoundedRect(px(W * (0.5 + i * 0.03)), px(wrackY - 8 - i % 2 * 4), px(W * 0.14), px(7), px(3));
    g.fillStyle(shade(0x4b4a2a), 0.9);
    for (let i = 0; i < 20; i++) g.fillCircle(px(W * (0.48 + (i * 0.37) % 0.18)), px(wrackY + 2), px(2));
    // Terrace grass, firs and a madrona.
    g.fillStyle(shade(0x5f7a3c), 1);
    g.fillRect(px(W * 0.68), px(this.ey(4.75)), px(W * 0.32), px(8));
    for (let i = 0; i < 5; i++) {
      const x = W * (0.74 + i * 0.07), y = this.ey(4.7);
      g.fillStyle(shade(0x1f3a26), 1);
      g.fillTriangle(px(x - 16), px(y), px(x + 16), px(y), px(x), px(y - 90 - (i % 2) * 30));
    }
    g.fillStyle(shade(0x8a3a22), 1);
    g.fillRect(px(W * 0.7), px(this.ey(4.7) - 44), px(5), px(44));
    g.fillStyle(shade(0x3f6a34), 1);
    g.fillEllipse(px(W * 0.7), px(this.ey(4.7) - 50), px(40), px(24));
    // Tent and food.
    if (this.site) {
      const x = W * SITE_X[this.site], y = this.ey(this.terrain(SITE_X[this.site]));
      g.fillStyle(0xe0824a, 1);
      g.fillTriangle(px(x - 22), px(y), px(x + 22), px(y), px(x), px(y - 26));
      if (dayF < 0.5) { g.fillStyle(0xf2d28a, 0.6); g.fillTriangle(px(x - 12), px(y), px(x + 12), px(y), px(x), px(y - 14)); }
    }
    // Water level.
    const h = opts.water ?? tideHeight(this.minute);
    const w = this.water;
    w.clear();
    const wy = this.ey(h);
    w.fillStyle(dayF > 0.3 ? 0x1f5f66 : 0x0b2530, 0.92);
    w.fillRect(0, px(wy), px(W * 0.02 + this.shoreX(h) * W), px(layout.H - wy));
    w.lineStyle(px(1.5), 0xe9f1ee, 0.7);
    w.lineBetween(0, px(wy), px(this.shoreX(h) * W), px(wy));
    this.tideLabel?.destroy();
    this.tideLabel = text(this, 12, wy - 18, `tide ${h.toFixed(1)} m`, 10.5, { color: CSS.fog }).setDepth(5);
    this.clock?.setText(clock(this.minute));
  }

  shoreX(h) {
    // Where water level h meets the beach slope.
    return Math.min(1, Math.max(0, (h + 1.2) / 5.6));
  }

  clearUi() { this.ui.forEach((o) => o.destroy()); this.ui = []; }

  chooseSite() {
    this.clearUi();
    lesson('highTide');
    this.card?.active && this.card.dismiss();
    this.card = lessonCard(this, lessonById.highTide, { y: layout.safe.top + 12, depth: 50 });
    const W = layout.W;
    for (const s of TENT_SITES) {
      const x = W * SITE_X[s.id], y = this.ey(this.terrain(SITE_X[s.id]));
      const b = button(this, x, y + 36, s.id === 'terrace' ? 'Terrace' : s.id === 'wrack' ? 'By the logs' : 'Beach', () => this.pickSite(s.id), { w: 92, h: 34, size: 12.5, primary: false });
      this.ui.push(b);
    }
    this.ui.push(text(this, W / 2, layout.H - layout.safe.bottom - 40, 'Where will you pitch the tent?', 15, { serif: true, origin: [0.5, 0.5] }));
  }

  pickSite(id) {
    this.site = id;
    sound.ui('tap');
    this.draw();
    this.chooseFood();
  }

  chooseFood() {
    this.clearUi();
    lesson('raccoons');
    this.card?.active && this.card.dismiss();
    this.card = lessonCard(this, lessonById.raccoons, { y: layout.safe.top + 12, depth: 50 });
    const W = layout.W;
    let y = layout.H - layout.safe.bottom - 190;
    this.ui.push(glass(this, 12, y - 14, W - 24, 190, { alpha: 0.8 }));
    this.ui.push(text(this, W / 2, y, 'And the food?', 16, { serif: true, weight: '600', origin: [0.5, 0] }));
    y += 36;
    for (const f of FOOD_OPTIONS) {
      this.ui.push(button(this, W / 2, y + 20, f.name, () => { this.food = f.id; this.leaveNoTrace(); }, { w: W - 60, h: 42, size: 14, primary: false }));
      y += 48;
    }
  }

  leaveNoTrace() {
    this.clearUi();
    lesson('lnt');
    this.card?.active && this.card.dismiss();
    this.card = lessonCard(this, lessonById.lnt, { y: layout.safe.top + 12, depth: 50 });
    const W = layout.W;
    const tasks = ['Pack out every scrap of trash', 'Keep to the trail and the tent pad', 'Leave the driftwood and shells where they lie'];
    const done = new Set();
    let y = layout.H - layout.safe.bottom - 200;
    this.ui.push(glass(this, 12, y - 14, W - 24, 200, { alpha: 0.8 }));
    tasks.forEach((tk, i) => {
      const b = button(this, W / 2, y + 22 + i * 50, `○  ${tk}`, () => {
        done.add(i); b.label.setText(`✓  ${tk}`); b.setEnabled(false); sound.ui('tap');
        if (done.size === tasks.length) { this.lnt = true; this.time.delayedCall(500, () => this.nightfall()); }
      }, { w: W - 60, h: 42, size: 13, primary: false });
      this.ui.push(b);
    });
    if (!this.t.packing || !Object.values(this.t.packing).flat().includes('headlamp')) {
      this.ui.push(text(this, W / 2, y + 170, 'No headlamp: evening chores take twice as long in the dark.', 12, { color: CSS.madrona, origin: [0.5, 0], wrap: W - 40, align: 'center' }));
      this.noLight = true;
    }
  }

  nightfall() {
    this.clearUi();
    sound.mood('night');
    this.card?.active && this.card.dismiss();
    const target = 1440 + 360;
    this.tweens.addCounter({
      from: this.minute, to: 1380, duration: 5000, ease: 'Sine.easeInOut',
      onUpdate: (tw) => { this.minute = tw.getValue(); this.draw(); },
      onComplete: () => this.biolum(target),
    });
  }

  biolum(target) {
    const W = layout.W;
    this.card = lessonCard(this, { title: 'The water is glowing', text: 'Every ripple at the water’s edge sparks blue. Single-celled plankton flash when the water around them is disturbed — the Salish Sea at night.', sourceIds: ['eopugetsound'] }, { y: layout.safe.top + 12, depth: 50 });
    if (observe('bioluminescence')) sound.success();
    this.glowT = 6;
    this.ui.push(button(this, W / 2, layout.H - layout.safe.bottom - 50, 'Sleep', () => this.sleep(target)));
  }

  sleep(target) {
    this.clearUi();
    this.card?.active && this.card.dismiss();
    this.glowT = 0;
    this.tweens.addCounter({
      from: this.minute, to: target, duration: 7000, ease: 'Sine.easeInOut',
      onUpdate: (tw) => { this.minute = tw.getValue(); this.draw(); },
      onComplete: () => this.morning(),
    });
  }

  morning() {
    sound.mood('calm');
    const r = night(this.site, this.food, this.arrive);
    const t = this.t;
    t.record.nights = 1;
    t.record.cleanCamp = r.clean && this.lnt;
    if (r.clean) award(state.save.skills, 'campcraft', 30);
    if (!r.flooded) lesson('highTide', 'demonstrated');
    if (!r.raided) lesson('raccoons', 'demonstrated');
    if (this.lnt) lesson('lnt', 'demonstrated');
    t.minute = this.minute;
    persist();
    const lines = [];
    lines.push(r.flooded ? `At ${r.high.toFixed(1)} m the night’s high water ran under your tent. Soggy, and the clean-camp bonus is gone.` : `The night’s high water reached ${r.high.toFixed(1)} m — well below your tent.`);
    lines.push(r.raided ? 'Raccoons unzipped the bag and ate half your food.' : 'The food locker held. The raccoons went home hungry.');
    const W = layout.W;
    this.card = lessonCard(this, { title: `Night one on Jones Island`, text: lines.join(' '), sourceIds: ['noaa-tides', 'wa-parks-jones'] }, { y: layout.safe.top + 12, depth: 50 });
    if (r.flooded) this.draw({ water: r.high });
    let y = layout.H - layout.safe.bottom - 60;
    this.ui.push(button(this, W / 2, y, 'Debrief', () => go(this, 'Debrief')));
    this.ui.push(button(this, W / 2, y - 58, 'Explore the low-tide pools', () => go(this, 'TidePools'), { primary: false, w: 280 }));
    if (!t.record.capsizes) {
      this.ui.push(button(this, W / 2, y - 116, 'Practise a rescue in the cove', () => this.practice(), { primary: false, w: 280 }));
    }
  }

  practice() {
    this.scene.pause();
    this.scene.launch('Rescue', { enabled: [...new Set(Object.values(this.t.packing).flat().flatMap((id) => ({ paddleFloat: ['pfRescue'], pump: ['pumpOut'] }[id] ?? [])))], partnerNear: true, sea: 0.05, practice: true, return: 'Camp' });
    const back = (_s, data) => {
      if (data?.fromPause) return;
      this.events.off('resume', back);
      sound.mood('calm'); if (data?.ok) this.t.record.rescues++; persist();
    };
    this.events.on('resume', back);
  }

  update(_t, dms) {
    const dt = dms / 1000;
    sound.update(dt);
    const f = this.fx;
    f.clear();
    if (this.glowT > 0) {
      this.glowT = Math.max(0.5, this.glowT - dt * 0.2);
      const h = tideHeight(this.minute), wy = this.ey(h), sx = this.shoreX(h) * layout.W;
      for (let i = 0; i < 40; i++) {
        const x = sx - Math.random() * 120, y = wy + Math.random() * 60;
        f.fillStyle(0x6fe3ff, Math.random() * 0.8);
        f.fillCircle(px(x), px(y), px(0.8 + Math.random() * 1.8));
      }
    }
  }
}
