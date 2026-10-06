## The water scene in three manners. `ambient` (the title): the kayak drifts, the camera circles.
## `school` (Kayak School): the boat, the body and the paddle up close, then the five drills in
## calm water. `trip`: the open water with the touch controls. Content comes from App.content.
extends Node3D

@onready var kayak: Kayak = $Kayak
@onready var controls: Controls = $UI/Controls
@onready var hud: Control = $UI/HUD
@onready var speed_label: Label = $UI/HUD/Speed
@onready var heading_label: Label = $UI/HUD/Heading
@onready var note_label: Label = $UI/HUD/Note
@onready var rig: CameraRig = $CameraRig

var mode := "trip"
var sea: Seascape
var _count := 0
var _ui: VBoxContainer
var _card: PanelContainer
var _phase := 0            # index into _tour
var _tour: Array = []      # [{kind, title, text, source, anchor, dist, az, el}]
var _drill := -1
var _drill_state := {}
var _drill_bar: ProgressBar
var _wobble := 0.0

func _ready() -> void:
	mode = App.sea_mode
	sea = Seascape.new()
	sea.follow = kayak
	sea.sea_state = 0.08 if mode == "school" else 0.22
	sea.island_center = $Island.global_position
	sea.island_radius = ($Island as Island).radius * 0.78
	add_child(sea)
	move_child(sea, 0)
	var sk := App.skin()
	kayak.deck_color = Color(sk.deck)
	kayak.panel_color = Color(sk.panel) if sk.panel else Color(sk.deck)
	kayak.hull_color = Color(sk.hull)
	kayak.sea_state = sea.sea_state
	kayak.build_hull()
	controls.stroke.connect(_on_stroke)
	controls.edge_changed.connect(func(v: float) -> void: kayak.edge = v)
	_ui = UIKit.page($UI, 48, 24)
	match mode:
		"ambient":
			controls.visible = false
			hud.visible = false
			rig.orbit()
		"school":
			controls.visible = false
			hud.visible = false
			_build_tour()
			_phase = App.school_from
			_show_phase()
		_:
			note_label.text = "Friday Harbor · calm water\nSwipe a blade zone from the top to the hip line."

func _process(delta: float) -> void:
	kayak.sea_time = sea.time
	speed_label.text = "%.1f kn" % absf(kayak.speed_knots())
	heading_label.text = "%03d°" % int(round(fposmod(rad_to_deg(kayak.heading), 360.0)))
	if _drill >= 0:
		_drill_progress(delta)

# ---------- Kayak School ----------

