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

## Slice 4 — the compass, the names, the mark

- [x] T013v `compass.gd`: a drawn dome compass upper right — a card with ticks and the cardinals turning under a fixed lubber line, liquid-damped, degrees beneath; under the note on a phone, beside it on a desktop
- [x] T013w `place_labels.gd`: names floated over their land, shared by the ferry's chart and the water scenes (the gazetteer's landings, coves and islands within 12 km)
- [x] T013x The aft mark: an orca's fin rising through a wave on the aft deck, in the panel colour with a black fin — or the hull's white on a dark deck — never a logo

## Slice 5 — the first leg, and camp

- [x] T013y Content: `src/content/expedition.js` — the float plan (route, tide and current, traffic, bail-outs, file it) and the camp (above the tide, the pad, the raccoons, drying out, the night), every step sourced; `tripDay` exported with it
- [x] T013z `leg.gd`: the leg Friday Harbor → Jones north cove as waypoints checked against the water (the gazetteer's Jones point is mid-island; `Leg.COVE` is the cove's water), length, bearing, the day's clock
- [x] T014a `plan.gd` + `plan.tscn`: the float plan on a chart — the leg drawn with `ChartRibbon` over the real islands, names floated, the plan read card by card, then Launch; `ChartRibbon` shared with the ferry (and no longer back-face culled)
- [x] T014b The leg on the water: destination line (name, distance, bearing, clock), the compass's destination mark, the groove — a steady hold settles and the miles and hours pass over the chart, the sun moving with `Seascape.apply_hour` — and landing in the cove at 220 m
- [x] T014c `camp.gd` + `camp.tscn`: the boat at the tide line of the real cove, the camera out on the water, the tent going up on the pad at the second step, the evening coming on card by card; "Tomorrow's float plan" saves the day and returns to the title for now
- [x] T014d Tide and current on the leg from `tripDay`: `tides.gd` (pure, tested) reads height, current and wind by the minute; the current carries the boat over the ground, scaled with the groove's hours; the HUD names the set ("flood 1.0 kn setting 330°") and the wind, and the float plan says what the launch rides. Still to come: a real sounding set for the channels

## Slice 6 — who's paddling

- [x] T014e `src/content/paddlers.js`: six ready-made paddlers (Mina, Tomás, Ayla, Kai, Noor, Sam) and the parts — six skin tones, six hair colours, five styles (short, close crop, long tied back, bun, head wrap), three builds, four PFD colours — with no gender declared for any of them
- [x] T014f `App.paddler()` resolves the look from the save; `BodyMesh` draws the hair styles and the build scales the rig; `Paddler` takes its skin, hair and PFD from it everywhere the figure appears
- [x] T014g Outfitting opens on "Who's paddling": the presets as a row of faces and the parts beneath, wrapping on a phone, the standing figure rebuilding as you choose

## Slice 7 — the wildlife, as themselves

- [x] T014h `wildlife.gd`: harbour seals hauled out on their rock, a great blue heron in the shallows, a bald eagle on a fir on the point, a bed of bull kelp with floats and streaming blades, a harbour porpoise rolling through the surface — each its own built model with its own small life
- [x] T014i Sightings on the leg: the heron off the Labs, the eagle on Point Caution, the porpoise mid-channel, the kelp and the seals at the islet by Yellow Island, each placed on the shore or water the terrain has there; coming within reach names it once from the field guide (blurb, a fact, the keep-off distance for marine mammals) and keeps it in the save
- [x] T014j The field guide's species exported to the Godot content; `?scene=trip&near=yellow|labs` open on the sightings for checks

## Slice 8 — four pieces

- [x] T014k `tools/synth-pieces.mjs`: four full-length melodic pieces on one 122 bpm grid — Dawn (half-time, D minor, a slow lead), Crossing (four on the floor, acid arp, a bright A minor lead), Night (no kick, long pads, F major), Harbor (a warm house groove with a plucked lead) — arranged in sections with crossfaded gains, per-section loudness printed so a dead section is caught without ears, encoded as 64 kbps MP3 with lamejs (4.9 MB for ten minutes of music; the six looping stems were 8.3 MB of WAV)
- [x] T014l `Sound` plays one piece at a time through two players crossfading over 2.5 s; a scene's mood names the piece; the paddling cadence is two beats of the grid (0.984 s)
- [x] T014m The Chamberlin filter is clamped to a sane cutoff: the bass's wobble used to swing below zero and run away to infinity within a second — the old stems' bass had been doing the same
- [ ] T014n Listen on real speakers and tune the mixes; the renders were judged by their numbers

