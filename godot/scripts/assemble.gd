## The boat goes together on the beach at Friday Harbor, off the ferry: unroll the skin, snap the
## frame, slide it in bow first, seat the coaming, fit the seat, tension the jacks, check. Tap steps
## are a tap; the jacks are a hold, and the hold has a right length — let go early and the hull is
## slack, hang on and it is forced. The boat you build is the boat you paddle: its quality is kept
## in the save and the kayak tracks by it.
extends Node3D

var _terrain: Terrain
var _sea: Seascape
var _ui: VBoxContainer
var _card: PanelContainer
var _steps: Array = []
var _i := 0
var _results: Dictionary = {}
var _retry := false
var _skin: MeshInstance3D
var _skin_mat: StandardMaterial3D
var _frame: FrameModel
var _coaming: MeshInstance3D
var _seat: MeshInstance3D
var _boat: Node3D
var _title: Label
var _bar: ProgressBar
var _hold_btn: Button
var _rush_btn: Button
var _holding := false
var _held := 0.0
var _done := false
var _frame_t := 0.0     # 0 beside the skin .. 1 inside it
var _tension := 0.0     # 0 flat on the beach .. 1 tight

func _ready() -> void:
	_steps = App.content.get("assemblySteps", [])
	_terrain = Terrain.new()
	add_child(_terrain)
	var cove: Vector3 = _terrain.place("fridayHarbor") + Vector3(420.0, 0.0, -700.0)
	_terrain.focus = cove
	_sea = Seascape.new()
	_sea.sea_state = 0.06
	_sea.hour = 10.5
	_sea.terrain = _terrain
	add_child(_sea)
	move_child(_sea, 0)
	var found := _shore_point(cove)
	var shore: Vector3 = found.point
	var inland: Vector3 = found.dir
	var along := Vector3(-inland.z, 0.0, inland.x)
	var boat_at := shore + inland * 2.6 + along * 1.0
	_boat = Node3D.new()
	_boat.position = Vector3(boat_at.x, maxf(_terrain.height_at(boat_at.x, boat_at.z), 0.3) + 0.2, boat_at.z)
	_boat.rotation.y = atan2(-along.x, -along.z) + deg_to_rad(12.0)
	add_child(_boat)
	var sk := App.skin()
	_skin = MeshInstance3D.new()
	_skin.mesh = Hull.build_mesh(Color(sk.deck), Color(sk.hull), Color(sk.panel) if sk.panel else Color(sk.deck))
	_skin_mat = StandardMaterial3D.new()
	_skin_mat.vertex_color_use_as_albedo = true
	_skin_mat.roughness = 0.55
	_skin_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_skin_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	_skin.material_override = _skin_mat
	_skin.rotation.y = PI / 2.0  # the hull model points its bow along +x; the frame and the beach use -z
	_boat.add_child(_skin)
	_frame = FrameModel.new()
	_boat.add_child(_frame)
	_coaming = MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.27
	torus.outer_radius = 0.31
	torus.rings = 24
	_coaming.mesh = torus
	_coaming.scale = Vector3(1.0, 1.0, 1.5)
	_coaming.position = Vector3(0.0, Hull.heights(Hull.COCKPIT_S).ridge + 0.01, 0.0)
	var cm := StandardMaterial3D.new()
	cm.albedo_color = Color("1c1e21")
	_coaming.material_override = cm
	_boat.add_child(_coaming)
	_seat = MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(0.36, 0.08, 0.4)
	_seat.mesh = bm
	_seat.position = Vector3(0.0, Hull.heights(Hull.COCKPIT_S).keel + 0.09, 0.08)
	var sm := StandardMaterial3D.new()
	sm.albedo_color = Color("3b3f45")
	_seat.material_override = sm
	_boat.add_child(_seat)
	var pivot := Node3D.new()
	pivot.position = shore
	add_child(pivot)
	_sea.follow = pivot
	var cam := Camera3D.new()
	cam.fov = 48.0
	cam.near = 0.2
	cam.far = 30000.0
	add_child(cam)
	# From up the beach, close in and a little high, looking down at the boat with the water's edge
	# just beyond it and the harbour behind.
	var vp := get_viewport().get_visible_rect().size
	if vp.x < vp.y:
		# A portrait phone: straight up the beach from the boat, higher, looking down on it so the
		# whole boat and the frame beside it sit mid-frame above the card.
		cam.fov = 62.0
		cam.global_position = _boat.position + inland * 9.0 + along * 0.6 + Vector3.UP * 6.5
		cam.look_at(_boat.position + along * 0.4, Vector3.UP)
	else:
		cam.global_position = _boat.position + inland * 5.0 + along * 2.6 + Vector3.UP * 2.9
		cam.look_at(_boat.position - inland * 0.8 + Vector3.UP * 0.1, Vector3.UP)
	cam.current = true
	var ui := CanvasLayer.new()
	add_child(ui)
	_ui = UIKit.page(ui, 48, 24)
	_ui.add_child(UIKit.kicker("On the beach · Friday Harbor"))
	_title = UIKit.label("Assemble your kayak", 22, UIKit.FOAM, true, true)
	_ui.add_child(_title)
	_ui.add_child(UIKit.spacer())
	var at := App._url_param("step")  # `?scene=assemble&step=5` opens on a step, for checks
	if at != "":
		_i = clampi(int(at), 0, _steps.size())
		for k in range(_i):
			_results[_steps[k].id] = 1.0
	_apply_stage(1.0)
	_show()

