import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { CREDITS, creditById } from '../src/content/credits.js';
import { LESSONS } from '../src/content/lessons.js';
import { SPECIES } from '../src/content/species.js';
import { KAYAK_PARTS, BODY_POINTS, PADDLE_PARTS } from '../src/content/anatomy.js';
import { PLACES_INFO } from '../src/content/places.js';
import { TRIP_DAYS } from '../src/content/tripDay.js';
import { LEGS } from '../src/content/expedition.js';
import { ACKNOWLEDGMENT } from '../src/content/acknowledgment.js';
import { GLOSSARY } from '../src/content/glossary.js';
import { SKILLS } from '../src/sim/skills.js';
import { LAYERS, KIT, KIT_GROUPS, LEGAL } from '../src/content/kit.js';
import { gearById } from '../src/content/gear.js';

const sourced = [...GLOSSARY, ...LESSONS, ...SPECIES, ...KAYAK_PARTS, ...BODY_POINTS, ...PADDLE_PARTS, ...PLACES_INFO, ACKNOWLEDGMENT, ...LAYERS, ...KIT, ...LEGAL, ...LEGS.flatMap((l) => [...l.steps, l.landing, ...l.camp.steps])];

test('every shore walk names species the field guide has', () => {
  const legs = JSON.parse(readFileSync(new URL('../godot/content/legs.json', import.meta.url), 'utf8')).legs;
  const ids = new Set(SPECIES.map((s) => s.id));
  for (const l of legs) {
    assert.ok(l.shore?.length >= 3, `${l.id} has a shore walk`);
    assert.ok(['flood', 'ebb'].includes(l.favours), `${l.id} says which stream it rides`);
    for (const id of l.shore) assert.ok(ids.has(id), `${l.id} shore → unknown species ${id}`);
  }
});

test('every bail-out a leg names is a place on the chart', () => {
  const places = new Set(JSON.parse(readFileSync(new URL('../godot/terrain/terrain.json', import.meta.url), 'utf8')).places.map((p) => p.id));
  for (const l of LEGS) {
    assert.ok(l.bailouts?.length >= 2, `${l.id} names its bail-outs`);
    for (const id of l.bailouts) assert.ok(places.has(id), `${l.id} bail-out → unknown place ${id}`);
  }
});

test('a leg that starts in fog says when it burns off, and teaches it', () => {
  const foggy = LEGS.filter((l) => l.fog);
  assert.ok(foggy.length >= 1, 'one morning starts in fog');
  for (const l of foggy) {
    assert.ok(l.fog.until > 5 && l.fog.until < 12, `${l.id} fog burns off in the morning`);
    assert.ok(l.fog.burn > 0, `${l.id} fog burns off over some time`);
    assert.ok(l.steps.some((s) => s.id === 'fog'), `${l.id} has a fog step in its float plan`);
  }
});

test('every day the title offers has the same shape, and September is the harder one', () => {
  assert.ok(TRIP_DAYS.length >= 2, 'there is a day to paddle it again on');
  const ids = new Set();
  for (const d of TRIP_DAYS) {
    assert.ok(d.id && d.label && d.blurb, `${d.id} is named`);
    assert.ok(!ids.has(d.id), `${d.id} is unique`);
    ids.add(d.id);
    for (const key of ['tides', 'current', 'wind', ...(d.rain ? ['rain'] : [])]) {
      const t = d[key].map((r) => r.t);
      assert.deepEqual(t, [...t].sort((a, b) => a - b), `${d.id} ${key} is in time order`);
    }
    assert.ok(d.sunrise < d.sunset, `${d.id} has a day in it`);
  }
  const peak = (d) => Math.max(...d.wind.map((w) => w.kn));
  const range = (d) => Math.max(...d.tides.map((r) => r.h)) - Math.min(...d.tides.map((r) => r.h));
  const july = TRIP_DAYS.find((d) => d.id === 'july');
  const sept = TRIP_DAYS.find((d) => d.id === 'september');
  assert.ok(peak(sept) > peak(july) && range(sept) > range(july), 'September blows harder and runs bigger');
  assert.ok(sept.rain && Math.max(...sept.rain.map((r) => r.r)) > 0.5 && !july.rain, 'September brings a squall, July stays dry');
});

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

test('the words on the water are defined once each, in a sentence or more', () => {
  const ids = GLOSSARY.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const g of GLOSSARY) assert.ok(g.term && g.text.length > 60, g.id);
  for (const w of ['slack', 'ferry', 'cmg', 'floatplan']) assert.ok(ids.includes(w), w);
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