## Slice 9 — the water of the day

- [x] T014o `tides.gd`: the authored July day by the minute — height, current along the flood set, wind — pure and tested; the current carries the boat over the ground on the leg, in the groove and out; the HUD names the set and the wind; the plan's header says what the launch rides

## Slice 10 — choose your launch

- [x] T014p `TideGraph`: the day's water as a graph in the float plan's tide step — current filled above and below slack, wind, tide height, the night shaded — with the launch as a cursor you drag, tap, or move with ← → when the graph has focus; the leg's hours shaded from it
- [x] T014q `Tides.judge` and `verdict_line`: the old Phaser verdict ported and tested — mean current over the leg, worst chop, wind against tide — read out under the graph in a sentence
- [x] T014r The chosen launch is the save's `launchHour`: the chart's light follows it as you drag, the leg starts its clock from it, and the camp's evening starts from the hour you landed (`arrivedHour`, held to the evening)

## Slice 11 — day two

- [x] T014s `tools/geo/water_route.py` (shared with the ferry's track) and `tools/geo/leg_routes.py` → `godot/content/legs.json`: each leg's waypoints found over the real water between chart-read vias, its cove, its labels; the ferry's track regenerates byte-for-byte
- [x] T014t `src/content/expedition.js` is a list of legs — teaching per leg (float plan steps, landing, camp steps) under the same ids — with day two from Jones Island through Spieden Channel to Posey Island, a one-acre marine state park at the mouth of Roche Harbor; places and a Washington State Parks credit for Posey; the content test checks the legs chain
- [x] T014u `Leg` reads the legs (geometry merged with teaching) and the save's `legIndex`; the plan frames whichever leg is current, the trip launches from where the last one landed with that leg's sightings, the landing card and the camp are the leg's own, and camp's last card goes on to tomorrow's float plan with the tide fifty minutes later (`App.day()`), or home after the last leg. `?leg=1&scene=plan|trip|camp`, `?near=spieden|posey` for checks

## Slice 12 — the chart in the deck bag

- [x] T014v `ChartTile` + `chart.gdshader`: a north-up window of the real islands around the boat on the trip HUD, painted from the same height texture the water reads — land, shoal, deep, an inked coastline — with the leg's track dashed, the cove ringed, the boat as an arrow, a north mark and a kilometre bar; tap or press M to fold it to a corner mark (folded by default on a phone; the choice is kept in the save)

## Slice 13 — the water of the hour

- [x] T014w The sea on the trip is the hour's: `Tides.sea_state` (wind, and wind against the stream) sets the seascape, the hull and the sound as the day passes, so a launch into the afternoon southerly over the ebb is a different leg from the morning flood
- [x] T014x Rips, authored per leg in `leg_routes.py` (off Point Caution; the narrows of Spieden Channel; off Davison Head): `Leg.flow_at` scales the stream inside them with a smooth edge, the HUD names the rip and its factor, and in a rip the boat takes a wave on the beam every few seconds that the paddler braces for

## Slice 14 — small things seen on the water

- [x] T014y Place labels declutter: the nearer place keeps its name and a label that would land on it waits until it clears (Posey Island and Davison Head sat on one another from the channel)
- [x] T014z The title's Continue names the day as well as the station

## Slice 15 — over, and back in

- [x] T014aa Secondary stability in `StrokeMath.righting`: the righting torque peaks with the chine buried, dies at the point of no return and turns against the boat beyond it, so a boat not braced in time goes over and stays over (the roll is now read full-range); tested
- [x] T014ab On the trip a capsize is taught where it happens: 1-10-1, the wet exit, the paddle-float re-entry and pumping out as cards from the field lessons, then back in the boat fifteen minutes later with the warning to make the next landing the bail-out; swims are counted in the save. In Kayak School the boat comes back up with a word about bracing earlier. `?scene=trip&capsize=1` opens in the water for checks

## Slice 16 — the field guide and the credits

- [x] T014ac `guide.tscn` from the title: every species in the content by group, the ones met on the water marked from the save, then every source the game cites with its licence and a button to open it (the WorldCover attribution the data's licence asks for lives here). `?scene=guide&at=credits` scrolls to the sources

## Slice 17 — the shore at low tide

- [x] T014ad At camp, once the tent is up, "Walk the shore": the field guide's species for that beach (authored per leg in `leg_routes.py`: firs, Turkish towel, ochre stars, anemones and sea lettuce on Jones; madrone, stars, a nudibranch and sugar kelp on Posey) as cards in the order you meet them walking down, each kept in the save; the walk takes half an hour of the evening. A content test checks every shore id is a species. `?scene=camp&walk=1` opens on the shore
- [x] T014ae The HUD's channel line wraps on a phone instead of running off the screen, and the chart tile sits below it

## Slice 18 — day three, home on the ebb

- [x] T014af Leg 3 in `leg_routes.py` and the content: Posey Island east through Spieden Channel as it empties and south down San Juan Channel to the town float at Friday Harbor, sixteen kilometres; float plan, landing, and a take-out in place of a camp (close the plan, rinse and fold, what you learned, the ferry home) with no tent and "Look under the float" for the harbour's jellies and eelgrass
- [x] T014ag Each leg says which stream it rides (`favours`): `Tides.judge` and the verdict read the ebb as helping on the way home, tested; the last card of the expedition carries the tally — days, kilometres, species met, swims

## Slice 19 — the switches

- [x] T014ah Sound and music chips beside the Title button on every screen, kept in the save and applied at start: the autoload had the switches and nothing reached them, and a web game must be muteable
- [x] T014ai Once the expedition is done the title offers each day again, from its float plan

## Slice 20 — the engine on the wire

- [x] T014aj `server/precompress.mjs` writes brotli and gzip siblings at image build (`Dockerfile.godot`); the server sends a sibling with `Content-Encoding` when the browser accepts it and falls back to gzip on the fly; every file carries an ETag so a revalidation of the engine is a 304. Measured: the 38 MB engine is 6.5 MB as brotli, the 7.8 MB pack 5.9 MB; the whole export goes from 45 MB to about 13 MB on the wire, the first lever on the go/no-go "time to first frame" row

## Slice 21 — the music arrives after the first frame

- [x] T014ak The four pieces are excluded from the web pack (7.8 MB → 2.9 MB) and fetched from `audio/` beside the page once the scene asks for them, cached, and crossfaded in when they land; the editor and headless runs load them from the project as before; CI copies them beside the export

## Slice 22 — the ferry in the channel

- [x] T014al `Traffic`: an island ferry shuttles the San Juan Channel stretch of the real ferry track at sixteen knots with a dwell at each landing, coming down the channel to meet you on day one and in to meet you on the way home; within 800 m a card says to hold position and cross the wake bow-on, within 450 m one long blast, within 260 m its wake arrives on the beam and the brace is needed. Track maths tested headless; `?scene=trip&near=ferry` opens with it 600 m ahead

## Slice 23 — the partner

- [x] T014am `Partner`: a second boat, another preset and another skin, holding station off your starboard quarter, closing at your pace, riding the same water and stroking in the cadence; the opening line names them. With a partner alongside the rescue is the T-rescue (the paddle float stays the solo drill of Kayak School) and the time in the water is nine minutes, not fifteen. Station and preset choice tested headless

## Slice 24 — packing the boat

- [x] T014an `Packing` (the rules of `src/sim/packing.js`: arms per bag, pitch, mass at the ends, deck mass, the essentials) and a packing screen between Kayak School and the float plan: the real planform from above with the five places a dry bag can go, tap an item then a place, a trim line in words, "Pack it for me" for the suggested layout, and the essentials still on the beach named before you go. The trim is physics: the centre of mass moves with the pitch (a bow-heavy boat sits 3° bow-down, measured headless, and pushes water), mass at the ends slows the turn, deck mass softens the righting, and every stroke pays the Phaser sim's trim penalty. What is left behind is gone: no pump and the rescue bails with a sponge, no headlamp and the camp chores run in the dark. Sim tested headless; `?scene=pack`, `?pack=bow|ideal`

## Slice 25 — the debrief

- [x] T014ao `Score` (the rules of `src/sim/score.js`) and the record it counts: each leg landed keeps its launch and the tide's verdict on it, the landing hour, the swims, and the wildlife given room or approached inside the field guide's distance (a "too close" line on the water as it happens); each camp left is a night out and a clean camp; each drill finished in Kayak School is kept. The take-out ends in the debrief: miles, nights, score, each day as it went, how the points came, the drills, the species, and a share button (Web Share, else the clipboard). "Begin at Anacortes" starts a fresh record; the field guide and the drills are kept for good. Score and record tested headless; `?scene=debrief&demo=1`

## Slice 26 — the boat goes together

- [x] T014ap `Assembly` (the rules of `src/sim/assembly.js`: eight steps in order, half the mean and half the two jacks, never under 0.3) and the beach at Friday Harbor off the ferry: the skin unrolled flat, the colour-coded frame (`FrameModel`, keel and sheer tubes and ribs lofted from the same `Hull` as the skin, blue forward and red aft) snapped together beside it and slid in bow first, the coaming, the seat, then the two side jacks and the keel jack as holds with a right length — let go early and the hull is slack, hang on and it is forced — and the check. The heritage and hull-tension lessons on their steps. The boat you build is the boat you paddle: the quality is kept and the kayak loses keel and wanders by it, with "slack hull" on the water line. Rules tested headless; `?scene=assemble&step=N`

## Slice 27 — the rescue drill

- [x] T014aq Kayak School ends with the drill you hope never to need: the boat goes over on its own in the harbour's flat water and the solo rescue is taught in it — wet exit, the paddle-float re-entry, pump out — then "Back in the boat" rights it and the drill is demonstrated for the debrief. The trip's capsize keeps the partner's T-rescue, and the two share one card machinery. `?scene=school&drill=rescue`

## Slice 28 — the wind on the boat

- [x] T014ar `Windage`: the day's wind, already on the HUD line, now acts on the boat — a drift downwind at three per cent of the wind's speed against the keel's grip, and with way on the bow comes up into a beam wind, a stern-heavy boat more so (the packing's stern-heavy wander is this now, not a sine). Rules tested headless

## Slice 29 — pause, and About

- [x] T014as Pause on the water and in Kayak School: a chip, Escape or P, and the page going into a pocket (focus lost) all stop the physics and the clock under a card that says so and saves the place; Continue or Title from it. About on the title grows up: the game and its independence, the land acknowledgment and the safety note always reachable, the maker's link, and the way to the field guide and sources. `?about=1`

## Slice 30 — the wind is up

- [x] T014at The float plan's bail-outs are real on the water: each leg names its landings of refuge (`bailouts` in `src/content/expedition.js`, checked against the chart's places), and when the sea state the hour makes crosses rough a card names them with their distances and offers the choice — push on, or wait it out in the nearest lee for an hour and a half, after which the water is read again. The wait is kept in the day's record and the debrief says so. `?launch=15` on day one meets the afternoon southerly against the ebb

