# Research: First Voyage

Decisions made while planning, with what was rejected and why.

## R1. Game engine: Phaser 4.2

- **Decision**: Phaser 4.2 (latest on npm, 2026-09), with Vite.
- **Rationale**: Phaser 4's rewritten WebGL renderer ships built-in filters (Glow, Blur, Bokeh,
  Vignette, ColorMatrix, Displacement, GradientMap) and a first-class `Shader` game object with
  shader additions — exactly what Principle V (beauty) needs, without a second engine. The package
  bundles its own docs and agent skills (`node_modules/phaser/docs`, `.../skills`), which lowers
  the risk of a new major version.
- **Alternatives rejected**: Phaser 3.90 (what Plumber Wars uses — familiar, but its post-FX
  pipeline is older and the project wants the modern renderer); three.js for everything (better
  3D, but top-down 2D play, UI, input and scenes would all be hand-built); PixiJS (renderer only,
  no scene/input/audio structure).

## R2. Water, land and light: one full-screen shader over a land mask

- **Decision**: The world (water and islands) is one full-screen `Shader` reading a land-mask
  texture. Island polygons are rasterised once into a canvas, blurred on the CPU into a smooth
  distance-like field, and uploaded as a texture. The shader derives shallows, beach, rock, forest
  canopy, shoreline foam, wind ripples, swell normals with sun glint, current streaks advected
  along the current, tide-rip turbulence, fog and time-of-day colour from that one field plus
  uniforms (time, camera, sun, wind, current, fog).
- **Rationale**: One draw call for the whole world, resolution-independent, and every beauty
  requirement (FR-026) lives in one place that can be scaled down per device.
- **Alternatives rejected**: Tiled sprites (resolution-bound, repetitive); per-island textures
  (many draw calls, hard seams at the shore).

## R3. Cockpit point of view (US8)

- **Decision**: A second full-screen shader that ray-marches a wave height field to a horizon,
  with island silhouettes on the horizon taken from bearings to the chart polygons, and the bow
  deck and paddle shaft as sprites on top that tilt with roll.
- **Rationale**: Truly first-person without a 3D engine; cheap enough for a phone at reduced
  internal resolution.
- **Alternatives rejected**: three.js scene for POV only (extra 600 KB and a second render loop);
  parallax layers only (reads as flat).

## R4. Coastlines and chart

- **Decision**: For this slice, island outlines are hand-authored polygons in latitude and
  longitude, projected to a local metric grid around Friday Harbor. They are stylised and
  approximate, and marked as such on the Credits screen. A script
  (`scripts/fetch-coastline.mjs`) will replace them with public-domain NOAA/USGS shoreline data.
- **Rationale**: NOAA, USGS and OpenStreetMap endpoints are blocked from the build environment.
  Shipping approximate outlines now keeps the slice moving; the data layer is isolated so the swap
  is mechanical.
- **Alternatives rejected**: OpenStreetMap coastline (ODbL share-alike obligations for derived
  databases — acceptable later with attribution, but unreachable now); Natural Earth (too coarse
  to show Jones Island at all).
- **Follow-up**: replace with NOAA ENC / USGS shoreline, and verify every landmark position.

## R5. Tides, currents and wind

- **Decision**: A representative summer day authored as a table of events — slacks, maximum
  flood and maximum ebb — for San Juan Channel, plus high and low water at Friday Harbor. Between
  events the current follows a sine-shaped curve (the standard "rule of thirds"-like shape used for
  current prediction between slack and max). Flood sets roughly north-north-west through the
  channel, ebb south-south-east. Current strength varies across the channel (stronger mid-channel
  and off points, weaker and reversed in eddies behind points and in bays). Wind is an authored
  forecast: calm morning, southerly afternoon breeze building to about 12–15 knots, which opposes
  the afternoon ebb and produces the teaching case of wind against tide.
- **Rationale**: NOAA's tide and current API is blocked from the build environment; the lesson
  (slack windows, favourable flood, wind against tide) is fully served by a realistic day.
- **Follow-up**: `scripts/fetch-noaa.mjs` pulls real predictions for Friday Harbor (station
  9449880) and the nearest San Juan Channel current station for a chosen date when network allows;
  verify set directions and typical speeds against the Current Atlas.

## R6. Sound: synthesised now, recorded later

- **Decision**: A Web Audio soundscape synthesised in code — swell wash (filtered brown noise
  with slow amplitude breathing), wind (band-passed noise with gusts tied to the wind model),
  paddle catch and drips, hull slap, surf on the beach, orca blow, gull and eagle calls, ferry
  horn — mixed on three buses (sea, wildlife, music) with independent volume (FR-027). Audio starts
  on the first user gesture (iOS requirement).
- **Rationale**: No licensing risk, tiny download, and every sound can react to the simulation
  (wind speed, stroke force, current). Licensed field recordings can replace individual voices
  later behind the same interface.
- **Alternatives rejected**: Sample libraries now (licence review needed per clip; recordings
  unreachable from the build environment).

## R7. Controls (portrait, touch-first)

- **Decision**:
  - Two thumb zones at the bottom, one per paddle side. A downward swipe from reach to hip is a
    forward stroke; its **length and smoothness** stand in for torso rotation (long, smooth,
    ending at the hip = rotation; short, jabby = arms). An outward arc is a sweep; an upward swipe
    is a reverse stroke.
  - A **hips** strip between the zones: drag left or right to lift that knee and edge the boat.
    A fast return to centre is the **hip snap**.
  - **Brace**: when the boat tips, slap the blade on the low side (tap-hold that zone) and snap
    the hips back to centre. Holding the head down is taught as part of the snap; lifting the
    head is modelled as releasing the blade before the snap completes.
  - Rocker (hull jacks) on a small dial in the cockpit HUD.
  - Keyboard equivalents on desktop (A/D strokes, Q/E edge, Space brace).
- **Rationale**: Maps the Kayak School lessons straight onto the controls, so learning the
  controls *is* learning the technique (Principle I, FR-000b).

## R8. The partner as a seat (FR-010)

- **Decision**: Every paddler is driven by a controller producing the same `PaddlerInput` intent
  each tick (see `contracts/paddler-input.md`). The player's touch controller and the partner's
  computer controller are two implementations; a future network controller is a third.
- **Rationale**: Multiplayer later without rewriting the physics or rules.

## R9. The folding kayak's facts

Published by the manufacturer and in reviews (verify before release; brand name withheld in-game
until permission):

- 16 ft (4.9 m) long, 22.5 in (57 cm) beam, about 49 lb (22 kg); about 10 minutes to assemble.
- Aluminium frame inside a skin; three hull jacks (two along the sides, one on the keel) tension
  the skin and adjust rocker, giving a waterline between roughly 12 and 15 ft; adjustable while
  paddling.
- No hatches and no sponsons: gear is loaded through the cockpit (the deck closure seals around
  the coaming); two 60 L gear flotation dry bags, a spray deck and a sea sock are included.

Sources: trakkayaks.com FAQ and specifications pages; Paddling Magazine review of the TRAK 2.0;
paddling.com buyers' guide (recorded in `src/content/credits.js`).

## R10. Save and offline

- **Decision**: Save to `localStorage` under a versioned key at every scene boundary; a web app
  manifest and a small service worker cache the built files so the game runs offline once loaded.
- **Alternatives rejected**: IndexedDB (unnecessary for a few KB of save data).

## R11. Testing

- **Decision**: `node:test` for all simulation modules (pure functions, no Phaser import), plus a
  headless Chromium smoke test (Playwright, pre-installed in the environment) that boots the game
  at iPhone size, steps through scenes and captures screenshots and a frame-rate sample.
