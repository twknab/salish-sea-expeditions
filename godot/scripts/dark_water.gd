class_name DarkWater
extends RefCounted
## Night on the water: the white light every boat under oars must be able to show, and what it is
## to be without one. Pure, so the tests can paddle in the dark.

## The note as the light goes: with a light, the light goes on; without one (left on the beach at
## packing), stay close to a boat that has one, and say so.
static func note(has_light: bool, partner: String, touch: bool) -> String:
	if has_light:
		if touch:
			return "Night on the water: light on, land by compass."
		return "Night on the water. The white light goes on, the shore is a shape, and the landing is by compass and the sound of the beach."
	if partner != "":
		return "Night, and your headlamp is on the beach: this boat shows no white light. Stay on %s's quarter, inside that light, and land by compass." % partner
	return "Night, and your headlamp is on the beach: nothing on the water can see you. Land by compass, slowly."
