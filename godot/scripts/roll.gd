class_name Roll
extends RefCounted
## Over, on a trip: the roll is the first answer, the wet exit and the rescue the second. A roll is
## the hip snap from Kayak School's brace drill carried all the way round, so a paddler who learned
## the brace has it in calm and moderate water; in a steep sea, or without the snap, the boat stays
## over and it is the swim. Pure, so the tests can capsize.

const STEEP := 0.55  # the drawn sea's state (0.10 calm to 0.70 its roughest) past which even a practised roll fails

## True when the roll brings the boat up: the hip snap learned, and the sea not too steep.
static func comes_up(learned: bool, sea_state: float) -> bool:
	return learned and sea_state < STEEP

## The card's body while hanging upside down: the setup, and what the choice is.
static func offer(lesson_text: String) -> String:
	return "Upside down, holding your breath, the cockpit still around you. %s Or pull the grab loop and swim: the wet exit, and the rescue." % lesson_text

## The note when it worked, or the card's body when it did not.
static func outcome(up: bool, learned: bool) -> String:
	if up:
		return "Up — the boat first, then the body, the head last. Wet, cold-faced, and still in the boat."
	if learned:
		return "The sea knocks the blade off the surface and the boat stays over. Out you come: grab loop, push off, and keep hold of the boat."
	return "Without the hip snap from Kayak School the blade pulls down instead of the hips pulling up. Out you come: grab loop, push off, and keep hold of the boat."