## Slice 31 — the night in the cove

- [x] T014au The night is a night: the last camp card waits for full dark, the seascape carries a star dome (points on a sphere, brighter along one band, fading in with the dark and following the viewer), and the cove is bioluminescent — a tap on the water at night stirs a burst of light, the way a hand or a paddle does in a warm Salish Sea August. `?scene=camp&step=4&glow=1`

## Slice 32 — the whales

- [x] T014av A pod of Bigg's killer whales works Spieden Channel on day two: a bull with the tall fin and two smaller animals, black with the eye patch and the saddle, each surfacing on its own beat with the bull's blow, travelling the channel and coming back round. The pod is a sighting like the rest — the field guide's card at 1.4 km, Be Whale Wise's thousand yards as the line, given room or too close in the day's record — and the sightings' distance now follows an animal that moves, not the water it started in. `?scene=trip&leg=1&near=orcas`

## Slice 33 — let seals rest

- [x] T014aw The hauled-out seals keep the hundred yards the field guide now gives them: inside it every head comes up and turns to the water, inside fifty metres they flush off the rock and are gone, with a line saying what that is — the disturbance the distance prevents. The approach counts as given room or too close in the day's record like the whales. Kayak School's tour now says six drills. `?scene=trip&near=yellow&close=1`

## Slice 34 — the camp keeps the packing's word

