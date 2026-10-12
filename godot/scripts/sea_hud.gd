class_name SeaHud
extends RefCounted
## The water scene's heads-up pieces, built here so the scene keeps to its job: the compass, the
## place names, and the two trip lines under the note (the set and drift, the destination).

## A dark rim so a HUD line reads against fog-grey as well as blue water.
static func outline(l: Label) -> void:
	l.add_theme_color_override("font_outline_color", Color(0.03, 0.06, 0.08, 0.7))
	l.add_theme_constant_override("outline_size", 4)

## The dome compass at the top right: under the note and the trip lines on a phone, beside them on a desktop.
static func compass(touch: bool) -> Compass:
	var c := Compass.new()
	c.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	var top := 222.0 if touch else 40.0
	c.offset_left = -112
	c.offset_right = -14
	c.offset_top = top
	c.offset_bottom = top + 118
	return c

## The landings and islands by name, kept off the HUD: the speed, the note and the destination lines at
## the top left, the compass at the top right, and the chart tile below them (a phone's HUD is taller).
static func place_labels(terrain: Terrain, touch: bool) -> PlaceLabels:
	var places := PlaceLabels.new()
	places.reach = 8000.0  # the landings ahead show as you come up the channel without crowding the horizon
	if touch:
		places.keep_out = [Rect2(0, 0, 4000, 420), Rect2(0, 420, 180, 160)]
	else:
		places.keep_out = [Rect2(0, 0, 700, 170), Rect2(0, 170, 180, 160), Rect2(1180, 0, 400, 140)]
	for p in terrain.meta.get("places", []):
		if p.id in ["anacortes", "thatcher", "harney", "wasp", "sanJuanChannel", "fridayHarbor"]:
			continue
		var w := terrain.place(p.id)
		places.add_place(p.id, p.name, Vector3(w.x, maxf(terrain.height_at(w.x, w.z), 0.0) + 12.0, w.z), 12)
	return places

## The set-and-drift line: wraps on a phone.
static func set_line(touch: bool) -> Label:
	var l := UIKit.label("", 12, UIKit.MIST, touch)
	l.position = Vector2(20, 172)
	l.size = Vector2(350, 40) if touch else Vector2(520, 20)
	outline(l)
	return l

## The destination line: where the day is going, how far, the bearing and the clock.
static func dest_line() -> Label:
	var l := UIKit.label("", 13, UIKit.FOAM, false, true)
	l.position = Vector2(20, 150)
	l.size = Vector2(360, 24)
	outline(l)
	return l
