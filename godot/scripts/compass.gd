## A dome compass, the kind that sits on a kayak's foredeck: a card that turns under a fixed lubber
## line inside a glass bulb. Set `heading` in radians (0 north, clockwise) and it swings there with
## the lag of a liquid-damped card. Drawn, not textured, so it is crisp at any size.
class_name Compass
extends Control

var heading := 0.0
var _shown := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(96, 118)

func _process(delta: float) -> void:
	var want := fposmod(heading, TAU)
	var d := angle_difference(_shown, want)
	_shown = fposmod(_shown + d * minf(1.0, delta * 4.0), TAU)
	queue_redraw()

func _draw() -> void:
	var r := minf(size.x, size.y - 22.0) * 0.5
	var c := Vector2(size.x * 0.5, r + 2.0)
	# The bulb: a dark bowl with a lighter rim, the card floating in it.
	draw_circle(c, r, Color(0.04, 0.08, 0.1, 0.78))
	draw_arc(c, r - 1.0, 0.0, TAU, 64, Color(0.85, 0.9, 0.92, 0.55), 2.0, true)
	# The card turns against the boat: north sits at -heading from the top.
	var rot := -_shown
	for i in range(72):
		var a := rot + i * TAU / 72.0 - PI / 2.0
		var major := i % 9 == 0
		var mid := i % 3 == 0
		var len := 9.0 if major else (6.0 if mid else 3.0)
		var col := Color(1, 1, 1, 0.9 if major else (0.6 if mid else 0.35))
		draw_line(c + Vector2.from_angle(a) * (r - 5.0), c + Vector2.from_angle(a) * (r - 5.0 - len), col, 1.5 if major else 1.0, true)
	var font := ThemeDB.fallback_font
	var names := ["N", "E", "S", "W"]
	for k in range(4):
		var a := rot + k * PI / 2.0 - PI / 2.0
		var p := c + Vector2.from_angle(a) * (r - 24.0)
		var col := Color(0.95, 0.3, 0.25) if k == 0 else Color(0.95, 0.96, 0.97)
		draw_string(font, p + Vector2(-5.0, 5.0), names[k], HORIZONTAL_ALIGNMENT_CENTER, 10.0, 14, col)
	for k in range(4):
		var deg := [30, 60, 120, 150, 210, 240, 300, 330]
		for dgi in range(2):
			var dg: int = deg[k * 2 + dgi]
			var a := rot + deg_to_rad(dg) - PI / 2.0
			var p := c + Vector2.from_angle(a) * (r - 22.0)
			draw_string(font, p + Vector2(-6.0, 3.0), str(dg / 10), HORIZONTAL_ALIGNMENT_CENTER, 12.0, 8, Color(1, 1, 1, 0.6))
	# The lubber line, fixed to the boat, and the glass: a highlight across the upper left of the dome.
	draw_line(c + Vector2(0, -r + 2.0), c + Vector2(0, -r + 16.0), Color(1.0, 0.82, 0.1), 2.5, true)
	draw_polygon(PackedVector2Array([c + Vector2(-5, -r - 1), c + Vector2(5, -r - 1), c + Vector2(0, -r + 7)]), PackedColorArray([Color(1.0, 0.82, 0.1)]))
	for i in range(6):
		var t := i / 6.0
		draw_arc(c + Vector2(-r * 0.18, -r * 0.2), r * (0.55 - 0.08 * t), PI * 1.05, PI * 1.75, 24, Color(1, 1, 1, 0.08), 3.0, true)
	draw_string(font, Vector2(0, size.y - 4.0), "%03d°" % int(round(rad_to_deg(_shown))), HORIZONTAL_ALIGNMENT_CENTER, size.x, 18, Color(0.95, 0.96, 0.97))
