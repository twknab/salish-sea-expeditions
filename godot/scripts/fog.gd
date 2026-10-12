## Fog on the water: how much of it there is at an hour, what it does to the view, and the rule a
## vessel keeps in it. A leg's `fog` ({until, burn}) says the morning starts in fog that holds
## until `until` and burns off over the `burn` hours after; a leg without it is clear.
class_name Fog

const CLEAR_M := 12000.0        # how far the haze lets you see on a clear day
const THICK_M := 220.0          # in the fog: the partner, the next wave, little else
const SIGNAL_EVERY := 120.0     # a power-driven vessel under way sounds one prolonged blast at
                                # intervals of not more than two minutes (Rule 35)
const HEARD_M := 3500.0         # how far a ferry's blast carries over the water
const BLIND := 0.5              # above this the chart has no fix: it shows where you were

## 0 clear to 1 socked in, for the leg at the hour.
static func amount(leg: Dictionary, hour: float) -> float:
	var f: Variant = leg.get("fog")
	if not (f is Dictionary):
		return 0.0
	var until := float(f.get("until", 0.0))
	var burn := maxf(0.1, float(f.get("burn", 1.0)))
	return clampf(1.0 - (hour - until) / burn, 0.0, 1.0)

## Metres you can see for a given amount.
static func visibility_m(a: float) -> float:
	return lerpf(CLEAR_M, THICK_M, clampf(a, 0.0, 1.0))

## The scene's fog density for a given amount, from the clear day's base.
static func density(a: float, base: float) -> float:
	return lerpf(base, 0.012, clampf(a, 0.0, 1.0) ** 1.5)

static func blind(a: float) -> bool:
	return a > BLIND

## A line for the float plan when the launch is in fog, else empty.
static func plan_line(leg: Dictionary, launch_hour: float) -> String:
	var a := amount(leg, launch_hour)
	if a <= 0.0:
		return ""
	var f: Dictionary = leg.get("fog")
	return "Fog at launch, burning off from %s: compass, a light, and your partner in sight." % Leg.clock(float(f.get("until", 0.0)))

## The note when the fog closes in. Without the chart and compass there is no bearing to hold:
## the partner's is the one to follow, and alone the swell is all the reference there is.
static func note(brg: float, has_chart: bool, partner: String, touch: bool) -> String:
	if has_chart:
		if touch:  # three lines is the phone's room
			return "Fog. The chart has no fix; the compass does. Hold %03d°, and stop for a long blast." % int(round(brg))
		return "Fog. The islands are gone and the chart has no fix; the compass does. Hold %03d°, count your strokes, keep a paddle length off. A long blast is a vessel under way: stop and listen." % int(round(brg))
	if partner != "":
		return "Fog, and your chart and compass are on the beach. Stay on %s's stern: the bearing is in that boat now." % partner
	if touch:
		return "Fog, and no compass. Keep the swell on one side, and stop for a long blast."
	return "Fog, and your chart and compass are on the beach: there is no bearing to hold. Keep the swell on the same side, go slowly, and stop for a long blast."

## The bearing part of the HUD's destination line in fog.
static func steer(brg: float, has_chart: bool) -> String:
	return "steer %03d°" % int(round(brg)) if has_chart else "no compass"
