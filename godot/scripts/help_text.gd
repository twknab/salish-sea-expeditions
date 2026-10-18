class_name HelpText
extends RefCounted
## What the Help page says: how the expedition runs, how to paddle on a keyboard and on a phone,
## how to find your way, and what the cards, notes and the partner are for. Pure, so the tests can
## hold it to the controls it describes; `help.gd` lays it out.

## Each section is {title, body}; `drills` are the Kayak School drill titles, in order.
static func sections(drills: Array) -> Array:
	return [
		{"title": "The expedition", "body": ("Three days by folding kayak from Friday Harbor: out to Jones Island, on to Posey Island, and home on the third day. Before the water: the safety note, "
			+ "your clothes for the sea, the ferry across from Anacortes, building the boat on the beach, Kayak School, packing and a float plan. Each day ends "
			+ "ashore at camp, and the last with the ferry home and a debrief.\n\nYour place is saved as you go: Continue on the title picks up where you left off.")},
		{"title": "Paddling on a keyboard", "body": ("W or ↑ — paddle: hold it, and the strokes come at a steady rhythm, side to side\nA / D or ← → — lean to steer\nS or ↓ — back off (the reverse "
			+ "stroke)\nZ / C — a sweep stroke, to turn sharply\nShift + A / D — a draw stroke, to slide sideways\nJ, L or Space — brace\nQ / E — edge the boat on to "
			+ "one hip\nM — fold or open the chart\nP or Escape — pause")},
		{"title": "Paddling on a phone", "body": ("Hold the water — the lower part of the screen — to paddle; the strokes settle into a rhythm.\nSlide your thumb left or right to lean and steer.\nSlide "
			+ "it up to back off.\nA quick flick sideways is a sweep.\nTwo quick taps on one side draw the boat toward it.\nTwo thumbs down at once is a brace.\nThe "
			+ "hips bar at the foot of the screen, or tilting the phone, edges the boat.\nTap the chart to fold or open it.")},
		{"title": "Kayak School", "body": ("First a tour of the boat, your body and the paddle — Next and Back move through it. Then into the water for the drills, each with a goal and a bar "
			+ "that fills as you meet it:\n" + "\n".join(drills.map(func(t: String) -> String: return "· " + t)) + "\n\nGood paddling is steady and nearly silent: "
			+ "hold and let the rhythm settle rather than tapping.")},
		{"title": "Finding your way", "body": ("Two lines under the notes keep the day: one is the water — the tidal stream, the wind, and anything slowing the boat; the other names the cove you are "
			+ "making for, how far it is, its bearing and the time.\nThe dome compass at the top right is the one on your foredeck: it shows your heading and marks "
			+ "the bearing to steer.\nThe chart in the corner is the real islands around you, with the day's track and the cove.\nThe float plan's tide graph chose "
			+ "your launch: going with the stream is half the journey.")},
		{"title": "Cards, notes and your partner", "body": ("A card stops you to teach something — an animal, a landing, a decision — and waits for you. Notes along the bottom come and go while you paddle. Your "
			+ "partner speaks in quotes at the moments that matter: listen to them, they have done this before.\nSome choices are kept as seamanship calls, and the "
			+ "debrief counts them at the end.")},
		{"title": "Sound, music and pausing", "body": ("The Sound and Music chips at the top switch each on or off, and are remembered. On the water and in Kayak School the Pause chip, P or Escape stops the "
			+ "clock and the boat; the game also pauses when the page is hidden.")},
		{"title": "The field guide", "body": ("Every species you meet — on the water, on the shore walk, at night in the cove — is kept in the field guide with the day you met it. Animals with a "
			+ "voice have a Listen button, and the ones you have not met yet say where on the route to look. The words on the water and every source the game cites "
			+ "are there too.")},
		{"title": "Safety", "body": ("This is a game that teaches real sea kayaking, and it is not a substitute for instruction and practice on the water. Take a course, paddle with "
			+ "others, file a float plan, and dress for the water, not the air.")},
	]
