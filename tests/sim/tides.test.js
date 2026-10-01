import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tideHeight, channelCurrentKn, nextSlack, highestBetween } from '../../src/sim/tides.js';
import { wind, seaState, windAgainstTide } from '../../src/sim/wind.js';

test('current is zero at slack and at its maximum at max flood/ebb', () => {
  assert.ok(Math.abs(channelCurrentKn(460)) < 1e-9);
  assert.ok(Math.abs(channelCurrentKn(610) - 1.4) < 1e-9);
  assert.ok(Math.abs(channelCurrentKn(980) + 2.0) < 1e-9);
});

test('current rises quickly after slack (sine shape)', () => {
  const quarter = channelCurrentKn(460 + (610 - 460) / 3);
  assert.ok(quarter > 1.4 * 0.45, `a third of the way to max flood should be ~half strength: ${quarter}`);
});

test('tide heights hit the table at the turn', () => {
  assert.ok(Math.abs(tideHeight(430) + 0.2) < 1e-9);
  assert.ok(Math.abs(tideHeight(820) - 1.9) < 1e-9);
  const mid = tideHeight((430 + 820) / 2);
  assert.ok(Math.abs(mid - 0.85) < 1e-9);
  assert.equal(nextSlack(500), 790);
  assert.ok(highestBetween(1200, 1440 + 360) >= 2.49);
});

test('morning is calm with a fair flood; afternoon is wind against ebb', () => {
  assert.ok(wind(480).kn < 4);
  assert.equal(windAgainstTide(480), false);
  assert.equal(windAgainstTide(960), true);
  assert.ok(seaState(960) > seaState(480) * 3, 'afternoon chop is far worse than morning');
});
