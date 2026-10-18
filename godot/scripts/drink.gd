class_name Drink
extends RefCounted
## A drink on the water. Cold water hides thirst: nobody feels dry at 11 °C, and a paddler loses
## water all day anyway, so the habit is a mouthful every half hour whether or not it is wanted.
## The partner calls the first one; without water packed, the note says what that costs. Pure.

## How long after the launch the first drink is called.
const AFTER_HOURS := 1.5

static func note(has_water: bool, partner: String, touch: bool) -> String:
	if has_water:
		if touch:
			return "Drink: a mouthful every half hour, thirsty or not."
		return "An hour and a half out: a mouthful of water. On cold water you never feel thirsty, and you are losing it all the same — a mouthful every half hour."
	if partner != "":
		return "An hour and a half out, and your water is on the beach. %s passes a bottle across: share it, and make it last to the landing." % partner
	return "An hour and a half out, and your water is on the beach. Nothing to drink until the landing: steady strokes, and no racing."
