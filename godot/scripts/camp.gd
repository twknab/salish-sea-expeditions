## Camp on Jones Island: the boat is up the beach, the evening comes on while you make camp, and
## each step — above the tide, the pad, the raccoons, drying out, the night — is a card. Then
## tomorrow's float plan, which for now returns you to the title with the day saved.
extends Node3D

var _terrain: Terrain
var _sea: Seascape
var _ui: VBoxContainer
var _card: PanelContainer
var _kayak: Kayak
var _step := 0
var _steps: Array = []
var _hour0 := 17.5         # when the boat came up the beach: the leg's arrival, held to the evening
var _hour := 17.5
var _hour_target := 17.5
var _shore := Vector3.ZERO
var _inland := Vector3.FORWARD
var _along := Vector3.RIGHT
var _tent: MeshInstance3D
var _leg: Dictionary = {}

func _ready() -> void:
	_hour0 = clampf(float(App.save.get("arrivedHour", 17.5)), 15.5, 19.0)
	_hour = _hour0
	_hour_target = _hour0
	_terrain = Terrain.new()
	add_child(_terrain)
	_leg = Leg.current()
	var cove := Leg.cove(_leg)
	_terrain.focus = cove
	_sea = Seascape.new()
	_sea.sea_state = 0.08
	_sea.hour = _hour
	_sea.terrain = _terrain
	add_child(_sea)
	move_child(_sea, 0)
	# The beach: the nearest shore to the cove's point, and which way the land lies from the water.
	var found := _shore_point(cove)
	var shore: Vector3 = found.point
	var inland: Vector3 = found.dir
	var along := Vector3(-inland.z, 0.0, inland.x)
	_kayak = Kayak.new()
	_kayak.freeze = true
	var sk := App.skin()
	_kayak.deck_color = Color(sk.deck)
	_kayak.panel_color = Color(sk.panel) if sk.panel else Color(sk.deck)
	_kayak.hull_color = Color(sk.hull)
	_kayak.build_hull()
	# The boat lies along the beach just above the water line, bow up the beach a little.
	var boat_at := shore + inland * 1.6 + along * 2.0
	_inland = inland
	_along = along
	_shore = shore
	_kayak.position = Vector3(boat_at.x, maxf(_terrain.height_at(boat_at.x, boat_at.z), 0.3) + 0.25, boat_at.z)
	_kayak.rotation = Vector3(0.0, atan2(-along.x, -along.z) + deg_to_rad(20.0), deg_to_rad(8.0))
	add_child(_kayak)
	var pivot := Node3D.new()
	pivot.position = shore
	add_child(pivot)
	_sea.follow = pivot
	# The camera stands at the water's edge looking up the beach, the cove behind it.
	var cam := Camera3D.new()
	cam.fov = 55.0
	cam.near = 0.2
	cam.far = 30000.0
	add_child(cam)
	# From out on the cove, a little high, looking in at the beach: water in the foreground, the boat
	# at the tide line, the pad and the trees above.
	cam.global_position = Vector3(shore.x, 0.0, shore.z) - inland * 20.0 + along * 7.0 + Vector3.UP * 5.5
	cam.look_at(shore + inland * 4.0 + Vector3.UP * 1.0, Vector3.UP)
	cam.current = true
	var ui := CanvasLayer.new()
	add_child(ui)
	_ui = UIKit.page(ui, 48, 24)
	_ui.add_child(UIKit.spacer())
	_steps = _leg.get("camp", {}).get("steps", [])
	_show()

## From the cove's point, the nearest place the land comes up out of the water, and the direction
## inland there: {point, dir}.
func _shore_point(cove: Vector3) -> Dictionary:
	var best_d := INF
	var best := { "point": cove + Vector3(0, 0.6, 0), "dir": Vector3(0, 0, 1) }
	for k in range(16):
		var dir := Vector3(sin(k * TAU / 16.0), 0.0, cos(k * TAU / 16.0))
		for i in range(1, 60):
			var p := cove + dir * (i * 8.0)
			if _terrain.height_at(p.x, p.z) > 0.5:
				if i * 8.0 < best_d:
					best_d = i * 8.0
					best = { "point": Vector3(p.x, _terrain.height_at(p.x, p.z), p.z), "dir": dir }
				break
	return best

## The tent goes up on the pad once that step is reached, and stays.
func _pitch() -> void:
	if _tent:
		return
	_tent = MeshInstance3D.new()
	var pm := PrismMesh.new()
	pm.size = Vector3(2.3, 1.25, 2.7)
	_tent.mesh = pm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("d9893a")
	mat.roughness = 0.9
	_tent.material_override = mat
	var at := _shore + _inland * 9.0 - along_or_zero() * 4.0
	_tent.position = Vector3(at.x, maxf(_terrain.height_at(at.x, at.z), 0.5) + 0.62, at.z)
	_tent.rotation.y = atan2(_along.x, _along.z)
	add_child(_tent)

func along_or_zero() -> Vector3:
	return _along

func _show() -> void:
	if _card:
		_card.queue_free()
	if _step >= 1:
		_pitch()
	var actions: Array = []
	if _step > 0:
		actions.append(["Back", func() -> void: _step -= 1; _hour_target = _hour0 + 1.1 * _step; _show(), false])
	if _step < _steps.size() - 1:
		actions.append(["Next", func() -> void: _step += 1; _hour_target = _hour0 + 1.1 * _step; _show(), true])
	else:
		actions.append(["The expedition ends · home" if Leg.is_last() else "Tomorrow’s float plan", func() -> void: App.advance_leg(), true])
	var s: Dictionary = _steps[_step] if _step < _steps.size() else { "title": "Camp", "text": "", "sourceIds": [] }
	_card = UIKit.card(s.get("title", ""), s.get("text", ""), App.sources_line(s.get("sourceIds", [])), actions, "%s · %s · %d of %d" % [_leg.get("camp", {}).get("name", "Camp"), Leg.clock(_hour), _step + 1, _steps.size()])
	_ui.add_child(_card)

func _process(delta: float) -> void:
	if absf(_hour - _hour_target) > 0.005:
		_hour = lerpf(_hour, _hour_target, minf(1.0, delta * 1.5))
		_sea.apply_hour(_hour)
