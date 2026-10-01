import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKayak } from '../../src/sim/kayak.js';
import { emptyInput } from '../../src/sim/input.js';
import { stepHeel, DANGER, EDGE_ANGLE } from '../../src/sim/stability.js';

const env = { time: 0, sea: 0 };

test('a held edge settles at the edge angle and stays upright', () => {
  const k = createKayak();
  const inp = { ...emptyInput(), edge: 1 };
  for (let i = 0; i < 120; i++) stepHeel(k, inp, env, 1 / 30);
  assert.ok(k.upright);
  assert.ok(Math.abs(k.heel - EDGE_ANGLE) < 0.05, `${k.heel}`);
});

function tipping(braceWith) {
  const k = createKayak({ heel: DANGER + 0.12, heelVel: 1.2 });
  let result = null;
  for (let i = 0; i < 90; i++) {
    const inp = emptyInput();
    if (i >= 2 && i < 12 && braceWith) {
      inp.brace = { side: 'right' };
      if (i === 4) { inp.hipSnap = true; inp.headDown = braceWith === 'headDown'; }
    }
    const e = stepHeel(k, inp, env, 1 / 30);
    if (e === 'capsize') result = 'capsize';
  }
  return result ?? (k.upright ? 'upright' : 'capsize');
}

test('past the edge, a boat with no brace goes over', () => {
  assert.equal(tipping(null), 'capsize');
});

test('a brace with a hip snap and head down rights the boat', () => {
  assert.equal(tipping('headDown'), 'upright');
});

test('lifting the head first makes the brace fail', () => {
  assert.equal(tipping('headUp'), 'capsize');
});
