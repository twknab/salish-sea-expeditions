## Crossing a stream: the boat makes good the sum of where it paddles and where the water takes it.
## Point straight at the far side and the stream sets you down; point up into it by the ferry angle
## and the boat crabs across on the line. Pure, so the headless tests can check it.
class_name FerryGlide

const KN := 0.5144

## The course made good over the ground, degrees true, for a velocity through the water and a stream.
static func course_made_good(through_water: Vector3, stream: Vector3) -> float:
	var g := Vector3(through_water.x + stream.x, 0.0, through_water.z + stream.z)
	if g.length() < 0.05:
		return NAN
	return fposmod(rad_to_deg(atan2(g.x, -g.z)), 360.0)

## How many degrees the stream is setting the boat off the way its bow points (signed, + to starboard).
static func set_off(heading_deg: float, cmg_deg: float) -> float:
	if is_nan(cmg_deg):
		return 0.0
	return wrapf(cmg_deg - heading_deg, -180.0, 180.0)

## The heading to steer to make good `want_deg` at `speed` m/s through the water against `stream`:
## turn up into the stream by the angle whose sine is the cross-stream over the boat's speed.
## NAN when the stream across the line is faster than the boat — no angle holds it.
static func heading_for(want_deg: float, speed: float, stream: Vector3) -> float:
	var w := deg_to_rad(want_deg)
	var line := Vector2(sin(w), -cos(w))
	var across := Vector2(-line.y, line.x)
	var cross := Vector2(stream.x, stream.z).dot(across)
	if speed <= 0.05 or absf(cross) >= speed:
		return NAN
	return fposmod(want_deg - rad_to_deg(asin(cross / speed)), 360.0)
