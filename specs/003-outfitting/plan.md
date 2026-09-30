# Plan: Outfitting

## Approach

- **Art** (Principle VIII — drawn by us): SVGs in `src/art/`, rasterised by `src/render/art.js`.
  - `postcard-anacortes.svg`, `postcard-friday-harbor.svg` — illustrated scenes.
  - `wear-*.svg` — one front-view paddler, split into stacked layers on one 400×800 canvas so each
    layer can fade on over the last: base, insulation, drysuit, skirt+PFD, head/hands/feet.
  - `kit-flatlay.svg` — the weekend kit laid out on a tarp; item positions live in `kit.js`.
- **Content**: `src/content/kit.js` — `LAYERS` (order, name, text, sourceIds), `KIT` (item id,
  group, x/y on the flat lay, text), `LEGAL` (per country). New credits for each source.
- **Scene**: `src/scenes/Outfit.js` with three pages (boat, wear, kit); next/back; focus ring;
  pause button. `StartChoice` routes through it (`go(this, 'Outfit', { next })`).
- **Assembly**: skip the chooser when `state.save.skin` is set.

## Tests

- `tests/content.test.js`: every layer and kit item has text and resolvable sources; kit x/y lie
  inside the flat lay; layer order is base → insulation → drysuit → pfd → extremities.
- Smoke: add `Outfit` to the scene list.
