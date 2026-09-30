// Capsize and rescue (US2). Runs over the paused Paddle scene. Choose a rescue; for each step pick
// the right next step (learning the order), then perform its gesture. The cold-water clock runs on
// simulated time: each step takes as long as it would in the water.
import Phaser from 'phaser';
import { text, button, glass, lessonCard, meter } from '../ui/widgets.js';
import { GesturePad } from '../ui/gesture.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { RESCUES, availableRescues, stepChoices, stepSucceeds } from '../sim/rescue.js';
import { coldStage, coldStrength } from '../sim/coldWater.js';
import { level, award } from '../sim/skills.js';
import { lessonById } from '../content/lessons.js';
import { state, lesson, persist } from '../state.js';
import { sound } from '../audio/soundscape.js';

const BLURB = {
  roll: 'Fastest — you never leave the boat. Hard to learn, easy to miss.',
  paddleFloat: 'Solo re-entry using your paddle as an outrigger.',
  scramble: 'Solo re-entry with no float. Possible, but much harder in waves.',
  tRescue: 'Your partner drains and steadies your kayak. The surest option.',
};

export class Rescue extends Phaser.Scene {
  constructor() { super('Rescue'); }

  init(data) {
    this.opts = data ?? {};
    this.seconds = 0;
    this.enabled = new Set(this.opts.enabled ?? []);
    this.tried = new Set();
  }

