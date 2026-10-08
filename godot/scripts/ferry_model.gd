## A double-ended island ferry, built from primitives: white hull with a car deck, two passenger
## decks of windows, a wheelhouse at each end, a stack, railings. Not any one company's boat.
class_name FerryModel
extends Node3D

const LENGTH := 84.0
const BEAM := 18.0

static func _m(c: Color, rough := 0.6) -> StandardMaterial3D:
	var m := StandardMaterial3D.new(); m.albedo_color = c; m.roughness = rough; return m

static func _box(parent: Node3D, size: Vector3, mat: Material, pos: Vector3) -> MeshInstance3D:
	var bm := BoxMesh.new(); bm.size = size
	var mi := MeshInstance3D.new(); mi.mesh = bm; mi.material_override = mat; mi.position = pos
	parent.add_child(mi); return mi

func _ready() -> void:
	var white := _m(Color("f2f3ee"), 0.55)
	var green := _m(Color("2f6b4f"), 0.6)
	var dark := _m(Color("1d2a30"), 0.4)
	var deck := _m(Color("5d6a6e"), 0.9)
	var glass := _m(Color("17323c"), 0.15)
	# Hull: a long box with sloped ends, a green boot stripe at the waterline.
	_box(self, Vector3(BEAM, 3.2, LENGTH * 0.8), white, Vector3(0, 1.6, 0))
	for s in [-1.0, 1.0]:
		var end := _box(self, Vector3(BEAM * 0.92, 3.2, LENGTH * 0.12), white, Vector3(0, 1.6, s * LENGTH * 0.45))
		end.scale = Vector3(0.85, 1.0, 1.0)
	_box(self, Vector3(BEAM + 0.1, 0.5, LENGTH * 0.8), green, Vector3(0, 0.5, 0))
	# Car deck, open at both ends, under the passenger decks.
	_box(self, Vector3(BEAM, 0.3, LENGTH * 0.9), deck, Vector3(0, 3.3, 0))
	for s in [-1.0, 1.0]:
		_box(self, Vector3(0.4, 4.2, LENGTH * 0.8), white, Vector3(s * (BEAM / 2.0 - 0.3), 5.4, 0))
	# Passenger deck and sun deck.
	_box(self, Vector3(BEAM * 0.9, 0.4, LENGTH * 0.78), deck, Vector3(0, 7.6, 0))
	_box(self, Vector3(BEAM * 0.86, 3.0, LENGTH * 0.7), white, Vector3(0, 9.3, 0))
	var n := 16
	for i in range(n):
		var z := -LENGTH * 0.32 + i * (LENGTH * 0.64 / (n - 1))
		for s in [-1.0, 1.0]:
			_box(self, Vector3(0.1, 1.3, 2.4), glass, Vector3(s * (BEAM * 0.43 + 0.02), 9.5, z))
	_box(self, Vector3(BEAM * 0.8, 0.3, LENGTH * 0.72), deck, Vector3(0, 10.95, 0))
	# Wheelhouses, the stack, railings.
	for s in [-1.0, 1.0]:
		var wh := _box(self, Vector3(6.0, 2.6, 4.0), white, Vector3(0, 12.4, s * LENGTH * 0.3))
		_box(self, Vector3(6.1, 1.0, 0.1), glass, Vector3(0, 12.8, s * (LENGTH * 0.3 + 2.05)))
	var stack := MeshInstance3D.new()
	var cm := CylinderMesh.new(); cm.top_radius = 1.1; cm.bottom_radius = 1.3; cm.height = 4.0
	stack.mesh = cm; stack.material_override = dark; stack.position = Vector3(0, 13.0, 0)
	add_child(stack)
	var rail := _m(Color("e6e8e4"), 0.4)
	for s in [-1.0, 1.0]:
		_box(self, Vector3(0.06, 1.1, LENGTH * 0.72), rail, Vector3(s * BEAM * 0.39, 11.6, 0))
		_box(self, Vector3(BEAM * 0.78, 0.06, 0.06), rail, Vector3(0, 12.1, s * LENGTH * 0.36))
		_box(self, Vector3(BEAM * 0.78, 0.06, 0.06), rail, Vector3(0, 11.6, s * LENGTH * 0.36))
		for i in range(9):
			_box(self, Vector3(0.05, 1.1, 0.05), rail, Vector3(-BEAM * 0.39 + i * BEAM * 0.0975, 11.6, s * LENGTH * 0.36))
		# A bench and a lifebuoy on the sun deck, something for the eye at the rail.
		_box(self, Vector3(3.0, 0.08, 0.5), _m(Color("7a5a3a"), 0.9), Vector3(2.5, 11.6, s * LENGTH * 0.33))
	var buoy := MeshInstance3D.new()
	var tm := TorusMesh.new(); tm.inner_radius = 0.28; tm.outer_radius = 0.42
	buoy.mesh = tm; buoy.material_override = _m(Color("e0532f"), 0.6)
	buoy.position = Vector3(-BEAM * 0.39 + 0.1, 11.9, -LENGTH * 0.3); buoy.rotation = Vector3(0, 0, PI / 2.0)
	add_child(buoy)
