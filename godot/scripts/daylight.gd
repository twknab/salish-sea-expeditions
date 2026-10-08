## The light of a day: dusk, night and the sun's height for an hour against the day's sunrise and
## sunset. Pure, so the headless tests can check it; the seascape draws from it.
class_name Daylight

## Dusk, 0 at the day's noon to 1 at the horizon, for an hour against a day's sunrise and sunset.
static func dusk_at(h: float, rise: float, set_h: float) -> float:
	var noon := (rise + set_h) * 0.5
	var half := maxf(1.0, (set_h - rise) * 0.5)
	return clampf(absf(h - noon) / half, 0.0, 1.0)

## Night, 0 by day to 1 at full dark: it starts a quarter hour before the sun sets and is complete
## an hour and three quarters after, the same way at either end of the day.
static func night_at(h: float, rise: float, set_h: float) -> float:
	var noon := (rise + set_h) * 0.5
	var half := maxf(1.0, (set_h - rise) * 0.5)
	return clampf((absf(h - noon) - half + 0.25) / 1.75, 0.0, 1.0)

## The sun's elevation above the horizon for an hour, in radians; below it at night.
static func sun_elevation(h: float, rise: float, set_h: float) -> float:
	var span := maxf(2.0, set_h - rise)
	return deg_to_rad(-10.0 - 48.0 * sin(clampf((h - rise) / span, 0.0, 1.0) * PI))
