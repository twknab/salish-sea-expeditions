## Closing the float plan: the call ashore that says you are off the water. The plan you filed
## before launching names a time; miss it and the person holding it calls the Coast Guard, and a
## boat goes out looking for paddlers who are on the ferry. Pure, so the headless tests can check it.
class_name FloatPlanClose

const SPOTS := [
	{ "id": "now", "name": "Call now, from the float", "verdict": "closed" },
	{ "id": "later", "name": "After the boat is packed", "verdict": "late" },
	{ "id": "forgot", "name": "It can wait for the ferry", "verdict": "forgot" },
]

static func spot(id: String) -> Dictionary:
	for s in SPOTS:
		if s.id == id:
			return s
	return SPOTS[0]

static func verdict(spot_id: String) -> String:
	return str(spot(spot_id).verdict)

## The line the last take-out card carries.
static func closing_line(spot_id: String) -> String:
	match verdict(spot_id):
		"forgot":
			return "On the ferry your phone finds a signal and fills with messages. The float plan said six; at seven the person holding it called the Coast Guard, and a boat went out of Friday Harbor looking for two paddlers who were on the car deck. The call ashore is the last thing the trip asks of you, and the one that cannot wait."
		"late":
			return "You rang ashore once the boat was in its bag, forty minutes after the time on the plan — the person holding it had the phone in their hand. Close the plan first, then pack: it takes a minute and it is the minute that matters."
		_:
			return "You closed the float plan from the float, before the boat was out of the water. Whoever was holding it stopped watching the clock."

## A few words for the day's record; nothing when it was done right.
static func record_words(spot_id: String) -> String:
	match verdict(spot_id):
		"forgot":
			return "the float plan was never closed"
		"late":
			return "closed the float plan late"
		_:
			return ""
