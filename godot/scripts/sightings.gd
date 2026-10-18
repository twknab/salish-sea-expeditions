class_name Sightings
extends RefCounted
## Sightings on the leg: what, which species of the field guide it is, where, and how close you
## must come to notice it. Positions checked against the terrain: seals and kelp on the islet by
## Yellow Island, the heron in the Labs' shallows, the eagle on Point Caution, the porpoise mid-channel.
const ALL := [
	{ "leg": 0, "kind": "kingfisher", "species": "kingfisher", "at": Vector3(380.0, 0.0, -860.0), "face": Vector3(0, 0, 1), "radius": 90.0 },  # on an old piling a few boat lengths up the harbour, met paddling out
	{ "leg": 0, "kind": "heron", "species": "heron", "at": Vector3(560.0, 0.0, -1300.0), "face": Vector3(-1, 0, 0), "radius": 220.0 },
	{ "leg": 0, "kind": "eagle", "species": "baldEagle", "at": Vector3(260.0, 0.0, -2600.0), "face": Vector3(1, 0, 0), "radius": 320.0 },
	{ "leg": 0, "kind": "auklet", "species": "rhinoAuklet", "at": Vector3(-200.0, 0.0, -3400.0), "face": Vector3(0, 0, -1), "radius": 260.0 },  # sitting out in the channel, diving as the boat comes
	{ "leg": 0, "kind": "guillemot", "species": "pigeonGuillemot", "at": Vector3(-1900.0, 0.0, -9350.0), "face": Vector3(1, 0, 0), "radius": 220.0 },  # off the rocks below Jones Island
	{ "leg": 0, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-300.0, 0.0, -4200.0), "face": Vector3(0, 0, -1), "radius": 420.0 },
	{ "leg": 0, "kind": "kelp", "species": "bullKelp", "at": Vector3(-900.0, 0.0, -6250.0), "face": Vector3(0, 0, -1), "radius": 200.0 },
	{ "leg": 0, "kind": "oystercatcher", "species": "oystercatcher", "at": Vector3(-1130.0, 0.0, -6360.0), "face": Vector3(1, 0, 0), "radius": 200.0 },  # working the tide line beside the seals' rock
	{ "leg": 0, "kind": "seals", "species": "harbourSeal", "at": Vector3(-1100.0, 0.0, -6330.0), "face": Vector3(0, 0, 1), "radius": 260.0 },
	# Day two: seals on the rocks at Spieden's south-east tip, a porpoise working Spieden Channel, kelp
	# off Davison Head and the eagle on the head itself.
	{ "leg": 1, "kind": "seals", "species": "harbourSeal", "at": Vector3(-6760.0, 0.0, -10920.0), "face": Vector3(0, 0, 1), "radius": 300.0 },
	{ "leg": 1, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-7600.0, 0.0, -10450.0), "face": Vector3(-1, 0, 0), "radius": 420.0 },
	# A pod of Bigg's killer whales working Spieden Channel east on the flood, well out from the shore: the card comes up at
	# 1.4 km, the law's thousand yards is the line, and the sighting counts as given room or not in the debrief.
	{ "leg": 1, "kind": "peregrine", "species": "peregrine", "at": Vector3(-7420.0, 0.0, -11440.0), "face": Vector3(0, 0, 1), "radius": 260.0 },  # on the lip of Spieden's south cliff, above the clapotis
	{ "leg": 1, "kind": "orcas", "species": "biggsOrca", "at": Vector3(-8300.0, 0.0, -10700.0), "face": Vector3(1, 0, 0), "radius": 1400.0 },
	{ "leg": 1, "kind": "kelp", "species": "bullKelp", "at": Vector3(-9300.0, 0.0, -10080.0), "face": Vector3(-1, 0, 0), "radius": 200.0 },
	{ "leg": 1, "kind": "eagle", "species": "baldEagle", "at": Vector3(-9600.0, 0.0, -9930.0), "face": Vector3(0, 0, -1), "radius": 320.0 },
	# Day three, home: the porpoise again in the channel's narrows, seals on the islet by Yellow, the heron at the Labs.
	# The pod again on the way home, working the channel west on the ebb this time, and the eagle on Jones's south point.
	{ "leg": 2, "kind": "orcas", "species": "biggsOrca", "at": Vector3(-7400.0, 0.0, -10560.0), "face": Vector3(-1, 0, 0), "radius": 1400.0 },
	{ "leg": 2, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-6200.0, 0.0, -10450.0), "face": Vector3(1, 0, 0), "radius": 420.0 },
	{ "leg": 2, "kind": "eagle", "species": "baldEagle", "at": Vector3(-2300.0, 0.0, -8900.0), "face": Vector3(0, 0, 1), "radius": 320.0 },
	{ "leg": 2, "kind": "oystercatcher", "species": "oystercatcher", "at": Vector3(-1130.0, 0.0, -6360.0), "face": Vector3(1, 0, 0), "radius": 200.0 },  # working the tide line beside the seals' rock
	{ "leg": 2, "kind": "seals", "species": "harbourSeal", "at": Vector3(-1100.0, 0.0, -6330.0), "face": Vector3(0, 0, 1), "radius": 260.0 },
	{ "leg": 2, "kind": "heron", "species": "heron", "at": Vector3(560.0, 0.0, -1300.0), "face": Vector3(-1, 0, 0), "radius": 220.0 },
]
