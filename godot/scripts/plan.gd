## The float plan: the leg on a chart before you launch. The same chart camera as the ferry, held
## over the leg from Friday Harbor to Jones Island, with the route drawn and each part of the plan
## — route, tide and current, traffic, bail-outs, filing it — read in turn. Then you launch.
extends Node3D

var _terrain: Terrain
var _sea: Seascape
var _ui: VBoxContainer
var _card: PanelContainer
var _labels: PlaceLabels
var _cam: Camera3D
var _step := 0
var _steps: Array = []
var _head: Label
var _day: Dictionary = {}
var _graph: TideGraph
var _leg: Dictionary = {}
var _verdict: Label

func _ready() -> void:
	_terrain = Terrain.new()
	_terrain.trees_enabled = false
	_terrain.near = 1500.0
	add_child(_terrain)
	_sea = Seascape.new()
	_sea.sea_state = 0.12
	_sea.hour = Leg.launch_hour() - 0.5
	_sea.fog_density = 0.00003
	_sea.terrain = _terrain
	add_child(_sea)
	move_child(_sea, 0)
	_leg = Leg.current()
	var wps := Leg.waypoints(_leg)
	var lo := wps[0]
	var hi := wps[0]
	for w in wps:
		lo = Vector3(minf(lo.x, w.x), 0.0, minf(lo.z, w.z))
		hi = Vector3(maxf(hi.x, w.x), 0.0, maxf(hi.z, w.z))
	var mid := (lo + hi) * 0.5
	var extent := maxf(hi.x - lo.x, hi.z - lo.z)
	var alt := clampf(extent * 0.8, 3600.0, 10500.0)
	_terrain.focus = mid
	_sea.follow = _terrain  # the water sits still under the chart; the terrain node is at the origin
	_cam = Camera3D.new()
	_cam.fov = 44.0
	_cam.near = 60.0
	_cam.far = 40000.0
	add_child(_cam)
	# From the south-east, high enough to hold the whole leg with the camp at the top of the frame.
	_cam.global_position = mid + Vector3(0.5, 1.0, 0.81) * alt
	_cam.look_at(mid + Vector3(0, 0, -600.0), Vector3.UP)
	_cam.current = true
	var pts := PackedVector3Array()
	for w in wps:
		pts.append(w)
	add_child(ChartRibbon.build(pts, Color(UIKit.SUN, 0.9)))
	var ui := CanvasLayer.new()
	add_child(ui)
	_labels = PlaceLabels.new()
	_labels.reach = 30000.0
	ui.add_child(_labels)
	for id in _leg.get("labels", []):
		var w := _terrain.place(id)
		var nm: String = id
		for p in _terrain.meta.get("places", []):
			if p.id == id:
				nm = p.name
		_labels.add_place(id, nm, Vector3(w.x, maxf(_terrain.height_at(w.x, w.z), 0.0) + 30.0, w.z))
	_ui = UIKit.page(ui, 48, 24)
	_steps = _leg.get("steps", [])
	_day = App.day()
	_head = UIKit.label("", 13, UIKit.FOAM, true, true)
	_refresh_head()
	var frame := PanelContainer.new()
	frame.add_theme_stylebox_override("panel", UIKit.panel_style(0.45, 16))
	frame.add_child(_head)
	_ui.add_child(frame)
	_ui.add_child(UIKit.spacer())
	var at := App._url_param("step")  # `?scene=plan&step=1` opens on a step, for checks
	if at != "":
		_step = clampi(int(at), 0, maxi(_steps.size() - 1, 0))
	_show()

func _show() -> void:
	if _card:
		_card.queue_free()
	var actions: Array = []
	if _step > 0:
		actions.append(["Back", func() -> void: _step -= 1; _show(), false])
	if _step < _steps.size() - 1:
		actions.append(["Next", func() -> void: _step += 1; _show(), true])
	else:
		actions.append(["Launch", func() -> void: App.next(), true])
	var s: Dictionary = _steps[_step] if _step < _steps.size() else { "title": "The plan", "text": "", "sourceIds": [] }
	_card = UIKit.card(s.get("title", ""), s.get("text", ""), App.sources_line(s.get("sourceIds", [])), actions, "Float plan · day %d · %d of %d" % [Leg.index() + 1, _step + 1, _steps.size()])
	if s.get("id", "") == "tide":
		_add_graph()
	_ui.add_child(_card)

## The tide step carries the day's water as a graph: choose the launch on it, and the plan, the
## chart's light and the leg itself follow the hour.
func _add_graph() -> void:
	var v: VBoxContainer = _card.get_child(0)
	var at := v.get_child_count() - 1  # above the actions row
	_graph = TideGraph.new()
	_graph.day = _day
	_graph.launch = Leg.launch_hour()
	_graph.leg_hours = Leg.hours_at_touring_pace(_leg)
	_graph.launch_changed.connect(_on_launch)
	v.add_child(_graph)
	v.move_child(_graph, at)
	_verdict = UIKit.label("", 13, UIKit.SUN, true, true)
	v.add_child(_verdict)
	v.move_child(_verdict, at + 1)
	var hint := UIKit.label("Drag the graph to choose when to launch · or Tab to it and use ← →", 11, UIKit.MIST)
	v.add_child(hint)
	v.move_child(hint, at + 2)
	_on_launch(_graph.launch)
	_graph.call_deferred("grab_focus")

func _on_launch(h: float) -> void:
	App.save.launchHour = h
	App.persist()
	_sea.apply_hour(h - 0.5)
	_refresh_head()
	if _verdict:
		var fog_line := Fog.plan_line(_leg, h)
		_verdict.text = Tides.verdict_line(_day, h, Leg.hours_at_touring_pace(_leg), str(_leg.get("favours", "flood"))) + ("\n" + fog_line if fog_line != "" else "")

func _refresh_head() -> void:
	var h := Leg.launch_hour()
	_head.text = "Day %d · %s · %.1f km · about %.0f h at %.0f kn · launch %s on the %s · %s" % [Leg.index() + 1, _leg.get("title", "The leg"), Leg.length_m(_leg) / 1000.0, Leg.hours_at_touring_pace(_leg), Leg.TOURING_KNOTS, Leg.clock(h), Tides.describe(_day, h), str(App.chosen_day().get("label", "")).to_lower()]

func _process(_d: float) -> void:
	_labels.update(_cam)
