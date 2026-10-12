class_name Kelp
extends RefCounted
## Bull kelp as a harbour: a bed slows the stream through it, and a boat stopped deep in one, a
## stalk draped over the deck, is held where it is while the water goes by. Pure, so the tests can
## sit in it.

const HELD_DEPTH := 0.5   # how deep in the bed (0 at its edge, 1 at its heart) a stalk is in reach
const HELD_SPEED := 0.3   # m/s: slower than this through the water is stopped
const SLOWS := 0.5        # the stream through the heart of a bed, as a fraction lost

## True when the boat is stopped deep enough in the bed to drape a stalk over the deck.
static func held(depth: float, speed: float) -> bool:
	return depth >= HELD_DEPTH and absf(speed) < HELD_SPEED

## What the stream still carries the boat, 0..1, at this depth in the bed and this pace.
static func carry(depth: float, speed: float) -> float:
	if held(depth, speed):
		return 0.05
	return 1.0 - SLOWS * clampf(depth, 0.0, 1.0)
