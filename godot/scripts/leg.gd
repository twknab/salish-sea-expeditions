## The first leg, as data the plan, the water and the camp all read: Friday Harbor to the north
## cove on Jones Island, by the channel. Waypoints in the terrain's local metres.
class_name Leg
extends RefCounted

const FROM := "fridayHarbor"
const TO := "jones"
## Up the harbour, round Point Caution, north past the Labs and Yellow Island, up the east side of
## Jones and round into the north cove, which opens to the north. Every point checked against the
## terrain's water (the gazetteer's Jones point is mid-island; the cove's water is COVE).
const WAYPOINTS: Array[Vector3] = [
	Vector3(420.0, 0.0, -700.0),
	Vector3(900.0, 0.0, -1900.0),
	Vector3(300.0, 0.0, -3200.0),
	Vector3(-500.0, 0.0, -5200.0),
	Vector3(-1500.0, 0.0, -7200.0),
	Vector3(-1300.0, 0.0, -8400.0),
	Vector3(-1500.0, 0.0, -9700.0),
	Vector3(-2200.0, 0.0, -9420.0),
]
## The water in the north cove: where the leg ends and the camp's beach is found from.
const COVE := Vector3(-2200.0, 0.0, -9420.0)
const LAUNCH_HOUR := 9.5
const TOURING_KNOTS := 3.0

static func length_m() -> float:
	var s := 0.0
	for i in range(1, WAYPOINTS.size()):
		s += WAYPOINTS[i].distance_to(WAYPOINTS[i - 1])
	return s

## Bearing in degrees true from a to b (x east, z south; 0 = north).
static func bearing_deg(a: Vector3, b: Vector3) -> float:
	return fposmod(rad_to_deg(atan2(b.x - a.x, -(b.z - a.z))), 360.0)

static func hours_at_touring_pace() -> float:
	return length_m() / (TOURING_KNOTS * 1852.0)

static func clock(hour: float) -> String:
	var h := int(floor(hour)) % 24
	var m := int(floor((hour - floor(hour)) * 60.0))
	return "%02d:%02d" % [h, m]

## Launch hours the float plan lets you choose from, and the step between them.
const EARLIEST_LAUNCH := 6.0
const LATEST_LAUNCH := 16.0
const LAUNCH_STEP := 0.25

## The chosen launch hour from the App autoload when there is one; the headless tests get the default.
static func launch_hour() -> float:
	var ml := Engine.get_main_loop()
	var app: Node = ml.root.get_node_or_null("App") if ml is SceneTree else null
	if app == null:
		return LAUNCH_HOUR
	return clampf(float(app.save.get("launchHour", LAUNCH_HOUR)), EARLIEST_LAUNCH, LATEST_LAUNCH)
