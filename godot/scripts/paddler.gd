## The paddler: a figure built from primitives with the proportions of a real adult, dressed for
## immersion layer by layer (base, fleece, drysuit, skirt and PFD, cap and gloves), arms solved
## with two-bone IK onto the Greenland paddle, torso winding and unwinding through each stroke.
## `dress` picks how many layers are on (0..4) for the outfitting screens; `standing` shows the
## whole body for those screens, otherwise the legs are under the deck.
class_name Paddler
extends Node3D

@export var dress := 4
@export var standing := false

const PADDLE_LEN := 2.2
const HAND := 0.33
const UPPER := 0.30
const FORE := 0.27
const SHOULDER_W := 0.21

var _torso: Node3D
var _chest: MeshInstance3D
var _pfd: Node3D
var _head: Node3D
var _paddle: Node3D
var _arms := {}
var _phase := 1.0
var _side := 1
var _kind := "forward"
var _skirt: MeshInstance3D
var anchors := {}

static func _mat(c: Color, rough := 0.7, metal := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	m.metallic = metal
	return m

static func _mesh(mesh: Mesh, mat: Material, pos := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.position = pos
	return mi

static func _capsule(r: float, h: float, mat: Material, pos := Vector3.ZERO) -> MeshInstance3D:
	var cm := CapsuleMesh.new()
	cm.radius = r; cm.height = h
	return _mesh(cm, mat, pos)

static func _box(size: Vector3, mat: Material, pos := Vector3.ZERO) -> MeshInstance3D:
	var bm := BoxMesh.new()
	bm.size = size
	return _mesh(bm, mat, pos)

static func _cyl(r: float, h: float, mat: Material, pos := Vector3.ZERO, top := -1.0) -> MeshInstance3D:
	var cm := CylinderMesh.new()
	cm.bottom_radius = r; cm.top_radius = r if top < 0.0 else top; cm.height = h
	return _mesh(cm, mat, pos)

static func _sphere(r: float, mat: Material, pos := Vector3.ZERO) -> MeshInstance3D:
	var sm := SphereMesh.new()
	sm.radius = r; sm.height = r * 2.0
	return _mesh(sm, mat, pos)

func _ready() -> void:
	build()

func build() -> void:
	for c in get_children():
		c.queue_free()
	_arms.clear()
	var skin := _mat(Color("c9a07a"), 0.75)
	var suit_color: Color = [Color("8a98a8"), Color("1c2f4a"), Color("1f6f78"), Color("1f6f78"), Color("1f6f78")][clampi(dress, 0, 4)]
	var suit := _mat(suit_color, 0.72 if dress >= 2 else 0.9)
	var gasket := _mat(Color("151718"), 0.6)
	var pfd := _mat(Color("f2d016"), 0.6)
	var strap := _mat(Color("2b2f33"), 0.8)
	var neoprene := _mat(Color("1a1d20"), 0.55)
	var wood := _mat(Color("b98a52"), 0.5)
	var seat_y := 0.0 if not standing else 0.86
	# Hips and the spray-skirt tunnel (or shorts, when standing before the skirt goes on).
	if not standing:
		_skirt = _cyl(0.17, 0.22, neoprene if dress >= 3 else suit, Vector3(0, 0.11, 0), 0.30)
		_skirt.rotation.x = PI
		add_child(_skirt)
	else:
		var leg_mat := suit
		for s in [-1.0, 1.0]:
			add_child(_capsule(0.075, 0.42, leg_mat, Vector3(s * 0.1, 0.63, 0)))
			add_child(_capsule(0.06, 0.40, leg_mat, Vector3(s * 0.1, 0.22, 0)))
			var bootie := _box(Vector3(0.1, 0.07, 0.22), neoprene if dress >= 4 else skin, Vector3(s * 0.1, 0.035, 0.05))
			add_child(bootie)
	# Torso: a capsule widened at the shoulders, a chest under the PFD.
	_torso = Node3D.new()
	_torso.position = Vector3(0, seat_y + 0.28, 0)
	add_child(_torso)
	var trunk := _capsule(0.135, 0.34, suit, Vector3(0, 0.17, 0))
	trunk.scale = Vector3(1.3, 1.0, 0.85)
	_torso.add_child(trunk)
	_chest = _capsule(0.15, 0.2, suit, Vector3(0, 0.32, 0))
	_chest.scale = Vector3(1.45, 1.0, 0.8)
	_torso.add_child(_chest)
	if dress >= 2:
		var zip := _box(Vector3(0.012, 0.3, 0.012), gasket, Vector3(0.07, 0.22, 0.13))
		zip.rotation.z = -0.5
		_torso.add_child(zip)
	# PFD: a vest with shoulder yokes, a chest strap and a front pocket.
	if dress >= 3:
		_pfd = Node3D.new()
		_torso.add_child(_pfd)
		var front := _box(Vector3(0.34, 0.3, 0.09), pfd, Vector3(0, 0.26, 0.115))
		var back := _box(Vector3(0.36, 0.34, 0.08), pfd, Vector3(0, 0.26, -0.11))
		_pfd.add_child(front); _pfd.add_child(back)
		for s in [-1.0, 1.0]:
			_pfd.add_child(_box(Vector3(0.09, 0.08, 0.26), pfd, Vector3(s * 0.13, 0.42, 0)))
			_pfd.add_child(_box(Vector3(0.1, 0.02, 0.02), strap, Vector3(s * 0.075, 0.2, 0.165)))
		_pfd.add_child(_box(Vector3(0.36, 0.025, 0.1), strap, Vector3(0, 0.14, 0.12)))
		_pfd.add_child(_box(Vector3(0.14, 0.11, 0.03), _mat(Color("d9ba12"), 0.6), Vector3(0.0, 0.26, 0.17)))
		_pfd.add_child(_cyl(0.012, 0.09, _mat(Color("e8e8e8"), 0.3), Vector3(-0.12, 0.3, 0.17)))  # whistle cord / knife
	# Neck and head: a neck gasket, a face, a cap or hair, sunglasses on the water.
	var neck := _cyl(0.05, 0.08, gasket if dress >= 2 else skin, Vector3(0, 0.5, 0))
	_torso.add_child(neck)
	_head = Node3D.new()
	_head.position = Vector3(0, 0.66, 0.0)
	_torso.add_child(_head)
	_head.add_child(_sphere(0.105, skin))
	var cap_mat := neoprene if dress >= 4 else _mat(Color("4a3626"), 0.9)
	var dome := _sphere(0.108, cap_mat, Vector3(0, 0.02, -0.005))
	dome.scale = Vector3(1.0, 0.75, 1.0)
	_head.add_child(dome)
	if dress >= 4:
		_head.add_child(_box(Vector3(0.17, 0.035, 0.03), gasket, Vector3(0, 0.02, 0.095)))  # sunglasses
		var brim := _cyl(0.13, 0.012, cap_mat, Vector3(0, 0.03, 0.04))
		brim.scale = Vector3(1.0, 1.0, 1.2)
		_head.add_child(brim)
	var nose := _sphere(0.018, skin, Vector3(0, -0.01, 0.1))
	_head.add_child(nose)
	# Arms: upper, fore, hand, with gaskets at the wrist and gloves when dressed for it.
	for s in [-1.0, 1.0]:
		var key := "l" if s < 0 else "r"
		var upper := _capsule(0.048, UPPER, suit)
		var fore := _capsule(0.042, FORE, suit)
		var hand := _sphere(0.045, neoprene if dress >= 4 else skin)
		hand.scale = Vector3(0.8, 1.0, 1.2)
		var wrist := _cyl(0.046, 0.03, gasket if dress >= 2 else suit)
		add_child(upper); add_child(fore); add_child(hand); add_child(wrist)
		_arms[key] = { "upper": upper, "fore": fore, "hand": hand, "wrist": wrist, "side": s }
	# The Greenland paddle.
	_paddle = Node3D.new()
	_paddle.position = Vector3(0, seat_y + 0.62, 0.05)
	add_child(_paddle)
	if not standing:
		var loom := _cyl(0.017, PADDLE_LEN * 0.52, wood)
		loom.rotation.z = PI / 2.0
		_paddle.add_child(loom)
		for s in [-1.0, 1.0]:
			var blade := _box(Vector3(PADDLE_LEN * 0.26, 0.088, 0.022), wood, Vector3(s * PADDLE_LEN * 0.37, 0, 0))
			_paddle.add_child(blade)
			var shoulder := _cyl(0.03, 0.06, wood, Vector3(s * PADDLE_LEN * 0.245, 0, 0), 0.02)
			shoulder.rotation.z = s * PI / 2.0
			_paddle.add_child(shoulder)
	anchors = {
		"feet": Vector3(0, 0.08, -0.9) if not standing else Vector3(0, 0.05, 0.05),
		"knees": Vector3(0.12, 0.25, -0.55) if not standing else Vector3(0.1, 0.45, 0.05),
		"hips": Vector3(0, seat_y + 0.2, 0),
		"back": Vector3(0, seat_y + 0.4, -0.16),
		"head": Vector3(0, seat_y + 0.28 + 0.66, 0),
		"blade": Vector3(-PADDLE_LEN * 0.37, seat_y + 0.62, 0.05),
		"loom": Vector3(0, seat_y + 0.62, 0.05),
		"shoulder": Vector3(PADDLE_LEN * 0.245, seat_y + 0.62, 0.05),
		"tip": Vector3(PADDLE_LEN * 0.5, seat_y + 0.62, 0.05),
		"box": Vector3(0, seat_y + 0.6, 0.25),
	}
	advance(0.0, 0.0)

func begin_stroke(side: int, kind: String) -> void:
	_side = side
	_kind = kind
	_phase = 0.0

## Per tick: the stroke plays out over 0.9 s; `edge` leans the body over the boat.
func advance(delta: float, edge: float) -> void:
	if _torso == null:
		return
	_phase = minf(1.0, _phase + delta / 0.9)
	var p := _phase
	var swing := sin(p * PI)
	var fwd_kind := _kind != "reverse"
	# Torso: wound toward the stroke side at the catch, unwound past centre at the exit; a stroke
	# at rest keeps a slight forward lean, the posture of someone sitting tall.
	var wind := (0.5 - 1.0 * p) if fwd_kind else (-0.5 + 1.0 * p)
	_torso.rotation.y = _side * wind * (1.0 if _kind == "forward" else 0.65)
	_torso.rotation.z = -edge * 0.14
	_torso.rotation.x = -0.08 - 0.06 * swing
	_head.rotation.y = -_torso.rotation.y * 0.6
	if standing:
		_torso.rotation = Vector3.ZERO
	# Paddle: the stroke-side blade dips and travels from the feet back to the hip.
	var dip := _side * 0.62 * swing
	var travel := (0.6 - 1.2 * p) if fwd_kind else (-0.6 + 1.2 * p)
	if _kind == "sweep":
		travel *= 1.5
		dip *= 0.5
	if p >= 1.0:
		travel = 0.0
		dip = 0.0
	_paddle.rotation = Vector3(0.0, _side * travel, dip)
	_paddle.position.z = (0.05 - 0.22 * swing) if fwd_kind else (0.05 + 0.2 * swing)
	_paddle.position.x = -_side * 0.12 * swing
	# Arms: shoulders ride the torso; hands hold the loom (or hang, standing).
	for key in _arms.keys():
		var a: Dictionary = _arms[key]
		var s: float = a.side
		var shoulder := _torso.to_global(Vector3(s * SHOULDER_W, 0.44, 0.02))
		var hand: Vector3
		if standing:
			hand = to_global(Vector3(s * 0.26, 0.78, 0.04))
		else:
			hand = _paddle.to_global(Vector3(s * HAND, 0.0, 0.0))
		var pole := to_global(Vector3(s * 0.6, -0.3, -0.2)) - to_global(Vector3.ZERO)
		var elbow := IK.two_bone(shoulder, hand, UPPER, FORE, pole)
		_place(a.upper, shoulder, elbow)
		_place(a.fore, elbow, hand)
		(a.hand as Node3D).global_position = hand
		var w := hand + (elbow - hand).normalized() * 0.05
		_place(a.wrist, w - (elbow - hand).normalized() * 0.015, w + (elbow - hand).normalized() * 0.015)

func _place(mi: MeshInstance3D, from: Vector3, to: Vector3) -> void:
	var d := to - from
	var len := d.length()
	if len < 1e-4:
		return
	mi.global_position = (from + to) / 2.0
	mi.look_at(to, Vector3.UP if absf(d.normalized().dot(Vector3.UP)) < 0.98 else Vector3.FORWARD)
	mi.rotate_object_local(Vector3.RIGHT, PI / 2.0)
	if mi.mesh is CapsuleMesh:
		(mi.mesh as CapsuleMesh).height = maxf(len, (mi.mesh as CapsuleMesh).radius * 2.0 + 0.01)
	elif mi.mesh is CylinderMesh:
		(mi.mesh as CylinderMesh).height = len
