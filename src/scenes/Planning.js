// Plan the launch (US3): read the chart, read the current and wind for the day, pick a time.
import Phaser from 'phaser';
import { focusRing } from '../ui/focus.js';
import { WorldView } from '../render/world.js';
import { text, button, glass, lessonCard, fadeIn } from '../ui/widgets.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { ROUTE, PLACES, ISLANDS } from '../content/chart.js';
import { TRIP_DAY } from '../content/tripDay.js';
import { channelCurrentKn, tideHeight } from '../sim/tides.js';
import { wind, seaState, windAgainstTide } from '../sim/wind.js';
import { nm, clock, clamp } from '../sim/geo.js';
import { lessonById } from '../content/lessons.js';
import { trip, lesson, go } from '../state.js';
import { award } from '../sim/skills.js';
import { judge } from '../sim/plan.js';
import { state } from '../state.js';
import { sound } from '../audio/soundscape.js';
import { pauseButton } from '../ui/pause.js';

const T0 = 300, T1 = 1200; // graph spans 05:00–20:00

function routeLength() {
  let d = 0;
  for (let i = 1; i < ROUTE.length; i++) d += Math.hypot(ROUTE[i].x - ROUTE[i - 1].x, ROUTE[i].y - ROUTE[i - 1].y);
  return d;
}

export class Planning extends Phaser.Scene {
  constructor() { super('Planning'); }

