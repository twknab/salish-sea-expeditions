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
var _walk := -1            # index into the shore walk, -1 when not walking
var _walked := false
var _cam: Camera3D
var _glows := 0            # bioluminescence sparked tonight, for the night card's own line
var _day: Dictionary = {}  # the authored day, for the night's high water
var _spot := "edge"        # where the boat sleeps: HaulOut.SPOTS
var _food := "hung"        # where the food sleeps: FoodStore.SPOTS
var _water := "ration"     # the water on Posey: WaterPlan.SPOTS
var _spot_row: BoxContainer

func _ready() -> void:
	_hour0 = clampf(float(App.save.get("arrivedHour", 17.5)), 15.5, 19.0)
	_hour = _hour0
	_hour_target = _hour0
	_terrain = Terrain.new()
	add_child(_terrain)
	_leg = Leg.current()
	_day = App.day()
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
	_kayak.set_paddler_visible(false)  # the boat is empty on the beach; its paddler is making camp
	var boat_param := App._url_param("boat")  # `?scene=camp&boat=grass` leaves the boat there, for checks
	_spot = boat_param if boat_param != "" else str(App.save.get("haulout", "edge"))
	var food_param := App._url_param("food")  # `?scene=camp&food=tent&step=4`: the raccoons' night, for checks
	_food = food_param if food_param != "" else str(App.save.get("foodStore", "hung"))
	var water_param := App._url_param("water")  # `?scene=camp&leg=1&step=1&water=fill`, for checks
	_water = water_param if water_param != "" else str(App.save.get("waterPlan", "ration"))
	_place_boat()
	var pivot := Node3D.new()
	pivot.position = shore
	add_child(pivot)
	_sea.follow = pivot
	# The camera stands at the water's edge looking up the beach, the cove behind it.
	var cam := Camera3D.new()
	_cam = cam
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
	var step_param := App._url_param("step")  # `?scene=camp&step=4` opens on a card, for checks
	if step_param != "":
		_step = clampi(int(step_param), 0, maxi(_steps.size() - 1, 0))
		_hour_target = _night_hour() if _step == _steps.size() - 1 else _hour0 + 1.1 * _step
		_hour = _hour_target
		_sea.apply_hour(_hour)
		if App._url_param("glow") == "1":  # a burst every second and a half, for the screenshot
			var t := Timer.new()
			t.wait_time = 1.5
			t.timeout.connect(func() -> void: _glow(_shore - _inland * 7.0 + _along * randf_range(-3.0, 4.0)))
			add_child(t)
			t.start()
	if App._url_param("walk") == "1":  # `?scene=camp&walk=1` opens on the shore, for checks
		_step = 1
		_pitch()
		_walk = 0
		_show_walk()
		return
	_show()

## The boat goes where it was carried: the water's edge, the wrack line, or the grass. On the night
## card a boat the tide found is back in the shallows, as it was found.
func _place_boat() -> void:
	var is_camp := str(_leg.get("camp", {}).get("kind", "camp")) != "takeout"
	var up := 1.6
	match _spot:
		"wrack":
			up = 5.0
		"grass":
			up = 9.5
	var floated := is_camp and _step == _steps.size() - 1 and HaulOut.verdict(_spot, HaulOut.rise_m(_day, _hour0)) == "floated"
	var at := _shore + _inland * (-3.0 if floated else up) + _along * (3.5 if _spot == "grass" else 2.0)
	_kayak.position = Vector3(at.x, 0.1 if floated else maxf(_terrain.height_at(at.x, at.z), 0.3) + 0.25, at.z)
	_kayak.rotation = Vector3(0.0, atan2(-_along.x, -_along.z) + deg_to_rad(55.0 if floated else 20.0), deg_to_rad(0.0 if floated else 8.0))

## The row under a card that asks a question: the places a thing can be left, the chosen one lit.
## The first card asks where the boat sleeps; the raccoons card asks where the food does.
func _spot_choices() -> void:
	if _spot_row:
		_spot_row.queue_free()
		_spot_row = null
	if str(_leg.get("camp", {}).get("kind", "camp")) == "takeout":
		return
	var step_id := str(_steps[_step].get("id", "")) if _step < _steps.size() else ""
	if step_id == "food":
		_choice_row(FoodStore.SPOTS, _food, func(id: String) -> void: _food = id; App.save.foodStore = id; App.persist())
		return
	if step_id == "water":
		_choice_row(WaterPlan.SPOTS, _water, func(id: String) -> void: _water = id; App.save.waterPlan = id; App.persist())
		return
	if _step != 0:
		return
	_choice_row(HaulOut.SPOTS, _spot, func(id: String) -> void: _spot = id; App.save.haulout = id; App.persist(); _place_boat())

