# Feature Specification: First Voyage

**Feature Branch**: `claude/game-concept-discussion-uuwa07`

**Created**: 2026-09-30

**Status**: Implemented — first playable pass (see tasks.md and README “Known gaps”)

**Input**: User description: "First Voyage — the first playable vertical slice of Salish Sea Expeditions:
title and land acknowledgment; start by walk-on ferry from Anacortes or at Friday Harbor; plan the
launch from a real tide and current table; assemble and pack the folding kayak; paddle Friday
Harbor to Jones Island with a computer-controlled partner; one wildlife encounter and one capsize
with a choice of rescues; a cockpit point-of-view prototype; camp the first night; debrief with
score, skills and a share card."

**Constitution principles served** (v1.1.0): I (teach real sea kayaking), II (teach the whole
place — natural history, community, history), III (a place of First Peoples), IV (honest about
safety), V (beauty and elegance), VI (simulation with a game layer), VII (mobile-first and
smooth), VIII (legally and respectfully sourced). IX governs how it is built.

## User Scenarios & Testing *(mandatory)*

**Play order** (priority is build order; this is the order a player meets things): title, land
acknowledgment and safety note → optional walk-on ferry → **Kayak School: know your boat, your body,
your paddle** → assembly and packing → trip planning → the crossing (wildlife, capsize, tide rip)
→ camp and tide pools → debrief.

### User Story 0 - Kayak School: know your boat, your body, your paddle (Priority: P1, first)

Before anything else, on the beach at Friday Harbor, the player is introduced to the folding sea
kayak they will paddle all game, and to the idea that a kayak is **worn, not sat in**.

- **The boat's anatomy**: bow and stern, deck and hull, keel and chines, cockpit and coaming,
  backband, foot pegs, thigh braces, the spray skirt that seals you in, and the parts that make
  this kayak special — an aluminium frame inside a tough skin, tensioned by three hull jacks (two
  along the sides, one on the keel) that can also change the hull's rocker, and hence how it
  turns and tracks, even while paddling. There are no hatches: gear goes in through the cockpit,
  into flotation dry bags fore and aft that also keep the boat afloat after a capsize.
- **The body**: sit tall; feet on the pegs; knees up and out into the thigh braces; the hips
  connect you to the boat. Lower body steers and tilts the boat; upper body drives it. Edging —
  lifting one knee to tilt the kayak while the head stays centred over it — is the core skill
  behind turning, bracing and rolling. The hip snap (a sharp knee lift that rights the boat while
  the head stays down) is the heart of every brace and roll.
- **The paddle**: blade and shaft, power face, grip ("paddler's box" — hands a little wider than
  shoulders, knuckles aligned with the blade), feather angle, and the rule that power comes from
  torso rotation and legs, not arms.

Each idea is practised immediately in shallow, calm water: a forward stroke driven by rotation
(the player sees the boat run straighter and cost less energy), a sweep turn on edge, a low brace
with a hip snap, and — as the capstone — a first assisted look at the hip snap on the partner's
bow. Every later scene builds on these, and the debrief tracks them as named skills.

**Why this priority**: Everything else in the game depends on the player understanding that the
boat is controlled through the hips and the paddle is driven by the torso. It is also the single
most transferable lesson a new sea kayaker can take away.

**Independent Test**: A fresh player completes Kayak School in under five minutes and can then name
five parts of the kayak, explain edging, and perform a stroke, sweep, brace and hip snap in the
calm-water practice area.

**Acceptance Scenarios**:

1. **Given** the kayak on the beach, **When** the player taps a part, **Then** it is named and its
   job explained in one sentence, with an illustration of that part on this boat.
2. **Given** the player is seated, **When** they fit themselves in (feet, knees, backband, spray
   skirt), **Then** a "connected" indicator shows good contact and is required before launching.
3. **Given** calm water, **When** the player paddles with rotation (the stroke gesture that
   engages the torso), **Then** the kayak runs straighter and uses less energy than arm-only
   strokes, and the difference is shown.
