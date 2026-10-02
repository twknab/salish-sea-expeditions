# Feature Specification: Outfitting — your boat, your clothes, your kit

**Feature Branch**: `claude/game-concept-discussion-uuwa07`

**Created**: 2026-09-30

**Status**: Implemented

**Input**: "Let the user choose their kayak skin at the onset and show them their boat. Show them
their paddling gear, their drysuit, underlayers, and their kit for the weekend — research this
rather than taking my word for it. The first scene needs to be more visual: images of Anacortes or
Friday Harbor."

**Constitution principles served** (v1.1.0): I (teach real sea kayaking: dress for immersion, the
gear that saves you), IV (honest about safety: required equipment, cold water), V (beauty: the
first screens are pictures, not text), VIII (imagery drawn by us from real places; no marks).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick where to start from pictures (Priority: P1)

The start choice shows two illustrated postcards — the Anacortes ferry terminal and Friday Harbor —
each with a line of truth about the place. Tapping one picks the start.

**Independent Test**: From the acknowledgment, the next screen is two pictures; either one leads on.

### User Story 2 - Choose and see your boat (Priority: P1)

Before anything else in the trip, the player picks a skin from the five real colourways and sees the
whole boat from the side and from above, recoloured as they choose.

**Independent Test**: Picking a skin redraws both views; the choice persists and the water, POV and
Kayak School use it. Assembly no longer asks again.

### User Story 3 - Dress for immersion, layer by layer (Priority: P1)

The player dresses a paddler in order — base layer, insulation, drysuit, spray skirt and PFD, then
head, hands and feet — and each layer says what it does and why, sourced. Out of order, the game
explains why (e.g. a drysuit keeps water out, but it is the layers underneath that keep you warm).

**Independent Test**: The layers can only be put on in the teaching order; each shows one card; at
the end the full outfit stands dressed.

### User Story 4 - See the weekend kit (Priority: P2)

A flat lay of the kit for one night on Jones Island, grouped as the paddler carries it: on the PFD,
on deck, inside the boat. Tapping an item says what it is for. A short card states what the law
requires in each country (US: PFD, sound signal, a white light after dark; Canada adds a 15 m
buoyant heaving line and a bailer or pump).

**Independent Test**: Every item in the flat lay is tappable and names its purpose; the legal card
names both countries' minimums.

## Requirements

- **FR-001** The start choice is two illustrated postcards (Anacortes terminal, Friday Harbor).
- **FR-002** A new Outfitting scene runs once per trip after the start choice: Boat → Clothing →
  Kit, then continues to the Ferry or Kayak School.
- **FR-003** Skin choice moves from Assembly to Outfitting (Assembly keeps it only when no skin was
  ever chosen).
- **FR-004** Clothing content lives in `src/content/kit.js` with `sourceIds`, validated by tests.
- **FR-005** Correct the Jones Island water fact: the tap normally runs May–September but has been
  off until further notice — carry all your water.
- **FR-006** Every screen works with touch and with the keyboard (focus ring), and can be paused.

## Research (summary; sources in credits.js)

- Salish Sea surface water: about 46 °F (8 °C) in winter, 50–53 °F (10–12 °C) in summer. Dress for
  immersion whenever the water is below about 70 °F (21 °C). (Paddling Magazine; REI; Guillemot)
- Layering: wicking synthetic or wool base; fleece insulation; drysuit with latex gaskets at neck
  and wrists; cotton loses its insulation when wet. (REI; Paddle Boston; Guillemot)
- Carry: bilge pump and paddle float, spare paddle, tow line, VHF (Ch 16), whistle, knife, light,
  first aid, chart and compass. (BASK; Kitsap sea kayak checklist; REI checklist)
- Law: US — wearable PFD, a sound-producing device, and a white light (torch) ready to show after
  dark (COLREGS Rule 25(d)). Canada — PFD, whistle, 15 m buoyant heaving line, bailer or pump, and
  a light at night. (USCG Auxiliary Paddler's Guide; MEC summary of Transport Canada)
- Jones Island: potable water normally May–September; currently off until further notice.
  (Washington State Parks)
