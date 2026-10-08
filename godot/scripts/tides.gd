## The day's water: tide height, current and wind from the authored July day in the content
## (tripDay), interpolated by the minute. Pure, so the headless tests can check it. The current is
## a set and a drift: on the flood it runs toward floodSetDeg, on the ebb the other way.
class_name Tides
extends RefCounted

const KNOT := 0.5144  # m/s

## Linear interpolation of a {t: minutes, <key>: value} table, flat beyond its ends.
static func sample(table: Array, minutes: float, key: String) -> float:
	if table.is_empty():
		return 0.0
	if minutes <= float(table[0].t):
		return float(table[0][key])
	for i in range(1, table.size()):
		var a: Dictionary = table[i - 1]
		var b: Dictionary = table[i]
		if minutes <= float(b.t):
			var u := inverse_lerp(float(a.t), float(b.t), minutes)
			return lerpf(float(a[key]), float(b[key]), u)
	return float(table[table.size() - 1][key])

## Tide height in metres above mean lower low water at an hour of the day.
static func height_m(day: Dictionary, hour: float) -> float:
	return sample(day.get("tides", []), hour * 60.0, "h")

## Current speed in knots at an hour; positive is flood, negative ebb.
static func current_kn(day: Dictionary, hour: float) -> float:
	return sample(day.get("current", []), hour * 60.0, "kn")

## The current as a velocity over the ground in metres per second (x east, z south).
static func current_vector(day: Dictionary, hour: float) -> Vector3:
	var kn := current_kn(day, hour)
	var set_deg := float(day.get("floodSetDeg", 330))
	var dir := Vector3(sin(deg_to_rad(set_deg)), 0.0, -cos(deg_to_rad(set_deg)))
	return dir * kn * KNOT

## Wind speed in knots and the direction it blows from, in degrees, at an hour.
static func wind(day: Dictionary, hour: float) -> Dictionary:
	var w: Array = day.get("wind", [])
	return { "kn": sample(w, hour * 60.0, "kn"), "fromDeg": sample(w, hour * 60.0, "fromDeg") }

## A line for the HUD or the plan: "flood 1.2 kn setting 330°", "slack", "ebb 1.6 kn setting 150°".
static func describe(day: Dictionary, hour: float) -> String:
	var kn := current_kn(day, hour)
	if absf(kn) < 0.15:
		return "slack water"
	var set_deg := float(day.get("floodSetDeg", 330))
	if kn < 0.0:
		set_deg = fposmod(set_deg + 180.0, 360.0)
	return "%s %.1f kn setting %03d°" % ["flood" if kn > 0.0 else "ebb", absf(kn), int(round(set_deg))]
