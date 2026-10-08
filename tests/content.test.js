import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CREDITS, creditById } from '../src/content/credits.js';
import { LESSONS } from '../src/content/lessons.js';
import { SPECIES } from '../src/content/species.js';
import { KAYAK_PARTS, BODY_POINTS, PADDLE_PARTS } from '../src/content/anatomy.js';
import { PLACES_INFO } from '../src/content/places.js';
import { LEGS } from '../src/content/expedition.js';
import { ACKNOWLEDGMENT } from '../src/content/acknowledgment.js';
import { SKILLS } from '../src/sim/skills.js';
import { LAYERS, KIT, KIT_GROUPS, LEGAL } from '../src/content/kit.js';
import { gearById } from '../src/content/gear.js';

const sourced = [...LESSONS, ...SPECIES, ...KAYAK_PARTS, ...BODY_POINTS, ...PADDLE_PARTS, ...PLACES_INFO, ACKNOWLEDGMENT, ...LAYERS, ...KIT, ...LEGAL, ...LEGS.flatMap((l) => [...l.steps, l.landing, ...l.camp.steps])];

test('the legs chain: each leg starts where the one before it landed', () => {
  for (let i = 1; i < LEGS.length; i++) assert.equal(LEGS[i].from, LEGS[i - 1].to);
  for (const l of LEGS) assert.equal(l.camp.place, l.to);
});

test('every source reference resolves to a credit', () => {
  for (const item of sourced) {
    assert.ok(item.sourceIds?.length, `${item.id ?? item.title} has no sources`);
    for (const id of item.sourceIds) assert.ok(creditById[id], `${item.id ?? item.title} → unknown source ${id}`);
  }
});

test('every credit is used, apart from the engine and original-work credits', () => {
  const used = new Set(sourced.flatMap((i) => i.sourceIds));
  for (const c of CREDITS) if (!['phaser', 'three', 'synth', 'godot', 'dejavu', 'terrain-tiles', 'worldcover'].includes(c.id)) assert.ok(used.has(c.id), `unused credit ${c.id}`);
});

test('the field guide has at least twelve species across the required groups', () => {
  assert.ok(SPECIES.length >= 12);
  const groups = new Set(SPECIES.map((s) => s.group));
  for (const g of ['Marine mammals', 'Birds', 'Intertidal & sea life', 'Kelp & seaweeds', 'Trees']) assert.ok(groups.has(g), g);
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

test('clothing goes on in the teaching order: base, insulation, drysuit, PFD, extremities', () => {
  assert.deepEqual(LAYERS.map((l) => l.id), ['base', 'insulation', 'drysuit', 'pfd', 'extremities']);
  assert.match(LAYERS[0].text, /cotton/i);
});

test('every kit item sits on the flat lay, in a known group, and links to real packing gear', () => {
  const groups = new Set(KIT_GROUPS.map((g) => g.id));
  for (const k of KIT) {
    assert.ok(groups.has(k.group), `${k.id} group`);
    assert.ok(k.x > 0 && k.x < 1 && k.y > 0 && k.y < 1, `${k.id} position`);
    if (k.gear) assert.ok(gearById[k.gear], `${k.id} → unknown gear ${k.gear}`);
  }
  assert.equal(new Set(KIT.map((k) => k.id)).size, KIT.length);
});

test('the legal minimums name both countries, and Canada asks for a heaving line', () => {
  assert.deepEqual(LEGAL.map((l) => l.country), ['United States', 'Canada']);
  assert.ok(LEGAL[1].items.some((i) => /heaving line/.test(i)));
});