4. **Given** the player edges the kayak with a knee lift, **When** they sweep, **Then** it turns
   more sharply than when flat.
5. **Given** a wobble, **When** the player braces and snaps the hips with head down, **Then** the
   boat rights; **When** they lift their head first, **Then** the brace fails and a tip explains.
6. **Given** Kayak School is complete, **When** the player later capsizes, **Then** the roll and
   brace gestures they meet reuse the same hip-snap motion they learned here.

---

### User Story 1 - Paddle the crossing to Jones Island (Priority: P1)

A player launches from Friday Harbor and paddles about 4–5 nautical miles up San Juan Channel to
Jones Island alongside a computer-controlled partner. They make forward strokes with alternating
touches, brace when a wave threatens to tip them, hold a ferry angle so the current does not sweep
them off course, and rest in eddies and kelp beds when energy runs low. Current strength and
direction change over the trip according to the tide.

**Why this priority**: Paddling is the heart of the game and the hardest thing to get right: it
proves the controls, the look of the water and whether current and wind feel real. Every other
story hangs off it.

**Independent Test**: Start directly on the water at Friday Harbor with default gear and
conditions, paddle to Jones Island, and arrive. Delivers the core experience on its own.

**Acceptance Scenarios**:

1. **Given** the player is on the water with a flood current running, **When** they point
   straight at Jones Island and paddle, **Then** they are carried visibly off course and a
   prompt at that moment explains the ferry angle.
2. **Given** the player holds an upstream ferry angle, **When** they paddle, **Then** their track
   over the ground runs close to the straight line to the destination.
3. **Given** the player's energy is low, **When** they rest in an eddy or kelp bed, **Then**
   energy recovers faster than when resting in open current.
4. **Given** a wave arrives beam-on, **When** the player braces in time, **Then** the kayak stays
   upright; **When** they do not, **Then** the risk of capsize rises.
5. **Given** the partner paddles alongside, **When** the player falls behind or drifts away,
   **Then** the partner adjusts pace and position to stay within hailing distance.

---

### User Story 2 - Capsize and rescue (Priority: P2)

Partway through the crossing, chop or a missed brace capsizes the player. Underwater, a
cold-water clock starts. The player chooses: attempt a roll, perform a self-rescue (paddle-float
re-entry, or the harder re-entry without one if the float was left behind), or signal the partner
for an assisted T-rescue. Each rescue is a short sequence of touch gestures matching the real
steps in the real order, followed by pumping out the cockpit.

**Why this priority**: Rescues are the most valuable real-world skill the game can teach and the
source of its drama. It depends on paddling existing (P1).

**Independent Test**: Trigger a capsize from a practice menu option in calm water and complete
each of the three rescues; each can be demonstrated without playing the full trip.

**Acceptance Scenarios**:

1. **Given** the player has capsized, **When** the capsize happens, **Then** the cold-water
   1-10-1 guidance is shown (about one minute to control breathing, about ten minutes of
   meaningful movement, about an hour before unconsciousness from hypothermia) and a clock runs.
2. **Given** the player chooses a roll, **When** they perform the gesture with correct timing,
   **Then** the kayak rights; **When** the roll fails, **Then** they can wet-exit and choose
   another rescue.
3. **Given** the player packed a paddle float, **When** they choose self-rescue, **Then** the
   sequence is: wet exit, keep hold of boat and paddle, fit the float, rig the paddle as an
   outrigger, climb onto the back deck, turn and slide in, pump out.
4. **Given** the player did not pack a paddle float, **When** they choose self-rescue, **Then** a
   harder re-entry is offered and remains possible, with lower success odds and a greater
   time and energy cost.
5. **Given** the partner is nearby, **When** the player signals for help, **Then** the partner
   performs a T-rescue: approaches, lifts and drains the bow across their deck, rights and
   stabilises the kayak, and the player re-enters with the partner holding it steady.
