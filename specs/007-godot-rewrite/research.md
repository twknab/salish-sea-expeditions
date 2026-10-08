# Research: Godot for Salish Sea Expeditions

## Decision: Godot 4.5, Compatibility renderer, web export without threads

**Why Godot at all.** The Phaser game draws real 3D (three.js) but only to bake sprites; the sea
is a 2D shader. A believable ocean — swell the boat rides, reflections, crests, fog, light that
changes through the day — is a 3D scene, and Godot gives us the scene graph, physics, PBR
lighting, shadows, sky, fog and a shader language in one engine with a real editor, plus native
mobile exports later (iOS, Android) from the same project.

**Why Compatibility (OpenGL ES 3 / WebGL 2).** Forward+ and Mobile renderers need Vulkan or
Metal and do not export to the web. Compatibility is the only web renderer, and it is also the
right choice for older phones.

**Why no threads.** Godot's threaded web build needs `SharedArrayBuffer`, which needs
cross-origin isolation headers (COOP/COEP), which break every third-party embed and are flaky on
iOS Safari. The `nothreads` template runs everywhere at the cost of audio running on the main
thread. Our static server does not need the headers.

## What was measured here (headless Linux, SwiftShader)

| Item                                  | Result                                        |
| ------------------------------------- | --------------------------------------------- |
| Headless unit tests                   | 32 pass in under 2 s                          |
| Web export                            | 38 MB `index.wasm` (about 9 MB gzip), 44 KB pck |
| Headless load in Chromium/SwiftShader | loads; screenshot in `tests/smoke/out`        |

The wasm is the engine itself and does not grow with the game; the Phaser build was 2.5 MB. This
is the single biggest risk for a phone on cellular and is the first thing to measure on a device.

## Decision: real geography from open rasters, not a drawn or noise island

The islands are built from two public datasets by `tools/geo/build_terrain.py` and shipped as raw
arrays read by `terrain.gd`:

- **AWS Terrain Tiles** (Mapzen / Tilezen; USGS 3DEP, SRTM and ETOPO1 merged; CC0 tiles) at zoom 13
  for the heights of land and, where the sources carry it, the seabed.
- **ESA WorldCover 2021 v200** (10 m, CC BY 4.0) for what grows where: tree cover, grassland,
  shrub, cropland, built-up, bare, wetland, water.

What the data taught us, and what the build does about it:

| Finding | Consequence |
|---|---|
| 3DEP flattens harbours and channels to a surface a metre or two **above** datum | Anything WorldCover calls water that the DEM holds under 4 m is sea; Friday Harbor's whole harbour read as land before this rule |
| The tiles have no soundings for most of the inshore water | Flattened cells get a bottom that falls away with distance from shore (about 1.2 m per 48 m cell, to 31 m), so shallows read as shallows until a real sounding set replaces it |
| Godot's PNG loader strips 16-bit greys to 8 bits | Heights ship as int16 decimetres, cover as bytes; no image file lives in the project (it would be imported as a texture and packed twice) |
| Reading WorldCover over HTTP drops range requests as silent zeros | The build reads 0.1° windows with retries through GDAL's proxy settings |

Two layers of resolution: 48 m cells are the slice-1 grid (860 × 622 for the bbox −123.20…−122.64,
48.45…48.72), full resolution within 4.2 km of the paddler and one vertex per three cells beyond.
Mount Constitution comes out at 727 m against the surveyed 732 m.

Not yet: tide heights and currents (NOAA CO-OPS and OFS; blocked from this build host, and a
different kind of data), charted rocks and kelp (ENC S-57), and a bathymetry set for the channels
(NOAA NCEI CUDEM at 1/9 arc-second covers the San Juans). Each is a follow-up with its own source
line in the credits.

## What the chart view taught about rendering

Looking at the islands from 2.6 km up found four things sea level had hidden:

| Symptom | Cause | Fix |
|---|---|---|
| Islands drawn as slivers of shoreline; flat land missing | Terrain triangles wound clockwise seen from +y, so every near-horizontal face was back-face culled; at sea level the slopes facing the camera had carried the picture | Wind `a → b → c` (x east, z south) |
| Water painted over low land at distance | The sea shader wrote `ALPHA`, which put it in the transparent pass, and the seabed mesh under the opaque water z-fought it along every shallow | The sea is opaque; sea cells of the land mesh drop straight to −40 m; camera near planes raised (0.05 → 0.2 chase, 60 at the chart) |
| Everything white from altitude | Fog tuned for 12 km at sea level | `Seascape.fog_density` per scene; the chart uses 0.00003 |
| Headless screenshots never got past the start | Godot caps a frame's delta at 8 physics ticks, so at SwiftShader's frame rate game time runs about 8× slow | `?at=0.3` opens the run part way; smoke shots use it |

## Alternatives considered

- **Stay on Phaser + three.js, render the world live in three.js.** Lowest risk, keeps 2.5 MB,
  and the studio already renders the boat. Loses an editor, physics, and native exports. This is
  the fallback if the go/no-go fails.
- **Unity.** Web export is heavier still (WebGL 2, 20–40 MB), licensing is a moving target.
- **Babylon.js / PlayCanvas.** Web-native 3D with an editor (PlayCanvas), lighter than Godot on
  the web, but no native mobile path and less of a physics story.

## Risks

1. Download size on cellular (see above). Mitigation: brotli at the edge, a loading screen that
   teaches, PWA caching.
2. iOS Safari memory: a 38 MB wasm compiles to a lot of memory; Safari may reload the tab.
3. Audio without threads: fine for ambience and strokes; the generative EDM soundtrack would need
   to be rebuilt with Godot's audio generator, which is costlier on the main thread.
4. Content porting is mechanical (JSON out of the JS modules), but Help markdown, the field guide
   and the save migration need a Godot UI.

## Sources

- Godot docs: Exporting for the Web (threads, COOP/COEP, Safari notes); Compatibility renderer.
- Gerstner waves: Tessendorf, "Simulating Ocean Water" (2001) — the standard reference.
