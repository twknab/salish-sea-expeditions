## The day's water as a graph you choose a launch time on: the channel's current (flood above the
## line, ebb below), the wind, the tide's height, and the daylight. Drag or tap to move the launch;
## with the graph focused, ← and → move it a quarter hour. The leg's hours are shaded from the launch.
class_name TideGraph
extends Control

signal launch_changed(hour: float)

const H0 := 5.0
const H1 := 20.0
const KN_SPAN := 2.5     # knots at the top and bottom of the current axis
const WIND_SPAN := 20.0  # knots of wind at the top
const PAD_L := 34.0
const PAD_R := 10.0
const PAD_T := 14.0
const PAD_B := 38.0

var day: Dictionary = {}
var launch := Leg.LAUNCH_HOUR
var leg_hours := 2.0

func _ready() -> void:
	focus_mode = Control.FOCUS_ALL
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = Vector2(0, 166)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	focus_entered.connect(queue_redraw)
	focus_exited.connect(queue_redraw)

func set_launch(h: float) -> void:
	var snapped_h := snappedf(clampf(h, Leg.earliest_launch(), Leg.LATEST_LAUNCH), Leg.LAUNCH_STEP)
	if absf(snapped_h - launch) < 1e-6:
		return
	launch = snapped_h
	queue_redraw()
	launch_changed.emit(launch)

func _plot() -> Rect2:
	return Rect2(PAD_L, PAD_T, size.x - PAD_L - PAD_R, size.y - PAD_T - PAD_B)

func _x(hour: float) -> float:
	var p := _plot()
	return p.position.x + p.size.x * inverse_lerp(H0, H1, hour)

func _hour_at(x: float) -> float:
	var p := _plot()
	return lerpf(H0, H1, clampf((x - p.position.x) / maxf(p.size.x, 1.0), 0.0, 1.0))

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed:
		grab_focus()
		set_launch(_hour_at(ev.position.x))
		accept_event()
	elif ev is InputEventMouseMotion and ev.button_mask & MOUSE_BUTTON_MASK_LEFT:
		set_launch(_hour_at(ev.position.x))
		accept_event()
	elif ev is InputEventScreenTouch and ev.pressed:
		set_launch(_hour_at(ev.position.x))
		accept_event()
	elif ev is InputEventScreenDrag:
		set_launch(_hour_at(ev.position.x))
		accept_event()
	elif ev.is_action_pressed("ui_left"):
		set_launch(launch - Leg.LAUNCH_STEP)
		accept_event()
	elif ev.is_action_pressed("ui_right"):
		set_launch(launch + Leg.LAUNCH_STEP)
		accept_event()

func _draw() -> void:
	var p := _plot()
	var mid := p.position.y + p.size.y * 0.5
	var font := UIKit.bold()
	# Daylight: the night either side of sunrise and sunset is darker.
	draw_rect(p, Color(1, 1, 1, 0.05))
	var rise := float(day.get("sunrise", 330)) / 60.0
	var set_h := float(day.get("sunset", 1270)) / 60.0
	if rise > H0:
		draw_rect(Rect2(p.position.x, p.position.y, _x(rise) - p.position.x, p.size.y), Color(0, 0, 0.1, 0.35))
	if set_h < H1:
		draw_rect(Rect2(_x(set_h), p.position.y, p.end.x - _x(set_h), p.size.y), Color(0, 0, 0.1, 0.35))
	# The leg's hours from the launch.
	var x0 := _x(launch)
	var x1 := _x(minf(launch + leg_hours, H1))
	draw_rect(Rect2(x0, p.position.y, x1 - x0, p.size.y), Color(UIKit.SUN, 0.14))
	# Hour grid and labels.
	for h in range(int(H0), int(H1) + 1):
		var x := _x(float(h))
		draw_line(Vector2(x, p.position.y), Vector2(x, p.end.y), Color(1, 1, 1, 0.12 if h % 3 == 0 else 0.05))
		if h % 3 == 0:
			draw_string(font, Vector2(x - 12, p.end.y + 15), "%02d:00" % h, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	draw_line(Vector2(p.position.x, mid), Vector2(p.end.x, mid), Color(1, 1, 1, 0.35))
	draw_string(font, Vector2(2, p.position.y + 10), "flood", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	draw_string(font, Vector2(2, p.end.y - 2), "ebb", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	# The current, filled to the slack line; the tide's height as a dashed line; the wind on top.
	var n := 90
	var cur := PackedVector2Array()
	var tide := PackedVector2Array()
	var windp := PackedVector2Array()
	for i in range(n + 1):
		var h := lerpf(H0, H1, float(i) / n)
		var x := _x(h)
		cur.append(Vector2(x, mid - clampf(Tides.current_kn(day, h) / KN_SPAN, -1.0, 1.0) * p.size.y * 0.5))
		tide.append(Vector2(x, p.end.y - clampf((Tides.height_m(day, h) + 0.5) / 3.5, 0.0, 1.0) * p.size.y))
		windp.append(Vector2(x, p.end.y - clampf(float(Tides.wind(day, h).kn) / WIND_SPAN, 0.0, 1.0) * p.size.y))
	for i in range(n):
		var a := cur[i]
		var b := cur[i + 1]
		var above := a.y <= mid
		var col := Color(UIKit.SEA, 0.35) if above else Color(0.95, 0.45, 0.3, 0.35)
		draw_colored_polygon(PackedVector2Array([Vector2(a.x, mid), a, b, Vector2(b.x, mid)]), col)
	draw_polyline(cur, Color(UIKit.FOAM, 0.95), 2.0, true)
	for i in range(0, n, 2):
		draw_line(tide[i], tide[i + 1], Color(UIKit.MIST, 0.7), 1.5, true)
	draw_polyline(windp, Color(UIKit.SUN, 0.85), 1.5, true)
	# The launch cursor.
	draw_line(Vector2(x0, p.position.y - 4), Vector2(x0, p.end.y + 4), UIKit.SUN, 2.0, true)
	draw_circle(Vector2(x0, p.position.y - 4), 4.0, UIKit.SUN)
	draw_string(font, Vector2(x0 + 6, p.position.y + 10), "launch %s" % Leg.clock(launch), HORIZONTAL_ALIGNMENT_LEFT, -1, 11, UIKit.SUN)
	# Legend on its own line under the hours, so a narrow graph does not run them together.
	var lx := p.position.x
	var ly := p.end.y + 30.0
	draw_line(Vector2(lx, ly - 4), Vector2(lx + 14, ly - 4), Color(UIKit.FOAM, 0.95), 2.0)
	draw_string(font, Vector2(lx + 18, ly), "current", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	draw_line(Vector2(lx + 68, ly - 4), Vector2(lx + 82, ly - 4), Color(UIKit.SUN, 0.85), 1.5)
	draw_string(font, Vector2(lx + 86, ly), "wind", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	draw_line(Vector2(lx + 120, ly - 4), Vector2(lx + 134, ly - 4), Color(UIKit.MIST, 0.7), 1.5)
	draw_string(font, Vector2(lx + 138, ly), "tide height", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	draw_rect(Rect2(lx + 196, ly - 9, 10, 8), Color(UIKit.SUN, 0.3))
	draw_string(font, Vector2(lx + 210, ly), "the leg", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(UIKit.MIST, 0.9))
	if has_focus():
		draw_rect(Rect2(Vector2.ZERO, size).grow(-1), UIKit.SUN, false, 2.0)
