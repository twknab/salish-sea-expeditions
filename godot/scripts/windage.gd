## The wind on the boat: a kayak drifts downwind by a few per cent of the wind's speed, and with
## way on its bow turns into the wind — a stern-heavy boat more so. The rules of the Phaser sim's
## wind drift, as physics the kayak applies each tick.
class_name Windage
extends RefCounted

const DRIFT := 0.03          # share of the wind's speed the boat drifts at, broadside (ACA: 2–4 %)
const WEATHERCOCK := 6.0     # yaw torque per m/s of beam wind at touring speed: a ten-knot beam wind is under half a full lean
const KN := 0.5144           # m/s per knot

## Where the wind blows to, as a unit vector on the water (x east, z south), from a compass "from".
static func blows_to(from_deg: float) -> Vector3:
	var to := deg_to_rad(from_deg + 180.0)
	return Vector3(sin(to), 0.0, -cos(to))

## The wind over the water in m/s, from the day's knots and direction.
static func vector(kn: float, from_deg: float) -> Vector3:
	return blows_to(from_deg) * kn * KN

## The steady force that holds a drifting boat at DRIFT of the wind, against the keel's sideways
## drag (the kayak damps slip at `grip` per second per unit mass).
static func drift_force(wind: Vector3, mass: float, grip: float) -> Vector3:
	return wind * DRIFT * grip * mass

## The bow comes up into the wind: positive turns the bow to port. `beam` is the wind across the
## boat (positive blowing to starboard), `speed` the way on, `pitch` the trim (negative stern heavy).
static func weathercock(beam: float, speed: float, pitch := 0.0) -> float:
	return beam * clampf(absf(speed) / 1.2, 0.0, 1.0) * WEATHERCOCK * (1.0 + maxf(0.0, -pitch))