6. **Given** the cold-water clock passes the ten-minute mark, **When** the rescue is still not
   complete, **Then** the player's strength and gesture precision decrease noticeably.
7. **Given** a rescue is complete, **When** play resumes, **Then** a short debrief states what
   went well and the one step to improve.

---

### User Story 3 - Plan the launch from the tide and current table (Priority: P3)

Before launching, the player looks at a chart of San Juan Channel and a tide and current table
for the day, with a wind forecast. They pick a launch time. The game teaches slack water and why
wind blowing against the current makes steep, dangerous chop. The chosen time sets the current
and sea state the player then paddles through.

**Why this priority**: Timing a crossing is the most important decision a sea kayaker makes and
the clearest example of seamanship earning reward.

**Independent Test**: Plan a launch, then observe the resulting conditions in the paddling scene;
different launch times produce measurably different currents and chop.

**Acceptance Scenarios**:

1. **Given** the table is shown, **When** the player picks a time near slack water with the
   current in their favour, **Then** the crossing has gentle current and small waves.
2. **Given** the player picks a time when wind opposes a strong current, **When** they launch,
   **Then** the channel shows steep chop and capsize risk is higher, and the planning debrief
   explains why.
3. **Given** the chart is shown, **When** the player views the route, **Then** they can read the
   distance in nautical miles and identify the chart symbols used in the lesson (depth, kelp,
   hazards, compass rose).

---

### User Story 4 - Assemble and pack the folding kayak (Priority: P4)

On the beach the player assembles the folding kayak: connect the frame sections, slide the frame
into the skin, seat the coaming, then tension the hull with the three jacks. Then they pack gear
in dry bags and load it through the cockpit into the flotation bags fore and aft, with a small
deck bag for things needed on the water. Heavy items low and close to the cockpit keep the boat
balanced; a poorly trimmed boat handles worse, and flotation bags packed too loosely leave less
buoyancy after a capsize. Anything left on the beach is simply not available later.

