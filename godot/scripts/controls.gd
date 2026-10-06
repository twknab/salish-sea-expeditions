## Touch controls, the same vocabulary the Phaser game taught: two blade zones at the bottom of the
## screen and a hips bar between them. A long, steady swipe from the top of a zone to its hip line
## is a rotation stroke; a swipe outward is a sweep; a swipe up is a reverse stroke; dragging the
## hips bar edges the boat. Keys mirror it: A/D strokes, Z/C sweeps, S reverse, Q/E edge.
class_name Controls
extends Control

signal stroke(side: int, q: float, kind: String)
signal hint(msg: String)
signal edge_changed(value: float)

const ZONE_H := 150.0
const HIPS_H := 46.0
const HIP_LINE := 0.78
const PAD := 8.0

var _tracks := {}  # index → {zone, pts: Array[Vector3(x, y, t)]}
var _hips_index := -1
var _edge := 0.0
var _edge_held := false
var _key_brace := false
var _flash := {}  # zone → remaining seconds
var _label: Label
var last := {}        # the last forward stroke's grading, for coaching
var braced := false   # a thumb held still on a blade zone (or J/L down) is a low brace

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	_label = Label.new()
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.add_theme_font_size_override("font_size", 15)
	_label.add_theme_color_override("font_color", Color("f2d016"))
	_label.modulate.a = 0.0
	add_child(_label)
	set_process(true)

func zones() -> Dictionary:
	var w := size.x
	var h := size.y
	var top := h - ZONE_H - HIPS_H - PAD * 3
	return {
		"left": Rect2(PAD, top, w / 2.0 - PAD * 1.5, ZONE_H),
		"right": Rect2(w / 2.0 + PAD * 0.5, top, w / 2.0 - PAD * 1.5, ZONE_H),
		"hips": Rect2(PAD, top + ZONE_H + PAD, w - PAD * 2.0, HIPS_H),
	}

func _which(p: Vector2) -> String:
	for k in ["left", "hips", "right"]:
		if (zones()[k] as Rect2).grow(4.0).has_point(p):
			return k
	return ""

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventScreenTouch:
		if ev.pressed:
			_down(ev.index, ev.position)
		else:
			_up(ev.index, ev.position)
		accept_event()
	elif ev is InputEventScreenDrag:
		_move(ev.index, ev.position)
		accept_event()
	elif ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT:
		if ev.pressed:
			_down(100, ev.position)
		else:
			_up(100, ev.position)
		accept_event()
	elif ev is InputEventMouseMotion and (ev.button_mask & MOUSE_BUTTON_MASK_LEFT):
		_move(100, ev.position)
		accept_event()

func _now() -> float:
	return Time.get_ticks_msec() / 1000.0

func _down(i: int, p: Vector2) -> void:
	var k := _which(p)
	if k == "":
		if p.y > size.y * 0.3:
			_tracks[i] = { "zone": "miss", "pts": [Vector3(p.x, p.y, _now())] }
		return
	if k == "hips":
		_hips_index = i
		_edge_held = true
		_set_edge_from(p.x)
		return
	_tracks[i] = { "zone": k, "pts": [Vector3(p.x, p.y, _now())] }

func _move(i: int, p: Vector2) -> void:
	if i == _hips_index:
		_set_edge_from(p.x)
		return
	if _tracks.has(i):
		_tracks[i].pts.append(Vector3(p.x, p.y, _now()))

func _up(i: int, p: Vector2) -> void:
	if i == _hips_index:
		_hips_index = -1
		_edge_held = false
		return
	if not _tracks.has(i):
		return
	var tr: Dictionary = _tracks[i]
	_tracks.erase(i)
	tr.pts.append(Vector3(p.x, p.y, _now()))
	if tr.zone == "miss":
		var a: Vector3 = tr.pts[0]
		if absf(p.y - a.y) > 30.0 and absf(p.y - a.y) > absf(p.x - a.x):
			_say("", "Swipe inside a blade zone ↓")
		return
	_evaluate(tr)

