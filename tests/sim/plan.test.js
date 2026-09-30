import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge } from '../../src/sim/plan.js';

test('an early launch on the young flood is a good window', () => {
  assert.equal(judge(480).verdict, 'good');
});

test('launching into the afternoon ebb against a southerly is poor', () => {
  const j = judge(900);
  assert.equal(j.verdict, 'poor');
  assert.equal(j.against, true);
});
