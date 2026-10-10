class_name TidePool
extends RefCounted
## The tide pools on the evening shore walk: the manners first, at the first animal of the pools,
## then a rock to lift and set back the way it lay, or to leave. Pure, so the tests can walk it.

## Where on the walk the pools begin: the first species of the intertidal, or -1 when the walk
## has none (a take-out's float, a forest edge).
static func first_pool(groups: Array) -> int:
	for i in groups.size():
		if str(groups[i]).begins_with("Intertidal"):
			return i
	return -1

## The rock's two answers. Lifting finds who lives under it, and the card says how it goes back;
## leaving it is just as good, and the card says why.
static func rock(choice: String) -> Dictionary:
	if choice == "lift":
		return {
			"title": "Under the rock",
			"text": "Lifted slowly, weed side up: in the wet gravel under it, among a scatter of crab shells, a small octopus draws itself into the gap. You set the rock back down the way it lay, gently, so nothing under it is crushed or left to dry.",
			"find": "octopus",
		}
	return {
		"title": "The rock stays",
		"text": "Left as it lies. What lives under a rock is kept dark and damp by it until the tide comes back; a rock turned over and walked away from is a patch of the shore that dies in the sun. Looking is enough.",
		"find": "",
	}