- [x] T014ax What was left on the beach at Friday Harbor is felt at camp, on the card where it would have been used: no tent at the pitch, no food at the raccoons, no water on Posey, no warm layers at drying out, no sleeping bag at night, and the headlamp as before — one plain line each

## Slice 35 — every station, every push

- [x] T014ay `tests/smoke/godot-stations.mjs`: every station of the export opened from its check URL in a fresh page, a page error or a GDScript error anywhere failing the run, the screenshots kept as artifacts. CI runs it after the export, so the sweep that was done by hand after each slice is done by the machine on every push

## Slice 36 — the numbers on the phone

- [x] T014az `?perf=1` shows the go/no-go rows where they matter, on the phone in the hand: frames per second now and the worst of the last ten seconds, the frame time, the time from the page starting to load to the first frame, the engine's memory, and the device; printed once to the console at ten seconds for a smoke run. Kayak School's last card now says "Pack the boat", which is where it goes

## Slice 37 — the kelp

- [x] T014ba A kelp bed is a thing the boat feels: inside seventy metres of a bull kelp sighting the hull drags on the fronds (a linear drag that makes every stroke a short one) and the swell lies down — a kelp bed is a lee, and a slow one — with a line saying so the first time. `?scene=trip&near=yellow` starts in it

## Slice 38 — the wake, bow-on or on the beam

