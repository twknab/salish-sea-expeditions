## Paddling the way it feels, not the way a touchscreen wants it. You hold to paddle and the strokes
## come at a cadence, alternating sides; you lean to steer; you drag up (or hold S) to back off;
## a quick flick is a sweep; two thumbs down, or J/L, is a brace; the hips bar, Q/E, or the phone's
## tilt edges the boat. Good paddling is steady and near-silent — the coaching is about rhythm.
##
## Desktop: W or ↑ paddles, A/D (← →) lean to steer, S/↓ backs off, Z/C sweep, J/L brace, Q/E edge.
## Phone: hold anywhere on the water; slide the thumb left or right to lean; slide it up to back off.
class_name Controls
extends Control

signal stroke(side: int, q: float, kind: String)
signal hint(msg: String)
signal edge_changed(value: float)
signal steer_changed(value: float)

const HIPS_H := 46.0
const PAD := 8.0
const CADENCE := 1.0        # seconds per stroke, alternating sides: about 60 strokes a minute
const SETTLE := 0.8         # a hold this long is a rhythm; anything shorter is arms
const TAP := 0.22           # a press released this fast is a tap, not a hold
const FLICK := 70.0         # pixels sideways within TAP: a sweep
const STEER_PX := 90.0      # pixels of thumb travel for a full lean
const REVERSE_PX := 70.0    # pixels of upward travel to switch to backing off

var _hips_index := -1
var _edge := 0.0
var _edge_held := false
var _key_brace := false
var _label: Label
var _touches := {}          # index → {start: Vector2, pos: Vector2, t0: float}
var _key_paddle := false
var _key_reverse := false
var _key_steer := 0.0
var _hold_t := -1.0         # seconds the paddle hold has lasted; -1 when not holding
var _next_stroke := 0.0
var _side := -1
var _cadence_glow := 0.0
var _flash_msg_t := 0.0
var tilt_enabled := false   # the phone's tilt edges the boat (an option; see App.save.tilt)
var steer := 0.0            # -1 left .. 1 right, what the lean is asking for
var last := {}              # the last forward stroke's grading, for coaching
var braced := false         # two thumbs down, or J/L: the blade flat on the water

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	tilt_enabled = bool(App.save.get("tilt", false))
	_label = Label.new()
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.add_theme_font_size_override("font_size", 15)
	_label.add_theme_color_override("font_color", Color("f2d016"))
	_label.modulate.a = 0.0
	add_child(_label)
	set_process(true)

## Seconds the paddle hold has lasted; -1 when not holding.
func holding_for() -> float:
	return _hold_t

func touch() -> bool:
	return DisplayServer.is_touchscreen_available()

## The hips bar at the bottom; the water (everything above it, below the top third) is the paddle zone.
func zones() -> Dictionary:
	var w := size.x
	var h := size.y
	return {
		"hips": Rect2(PAD, h - HIPS_H - PAD, w - PAD * 2.0, HIPS_H),
		"water": Rect2(0, h * 0.3, w, h * 0.7 - HIPS_H - PAD * 2.0),
	}

func _gui_input(ev: InputEvent) -> void:
	# Godot emulates a mouse from every touch (buttons need it); those copies carry the emulation
	# device id, so each gesture is read once — from the touch on a phone, from the mouse on a desktop.
	if ev.device == InputEvent.DEVICE_ID_EMULATION:
		accept_event()
		return
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
	var zs := zones()
	if (zs.hips as Rect2).grow(4.0).has_point(p):
		_hips_index = i
		_edge_held = true
		_set_edge_from(p.x)
		return
	if not (zs.water as Rect2).has_point(p):
		return
	_touches[i] = { "start": p, "pos": p, "t0": _now() }

func _move(i: int, p: Vector2) -> void:
	if i == _hips_index:
		_set_edge_from(p.x)
		return
	if _touches.has(i):
		_touches[i].pos = p

func _up(i: int, p: Vector2) -> void:
	if i == _hips_index:
		_hips_index = -1
		_edge_held = false
		return
	if not _touches.has(i):
		return
	var t: Dictionary = _touches[i]
	_touches.erase(i)
	var d: Vector2 = p - t.start
	var dur: float = _now() - t.t0
	if dur < TAP and absf(d.x) > FLICK and absf(d.x) > absf(d.y):
		# A flick is a sweep: the blade on the side you flick from, the bow swinging the other way.
		var side := -1 if d.x > 0.0 else 1
		stroke.emit(side, 0.9, "sweep")
		_say("Sweep", true)
	elif dur < TAP:
		# A tap is one arm stroke. The lesson is in the label.
		_emit_forward(0.45, false)
		_say("Hold, don’t tap — paddling is a rhythm")

func _set_edge_from(x: float) -> void:
	var h: Rect2 = zones()["hips"]
	var rel := (x - (h.position.x + h.size.x / 2.0)) / (h.size.x / 2.0 - h.size.y / 2.0)
	_edge = clampf(rel, -1.0, 1.0)
	edge_changed.emit(_edge)
	queue_redraw()

func _emit_forward(q: float, reverse: bool) -> void:
	_side = -_side
	last = { "q": q, "steady": q >= StrokeMath.GOOD_STROKE, "kind": "reverse" if reverse else "forward" }
	stroke.emit(_side, q, "reverse" if reverse else "forward")
	_cadence_glow = 1.0
	queue_redraw()

func _say(msg: String, good: bool = false) -> void:
	var w: Rect2 = zones()["water"]
	_label.text = msg
	_label.add_theme_color_override("font_color", Color("8fd3a6") if good else Color("f2d016"))
	_label.size = Vector2(w.size.x, 24)
	_label.position = Vector2(w.position.x, w.end.y - 34)
	_label.modulate.a = 1.0
	_flash_msg_t = 1.6
	hint.emit(msg)