## Every stop on the tour: boat parts on the hull, body points on the paddler, paddle parts, then
## the drills. Anchors are in the kayak's local space (x starboard, y up, z aft).
func _build_tour() -> void:
	var c := App.content
	var hull_anchor := func(s: float, lat: float, which: String) -> Vector3:
		var h := Hull.heights(s)
		return Vector3(lat, h[which], -Hull.x_at(s))
	var anchors := {
		"bow": hull_anchor.call(0.02, 0.0, "ridge"), "stern": hull_anchor.call(0.98, 0.0, "ridge"),
		"deck": hull_anchor.call(0.25, 0.0, "ridge"), "hull": hull_anchor.call(0.3, 0.22, "chine"),
		"keel": hull_anchor.call(0.48, 0.0, "keel"), "chine": hull_anchor.call(0.76, 0.22, "chine"),
		"cockpit": Vector3(0, 0.26, -0.35), "skirt": Vector3(0, 0.3, 0.0), "frame": hull_anchor.call(0.15, 0.15, "sheer"),
		"jacks": Vector3(0.2, 0.2, -0.05), "float": hull_anchor.call(0.82, 0.1, "sheer"),
	}
	var views := {
		"bow": [3.2, 0.4, 0.25], "stern": [3.2, PI - 0.4, 0.25], "deck": [2.6, 1.1, 0.7], "hull": [3.0, 1.3, -0.05],
		"keel": [3.4, 1.5, -0.25], "chine": [2.8, 1.7, 0.05], "cockpit": [2.4, 0.9, 0.8], "skirt": [2.0, 0.5, 0.9],
		"frame": [2.4, 1.2, 0.5], "jacks": [2.2, 1.4, 0.6], "float": [2.6, 2.3, 0.5],
	}
	_tour.clear()
	_tour.append({ "kind": "intro", "kicker": "Kayak School", "title": "Know your boat, your body, your paddle", "text": "Before the crossing, a quiet beach and the boat you will paddle all game. Tap Next to walk around it.", "source": "", "anchor": Vector3(0, 0.2, 0), "dist": 7.0, "az": 0.7, "el": 0.45 })
	for p in c.get("kayakParts", []):
		var v: Array = views.get(p.id, [3.0, 0.8, 0.4])
		_tour.append({ "kind": "boat", "kicker": "The boat", "title": p.name, "text": p.text, "source": App.sources_line(p.sourceIds), "anchor": anchors.get(p.id, Vector3.ZERO), "dist": v[0], "az": v[1], "el": v[2] })
	var body_views := { "feet": [2.2, 0.9, 0.5], "knees": [2.0, 1.0, 0.55], "hips": [2.2, 1.3, 0.35], "back": [2.2, 2.6, 0.4], "head": [1.8, 0.8, 0.3] }
	for b in c.get("bodyPoints", []):
		var v: Array = body_views.get(b.id, [2.2, 1.0, 0.4])
		_tour.append({ "kind": "body", "kicker": "The body", "title": b.name, "text": b.text, "source": App.sources_line(b.sourceIds), "anchor": kayak.paddler_anchor(b.id), "dist": v[0], "az": v[1], "el": v[2] })
	var paddle_views := { "blade": [1.6, 1.4, 0.5], "loom": [1.6, 0.2, 0.7], "shoulder": [1.4, 1.6, 0.6], "tip": [1.4, 1.7, 0.4], "box": [2.0, 0.1, 0.5] }
	for pp in c.get("paddleParts", []):
		var v: Array = paddle_views.get(pp.id, [1.6, 1.0, 0.5])
		_tour.append({ "kind": "paddle", "kicker": "The paddle", "title": pp.name, "text": pp.text, "source": App.sources_line(pp.sourceIds), "anchor": kayak.paddler_anchor(pp.id), "dist": v[0], "az": v[1], "el": v[2] })
	_tour.append({ "kind": "drills", "kicker": "Calm water", "title": "Now paddle it", "text": "Five short drills: the forward stroke, the reverse stroke, edging, the sweep turn and the low brace. Everything later builds on these.", "source": "", "anchor": Vector3(0, 0.3, 0), "dist": 6.0, "az": 0.2, "el": 0.5 })

func _show_phase() -> void:
	App.school_from = _phase
	var t: Dictionary = _tour[_phase]
	rig.focus(t.anchor, t.dist, t.az, t.el)
	_clear_card()
	var actions: Array = []
	if _phase > 0:
		actions.append(["Back", func() -> void: _phase -= 1; _show_phase(), false])
	if t.kind == "drills":
		actions.append(["Into the water", _start_drills, true])
	else:
		actions.append(["Next", func() -> void: _phase += 1; _show_phase(), true])
	_card = UIKit.card(t.title, t.text, t.source, actions, "%s · %d of %d" % [t.kicker, _phase + 1, _tour.size()])
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

func _clear_card() -> void:
	for ch in _ui.get_children():
		ch.queue_free()
	_card = null

func _start_drills() -> void:
	_clear_card()
	controls.visible = true
	hud.visible = true
	rig.chase()
	_start_drill(0)

func _drills() -> Array:
	return App.content.get("drills", [])

