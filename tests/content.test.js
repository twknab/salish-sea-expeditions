import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CREDITS, creditById } from '../src/content/credits.js';
import { LESSONS } from '../src/content/lessons.js';
import { SPECIES } from '../src/content/species.js';
import { KAYAK_PARTS, BODY_POINTS, PADDLE_PARTS } from '../src/content/anatomy.js';
import { PLACES_INFO } from '../src/content/places.js';
import { ACKNOWLEDGMENT } from '../src/content/acknowledgment.js';
import { SKILLS } from '../src/sim/skills.js';

const sourced = [...LESSONS, ...SPECIES, ...KAYAK_PARTS, ...BODY_POINTS, ...PADDLE_PARTS, ...PLACES_INFO, ACKNOWLEDGMENT];

test('every source reference resolves to a credit', () => {
  for (const item of sourced) {
    assert.ok(item.sourceIds?.length, `${item.id ?? item.title} has no sources`);
    for (const id of item.sourceIds) assert.ok(creditById[id], `${item.id ?? item.title} → unknown source ${id}`);
  }
});

test('every credit is used, apart from the engine and original-work credits', () => {
  const used = new Set(sourced.flatMap((i) => i.sourceIds));
  for (const c of CREDITS) if (!['phaser', 'synth'].includes(c.id)) assert.ok(used.has(c.id), `unused credit ${c.id}`);
});

test('the field guide has at least twelve species across the required groups', () => {
  assert.ok(SPECIES.length >= 12);
  const groups = new Set(SPECIES.map((s) => s.group));
  for (const g of ['Marine mammals', 'Birds', 'Intertidal & sea life', 'Kelp & seagrass', 'Trees']) assert.ok(groups.has(g), g);
  for (const s of SPECIES) assert.ok(s.facts.length && s.blurb && s.scientific && s.where, s.id);
});

test('lesson skills exist and ids are unique', () => {
  const ids = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), `duplicate ${l.id}`); ids.add(l.id);
    if (l.skill) assert.ok(SKILLS[l.skill], `${l.id} → ${l.skill}`);
  }
});

test('cultural content carries a review status', () => {
  assert.ok(['draft', 'reviewed'].includes(ACKNOWLEDGMENT.reviewStatus));
});

test('the paddle float is never required: its lesson says re-entry is possible without one', () => {
  const l = LESSONS.find((x) => x.id === 'paddleFloat');
  assert.match(l.text, /without one/);
});
