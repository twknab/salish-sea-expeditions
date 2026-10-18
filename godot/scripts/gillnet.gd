class_name Gillnet
extends Node3D
## A gillnet set across the line in salmon season: a long row of corks on the surface with an orange
## buoy at each end, the net hanging below like a curtain. A kayak goes round the ends, never over:
## a paddle or a skeg that finds the mesh is caught in it, and the boat stops. Set on the September day
## (the fall salmon openings) across day two's line. The geometry is static, for the tests.

signal said(text: String, snagged: bool)

const A := Vector3(-6500.0, 0.0, -10250.0)  # the north end buoy
const B := Vector3(-6500.0, 0.0, -10600.0)  # the south end buoy
const DAY := "september"
const NEAR_M := 60.0
const CORK_EVERY := 6.0

var snagged := 0
var _kayak: Node3D
var _sea: Node             # the Seascape, untyped so this script loads without the autoloads it reads
var _near_said := false
var _prev := Vector2.INF
var _cool := 0.0

## Which side of the line a-b the point lies on (the sign is all that matters).
static func side(p: Vector2, a: Vector2, b: Vector2) -> float:
	return (b - a).cross(p - a)

## Metres from the point to the net between its buoys.
static func distance(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab := b - a
	var t := clampf((p - a).dot(ab) / ab.length_squared(), 0.0, 1.0)
	return p.distance_to(a + ab * t)

## True when a step from `was` to `now` passes over the net between the buoys, not round an end.
static func crossed(was: Vector2, now: Vector2, a: Vector2, b: Vector2) -> bool:
	if signf(side(was, a, b)) == signf(side(now, a, b)):
		return false
	return signf(side(a, was, now)) != signf(side(b, was, now))

func setup(kayak: Node3D, sea: Node) -> void:
	_kayak = kayak
	_sea = sea
	var cork := StandardMaterial3D.new()
	cork.albedo_color = Color(0.9, 0.8, 0.35)
	var orange := StandardMaterial3D.new()
	orange.albedo_color = Color(0.95, 0.45, 0.1)
	var n := int(A.distance_to(B) / CORK_EVERY)
	for i in n + 1:
		var m := MeshInstance3D.new()
		var s := SphereMesh.new()
		var end := i == 0 or i == n
		s.radius = 0.6 if end else 0.24
		s.height = s.radius * 2.0
		m.mesh = s
		m.material_override = orange if end else cork
		m.position = A.lerp(B, float(i) / float(n))
		add_child(m)
		if end:  # a pole and a flag on each end buoy, so the ends read from a long way off
			var pole := MeshInstance3D.new()
			var cyl := CylinderMesh.new()
			cyl.top_radius = 0.04
			cyl.bottom_radius = 0.04
			cyl.height = 2.6
			pole.mesh = cyl
			pole.material_override = cork
			pole.position.y = 1.3
			m.add_child(pole)
			var flag := MeshInstance3D.new()
			var box := BoxMesh.new()
			box.size = Vector3(0.05, 0.5, 0.7)
			flag.mesh = box
			flag.material_override = orange
			flag.position = Vector3(0, 2.4, 0.35)
			m.add_child(flag)

func _process(delta: float) -> void:
	if _kayak == null:
		return
	_cool = maxf(0.0, _cool - delta)
	for c in get_children():
		c.position.y = float(_sea.height_at(c.position.x, c.position.z))
	var here := Vector2(_kayak.global_position.x, _kayak.global_position.z)
	var a := Vector2(A.x, A.z)
	var b := Vector2(B.x, B.z)
	if not _near_said and distance(here, a, b) < NEAR_M:
		_near_said = true
		said.emit("A gillnet across the line: the corks on the surface, an orange buoy at each end, the net hanging below. Go round an end, never over.", false)
	if _prev != Vector2.INF and _cool <= 0.0 and crossed(_prev, here, a, b):
		snagged += 1
		_cool = 4.0
		said.emit("Over the corks, and the net has the skeg: the boat stops dead. Back off gently and go round the end buoy. A fisher's net is a livelihood.", true)
	_prev = here