  create() {
    const W = layout.W, H = layout.H;
    // Underwater tint over the paused world.
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x06303a, 0x06303a, 0x031c22, 0x031c22, 0.82, 0.82, 0.95, 0.95);
    shade.fillRect(0, 0, px(W), px(H));
    this.bubbles = this.add.graphics();
    this.bubbleT = 0;
    const top = layout.safe.top;
    this.title = text(this, W / 2, top + 20, this.opts.practice ? 'Rescue practice' : 'Capsized', 28, { serif: true, weight: '600', origin: [0.5, 0] });
    // Cold-water clock (1-10-1).
    glass(this, 16, top + 66, W - 32, 78, { alpha: 0.6 });
    this.stageT = text(this, 30, top + 76, '', 15, { weight: '600', color: CSS.sun });
    this.stageB = text(this, 30, top + 98, '', 12, { color: CSS.fog, wrap: W - 130 });
    this.clockT = text(this, W - 30, top + 76, '', 20, { serif: true, weight: '600', origin: [1, 0] });
    this.clockBar = meter(this, 30, top + 134, W - 60, 4, (v) => (v < 0.5 ? COLOR.good : v < 0.85 ? COLOR.sun : COLOR.danger));
    this.layer = [];
    lesson('coldWater');
    this.updateClock();
    this.chooseRescue();
    sound.ambience({ sea: 0.1, wind: 0, rip: 0, surf: 0 });
  }

  updateClock() {
    const st = coldStage(this.seconds);
    this.stageT.setText(`1 · 10 · 1 — ${st.title}`);
    this.stageB.setText(st.text);
    const m = Math.floor(this.seconds / 60), s = Math.floor(this.seconds % 60);
    this.clockT.setText(`${m}:${String(s).padStart(2, '0')}`);
    this.clockBar.set(Math.min(1, this.seconds / 600));
  }

  pass(seconds) {
    this.seconds += seconds;
    this.updateClock();
  }

  clear() {
    this.layer.forEach((o) => o.destroy());
    this.layer = [];
    this.pad?.destroy();
    this.pad = null;
  }

  chooseRescue() {
    this.clear();
    const W = layout.W;
    const avail = availableRescues(this.enabled, this.opts.partnerNear ?? true).filter((id) => !this.tried.has(id) || id !== 'roll');
    let y = layout.safe.top + 168;
    this.layer.push(text(this, W / 2, y, 'Choose your rescue', 17, { serif: true, weight: '600', origin: [0.5, 0] }));
    y += 34;
    const all = ['roll', 'paddleFloat', 'scramble', 'tRescue'];
    for (const id of all) {
      const ok = avail.includes(id);
      const r = RESCUES[id];
      const why = !ok ? (id === 'paddleFloat' ? 'No paddle float — it was left on the beach.' : id === 'tRescue' ? 'Your partner is too far away.' : 'Already tried.') : BLURB[id];
      const g = glass(this, 16, y, W - 32, 74, { alpha: ok ? 0.72 : 0.35 });
      const t1 = text(this, 32, y + 12, r.title, 16, { weight: '600', color: ok ? CSS.foam : CSS.mist });
      const t2 = text(this, 32, y + 36, why, 12, { color: ok ? CSS.fog : CSS.mist, wrap: W - 70 });
      this.layer.push(g, t1, t2);
      if (ok) {
        const zone = this.add.zone(px(16), px(y), px(W - 32), px(74)).setOrigin(0).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => { sound.ui('tap'); this.start(id); });
        this.layer.push(zone);
      }
      y += 84;
    }
    if (!avail.length) this.partnerSaves();
  }

  async start(id) {
    this.clear();
    this.rescue = id;
    this.tried.add(id);
    const r = RESCUES[id];
    lesson(r.lessonId);
    const W = layout.W;
    this.head = text(this, W / 2, layout.safe.top + 166, r.title, 18, { serif: true, weight: '600', origin: [0.5, 0], color: CSS.sun });
    this.layer.push(this.head);
    const skillLevel = level(state.save.skills[r.skill] ?? 0);
    for (let i = 0; i < r.steps.length; i++) {
      const step = r.steps[i];
      const picked = await this.pickStep(id, i);
      if (!picked) return;
      this.pad = this.pad ?? new GesturePad(this, { x: W / 2, y: layout.H - layout.safe.bottom - 150, r: 92 });
      this.stepLabel?.destroy();
      this.stepLabel = text(this, W / 2, layout.H - layout.safe.bottom - 272, step.label, 15, { weight: '600', origin: [0.5, 0.5], align: 'center', wrap: W - 50 });
      this.layer.push(this.stepLabel);
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        const q = await this.pad.ask(step.gesture);
        this.pass(step.seconds * (attempt ? 0.7 : 1));
        ok = stepSucceeds(id, q, { sea: this.opts.sea ?? 0.2, secondsInWater: this.seconds, skillLevel, fit: state.save.fitScore ?? 0.8 });
        if (!ok) {
          sound.warn();
          this.stepLabel.setText(`${step.label}\n${attempt < 2 ? 'It slipped — try again.' : ''}`);
          if (id === 'roll') break;
        } else sound.success();
      }
      if (!ok) {
        if (id === 'roll') {
          this.note('The roll failed. Wet exit — and choose another rescue.');
          this.pass(10);
          this.time.delayedCall(1200, () => this.chooseRescue());
          return;
        }
        if (this.seconds > 1500) return this.partnerSaves();
        this.note('Cold hands, a missed move. Keep hold of the boat and try again.');
        i--;
        continue;
      }
    }
    this.finish(true);
  }

  pickStep(id, index) {
    const W = layout.W;
    this.choices?.forEach((o) => o.destroy());
    this.choices = [];
    const opts = stepChoices(id, index, Math.floor(this.seconds) % 5);
    if (opts.length <= 1 || RESCUES[id].steps.length <= 1) return Promise.resolve(true);
    let y = layout.safe.top + 200;
    const q = text(this, W / 2, y, `Step ${index + 1} of ${RESCUES[id].steps.length}: what next?`, 13, { color: CSS.fog, origin: [0.5, 0] });
    this.choices.push(q);
    y += 26;
    return new Promise((res) => {
      opts.forEach((s) => {
        const b = button(this, W / 2, y + 22, s.label, () => {
          if (s === RESCUES[id].steps[index]) {
            this.choices.forEach((o) => o.destroy());
            this.choices = [];
            res(true);
          } else {
            sound.warn();
            this.pass(20);
            b.setEnabled(false);
            this.note('Not yet — that step comes at a different point. Every wrong move is time in cold water.');
          }
        }, { primary: false, w: W - 40, h: 46, size: 13.5 });
        this.choices.push(b);
        y += 54;
      });
    });
  }

  note(msg) {
    this.noteT?.destroy();
    this.noteT = text(this, layout.W / 2, layout.H - layout.safe.bottom - 30, msg, 12.5, { color: CSS.sun, origin: [0.5, 1], align: 'center', wrap: layout.W - 40 });
    this.layer.push(this.noteT);
  }

  partnerSaves() {
    this.clear();
    this.note('');
    this.finish(false, true);
  }

  finish(ok, rescuedByPartner = false) {
    this.clear();
    this.choices?.forEach((o) => o.destroy());
    const r = RESCUES[this.rescue] ?? RESCUES.tRescue;
    if (ok) {
      award(state.save.skills, r.skill, this.rescue === 'roll' ? 40 : 25);
      lesson(r.lessonId, 'demonstrated');
      if (r.steps.at(-1)?.id === 'pump') lesson('pumpOut', 'demonstrated');
    }
    persist();
    const mins = Math.round(this.seconds / 60);
    const body = rescuedByPartner
      ? `Your partner rafted up, stabilised your boat and got you back in after ${mins} minutes in the water. In real life, this is when you call for help on the VHF. Practise rescues in warm, calm water until they are automatic.`
      : `${this.rescue === 'roll' ? 'Rolled up in seconds.' : `Back in the boat after ${mins} minute${mins === 1 ? '' : 's'} in the water.`} ${this.seconds > 600 ? 'That was past the ten useful minutes — simpler, faster rescues save strength.' : 'Well inside the ten useful minutes.'}`;
    const c = lessonCard(this, { title: rescuedByPartner ? 'Rescued' : 'Upright again', text: body, sourceIds: ['coldwater', 'aca'] }, {
      y: layout.safe.top + 190, depth: 80, action: 'Keep paddling', onAction: () => this.done(ok),
    });
    this.layer.push(c);
  }

  done(ok) {
    const water = this.rescue === 'roll' ? 0.05 : 0.15;
    const paused = this.scene.get(this.opts.return ?? 'Paddle');
    this.scene.stop();
    this.scene.resume(this.opts.return ?? 'Paddle', { ok, water, minutes: Math.max(1, this.seconds / 60), energyCost: 0.1 + 0.25 * (1 - coldStrength(this.seconds)) + this.seconds / 3000 });
    paused?.events.emit('rescued');
  }

  update(_t, dms) {
    const dt = dms / 1000;
    sound.update(dt);
    // Rising bubbles.
    this.bubbleT += dt;
    const g = this.bubbles;
    g.clear();
    for (let i = 0; i < 26; i++) {
      const x = ((i * 97) % 390) / 390;
      const y = 1 - (((this.bubbleT * (0.05 + (i % 5) * 0.02)) + i * 0.13) % 1);
      g.fillStyle(0xffffff, 0.08 + (i % 3) * 0.04);
      g.fillCircle(px(layout.W * x), px(layout.H * y), px(1.5 + (i % 4)));
    }
  }
}
