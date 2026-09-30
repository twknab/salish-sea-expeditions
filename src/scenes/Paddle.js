// On the water. Two modes:
//  - 'school': calm, shallow water off Friday Harbor for Boat School drills (US0)
//  - 'trip':   the crossing from Friday Harbor to Jones Island (US1, US6, US9)
import Phaser from 'phaser';
import { WorldView, drawOrcas, drawSeals, drawFerry, ring } from '../render/world.js';
import { POV_FRAG } from '../render/povShader.js';
import { daylight } from '../render/waterShader.js';
import { Quality } from '../render/quality.js';
import { TouchControls } from '../ui/touchControls.js';
import { glass, text, meter, iconButton, lessonCard, button, fadeIn } from '../ui/widgets.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { sound } from '../audio/soundscape.js';
import { createKayak, stepKayak } from '../sim/kayak.js';
import { emptyInput, rotationQuality } from '../sim/input.js';
import { stepEnergy } from '../sim/energy.js';
import { award, level } from '../sim/skills.js';
import { createPartner, partnerInput } from '../sim/partner.js';
import { currentAt, kelpAt, ripAt, onLand, shoreDistance } from '../sim/field.js';
import { wind, seaState, windAgainstTide } from '../sim/wind.js';
import { channelCurrentKn } from '../sim/tides.js';
import { toLocal, bearing, angleDiff, knots, nm, clock, deg, clamp } from '../sim/geo.js';
import { PLACES, ROUTE, RIPS, FERRY_ROUTE } from '../content/chart.js';
import { createMover, stepMover } from '../sim/route.js';
import { lessonById } from '../content/lessons.js';
import { DRILLS } from '../content/anatomy.js';
import { speciesById } from '../content/species.js';
import { sightingsAt, createOrcaPass, stepOrcaPass, sealState } from '../sim/wildlife.js';
import { assess, handlingPenalty } from '../sim/packing.js';
import { state, trip, lesson, observe, go, persist } from '../state.js';

const ZOOMS = [90, 240, 700, 2200];

export class Paddle extends Phaser.Scene {
  constructor() { super('Paddle'); }

  init(data) {
    this.mode = data?.mode ?? 'trip';
    this.resume = data?.resume ?? null;
  }

  create() {
    fadeIn(this);
    const school = this.mode === 'school';
    const t = trip();
    this.TS = school ? 1.5 : 8; // sim seconds per real second
    this.minute = school ? 470 : (this.resume?.minute ?? t?.minute ?? t?.launchMinute ?? 480);
    this.visualTime = 0;

    const start = school ? toLocal(48.5392, -123.0178) : PLACES.launch;
    const pack = t ? assess(t.packing) : null;
    this.pack = pack;
    this.player = createKayak({
      x: start.x, y: start.y, heading: school ? 0.3 : -0.35,
      assembly: school ? 1 : t?.assembly ?? 1,
      rocker: t?.rocker ?? 0.35,
      trim: { pitch: pack ? pack.pitch : 0, list: 0 },
    });
    if (this.resume?.kayak) Object.assign(this.player, this.resume.kayak, { upright: true, heel: 0, heelVel: 0 });
    this.partner = createKayak({ x: start.x + 18, y: start.y - 10, heading: this.player.heading });
    this.brain = createPartner();
    this.me = { energy: this.resume?.energy ?? t?.energy ?? 1, fit: state.save.fitScore ?? 0.9, skills: state.save.skills };
    this.partnerPaddler = { energy: 1, fit: 1, skills: { forward: 200, sweep: 200, brace: 200 } };

    this.world = new WorldView(this, { viewW: school ? ZOOMS[0] : ZOOMS[1] });
    this.quality = new Quality(this.game);
    this.zoomIdx = school ? 0 : 1;
    this.world.cam.x = this.player.x; this.world.cam.y = this.player.y;

    this.controls = new TouchControls(this, { height: 196 });
    this.driver = { drive: 0, q: 0.6, bias: 0, lastGesture: -99, accum: 0, side: 'left', phase: 0 };
    this.controls.events.on('touch', () => sound.unlock());

    this.buildHud();
    this.log = { distance: 0, strokesGood: 0, strokesArm: 0, edgeHold: 0, sweepsEdged: 0, braces: 0, turned: 0 };
    this.prompted = new Set(state.save.trip?.prompted ?? []);
    this.seen = new Set(Object.keys(state.save.fieldGuide));
    this.pod = null;
    this.sealMin = Infinity;
    this.sealJudged = false;
    this.ferry = null;
    this.ripKick = 3;
    this.card = null;
    this.arrived = false;
    this.drill = school ? 0 : -1;
    this.drillState = { count: 0, t: 0, startHeading: 0 };

    if (school) this.startDrill(0);
    else {
      this.showLesson('ferries', 3000);
      this.time.delayedCall(6000, () => this.launchFerry());
    }
    sound.ambience({ sea: 0.2, wind: 0.1, rip: 0, surf: 0 });
    this.events.on('relayout', () => this.scene.restart({ mode: this.mode, resume: this.snapshot() }));
    this.events.on('resume', (_s, data) => this.afterRescue(data));
    this.events.once('shutdown', () => sound.night(false));
  }

