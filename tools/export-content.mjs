// Emit the game's teaching content as JSON for the Godot project, so both versions read one source.
//   node tools/export-content.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { ACKNOWLEDGMENT, SAFETY_NOTE } from '../src/content/acknowledgment.js';
import { LAYERS, KIT_GROUPS, KIT, LEGAL, SEA_TEMP } from '../src/content/kit.js';
import { KAYAK_PARTS, BODY_POINTS, PADDLE_PARTS, DRILLS } from '../src/content/anatomy.js';
import { PLACES_INFO } from '../src/content/places.js';
import { LEGS } from '../src/content/expedition.js';
import { TRIP_DAY } from '../src/content/tripDay.js';
import { SPECIES } from '../src/content/species.js';
import { PADDLERS, SKIN_TONES, HAIR_COLOURS, HAIR_STYLES, BUILDS, PFD_COLOURS } from '../src/content/paddlers.js';
import { LESSONS } from '../src/content/lessons.js';
import { CREDITS } from '../src/content/credits.js';
import { GEAR } from '../src/content/gear.js';
import { SKINS } from '../src/content/skins.js';
import { ASSEMBLY_STEPS } from '../src/sim/assembly.js';

const out = {
  acknowledgment: ACKNOWLEDGMENT, safetyNote: SAFETY_NOTE, seaTemp: SEA_TEMP,
  layers: LAYERS, kitGroups: KIT_GROUPS, kit: KIT, legal: LEGAL, gear: GEAR,
  kayakParts: KAYAK_PARTS, bodyPoints: BODY_POINTS, paddleParts: PADDLE_PARTS, drills: DRILLS,
  places: PLACES_INFO, lessons: LESSONS, legs: LEGS, tripDay: TRIP_DAY,
  species: SPECIES.map(({ id, common, scientific, group, blurb, facts, where, approachMetres, sourceIds }) => ({ id, common, scientific, group, blurb, facts, where, approachMetres: approachMetres ?? 0, sourceIds })),
  paddlers: PADDLERS, paddlerParts: { skin: SKIN_TONES, hair: HAIR_COLOURS, style: HAIR_STYLES, build: BUILDS, pfd: PFD_COLOURS },
  credits: CREDITS.map(({ id, title, author, url, licence }) => ({ id, title, author, url, licence })),
  assemblySteps: ASSEMBLY_STEPS,
  skins: SKINS.map((s) => ({ id: s.id, name: s.name, deck: s.deck, deckHi: s.deckHi, panel: s.panel, hull: s.hull ?? '#f0f1ee' })),
};
mkdirSync('godot/content', { recursive: true });
writeFileSync('godot/content/content.json', JSON.stringify(out, null, 1));
console.log('godot/content/content.json', Object.keys(out).join(', '));