func _start_drill(i: int) -> void:
	_drill = i
	_drill_state = { "count": 0, "t": 0.0, "turned": 0.0, "prev": kayak.heading }
	var d: Dictionary = _drills()[i]
	var keys := "" if DisplayServer.is_touchscreen_available() else "\nKeyboard: %s." % d.get("keys", "")
	note_label.text = "%s\n%s\nGoal: %s.%s" % [d.title, d.text, d.goal, keys]
	if _drill_bar == null:
		_drill_bar = ProgressBar.new()
		_drill_bar.show_percentage = false
		_drill_bar.custom_minimum_size = Vector2(0, 5)
		_drill_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
		_drill_bar.offset_left = 30; _drill_bar.offset_right = -30
		_drill_bar.offset_top = -234; _drill_bar.offset_bottom = -229
		var bg := StyleBoxFlat.new(); bg.bg_color = Color(1, 1, 1, 0.15); bg.set_corner_radius_all(3)
		var fg := StyleBoxFlat.new(); fg.bg_color = UIKit.SUN; fg.set_corner_radius_all(3)
		_drill_bar.add_theme_stylebox_override("background", bg)
		_drill_bar.add_theme_stylebox_override("fill", fg)
		hud.add_child(_drill_bar)
	_drill_bar.value = 0
	if d.id == "brace":
		_wobble = 2.5

func _drill_progress(delta: float) -> void:
	var d: Dictionary = _drills()[_drill]
	var s := _drill_state
	var p := 0.0
	match d.id:
		"forward": p = s.count / 6.0
		"reverse": p = s.count / 4.0
		"edge":
			s.t = s.t + delta if absf(kayak.edge) > 0.6 else maxf(0.0, s.t - delta * 2.0)
			p = s.t / 3.0
		"sweep":
			var dh := angle_difference(s.prev, kayak.heading)
			s.prev = kayak.heading
			if absf(kayak.edge) > 0.4:
				s.turned += absf(dh)
			p = s.turned / PI
		"brace":
			_wobble -= delta
			if _wobble <= 0.0:
				_wobble = 3.2
				kayak.kick(1.4)
				Sound.hull_slap(0.7)
			if kayak.wobbling() and controls.braced and not s.get("braced_now", false):
				s.braced_now = true
				s.count += 1
				kayak.settle()
				note_label.text = "Braced — %d of 3" % s.count
			elif not kayak.wobbling():
				s.braced_now = false
			p = s.count / 3.0
	_drill_bar.value = clampf(p, 0.0, 1.0) * 100.0
	if p >= 1.0:
		_drill = -1
		var next_i := _drills().find(d) + 1
		note_label.text = "Nicely done."
		if next_i < _drills().size():
			get_tree().create_timer(1.0).timeout.connect(func() -> void: _start_drill(next_i))
		else:
			_finish_school()

func _finish_school() -> void:
	controls.visible = false
	_drill_bar.visible = false
	_clear_card()
	_card = UIKit.card("Kayak School complete", "Power from the torso, control from the hips, head down in a brace. Everything from here builds on this.", App.sources_line(["aca"]), [["Onto the water", func() -> void: App.go("trip"), true]], "Kayak School")
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

# ---------- Strokes ----------

func _on_stroke(side: int, q: float, kind: String) -> void:
	match kind:
		"forward":
			kayak.stroke(side, q)
			Sound.splash(0.3 + 0.5 * q)
			if _drill >= 0 and _drills()[_drill].id == "forward":
				if q >= StrokeMath.GOOD_STROKE:
					_drill_state.count += 1
					note_label.text = "%d of 6 rotation strokes" % _drill_state.count
				else:
					note_label.text = "Not counted — %s" % _why_arms()
			elif mode == "trip":
				if q >= StrokeMath.GOOD_STROKE:
					_count += 1
					note_label.text = "%d rotation strokes" % _count
				else:
					note_label.text = "Arms — rotate"
		"sweep":
			kayak.sweep(side)
			Sound.splash(0.7)
		"reverse":
			kayak.reverse(side)
			Sound.splash(0.6)
			if _drill >= 0 and _drills()[_drill].id == "reverse":
				_drill_state.count += 1
				note_label.text = "%d of 4 reverse strokes" % _drill_state.count

func _why_arms() -> String:
	var st := controls.last
	if st.is_empty():
		return "rotate, don’t pull"
	if st.reach < 0.4:
		return "start higher: the top of the blade zone is your feet"
	if not st.exit_at_hip:
		return "finish at the hip line"
	return "pull steadily, not a flick"
