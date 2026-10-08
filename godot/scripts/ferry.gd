## The crossing from Anacortes, seen as a chart: the camera rides high over the real islands while
## the ferry runs the real Washington State Ferries track — Guemes Channel, Rosario Strait, Thatcher
## Pass, north of Lopez, Harney Channel, Wasp Passage, San Juan Channel — and each island is named
## as the ferry comes abeam of it. Half a minute at normal speed; faster if you like; or step down
## to the rail and watch the water go by. There is no skipping it: the ferry is how a folding kayak
## reaches the islands, and the crossing is where the map is first learned.
extends Node3D

const DURATION := 26.0            # seconds for the whole run at 1×
const RATES: Array[float] = [1.0, 2.0, 4.0]
const CHART_HEIGHT := 2600.0      # camera altitude in chart view
const CHART_BACK := 1900.0        # camera distance behind the ferry, along the track
const CHART_AHEAD := 1400.0       # where the camera looks, ahead of the ferry
const CHART_SCALE := 3.0          # the ferry is a chart symbol from up there, so it is drawn larger

var _terrain: Terrain
var _sea: Seascape
var _ferry: FerryModel
var _chart_cam: Camera3D
var _rail_cam: Camera3D
var _track: PackedVector2Array
var _cum: PackedFloat32Array        # cumulative distance at each track point
var _length := 0.0
var _events: Array = []             # [{place, at (metres)}]
var _s := 0.0                       # distance run, metres
var _rate_i := 0
var _dir := Vector3.FORWARD         # smoothed direction of travel
var _rail := false
var _arrived := false
var _next_event := 0
var _ui: VBoxContainer
var _card: PanelContainer
var _bar: ProgressBar
var _counter: Label
var _rate_buttons: Array[Button] = []
var _view_button: Button
var _labels: PlaceLabels
var _label_points: Dictionary = {}  # place id -> Vector3
var _ribbon: Node3D                 # the track drawn on the chart; it is not there from the rail
var _home := false                  # the run back to Anacortes at the end of the expedition
var _paddled: Array = []            # place ids the expedition landed at or passed, named at the rail

func _ready() -> void:
	_home = App._url_param("home") == "1" or bool(App.save.get("ferryHome", false))
	_load_route()
	if _home:
		_paddled = Leg.places_paddled()
	_terrain = Terrain.new()
	_terrain.trees_enabled = false
	_terrain.near = 2000.0
	add_child(_terrain)
	_ferry = FerryModel.new()
	add_child(_ferry)
	_sea = Seascape.new()
	_sea.sea_state = 0.18
	_sea.hour = (_sea.sunset - 1.4) if _home else 7.5  # the morning boat out; the last boat home in the evening light
	_sea.fog_density = 0.00003  # a clear morning, seen from a chart's height
	_sea.follow = _ferry
	_sea.terrain = _terrain
	add_child(_sea)
	move_child(_sea, 0)
	_chart_cam = Camera3D.new()
	_chart_cam.fov = 48.0
	_chart_cam.near = 60.0  # nothing is nearer than the water 2.6 km below, and depth precision at the islands needs it
	_chart_cam.far = 40000.0
	add_child(_chart_cam)
	_rail_cam = Camera3D.new()
	_rail_cam.fov = 62.0
	_rail_cam.near = 1.0
	_rail_cam.far = 30000.0
	# Between the forward wheelhouse and the bow rail, on the sun deck.
	_rail_cam.position = Vector3(-2.0, 13.0, -FerryModel.LENGTH * 0.36 + 2.2)
	_rail_cam.rotation = Vector3(deg_to_rad(-14.0), 0.0, 0.0)
	_ferry.add_child(_rail_cam)
	_draw_track()
	_place_marks()
	# ?at=0.6 opens the run part way along — for screenshots, and for anyone checking a passage.
	_s = clampf(float(App._url_param("at")), 0.0, 0.98) * _length
	while _next_event < _events.size() and _events[_next_event].at < _s - 1.0:
		_next_event += 1
	_place(_s)
	_dir = _direction_at(_s)
	_chart_cam.global_position = _chart_eye()
	_chart_cam.look_at(_chart_target(), Vector3.UP)
	_build_ui()
	_set_view(App._url_param("view") == "rail")
	Sound.horn()
	if _home:
		_show_card("The ferry home", "The boat walks on in its bag, the way it came. Watch the islands go by from the rail and name them: you have paddled under most of them now. San Juan Channel, Wasp Passage, Harney Channel, Thatcher Pass, and the slip at Anacortes.", App.sources_line(["wsf"]), "On the ferry · the expedition behind you")
		return
	var intro := "You are on the 7:30 out of Anacortes with your kayak packed in its bag below. Nothing to paddle yet — that comes after Kayak School in Friday Harbor. "
	intro += "This is the run the ferry really makes: Thatcher Pass, north of Lopez, Harney Channel, Wasp Passage, then down San Juan Channel. Each island is named as it comes abeam."
	_show_card("Walk-on with a folding kayak", intro, App.sources_line(["wsf", "trak"]), "On the ferry · no paddling yet")