While the frame goes together, a short lesson connects the folding kayak to its ancestors: the
skin-on-frame kayaks of Arctic peoples (Inuit, Yup'ik, Unangan/Aleut), and — contrasted, not
conflated — the cedar canoes that have always been the watercraft of the Salish Sea.

**Why this priority**: Makes the boat itself part of play and makes preparation matter, which
connects directly to the rescue choices in P2.

**Independent Test**: Assemble and pack, then paddle a short distance; skipped assembly steps or
poor trim produce measurably worse handling, and missing items are absent later.

**Acceptance Scenarios**:

1. **Given** the frame pieces and skin are laid out, **When** the player completes each step in
   order, **Then** the kayak is ready with full handling.
2. **Given** the player rushes or skips a tensioning step, **When** they paddle, **Then** the
   kayak tracks less straight and a tip explains the cause.
3. **Given** the gear list, **When** the player loads items, **Then** a trim indicator shows
   bow/stern and side-to-side balance, and handling reflects it.
4. **Given** the assembly lesson, **When** the player finishes the frame, **Then** they have seen
   an accurate, sourced account of where the skin-on-frame kayak comes from and how it differs
   from the Coast Salish cedar canoe.
5. **Given** the player leaves the headlamp behind, **When** evening falls at camp, **Then** camp
   tasks are harder, and the debrief notes the missing item.

---

### User Story 5 - Camp the first night and debrief (Priority: P5)

At Jones Island the player lands, pitches the tent above the high-tide line, stores food where
raccoons cannot reach it and leaves no trace. The night is counted. A debrief shows nautical
miles paddled, nights out, wildlife seen respectfully, clean-camp status and the lessons learned.
Skills used on the trip gain experience. Progress is saved on the device, and a share card can be
sent to friends.

At low tide the player can explore the tide pools near camp — sea stars, anemones, a
nudibranch, and with luck a giant Pacific octopus — adding entries to their field guide.

**Why this priority**: Closes the loop and gives the score and progression that make a player
come back.

**Independent Test**: Start at the Jones Island landing, make camp, reach the debrief and see the
save persist after reloading.

**Acceptance Scenarios**:

1. **Given** the player chooses a tent site below the high-tide line, **When** night passes,
   **Then** the tide reaches the tent, the clean-camp bonus is lost and the lesson is explained.
2. **Given** food is left out, **When** night passes, **Then** raccoons get into it and the
   player loses food and score.
3. **Given** the trip is complete, **When** the debrief shows, **Then** it lists miles, nights,
   wildlife, camp quality, skill experience gained and at least one lesson per scene.
4. **Given** the debrief is shown, **When** the player taps Share, **Then** a share card with the
   trip summary opens in the phone's share sheet (or is copied on desktop).
5. **Given** low tide at camp, **When** the player explores the tide pools gently (no lifting
   animals out, turning rocks back over), **Then** new field-guide entries unlock; handling
   animals roughly is discouraged with an explanation.
6. **Given** a completed trip, **When** the player reloads the game, **Then** their skills,
   nights out and totals are restored.

---

### User Story 6 - Wildlife encounters and the field guide (Priority: P6)

During the crossing, marine wildlife appears — harbour seals hauled out on rocks, or orcas
passing. The player earns credit for observing at a respectful distance and loses score for
approaching too closely. Paddling kayaks must keep at least the legally required distance from
Southern Resident orcas, stay out of their path, and give hauled-out seals room.

Every organism the player observes — on the water, in the air, in the tide pools, on shore —
unlocks an entry in a field guide: a beautiful illustration, a few true facts, where and when to
see it, and why it matters to the ecosystem.

**Why this priority**: Makes place and respect concrete, and is one of the most memorable moments
of paddling in these islands.

**Independent Test**: Spawn the encounter in the paddling scene and verify distance scoring both
ways.

**Acceptance Scenarios**:

1. **Given** orcas are sighted, **When** the player stops paddling and keeps their distance,
   **Then** the sighting is logged as seen respectfully and the whales pass.
2. **Given** orcas are sighted, **When** the player paddles toward them inside the required
   distance, **Then** a warning shows, score is deducted and the lesson explains the rule.
3. **Given** seals are hauled out, **When** the player passes too close and flushes them into
   the water, **Then** score is deducted and the reason is explained.
4. **Given** the player observes a species for the first time, **When** the sighting is logged,
   **Then** its field-guide entry unlocks with sourced facts and can be read at any time.

---

### User Story 7 - Arrive in a place of First Peoples, by walk-on ferry (Priority: P7)

On first launch the player sees a safety note (this game is not a substitute for instruction) and
a land acknowledgment that frames the whole game: these waters are the homelands and highways of
Coast Salish peoples, and the player is a visitor. From the ferry deck and in Friday Harbor the
player meets the islands as living communities — the town, the marine research station, the
people who work these waters. They choose to start with the walk-on ferry from Anacortes
— carrying the bagged kayak aboard, spotting islands from the deck and learning the route on the
chart — or to start directly at Friday Harbor.

**Why this priority**: Sets tone, place and respect; valuable but not needed to test the core
loop.

**Independent Test**: Fresh install shows the notes once; both start options lead to the Friday
Harbor launch.

**Acceptance Scenarios**:

1. **Given** a first launch, **When** the game opens, **Then** the safety note and land
   acknowledgment show before play and do not block on subsequent launches (still reachable
   from About).
2. **Given** the ferry start, **When** the ferry crosses, **Then** the player can identify at
   least three named islands and the route on the chart.
3. **Given** the land acknowledgment, **When** it is shown, **Then** it names the peoples of the
   places in this trip using sources published by those Nations.

---

### User Story 8 - Cockpit point-of-view prototype (Priority: P8)

For at least one moment of the crossing — a tide rip or the capsize — the view switches to the
paddler's-eye view from the cockpit: bow ahead, paddle shaft in view, horizon tilting with the
waves. This is a prototype to compare with the top-down view.

**Why this priority**: The camera decision is open; this story exists to answer it with something
playable.

**Independent Test**: Toggle the point-of-view moment on and off from a settings option and
compare frame rate and feel against top-down in the same conditions.

**Acceptance Scenarios**:

1. **Given** the player reaches the tide rip, **When** point-of-view is enabled, **Then** the
   moment plays in cockpit view with controls that still work and returns to top-down after.
2. **Given** a phone-sized device, **When** the point-of-view moment plays, **Then** it holds the
   same frame-rate target as top-down, or the finding is recorded.

---

### User Story 9 - The sea looks and sounds alive (Priority: P1, cross-cutting)

Throughout the slice the water is living — light shifting through the day, island reflections,
wind ripples, swell, foam, visible current lines and a tide rip, a fog bank, and the sunset
arriving at camp. A layered, realistic soundscape carries it: paddle strokes and drips, water on
the hull, wind, gulls, an eagle, the blow of an orca, seals, surf on the landing beach, the ferry
horn. Music is sparse and never covers the sea.

**Why this priority**: Beauty is a non-negotiable principle; it is not a later polish pass, so it
is judged in every story rather than built last.

**Independent Test**: Record a minute of paddling at morning, midday and sunset with sound on;
reviewers rate it against the beauty criteria (SC-009, SC-010).

**Acceptance Scenarios**:

1. **Given** the current strengthens, **When** the player looks at the water, **Then** current
   lines and rougher water are visible where the current runs, so the sea can be read.
2. **Given** sound is on, **When** the player paddles, rests, or wildlife appears, **Then** each
   has its own realistic sound, mixed so the sea stays in front.
3. **Given** evening falls at camp, **When** the sky changes, **Then** the water's colour and
   reflections change with it.

### Edge Cases

- The player quits mid-trip: the trip resumes from the last scene boundary on reload.
- The player rotates the phone to landscape: the game asks them to rotate back and pauses.
- The player never capsizes: a guaranteed capsize is not forced; a practice-rescue option is
  offered at camp so the lesson is not missed.
- The player runs out of energy mid-channel: they drift with the current; the partner can tow
  them to the nearest eddy at a score cost (a real technique).
- The player fails every rescue option: the partner stabilises them and the debrief teaches the
  failure; the trip continues rather than ending in death.
- Sound is off or muted: every audio cue that carries information also has a visual cue.
- A slow or older device: visual effects scale down automatically rather than dropping frames.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST show a safety note and a Coast Salish land acknowledgment on first
  launch, and keep both reachable from an About screen.
- **FR-002**: Players MUST be able to start by walk-on ferry from Anacortes or directly at Friday
  Harbor.
- **FR-003**: The game MUST present a chart of San Juan Channel from Friday Harbor to Jones Island
  showing real place names, distance in nautical miles and a compass rose.
- **FR-004**: The game MUST present a tide and current table and wind forecast for the trip day,
  derived from real published predictions for that area, and let the player choose a launch time.
- **FR-005**: The chosen launch time MUST determine current speed and direction and sea state
  along the route over the course of the crossing.
- **FR-006**: Players MUST assemble the folding kayak in ordered steps; skipped or rushed steps
  MUST reduce handling.
- **FR-007**: Players MUST load gear through the cockpit into the fore and aft flotation bags and a
  deck bag; trim MUST affect handling; unpacked items MUST be unavailable later.
- **FR-000a**: Before the first launch the game MUST teach the kayak's anatomy (including the
  frame, skin, hull jacks, cockpit fit, spray skirt and flotation bags), body connection through
  the hips (feet, knees, thigh braces, backband), edging, the hip snap, the paddle's parts and
  grip, and torso-driven strokes — each practised in calm water.
