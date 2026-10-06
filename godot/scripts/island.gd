## An island built from noise: a shaped mound with a sand fringe, meadow, and a conifer forest of
## instanced cones on the high ground. Stands in for the Friday Harbor shore until real terrain
## comes from chart and elevation data.
class_name Island
extends Node3D

@export var radius := 70.0
@export var seed := 7

var _noise := FastNoiseLite.new()

func height_at(x: float, z: float) -> float:
	var d := Vector2(x, z).length() / radius
	var rim := clampf(1.0 - d, 0.0, 1.0)
	var shape := rim * rim * (3.0 - 2.0 * rim)
	var n := _noise.get_noise_2d(x, z) * 0.5 + 0.5
	var h := shape * (9.0 + 14.0 * n) - 1.2
	return h

func _ready() -> void:
	_noise.seed = seed
	_noise.frequency = 0.02
	_noise.fractal_octaves = 4
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var n := 110
	var ext := radius * 1.25
	var cell := ext * 2.0 / n
	var grid: Array[PackedVector3Array] = []
	var cols: Array[PackedColorArray] = []
	for i in range(n + 1):
		var row := PackedVector3Array()
		var crow := PackedColorArray()
		for j in range(n + 1):
			var x := -ext + i * cell
			var z := -ext + j * cell
			var y := height_at(x, z)
			row.append(Vector3(x, y, z))
			crow.append(_colour(y, x, z))
		grid.append(row)
		cols.append(crow)
	for i in range(n):
		for j in range(n):
			var a := grid[i][j]; var b := grid[i + 1][j]; var c := grid[i + 1][j + 1]; var d := grid[i][j + 1]
			st.set_color(cols[i][j]); st.add_vertex(a)
			st.set_color(cols[i + 1][j + 1]); st.add_vertex(c)
			st.set_color(cols[i + 1][j]); st.add_vertex(b)
			st.set_color(cols[i][j]); st.add_vertex(a)
			st.set_color(cols[i][j + 1]); st.add_vertex(d)
			st.set_color(cols[i + 1][j + 1]); st.add_vertex(c)
	st.generate_normals()
	st.index()
	var mi := MeshInstance3D.new()
	mi.mesh = st.commit()
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/land.gdshader")
	var tex := NoiseTexture2D.new()
	var gn := FastNoiseLite.new()
	gn.frequency = 0.08
	tex.noise = gn
	tex.seamless = true
	tex.width = 128
	tex.height = 128
	mat.set_shader_parameter("grain", tex)
	mi.material_override = mat
	add_child(mi)
	_forest()
	var body := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = radius * 0.72
	cyl.height = 20.0
	cs.shape = cyl
	body.add_child(cs)
	add_child(body)

func _colour(y: float, x: float, z: float) -> Color:
	var sand := Color("b8a985")
	var meadow := Color("6d8a4a")
	var forest := Color("2d4a30")
	var rock := Color("6e6a62")
	if y < 0.9:
		return sand
	if y < 2.6:
		return sand.lerp(meadow, (y - 0.9) / 1.7)
	var slope := absf(height_at(x + 1.0, z) - height_at(x - 1.0, z)) + absf(height_at(x, z + 1.0) - height_at(x, z - 1.0))
	var c := meadow.lerp(forest, clampf((y - 2.6) / 4.0, 0.0, 1.0))
	return c.lerp(rock, clampf((slope - 1.6) / 1.5, 0.0, 1.0))

func _forest() -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 1.3
	cone.height = 5.5
	cone.radial_segments = 7
	mm.mesh = cone
	var rng := RandomNumberGenerator.new()
	rng.seed = seed
	var places: Array[Transform3D] = []
	var tints: Array[Color] = []
	for k in range(1800):
		var x := rng.randf_range(-radius, radius)
		var z := rng.randf_range(-radius, radius)
		var y := height_at(x, z)
		if y < 3.2:
			continue
		var s := rng.randf_range(0.6, 1.1)
		var t := Transform3D(Basis.from_euler(Vector3(0.0, rng.randf() * TAU, 0.0)).scaled(Vector3(s, s * rng.randf_range(0.9, 1.5), s)), Vector3(x, y + 3.2 * s, z))
		places.append(t)
		tints.append(Color(0.035, 0.1, 0.04).lerp(Color(0.02, 0.055, 0.025), rng.randf()))
	mm.instance_count = places.size()
	for i in range(places.size()):
		mm.set_instance_transform(i, places[i])
		mm.set_instance_color(i, tints[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.roughness = 0.95
	mmi.material_override = mat
	add_child(mmi)