func _load_route() -> void:
	var f := FileAccess.open("res://content/ferry_route.json", FileAccess.READ)
	var doc: Dictionary = JSON.parse_string(f.get_as_text()) if f else {}
	_track = PackedVector2Array()
	for p in doc.get("track", [[24400, 2700], [300, -650]]):
		_track.append(Vector2(p[0], p[1]))
	_cum = PackedFloat32Array()
	_cum.append(0.0)
	for i in range(1, _track.size()):
		_cum.append(_cum[i - 1] + _track[i].distance_to(_track[i - 1]))
	_length = _cum[_cum.size() - 1]
	for e in doc.get("events", []):
		_events.append({ "place": e.place, "at": _cum[int(e.index)] })
	if _home:
		# The same track run the other way: the islands come abeam in the reverse order.
		_track.reverse()
		_cum = PackedFloat32Array()
		_cum.append(0.0)
		for i in range(1, _track.size()):
			_cum.append(_cum[i - 1] + _track[i].distance_to(_track[i - 1]))
		var back: Array = []
		for e in _events:
			back.append({ "place": e.place, "at": _length - float(e.at) })
		back.reverse()
		_events = back

## Position on the track at distance s.
func _point_at(s: float) -> Vector3:
	s = clampf(s, 0.0, _length)
	var i := 1
	while i < _cum.size() - 1 and _cum[i] < s:
		i += 1
	var t := inverse_lerp(_cum[i - 1], _cum[i], s) if _cum[i] > _cum[i - 1] else 0.0
	var p := _track[i - 1].lerp(_track[i], t)
	return Vector3(p.x, 0.0, p.y)

func _direction_at(s: float) -> Vector3:
	var a := _point_at(s)
	var b := _point_at(minf(s + 120.0, _length))
	var d := b - a
	return d.normalized() if d.length() > 0.01 else _dir

func _place(s: float) -> void:
	var p := _point_at(s)
	var d := _direction_at(s)
	_ferry.global_position = Vector3(p.x, 0.2, p.z)
	_ferry.look_at(_ferry.global_position + d, Vector3.UP)

func _chart_eye() -> Vector3:
	return _ferry.global_position - _dir * CHART_BACK + Vector3.UP * CHART_HEIGHT

func _chart_target() -> Vector3:
	return _ferry.global_position + _dir * CHART_AHEAD

## The track as a dashed ribbon a little above the water, the way a chart draws a ferry route.
func _draw_track() -> void:
	var pts := PackedVector3Array()
	for p in _track:
		pts.append(Vector3(p.x, 0.0, p.y))
	_ribbon = ChartRibbon.build(pts, Color(UIKit.SUN, 0.85))
	add_child(_ribbon)

## Where the island names float. Taken from the terrain's gazetteer where it has the place.
func _place_marks() -> void:
	var anchors := {
		"anacortes": _terrain.place("anacortes"), "lopez": _terrain.place("lopez"), "orcas": _terrain.place("orcas"),
		"shaw": _terrain.place("shaw"), "thatcherPass": _terrain.place("thatcher"), "waspPassage": _terrain.place("wasp"),
		"sanJuan": _terrain.place("fridayHarbor") + Vector3(-2600.0, 0.0, -2400.0), "fridayHarbor": _terrain.place("fridayHarbor"),
	}
	for id in anchors:
		var p: Vector3 = anchors[id]
		_label_points[id] = Vector3(p.x, maxf(_terrain.height_at(p.x, p.z), 0.0) + 40.0, p.z)

func _place_info(id: String) -> Dictionary:
	for p in App.content.get("places", []):
		if p.id == id:
			return p
	return { "name": id, "text": "" }

func _set_view(rail: bool) -> void:
	_rail = rail
	_ferry.scale = Vector3.ONE * (1.0 if rail else CHART_SCALE)
	_terrain.near = 4200.0 if rail else 2000.0
	_rail_cam.current = rail
	_chart_cam.current = not rail
	if _ribbon:
		_ribbon.visible = not rail  # a chart symbol, not a thing on the water
	if _view_button:
		_view_button.text = "Chart view" if rail else "Rail view"

func _set_rate(i: int) -> void:
	_rate_i = clampi(i, 0, RATES.size() - 1)
	for k in range(_rate_buttons.size()):
		_rate_buttons[k].modulate = Color(1, 1, 1, 1.0 if k == _rate_i else 0.55)

# ---------- interface ----------