- **FR-000b**: Paddling physics MUST reward torso rotation and hip engagement: rotation-driven
  strokes MUST be more efficient than arm-only strokes, edging MUST sharpen turns, and braces and
  rolls MUST succeed only with a hip snap and a low head.
- **FR-000c**: The hull jacks MUST be adjustable while paddling, trading straight-line tracking
  (less rocker) against turning (more rocker).
- **FR-008**: The paddling scene MUST support forward strokes, turning, bracing and resting by
  touch, with the kayak's movement combining paddler input, current and wind.
- **FR-009**: The game MUST include a computer-controlled partner that paddles alongside, stays
  within hailing distance, and can perform an assisted rescue and a tow.
- **FR-010**: The partner MUST be modelled as a paddler seat that a human could later occupy, with
  no rules that only work for a computer-controlled partner.
- **FR-011**: The game MUST track paddler energy, which drains with effort and recovers with rest,
  faster in sheltered water.
- **FR-012**: A capsize MUST offer roll, self-rescue and assisted rescue; self-rescue MUST remain
  possible without a paddle float, at higher difficulty.
- **FR-013**: Each rescue MUST be a gesture sequence that follows the real steps in the real order,
  and MUST end with pumping out the cockpit.
- **FR-014**: A capsize MUST start a cold-water clock with 1-10-1 guidance; time in the water MUST
  reduce strength and precision.
