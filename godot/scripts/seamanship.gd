## The judgement calls an expedition is made of, read back from the days' record: the launch
## window, the boat above the tide, the food out of reach, daylight for the landing, the ferry
## held for, the stream crossed on a ferry angle, the line held in fog, room given to wildlife,
## the boat kept upright. A call counts
## only on a day it came up — no fog, no fog call. Pure, so the headless tests can check it.
class_name Seamanship

## [{label, ok, note}] for the record, in the order the calls come on a trip.
static func calls(days: Array) -> Array:
	var out: Array = []
	var n := days.size()
	if n == 0:
		return out
	var good := 0
	var fair := 0
	for d in days:
		match str(d.get("verdict", "fair")):
			"good":
				good += 1
			"fair":
				fair += 1
	out.append({ "label": "Launched on the water's own time", "ok": good + fair == n and good > 0, "note": "%d of %d launches on a good window%s" % [good, n, ", none on a poor one" if good + fair == n else ", %d on a poor one" % (n - good - fair)] })
	var boats: Array = []
	var foods: Array = []
	var dark := 0
	var swims := 0
	var ferries := 0
	var ferries_held := 0
	var fogs := 0
	var fogs_held := 0
	var sightings := 0
	var close := 0
	var waters: Array = []
	var plans: Array = []
	var streams: Array = []
	for d in days:
		var sv := FerryGlide.held(float(d.get("streamS", 0.0)), float(d.get("onLineS", 0.0)))
		if sv != "":
			streams.append(sv)
		var fp := str(d.get("floatPlan", ""))
		if fp != "":
			plans.append(fp)
		var wv := str(d.get("waterVerdict", ""))
		if wv != "":
			waters.append(wv)
		var bv := str(d.get("boatVerdict", ""))
		if bv != "":
			boats.append(bv)
		var fv := str(d.get("foodVerdict", ""))
		if fv != "":
			foods.append(fv)
		if bool(d.get("dark", false)):
			dark += 1
		swims += int(d.get("swims", 0))
		var held := int(d.get("ferryHeld", 0))
		var crossed := int(d.get("ferryCrossed", 0))
		ferries += held + crossed
		ferries_held += held
		if bool(d.get("fog", false)):
			fogs += 1
			if float(d.get("fogOffM", -1.0)) >= 0.0 and float(d.get("fogOffM", -1.0)) < 150.0:
				fogs_held += 1
		var room := int(d.get("respectful", 0))
		var too := int(d.get("violations", 0))
		sightings += room + too
		close += too
	if not boats.is_empty():
		var floated := boats.count("floated")
		var near := boats.count("close")
		out.append({ "label": "Carried the boat above the night's tide", "ok": floated == 0, "note": ("the tide found it %s" % ("once" if floated == 1 else "%d times" % floated)) if floated > 0 else ("a near thing %s, but dry" % ("once" if near == 1 else "%d times" % near) if near > 0 else "dry every night") })
	if not foods.is_empty():
		var taken := foods.count("taken")
		var worked := foods.count("worked")
		out.append({ "label": "Kept the food out of reach", "ok": taken == 0 and worked == 0, "note": "the raccoons had the breakfast" if taken > 0 else ("they worked the hatch and left marks in the skin" if worked > 0 else "hung, and nothing came of the raccoons") })
	if not waters.is_empty():
		out.append({ "label": "Kept water for the paddle", "ok": not waters.has("thirsty"), "note": "the long day home was paddled thirsty" if waters.has("thirsty") else ("an hour to the tap at Roche Harbor, and full bottles" if waters.has("late") else "rationed, and enough") })
	out.append({ "label": "Landed in daylight", "ok": dark == 0, "note": "every landing" if dark == 0 else ("%s in the dark" % ("one landing" if dark == 1 else "%d landings" % dark)) })
	if ferries > 0:
		out.append({ "label": "Held for the ferry", "ok": ferries_held == ferries, "note": "%d of %d times" % [ferries_held, ferries] })
	if not streams.is_empty():
		var set_n := streams.count("set")
		out.append({ "label": "Crossed the stream on a ferry angle", "ok": set_n == 0, "note": "on the line, pointed up into the water" if set_n == 0 else "set down the stream %s, the bow on the far side and the boat going elsewhere" % ("once" if set_n == 1 else "%d times" % set_n) })
	if fogs > 0:
		out.append({ "label": "Held the line in fog", "ok": fogs_held == fogs, "note": "came out on the line" if fogs_held == fogs else "came out off the line — the stream had the boat while the islands were gone" })
	if sightings > 0:
		out.append({ "label": "Gave wildlife its room", "ok": close == 0, "note": "every time" if close == 0 else ("too close %s" % ("once" if close == 1 else "%d times" % close)) })
	if not plans.is_empty():
		out.append({ "label": "Closed the float plan", "ok": not plans.has("forgot") and not plans.has("late"), "note": "never closed — a boat went out looking for you" if plans.has("forgot") else ("closed late, with the phone already in someone's hand" if plans.has("late") else "from the float, before the boat was out") })
	out.append({ "label": "Stayed upright", "ok": swims == 0, "note": "no swims" if swims == 0 else ("in the water %s, and back in the boat" % ("once" if swims == 1 else "%d times" % swims)) })
	return out

static func kept(list: Array) -> int:
	var k := 0
	for c in list:
		if bool(c.ok):
			k += 1
	return k

## The lines for the debrief: a mark, the call, and the note.
static func lines(list: Array) -> Array:
	var out: Array = []
	for c in list:
		out.append("%s  %s · %s" % ["●" if bool(c.ok) else "○", str(c.label), str(c.note)])
	return out
