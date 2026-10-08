## The expedition's score and the record it is counted from: the rules of the Phaser build's
## src/sim/score.js. Going in costs nothing — practising the rescue is how it is learned.
class_name Score
extends RefCounted

## The parts of the score, [name, points], the zero rows left out.
static func parts(r: Dictionary) -> Array:
	var rows: Array = [
		["Nautical miles", int(round(float(r.get("nm", 0.0)) * 100.0))],
		["Nights out", int(r.get("nights", 0)) * 300],
		["Species in the field guide", int(r.get("newSpecies", 0)) * 50],
		["Wildlife given room", int(r.get("respectful", 0)) * 150],
		["Too close to wildlife", -int(r.get("violations", 0)) * 200],
		["Clean camps", int(r.get("cleanCamps", 0)) * 250],
		["Drills demonstrated", int(r.get("demonstrated", 0)) * 40],
		["Rescues completed", int(r.get("rescues", 0)) * 100],
		["Launched at a good time", int(r.get("goodWindows", 0)) * 200],
	]
	var out: Array = []
	for row in rows:
		if int(row[1]) != 0:
			out.append(row)
	return out

static func total(r: Dictionary) -> int:
	var t := 0
	for row in parts(r):
		t += int(row[1])
	return maxi(0, t)

## The record from the save: the days landed (`days`, one entry per leg landed), the drills
## demonstrated, the species met, the camps left clean, and the swims.
static func record(save: Dictionary, legs: Array) -> Dictionary:
	var days: Array = save.get("days", [])
	var metres := 0.0
	var good := 0
	var respectful := 0
	var violations := 0
	var rescues := 0
	for d in days:
		var i := int(d.get("leg", -1))
		if i >= 0 and i < legs.size():
			metres += float(d.get("metres", 0.0))
		if str(d.get("verdict", "")) == "good":
			good += 1
		respectful += int(d.get("respectful", 0))
		violations += int(d.get("violations", 0))
		rescues += int(d.get("swims", 0))
	return {
		"nm": metres / 1852.0,
		"nights": int(save.get("nights", 0)),
		"newSpecies": save.get("seen", []).size(),
		"respectful": respectful,
		"violations": violations,
		"cleanCamps": int(save.get("cleanCamps", 0)),
		"demonstrated": save.get("drills", []).size(),
		"rescues": rescues,
		"goodWindows": good,
	}