## From the cove's point, the nearest place the land comes up out of the water, and the direction
## inland there: {point, dir}.
func _shore_point(cove: Vector3) -> Dictionary:
	var best_d := INF
	var best := { "point": cove + Vector3(0, 0.6, 0), "dir": Vector3(0, 0, 1) }
	for k in range(16):
		var dir := Vector3(sin(k * TAU / 16.0), 0.0, cos(k * TAU / 16.0))
		for i in range(1, 160):
			var p := cove + dir * (i * 8.0)
			if _terrain.is_land(p.x, p.z) and _terrain.height_at(p.x, p.z) > 0.5:
				if i * 8.0 < best_d:
					best_d = i * 8.0
					best = { "point": Vector3(p.x, _terrain.height_at(p.x, p.z), p.z), "dir": dir }
				break
	return best

## What the boat looks like at the current step, settled in instantly (snap) or eased by _process.
func _apply_stage(snap := 0.0) -> void:
	var stage := _i
	var skin_on := stage >= 1          # unrolled
	var frame_on := stage >= 2         # snapped together
	var want_in := 1.0 if stage >= 3 else 0.0
	var want_t := 0.0
	if stage >= 6:
		want_t = 0.5
	if stage >= 7:
		want_t = 0.85
	if stage >= 8:
		want_t = 1.0
	if snap > 0.0:
		_frame_t = want_in
		_tension = want_t
	else:
		_frame_t = move_toward(_frame_t, want_in, 0.02)
		_tension = move_toward(_tension, want_t, 0.015)
	_skin.visible = skin_on
	_skin_mat.albedo_color = Color(1, 1, 1, lerpf(0.55, 1.0, _tension))
	_skin.scale = Vector3(1.0, lerpf(0.22, 1.0, maxf(_tension, 0.35 * _frame_t)), 1.0)
	_frame.visible = frame_on and (_tension < 0.97 or _frame_t < 1.0)  # inside a tight skin the frame is out of sight
	_skin_mat.transparency = BaseMaterial3D.TRANSPARENCY_DISABLED if _tension >= 0.97 else BaseMaterial3D.TRANSPARENCY_ALPHA
	_frame.position = Vector3(lerpf(1.4, 0.0, _frame_t), lerpf(0.1, 0.0, _frame_t), lerpf(-2.0, 0.0, _frame_t))
	_coaming.visible = stage >= 4
	_seat.visible = stage >= 5

