## The water on Posey: there is none on the island, so what came in the boat is tonight's and
## tomorrow's. Drink your fill and the long day home is paddled thirsty; ration it and it is
## fine; cross to Roche Harbor for the tap and the launch is an hour later than the ebb wanted.
## Pure, so the headless tests can check it.
class_name WaterPlan

const SPOTS := [
	{ "id": "fill", "name": "Drink your fill tonight", "verdict": "thirsty" },
	{ "id": "ration", "name": "Ration it: a litre each, the rest for the paddle", "verdict": "fine" },
	{ "id": "roche", "name": "Fill at Roche Harbor in the morning", "verdict": "late" },
]
const LATE_HOURS := 1.0      # the crossing to the tap and back onto the line
const THIRSTY_EFFORT := 0.85 # a dehydrated paddler's stroke, as a share of a watered one's

static func spot(id: String) -> Dictionary:
	for s in SPOTS:
		if s.id == id:
			return s
	return SPOTS[1]

static func verdict(spot_id: String) -> String:
	return str(spot(spot_id).verdict)

## How much later the next launch can be, in hours.
static func late_hours(spot_id: String) -> float:
	return LATE_HOURS if verdict(spot_id) == "late" else 0.0

## The stroke a paddler has the morning after, as a share of the full one.
static func effort(spot_id: String) -> float:
	return THIRSTY_EFFORT if verdict(spot_id) == "thirsty" else 1.0

## The line the night card carries.
static func night_line(spot_id: String) -> String:
	match verdict(spot_id):
		"thirsty":
			return "The bottles are light by bedtime. Tomorrow is the long day, eighteen kilometres on the ebb, and it starts with a mouthful each and no more."
		"late":
			return "In the morning the first hour goes to Roche Harbor and the tap, across the channel and back: full bottles, and the ebb an hour further on than the float plan wanted."
		_:
			return "A litre each tonight and the rest in the day hatch for the paddle: enough, and no more than enough."

## A few words for the day's record; nothing when nothing came of it.
static func record_words(spot_id: String) -> String:
	match verdict(spot_id):
		"thirsty":
			return "paddled the next day thirsty"
		"late":
			return "an hour to Roche Harbor for water"
		_:
			return ""
