class_name Forecast
extends RefCounted
## The forecast on the VHF's weather channel for a day's paddle: the wind at launch and the most it
## builds to before the landing. Without the radio, there is no forecast on the water. Pure, so the
## tests can listen.

const POINTS := ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
const STRONG_KN := 12.0  # wind that stands a channel up against the stream: worth planning around

## The eight-point name of a direction in degrees true.
static func point(deg: float) -> String:
	return POINTS[int(round(fposmod(deg, 360.0) / 45.0)) % 8]

## The wind from `from_h` to `to_h`: [kn at launch, strongest kn, the hour of it, its direction].
static func span(day: Dictionary, from_h: float, to_h: float) -> Array:
	var start: Dictionary = Tides.wind(day, from_h)
	var top_kn := float(start.kn)
	var top_h := from_h
	var top_deg := float(start.fromDeg)
	var h := from_h
	while h <= to_h:
		var w: Dictionary = Tides.wind(day, h)
		if float(w.kn) > top_kn + 0.01:
			top_kn = float(w.kn)
			top_h = h
			top_deg = float(w.fromDeg)
		h += 0.25
	return [float(start.kn), top_kn, top_h, top_deg]

## The plan's line for it, or the line for a radio left on the beach.
static func line(day: Dictionary, from_h: float, to_h: float, has_radio: bool) -> String:
	if not has_radio:
		return "The VHF is on the beach at Friday Harbor, and the weather channel with it: you launch on what the sky looks like."
	var s := span(day, from_h, to_h)
	var start := "%s %d knots" % [point(float(Tides.wind(day, from_h).fromDeg)), int(round(float(s[0])))]
	if float(s[1]) < float(s[0]) + 3.0:
		return "On the VHF's weather channel: wind %s at launch, and no more than %d knots before you land." % [start, int(round(float(s[1])))]
	var warn := " Plan to be in a lee before then." if float(s[1]) >= STRONG_KN else ""
	return "On the VHF's weather channel: wind %s at launch, building to %s %d knots by %s.%s" % [start, point(float(s[3])), int(round(float(s[1]))), Leg.clock(float(s[2])), warn]