func _set_edge_from(x: float) -> void:
	var h: Rect2 = zones()["hips"]
	var rel := (x - (h.position.x + h.size.x / 2.0)) / (h.size.x / 2.0 - h.size.y / 2.0)
	_edge = clampf(rel, -1.0, 1.0)
	edge_changed.emit(_edge)
	queue_redraw()

func _evaluate(tr: Dictionary) -> void:
	var z: Rect2 = zones()[tr.zone]
	var pts: Array = tr.pts
	var a: Vector3 = pts[0]
	var b: Vector3 = pts[pts.size() - 1]
	var dx := b.x - a.x
	var dy := b.y - a.y
	var dur := maxf(0.001, b.z - a.z)
	var side := -1 if tr.zone == "left" else 1
	var outward := -dx if side < 0 else dx
	if absf(dx) > z.size.x * 0.3 and absf(dx) > absf(dy) * 0.8:
		var kind := "sweep" if outward > 0.0 else "reverse"
		_flash_zone(tr.zone, kind.capitalize(), true)
		stroke.emit(side, 0.9, kind)
		return
	if dy < -z.size.y * 0.25:
		_flash_zone(tr.zone, "Reverse", true)
		stroke.emit(side, 0.8, "reverse")
		return
	if dy < z.size.y * 0.2:
		if dy > 8.0:
			_say(tr.zone, "Longer — top to the hip line")
		return
	var reach := clampf(1.0 - ((a.y - z.position.y) / z.size.y - 0.12) * 1.8, 0.0, 1.0)
	var hip_y := z.position.y + z.size.y * HIP_LINE
	var exit_at_hip := absf(b.y - hip_y) < z.size.y * 0.22
	var path := 0.0
	var forward := 0.0
	for i in range(1, pts.size()):
		var p0: Vector3 = pts[i - 1]
		var p1: Vector3 = pts[i]
		var seg := Vector2(p1.x - p0.x, p1.y - p0.y).length()
		path += seg
		if p1.y - p0.y >= -0.5:
			forward += seg
	var straight := Vector2(dx, dy).length() / path if path > 0.0 else 1.0
	var monotone := forward / path if path > 0.0 else 1.0
	var smooth := clampf((straight - 0.6) / 0.35, 0.0, 1.0) * 0.5 + monotone * 0.5
	smooth = minf(smooth, clampf((dur - 0.04) / 0.14, 0.2, 1.0))
	var q := StrokeMath.rotation_quality(reach, smooth, exit_at_hip)
	last = { "reach": reach, "smoothness": smooth, "exit_at_hip": exit_at_hip, "q": q }
	var good := q >= StrokeMath.GOOD_STROKE
	var label := "Rotation" if good else ("Reach further" if reach < 0.4 else ("Exit at the hip" if not exit_at_hip else "Arms — rotate"))
	_flash_zone(tr.zone, label, good)
	stroke.emit(side, q, "forward")

func _flash_zone(zone: String, label: String, good: bool) -> void:
	_flash[zone] = 0.4
	_say(zone, label, good)
	queue_redraw()

func _say(zone: String, msg: String, good: bool = false) -> void:
	var zs := zones()
	var r: Rect2
	if zone == "" or zone == "miss":
		r = Rect2((zs.left as Rect2).position, Vector2((zs.right as Rect2).end.x - (zs.left as Rect2).position.x, ZONE_H))
	else:
		r = zs[zone]
	_label.text = msg
	_label.add_theme_color_override("font_color", Color("8fd3a6") if good else Color("f2d016"))
	_label.size = Vector2(r.size.x, 24)
	_label.position = Vector2(r.position.x, r.position.y - 28)
	_label.modulate.a = 1.0
	hint.emit(msg)

func _process(delta: float) -> void:
	# A finger held still in a blade zone for a moment is a brace: the blade flat on the water.
	var held := false
	var now := _now()
	for tr in _tracks.values():
		if tr.zone == "miss":
			continue
		var a: Vector3 = tr.pts[0]
		var b: Vector3 = tr.pts[tr.pts.size() - 1]
		if now - a.z > 0.14 and Vector2(b.x - a.x, b.y - a.y).length() < 14.0:
			held = true
	braced = held or _key_brace
	if _label.modulate.a > 0.0:
		_label.modulate.a = maxf(0.0, _label.modulate.a - delta / 1.6)
	var dirty := false
	for k in _flash.keys():
		_flash[k] -= delta
		if _flash[k] <= 0.0:
			_flash.erase(k)
		dirty = true
	if not _edge_held and _edge != 0.0:
		_edge *= pow(0.02, delta)
		if absf(_edge) < 0.02:
			_edge = 0.0
		edge_changed.emit(_edge)
		dirty = true
	if dirty:
		queue_redraw()

