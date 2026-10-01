# Contract: Content data

All teaching content is data in `src/content/`, never hard-coded in scenes, so it can be reviewed
by an instructor, a naturalist or a cultural reviewer without reading game code.

- `lessons.js` — `{ id, scene, skill?, title, text, sourceIds[] }`
- `species.js` — `{ id, common, scientific, group, blurb, facts[], where, sourceIds[], approachMetres? }`
- `anatomy.js` — kayak parts and body-connection points: `{ id, name, text, sourceIds[] }`
- `gear.js` — `{ id, name, massKg, essential, enables[], text }`
- `places.js` — named places with lat/lon and a short, truthful description.
- `acknowledgment.js` — the land acknowledgment text, its sources, and `reviewStatus`
  (`'draft' | 'reviewed'`). Cultural content must carry `reviewStatus` (Principle III).
- `credits.js` — `{ id, title, author, licence, url, usedFor }` for every source referenced above.

Rule enforced by test: every `sourceIds` entry resolves to a credit, and every credit is used.
