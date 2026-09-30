# Data Model: First Voyage

Units: distances in metres in the simulation (nautical miles for display, 1 nm = 1852 m); speeds
in metres per second internally (knots for display, 1 kn = 0.5144 m/s); angles in radians with 0 =
north, clockwise positive; time as minutes since local midnight on the trip day.

## Paddler (a seat)

| Field | Type | Notes |
| --- | --- | --- |
| id | string | `player`, `partner` |
| controller | `'touch' \| 'ai' \| 'remote'` | Only `touch` and `ai` exist in this slice |
| energy | 0..1 | Drains with effort, recovers with rest (faster in sheltered water) |
| fit | 0..1 | Connection to the boat from Boat School (feet, knees, backband, skirt) |
| skills | `Record<SkillId, number>` | Experience points; level = f(xp) |
| timeInWater | seconds | Starts at capsize, drives the cold-water model |

SkillId: `fit`, `edging`, `forward`, `sweep`, `brace`, `roll`, `rescue`, `navigation`, `campcraft`.

## Kayak

| Field | Type | Notes |
| --- | --- | --- |
| x, y | metres | Local grid, origin at Friday Harbor |
| heading | radians | |
| speed | m/s | Through the water |
| turnRate | rad/s | |
| edge | -1..1 | From the hips input; negative = left knee up (boat tilted right) |
| roll | radians | Heel angle from waves plus edge; capsize beyond a threshold |
| upright | boolean | |
| cockpitWater | 0..1 | After re-entry; pumped out |
| assembly | 0..1 | From assembly quality; affects tracking |
| rocker | 0..1 | Hull jacks: 0 = long waterline (tracks), 1 = more rocker (turns) |
| trim | `{ pitch, list }` | From packing |
| buoyancy | 0..1 | From how full the flotation bags are |

## PaddlerInput (intent each tick)

See `contracts/paddler-input.md`.

## Conditions (function of time and position)

- `tideHeight(t)` metres above chart datum at Friday Harbor.
- `current(t, x, y)` → `{ speed, set }` — channel current from the event table, scaled by a
  spatial field (mid-channel, off points, eddies behind points).
- `wind(t)` → `{ speed, from }`.
- `seaState(t, x, y)` → 0..1 chop, rising sharply when wind opposes current.

## TripPlan

`{ date, launchMinute, route: [{x,y}], start: 'ferry'|'fridayHarbor' }`

## GearItem

`{ id, name, massKg, essential, enables: string[] }` — e.g. `paddleFloat` enables `pfRescue`.
Packing state: `{ bow: GearId[], stern: GearId[], deck: GearId[], left: GearId[] }`.

## Lesson

`{ id, scene, skill?, title, text, sourceIds: string[] }`. A lesson is **demonstrated** when the
player performs its skill correctly; the debrief lists lessons met and demonstrated.

## Species

`{ id, common, scientific, group, blurb, facts: string[], where, sourceIds, approachMetres? }`
Observed state lives in the save. `approachMetres` holds the minimum respectful distance for
species with a rule (orca, hauled-out seals).

## WildlifeEncounter

`{ speciesId, x, y, heading, state: 'approaching'|'passing'|'gone', closest, respectful }`

## Camp

`{ tentSite: {x,y,elevation}, foodStored: boolean, traceLeft: number, nightCounted: boolean }`
Tent above the night's high water plus margin keeps the clean-camp bonus.

## TripRecord / Save

See `contracts/save-format.md`.

## Credit

`{ id, title, author, licence, url, usedFor }` — every external source, shown on Credits.

## State transitions

```text
Title → (first launch) Acknowledgment → StartChoice
StartChoice → Ferry → BoatSchool | StartChoice → BoatSchool
BoatSchool → Assembly → Packing → Planning → Paddle
Paddle ⇄ Capsize/Rescue (overlay) ; Paddle → POV moment → Paddle
Paddle (arrive Jones Island) → Camp → TidePools (optional) → Debrief → Title
```

Save points: after every arrow.