func _choice_row(spots: Array, current: String, on_pick: Callable) -> void:
	# Three across on a desktop; stacked on a phone, where three would push the card off the screen.
	_spot_row = VBoxContainer.new() if get_viewport().get_visible_rect().size.x < 600.0 else HBoxContainer.new()
	_spot_row.add_theme_constant_override("separation", 8)
	_spot_row.alignment = BoxContainer.ALIGNMENT_CENTER
	for s in spots:
		var b := UIKit.button(str(s.name), str(s.id) == current)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var id := str(s.id)
		b.pressed.connect(func() -> void: on_pick.call(id); _spot_choices())
		_spot_row.add_child(b)
	_ui.add_child(_spot_row)

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
	if _step >= 1 and str(_leg.get("camp", {}).get("kind", "camp")) != "takeout":
		_pitch()
	var actions: Array = []
	if _step > 0:
		actions.append(["Back", func() -> void: _step -= 1; _hour_target = _hour0 + 1.1 * _step; _show(), false])
	if _step >= 1 and not _walked:
		actions.append(["Look under the float" if str(_leg.get("camp", {}).get("kind", "camp")) == "takeout" else "Walk the shore", func() -> void: _walk = 0; _show_walk(), false])
	if _step < _steps.size() - 1:
		actions.append(["Next", func() -> void: _step += 1; _hour_target = _night_hour() if _step == _steps.size() - 1 else _hour0 + 1.1 * _step; _show(), true])
	else:
		actions.append(["The ferry home" if Leg.is_last() else "Tomorrow’s float plan", func() -> void: _leave(), true])
	var s: Dictionary = _steps[_step] if _step < _steps.size() else { "title": "Camp", "text": "", "sourceIds": [] }
	var body: String = s.get("text", "")
	if Leg.is_last() and _step == _steps.size() - 1:
		body += "\n\n" + _tally()
	var is_camp := str(_leg.get("camp", {}).get("kind", "camp")) != "takeout"
	if _step == 0 and is_camp:
		body += "\n\n" + HaulOut.forecast_line(_day, _hour0) + " Where does the boat sleep?"
	if str(s.get("id", "")) == "food":
		body += "\n\nWhere does the food sleep?"
	if str(s.get("id", "")) == "water":
		body += "\n\nEight litres came in the boat for two of you, and tomorrow is the long day. What happens to it?"
	if _step == _steps.size() - 1 and is_camp:
		body += "\n\n" + HaulOut.night_line(_spot, _day, _hour0)
		if _has_step("food"):
			body += " " + FoodStore.night_line(_food)
		if _has_step("water"):
			body += " " + WaterPlan.night_line(_water)
		body += "\n\nThe cove is full of bioluminescence on a warm night: tap the water to stir it."
	_place_boat()
	body += _left_behind(str(s.get("id", "")), _step == 1)
	_card = UIKit.card(s.get("title", ""), body, App.sources_line(s.get("sourceIds", [])), actions, "%s · %s · %d of %d" % [_leg.get("camp", {}).get("name", "Camp"), Leg.clock(_hour), _step + 1, _steps.size()])
	_ui.add_child(_card)
	_spot_choices()

## Leaving camp: a night out, and a camp left as found, for the record; the take-out is neither.
func _leave() -> void:
	if str(_leg.get("camp", {}).get("kind", "camp")) != "takeout":
		App.save.nights = int(App.save.get("nights", 0)) + 1
		App.save.cleanCamps = int(App.save.get("cleanCamps", 0)) + 1
		# The day's record learns where the boat slept and what the tide did about it.
		var days: Array = App.save.get("days", [])
		for d in days:
			if int(d.get("leg", -1)) == Leg.index():
				d.boatSpot = _spot
				d.boatVerdict = HaulOut.verdict(_spot, HaulOut.rise_m(_day, _hour0))
				if _has_step("food"):
					d.foodVerdict = FoodStore.verdict(_food)
				if _has_step("water"):
					d.waterVerdict = WaterPlan.verdict(_water)
					# Tomorrow feels it: the launch can be no earlier than the tap allows, and the stroke is what the water left.
					App.save.lateStart = WaterPlan.late_hours(_water)
					App.save.effort = WaterPlan.effort(_water)
		App.save.days = days
	App.advance_leg()

## What was left on the beach at Friday Harbor is felt here, on the card where it would have been
## used: the packing screen said so, and the camp keeps its word.
func _left_behind(step_id: String, first_evening: bool) -> String:
	# A save with no packing (older, or a day paddled again from the title) is the suggested layout, as on the water.
	var gear: Array = App.content.get("gear", [])
	var layout: Dictionary = Packing.empty() if App._url_param("pack") == "none" else App.save.get("packing", Packing.suggested(gear))  # `?pack=none`: nothing came, for checks
	var enables: Array = Packing.assess(layout, gear).get("enables", [])
	var lines: Array[String] = []
	if first_evening and not enables.has("light"):
		lines.append("No headlamp: the evening chores take twice as long in the dark.")
	match step_id:
		"pitch", "land":
			if not enables.has("shelter"):
				lines.append("No tent came in the boat: the tarp goes over the paddles and the night is a long one.")
		"food":
			if not enables.has("dinner"):
				lines.append("No food or stove came in the boat: a cold supper from the day bag, and a hungry morning.")
		"water":
			if not enables.has("hydration"):
				lines.append("No water came in the boat, and this island has none: tomorrow starts with the crossing to Roche Harbor to fill up.")
		"dry":
			if not enables.has("warmth"):
				lines.append("No warm layers: you sit in the wet ones, and the cold has the evening.")
		"night":
			if not enables.has("sleep"):
				lines.append("No sleeping bag: a night in every layer you own, awake for most of it.")
	return "" if lines.is_empty() else "\n\n" + "\n".join(lines)

