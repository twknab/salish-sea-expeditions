# ADR: datasets and libraries for the Godot rewrite

**Status**: Accepted · **Feature**: 007-godot-rewrite · **Task**: T013p

## Context

The rewrite draws the real San Juan Islands, runs a tidal day that teaches at known moments, and
plays its own sound and music, all inside a web export whose size is the main risk
(`spec.md`, go/no-go table). Every dataset and library here is either baked into the pack or used at
build time only. This record says which ones we chose, how each is used, what it costs, and what
was turned down. `research.md` covers the engine choice and the terrain's lessons; this record is
the inventory and the reasoning behind it.

## Decisions

### Heights: AWS Terrain Tiles, baked to a 48 m grid

- **What**: AWS Terrain Tiles (Mapzen / Tilezen), which merge USGS 3DEP, SRTM and ETOPO1. The tiles
  are CC0 and the sources are public domain. Credited as `terrain-tiles` in `src/content/credits.js`.
- **How**: `tools/geo/fetch-tiles.sh` fetches zoom 13, tiles x 1291–1306 and y 2823–2835. Then
  `tools/geo/build_terrain.py` reprojects them onto an 860 × 622 grid at 48 m a cell, in the game's
  metres with the origin at the Friday Harbor ferry landing. It writes `godot/terrain/height.i16`
  (int16 decimetres, about 1 MB), `cover.u8` and `terrain.json`. `Terrain` (`terrain.gd`) reads
  them at run time.
- **Build-time only**: numpy, rasterio (GDAL) and Pillow. None of them ships.
- **Known gap**: the tiles have no soundings for most inshore water, and 3DEP flattens harbours to a
  metre or two above datum. The seabed under that water is synthesized from distance to shore, and
  water is decided by cover and height together (`research.md`). A real sounding set (NOAA BAG
  surveys) is the intended replacement.

### Land cover: ESA WorldCover 2021 v200

- **What**: ESA WorldCover 2021 v200, 10 m, CC BY 4.0. Credited as `worldcover`; the attribution
  is required and is carried on the field guide's credits page.
- **How**: it is resampled into `cover.u8`, one byte per 48 m cell. That byte decides forest,
  meadow, rock and beach on the islands. It also decides water, together with the heights.

### Routes: A* over the grid's own water

- `tools/geo/water_route.py` lays the ferry's track and the expedition's legs over the terrain
  grid's water: A* with a penalty for hugging the shore, then Douglas–Peucker thinning. It is
  called by `ferry_route.py` and `leg_routes.py`. The waypoints are read off NOAA chart 18434
  (`noaa-chart`, public domain). Because the routes come from the same grid the boat floats on, a
  drawn route can never cross land the game thinks is there.

### The water of the day: authored, not predicted

- **What**: the tide, the stream and the wind are authored days in `src/content/tripDay.js` (a
  settled July day and a September spring tide), shaped after NOAA CO-OPS prediction practice
  (`noaa-tides`). `Tides` (`tides.gd`) interpolates them by the minute.
- **Why**: the lessons must land at known moments. The stream turns inside the leg, slack water
  falls where the card can offer it, and the ebb outruns the boat in the Spieden narrows.
  Deterministic water is also what lets the headless tests pin those moments.

### Sound: synthesized in code, no samples

- **What**: every effect (strokes, drips, hull slap, wind, water, rain, the rip, the ferry's horn,
  gulls, the eagle, a blow, raccoons) is synthesized by `tools/synth-audio.mjs` as 22.05 kHz mono
  WAV. The four pieces of music come from `tools/synth-pieces.mjs`. Credited as `synth`
  (original work).
- **How**: the WAVs ship in the pack. The four pieces are encoded to MP3 at build time with
  **lamejs 1.2.1** (a devDependency, LGPL-3.0). They are left out of the web pack and fetched from
  `audio/` beside the page after the first frame.
- **Licence note**: lamejs runs only on the developer's machine. The MP3 files it writes are not a
  work derived from the encoder, so nothing LGPL ships.

### Type: DejaVu Sans

- DejaVu Sans and DejaVu Sans Bold (Bitstream Vera licence, attribution carried as `dejavu`) are
  the interface faces, imported as Godot font resources.

### Engine

- Godot Engine 4.5 (MIT, `godot`), with the Compatibility renderer and a web export without
  threads. See `research.md` for the reasoning.

## Considered and rejected

| Option | Why not |
| ------ | ------- |
| Drawn or noise-generated islands | The game teaches real water; Spieden's narrows and the coves have to be where a paddler would find them (`research.md`) |
| OpenStreetMap coastlines | Outlines with no heights or seabed; the sea shader's shallows and the haul-out rules need both |
| Live NOAA current predictions | A network dependency at run time, different water every day, and tests that cannot pin the moments the lessons rely on |
| Sampled sound libraries (freesound and similar) | Per-file licences to track, attribution for each sound, and a larger pack, for sounds a few lines of shaped noise make well enough |
| Godot `AudioStreamGenerator` for live music | Synthesis on the main thread in a threadless web export competes with the frame (`research.md`, risk 3); pre-rendered pieces cost nothing at run time |
| A higher-resolution terrain grid (24 m or finer) | Four times the file and the mesh for detail the chase camera rarely sees; the 48 m grid already resolves the coves the legs land in |

## Consequences

- The islands, seabed and routes can be rebuilt from public sources by three scripts, and the
  output is deterministic.
- Two obligations travel with the build: CC BY attribution for WorldCover, and the DejaVu notice.
  Both live in `credits.js` and show on the field guide's credits page. The content test's
  unused-credit check exempts them, as it does the engine and original-work credits, so removing
  one would go unnoticed: keep them by hand.
- Open items: real soundings to replace the synthesized harbour bottom; the mixes tuned on real
  speakers (T014n). Any sampled or licensed sound added later needs an entry in this record and a
  credit.