- **FR-015**: The game MUST include at least one wildlife encounter where respectful distance is
  rewarded and approaching too closely is penalised, with the rule explained.
- **FR-016**: At least one moment MUST be playable in a cockpit point-of-view, switchable against
  top-down for comparison.
- **FR-017**: Camp MUST include choosing a tent site relative to the high-tide line, storing food
  against raccoons and leaving no trace, each with consequences.
- **FR-018**: A debrief MUST show nautical miles, nights out, wildlife seen respectfully, camp
  quality, skill experience gained and the lessons from each scene.
- **FR-019**: Skills (boat fit, edging, forward stroke, sweeps, bracing and hip snap, rolling,
  rescue, navigation, campcraft) MUST improve with
  practice and affect later performance.
- **FR-020**: Progress MUST save on the device automatically at each scene boundary and restore on
  reload, with no account required.
- **FR-021**: Players MUST be able to share a trip summary card through the device share sheet,
  or copy it where no share sheet exists.
- **FR-022**: Every lesson and factual or safety statement MUST carry a source reference in the
  game's content, and every external image or data source MUST appear on a Credits screen.
- **FR-023**: The folding kayak MUST be described generically (not by brand name or logo) until
  the brand owner grants permission.
- **FR-024**: The game MUST be playable in portrait on a phone, respect notch and home-bar safe
  areas, and ask the player to rotate back when held in landscape.
- **FR-025**: Every piece of information conveyed by sound MUST also be conveyed visually.
- **FR-026**: The water MUST show time-of-day lighting, island reflections, wind ripples, swell,
  foam, readable current lines and at least one tide rip and fog bank.
- **FR-027**: The game MUST have a layered, realistic ocean and wildlife soundscape, with music
  mixed beneath it, and separate volume controls for sea, wildlife and music.
- **FR-028**: The game MUST include a field guide in which every organism the player observes
  unlocks an illustrated entry with sourced facts; this slice MUST include at least twelve
  species across marine mammals, birds, intertidal life, kelp and trees.
- **FR-029**: Camp MUST offer tide-pool exploration at low tide, with gentle handling rewarded.
- **FR-030**: The land acknowledgment MUST frame the game as taking place in the homelands of
  Coast Salish peoples, naming them from sources published by those Nations.
- **FR-031**: The slice MUST include an accurate lesson on the history of the kayak (Arctic
  skin-on-frame origins) distinguished from the Coast Salish cedar canoe tradition.
- **FR-032**: The slice MUST introduce at least two island community places truthfully (for
  example Friday Harbor and its marine research station).
- **FR-033**: Cultural content MUST NOT depict sacred or ceremonial practice, MUST NOT use cultural
  designs as decoration, and MUST record its sources and review status.

### Key Entities