  // ---------- HUD ----------

  buildHud() {
    const W = layout.W, top = layout.safe.top;
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(30);
    const bg = glass(this, 10, top + 4, W - 20, 84, { alpha: 0.55, radius: 20 });
    this.tClock = text(this, 24, top + 12, '', 21, { serif: true, weight: '600' });
    this.tSpeed = text(this, W - 86, top + 12, '', 21, { serif: true, weight: '600', origin: [1, 0] });
    this.tSpeedLab = text(this, W - 86, top + 38, 'OVER GROUND', 8.5, { color: CSS.mist, tracking: 1, origin: [1, 0] });
    this.tTide = text(this, 24, top + 42, '', 11.5, { color: CSS.mist });
    this.energy = meter(this, 24, top + 68, 96, 6, (v) => (v > 0.35 ? COLOR.good : COLOR.danger));
    this.tEnergy = text(this, 128, top + 63, 'ENERGY', 8.5, { color: CSS.mist, tracking: 1 });
    this.tDist = text(this, W - 86, top + 62, '', 11.5, { color: CSS.sun, origin: [1, 0] });
    this.compass = this.add.graphics();
    this.hud.add([bg, this.tClock, this.tTide, this.tSpeed, this.tSpeedLab, this.compass, this.tDist, this.energy, this.tEnergy]);

    // Right-side buttons: zoom, rocker (hull jacks), rest.
    const y0 = top + 116;
    this.btnZoom = iconButton(this, W - 32, y0, '⤢', () => this.cycleZoom());
    this.btnRest = iconButton(this, W - 32, y0 + 50, '≋', () => this.toggleRest());
    this.btnJack = iconButton(this, W - 32, y0 + 100, '◠', () => this.cycleRocker());
    this.btnView = iconButton(this, W - 32, y0 + 150, '◉', () => this.setPov(!this.pov, true));
    for (const b of [this.btnZoom, this.btnRest, this.btnJack, this.btnView]) b.setScrollFactor(0).setDepth(31);
    this.tJack = text(this, W - 58, y0 + 100, '', 10.5, { color: CSS.mist, origin: [1, 0.5] }).setScrollFactor(0).setDepth(31);
    this.updateJackLabel();

    // Brace / wobble cue (visual twin of the hull-slap sound, FR-025).
    this.cue = text(this, W / 2, layout.H * 0.36, '', 22, { serif: true, weight: '600', color: CSS.sun, origin: [0.5, 0.5] }).setScrollFactor(0).setDepth(35).setAlpha(0);
    this.heelG = this.add.graphics().setScrollFactor(0).setDepth(34);
    this.nav = this.add.graphics().setScrollFactor(0).setDepth(29);
    this.tNote = text(this, W / 2, layout.H - layout.safe.bottom - 214, '', 12.5, { color: CSS.foam, origin: [0.5, 1], wrap: W - 60, align: 'center' }).setScrollFactor(0).setDepth(32);
  }

  updateJackLabel() {
    const r = this.player.rocker;
    this.tJack.setText(r < 0.3 ? 'Hull: long & straight' : r > 0.65 ? 'Hull: rockered, nimble' : 'Hull: balanced');
  }

  cycleZoom() {
    this.zoomIdx = (this.zoomIdx + 1) % ZOOMS.length;
    this.tweens.add({ targets: this.world.cam, viewW: ZOOMS[this.zoomIdx], duration: 700, ease: 'Sine.easeInOut' });
  }

  cycleRocker() {
    const steps = [0.15, 0.4, 0.75];
    const i = steps.findIndex((s) => s > this.player.rocker + 0.01);
    this.player.rocker = steps[i < 0 ? 0 : i];
    this.updateJackLabel();
    if (!this.prompted.has('jacks')) {
      this.prompted.add('jacks');
      this.note('Hull jacks: less rocker tracks straight on a crossing; more rocker turns quickly.');
    }
  }

  toggleRest() {
    this.resting = !this.resting;
    this.btnRest.label.setColor(this.resting ? CSS.sun : CSS.foam);
    this.note(this.resting ? 'Paddle across the deck. Resting.' : '');
  }