func _build_ui() -> void:
	var ui := CanvasLayer.new()
	add_child(ui)
	_labels = PlaceLabels.new()
	ui.add_child(_labels)
	for id in _label_points:
		_labels.add_place(id, _place_info(id).get("name", id), _label_points[id])
	_ui = UIKit.page(ui, 48, 24)
	var top := VBoxContainer.new()
	top.add_theme_constant_override("separation", 8)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	var title := UIKit.label("%s · %.0f km" % ["Friday Harbor → Anacortes" if _home else "Anacortes → Friday Harbor", _length / 1000.0], 13, UIKit.FOAM, false, true)
	top.add_child(title)
	var fill := Control.new()
	fill.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(fill)
	for k in range(RATES.size()):
		var b := UIKit.button("%d×" % int(RATES[k]), false)
		b.custom_minimum_size = Vector2(52, 36)
		b.pressed.connect(_set_rate.bind(k))
		row.add_child(b)
		_rate_buttons.append(b)
	_view_button = UIKit.button("Rail view", false)
	_view_button.custom_minimum_size = Vector2(0, 36)
	_view_button.pressed.connect(func() -> void: _set_view(not _rail))
	row.add_child(_view_button)
	top.add_child(row)
	_bar = ProgressBar.new()
	_bar.show_percentage = false
	_bar.custom_minimum_size = Vector2(0, 5)
	var bg := StyleBoxFlat.new(); bg.bg_color = Color(1, 1, 1, 0.15); bg.set_corner_radius_all(3)
	var fg := StyleBoxFlat.new(); fg.bg_color = UIKit.SUN; fg.set_corner_radius_all(3)
	_bar.add_theme_stylebox_override("background", bg)
	_bar.add_theme_stylebox_override("fill", fg)
	top.add_child(_bar)
	_counter = UIKit.label("", 12, UIKit.MIST)
	top.add_child(_counter)
	# A quiet panel behind the top block: from a chart's height the land under it is pale.
	var frame := PanelContainer.new()
	frame.add_theme_stylebox_override("panel", UIKit.panel_style(0.45, 16))
	frame.add_child(top)
	_ui.add_child(frame)
	_ui.add_child(UIKit.spacer())
	_set_rate(0)

func _show_card(title: String, text: String, source: String, kicker: String) -> void:
	if _card:
		_card.queue_free()
	var actions: Array = []
	if _arrived and _home:
		actions.append(["The debrief · how it went", func() -> void: App.save.erase("ferryHome"); App.save.stage = "camp_done"; App.persist(); App.go("debrief"), true])
	elif _arrived:
		actions.append(["Walk off in Friday Harbor", func() -> void: App.next(), true])
	_card = UIKit.card(title, text, source, actions, kicker)
	_ui.add_child(_card)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1: _set_rate(0)
			KEY_2: _set_rate(1)
			KEY_4: _set_rate(2)
			KEY_V: _set_view(not _rail)

# ---------- the run ----------

func _process(delta: float) -> void:
	var speed := _length / DURATION * RATES[_rate_i]
	if not _arrived:
		_s = minf(_s + speed * delta, _length)
		_place(_s)
	var t := _sea.time
	_ferry.rotation.z += sin(t * 0.5) * 0.004
	_ferry.position.y = 0.2 + sin(t * 0.45) * 0.08
	_dir = _dir.slerp(_direction_at(_s), minf(1.0, delta * 1.6)).normalized()
	if not _rail:
		_chart_cam.global_position = _chart_cam.global_position.lerp(_chart_eye(), minf(1.0, delta * 2.5))
		_chart_cam.look_at(_chart_target(), Vector3.UP)
	while _next_event < _events.size() and _s >= _events[_next_event].at - 1.0:
		var e: Dictionary = _events[_next_event]
		_next_event += 1
		if e.place == ("anacortes" if _home else "fridayHarbor"):
			continue  # the arrival card says this
		var p := _place_info(e.place)
		var text: String = p.get("text", "")
		if _home and e.place in _paddled:
			text += " You paddled under this one."
		_show_card(p.get("name", e.place), text, App.sources_line(p.get("sourceIds", [])), "Abeam · %d of %d" % [_next_event, _events.size() - 1])
	_bar.value = _s / _length * 100.0
	_counter.text = "%.1f km to %s · %s" % [(_length - _s) / 1000.0, "Anacortes" if _home else "Friday Harbor", "at the rail" if _rail else "chart view"]
	_labels.update(_rail_cam if _rail else _chart_cam)
	if not _arrived and _s >= _length:
		_arrived = true
		Sound.horn()
		if _home:
			_show_card("Anacortes", "The ferry noses into the slip at Anacortes and the bag comes off on its wheels. Three days, two islands, and the whole of the channel under your own paddle. The debrief is next: how it went, day by day.", App.sources_line(["wsf"]), "Home")
			return
		var p := _place_info("fridayHarbor")
		_show_card("Friday Harbor", "The ferry backs into the slip. Wheel your kayak bag down the ramp: the beach where you will build it is a short walk along the waterfront.", App.sources_line(p.get("sourceIds", ["wsf"])), "Arrival")