  create() {
    fadeIn(this);
    const W = layout.W, H = layout.H, top = layout.safe.top;
    this.t = trip();
    this.launch = this.t.launchMinute ?? 480;
    // Chart: aerial view of the route with chart furniture.
    const mid = { x: (ROUTE[0].x + ROUTE.at(-1).x) / 2, y: (ROUTE[0].y + ROUTE.at(-1).y) / 2 };
    this.world = new WorldView(this, { viewW: 8400 });
    this.world.cam.x = mid.x - 200; this.world.cam.y = 900;
    this.time0 = 0;
    this.chartG = this.add.graphics().setDepth(5);
    this.drawChart();

    // Graph panel.
    this.gy = H - layout.safe.bottom - 330;
    glass(this, 10, this.gy - 12, W - 20, 330 - 12 + layout.safe.bottom * 0, { alpha: 0.86 }).setDepth(9);
    text(this, 26, this.gy, 'Current in San Juan Channel & wind', 13, { weight: '600' }).setDepth(10);
    text(this, W - 26, this.gy, TRIP_DAY.real ? '' : 'Representative July day', 10.5, { color: CSS.mist, origin: [1, 0] }).setDepth(10);
    this.graphG = this.add.graphics().setDepth(10);
    this.cursorG = this.add.graphics().setDepth(11);
    this.readout = text(this, 26, this.gy + 176, '', 13, { wrap: W - 52, lineSpacing: 4 }).setDepth(10);
    this.verdict = text(this, 26, this.gy + 222, '', 13.5, { weight: '600', wrap: W - 52 }).setDepth(10);
    this.drawGraph();
    this.setLaunch(this.launch);

    this.input.on('pointerdown', (p) => this.drag(p));
    this.input.on('pointermove', (p) => p.isDown && this.drag(p));
    // Keyboard: Tab to the graph, then ← → move the launch time by 15 minutes.
    const gy = this.gy;
    focusRing(this).add({ bounds: () => ({ x: 20, y: gy + 20, w: W - 40, h: 140 }), activate: () => {}, adjust: (d) => this.setLaunch(Math.max(360, Math.min(1080, this.launch + d * 15))) });
    text(this, W / 2, this.gy + 262, 'Drag the graph · or Tab to it and use ← →', 10.5, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    button(this, W / 2, H - layout.safe.bottom - 34, 'Launch', () => this.go(), { w: 220, h: 46 }).setDepth(12);

    lesson('chartReading');
    this.queue = ['chartReading', 'slackWater', 'windAgainstTide'];
    this.nextCard();
    pauseButton(this);
  }

  nextCard() {
    const id = this.queue.shift();
    if (!id) return;
    lesson(id);
    this.card?.active && this.card.destroy();
    this.card = lessonCard(this, lessonById[id], { y: layout.safe.top + 8, depth: 30, action: this.queue.length ? 'Next' : 'Got it', onAction: () => { this.card.dismiss(); this.time.delayedCall(250, () => this.nextCard()); } });
  }

  gx(m) { return 26 + ((m - T0) / (T1 - T0)) * (layout.W - 52); }

  drawGraph() {
    const g = this.graphG, y0 = this.gy + 26, h = 130, mid = y0 + h / 2;
    g.clear();
    // Axis and hours.
    g.lineStyle(px(1), 0xffffff, 0.25);
    g.lineBetween(px(this.gx(T0)), px(mid), px(this.gx(T1)), px(mid));
    for (let m = 360; m <= T1; m += 120) {
      g.lineBetween(px(this.gx(m)), px(y0 + h - 4), px(this.gx(m)), px(y0 + h));
      if (!this.hourLabels) this.hourLabels = [];
      this.hourLabels.push(text(this, this.gx(m), y0 + h + 2, clock(m).slice(0, 2), 9.5, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10));
    }
    // Current: flood above (fills teal), ebb below (fills madrona).
    const scale = (h / 2 - 6) / 2.2;
    for (let m = T0; m < T1; m += 4) {
      const kn = channelCurrentKn(m);
      g.fillStyle(kn >= 0 ? COLOR.good : COLOR.madrona, 0.55);
      const x = px(this.gx(m)), w = px(this.gx(m + 4) - this.gx(m)) + 1;
      if (kn >= 0) g.fillRect(x, px(mid - kn * scale), w, px(kn * scale));
      else g.fillRect(x, px(mid), w, px(-kn * scale));
    }
    // Wind speed line.
    g.lineStyle(px(2), COLOR.fog, 0.9);
    g.beginPath();
    for (let m = T0; m <= T1; m += 10) {
      const y = y0 + h - 6 - (wind(m).kn / 16) * (h - 12);
      m === T0 ? g.moveTo(px(this.gx(m)), px(y)) : g.lineTo(px(this.gx(m)), px(y));
    }
    g.strokePath();
    // Slack markers.
    for (const e of TRIP_DAY.current) {
      if (e.kn === 0 && e.t > T0 && e.t < T1) {
        g.fillStyle(COLOR.foam, 1);
        g.fillCircle(px(this.gx(e.t)), px(mid), px(3.5));
      }
    }
    text(this, 26, y0 - 2, 'FLOOD ↑ north', 9, { color: CSS.good }).setDepth(10);
    text(this, 26, y0 + h - 12, 'EBB ↓ south', 9, { color: CSS.madrona }).setDepth(10);
    text(this, layout.W - 26, y0 - 2, '— wind', 9, { color: CSS.fog, origin: [1, 0] }).setDepth(10);
  }

  drag(p) {
    const y = p.y / layout.S;
    if (y < this.gy + 10 || y > this.gy + 170) return;
    const m = T0 + ((p.x / layout.S - 26) / (layout.W - 52)) * (T1 - T0);
    this.setLaunch(Math.round(clamp(m, 360, 1080) / 15) * 15);
  }

  setLaunch(m) {
    this.launch = m;
    const y0 = this.gy + 26, h = 130;
    const c = this.cursorG;
    c.clear();
    c.fillStyle(COLOR.sun, 0.18);
    c.fillRect(px(this.gx(m)), px(y0), px(this.gx(m + 120) - this.gx(m)), px(h));
    c.lineStyle(px(2), COLOR.sun, 1);
    c.lineBetween(px(this.gx(m)), px(y0), px(this.gx(m)), px(y0 + h));
    const kn = channelCurrentKn(m), w = wind(m), j = judge(m);
    const dir = Math.abs(kn) < 0.2 ? 'near slack' : kn > 0 ? `${kn.toFixed(1)} kn flood — with you` : `${(-kn).toFixed(1)} kn ebb — against you`;
    this.readout.setText(`Launch ${clock(m)} · ${dir}\nWind ${Math.round(w.kn)} kn from the ${w.fromDeg > 157 && w.fromDeg < 203 ? 'south' : 'south-west'} · tide ${tideHeight(m).toFixed(1)} m`);
    const txt = {
      good: 'Good window: a young flood carries you north in light wind.',
      fair: 'Workable, but you will paddle against some current or chop.',
      poor: j.against ? 'Poor: the afternoon southerly blows against the ebb — steep chop in the channel.' : 'Poor: a strong ebb against you all the way.',
    }[j.verdict];
    this.verdict.setText(txt).setColor(j.verdict === 'good' ? CSS.good : j.verdict === 'fair' ? CSS.sun : CSS.danger);
  }

  drawChart() {
    const g = this.chartG, w = this.world;
    g.clear();
    // Route.
    g.lineStyle(px(2), COLOR.sun, 0.95);
    for (let i = 1; i < ROUTE.length; i++) {
      const a = w.toScreen(ROUTE[i - 1].x, ROUTE[i - 1].y), b = w.toScreen(ROUTE[i].x, ROUTE[i].y);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    for (const p of [PLACES.launch, PLACES.destination]) {
      const s = w.toScreen(p.x, p.y);
      g.fillStyle(COLOR.sun, 1); g.fillCircle(s.x, s.y, px(5));
    }
    const lab = (p, name, dx = 8, dy = -6, size = 11) => {
      const s = w.toScreen(p.x, p.y);
      text(this, s.x / layout.S + dx, s.y / layout.S + dy, name, size, { weight: '600', color: CSS.foam }).setDepth(6);
    };
    lab(PLACES.launch, 'Friday Harbor', 10, -2);
    lab(PLACES.destination, 'Jones Island', 10, -10);
    const c = (id) => { const is = ISLANDS.find((i) => i.id === id); return { x: is.poly.reduce((s, q) => s + q.x, 0) / is.poly.length, y: is.poly.reduce((s, q) => s + q.y, 0) / is.poly.length }; };
    lab(c('shaw'), 'Shaw I.', -20, 0, 10);
    lab({ x: c('orcas').x + 300, y: c('orcas').y - 800 }, 'Orcas I.', 0, 0, 10);
    lab({ x: PLACES.pointCaution.x - 2200, y: PLACES.pointCaution.y }, 'San Juan I.', 0, 0, 10);
    lab(PLACES.pointCaution, 'Pt. Caution', 8, 2, 9.5);
    // Distance and a compass rose.
    const d = nm(routeLength());
    text(this, layout.W - 20, layout.safe.top + 8 + 0, '', 1).setDepth(6);
    const rs = { x: px(layout.W - 56), y: px(this.gy - 70) };
    g.lineStyle(px(1), 0xffffff, 0.6);
    g.strokeCircle(rs.x, rs.y, px(26));
    g.fillStyle(0xffffff, 0.8);
    g.fillTriangle(rs.x - px(4), rs.y, rs.x + px(4), rs.y, rs.x, rs.y - px(30));
    g.fillStyle(0xffffff, 0.35);
    g.fillTriangle(rs.x - px(4), rs.y, rs.x + px(4), rs.y, rs.x, rs.y + px(24));
    text(this, (rs.x / layout.S), rs.y / layout.S - 44, 'N', 11, { weight: '600', origin: [0.5, 0.5] }).setDepth(6);
    text(this, 20, this.gy - 44, `Route ${d.toFixed(1)} nm`, 14, { serif: true, weight: '600', color: CSS.sun }).setDepth(6);
    // Scale bar: one nautical mile.
    const one = px(1852) * (w.ppm / layout.S);
    g.lineStyle(px(2), 0xffffff, 0.8);
    g.lineBetween(px(20), px(this.gy - 22), px(20) + one, px(this.gy - 22));
    text(this, 20, this.gy - 20, '1 nm', 9.5, { color: CSS.fog }).setDepth(6);
  }

  go() {
    const j = judge(this.launch);
    const t = this.t;
    t.launchMinute = this.launch;
    t.minute = this.launch;
    t.record.goodWindow = j.verdict === 'good';
    if (j.verdict === 'good') { lesson('slackWater', 'demonstrated'); award(state.save.skills, 'navigation', 20); }
    sound.unlock();
    go(this, 'Paddle', { mode: 'trip' });
  }

  update(_t, dms) {
    const dt = dms / 1000;
    this.time0 += dt;
    sound.update(dt);
    const m = this.launch;
    this.world.setConditions({ minute: m, wind: wind(m), current: { x: 0, y: 0 }, sea: seaState(m), boat: this.world.cam, time: this.time0 });
  }
}