  note(msg, ms = 4000) {
    this.tNote.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.tNote);
    if (msg) this.tweens.add({ targets: this.tNote, alpha: 0, delay: ms, duration: 600 });
  }

  showLesson(id, delay = 0, opts = {}) {
    if (this.prompted.has(id) && !opts.force) return;
    this.prompted.add(id);
    this.time.delayedCall(delay, () => {
      this.card?.active && this.card.dismiss();
      const l = lessonById[id] ?? opts.lesson;
      if (!l) return;
      lesson(id, 'met');
      this.card = lessonCard(this, l, { y: layout.safe.top + 98, autoHide: opts.autoHide ?? 9000, depth: 60 });
      this.card.setScrollFactor(0);
    });
  }

  // ---------- Boat School drills ----------

  startDrill(i) {
    this.drill = i;
    this.drillState = { count: 0, t: 0, startHeading: this.player.heading, turned: 0, prev: this.player.heading };
    const d = DRILLS[i];
    if (!d) return;
    this.card?.active && this.card.dismiss();
    this.card = lessonCard(this, { title: d.title, text: `${d.text}\n\nGoal: ${d.goal}.`, sourceIds: ['aca'] }, { y: layout.safe.top + 98, depth: 60 });
    this.card.setScrollFactor(0);
    this.drillBar?.destroy();
    this.drillBar = meter(this, 30, layout.H - layout.safe.bottom - 206, layout.W - 60, 5, COLOR.sun).setScrollFactor(0).setDepth(33);
    this.drillBar.set(0);
    if (d.id === 'brace') this.wobbleTimer = 2.5;
  }

  drillProgress(dt, events) {
    const d = DRILLS[this.drill];
    if (!d) return;
    const s = this.drillState;
    let p = 0;
    if (d.id === 'forward') {
      if (events.includes('strokeGood')) s.count++;
      if (events.includes('strokeArms')) s.count = Math.max(0, s.count - 1);
      p = s.count / 6;
    } else if (d.id === 'edge') {
      s.t = Math.abs(this.player.edge) > 0.6 ? s.t + dt : Math.max(0, s.t - dt * 2);
      p = s.t / 3;
    } else if (d.id === 'sweep') {
      const dh = angleDiff(this.player.heading, s.prev);
      s.prev = this.player.heading;
      if (Math.abs(this.player.edge) > 0.4) s.turned += Math.abs(dh);
      p = s.turned / Math.PI;
    } else if (d.id === 'brace') {
      if (events.includes('braced')) s.count++;
      p = s.count / 3;
    }
    this.drillBar.set(p);
    if (p >= 1) {
      sound.success();
      award(state.save.skills, d.skill, 30);
      const ids = { forward: 'rotation', edge: 'edging', sweep: 'edging', brace: 'hipSnap' };
      lesson(ids[d.id], 'demonstrated');
      if (this.drill + 1 < DRILLS.length) {
        this.note('Nicely done.');
        this.time.delayedCall(900, () => this.startDrill(this.drill + 1));
        this.drill = -2;
      } else {
        this.drill = -2;
        this.finishSchool();
      }
    }
  }

  finishSchool() {
    this.card?.active && this.card.dismiss();
    const c = lessonCard(this, { title: 'Boat School complete', text: 'Power from the torso, control from the hips, head down in a brace. Everything from here builds on this. Next: assemble and pack your own boat for the trip.', sourceIds: ['aca'] }, {
      y: layout.safe.top + 110, depth: 60, action: 'Continue', onAction: () => go(this, 'Assembly'),
    });
    c.setScrollFactor(0);
    persist();
  }

  // ---------- Trip events ----------

  launchFerry() {
    // Outbound: the inbound route in reverse — around the inside of Brown Island, then east.
    this.ferry = createMover([...FERRY_ROUTE].reverse(), 7);
    this.ferry.horn = false;
    sound.horn();
    this.note('A ferry is leaving Friday Harbor. Stay clear of its lane.', 5000);
  }

  stepFerry(dt) {
    const f = this.ferry;
    if (!f) return;
    stepMover(f, dt);
    const d = Math.hypot(f.x - this.player.x, f.y - this.player.y);
    if (d < 220 && !f.horn) {
      f.horn = true;
      sound.horn();
      this.note('Five short blasts would mean danger. Keep clear — ferries cannot stop quickly.', 5000);
    }
    if (f.done) this.ferry = null;
  }

  wildlife(dt) {
    const k = this.player;
    // Sightings.
    for (const id of sightingsAt(k.x, k.y, this.seen)) {
      this.seen.add(id);
      if (observe(id)) this.toast(`Field guide: ${speciesById[id].common}`);
      if (id === 'baldEagle') sound.eagle(0.4);
      if (id === 'pigeonGuillemot' || id === 'rhinoAuklet') sound.gull(-0.3);
    }
    // Seals.
    const rock = PLACES.sealRocks;
    const ds = Math.hypot(k.x - rock.x, k.y - rock.y);
    this.sealMin = Math.min(this.sealMin, ds);
    this.sealStateNow = sealState(this.sealMin < 50 ? 30 : ds);
    if (ds < 420 && !this.prompted.has('sealDistance')) this.showLesson('sealDistance');
    if (ds < 400 && !this.seen.has('harbourSeal')) {
      this.seen.add('harbourSeal');
      if (observe('harbourSeal')) this.toast('Field guide: Harbour seal');
    }
    if (ds > 600 && this.sealMin < 400 && !this.sealJudged) {
      this.sealJudged = true;
      const r = trip()?.record;
      if (r) { if (this.sealMin >= 91) r.respectful++; else r.violations++; }
      this.toast(this.sealMin >= 91 ? 'You gave the seals room. They kept resting.' : 'Too close — the seals were disturbed.');
    }
    // Orcas: pass up the channel once, mid-route.
    if (!this.pod && !this.podDone && k.y > toLocal(48.566, -123.02).y) {
      this.pod = createOrcaPass(k, this.minute);
      this.showLesson('orcaDistance');
      this.orcaBlowT = 0;
      this.prevZoom = this.zoomIdx;
      this.zoomIdx = 3;
      this.tweens.add({ targets: this.world.cam, viewW: 2200, duration: 1400, ease: 'Sine.easeInOut' });
      this.note('Blows to the south! A pod of orcas is coming up the channel. Stop paddling and let them pass.', 7000);
    }
    if (this.pod) {
      const r = stepOrcaPass(this.pod, { x: k.x, y: k.y, vx: k.vx, vy: k.vy }, dt);
      this.podDist = r.distance;
      this.orcaBlowT -= dt / this.TS;
      if (this.orcaBlowT <= 0) {
        this.orcaBlowT = 3 + Math.random() * 3;
        const pan = clamp((this.pod.x - k.x) / 800, -1, 1);
        sound.orcaBlow(pan, clamp(1 - r.distance / 1500, 0.1, 1));
        this.flashCue('Orca blow', CSS.foam);
      }
      if (r.warn && !this.warnedOrca) {
        this.warnedOrca = true;
        sound.warn();
        this.note('Too close — you are paddling toward the whales inside 1,000 yards. Stop and let them pass.', 6000);
      }
      if (this.pod.state === 'gone') {
        const rec = trip()?.record;
        if (rec) { if (this.pod.respectful) rec.respectful++; else rec.violations++; }
        if (observe('orca')) this.toast('Field guide: Orca');
        this.toast(this.pod.respectful ? 'The orcas passed. You gave them room.' : 'The orcas passed — next time, hold still.');
        this.pod = null;
        this.podDone = true;
        this.zoomIdx = this.prevZoom ?? 1;
        this.tweens.add({ targets: this.world.cam, viewW: ZOOMS[this.zoomIdx], duration: 1200 });
      }
    }
  }

  toast(msg) {
    const W = layout.W;
    const y = layout.H - layout.safe.bottom - 250;
    const t = text(this, W / 2, y, msg, 13, { color: CSS.ink, weight: '600', origin: [0.5, 0.5] }).setScrollFactor(0).setDepth(62);
    const bg = this.add.graphics().setScrollFactor(0).setDepth(61);
    const w = t.width + px(28), h = t.height + px(14);
    bg.fillStyle(COLOR.foam, 0.92);
    bg.fillRoundedRect(px(W / 2) - w / 2, px(y) - h / 2, w, h, h / 2);
    for (const o of [t, bg]) {
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 250, yoyo: true, hold: 2600, onComplete: () => o.destroy() });
    }
    sound.success();
  }

  flashCue(msg, color = CSS.sun) {
    this.cue.setText(msg).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.cue);
    this.tweens.add({ targets: this.cue, alpha: 0, delay: 700, duration: 500 });
  }

  // ---------- Capsize and rescue ----------

  capsize() {
    const r = trip()?.record;
    if (r) r.capsizes++;
    sound.splash(1.4);
    this.flashCue('Capsized!', CSS.danger);
    this.controls.setVisible(false);
    this.time.delayedCall(900, () => {
      this.scene.pause();
      this.scene.launch('Rescue', {
        enabled: this.pack ? [...this.pack.enables] : ['pfRescue', 'pumpOut'],
        partnerNear: Math.hypot(this.partner.x - this.player.x, this.partner.y - this.player.y) < 120,
        sea: this.sea ?? 0.3,
        practice: this.mode === 'school',
      });
    });
  }

  afterRescue(data) {
    this.controls.setVisible(true);
    const k = this.player;
    k.upright = true; k.heel = 0; k.heelVel = 0; k.speed = 0;
    k.cockpitWater = data?.water ?? 0;
    this.me.energy = Math.max(0.15, this.me.energy - (data?.energyCost ?? 0.2));
    this.minute += (data?.minutes ?? 5);
    if (data?.ok) {
      const r = trip()?.record;
      if (r) r.rescues++;
    }
    this.ripKick = 8;
  }

  // ---------- Cockpit view (prototype, US8) ----------

  setPov(on, manual = false) {
    this.pov = on;
    if (on && !this.povShader) {
      const W = px(layout.W), H = px(layout.H), m = this.world.mask, k = this.player;
      this.povU = { sun: [0, 1, 0.5], sky: [0.5, 0.6, 0.7], light: [1, 1, 1], day: 1 };
      this.povShader = this.add.shader({
        name: 'pov', fragmentSource: POV_FRAG, initialUniforms: { uMask: 0 },
        setupUniforms: (set) => {
          const u = this.povU;
          set('uMaskMin', [m.minX, m.minY]); set('uMaskSize', [m.width, m.height]);
          set('uBoat', [k.x, k.y]); set('uHeading', k.heading);
          set('uRoll', k.upright ? -k.heel : 0); set('uPitch', Math.sin(this.visualTime * 1.3) * 0.03 * (0.3 + this.sea));
          set('uAspect', layout.W / layout.H); set('uTime', this.visualTime);
          set('uSun', u.sun); set('uSky', u.sky); set('uLightCol', u.light); set('uDay', u.day);
          set('uSea', this.sea ?? 0.1); set('uWind', [this.windNow?.x ?? 0, this.windNow?.y ?? 0]);
        },
      }, W / 2, H / 2, W, H, ['landmask']).setScrollFactor(0).setDepth(20);
      this.bowG = this.add.graphics().setScrollFactor(0).setDepth(21);
    }
    this.povShader?.setVisible(on);
    this.bowG?.setVisible(on);
    this.btnView.label.setColor(on ? CSS.sun : CSS.foam);
    if (on && !manual) this.note('Cockpit view: brace on the low side and snap your hips.', 4000);
  }

  drawBow() {
    const g = this.bowG, W = px(layout.W), H = px(layout.H), k = this.player;
    g.clear();
    const roll = k.upright ? -k.heel : 0;
    const cx = W / 2, by = H * 0.99, horizon = H * 0.39;
    // Points are given relative to the screen centre-line; rotate about the cockpit with the roll.
    const rot = (x, y) => { const dy = y - by; return { x: cx + x * Math.cos(roll) - dy * Math.sin(roll), y: by + x * Math.sin(roll) + dy * Math.cos(roll) }; };
    // The partner, projected into the view.
    const p = this.partner, fw = { x: Math.sin(k.heading), y: Math.cos(k.heading) }, rt = { x: Math.cos(k.heading), y: -Math.sin(k.heading) };
    const rx = p.x - k.x, ry = p.y - k.y, f = rx * fw.x + ry * fw.y, r = rx * rt.x + ry * rt.y;
    if (f > 3) {
      const aspect = layout.W / layout.H;
      const ux = r / f / (aspect * 1.5), uy = (-0.85 / f + 0.22) / 1.5;
      const sx = W / 2 + ux * W, sy = H * (0.5 - uy);
      const sz = Math.min(W * 0.5, (W * 4.9) / f / (aspect * 1.5) / 2.2);
      const q = rot(sx - cx, sy);
      g.fillStyle(0x2d7f86, 1);
      g.fillEllipse(q.x, q.y, sz, sz * 0.12);
      g.fillStyle(0xe9f1ee, 1);
      g.fillRoundedRect(q.x - sz * 0.04, q.y - sz * 0.22, sz * 0.08, sz * 0.2, sz * 0.02);
      g.fillStyle(0xd9c9a3, 1);
      g.fillCircle(q.x, q.y - sz * 0.25, sz * 0.035);
      g.lineStyle(Math.max(1, sz * 0.012), 0x2b2b2b, 1);
      const sw = Math.sin(this.visualTime * 3) * sz * 0.2;
      g.lineBetween(q.x - sz * 0.25, q.y - sz * 0.12 + sw * 0.3, q.x + sz * 0.25, q.y - sz * 0.12 - sw * 0.3);
    }
    // Deck converging toward the bow.
    const deck = [rot(-W * 0.34, H), rot(W * 0.34, H), rot(W * 0.03, horizon + H * 0.2), rot(-W * 0.03, horizon + H * 0.2)];
    g.fillStyle(0xb8402c, 1);
    g.fillPoints(deck, true);
    g.fillStyle(0x16181a, 1);
    const coam = [rot(-W * 0.3, H), rot(W * 0.3, H), rot(W * 0.22, H * 0.9), rot(-W * 0.22, H * 0.9)];
    g.fillPoints(coam, true);
    g.lineStyle(px(2), 0x111111, 0.8);
    for (const f of [0.72, 0.64]) { const a = rot(-W * 0.1, H * f), b = rot(W * 0.1, H * (f - 0.04)); g.lineBetween(a.x, a.y, b.x, b.y); const c = rot(W * 0.1, H * f), d = rot(-W * 0.1, H * (f - 0.04)); g.lineBetween(c.x, c.y, d.x, d.y); }
    // Paddle shaft sweeping with the stroke.
    const ph = Math.sin(this.driver.phase * Math.PI * 2);
    const a = rot(-W * 0.62 + ph * W * 0.1, H * 0.82 + ph * H * 0.03), b = rot(W * 0.62 + ph * W * 0.1, H * 0.82 - ph * H * 0.03);
    g.lineStyle(px(9), 0x2b2b2b, 1);
    g.lineBetween(a.x, a.y, b.x, b.y);
    g.fillStyle(0xd9c9a3, 1);
    const h1 = rot(-W * 0.2 + ph * W * 0.1, H * 0.84), h2 = rot(W * 0.2 + ph * W * 0.1, H * 0.8);
    g.fillCircle(h1.x, h1.y, px(13)); g.fillCircle(h2.x, h2.y, px(13));
  }

  snapshot() {
    return { minute: this.minute, kayak: { x: this.player.x, y: this.player.y, heading: this.player.heading }, energy: this.me.energy };
  }

  // ---------- Frame ----------

  update(_t, dms) {
    const dt = Math.min(0.05, dms / 1000);
    this.visualTime += dt;
    sound.update(dt);
    this.controls.update();
    const input = this.controls.poll();
    const k = this.player;
    const school = this.mode === 'school';

    // Player gestures → drive level and steering (a gesture stands for a few real strokes).
    const drv = this.driver;
    for (const s of input.strokes) {
      if (s.kind === 'forward') {
        const q = rotationQuality(s);
        drv.q = drv.q * 0.6 + q * 0.4;
        drv.drive = Math.min(1, drv.drive + 0.55);
        drv.bias = clamp(drv.bias * 0.5 + (s.side === 'left' ? 0.5 : -0.5), -1, 1); // left strokes turn right
        drv.lastGesture = this.visualTime;
        drv.pendingStroke = s;
        sound.stroke(q, s.side === 'left' ? -0.5 : 0.5);
      } else {
        drv.pendingOther = s;
        sound.stroke(0.6, s.side === 'left' ? -0.5 : 0.5);
      }
      this.resting = false;
      this.btnRest.label.setColor(CSS.foam);
    }
    drv.drive *= Math.pow(school ? 0.55 : 0.72, dt); // fades without new strokes
    drv.bias *= Math.pow(0.4, dt);

    // Simulate in sub-steps of ≤ 0.1 sim-seconds.
    const simDt = dt * this.TS;
    const n = Math.max(1, Math.ceil(simDt / 0.1));
    const sdt = simDt / n;
    let events = [];
    let sea = 0;
    for (let i = 0; i < n; i++) {
      const cur = school ? { x: 0, y: 0, kn: 0, scale: 0, eddy: 0, shore: 50 } : currentAt(this.minute, k.x, k.y);
      const w = school ? { x: 0.3, y: 0.4, kn: 1 } : wind(this.minute);
      const rip = school ? 0 : ripAt(k.x, k.y) * clamp(Math.abs(cur.kn) / 1.2, 0, 1.2);
      sea = school ? 0.05 : clamp(seaState(this.minute, cur.scale) + rip * 0.55, 0, 1);
      this.sea = sea; this.rip = rip; this.cur = cur; this.windNow = w;
      const env = { time: this.visualTime, current: cur, wind: w, sea };
      const inp = emptyInput();
      inp.edge = input.edge; inp.brace = input.brace; inp.hipSnap = i === 0 && input.hipSnap; inp.headDown = input.headDown;
      if (i === 0 && drv.pendingStroke) {
        inp.stroke = { ...drv.pendingStroke, weight: school ? 1 : 1.3 };
        drv.pendingStroke = null;
        drv.accum = 0;
      } else if (i === 0 && drv.pendingOther) {
        inp.stroke = { ...drv.pendingOther, weight: school ? 1.3 : 2.2 };
        drv.pendingOther = null;
      } else if (!school && drv.drive > 0.08 && k.upright) {
        // Keep paddling at the rhythm and quality the player set.
        drv.accum += sdt;
        if (drv.accum > 0.8) {
          drv.accum = 0;
          const side = Math.abs(drv.bias) > 0.25 ? (drv.bias > 0 ? 'left' : 'right') : drv.side;
          drv.side = drv.side === 'left' ? 'right' : 'left';
          inp.stroke = { side, kind: 'forward', reach: drv.q, smoothness: drv.q, exitAtHip: drv.q > 0.5, weight: 0.4 + 0.6 * drv.drive };
        }
      }
      const res = stepKayak(k, inp, env, this.me, sdt, dt / n);
      events.push(...res.events);
      const shelter = Math.max(kelpAt(k.x, k.y), cur.eddy ?? 0, shoreDistance(k.x, k.y) < 60 ? 0.4 : 0);
      this.shelter = shelter;
      const restingNow = this.resting || (drv.drive < 0.08 && this.visualTime - drv.lastGesture > 2);
      this.me.energy = stepEnergy(this.me.energy, { cost: res.cost * (school ? 0.3 : 1), resting: restingNow, shelter }, sdt);
      if (restingNow && kelpAt(k.x, k.y) > 0.2) { k.speed *= 0.9; } // holding onto the kelp

      // Partner.
      if (!school || true) {
        const pc = school ? { x: 0, y: 0 } : currentAt(this.minute, this.partner.x, this.partner.y);
        const pin = partnerInput(this.brain, { me: this.partner, player: k, current: pc, playerResting: restingNow, playerCapsized: !k.upright }, sdt);
        stepKayak(this.partner, pin, { ...env, current: pc }, this.partnerPaddler, sdt, 0);
        this.partnerResting = pin.rest;
        if (pin.stroke) this.brain.phase = (this.brain.phase ?? 0) + 0.5;
      }
      this.minute += sdt / 60;
      this.log.distance += Math.hypot(k.vx, k.vy) * sdt;
      // Don't paddle through islands.
      if (onLand(k.x, k.y)) { k.x -= k.vx * sdt * 1.5; k.y -= k.vy * sdt * 1.5; k.speed *= -0.2; sound.hullSlap(); }
      if (onLand(this.partner.x, this.partner.y)) { this.partner.x -= this.partner.vx * sdt * 1.5; this.partner.y -= this.partner.vy * sdt * 1.5; this.partner.speed = 0; }
    }

    // Events: strokes, wobbles, braces, capsize.
    for (const e of events) {
      if (e === 'strokeGood') this.log.strokesGood++;
      if (e === 'strokeArms') this.log.strokesArm++;
      if (e === 'wobble') { sound.hullSlap(); this.flashCue('Brace!'); }
      if (e === 'braced') { this.log.braces++; award(state.save.skills, 'brace', 6); this.flashCue('Braced', CSS.good); sound.splash(0.4); }
    }
    if (events.includes('capsize')) { this.capsize(); return; }
    if (school) this.drillProgress(dt, events);
    if (Math.abs(k.edge) > 0.5) this.log.edgeHold += dt;

    // Brace drill and tide rips: waves that knock the boat.
    if (school && DRILLS[this.drill]?.id === 'brace') {
      this.wobbleTimer -= dt;
      if (this.wobbleTimer <= 0) { this.wobbleTimer = 3.2; this.kick(1.5); }
    }
    if (!school && this.rip > 0.25) {
      this.ripKick -= dt;
      if (this.ripKick <= 0) { this.ripKick = 3.5 + Math.random() * 2.5; this.kick(1.2 + this.rip * 1.1); }
      if (!this.prompted.has('rips')) this.showLesson('rips');
      if (state.save.settings.pov && !this.povAuto && !this.pov) { this.povAuto = true; this.setPov(true); }
    }
    if (!school && this.povAuto && this.pov && this.rip < 0.05) { this.povAuto = 'done'; this.setPov(false); }

    if (!school) {
      this.stepFerry(simDt);
      this.wildlife(simDt);
      this.teach();
      this.checkArrival();
    }

    // Night music after dark.
    const m = this.minute % 1440, dark = m > 1285 || m < 320;
    if (dark !== this.dark) { this.dark = dark; sound.night(dark && state.save.settings.nightMusic !== false); }

    // Save the position now and then, so Continue picks up mid-crossing.
    this.saveT = (this.saveT ?? 0) + dt;
    if (!school && this.saveT > 5 && trip()) {
      this.saveT = 0;
      const t = trip();
      t.minute = this.minute;
      t.kayak = { x: k.x, y: k.y, heading: k.heading };
      t.energy = this.me.energy;
      t.prompted = [...this.prompted];
      persist();
    }

    // Skills for good technique.
    if (this.log.strokesGood && this.log.strokesGood % 20 === 0 && this.lastAward !== this.log.strokesGood) {
      this.lastAward = this.log.strokesGood;
      award(state.save.skills, 'forward', 8);
    }

    this.render(dt, input);
  }

  kick(strength) {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.player.heelVel += side * strength;
    sound.hullSlap(side * 0.6);
    this.flashCue(side > 0 ? 'Brace right!' : 'Brace left!');
  }

  teach() {
    const k = this.player;
    // Ferry angle: if the current is carrying the boat well off its heading.
    const cs = Math.hypot(this.cur.x, this.cur.y);
    if (cs > 0.25 && Math.hypot(k.vx, k.vy) > 0.4) {
      const track = Math.atan2(k.vx, k.vy);
      const drift = Math.abs(angleDiff(track, k.heading));
      if (drift > 0.25) this.showLesson('ferryAngle');
    }
    if (this.me.energy < 0.55 && this.shelter > 0.2) this.showLesson(kelpAt(k.x, k.y) > 0.2 ? 'kelpRest' : 'eddyRest');
    if (windAgainstTide(this.minute) && !this.prompted.has('windAgainstTide')) this.showLesson('windAgainstTide');
  }

  checkArrival() {
    const d = PLACES.destination;
    const dist = Math.hypot(this.player.x - d.x, this.player.y - d.y);
    if (dist < 140 && !this.arrived) {
      this.arrived = true;
      const t = trip();
      t.minute = this.minute;
      t.record.nm = nm(this.log.distance);
      t.energy = this.me.energy;
      award(state.save.skills, 'navigation', 25);
      sound.success();
      const c = lessonCard(this, { title: 'Jones Island', text: `You made it — ${nm(this.log.distance).toFixed(1)} nautical miles from Friday Harbor. Land on the south cove beach and make camp.`, sourceIds: ['wa-parks-jones'] }, {
        y: layout.safe.top + 110, depth: 60, action: 'Land & make camp', onAction: () => go(this, 'Camp'),
      });
      c.setScrollFactor(0);
    }
  }

  // ---------- Drawing ----------

  render(dt, input) {
    const k = this.player, w = this.world;
    w.u.q = this.quality.update(dt);
    const lead = { x: k.vx * 6, y: k.vy * 6 + w.cam.viewW * 0.12 };
    w.follow(k.x, k.y, lead, dt);
    const ripStrength = RIPS.map((r) => clamp(Math.abs(channelCurrentKn(this.minute)) / 1.2, 0, 1.2) * (this.mode === 'school' ? 0 : 1));
    w.setConditions({
      minute: this.minute, wind: this.windNow, current: this.cur, sea: this.sea,
      boat: k, time: this.visualTime, ripStrength, fog: 0,
    });
    const drv = this.driver;
    drv.phase += dt * (0.4 + 0.9 * drv.drive) * (k.upright ? 1 : 0);
    const restingNow = this.resting || drv.drive < 0.08;
    w.drawWakes([['p', k], ['q', this.partner]], dt);
    w.overG.clear();

    if (this.mode === 'trip') {
      drawSeals(w, PLACES.sealRocks, this.sealStateNow ?? 'resting', this.visualTime);
      ring(w, PLACES.sealRocks.x, PLACES.sealRocks.y, 91, COLOR.sun, 0.25);
      if (this.pod) { drawOrcas(w, this.pod, this.visualTime); ring(w, k.x, k.y, 914, COLOR.danger, 0.35); }
      if (this.ferry) drawFerry(w, this.ferry);
      // Destination marker.
      const d = w.toScreen(PLACES.destination.x, PLACES.destination.y);
      w.overG.lineStyle(px(2), COLOR.sun, 0.8);
      w.overG.strokeCircle(d.x, d.y, px(9) + Math.sin(this.visualTime * 2) * px(2));
    }
    w.drawBoat('q', this.partner, { hull: 0x2d7f86, pfd: 0xe9f1ee, phase: this.brain.phase ?? 0, resting: this.partnerResting });
    w.drawBoat('p', k, { phase: drv.phase, resting: restingNow && drv.drive < 0.02 });

    // HUD.
    this.tClock.setText(clock(this.minute));
    if (this.mode === 'trip') {
      const kn = channelCurrentKn(this.minute);
      const phase = Math.abs(kn) < 0.2 ? 'Slack' : kn > 0 ? 'Flood' : 'Ebb';
      const here = Math.abs(this.cur.kn).toFixed(1);
      this.tTide.setText(`${phase} · here ${here} kn · wind ${Math.round(this.windNow.kn)} kn`);
      const d = PLACES.destination;
      this.tDist.setText(`${nm(Math.hypot(d.x - k.x, d.y - k.y)).toFixed(1)} nm to Jones`);
    } else {
      this.tTide.setText('Boat School · calm water');
      this.tDist.setText('');
    }
    this.tSpeed.setText(`${knots(Math.hypot(k.vx, k.vy)).toFixed(1)} kn`);
    this.energy.set(this.me.energy);
    if (this.pov) {
      const d = daylight(this.minute);
      Object.assign(this.povU, { sun: d.sun, sky: d.sky, light: d.light, day: d.day });
      this.drawBow();
    }
    this.drawCompass();
    this.drawHeel();
    this.drawNav();
    sound.ambience({
      sea: clamp(0.15 + this.sea * 0.9, 0, 1), wind: clamp(this.windNow.kn / 18, 0, 1), rip: clamp(this.rip, 0, 1),
      surf: clamp(1 - shoreDistance(k.x, k.y) / 150, 0, 1) * 0.6,
    });
  }

  drawCompass() {
    const g = this.compass, W = layout.W, top = layout.safe.top;
    const cx = px(W - 46), cy = px(top + 46), r = px(22);
    g.clear();
    g.lineStyle(px(1), 0xffffff, 0.35);
    g.strokeCircle(cx, cy, r);
    // North tick
    g.fillStyle(COLOR.madrona, 1);
    g.fillTriangle(cx - px(3), cy - r + px(1), cx + px(3), cy - r + px(1), cx, cy - r - px(5));
    // Heading needle
    const h = this.player.heading;
    g.lineStyle(px(2), COLOR.foam, 1);
    g.lineBetween(cx, cy, cx + Math.sin(h) * r * 0.85, cy - Math.cos(h) * r * 0.85);
    // Current arrow
    if (this.cur && Math.hypot(this.cur.x, this.cur.y) > 0.05) {
      const a = Math.atan2(this.cur.x, this.cur.y);
      g.lineStyle(px(2), COLOR.sun, 0.9);
      g.lineBetween(cx - Math.sin(a) * r * 0.5, cy + Math.cos(a) * r * 0.5, cx + Math.sin(a) * r * 0.6, cy - Math.cos(a) * r * 0.6);
    }
  }

  drawHeel() {
    const g = this.heelG;
    g.clear();
    const heel = this.player.heel;
    if (Math.abs(heel) < 0.2 || !this.player.upright) return;
    const W = layout.W;
    const cx = px(W / 2), cy = px(layout.H * 0.36 + 34), r = px(46);
    const danger = Math.abs(heel) > 0.62;
    g.lineStyle(px(3), danger ? COLOR.danger : COLOR.sun, 0.8);
    g.beginPath();
    g.arc(cx, cy, r, -Math.PI / 2 - 1.2, -Math.PI / 2 + 1.2);
    g.strokePath();
    g.lineStyle(px(4), COLOR.foam, 1);
    g.lineBetween(cx, cy, cx + Math.sin(heel) * r, cy - Math.cos(heel) * r);
  }

  drawNav() {
    const g = this.nav;
    g.clear();
    if (this.mode !== 'trip' || this.pov) return;
    // A faint line toward the destination, and the next waypoint on the suggested route.
    const k = this.player, w = this.world;
    const d = PLACES.destination;
    const s0 = w.toScreen(k.x, k.y), s1 = w.toScreen(d.x, d.y);
    const len = Math.hypot(s1.x - s0.x, s1.y - s0.y);
    const cap = Math.min(len, px(160));
    g.lineStyle(px(1.5), COLOR.sun, 0.45);
    g.lineBetween(s0.x, s0.y, s0.x + ((s1.x - s0.x) / len) * cap, s0.y + ((s1.y - s0.y) / len) * cap);
    if (this.zoomIdx >= 2) {
      g.lineStyle(px(1), 0xffffff, 0.25);
      for (let i = 1; i < ROUTE.length; i++) {
        const a = w.toScreen(ROUTE[i - 1].x, ROUTE[i - 1].y), b = w.toScreen(ROUTE[i].x, ROUTE[i].y);
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }
}
