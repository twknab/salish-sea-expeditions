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
