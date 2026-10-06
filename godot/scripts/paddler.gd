## The paddler in the cockpit, built from primitives and animated procedurally: the torso winds up
## and unwinds through each stroke, the arms follow the Greenland paddle, and an edge leans the
## upper body over the boat (head over the kayak, as taught).
class_name Paddler
extends Node3D

var _torso: MeshInstance3D
var _head: MeshInstance3D
var _paddle: Node3D
var _arm_l: MeshInstance3D
var _arm_r: MeshInstance3D
var _phase := 1.0
var _side := 1
var _kind := "forward"

const PADDLE_LEN := 2.2
const HAND := 0.34

func _ready() -> void:
	var skin := _mat(Color("c9a07a"), 0.7)
	var pfd := _mat(Color("f2d016"), 0.6)
	var suit := _mat(Color("1d3340"), 0.75)
	_torso = _capsule(0.15, 0.52, pfd)
	_torso.position.y = 0.48
	add_child(_torso)
	_head = MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.105; sm.height = 0.21
	_head.mesh = sm
	_head.material_override = skin
	_head.position.y = 0.4
	_torso.add_child(_head)
	var hat := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.125; cm.bottom_radius = 0.125; cm.height = 0.02
	hat.mesh = cm
	hat.material_override = _mat(Color("6b5a3e"), 0.9)
	hat.position.y = 0.03
	_head.add_child(hat)
	_arm_l = _capsule(0.04, 0.5, suit)
	_arm_r = _capsule(0.04, 0.5, suit)
	add_child(_arm_l)
	add_child(_arm_r)
	_paddle = Node3D.new()
	_paddle.position.y = 0.62
	add_child(_paddle)
	var loom := MeshInstance3D.new()
	var lm := CylinderMesh.new()
	lm.top_radius = 0.017; lm.bottom_radius = 0.017; lm.height = PADDLE_LEN * 0.56
	loom.mesh = lm
	loom.rotation.z = PI / 2.0
	var wood := _mat(Color("b98a52"), 0.55)
	loom.material_override = wood
	_paddle.add_child(loom)
	for s in [-1.0, 1.0]:
		var blade := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(PADDLE_LEN * 0.24, 0.085, 0.024)
		blade.mesh = bm
		blade.material_override = wood
		blade.position.x = s * PADDLE_LEN * 0.38
		_paddle.add_child(blade)

func _mat(c: Color, rough: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	return m

func _capsule(r: float, h: float, m: Material) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CapsuleMesh.new()
	cm.radius = r; cm.height = h
	mi.mesh = cm
	mi.material_override = m
	return mi

func begin_stroke(side: int, kind: String) -> void:
	_side = side
	_kind = kind
	_phase = 0.0

## Called by the kayak each physics tick. `edge` leans the body; the stroke plays out over 0.9 s.
func advance(delta: float, edge: float) -> void:
	_phase = minf(1.0, _phase + delta / 0.9)
	var p := _phase
	var swing := sin(p * PI)
	# Torso: wound toward the stroke side at the catch, unwound past centre at the exit.
	_torso.rotation.y = _side * (0.45 - 0.9 * p) * (1.0 if _kind == "forward" else 0.6)
	_torso.rotation.z = -edge * 0.12
	# Paddle: the stroke-side blade dips and travels from the feet to the hip.
	var dip := _side * 0.55 * swing
	var travel := (0.55 - 1.1 * p) if _kind != "reverse" else (-0.55 + 1.1 * p)
	if _kind == "sweep":
		travel *= 1.6
	_paddle.rotation = Vector3(0.0, _side * travel, dip)
	_paddle.position.z = -0.18 * swing * (1.0 if _kind != "reverse" else -1.0)
	# Arms follow the hands on the loom.
	var hand_l := _paddle.to_global(Vector3(-HAND, 0.0, 0.0))
	var hand_r := _paddle.to_global(Vector3(HAND, 0.0, 0.0))
	_place_arm(_arm_l, _torso.to_global(Vector3(-0.19, 0.2, 0.0)), hand_l)
	_place_arm(_arm_r, _torso.to_global(Vector3(0.19, 0.2, 0.0)), hand_r)

func _place_arm(arm: MeshInstance3D, from: Vector3, to: Vector3) -> void:
	var mid := (from + to) / 2.0
	arm.global_position = mid
	var d := to - from
	if d.length() > 0.01:
		arm.look_at(to, Vector3.UP)
		arm.rotate_object_local(Vector3.RIGHT, PI / 2.0)
	(arm.mesh as CapsuleMesh).height = maxf(0.2, d.length())
