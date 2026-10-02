# Feature Specification: More wildlife, drawn and sighted

**Feature Branch**: `claude/game-concept-discussion-uuwa07`

**Created**: 2026-10-02

**Status**: Implemented (first batch; the rest is issue #2)

**Input**: "For wildlife we need to add the following (drawings of them): Orca (Bigg's and Southern
Residents), minke whale, humpback, Dall's porpoise, Steller sea lion, California sea lion, sea otter,
river otter, Pacific sea star, sunstar, various kelps and red and green seaweeds, cedar, arbutus and
madrona, peregrine falcon, bald eagle, kingfisher, oystercatcher, cormorants and cormorant
rookeries, moon jelly and PNW jellyfish. Focus on some of these for now; we can add more later."

**Constitution principles served** (v1.1.0): II (teach the whole place), IV (honest: rarity and
status said plainly — sea otters are rare here; sunflower stars are critically endangered), V
(beauty: every species drawn, lit, recognisable), VIII (drawn by us; facts sourced).

## User Stories

- **US1 (P1)** Every field-guide page shows a lit portrait of its species, drawn from a 3D model.
- **US2 (P1)** On the water, the species you can sight are visible where they live: whales and
  porpoises surfacing, sea lions hauled out, an otter floating, birds overhead or on the rocks, a
  cormorant rookery on a cliff, kelp beds, jellies drifting.
- **US3 (P1)** Orcas come in two ecotypes that never mix — Bigg's (mammal hunters, small groups)
  and Southern Residents (salmon eaters, endangered) — and the pass you meet is one or the other.
- **US4 (P2)** New species in this pass (below); the rest of the list is tracked as an issue.

## In this pass

Mammals: Bigg's orca, Southern Resident orca, humpback, minke, Dall's porpoise, harbour porpoise,
Steller sea lion, California sea lion, sea otter (rare), river otter, harbour seal.
Birds: bald eagle, peregrine falcon, belted kingfisher, black oystercatcher, pelagic cormorant and
its cliff rookery. Sea life: ochre sea star, sunflower star, moon jelly, lion's mane jelly,
fried-egg jelly, water jelly. Seaweeds: bull kelp, sugar kelp, sea lettuce, Turkish towel.
Trees: western redcedar, Pacific madrone (madrona in the US, arbutus in Canada — one species).

## Requirements

- **FR-001** Each species has sourced facts, a `model` recipe, and (where it lives on the water) a
  `top` view. Rarity and conservation status are stated where they matter.
- **FR-002** Portraits and top views are baked by the studio (spec 004) and cached; the old
  emblems remain the fallback.
- **FR-003** Sighting placements along the route are illustrative, and the field guide says so.
- **FR-004** Saves that recorded the old single "orca" keep it, as a Bigg's sighting.