func _process(delta: float) -> void:
	if not _done:
		_apply_stage()
	if _holding:
		_held += delta
		_bar.value = clampf(_held / Assembly.NEEDED_HOLD, 0.0, 1.3) * 100.0
		_bar.modulate = Color(UIKit.SUN) if _held >= Assembly.NEEDED_HOLD * 0.8 and _held <= Assembly.NEEDED_HOLD * 1.25 else Color(1, 1, 1)

func _lesson(id: String) -> Dictionary:
	for l in App.content.get("lessons", []):
		if l.id == id:
			return l
	return { "title": id, "text": "", "sourceIds": [] }

func _show() -> void:
	if _card:
		_card.queue_free()
		_card = null
	if _i >= _steps.size():
		_finish()
		return
	var s: Dictionary = _steps[_i]
	var hold := Assembly.is_hold(s)
	var body := str(s.label)
	if _retry:
		body += "\nNot quite — once more."
	var lesson_id := "kayakHeritage" if s.id == "insert" else ("hullJacks" if s.id == "jackSides" else "")
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	if lesson_id != "" and not _retry:
		var l := _lesson(lesson_id)
		v.add_child(UIKit.label(str(l.title), 13, UIKit.SUN, true, true))
		v.add_child(UIKit.label(str(l.text), 12, UIKit.MIST))
		v.add_child(UIKit.label(App.sources_line(l.get("sourceIds", [])), 11, UIKit.MIST))
	_bar = ProgressBar.new()
	_bar.custom_minimum_size = Vector2(0, 8)
	_bar.show_percentage = false
	_bar.value = 0.0
	_bar.visible = hold
	v.add_child(_bar)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	_hold_btn = UIKit.button("Hold to tension · let go when it is tight" if hold else "Do it")
	_hold_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if hold:
		_hold_btn.button_down.connect(_hold_start)
		_hold_btn.button_up.connect(_hold_end)
	else:
		_hold_btn.pressed.connect(func() -> void: _record(1.0))
	row.add_child(_hold_btn)
	if hold or s.id == "check":
		_rush_btn = UIKit.button("Rush it", false)
		_rush_btn.pressed.connect(func() -> void: _record(Assembly.RUSHED, true))
		row.add_child(_rush_btn)
	v.add_child(row)
	_card = UIKit.card("%d. %s" % [_i + 1, body], "", "", [], "Step %d of %d" % [_i + 1, _steps.size()])
	var col: VBoxContainer = _card.get_child(0)
	col.add_child(v)
	_ui.add_child(_card)
	_hold_btn.call_deferred("grab_focus")

func _hold_start() -> void:
	_holding = true
	_held = 0.0

func _hold_end() -> void:
	if not _holding:
		return
	_holding = false
	_record(Assembly.hold_quality(_held))

## A step's result: under the bar it is asked once more (the better of the two counts), a rush is
## recorded as such, and the frame goes on.
func _record(q: float, rushed := false) -> void:
	var s: Dictionary = _steps[_i]
	_results[s.id] = maxf(float(_results.get(s.id, 0.0)), q)
	if q < Assembly.PASS and not _retry and not rushed:
		_retry = true
		Sound.hull_slap(0.3)
		_show()
		return
	_retry = false
	Sound.dip(0.5 if q >= Assembly.PASS else 0.25)
	_i += 1
	_show()

func _finish() -> void:
	_done = true
	_apply_stage(1.0)
	var q := Assembly.quality(_results, _steps)
	App.save.assembly = q
	App.persist()
	_card = UIKit.card("Assembled", Assembly.verdict(q), App.sources_line(["trak", "paddlingmag"]), [["Kayak School", func() -> void: App.next(), true]], "On the beach · about twelve minutes")
	_ui.add_child(_card)
