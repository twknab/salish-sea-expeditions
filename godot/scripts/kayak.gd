## The kayak on the water: a rigid body floated by seven buoyancy probes that read the same Gerstner
## field the sea shader draws, driven by stroke impulses graded for torso rotation, edged by a roll
## torque that the chine probes resist, and slowed by a hull that resists sideways motion far more
## than forward motion (that is what a keel line is).
class_name Kayak
extends RigidBody3D

signal stroke_done(side: int, q: float, kind: String)

@export var deck_color := Color("1b1e21")
@export var hull_color := Color("f0f1ee")
@export var panel_color := Color("2d9be0")
@export var rocker := 0.4

var sea_time := 0.0
var sea_state := 0.3
var edge := 0.0          # -1 port .. 1 starboard, from the hips bar
var speed := 0.0         # m/s through the water, for the HUD
var heading := 0.0       # radians, 0 = north (-z)
var strokes_good := 0
var strokes_arm := 0

const SETTLE := 0.1
var _probes: Array[Vector3] = []
var _paddler: Paddler
var _hull_mesh: MeshInstance3D

func debug_line() -> String:
	return "kayak pos=%s aabb=%s vis=%s" % [global_position, _hull_mesh.get_aabb().size, _hull_mesh.is_visible_in_tree()]

func _ready() -> void:
	mass = 100.0
	linear_damp = 0.35
	angular_damp = 2.5
	can_sleep = false
	var mesh := MeshInstance3D.new()
	mesh.mesh = Hull.build_mesh(deck_color, hull_color, panel_color)
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.vertex_color_is_srgb = true
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.roughness = 0.35
	mat.metallic = 0.0
	mat.specular = 0.55
	mesh.material_override = mat
	# The hull model points its bow along +x; the body's forward is -z, so turn the model.
	mesh.rotation.y = PI / 2.0
	add_child(mesh)
	_hull_mesh = mesh
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(Hull.B, 0.3, Hull.L * 0.96)
	shape.shape = box
	shape.position.y = 0.05
	add_child(shape)
	for s in [0.1, 0.3, 0.5, 0.7, 0.9]:
		var h := Hull.heights(s)
		_probes.append(Vector3(0.0, h.keel, -Hull.x_at(s)))
	var hc := Hull.heights(0.45)
	for side in [-1.0, 1.0]:
		_probes.append(Vector3(side * Hull.half_beam(0.45) * 0.8, hc.chine, -Hull.x_at(0.45)))
	_paddler = Paddler.new()
	_paddler.position = Vector3(0.0, 0.16, 0.0)
	add_child(_paddler)

func _physics_process(delta: float) -> void:
	var share := mass * 9.81 / _probes.size()
	for p in _probes:
		var wp := global_transform * p
		var wy := Waves.height(wp.x, wp.z, sea_time, sea_state)
		var depth := wy - wp.y
		var f := StrokeMath.buoyancy(depth, share, SETTLE)
		if f > 0.0:
			var at := wp - global_position
			var vel := linear_velocity + angular_velocity.cross(at)
			f -= vel.y * share * 0.9  # water damps vertical motion at the probe
			apply_force(Vector3.UP * maxf(f, 0.0), at)
	# Hull drag: a keel line resists sideways slip, the fine ends let it run forward.
	var fwd := -global_basis.z
	var right := global_basis.x
	var v := linear_velocity
	var v_f := v.dot(fwd)
	var v_s := v.dot(right)
	apply_central_force(-right * v_s * mass * 2.2)
	apply_central_force(-fwd * v_f * absf(v_f) * mass * 0.12)
	# Edging: a knee lift rolls the boat; the chine probes bring it back when the knee relaxes.
	apply_torque(fwd * edge * 38.0 - fwd * angular_velocity.dot(fwd) * 30.0)
	speed = v_f
	heading = atan2(fwd.x, -fwd.z)
	if _paddler:
		_paddler.advance(delta, edge)

## A forward stroke on one side. q is rotation quality 0..1.
func stroke(side: int, q: float) -> void:
	var fwd := -global_basis.z
	var gain := StrokeMath.stroke_speed_gain(q)
	if speed > StrokeMath.MAX_SPEED:
		gain = 0.0
	apply_central_impulse(fwd * gain * mass * (1.0 - 0.3 * clampf(speed / StrokeMath.MAX_SPEED, 0.0, 1.0)))
	apply_torque_impulse(Vector3.UP * -side * StrokeMath.stroke_yaw(q, rocker) * 200.0)
	if q >= StrokeMath.GOOD_STROKE:
		strokes_good += 1
	else:
		strokes_arm += 1
	_paddler.begin_stroke(side, "forward")
	stroke_done.emit(side, q, "forward")

## A sweep: a wide arc that turns the boat away from the blade, sharper when edged toward it.
func sweep(side: int) -> void:
	var edge_help := 1.0 + 0.9 * clampf(edge * side, 0.0, 1.0)
	apply_torque_impulse(Vector3.UP * -side * 0.22 * edge_help * (0.6 + 0.8 * rocker) * 200.0)
	apply_central_impulse(-global_basis.z * 0.06 * mass)
	_paddler.begin_stroke(side, "sweep")
	stroke_done.emit(side, 1.0, "sweep")

func reverse(side: int) -> void:
	apply_central_impulse(global_basis.z * 0.25 * mass)
	apply_torque_impulse(Vector3.UP * side * 0.12 * 200.0)
	_paddler.begin_stroke(side, "reverse")
	stroke_done.emit(side, 1.0, "reverse")

func speed_knots() -> float:
	return speed * 1.9438
