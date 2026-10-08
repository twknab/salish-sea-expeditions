## The frame of the folding kayak: a keel tube, two sheer tubes and ribs at the stations, lofted
## from the same Hull the skin is, colour-coded blue forward of the cockpit and red aft so it goes
## together the same way every time. Built once; the assembly scene moves and shows it.
class_name FrameModel
extends Node3D

const BLUE := Color("2f6fd6")
const RED := Color("d23c3c")
const TUBE := 0.016

func _ready() -> void:
	build()

func build() -> void:
	for c in get_children():
		c.queue_free()
	var stations := [0.04, 0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86, 0.96]
	# Long tubes: keel, port and starboard sheer, bow to stern, one section per station pair.
	for i in range(stations.size() - 1):
		var s0: float = stations[i]
		var s1: float = stations[i + 1]
		var mid := (s0 + s1) * 0.5
		var col := BLUE if mid < Hull.COCKPIT_S else RED
		_tube(Vector3(0.0, Hull.heights(s0).keel + 0.03, -Hull.x_at(s0)), Vector3(0.0, Hull.heights(s1).keel + 0.03, -Hull.x_at(s1)), col)
		for side in [-1.0, 1.0]:
			_tube(Vector3(side * Hull.half_beam(s0) * 0.86, Hull.heights(s0).sheer - 0.03, -Hull.x_at(s0)), Vector3(side * Hull.half_beam(s1) * 0.86, Hull.heights(s1).sheer - 0.03, -Hull.x_at(s1)), col)
	# Ribs: the hull section at each inner station, keel to sheer each side, in a dark carbon grey.
	for s in stations.slice(1, stations.size() - 1):
		for side in [-1.0, 1.0]:
			var sec := Hull.section(s, side)
			for j in range(3):
				var a := sec[j] * 0.88
				var b := sec[j + 1] * 0.88
				_tube(Vector3(a.x, a.y, -Hull.x_at(s)), Vector3(b.x, b.y, -Hull.x_at(s)), Color("2a2d31"))

func _tube(a: Vector3, b: Vector3, col: Color) -> void:
	var m := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = TUBE
	cyl.bottom_radius = TUBE
	cyl.height = a.distance_to(b)
	cyl.radial_segments = 8
	m.mesh = cyl
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.5
	mat.metallic = 0.3
	m.material_override = mat
	m.position = (a + b) * 0.5
	var d := (b - a).normalized()
	var up := Vector3.UP if absf(d.dot(Vector3.UP)) < 0.99 else Vector3.FORWARD
	m.basis = Basis.looking_at(d, up) * Basis(Vector3.RIGHT, -PI / 2.0)  # the cylinder's axis is Y; lay it along d
	add_child(m)
