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

## Rain, 0 dry to 1 a squall, at an hour; a day without a rain table is dry.
static func rain(day: Dictionary, hour: float) -> float:
	return clampf(sample(day.get("rain", []), hour * 60.0, "r"), 0.0, 1.0)

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

## Sea state 0..1 at an hour: wind builds waves, and wind blowing against the current shortens and
## steepens them — the channel's classic chop. Wind with the current flattens them.
static func sea_state(day: Dictionary, hour: float, current_scale := 1.0) -> float:
	var w := wind(day, hour)
	var wind_kn := float(w.kn)
	var from_deg := float(w.fromDeg)
	var air := Vector3(-sin(deg_to_rad(from_deg)), 0.0, cos(deg_to_rad(from_deg)))  # the way the air moves
	var cur := current_vector(day, hour) * current_scale
	var wind_wave := clampf(wind_kn / 25.0, 0.0, 1.0)
	var opposing := 0.0
	var c_speed := cur.length()
	if wind_kn > 0.01 and c_speed > 0.01:
		var dot := air.dot(cur) / c_speed
		opposing = clampf(-dot, 0.0, 1.0) * clampf(c_speed / 1.0, 0.0, 1.5)
	return clampf(wind_wave * (0.55 + 1.1 * opposing), 0.0, 1.0)

## True when the wind and the current are opposed strongly enough to matter.
static func wind_against_tide(day: Dictionary, hour: float) -> bool:
	var w := wind(day, hour)
	if float(w.kn) < 6.0 or absf(current_kn(day, hour)) < 0.7:
		return false
	var from_deg := float(w.fromDeg)
	var air := Vector3(-sin(deg_to_rad(from_deg)), 0.0, cos(deg_to_rad(from_deg)))
	return air.dot(current_vector(day, hour)) < 0.0

## Judging a launch hour for a leg that runs north with the flood: the mean current over the leg's
## hours (positive helps), the worst chop, and whether wind opposes the tide at any point.
## Returns {cur, worst, against, verdict: "good" | "fair" | "poor"}.
## The next low water from an hour, within the next tidal cycle and a bit: {hour, h}.
static func next_low(day: Dictionary, hour: float) -> Dictionary:
	var best := { "hour": hour, "h": height_m(day, hour) }
	var t := hour
	while t <= hour + 14.0:
		var v := height_m(day, t)
		if v < float(best.h):
			best = { "hour": t, "h": v }
		t += 1.0 / 6.0
	return best

## Slack water: the first hour within the next eight when the stream has eased under half a knot,
## or turned — NAN when it does not, in the data the day carries.
static func next_slack(day: Dictionary, hour: float) -> float:
	var was := current_kn(day, hour)
	var t := hour
	while t <= hour + 8.0:
		var kn := current_kn(day, t)
		if absf(kn) < 0.5 or signf(kn) != signf(was):
			return t
		t += 1.0 / 6.0
	return NAN

## Every turn of the stream between two hours: the slack waters, where the current crosses zero.
static func slacks(day: Dictionary, h0: float, h1: float) -> Array:
	var out: Array = []
	var step := 1.0 / 12.0
	var t := h0
	var was := current_kn(day, t)
	while t < h1:
		var now := current_kn(day, t + step)
		if signf(now) != signf(was) and was != 0.0:
			out.append(t + step * absf(was) / maxf(absf(was) + absf(now), 0.0001))
		was = now
		t += step
	return out

## When the sun sets on the day, in hours.
static func sunset_h(day: Dictionary) -> float:
	return float(day.get("sunset", 1270)) / 60.0

## True when a leg launched then, taking that long, lands after the light has gone.
static func lands_in_the_dark(day: Dictionary, launch_hour: float, hours: float) -> bool:
	return launch_hour + hours > sunset_h(day) - 0.5

static func judge(day: Dictionary, launch_hour: float, hours: float, favours := "flood") -> Dictionary:
	var cur := 0.0
	var worst := 0.0
	var against := false
	var n := 0
	var h := launch_hour
	while h <= launch_hour + hours + 1e-6:
		cur += current_kn(day, h)
		worst = maxf(worst, sea_state(day, h))
		against = against or wind_against_tide(day, h)
		n += 1
		h += 1.0 / 6.0
	cur /= float(maxi(n, 1))
	if favours == "ebb":
		cur = -cur  # positive means the stream runs the way the leg goes
	var dark := lands_in_the_dark(day, launch_hour, hours)
	var good := cur >= 0.2 and worst < 0.3 and not against and not dark
	var poor := against or worst > 0.45 or cur < -0.8 or dark
	return { "cur": cur, "worst": worst, "against": against, "dark": dark, "verdict": "good" if good else ("poor" if poor else "fair") }

## The verdict in a sentence, for the plan.
static func verdict_line(day: Dictionary, launch_hour: float, hours: float, favours := "flood") -> String:
	var j := judge(day, launch_hour, hours, favours)
	var cur := float(j.cur)
	var against := "the flood" if favours == "ebb" else "the ebb"
	var carry := "the channel carries you" if cur >= 0.2 else ("you paddle against %s" % against if cur <= -0.2 else "the water is near slack")
	var squall := turn_line(day, launch_hour, hours, favours)
	var h := launch_hour
	while h <= launch_hour + hours:
		if rain(day, h) > 0.5:
			squall += " A squall comes through at %s." % Leg.clock(h)
			break
		h += 0.5
	match String(j.verdict):
		"good":
			return "Good: %s, light wind, and no chop to speak of.%s" % [carry, squall]
		"poor":
			if bool(j.dark):
				return "Poor: the sun sets at %s and you would land in the dark." % Leg.clock(sunset_h(day))
			if bool(j.against):
				return "Poor: wind against the stream, and the channel stands up in short, steep chop.%s" % squall
			if cur < -0.8:
				return "Poor: %s for the whole leg.%s" % [carry, squall]
			return "Poor: %s, but the wind builds a rough sea on the way.%s" % [carry, squall]  # the chop, not the stream
	return "Fair: %s, but there is chop on the way — keep the bail-outs in mind.%s" % [carry, squall]

## When the stream turns inside the leg: the hour of that slack, and which way the water runs after
## it, as a sentence. A turn in the first or last quarter hour is the launch's or the landing's, not
## the leg's, and goes unsaid.
static func turn_line(day: Dictionary, launch_hour: float, hours: float, favours := "flood") -> String:
	for t in slacks(day, launch_hour + 0.25, launch_hour + hours - 0.25):
		var after := current_kn(day, float(t) + 0.5) * (-1.0 if favours == "ebb" else 1.0)
		return " The stream turns at %s, partway through, and %s after it." % [Leg.clock(snappedf(float(t), 1.0 / 12.0)), "carries you" if after > 0.0 else "runs against you"]
	return ""

## The same day's tables run `minutes` later: tomorrow's water, roughly, is today's fifty minutes on.
static func shifted(day: Dictionary, minutes: float) -> Dictionary:
	var out := day.duplicate(true)
	for key in ["tides", "current", "wind"]:
		var table: Array = out.get(key, [])
		for row in table:
			row.t = float(row.t) + minutes
	return out
