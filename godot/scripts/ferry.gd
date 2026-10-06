## The crossing from Anacortes: you stand at the bow rail of the island ferry with your kayak in
## its bag below, and the islands come past — each one named and introduced as it comes abeam.
## There is no skipping it: the ferry is how a folding kayak reaches the islands, and the crossing
## is where the route is first learned. "Lean on the rail" only lets the time pass faster.
extends Node3D

const SPEED := 22.0
const LANDING_Z := -2300.0

var _ferry: FerryModel
var _sea: Seascape
var _ui: VBoxContainer
var _card: PanelContainer
var _spots: Array = []
var _seen := {}
var _rate := 1.0
var _t := 0.0
var _arrived := false
var _counter: Label

func _ready() -> void:
	_ferry = FerryModel.new()
	add_child(_ferry)
	_sea = Seascape.new()
	_sea.sea_state = 0.3
	_sea.hour = 7.5
	_sea.follow = _ferry
	_sea.island_center = Vector3(0, 0, -99999)
	add_child(_sea)
	move_child(_sea, 0)
	var cam := Camera3D.new()
	cam.fov = 62.0
	cam.near = 0.3
	cam.far = 3000.0
	# Between the forward wheelhouse (ends 0.3 L from midships) and the bow rail (0.36 L), on the sun deck.
	cam.position = Vector3(-2.0, 12.7, -FerryModel.LENGTH * 0.36 + 1.6)
	cam.rotation = Vector3(deg_to_rad(-16.0), 0.0, 0.0)
	_ferry.add_child(cam)
	# The islands, placed along the run (not to chart scale — the order and the sides are right).
	_spots = [
		{ "id": "anacortes", "z": 0.0, "x": 0.0, "r": 0.0 },
		{ "id": "shaw", "z": -700.0, "x": -330.0, "r": 190.0, "seed": 11 },
		{ "id": "yellow", "z": -1150.0, "x": 240.0, "r": 45.0, "seed": 5 },
		{ "id": "labs", "z": -1750.0, "x": 300.0, "r": 150.0, "seed": 9 },
		{ "id": "fridayHarbor", "z": -2250.0, "x": -120.0, "r": 260.0, "seed": 13 },
	]
	for s in _spots:
		if s.r > 0.0:
			var isl := Island.new()
			isl.radius = s.r
			isl.seed = s.seed
			isl.position = Vector3(s.x, 0, s.z)
			add_child(isl)
			var lab := Label3D.new()
			lab.text = _place(s.id).get("name", s.id)
			lab.font_size = 96
			lab.pixel_size = 0.03
			lab.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			lab.modulate = UIKit.FOAM
			lab.outline_size = 12
			lab.position = Vector3(s.x, 34.0 + s.r * 0.12, s.z)
			lab.no_depth_test = true
			add_child(lab)
	var ui := CanvasLayer.new()
	add_child(ui)
	_ui = UIKit.page(ui, 48, 24)
	_counter = UIKit.label("", 12, UIKit.MIST)
	_counter.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	Sound.horn()
	_show_card("Walk-on with a folding kayak", "Your kayak is packed in its travel bag — it rides the ferry as luggage. No car, no roof rack: the islands are open to you on foot. Watch the islands go by; each one is named as it comes abeam.", App.sources_line(["wsf", "trak"]), "Anacortes · the crossing", true)

func _place(id: String) -> Dictionary:
	for p in App.content.get("places", []):
		if p.id == id:
			return p
	return {}

func _show_card(title: String, text: String, source: String, kicker: String, with_rail := false) -> void:
	for ch in _ui.get_children():
		ch.queue_free()
	var actions: Array = []
	if _arrived:
		actions.append(["Walk off in Friday Harbor", func() -> void: App.next(), true])
	else:
		actions.append(["Lean on the rail" if _rate < 2.0 else "Watch the water", func() -> void: _rate = 3.0 if _rate < 2.0 else 1.0; _show_card(title, text, source, kicker), false])
	_card = UIKit.card(title, text, source, actions, kicker)
	_ui.add_child(_counter)
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

func _process(delta: float) -> void:
	var dt := delta * _rate
	_t += dt
	if not _arrived:
		_ferry.position.z -= SPEED * dt
	_ferry.rotation.z = sin(_t * 0.5) * 0.006
	_ferry.rotation.x = sin(_t * 0.37 + 1.0) * 0.004
	_ferry.position.y = 0.2 + sin(_t * 0.45) * 0.08
	for s in _spots:
		if s.r > 0.0 and not _seen.has(s.id) and _ferry.position.z < s.z + 260.0:
			_seen[s.id] = true
			var p := _place(s.id)
			_show_card(p.get("name", s.id), p.get("text", ""), App.sources_line(p.get("sourceIds", [])), "Abeam · %d of %d islands" % [_seen.size(), 4])
	_counter.text = "%d of 4 islands spotted · %.1f km to Friday Harbor" % [_seen.size(), maxf(0.0, (_ferry.position.z - LANDING_Z) / 1000.0)]
	if not _arrived and _ferry.position.z <= LANDING_Z:
		_arrived = true
		_rate = 1.0
		Sound.horn()
		var p := _place("fridayHarbor")
		_show_card("Friday Harbor", "The ferry backs into the slip. Wheel your kayak bag down the ramp: the beach where you will build it is a short walk along the waterfront.", App.sources_line(p.get("sourceIds", ["wsf"])), "Arrival")