- **Paddler**: a seat in a kayak — energy, skills and experience, time in water, controlled by the
  player or by the computer (later possibly another player).
- **Kayak**: assembly quality, hull-jack tension and rocker, paddler fit (connection), edge,
  trim, loaded gear by flotation bag, water in the cockpit, upright or
  capsized.
- **Gear item**: name, weight, compartment, what it enables later (paddle float, pump, headlamp,
  VHF, water, food, tent, and the rest of the ten essentials).
- **Trip plan**: date, launch time, route, expected current and wind.
- **Conditions**: current speed and direction, wind, sea state, time of day — changing over the
  trip.
- **Lesson**: skill taught, scene, short text, source reference, whether the player demonstrated it.
- **Wildlife encounter**: species, required distance, outcome.
- **Camp**: tent site, food storage, trace left, night counted.
- **Trip record**: miles, nights, encounters, camp quality, lessons, score; kept in the save.
- **Species**: name (common, scientific), group, illustration, sourced facts, where and when seen,
  whether the player has observed it.
- **Credit**: source, licence, what it was used for.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-000**: After Kayak School, at least four of five playtesters can explain edging and say that
  power comes from the torso and control from the hips.
- **SC-001**: A first-time player completes the whole First Voyage, launch to debrief, in 15 to 30
  minutes.
- **SC-002**: In playtests with at least five people, at least four can afterwards explain in their
  own words what slack water is, why wind against tide is dangerous, and the steps of a
  paddle-float rescue.
- **SC-003**: A player who launches at a well-chosen time finishes the crossing with at least 25%
  more energy remaining than one who launches into a strong opposing current.
- **SC-004**: The game holds a steady 60 frames per second on a recent iPhone during paddling,
  and never drops below 30 on a three-year-old iPhone.
- **SC-005**: An experienced sea-kayak instructor reviewing every lesson finds no statement they
  would call unsafe or incorrect.
- **SC-006**: 100% of external images and data sources appear on the Credits screen with their
  licence.
- **SC-007**: After the point-of-view prototype, the team can make and record the camera decision
  based on play, not speculation.
- **SC-008**: A reload at any scene boundary loses no progress.
- **SC-009**: At least four of five playtesters, unprompted, describe the game as beautiful (or
  equivalent) when asked for three words about it.
- **SC-010**: With the screen covered, playtesters can tell calm water from a tide rip, and
  identify an orca's blow, by sound alone.
- **SC-011**: After one trip, playtesters can name at least five local species and one fact about
  each, and say whose homelands the islands are.
- **SC-012**: Any cultural content has been reviewed by a Coast Salish cultural representative
  before public release, or is withheld until it has been.

## Assumptions

- The trip day uses real published tide and current predictions for a fixed, representative
  summer date, bundled with the game; live predictions for today's date are a later feature.
- Wind is a plausible forecast for that day, authored rather than live weather.
- Distances and island shapes come from public-domain charts and elevation data.
- The Be Whale Wise distances used are the current US and Canadian guidance for paddlers, checked
  at build time and cited.
- The kayak's characteristics follow the manufacturer's published specification (16 ft / 4.9 m
  long, 22.5 in / 57 cm beam, about 22 kg, about 10 minutes to assemble, three hull jacks that
  tension the skin and set rocker for a waterline of roughly 12–15 ft, no hatches, flotation dry
  bags). The brand name and logo wait for permission; the facts about the boat do not.
- One computer-controlled partner only; real multiplayer, the leaderboard backend, the Gulf
  Islands and border crossing, and cloud deployment are separate features.
- The game is played online first, but works once loaded without a connection.
- English only for this slice, apart from verified place names in Coast Salish languages.
- Wildlife sounds come from licensed recordings or public-domain archives, credited on the
  Credits screen.
- Before public release, the project reaches out to the cultural offices of Coast Salish Tribes
  and First Nations connected to the route. Until review, cultural content is limited to the land
  acknowledgment and content published by the Nations themselves.
