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

func _ready() -> void:
	_terrain = Terrain.new()
	_terrain.trees_enabled = false
	_terrain.near = 1500.0
	add_child(_terrain)
	_sea = Seascape.new()
	_sea.sea_state = 0.12
	_sea.hour = Leg.LAUNCH_HOUR - 0.5
	_sea.fog_density = 0.00003
	_sea.terrain = _terrain
	add_child(_sea)
	move_child(_sea, 0)
	var a := Leg.WAYPOINTS[0]
	var b := Leg.WAYPOINTS[Leg.WAYPOINTS.size() - 1]
	var mid := (a + b) * 0.5
	_terrain.focus = mid
	_sea.follow = _terrain  # the water sits still under the chart; the terrain node is at the origin
	_cam = Camera3D.new()
	_cam.fov = 44.0
	_cam.near = 60.0
	_cam.far = 40000.0
	add_child(_cam)
	# From the south-east, high enough to hold the whole leg with the camp at the top of the frame.
	_cam.global_position = mid + Vector3(2600.0, 5200.0, 4200.0)
	_cam.look_at(mid + Vector3(0, 0, -600.0), Vector3.UP)
	_cam.current = true
	var pts := PackedVector3Array()
	for w in Leg.WAYPOINTS:
		pts.append(w)
	add_child(ChartRibbon.build(pts, Color(UIKit.SUN, 0.9)))
	var ui := CanvasLayer.new()
	add_child(ui)
	_labels = PlaceLabels.new()
	_labels.reach = 30000.0
	ui.add_child(_labels)
	for id in ["fridayHarbor", "labs", "yellow", "jones", "shaw", "spieden", "orcas"]:
		var w := _terrain.place(id)
		var nm: String = id
		for p in _terrain.meta.get("places", []):
			if p.id == id:
				nm = p.name
		_labels.add_place(id, nm, Vector3(w.x, maxf(_terrain.height_at(w.x, w.z), 0.0) + 30.0, w.z))
	_ui = UIKit.page(ui, 48, 24)
	var plan: Dictionary = App.content.get("floatPlan", {})
	_steps = plan.get("steps", [])
	var day: Dictionary = App.content.get("tripDay", {})
	var head := UIKit.label("%s · %.1f km · about %.0f h at %.0f kn · launch %s on the %s" % [plan.get("title", "The leg"), Leg.length_m() / 1000.0, Leg.hours_at_touring_pace(), Leg.TOURING_KNOTS, Leg.clock(Leg.LAUNCH_HOUR), Tides.describe(day, Leg.LAUNCH_HOUR)], 13, UIKit.FOAM, true, true)
	var frame := PanelContainer.new()
	frame.add_theme_stylebox_override("panel", UIKit.panel_style(0.45, 16))
	frame.add_child(head)
	_ui.add_child(frame)
	_ui.add_child(UIKit.spacer())
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
	_card = UIKit.card(s.get("title", ""), s.get("text", ""), App.sources_line(s.get("sourceIds", [])), actions, "Float plan · %d of %d" % [_step + 1, _steps.size()])
	_ui.add_child(_card)

func _process(_d: float) -> void:
	_labels.update(_cam)
