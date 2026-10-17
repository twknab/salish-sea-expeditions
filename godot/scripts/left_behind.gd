class_name LeftBehind
extends RefCounted
## The debrief's account of what stayed on the beach at Friday Harbor: each essential left behind,
## and what the trip charges for it. The same consequences the water and the camp already enforce,
## gathered in one place so the packing lesson lands where the trip is read back. Pure, for the tests.

const COST := {
	"water": "Posey has none: the morning goes to Roche Harbor to fill up.",
	"food": "A cold supper from the day bag, and a hungry morning.",
	"layers": "Wet clothes all evening, and nothing dry after a swim.",
	"firstAid": "The blister the shaft raises goes untaped.",
	"pump": "After a swim, bailing with a sponge and a hat: twice as long.",
	"paddleFloat": "Alone in the water, no way back into the boat without a partner.",
	"spare": "A paddle lost in a steep sea has to be chased down.",
	"vhf": "The ferry's traffic calls go unheard.",
	"headlamp": "After dark the boat shows no light to be seen by.",
	"chart": "In fog there is no chart and no bearing to hold.",
}

## One line per essential missing from the layout, in the gear list's order: "Name · what it costs".
static func lines(missing: Array, gear: Array) -> Array[String]:
	var out: Array[String] = []
	for g in gear:
		var id := str(g.get("id", ""))
		if missing.has(id):
			out.append("%s · %s" % [str(g.get("name", id)), str(COST.get(id, "It stayed on the beach."))])
	return out