func _has_step(id: String) -> bool:
	for s in _steps:
		if str(s.get("id", "")) == id:
			return true
	return false

## The last card is the night: late enough for full dark, whatever hour the boat came in.
func _night_hour() -> float:
	return maxf(_hour0 + 1.1 * (_steps.size() - 1), _sea.sunset + 1.6)

## A hand, a paddle or a tap in the cove at night: the dinoflagellates light where the water moves.
func _glow(at: Vector3) -> void:
	_glows += 1
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.9
	p.amount = 70
	p.lifetime = 1.6
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 1.6
	p.direction = Vector3(0, 0, 0)
	p.spread = 180.0
	p.initial_velocity_min = 0.2
	p.initial_velocity_max = 1.2
	p.gravity = Vector3.ZERO
	p.scale_amount_min = 0.05
	p.scale_amount_max = 0.16
	var ramp := Gradient.new()
	ramp.set_color(0, Color(0.6, 1.0, 1.0, 0.7))
	ramp.set_color(1, Color(0.2, 0.7, 1.0, 0.0))
	p.color_ramp = ramp
	var sm := SphereMesh.new()
	sm.radius = 1.0
	sm.height = 2.0
	sm.radial_segments = 6
	sm.rings = 3
	p.mesh = sm
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.vertex_color_use_as_albedo = true
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.emission_enabled = true
	mat.emission = Color(0.4, 0.9, 1.0)
	mat.emission_energy_multiplier = 2.0
	p.material_override = mat
	p.position = Vector3(at.x, 0.05, at.z)
	add_child(p)
	p.emitting = true
	p.finished.connect(p.queue_free)
	Sound.dip(0.3)

func _unhandled_input(ev: InputEvent) -> void:
	var tap: bool = (ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed) or (ev is InputEventScreenTouch and ev.pressed)
	if not tap or _cam == null or _sea.night < 0.5 or _step != _steps.size() - 1:
		return
	var from := _cam.project_ray_origin(ev.position)
	var dir := _cam.project_ray_normal(ev.position)
	var hit = Plane(Vector3.UP, 0.0).intersects_ray(from, dir)
	if hit != null and _terrain.height_at(hit.x, hit.z) < 0.0:
		_glow(hit)

func _process(delta: float) -> void:
	if absf(_hour - _hour_target) > 0.005:
		_hour = lerpf(_hour, _hour_target, minf(1.0, delta * 1.5))
		_sea.apply_hour(_hour)

## The shore at the evening low tide: what the field guide says lives on this beach, in the order
## you meet it walking down from the trees to the water. Each one met is kept in the save.
func _show_walk() -> void:
	if _card:
		_card.queue_free()
	var shore: Array = _leg.get("shore", [])
	if _walk >= shore.size():
		_walk = -1
		_walked = true
		_hour_target += 0.5
		_show()
		return
	var sp := _species(str(shore[_walk]))
	var seen: Array = App.save.get("seen", [])
	if not sp.is_empty() and not seen.has(sp.id):
		seen.append(sp.id)
		App.save.seen = seen
		App.persist()
	var text: String = sp.get("blurb", "")
	var facts: Array = sp.get("facts", [])
	if not facts.is_empty():
		text += "\n\n" + str(facts[0])
	var where: String = sp.get("where", "")
	if where != "":
		text += "\n\n%s." % where
	var last := _walk >= shore.size() - 1
	var actions: Array = [["Back to camp" if last else "Next", func() -> void: _walk += 1; _show_walk(), true]]
	_card = UIKit.card(sp.get("common", "On the shore"), text, App.sources_line(sp.get("sourceIds", [])), actions, "The shore at low tide · %s · %d of %d" % [Leg.clock(_hour), _walk + 1, shore.size()])
	_ui.add_child(_card)

func _species(id: String) -> Dictionary:
	for sp in App.content.get("species", []):
		if sp.id == id:
			return sp
	return {}

## The expedition in numbers, for the last card: days, distance, what was met, how often you swam.
func _tally() -> String:
	var km := 0.0
	for l in Leg.all():
		km += Leg.length_m(l)
	var seen: Array = App.save.get("seen", [])
	var swims := 0
	for d in App.save.get("days", []):  # this expedition's swims, from its record, not a lifetime count
		swims += int(d.get("swims", 0))
	var swim_line := "and never went in" if swims == 0 else ("and went in once" if swims == 1 else "and went in %d times" % swims)
	return "%d days, %.0f km by paddle, %d of the field guide met along the way, %s." % [Leg.all().size(), km / 1000.0, seen.size(), swim_line]
