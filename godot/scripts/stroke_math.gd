## Stroke grading, the same rule the Phaser game taught with: a long reach, a steady pull and an
## exit at the hip are what torso rotation looks like from the outside.
class_name StrokeMath
extends RefCounted

const GOOD_STROKE := 0.6
const MAX_SPEED := 2.4  # m/s, a hard sprint
const STROKE_DV := 0.34 # m/s per full-quality stroke at rest
const DRAW_DV := 0.6     # m/s sideways from one draw stroke: the blade planted out to the side, pulled in to the hull
const KEEL_DRAG := 2.2   # per second: how fast the keel line kills sideways slip on an assembled boat

## How far one draw carries the boat sideways before the keel stops it: the slip decays as e^(-kt),
## so the whole of it comes to dv / k.
static func draw_drift(dv: float, keel_drag: float) -> float:
	return dv / keel_drag

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

## Secondary stability. The righting torque grows with the roll until the chine is well buried, then
## falls away to nothing at the point of no return and turns against the boat beyond it, so a boat
## that is not braced in time goes over and stays over. Returns a torque coefficient in the units
## kayak.gd applies about the keel line.
const STABLE_ROLL := 0.85       # radians: where the righting moment peaks
const NO_RETURN_ROLL := 1.25    # radians: past this the boat goes over
const RIGHTING_GAIN := 90.0

static func righting(roll: float) -> float:
	var a := absf(roll)
	var s := signf(roll)
	if a <= STABLE_ROLL:
		return RIGHTING_GAIN * roll
	var peak := RIGHTING_GAIN * STABLE_ROLL
	return s * peak * clampf(1.0 - (a - STABLE_ROLL) / (NO_RETURN_ROLL - STABLE_ROLL), -1.0, 1.0)

## Over, and staying over: past the point of no return by a margin.
static func capsized(roll: float) -> bool:
	return absf(roll) > NO_RETURN_ROLL + 0.1
