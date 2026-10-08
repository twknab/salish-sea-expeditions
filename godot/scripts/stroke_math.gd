## Stroke grading, the same rule the Phaser game taught with: a long reach, a steady pull and an
## exit at the hip are what torso rotation looks like from the outside.
class_name StrokeMath
extends RefCounted

const GOOD_STROKE := 0.6
const MAX_SPEED := 2.4  # m/s, a hard sprint
const STROKE_DV := 0.34 # m/s per full-quality stroke at rest

static func rotation_quality(reach: float, smoothness: float, exit_at_hip: bool) -> float:
	var q := 0.15 + 0.45 * clampf(reach, 0.0, 1.0) + 0.25 * clampf(smoothness, 0.0, 1.0)
	if exit_at_hip:
		q += 0.15
	return clampf(q, 0.0, 1.0)

## Forward impulse for a stroke of quality q: an arm stroke still moves the boat, just less.
static func stroke_speed_gain(q: float) -> float:
	return STROKE_DV * (0.35 + 0.65 * q)

## Yaw from a stroke on one side: arm strokes zig-zag far more than rotation strokes.
static func stroke_yaw(q: float, rocker: float) -> float:
	return 0.05 * (1.6 - q) * (0.6 + 0.8 * rocker)

## Buoyant force per probe for a given immersion depth (m): a soft spring with a cap, so the boat
## settles at `settle` metres of immersion under `share` of its weight.
static func buoyancy(depth: float, share_weight: float, settle: float) -> float:
	if depth <= 0.0:
		return 0.0
	return minf(depth / settle, 4.0) * share_weight
