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
@onready var terrain: Terrain = $Terrain

var _compass: Compass
var _places: PlaceLabels
var _dest := Vector3.ZERO      # the cove, on a trip
var _hour := Leg.LAUNCH_HOUR   # the day's clock, on a trip
var _groove := 0.0             # 0..1: a steady cadence has settled and the miles pass
var _arrived := false
var _dest_label: Label
## Sightings on the leg: what, which species of the field guide it is, where, and how close you
## must come to notice it. Positions checked against the terrain: seals and kelp on the islet by
## Yellow Island, the heron in the Labs' shallows, the eagle on Point Caution, the porpoise mid-channel.
const SIGHTINGS := [
	{ "kind": "heron", "species": "heron", "at": Vector3(560.0, 0.0, -1300.0), "face": Vector3(-1, 0, 0), "radius": 220.0 },
	{ "kind": "eagle", "species": "baldEagle", "at": Vector3(260.0, 0.0, -2600.0), "face": Vector3(1, 0, 0), "radius": 320.0 },
	{ "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-300.0, 0.0, -4200.0), "face": Vector3(0, 0, -1), "radius": 420.0 },
	{ "kind": "kelp", "species": "bullKelp", "at": Vector3(-900.0, 0.0, -6250.0), "face": Vector3(0, 0, -1), "radius": 200.0 },
	{ "kind": "seals", "species": "harbourSeal", "at": Vector3(-1100.0, 0.0, -6330.0), "face": Vector3(0, 0, 1), "radius": 260.0 },
]
var _sightings: Array = []   # [{conf, node, seen}]
const GROOVE_AFTER := 6.0       # seconds of steady holding before the day starts to pass
const GROOVE_SPEED := 28.0      # extra metres per second over the ground, in the groove
const GROOVE_HOURS_PER_SEC := 1.0 / 50.0  # the clock in the groove: an hour in fifty seconds
var _day: Dictionary = {}       # the authored day: tides, current, wind
var _set_label: Label

## Where the game puts you in on the water: the harbour at Friday Harbor, off the town float with
## Brown Island to starboard, pointed up San Juan Channel. Metres from the town, and degrees true.
const HARBOUR_SPAWN := Vector3(420.0, 0.1, -700.0)
const HARBOUR_HEADING := 32.0

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
	sea.terrain = terrain
	add_child(sea)
	move_child(sea, 0)
	kayak.global_position = terrain.place("fridayHarbor") + HARBOUR_SPAWN
	kayak.rotation.y = -deg_to_rad(HARBOUR_HEADING)  # heading = -yaw (see Kayak.heading)
	terrain.focus = kayak.global_position
	var sk := App.skin()
	kayak.deck_color = Color(sk.deck)
	kayak.panel_color = Color(sk.panel) if sk.panel else Color(sk.deck)
	kayak.hull_color = Color(sk.hull)
	kayak.sea_state = sea.sea_state
	kayak.build_hull()
	controls.stroke.connect(_on_stroke)
	controls.edge_changed.connect(func(v: float) -> void: kayak.edge = v)
	controls.steer_changed.connect(func(v: float) -> void: kayak.steer = v)
	_ui = UIKit.page($UI, 48, 24)
	heading_label.visible = false
	_compass = Compass.new()
	_compass.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	var top := 150.0 if controls.touch() else 40.0  # under the note on a phone, beside it on a desktop
	_compass.offset_left = -112; _compass.offset_right = -14; _compass.offset_top = top; _compass.offset_bottom = top + 118
	hud.add_child(_compass)
	_places = PlaceLabels.new()
	_places.reach = 8000.0  # the landings ahead show as you come up the channel without crowding the horizon
	$UI.add_child(_places)
	$UI.move_child(_places, 0)
	for p in terrain.meta.get("places", []):
		if p.id in ["anacortes", "thatcher", "harney", "wasp", "sanJuanChannel", "fridayHarbor"]:
			continue
		var w := terrain.place(p.id)
		_places.add_place(p.id, p.name, Vector3(w.x, maxf(terrain.height_at(w.x, w.z), 0.0) + 12.0, w.z), 12)
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
			_tilt_chip()
			_dest = Leg.COVE
			_day = App.content.get("tripDay", {})
			_set_label = UIKit.label("", 12, UIKit.MIST, false)
			_set_label.position = Vector2(20, 172)
			_set_label.size = Vector2(360, 20)
			hud.add_child(_set_label)
			_dest_label = UIKit.label("", 13, UIKit.FOAM, false, true)
			_dest_label.position = Vector2(20, 150)
			_dest_label.size = Vector2(360, 24)
			hud.add_child(_dest_label)
			_spawn_sightings()
			match App._url_param("near"):  # starts for checks
				"jones":
					kayak.global_position = _dest + Vector3(0.0, 0.1, -900.0)  # 900 m north of the cove
					kayak.rotation.y = PI  # heading south, into the cove
				"yellow":
					kayak.global_position = Vector3(-860.0, 0.1, -6225.0)
					kayak.rotation.y = -deg_to_rad(300.0)  # the kelp 50 m ahead, the seals' rock beyond
				"labs":
					kayak.global_position = Vector3(590.0, 0.1, -1312.0)
					kayak.rotation.y = -deg_to_rad(250.0)  # the heron 30 m off in the shallows
			note_label.text = "Friday Harbor · San Juan Channel opens ahead\n%s" % ("Hold the water to paddle · slide to lean · slide up to back off" if controls.touch() else "Hold W to paddle · A/D lean · S back · Q/E edge · J brace")

## Put the animals and the kelp where they live, on the shore or the water the terrain says is there.
func _spawn_sightings() -> void:
	for conf in SIGHTINGS:
		var at: Vector3 = conf.at
		var y := 0.0
		if conf.kind == "eagle" or conf.kind == "seals":
			y = maxf(terrain.height_at(at.x, at.z), 0.0) + (0.0 if conf.kind == "eagle" else 0.3)
		var node := Wildlife.make(conf.kind, Vector3(at.x, y, at.z), conf.face)
		add_child(node)
		_sightings.append({ "conf": conf, "node": node, "seen": false })

## Coming within reach of a sighting names it once, from the field guide, and keeps it in the save.
func _watch_sightings() -> void:
	for s in _sightings:
		if s.seen:
			continue
		var conf: Dictionary = s.conf
		if kayak.global_position.distance_to(conf.at) > float(conf.radius):
			continue
		s.seen = true
		var sp := _species(conf.species)
		if sp.is_empty():
			continue
		var seen: Array = App.save.get("seen", [])
		if not seen.has(conf.species):
			seen.append(conf.species)
			App.save.seen = seen
			App.persist()
		var text: String = sp.get("blurb", "")
		var facts: Array = sp.get("facts", [])
		if not facts.is_empty():
			text += "\n\n" + str(facts[0])
		var approach := int(sp.get("approachMetres", 0))
		if approach > 0:
			text += "\n\nKeep %d m off: let it come to you, or not." % approach
		_clear_card()
		_card = UIKit.card(sp.get("common", conf.species), text, App.sources_line(sp.get("sourceIds", [])), [["Noted", _clear_card, true]], "Sighting · %s" % sp.get("group", ""))
		_ui.add_child(UIKit.spacer())
		_ui.add_child(_card)
		Sound.gull()

func _species(id: String) -> Dictionary:
	for sp in App.content.get("species", []):
		if sp.id == id:
			return sp
	return {}

## The leg: where the cove is, how the day passes, and landing.
func _leg(delta: float) -> void:
	var here := kayak.global_position
	var dist := Vector2(_dest.x - here.x, _dest.z - here.z).length()
	var brg := Leg.bearing_deg(here, _dest)
	_compass.target = deg_to_rad(brg)
	# A steady hold settles into the groove: the boat makes ground over the chart and the clock runs.
	var steady := controls.holding_for() > GROOVE_AFTER and absf(controls.steer) < 0.3 and kayak.speed > 0.4
	_groove = move_toward(_groove, 1.0 if steady else 0.0, delta * (0.5 if steady else 1.5))
	if _groove > 0.01:
		var fwd := -kayak.global_basis.z
		var ahead := here + fwd * 60.0
		if terrain.height_at(ahead.x, ahead.z) < -0.5:
			kayak.global_position += fwd * GROOVE_SPEED * _groove * delta
		_hour += GROOVE_HOURS_PER_SEC * _groove * delta
	else:
		_hour += delta / 3600.0 * 12.0  # out of the groove the day still passes, twelve times real
	sea.apply_hour(_hour)
	# The current carries the boat over the ground, in the groove and out of it (the groove's hours
	# pass faster, so its drift is scaled with them).
	var cur := Tides.current_vector(_day, _hour)
	var drift := cur * delta * (1.0 + _groove * (GROOVE_HOURS_PER_SEC * 3600.0 - 1.0) * 0.25)
	var landing := here + drift * 4.0
	if terrain.height_at(landing.x, landing.z) < -0.5:
		kayak.global_position += drift
	_set_label.text = "San Juan Channel: %s · wind %d kn from %03d°" % [Tides.describe(_day, _hour), int(round(Tides.wind(_day, _hour).kn)), int(round(Tides.wind(_day, _hour).fromDeg))]
	_dest_label.text = "%s · %.1f km · %03d° · %s%s" % ["Jones Island north cove", dist / 1000.0, int(round(brg)), Leg.clock(_hour), " · in the groove" if _groove > 0.5 else ""]
	if dist < 220.0:
		_arrived = true
		_groove = 0.0
		controls.visible = false
		Sound.gull()
		_clear_card()
		_card = UIKit.card("The north cove", "Jones Island. Nose the boat onto the gravel, step out into the shallows and carry it up above the wrack line. The day is done at %s." % Leg.clock(_hour), App.sources_line(["wa-parks-jones", "wwta"]), [["Land and make camp", func() -> void: App.next(), true]], "Landing")
		_ui.add_child(UIKit.spacer())
		_ui.add_child(_card)

## On a phone, the option to edge by tilting the handset (off by default; it stays as set).
func _tilt_chip() -> void:
	if not controls.touch():
		return
	var b := UIKit.button("Tilt to edge: %s" % ("on" if controls.tilt_enabled else "off"), false)
	b.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	b.offset_left = -190; b.offset_right = -12; b.offset_top = -(Controls.HIPS_H + Controls.PAD * 2 + 48); b.offset_bottom = -(Controls.HIPS_H + Controls.PAD * 2 + 12)
	b.pressed.connect(func() -> void:
		controls.set_tilt(not controls.tilt_enabled)
		b.text = "Tilt to edge: %s" % ("on" if controls.tilt_enabled else "off"))
	hud.add_child(b)

func _process(delta: float) -> void:
	kayak.sea_time = sea.time
	speed_label.text = "%.1f kn" % absf(kayak.speed_knots())
	_compass.heading = kayak.heading
	if mode == "trip" and not _arrived:
		_leg(delta)
		_watch_sightings()
	_places.visible = hud.visible
	if _places.visible:
		_places.update(rig.camera())
	if _drill >= 0:
		_drill_progress(delta)

func _physics_process(_delta: float) -> void:
	# Running aground: the hull stops in the shallows instead of climbing the beach.
	var fwd := -kayak.global_basis.z
	var ahead := kayak.global_position + fwd * (2.6 if kayak.speed >= 0.0 else -2.6)
	if terrain.height_at(ahead.x, ahead.z) > -0.5:
		kayak.linear_velocity *= 0.6
		kayak.apply_central_force(-fwd * signf(kayak.speed) * kayak.mass * 4.0)
		if mode == "trip" and _drill < 0:
			note_label.text = "Aground — reverse off (drag up, or hold S)."

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
			if absf(kayak.edge) > 0.4 or absf(controls.steer) > 0.5:
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
			if q >= StrokeMath.GOOD_STROKE:
				Sound.dip(0.5)  # good paddling is nearly silent
			else:
				Sound.splash(0.45)
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
			Sound.dip(0.6)
			if _drill >= 0 and _drills()[_drill].id == "reverse":
				_drill_state.count += 1
				note_label.text = "%d of 4 reverse strokes" % _drill_state.count

func _why_arms() -> String:
	return "hold and let the rhythm settle; a tap is an arm stroke"