- [x] T014bb The ferry's wake is taken as the card taught: a boat turned across the ferry's track, bow into the waves, takes a few pitches; a boat left parallel takes the full roll on the beam, and the line says to turn the bow into it next time. `Traffic.wake_beam` and `wake_kick` tested headless; the ferry start joins the stations sweep

## Slice 39 — the crossing rule, kept or not

- [x] T014bc The ferry encounter is judged as the card taught: a boat that holds from the horn to the wake "held for the ferry"; a boat that paddled on as it came "paddled on as the ferry came", said at the wake and kept in the day's record for the debrief

## Slice 40 — a fresh expedition is fresh

- [x] T014bd "Begin at Anacortes" clears the swims and the ferries met with the rest of the record, and the take-out's tally counts this expedition's swims from the days' record rather than a lifetime total; the field guide and the drills stay yours for good

## Slice 41 — the long way home has its wildlife too

- [x] T014be Day three, the longest day, had three sightings to the others' five: the pod works Spieden Channel again on the way home, west on the ebb this time, and the eagle sits on Jones Island's south point as the boat comes down the channel

## Slice 42 — fog on the first-light launch

- [x] T014bf Day three leaves Posey at first light on the ebb, and first light on cold water is fog: the leg carries `fog: {until, burn}`, the float plan says so at a launch inside it, and on the water the sky, the sun and the haze close to a couple of hundred metres (`Fog`, `Seascape.set_fog`). The chart keeps its last fix (a hollow arrow, "fog · last fix") and the destination line swaps the distance for the visibility and "steer 047°"; the note teaches the compass, the stroke count and the partner. The ferry sounds a long blast every two minutes (Rule 35) while it is within earshot, heard from a direction, and the fog burns off over the hour after `until`. The day's record carries `fog`; `?fog=1` socks any leg in for a check; `trip-fog` joins the stations sweep.

## Slice 43 — the fog lifts, and the compass work is judged

- [x] T014bg When the fog burns off, the note says where the compass put you: on the line you planned, or how many metres off it (`Leg.off_track_m`), with the cove's bearing to carry on by. The day's record keeps when the fog closed in and how far off the line it lifted, and the debrief's day line says so ("in fog from 06:00, came out 260 m off the line"). `?fog=lift` lifts it after a second for a check; `trip-fog-lifts` joins the sweep.

## Slice 44 — where the boat sleeps

- [x] T014bh The first camp card reads the tide table aloud — tonight’s high water, when, and how far above the afternoon’s — and asks where the boat sleeps: the water’s edge, the wrack line, or the grass (`HaulOut`). The boat moves to the spot; the night card says what the water did (found it and you hauled it up wet in the dark; came within a hand; slept dry), and a boat the tide found is back in the shallows on the night card. The day's record keeps the spot and the verdict and the debrief's day line says so. `?boat=edge|wrack|grass` for checks; `camp-floated` joins the sweep.

