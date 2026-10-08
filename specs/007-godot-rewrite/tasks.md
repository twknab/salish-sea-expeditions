# Tasks: Godot Rewrite

## Slice 1 — on the water

- [x] T001 Godot 4.5 project, Compatibility renderer, portrait, touch emulation
- [x] T002 Web export preset without threads; server serves wasm/pck
- [x] T003 Gerstner sea shader with ripple normals, Fresnel, foam and shallows
- [x] T004 waves.gd: the same field on the CPU, with tests
- [x] T005 hull.gd: the kayak's lines ported from kayak.js, lofted to a mesh, with tests
- [x] T006 stroke_math.gd: rotation grading, yaw, buoyancy spring, with tests
- [x] T007 kayak.gd: seven-probe buoyancy, keel drag, stroke/sweep/reverse impulses, edging
- [x] T008 paddler.gd: procedural paddler with torso wind-up and a Greenland paddle
- [x] T009 controls.gd: blade zones, hip line, hips bar, coaching labels, keyboard
- [x] T010 island.gd: noise island with sand, meadow, forest and instanced conifers
- [x] T011 sea.gd + sea.tscn: sky, sun, fog, HUD, wiring
- [x] T012 tests/smoke/godot-shot.mjs and .github/workflows/godot.yml
- [x] T013 specs 007: spec, research, plan, tasks; README and CLAUDE.md sections

## Slice 1b — the opening, in order

- [x] T013a Content exported to JSON (tools/export-content.mjs) and loaded by the App autoload
- [x] T013b Title with the kayak drifting behind it; land acknowledgment and safety note
- [x] T013c Outfitting on the dock: skin picker on the 3D boat, dressing a standing figure layer by layer, the kit by where it rides, the legal minimum
- [x] T013d The ferry crossing from Anacortes (mandatory): a 3D ferry, islands named as they come abeam, the horn
- [x] T013e Kayak School: camera tour of the boat's parts, the body and the paddle on the real models, then the five drills
- [x] T013f Water, wind, splash, drip, hull-slap, horn and gull sounds synthesized (tools/synth-audio.mjs)
- [x] T013g Psychedelic techno soundtrack as six synced stems with a mood per scene (tools/synth-soundtrack.mjs)
- [x] T013h Paddler rebuilt as one skinned mesh on a Skeleton3D (body_mesh.gd): lofted trunk and limbs with analytic normals, joints blended across bones, dress layers, IK arms, a lofted Greenland paddle
- [x] T013i Kayak School reachable from the title in one tap; ferry crossing shortened

## Slice 1c — the real islands and the gates (the first pull request to main)

- [x] T013j Real geography: `tools/geo/build_terrain.py` builds heights (AWS Terrain Tiles) and land cover (ESA WorldCover) into a 48 m grid in local metres with the origin at Friday Harbor; shipped as raw arrays (`height.i16`, `cover.u8`, `terrain.json`)
- [x] T013k `terrain.gd`: chunked land meshes coloured from the cover, full resolution near the paddler and coarse beyond, built a few per frame and cached for the session; instanced conifers; `height_at` / `is_land` / `place`; the harbours the DEM flattened get a sloping bottom in the build
- [x] T013l The sea reads the real seabed: `Terrain.height_texture()` feeds `sea.gdshader` for shallows and shore foam; a flat far plane carries the water to the horizon; fog thinned so Orcas is a shape in the haze
- [x] T013m `sea.tscn` opens in the harbour at Friday Harbor with the channel north; running aground stops the hull; outfitting stands on the real Anacortes shore; `island.gd` remains only under the ferry until the chart-style crossing lands
- [x] T013n CI gates in `godot.yml`: gdlint (`godot/.gdlintrc`), content tests, headless unit and scene tests, export, bare-page desktop and phone smoke that fails on page or script errors, and the `Dockerfile.godot` image answering `/health`
- [x] T013o Deploy framed, off: `Dockerfile.godot`, the `expedition` job in `deploy.yml` behind `EXPEDITION_DEPLOY`, and the `salish-sea-expedition` service in `infra/service` behind `expedition_image`
- [ ] T013p Datasets and libraries ADR for the rewrite (terrain tiles, WorldCover, the sound libraries to come)

## Slice 2 — the crossing as a chart

- [x] T013q `tools/geo/ferry_route.py`: the WSF track Anacortes → Friday Harbor laid over the terrain's water cells (A* with a shore penalty between charted waypoints, thinned), written to `godot/content/ferry_route.json` with the places to introduce abeam
- [x] T013r `ferry.gd` rewritten: chart camera 2.6 km up following the track over the real islands, dashed route ribbon, island names floated over their land, cards abeam from `places`, 1×/2×/4× (26 s at 1×), rail view on the sun deck, `?at=` and `?view=rail` for checks
- [x] T013s Rendering fixes the chart exposed: terrain triangles were wound back-face-first (flat land vanished from above), the sea shader was in the transparent pass for no reason, the seabed mesh z-fought the water, and sea-level fog whited out the chart; `fog_density` is now per scene

## Slice 3 — paddling that feels like paddling

- [x] T013t `controls.gd` rewritten: hold to paddle at a 60-a-minute cadence alternating sides (W/↑ or a thumb on the water), lean to steer (A/D or sliding the thumb), slide up or hold S to back off, a flick or Z/C for a sweep, two thumbs or J/L/Space for a brace, the hips bar or Q/E for edge, and phone tilt as an option kept in the save; coaching is about rhythm (a tap is an arm stroke)
- [x] T013u `kayak.steer`: a lean bends the course in proportion to the way on; good strokes drip (`Sound.dip`) instead of splashing; the drills' copy and keys say the new verbs; the smoke script can hold keys (`KEYS=w:16000`) to prove the boat moves

## Slice 2 — measure and decide

- [ ] T014 Deploy the export to a second Cloud Run service and measure on an iPhone
- [ ] T015 Record the go/no-go in spec.md

## Slice 3 — port (only on go)

- [ ] T016 Port src/sim modules with tests
- [ ] T017 Content export to JSON and a loader
- [ ] T018 Kayak School scene
- [ ] T019 Crossing with partner, tides and currents
- [ ] T020 Wildlife, rescue, camp, tide pools, debrief, field guide, Help, About
- [ ] T021 Soundscape