func _process(delta: float) -> void:
	# What the hands are asking for this frame: hold, direction, lean, brace.
	var holding := _key_paddle or _key_reverse or not _touches.is_empty()
	var reverse := _key_reverse
	var lean := _key_steer
	if not _touches.is_empty():
		var t: Dictionary = _touches.values()[0]
		var d: Vector2 = t.pos - t.start
		lean = clampf(d.x / STEER_PX, -1.0, 1.0)
		if d.y < -REVERSE_PX:
			reverse = true
	braced = _key_brace or _touches.size() >= 2
	if braced:
		holding = false
	if holding:
		if _hold_t < 0.0:
			_hold_t = 0.0
			_next_stroke = 0.35  # the first blade goes in soon, then the rhythm settles
		_hold_t += delta
		_next_stroke -= delta
		if _next_stroke <= 0.0:
			_next_stroke = CADENCE
			var q := clampf(0.5 + 0.5 * (_hold_t / SETTLE), 0.5, 0.92)
			_emit_forward(q, reverse)
	else:
		_hold_t = -1.0
	if absf(lean - steer) > 0.001:
		steer = lerpf(steer, lean, minf(1.0, delta * 10.0))
		if absf(steer - lean) < 0.01:
			steer = lean
		steer_changed.emit(steer)
		queue_redraw()
	# Tilt edges the boat when the option is on and nothing else is edging.
	if tilt_enabled and not _edge_held:
		var acc := Input.get_accelerometer()
		if acc.length() > 0.5:
			var v := clampf(acc.x / 4.0, -1.0, 1.0)
			if absf(v) < 0.08:
				v = 0.0
			if absf(v - _edge) > 0.01:
				_edge = v
				edge_changed.emit(_edge)
				queue_redraw()
	if _flash_msg_t > 0.0:
		_flash_msg_t -= delta
		_label.modulate.a = clampf(_flash_msg_t / 0.6, 0.0, 1.0)
	if _cadence_glow > 0.0:
		_cadence_glow = maxf(0.0, _cadence_glow - delta * 1.6)
		queue_redraw()
	if not _edge_held and not tilt_enabled and _edge != 0.0:
		_edge *= pow(0.02, delta)
		if absf(_edge) < 0.02:
			_edge = 0.0
		edge_changed.emit(_edge)
		queue_redraw()

func _unhandled_input(ev: InputEvent) -> void:
	if not (ev is InputEventKey) or ev.echo:
		return
	var on: bool = ev.pressed
	match ev.keycode:
		KEY_W, KEY_UP: _key_paddle = on
		KEY_S, KEY_DOWN: _key_reverse = on
		KEY_A, KEY_LEFT: _key_steer = -1.0 if on else (0.0 if _key_steer < 0.0 else _key_steer)
		KEY_D, KEY_RIGHT: _key_steer = 1.0 if on else (0.0 if _key_steer > 0.0 else _key_steer)
		KEY_Z:
			if on:
				stroke.emit(-1, 0.9, "sweep"); _say("Sweep left — the bow swings right", true)
		KEY_C:
			if on:
				stroke.emit(1, 0.9, "sweep"); _say("Sweep right — the bow swings left", true)
		KEY_J, KEY_L, KEY_SPACE: _key_brace = on
		KEY_Q:
			_edge_held = on
			if on:
				_edge = -1.0; edge_changed.emit(_edge); queue_redraw()
		KEY_E:
			_edge_held = on
			if on:
				_edge = 1.0; edge_changed.emit(_edge); queue_redraw()

func set_tilt(on: bool) -> void:
	tilt_enabled = on
	App.save.tilt = on
	App.persist()
	queue_redraw()

func _draw() -> void:
	var zs := zones()
	var ink := Color(0.03, 0.09, 0.11, 0.42)
	var line := Color(1, 1, 1, 0.12)
	# The cadence: a soft pulse at the foot of the water, on the side of the blade that just went in.
	var w: Rect2 = zs["water"]
	if _cadence_glow > 0.0:
		var cx := w.position.x + w.size.x * (0.3 if _side < 0 else 0.7)
		draw_circle(Vector2(cx, w.end.y - 10.0), 10.0 + 26.0 * (1.0 - _cadence_glow), Color(0.56, 0.83, 0.65, 0.35 * _cadence_glow))
	# The lean: a short bar that slides with the steer.
	if absf(steer) > 0.02:
		var mid := w.position.x + w.size.x * 0.5
		draw_line(Vector2(mid, w.end.y - 10.0), Vector2(mid + steer * 60.0, w.end.y - 10.0), Color(1, 1, 1, 0.5), 3.0, true)
	var h: Rect2 = zs["hips"]
	var hb := StyleBoxFlat.new()
	hb.bg_color = ink
	hb.set_corner_radius_all(23)
	hb.border_color = line
	hb.set_border_width_all(1)
	draw_style_box(hb, h)
	draw_string(ThemeDB.fallback_font, Vector2(h.position.x + 16, h.position.y + h.size.y / 2.0 + 4), "HIPS · TILT" if tilt_enabled else "HIPS", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.8, 0.86, 0.88, 0.75))
	var cx := h.position.x + h.size.x / 2.0
	var kx := cx + _edge * (h.size.x / 2.0 - h.size.y / 2.0)
	draw_circle(Vector2(kx, h.position.y + h.size.y / 2.0), h.size.y / 2.0 - 4, Color(0.85, 0.9, 0.92, 0.85))
