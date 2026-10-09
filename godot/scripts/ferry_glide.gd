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

## How far the course made good runs off the line to the destination, degrees (0 with no way on).
static func off_line(cmg_deg: float, line_deg: float) -> float:
	if is_nan(cmg_deg):
		return 0.0
	return absf(wrapf(cmg_deg - line_deg, -180.0, 180.0))

## A crossing held: on the line for at least three-fifths of the time the stream ran across it.
## A stream met for under a minute is not a crossing, and is not judged.
static func held(stream_s: float, on_line_s: float) -> String:
	if stream_s < 60.0:
		return ""
	return "held" if on_line_s >= 0.6 * stream_s else "set"

## Kayak School's stream: `knots` running straight across a line, setting a boat that points down
## the line off to starboard.
static func across(line_deg: float, knots: float) -> Vector3:
	var w := deg_to_rad(line_deg + 90.0)
	return Vector3(sin(w), 0.0, -cos(w)) * knots * KN

## The note on the water when the stream sets the boat well off: how far, which way, and the heading
## that holds the line to `cove` — or, when no angle can, what to do instead. `short` is a phone's
## two lines, which must clear the destination and stream lines under the note.
static func note(set_deg: float, steer: float, cove: String, short := false) -> String:
	if short:
		return "Set %d° %s: no angle holds it. Wait for slack." % [int(absf(set_deg)), "right" if set_deg > 0.0 else "left"] if is_nan(steer) else "Set %d° %s: steer about %03d° to hold the line." % [int(absf(set_deg)), "right" if set_deg > 0.0 else "left", int(round(steer))]
	if is_nan(steer):
		return "The stream is setting you %d° off, and it runs faster across the line than you paddle. No angle holds it: wait for slack, or make for the bail-out down-stream." % int(absf(set_deg))
	var hold := "To hold the line to %s, point up into it: steer about %03d°, a ferry angle, and the boat crabs across on the line." % [cove, int(round(steer))]
	return "The stream is setting you %d° %s of where the bow points (the dashed line on the chart). %s" % [int(absf(set_deg)), "right" if set_deg > 0.0 else "left", hold]

## How fast a boat at `speed` makes good along the line to `want_deg` when it steers the ferry angle
## for `stream`, m/s: below zero when the stream is the faster, head-on or across.
static func headway(want_deg: float, speed: float, stream: Vector3) -> float:
	var steer := heading_for(want_deg, speed, stream)
	if is_nan(steer):
		return -1.0
	var w := deg_to_rad(want_deg)
	var h := deg_to_rad(steer)
	return (Vector3(sin(h), 0.0, -cos(h)) * speed + stream).dot(Vector3(sin(w), 0.0, -cos(w)))

## The card when the stream outruns the boat on its line, head-on or across.
## Slack is when the water stops between flood and ebb, and the crossing is made then.
static func slack_body(knots: float, cove: String, slack_h: float, clock: String, after_dark := false) -> String:
	var why := "The stream here is running %.1f knots, and on the line to %s a boat at touring pace makes almost nothing over the ground — the shore stands still beside you however hard you paddle." % [knots, cove]
	if is_nan(slack_h):
		return why + " It does not ease for hours. Make for the bail-out down-stream, with the water, and cross another day."
	return why + " The stream eases to slack at %s, when the water stops between the flood and the ebb. Wait in the eddy along the shore and cross then — or push on, and be carried." % clock + (" Slack comes after sunset: wait for it and the landing is in the dark, light on." if after_dark else "")
