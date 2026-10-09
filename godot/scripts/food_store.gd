## Where the food sleeps on Jones Island: the raccoons open zips and untie knots, and a skin boat's
## hatch is a thing they will work at all night. The card says hard box or hung bag, never the tent
## and never the boat; this is what happens when it is heard, and when it is not. Pure, for the tests.
class_name FoodStore

const SPOTS := [
	{ "id": "tent", "name": "In the tent, by your head", "verdict": "taken" },
	{ "id": "hatch", "name": "In the boat’s hatch", "verdict": "worked" },
	{ "id": "hung", "name": "In the hard box, hung", "verdict": "safe" },
]

static func spot(id: String) -> Dictionary:
	for s in SPOTS:
		if s.id == id:
			return s
	return SPOTS[2]

static func verdict(spot_id: String) -> String:
	return str(spot(spot_id).verdict)

## The line the night card carries.
static func night_line(spot_id: String) -> String:
	match verdict(spot_id):
		"taken":
			return "At two the tent zip went up on its own. Raccoons: the breakfast and half of tomorrow’s lunch gone up the bank, and a torn mesh door for the rest of the trip. The morning goes on picking wrappers out of the salal, and this camp does not count as clean."
		"worked":
			return "Something worked at the hatch cover for an hour in the dark. It held, but the raccoons left claw marks in the skin a hand from the seam — a hatch is not a hard box."
		_:
			return "The hard box swung from its branch all night. The raccoons came, found nothing, and went through the next site instead."

## A camp is left clean only if nothing of yours was scattered up the bank in the night: food the
## raccoons took is wrappers in the salal by morning, and a habituated raccoon is the next party's.
static func leaves_clean(spot_id: String) -> bool:
	return verdict(spot_id) != "taken"

## A few words for the day's record; nothing when nothing happened.
static func record_words(spot_id: String) -> String:
	match verdict(spot_id):
		"taken":
			return "raccoons took the breakfast"
		"worked":
			return "raccoons worked the hatch"
		_:
			return ""