## Slice 45 — where the food sleeps

- [x] T014bi The raccoons card on Jones asks where the food sleeps — the tent, the boat’s hatch, or the hard box hung — and the night card says what came of it (the breakfast gone and a torn mesh door; claw marks in the skin a hand from the seam; the box swinging untouched). The choice row is shared with the boat’s (`_choice_row`), the day's record keeps `foodVerdict`, and the debrief says so. `?food=tent|hatch|hung`; `camp-raccoons` joins the sweep.

## Slice 46 — a September day to paddle it again on

- [x] T014bj The title offers the day to paddle on: the settled July day, or a September spring tide with the first autumn southerly behind it (bigger tides, a 2.8-knot ebb, twenty-one knots by early afternoon, the light gone by seven). `TRIP_DAYS` in `src/content/tripDay.js` is the list, `App.chosen_day()` the choice (`save.dayId`, `?day=` for checks); the float plan's head and the debrief's kicker name the day. Everything that read the one day reads the chosen one: the tide graph, the verdicts, the sea state, the bail-outs, the stream, the night's high water. `trip-september` joins the sweep.

## Slice 47 — the day's own light

- [x] T014bk The sky, the sun and the night follow the chosen day's sunrise and sunset rather than a fixed July (`Daylight.dusk_at / night_at / sun_elevation`, pure and tested; `Seascape` reads the day from `App` when it has one, so every scene follows). A September evening is dark by half past eight. The float plan's verdict is poor when the launch would land after the light (`Tides.lands_in_the_dark`), with the sunset in the line; night on the water puts up a note once, the day's record keeps `dark`, and the debrief says "landed in the dark". The camp's night card waits for the day's own dark. `?hour=20` sets the trip's clock for checks; `trip-dark` joins the sweep.

## Slice 48 — the ferry home

- [x] T014bl The expedition ends the way it began: from the take-out the last boat runs the ferry's real track back to Anacortes in the evening light, the islands coming abeam in the reverse order, each one you paddled under saying so (`Leg.places_paddled`), then the slip at Anacortes and the debrief. `App.advance_leg` sends the last leg to the ferry with `save.ferryHome`; `?scene=ferry&home=1` for checks; `ferry-home` joins the sweep.

## Slice 49 — the seamanship calls

- [x] T014bm The debrief reads the judgement calls back from the days' record (`Seamanship`, pure and tested): the launch windows, the boat above the tide, the food out of reach, daylight for the landing, the ferry held for, the line held in fog, room given to wildlife, the boat kept upright — each listed only when it came up, kept or not, with a note in plain words. The share line counts them.

## Slice 50 — the water on Posey

- [x] T014bn Posey has no water, and the card now asks what happens to the eight litres that came in the boat: drink your fill, ration it, or cross to Roche Harbor for the tap in the morning (`WaterPlan`, pure and tested). Drink it and the long day home is paddled thirsty — the stroke is 85 % of itself (`Kayak.effort`) and a note says so at the first stroke; the tap costs an hour, so the float plan's earliest launch moves to 07:00 (`Leg.earliest_launch`) and the plan says why, which on the ebb is the whole lesson. The record keeps it, the debrief and the seamanship calls say so. `?water=fill|ration|roche`; `camp-water` joins the sweep.

## Slice 51 — the loop closes

- [x] T014bo The debrief ends with "Paddle it again · a september day" (or the July day, from September): a fresh record on the other day, from the first float plan, with the boat built, Kayak School behind you and the packing standing (`App.paddle_again`, `App.fresh_record` — Begin uses the same list, now with the water run and the ferry-home flag in it). The title remembers the last expedition in a line: the day, the miles, the seamanship calls kept, the score.

## Slice 52 — the partner's voice

- [x] T014bp The partner speaks at the moments that matter, a few words in front of the note or the card — the ferry ("Hold here. Let it go by."), the sea standing up, fog closing in and lifting, the pod, the seals' rock, a capsize, the dark, the kelp, the wake, the landing (`PartnerVoice`, pure and tested: every line under seventy characters, silent when there is nothing to say). Never on a drill, where you are alone.

## Slice 53 — the whale-watch fleet