func _unhandled_input(ev: InputEvent) -> void:
	if ev is InputEventKey and ev.pressed and not ev.echo:
		match ev.keycode:
			KEY_A, KEY_LEFT: _key_stroke(-1, "forward")
			KEY_D, KEY_RIGHT: _key_stroke(1, "forward")
			KEY_Z: _key_stroke(-1, "sweep")
			KEY_C: _key_stroke(1, "sweep")
			KEY_S, KEY_DOWN: _key_stroke(1, "reverse")
			KEY_J, KEY_L: _key_brace = true
			KEY_Q: _edge = -1.0; _edge_held = true; edge_changed.emit(_edge); queue_redraw()
			KEY_E: _edge = 1.0; _edge_held = true; edge_changed.emit(_edge); queue_redraw()
	elif ev is InputEventKey and not ev.pressed and (ev.keycode == KEY_Q or ev.keycode == KEY_E):
		_edge_held = false
	elif ev is InputEventKey and not ev.pressed and (ev.keycode == KEY_J or ev.keycode == KEY_L):
		_key_brace = false

func _key_stroke(side: int, kind: String) -> void:
	var zone := "left" if side < 0 else "right"
	_flash_zone(zone, "Rotation" if kind == "forward" else kind.capitalize(), true)
	stroke.emit(side, 0.9, kind)

func _draw() -> void:
	var zs := zones()
	var ink := Color(0.03, 0.09, 0.11, 0.42)
	var line := Color(1, 1, 1, 0.12)
	for k in ["left", "right"]:
		var r: Rect2 = zs[k]
		var sb := StyleBoxFlat.new()
		sb.bg_color = ink if not _flash.has(k) else Color(0.56, 0.83, 0.65, 0.3)
		sb.set_corner_radius_all(22)
		sb.border_color = line
		sb.set_border_width_all(1)
		draw_style_box(sb, r)
		# Three chevrons down the zone and the hip line.
		for i in range(3):
			var cy := r.position.y + r.size.y * (0.22 + 0.17 * i)
			var cx := r.position.x + r.size.x / 2.0
			draw_polyline(PackedVector2Array([Vector2(cx - 7, cy - 4), Vector2(cx, cy + 3), Vector2(cx + 7, cy - 4)]), Color(1, 1, 1, 0.22), 1.5, true)
		var hy := r.position.y + r.size.y * HIP_LINE
		draw_line(Vector2(r.position.x + 18, hy), Vector2(r.end.x - 18, hy), Color(1, 1, 1, 0.22), 1.0, true)
		draw_string(ThemeDB.fallback_font, Vector2(r.position.x, r.end.y - 10), "LEFT BLADE" if k == "left" else "RIGHT BLADE", HORIZONTAL_ALIGNMENT_CENTER, r.size.x, 10, Color(0.8, 0.86, 0.88, 0.75))
	var h: Rect2 = zs["hips"]
	var hb := StyleBoxFlat.new()
	hb.bg_color = ink
	hb.set_corner_radius_all(23)
	hb.border_color = line
	hb.set_border_width_all(1)
	draw_style_box(hb, h)
	draw_string(ThemeDB.fallback_font, Vector2(h.position.x + 16, h.position.y + h.size.y / 2.0 + 4), "HIPS", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.8, 0.86, 0.88, 0.75))
	var cx := h.position.x + h.size.x / 2.0
	var kx := cx + _edge * (h.size.x / 2.0 - h.size.y / 2.0)
	draw_circle(Vector2(kx, h.position.y + h.size.y / 2.0), h.size.y / 2.0 - 4, Color(0.85, 0.9, 0.92, 0.85))
