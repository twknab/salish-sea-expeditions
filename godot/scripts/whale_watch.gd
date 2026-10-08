## A whale-watch boat on the pod: the fleet works Spieden Channel in the afternoon, and a boat that
## does it right holds off abeam at the field guide's distance for the species, parallel to the
## animals, engine at idle. It keeps the same distance you are asked to, and it is watching you too.
class_name WhaleWatch
extends Node3D

const STANDOFF := 366.0     # four hundred yards abeam, in metres, when the field guide names none
const LENGTH := 13.0
const BEAM := 4.2

var _t := randf() * 10.0

## Where a boat holding off the pod abeam sits: `side` +1 is to starboard of the pod's heading.
static func station_for(pod_pos: Vector3, heading: Vector3, side := 1.0, standoff := STANDOFF) -> Vector3:
	var h := Vector3(heading.x, 0.0, heading.z).normalized()
	var abeam := Vector3(-h.z, 0.0, h.x) * side
	return Vector3(pod_pos.x, 0.0, pod_pos.z) + abeam * maxf(50.0, standoff)

static func _m(c: Color, rough := 0.6) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	return m

static func _box(parent: Node3D, size: Vector3, mat: Material, pos: Vector3) -> MeshInstance3D:
	var bm := BoxMesh.new()
	bm.size = size
	var mi := MeshInstance3D.new()
	mi.mesh = bm
	mi.material_override = mat
	mi.position = pos
	parent.add_child(mi)
	return mi

func _ready() -> void:
	var white := _m(Color("eef0ea"), 0.5)
	var blue := _m(Color("1f4f78"), 0.55)
	var glass := _m(Color("17323c"), 0.15)
	var dark := _m(Color("2a3034"), 0.5)
	# A hard-bottom tour boat: the hull, a blue boot stripe, a cabin with a flybridge and a mast.
	_box(self, Vector3(BEAM, 1.5, LENGTH * 0.82), white, Vector3(0, 0.75, 0))
	var bow := _box(self, Vector3(BEAM * 0.9, 1.5, LENGTH * 0.18), white, Vector3(0, 0.75, -LENGTH * 0.45))
	bow.scale = Vector3(0.6, 1.0, 1.0)
	_box(self, Vector3(BEAM + 0.05, 0.3, LENGTH * 0.82), blue, Vector3(0, 0.25, 0))
	_box(self, Vector3(BEAM * 0.8, 1.9, LENGTH * 0.42), white, Vector3(0, 2.4, -0.4))
	_box(self, Vector3(BEAM * 0.82, 0.8, LENGTH * 0.42 + 0.05), glass, Vector3(0, 2.7, -0.4))
	_box(self, Vector3(BEAM * 0.6, 0.9, LENGTH * 0.26), white, Vector3(0, 3.8, -0.6))
	_box(self, Vector3(0.12, 3.0, 0.12), dark, Vector3(0, 5.6, -0.6))
	for s in [-1.0, 1.0]:  # rails along the open stern deck
		_box(self, Vector3(0.06, 0.9, LENGTH * 0.36), dark, Vector3(s * (BEAM / 2.0 - 0.1), 1.95, LENGTH * 0.22))

## Hold station abeam of the pod as it walks, pointed the way it goes, with the engine's idle bob.
func follow(pod: Node3D, heading: Vector3, delta: float, standoff := STANDOFF, side := 1.0) -> void:
	_t += delta
	var want := station_for(pod.global_position, heading, side, standoff)
	global_position = global_position.lerp(Vector3(want.x, 0.0, want.z), minf(1.0, delta * 0.8))
	global_position.y = 0.05 + sin(_t * 0.7) * 0.06
	var h := Vector3(heading.x, 0.0, heading.z).normalized()
	look_at(global_position + h, Vector3.UP)
	rotation.z = sin(_t * 0.5) * 0.02
