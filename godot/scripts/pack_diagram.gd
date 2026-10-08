## The boat from above, bow up, with the five places a dry bag can go. Tap a place to put the
## chosen item there. The planform is the real hull's, so the bags sit where the volume is.
class_name PackDiagram
extends Control

signal zone_tapped(zone: String)

var packing: Dictionary = Packing.empty()
var names: Dictionary = {}     # id → short name
var selected_zone := ""
var hot := ""                  # the zone the chosen item would go to, lit while an item is chosen

const SPAN := { "bowEnd": [0.0, 0.22], "bowMid": [0.22, 0.44], "deck": [0.44, 0.56], "sternMid": [0.56, 0.78], "sternEnd": [0.78, 1.0] }

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = Vector2(150, 300)
	size_flags_vertical = Control.SIZE_EXPAND_FILL

func _boat() -> Dictionary:
	var l := size.y * 0.94
	return { "y0": (size.y - l) * 0.5, "l": l, "cx": size.x * 0.5, "w": minf(size.x * 0.42, l * 0.09) }

func zone_rect(zone: String) -> Rect2:
	var b := _boat()
	var sp: Array = SPAN[zone]
	return Rect2(b.cx - b.w - 4.0, b.y0 + b.l * sp[0], 2.0 * b.w + 8.0, b.l * (sp[1] - sp[0]))

func zone_at(p: Vector2) -> String:
	for z in Packing.ZONES:
		if zone_rect(z).has_point(p):
			return z
	return ""

func _gui_input(ev: InputEvent) -> void:
	var at := Vector2.ZERO
	var hit := false
	if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed:
		at = ev.position
		hit = true
	elif ev is InputEventScreenTouch and ev.pressed:
		at = ev.position
		hit = true
	if hit:
		var z := zone_at(at)
		if z != "":
			zone_tapped.emit(z)
			accept_event()

func _draw() -> void:
	var b := _boat()
	var font := get_theme_default_font()
	# The planform: the hull's half-beam along its length, mirrored. Bow at the top.
	var pts := PackedVector2Array()
	for i in range(0, 41):
		var s := i / 40.0
		pts.append(Vector2(b.cx + Hull.half_beam(s) / 0.3 * b.w, b.y0 + b.l * s))
	for i in range(40, -1, -1):
		var s := i / 40.0
		pts.append(Vector2(b.cx - Hull.half_beam(s) / 0.3 * b.w, b.y0 + b.l * s))
	draw_colored_polygon(pts, Color(0.93, 0.94, 0.93, 0.8))
	draw_polyline(pts, Color(0.1, 0.1, 0.12, 0.9), 1.5, true)
	# The cockpit, where everything goes in.
	draw_circle(Vector2(b.cx, b.y0 + b.l * 0.5), b.w * 0.62, Color(0.11, 0.12, 0.13, 1.0))
	for z in Packing.ZONES:
		var r := zone_rect(z)
		var lit := z == hot
		var fill := Color(UIKit.SUN, 0.28 if lit else 0.1) if z != "deck" else Color(UIKit.SEA, 0.35 if lit else 0.15)
		draw_rect(r.grow(-2.0), fill, true)
		draw_rect(r.grow(-2.0), Color(UIKit.SUN if lit else UIKit.MIST, 0.8 if lit else 0.35), false, 1.0)
		var items: Array = packing.get(z, [])
		var y := r.position.y + 13.0
		var label := str(Packing.ZONE_NAME[z]).split(" · ")[1] if z != "deck" else "deck"
		_text(font, Vector2(r.position.x + 5.0, y), label, r.size.x - 10.0, 9, Color(UIKit.MIST, 0.95))
		for id in items:
			y += 11.0
			if y > r.end.y - 2.0:
				break
			_text(font, Vector2(r.position.x + 5.0, y), str(names.get(id, id)), r.size.x - 10.0, 10, UIKit.FOAM)

## Light text with a dark outline: readable on the cream hull and on the dark water around it.
func _text(font: Font, at: Vector2, s: String, w: float, px: int, color: Color) -> void:
	draw_string_outline(font, at, s, HORIZONTAL_ALIGNMENT_LEFT, w, px, 3, Color(0.03, 0.09, 0.11, 0.9))
	draw_string(font, at, s, HORIZONTAL_ALIGNMENT_LEFT, w, px, color)
