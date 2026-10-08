## Where the boat sleeps: the night's high water against where it was carried to. The tide table
## is the whole lesson — tonight's high is higher than this afternoon's, and a boat left at the
## water's edge is found by it in the small hours. Pure, so the headless tests can check it.
class_name HaulOut

## The places a boat can be left, and how far above the landing's water each one is.
const SPOTS := [
	{ "id": "edge", "name": "At the water’s edge", "above_m": 0.3, "short": "the water’s edge" },
	{ "id": "wrack", "name": "Above the wrack line", "above_m": 1.3, "short": "the wrack line" },
	{ "id": "grass", "name": "Up in the grass, tied off", "above_m": 2.4, "short": "the grass" },
]
const CLOSE_M := 0.2     # within this of the hull is a near thing
const MORNING := 6.0     # the water the boat must outlast runs to tomorrow's first light

static func spot(id: String) -> Dictionary:
	for s in SPOTS:
		if s.id == id:
			return s
	return SPOTS[0]

## The highest the water comes between the landing and the morning, in metres above the datum.
static func night_high_m(day: Dictionary, arrived_hour: float) -> float:
	var h := Tides.height_m(day, arrived_hour)
	var when := arrived_hour
	var t := arrived_hour
	while t <= 24.0 + MORNING:
		var v := Tides.height_m(day, t)
		if v > h:
			h = v
			when = t
		t += 1.0 / 6.0
	return h

## The hour the night's high comes, same clock as the leg's (past 24 is after midnight).
static func night_high_hour(day: Dictionary, arrived_hour: float) -> float:
	var h := Tides.height_m(day, arrived_hour)
	var when := arrived_hour
	var t := arrived_hour
	while t <= 24.0 + MORNING:
		var v := Tides.height_m(day, t)
		if v > h:
			h = v
			when = t
		t += 1.0 / 6.0
	return when

## How far the water rises above the landing's level before morning.
static func rise_m(day: Dictionary, arrived_hour: float) -> float:
	return night_high_m(day, arrived_hour) - Tides.height_m(day, arrived_hour)

## "floated", "close" or "dry" for a spot against the night's rise.
static func verdict(spot_id: String, rise: float) -> String:
	var above := float(spot(spot_id).above_m)
	if rise >= above:
		return "floated"
	if rise >= above - CLOSE_M:
		return "close"
	return "dry"

## The line the first card carries: what the table says is coming.
static func forecast_line(day: Dictionary, arrived_hour: float) -> String:
	var high := night_high_m(day, arrived_hour)
	var when := night_high_hour(day, arrived_hour)
	return "Tonight’s high water is %.1f m at %s, %.1f m above where the water stands now." % [high, Leg.clock(fmod(when, 24.0)), high - Tides.height_m(day, arrived_hour)]

## The line the night card carries: what the water did to the boat.
static func night_line(spot_id: String, day: Dictionary, arrived_hour: float) -> String:
	var when := Leg.clock(fmod(night_high_hour(day, arrived_hour), 24.0))
	match verdict(spot_id, rise_m(day, arrived_hour)):
		"floated":
			return "The tide found the boat at %s: you woke to the hull knocking on the drift logs and hauled it up in the dark, wet to the waist. Everything in the day hatch is soaked, and the morning starts with wringing it out." % when
		"close":
			return "The water came to within a hand of the hull at %s and went back. A near thing; the wrack line is where the last high stopped, not where tonight’s will." % when
		_:
			return "The boat slept dry above the night’s high water; the sea came and went below it."

## A few words for the day's record.
static func record_words(spot_id: String, rise: float) -> String:
	match verdict(spot_id, rise):
		"floated":
			return "the tide found the boat in the night"
		"close":
			return "the tide came within a hand of the boat"
		_:
			return ""
