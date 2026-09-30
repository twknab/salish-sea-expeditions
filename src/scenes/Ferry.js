// The walk-on ferry into Friday Harbor (US7): the bagged kayak rides as luggage; spot the islands
// from the deck and learn to read the route on the chart.
import Phaser from 'phaser';
import { WorldView, drawFerry } from '../render/world.js';
import { text, button, lessonCard, fadeIn } from '../ui/widgets.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { toLocal } from '../sim/geo.js';
import { FERRY_ROUTE } from '../content/chart.js';
import { createMover, stepMover, pathLength, pointAt } from '../sim/route.js';
import { wind } from '../sim/wind.js';
import { sound } from '../audio/soundscape.js';
import { lessonById } from '../content/lessons.js';
import { PLACES_INFO } from '../content/places.js';
import { lesson, go } from '../state.js';

const SPOTS = [
  { id: 'shaw', name: 'Shaw Island', ...toLocal(48.566, -122.955) },
  { id: 'turn', name: 'Turn Island', ...toLocal(48.5322, -122.9710) },
  { id: 'brown', name: 'Brown Island', ...toLocal(48.5378, -123.0045) },
  { id: 'sanJuan', name: 'San Juan Island', ...toLocal(48.528, -123.03) },
  { id: 'labs', name: 'Friday Harbor Laboratories', ...toLocal(48.5455, -123.0150) },
  { id: 'fridayHarbor', name: 'Friday Harbor', ...toLocal(48.5345, -123.0165) },
];

export class Ferry extends Phaser.Scene {
  constructor() { super('Ferry'); }

  create() {
    fadeIn(this);
    this.world = new WorldView(this, { viewW: 2600 });
    // Across the channel, round the inside (north-west) of Brown Island, into the terminal.
    this.f = createMover(FERRY_ROUTE, 0);
    this.routeLen = pathLength(FERRY_ROUTE);
    const mid = pointAt(FERRY_ROUTE, this.routeLen * 0.6);
    this.world.cam.x = mid.x; this.world.cam.y = mid.y;
    this.t = 0; this.p = 0;
    this.spotted = new Set();
    this.pins = this.add.graphics().setDepth(20);
    this.labels = SPOTS.map((s) => text(this, 0, 0, s.name, 12, { weight: '600', origin: [0.5, 1] }).setDepth(21).setAlpha(0));
    this.hint = text(this, layout.W / 2, layout.H - layout.safe.bottom - 120, 'Tap the markers to spot the islands from the deck.', 13, { color: CSS.fog, origin: [0.5, 0.5], align: 'center', wrap: layout.W - 60 }).setDepth(21);
    this.card = lessonCard(this, { title: 'Walk-on with a folding kayak', text: 'Your kayak is packed in its travel bag — it rides the ferry as luggage. No car, no roof rack: the islands are open to you on foot.', sourceIds: ['wsf', 'trak'] }, { y: layout.safe.top + 16, autoHide: 7000 });
    this.time.delayedCall(7600, () => { lesson('chartReading'); this.card = lessonCard(this, lessonById.chartReading, { y: layout.safe.top + 16, autoHide: 9000 }); });
    this.input.on('pointerdown', (p) => this.tap(p));
    sound.horn();
  }

  tap(p) {
    sound.unlock();
    for (const [i, s] of SPOTS.entries()) {
      const sp = this.world.toScreen(s.x, s.y);
      if (Math.hypot(sp.x - p.x, sp.y - p.y) < px(34) && !this.spotted.has(s.id)) {
        this.spotted.add(s.id);
        sound.success();
        const info = PLACES_INFO.find((x) => x.id === s.id);
        if (info) { this.card?.active && this.card.dismiss(); this.card = lessonCard(this, { title: info.name, text: info.text, sourceIds: info.sourceIds }, { y: layout.safe.top + 16, autoHide: 7000 }); }
        this.labels[i].setAlpha(1);
      }
    }
    if (this.spotted.size >= 3 && !this.done) {
      this.done = true;
      this.hint.setText('');
      button(this, layout.W / 2, layout.H - layout.safe.bottom - 70, 'Walk off in Friday Harbor', () => go(this, 'BoatSchool')).setDepth(30);
    }
  }

  update(_t, dms) {
    const dt = dms / 1000;
    this.t += dt;
    this.p = Math.min(1, this.p + dt / 70);
    const e = this.p * this.p * (3 - 2 * this.p);
    // Ease in and out along the route, turning smoothly at the waypoints.
    this.f.dist = e * this.routeLen;
    stepMover(this.f, dt);
    sound.update(dt);
    sound.ambience({ sea: 0.4, wind: 0.35 });
    const w = this.world;
    w.follow(this.f.x, this.f.y, { x: 0, y: 0 }, dt * 0.3);
    w.setConditions({ minute: 430 + this.t * 0.5, wind: wind(430), current: { x: -0.2, y: -0.3 }, sea: 0.2, boat: this.f, time: this.t, fog: 0.25 });
    w.overG.clear();
    w.drawWakes([['f', { x: this.f.x, y: this.f.y, heading: this.f.heading, speed: 4, upright: true }]], dt);
    drawFerry(w, this.f);
    this.pins.clear();
    for (const [i, s] of SPOTS.entries()) {
      const sp = w.toScreen(s.x, s.y);
      const seen = this.spotted.has(s.id);
      this.pins.fillStyle(seen ? COLOR.good : COLOR.sun, 0.9);
      this.pins.fillCircle(sp.x, sp.y, px(seen ? 5 : 7 + Math.sin(this.t * 3 + i) * 1.5));
      this.pins.lineStyle(px(1.5), 0xffffff, 0.8);
      this.pins.strokeCircle(sp.x, sp.y, px(10));
      this.labels[i].setPosition(sp.x, sp.y - px(12));
    }
  }
}
