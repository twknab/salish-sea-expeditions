## Where the boat starts on the water for a check (`?scene=trip&near=<key>`, `&close=1` for the
## `_close` variants): world x, z in metres and the bow's heading in degrees true. The starts that
## depend on what spawned (the cove, the ferry, the whale-watch boat) stay in the water scene.
class_name CheckStarts

const AT := {
	"ferry": [500.0, -2900.0, 340.0],           # the ferry 600 m ahead, coming up the channel
	"orcas": [-7200.0, -10700.0, 270.0],        # the pod 1.1 km ahead, coming the other way
	"orcas_close": [-8800.0, -10712.0, 270.0],  # in the pod's path as it starts its pass
	"spieden": [-7000.0, -10450.0, 270.0],      # west down Spieden Channel, the porpoise ahead
	"yellow": [-860.0, -6225.0, 300.0],         # the kelp 50 m ahead, the seals' rock beyond
	"yellow_close": [-1040.0, -6270.0, 315.0],  # seventy metres off the seals' rock, inside the hundred yards
	"labs": [590.0, -1312.0, 250.0],            # the heron 30 m off in the shallows
	"eddy": [-8000.0, -10990.0, 270.0],         # 80 m off Spieden Island's south shore, in the narrows
	"log": [-273.0, -4925.0, 0.0],              # the day-one deadhead 45 m ahead, beside the line
	"cliff": [-7360.0, -11440.0, 270.0],          # hard under the steep south shore of Spieden Island, clapotis
	"auklets": [-200.0, -3345.0, 180.0],         # rhinoceros auklets on the water 55 m ahead, mid-channel
	"humpback": [-800.0, -5250.0, 100.0],        # on the way home, the humpback 300 m off to the east
	"sealions": [-9050.0, -9900.0, 0.0],         # the September sea lions hauled out 100 m ahead
	"buoy": [860.0, -1260.0, 230.0],             # coming home into Friday Harbor, the red nun 130 m ahead
	"jellies": [520.0, -985.0, 0.0],             # the July moon jellies a few metres ahead in the harbour
	"madrona": [-1880.0, -9370.0, 215.0],       # off Jones Island, the madrona on the bluff 200 m ahead
	"lionsmane": [-5060.0, -10230.0, 245.0],    # the July lion's mane jelly a few metres ahead in the channel
	"minke": [-9400.0, -10450.0, 265.0],         # Spieden Channel's west end, the minke 350 m ahead
	"gillnet": [-6400.0, -10430.0, 270.0],       # on the September day, the gillnet 100 m ahead across the line
}

## [x, z, heading] for a start, or empty when the start is not a fixed one.
static func at(near: String, close := false) -> Array:
	if close and AT.has(near + "_close"):
		return AT[near + "_close"]
	return AT.get(near, [])