- [x] T014bq Every pod in the channel has a whale-watch boat on it, holding off abeam at the field guide's distance for the species, parallel to the animals, engine at idle (`WhaleWatch`, its station pure and tested). Coming within reach of it says so once: the fleet keeps the distance you are asked to keep, and it is watching where you are too. It is there on both passes of the pod; `?leg=1&near=fleet` starts beside it, and `trip-fleet` joins the sweep.

## Slice 54 — the sounds of the channel

- [x] T014br Four more synthesized sounds (`tools/synth-audio.mjs`): the orca's blow, heard loud alongside and as a breath on the wind at a kilometre (`Wildlife.breathed` → `Sound.blow` by distance); the bald eagle's thin chitter when it is sighted; a diesel at idle that comes up as the whale-watch boat nears and glides away (`Sound.set_engine`, a loop, silenced when the water scene goes); and the raccoons' quarrel from the dark on the night card when the food was not hung.

## Slice 55 — the docs catch up

- [x] T014bs README's Godot paragraph describes the expedition as it is after fifty-four slices (the two days, the fog, the fleet, the camp's choices, the ferry home, the seamanship calls) and the check URLs that open each of them; CLAUDE.md gains the gotchas paid for this run (autoload-reading classes hang the headless tests, `signal` after `extends`, the spawn-before-near order).

## Slice 56 — a bearing held on the compass

- [x] T014bt Kayak School teaches the compass before the fog needs it: a seventh drill, before the rescue, puts a mark on the dome seventy degrees round from the bow and asks for the bearing held within ten degrees for twelve seconds under way (`compass` in `src/content/anatomy.js`; the mark is the trip's own destination mark, cleared when the drill ends). The tour says seven drills; the debrief counts them. `?scene=school&drill=compass`; `school-compass` joins the sweep.

## Slice 57 — the call ashore

- [x] T014bu The take-out's first card, closing the float plan, asks when the call goes in: from the float, after the boat is packed, or on the ferry (`FloatPlanClose`, pure and tested). The last take-out card says what came of it — a Coast Guard boat out of Friday Harbor looking for two paddlers on the car deck, a late call with the phone already in someone's hand, or nothing, which is the point. The record keeps it, the debrief and the seamanship calls say so. `?close=now|later|forgot`; `takeout-close` joins the sweep.

## Slice 58 — the sweep runs three abreast

- [x] T014bv `tests/smoke/godot-stations.mjs` opens its stations through a small worker pool (`CONCURRENCY`, three by default) instead of one after another: each station is a twelve-second wait, not a load, so the sweep of twenty-eight stations takes a third of the time and CI's Godot job comes back under twenty minutes. The report is in finishing order, with each station's errors under its line.

## Slice 59 — the squall

- [x] T014bw The September day carries a rain table (`rain: [{t, r}]`, read by `Tides.rain`): the front comes through with the early-afternoon wind. On the water the sky goes slate, the light flat, and streaks fall around the boat (`Seascape.set_rain`, CPUParticles following the sea's follow node); a synthesized rain loop comes up with it (`Sound.set_rain`); the partner says hood up and the note says the wind behind the front is the thing to watch. The day's record keeps it and the debrief says "paddled through a squall". `?hour=14` on the September day, or `&rain=1` on any leg; `trip-squall` joins the sweep.

## Slice 60 — the field notes

- [x] T014bx Every note the water puts up on a leg — the fog closing in, the blast, the kelp, the seals' heads coming up, the ferry's wake, the partner's words in front of them — is kept in order (the opening line and the stroke counts aside, two dozen at most) and lands in the day's record; the debrief lists them day by day under "Field notes", so the teaching the trip gave in passing can be read back afterwards.

## Slice 61 — the names stay off the HUD

- [x] T014by The place names floated over the land no longer land on the HUD: `PlaceLabels.keep_out` seeds the collision rects with the speed, note and destination lines, the compass and the chart tile (a taller, wider set on a phone), so a cove's name that would sit under the note waits until it clears.

## Slice 62 — the chart of the expedition

- [x] T014bz The debrief draws the whole expedition on one chart (`ExpeditionChart`, from the same height texture the water reads): the three legs' tracks, the camps as rings, and a numbered mark where each field note was said — the notes carry the boat's position now (`noteAt`), and the list numbers them to match. The window is the legs' own extent with a margin, so nothing is cropped on a phone.

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
