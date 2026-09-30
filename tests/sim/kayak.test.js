import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKayak, stepKayak } from '../../src/sim/kayak.js';
import { emptyInput } from '../../src/sim/input.js';
import { stepEnergy } from '../../src/sim/energy.js';

const calm = { time: 0, current: { x: 0, y: 0 }, wind: { x: 0, y: 0 }, sea: 0 };

function paddle(strokeShape, seconds = 60, opts = {}) {
  const k = createKayak(opts);
  const p = { energy: 1, fit: 1, skills: {} };
  let spent = 0, side = 'left';
  for (let i = 0; i < seconds * 30; i++) {
    const inp = emptyInput();
    if (i % 22 === 0) { inp.stroke = { side, kind: 'forward', ...strokeShape }; side = side === 'left' ? 'right' : 'left'; }
    const r = stepKayak(k, inp, { ...calm, time: i / 30 }, p, 1 / 30);
    spent += r.cost;
  }
  return { k, spent, dist: Math.hypot(k.x, k.y) };
}

test('rotation strokes go further for less energy than arm strokes', () => {
  const torso = paddle({ reach: 1, smoothness: 1, exitAtHip: true });
  const arms = paddle({ reach: 0.2, smoothness: 0.3, exitAtHip: false });
  assert.ok(torso.dist > arms.dist * 1.25, `${torso.dist} vs ${arms.dist}`);
  assert.ok(torso.dist / torso.spent > (arms.dist / arms.spent) * 1.8);
});

test('cruising speed with good strokes is realistic (2.5–4 knots)', () => {
  const { dist } = paddle({ reach: 1, smoothness: 1, exitAtHip: true }, 120);
  const kn = dist / 120 / 0.5144;
  assert.ok(kn > 2.5 && kn < 4, `${kn} kn`);
});

test('edging toward the sweep side sharpens the turn', () => {
  const turn = (edge) => {
    const k = createKayak();
    const p = { energy: 1, fit: 1, skills: {} };
    for (let i = 0; i < 60; i++) {
      const inp = emptyInput();
      inp.edge = edge;
      if (i === 20) inp.stroke = { side: 'right', kind: 'sweep', reach: 1, smoothness: 1, exitAtHip: true };
      stepKayak(k, inp, calm, p, 1 / 30);
    }
    return Math.abs(Math.atan2(Math.sin(k.heading), Math.cos(k.heading)));
  };
  assert.ok(turn(1) > turn(0) * 1.4);
});

test('current carries the boat over the ground', () => {
  const k = createKayak();
  for (let i = 0; i < 300; i++) stepKayak(k, emptyInput(), { ...calm, current: { x: 0.5, y: 0 } }, { energy: 1, fit: 1 }, 0.1);
  assert.ok(k.x > 14 && Math.abs(k.y) < 1);
});

test('resting in shelter recovers energy faster', () => {
  const open = stepEnergy(0.5, { resting: true, shelter: 0 }, 10);
  const kelp = stepEnergy(0.5, { resting: true, shelter: 1 }, 10);
  assert.ok(kelp - 0.5 > (open - 0.5) * 2.5);
});
