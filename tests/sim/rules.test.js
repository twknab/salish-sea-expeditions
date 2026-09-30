import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableRescues, stepChoices, stepSucceeds, RESCUES } from '../../src/sim/rescue.js';
import { coldStage, coldStrength } from '../../src/sim/coldWater.js';
import { assess, emptyPacking } from '../../src/sim/packing.js';
import { assemblyQuality, ASSEMBLY_STEPS } from '../../src/sim/assembly.js';
import { night } from '../../src/sim/camp.js';
import { tripScore } from '../../src/sim/score.js';
import { load, save, freshSave, SAVE_KEY } from '../../src/sim/save.js';
import { sealState, createOrcaPass, stepOrcaPass } from '../../src/sim/wildlife.js';

test('without a paddle float, self-rescue is still possible (the scramble), just harder', () => {
  const r = availableRescues(new Set(), false);
  assert.ok(r.includes('scramble') && r.includes('roll'));
  assert.ok(!r.includes('paddleFloat') && !r.includes('tRescue'));
  assert.ok(RESCUES.scramble.difficulty > RESCUES.paddleFloat.difficulty);
  assert.ok(availableRescues(new Set(['pfRescue']), true).includes('tRescue'));
});

test('every rescue ends by pumping out (except the roll, which never floods)', () => {
  for (const [id, r] of Object.entries(RESCUES)) if (id !== 'roll') assert.equal(r.steps.at(-1).id, 'pump');
});

test('step choices always contain the correct next step', () => {
  for (const id of Object.keys(RESCUES)) {
    RESCUES[id].steps.forEach((s, i) => {
      for (let seed = 0; seed < 5; seed++) {
        const c = stepChoices(id, i, seed);
        assert.ok(c.includes(s)); assert.equal(new Set(c).size, c.length);
      }
    });
  }
});

test('cold water: strength holds for ten minutes, then fades', () => {
  assert.equal(coldStage(30).id, 'shock');
  assert.equal(coldStage(300).id, 'functional');
  assert.equal(coldStrength(300), 1);
  assert.ok(coldStrength(1500) < 0.7);
  assert.equal(stepSucceeds('paddleFloat', 0.7, { secondsInWater: 200 }), true);
  assert.equal(stepSucceeds('paddleFloat', 0.7, { secondsInWater: 2000 }), false);
});

test('packing: heavy water in the bow ends makes the boat bow-heavy; essentials are tracked', () => {
  const p = emptyPacking();
  p.bowEnd.push('water'); p.sternMid.push('tent');
  const a = assess(p);
  assert.ok(a.pitch > 0.3);
  assert.ok(a.missing.includes('paddleFloat'));
  const b = emptyPacking();
  b.bowMid.push('water'); b.sternMid.push('food'); b.deck.push('paddleFloat', 'pump');
  const bb = assess(b);
  assert.ok(Math.abs(bb.pitch) < Math.abs(a.pitch));
  assert.ok(bb.enables.has('pfRescue'));
});

test('assembly: a skipped tension step lowers quality', () => {
  const all = Object.fromEntries(ASSEMBLY_STEPS.map((s) => [s.id, 1]));
  const rushed = { ...all, jackKeel: 0.2, jackSides: 0.3 };
  assert.ok(assemblyQuality(all) > 0.95);
  assert.ok(assemblyQuality(rushed) < 0.7);
});

test('camp: the beach floods at night; the terrace with a locker is clean', () => {
  assert.equal(night('beach', 'locker', 1080).flooded, true);
  const good = night('terrace', 'locker', 1080);
  assert.equal(good.clean, true);
  assert.equal(night('terrace', 'tent', 1080).raided, true);
});

test('score rewards seamanship and never punishes practising rescues', () => {
  const a = tripScore({ nm: 4.6, nights: 1, newSpecies: 5, respectful: 1, cleanCamp: true, rescues: 1 });
  const b = tripScore({ nm: 4.6, nights: 1, newSpecies: 5, respectful: 0, violations: 1, cleanCamp: false });
  assert.ok(a.total > b.total + 500);
});

test('save round-trips and survives garbage', () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const s = freshSave(); s.totals.nights = 2;
  save(storage, s);
  assert.equal(load(storage).totals.nights, 2);
  store.set(SAVE_KEY, '{not json');
  assert.equal(load(storage).totals.nights, 0);
});

test('seals: 100 yards keeps them resting; closer alerts, then flushes them', () => {
  assert.equal(sealState(120), 'resting');
  assert.equal(sealState(70), 'alert');
  assert.equal(sealState(30), 'flushed');
});

test('orcas: holding still is respectful; paddling at them inside the rule is not', () => {
  const still = { x: 0, y: 0, vx: 0, vy: 0 };
  const pod = createOrcaPass(still, 0);
  for (let i = 0; i < 2000; i++) stepOrcaPass(pod, still, 0.5);
  assert.equal(pod.respectful, true);
  const chaser = { x: 0, y: 0, vx: 0, vy: 0 };
  const pod2 = createOrcaPass(chaser, 0);
  for (let i = 0; i < 2000; i++) {
    const dx = pod2.x - chaser.x, dy = pod2.y - chaser.y, d = Math.hypot(dx, dy);
    chaser.vx = (dx / d) * 1.5; chaser.vy = (dy / d) * 1.5;
    chaser.x += chaser.vx * 0.5; chaser.y += chaser.vy * 0.5;
    stepOrcaPass(pod2, chaser, 0.5);
  }
  assert.equal(pod2.respectful, false);
});
