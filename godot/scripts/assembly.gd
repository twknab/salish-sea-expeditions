## Assembling the folding kayak, by the rules of the Phaser build's src/sim/assembly.js: the steps
## in order, a hold on each tension step, and the boat only as good as its tension — a rushed jack
## costs tracking for the whole trip.
class_name Assembly
extends RefCounted

const NEEDED_HOLD := 2.4      # seconds a jack wants: shorter is slack, much longer is forced
const RUSHED := 0.25          # the quality a rushed step is given
const MISSING := 0.4          # a step never recorded
const PASS := 0.5             # under this, the step is asked again

## Overall quality 0..1 from the per-step results, keyed by step id: half the mean of every step,
## half the two tension steps, and never under 0.3.
static func quality(results: Dictionary, steps: Array) -> float:
	if steps.is_empty():
		return 1.0
	var sum := 0.0
	var tension := 0.0
	var n_t := 0
	for s in steps:
		var q := float(results.get(s.id, MISSING))
		sum += q
		if str(s.id).begins_with("jack"):
			tension += q
			n_t += 1
	var mean := sum / steps.size()
	var t := tension / n_t if n_t > 0 else mean
	return clampf(0.5 * mean + 0.5 * t, 0.3, 1.0)

## The quality of a hold: full at the needed time, falling off either side — slack when let go
## early, forced when held on past it.
static func hold_quality(held: float, needed := NEEDED_HOLD) -> float:
	return clampf(1.0 - absf(held - needed) / needed, 0.0, 1.0)

## Whether a step is done by holding (the jacks) or by a tap.
static func is_hold(step: Dictionary) -> bool:
	return str(step.get("gesture", "")) == "hold"

static func verdict(q: float) -> String:
	if q > 0.85:
		return "Skin tight, frame seated. She will track true."
	if q > 0.6:
		return "Assembled. A little slack in the hull: she will wander some."
	return "Assembled, but a slack hull wanders and flexes. You can live with it, or not."
