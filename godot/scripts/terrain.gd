## The real islands. Reads terrain/height.i16 (int16 metres × 10) and terrain/cover.u8 (ESA
## WorldCover classes) in the grid terrain.json describes — AWS Terrain Tiles and WorldCover, built
## by tools/geo/build_terrain.py — and draws the land as chunked meshes coloured from the cover,
## with instanced conifers where the cover says tree cover. Chunks near the focus are built at full
## resolution and the rest coarsely, a few per frame, and every mesh is cached for the session so
## the next scene that needs the islands has them at once. The sea shader draws the water and reads
## the same heights (see height_texture) for its shallows.
class_name Terrain
extends Node3D

const CHUNK := 32            # grid cells per chunk side (1.5 km at 48 m)
const NEAR := 4200.0         # metres from the focus inside which chunks are built at full resolution
const FAR_STRIDE := 3        # cells per vertex beyond that
const PER_FRAME := 6         # chunks (re)built per frame
const TREE_RADIUS := 2600.0  # metres around the focus where trees are instanced
const WATER := 80            # WorldCover class
const DEPTH_SPAN := 48.0     # height_texture encodes -40 m .. +8 m into one byte
const DEPTH_FLOOR := -40.0

static var _cache_h: PackedFloat32Array
static var _cache_c: PackedByteArray
static var _cache_meta: Dictionary = {}
static var _mesh_cache: Dictionary = {}   # "cx,cy,stride" -> ArrayMesh (null when the chunk is all sea)
static var _depth_tex: ImageTexture

var meta: Dictionary = {}
var width := 0
var height := 0
var step := 48.0
var top_left := Vector2.ZERO
var focus := Vector3.ZERO
var _h: PackedFloat32Array
var _c: PackedByteArray
var _mat: StandardMaterial3D
var _chunks: Dictionary = {}   # "cx,cy" -> {mi, stride}
var _trees: MultiMeshInstance3D
var _tree_focus := Vector3(INF, 0, INF)
var _loaded := false

func _ready() -> void:
	if not _load():
		return
	_mat = StandardMaterial3D.new()
	_mat.vertex_color_use_as_albedo = true
	_mat.roughness = 0.95
	_trees = MultiMeshInstance3D.new()
	add_child(_trees)
	_loaded = true

func _process(_delta: float) -> void:
	if not _loaded:
		return
	# The first frame gets a head start, once the scene has told us where to look, so it does not
	# open on bare water.
	_build_some(60 if _chunks.is_empty() else PER_FRAME)
	_update_trees()

## Grid data, read once per session.
func _load() -> bool:
	if _cache_meta.is_empty():
		var f := FileAccess.open("res://terrain/terrain.json", FileAccess.READ)
		if f == null:
			push_warning("terrain.json missing; no land")
			return false
		var m: Dictionary = JSON.parse_string(f.get_as_text())
		var w: int = m.width
		var h: int = m.height
		var raw := FileAccess.get_file_as_bytes("res://terrain/height.i16")
		var cov := FileAccess.get_file_as_bytes("res://terrain/cover.u8")
		if raw.size() != w * h * 2 or cov.size() != w * h:
			push_warning("terrain rasters do not match terrain.json")
			return false
		_cache_h = PackedFloat32Array()
		_cache_h.resize(w * h)
		for i in range(w * h):
			_cache_h[i] = raw.decode_s16(i * 2) * 0.1
		_cache_c = cov
		_cache_meta = m
	meta = _cache_meta
	_h = _cache_h
	_c = _cache_c
	width = int(meta.width); height = int(meta.height); step = float(meta.metres_per_pixel)
	top_left = Vector2(meta.top_left.x, meta.top_left.z)
	return true

## Height in metres at world (x, z); bilinear; sea is negative.
func height_at(x: float, z: float) -> float:
	if not _loaded:
		return -50.0
	var gx := (x - global_position.x - top_left.x) / step
	var gy := (z - global_position.z - top_left.y) / step
	if gx < 0.0 or gy < 0.0 or gx >= width - 1 or gy >= height - 1:
		return -50.0
	var x0 := int(gx); var y0 := int(gy)
	var fx := gx - x0; var fy := gy - y0
	var a := _h[y0 * width + x0]; var b := _h[y0 * width + x0 + 1]
	var c := _h[(y0 + 1) * width + x0]; var d := _h[(y0 + 1) * width + x0 + 1]
	return lerpf(lerpf(a, b, fx), lerpf(c, d, fx), fy)

func cover_at(x: float, z: float) -> int:
	if not _loaded:
		return WATER
	var gx := int((x - global_position.x - top_left.x) / step); var gy := int((z - global_position.z - top_left.y) / step)
	if gx < 0 or gy < 0 or gx >= width or gy >= height:
		return WATER
	return _c[gy * width + gx]

func is_land(x: float, z: float) -> bool:
	return cover_at(x, z) != WATER and height_at(x, z) > 0.0

## Where a named place is, in world metres (places are in the grid's frame, offset by this node).
func place(id: String) -> Vector3:
	for p in meta.get("places", []):
		if p.id == id:
			return Vector3(p.x, 0.0, p.z) + global_position
	return global_position

## The map's rectangle in world metres: x0, z0, width, height — what the sea shader needs with
## height_texture() to find the shallows.
func map_rect() -> Vector4:
	return Vector4(global_position.x + top_left.x, global_position.z + top_left.y, width * step, height * step)

## The heights as one byte per cell, metres = v / 255 * 48 - 40, for the sea shader's shallows.
static func height_texture() -> ImageTexture:
	if _depth_tex:
		return _depth_tex
	var w: int = _cache_meta.width
	var h: int = _cache_meta.height
	var bytes := PackedByteArray()
	bytes.resize(w * h)
	for i in range(w * h):
		bytes[i] = int(clampf((_cache_h[i] - DEPTH_FLOOR) / DEPTH_SPAN, 0.0, 1.0) * 255.0)
	var img := Image.create_from_data(w, h, false, Image.FORMAT_R8, bytes)
	_depth_tex = ImageTexture.create_from_image(img)
	return _depth_tex

static func _colour(cls: int, h: float, slope: float) -> Color:
	var c: Color
	match cls:
		10: c = Color(0.16, 0.30, 0.17)   # tree cover
		20: c = Color(0.34, 0.44, 0.24)   # shrub
		30: c = Color(0.46, 0.54, 0.28)   # grassland
		40: c = Color(0.60, 0.58, 0.36)   # cropland
		50: c = Color(0.52, 0.50, 0.46)   # built-up
		60: c = Color(0.58, 0.54, 0.46)   # bare
		90, 95: c = Color(0.30, 0.44, 0.36)
		WATER: c = Color(0.36, 0.40, 0.34)  # the bottom, seen through the shallows' colour only
		_: c = Color(0.50, 0.48, 0.40)
	if h < 3.0:
		c = c.lerp(Color(0.74, 0.70, 0.56), clampf((3.0 - h) / 3.0, 0.0, 1.0))  # the beach band
	if slope > 0.45:
		c = c.lerp(Color(0.44, 0.42, 0.40), clampf((slope - 0.45) / 0.5, 0.0, 1.0))  # rock on steep faces
	return c

## Build or refine up to `n` chunks, nearest to the focus first.
func _build_some(n: int) -> void:
	var fx := (focus.x - global_position.x - top_left.x) / step
	var fz := (focus.z - global_position.z - top_left.y) / step
	var todo: Array = []
	var cx := 0
	while cx < width - 1:
		var cy := 0
		while cy < height - 1:
			var key := "%d,%d" % [cx, cy]
			var dx := (cx + CHUNK * 0.5 - fx) * step
			var dz := (cy + CHUNK * 0.5 - fz) * step
			var d := sqrt(dx * dx + dz * dz)
			var want := 1 if d < NEAR else FAR_STRIDE
			var have: int = _chunks[key].stride if _chunks.has(key) else 0
			if have != want:
				todo.append([d, cx, cy, want])
			cy += CHUNK
		cx += CHUNK
	if todo.is_empty():
		return
	todo.sort_custom(func(a: Array, b: Array) -> bool: return a[0] < b[0])
	for i in range(mini(n, todo.size())):
		var t: Array = todo[i]
		_set_chunk(t[1], t[2], t[3])

func _set_chunk(cx: int, cy: int, stride: int) -> void:
	var key := "%d,%d" % [cx, cy]
	var mkey := "%s,%d" % [key, stride]
	if not _mesh_cache.has(mkey):
		_mesh_cache[mkey] = _chunk_mesh(cx, cy, stride)
	var mesh: ArrayMesh = _mesh_cache[mkey]
	if _chunks.has(key):
		var mi: MeshInstance3D = _chunks[key].mi
		mi.mesh = mesh
		mi.visible = mesh != null
		_chunks[key].stride = stride
	else:
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		mi.visible = mesh != null
		mi.material_override = _mat
		add_child(mi)
		_chunks[key] = { "mi": mi, "stride": stride }

func _chunk_mesh(cx: int, cy: int, stride: int) -> ArrayMesh:
	var x1 := mini(cx + CHUNK, width - 1); var y1 := mini(cy + CHUNK, height - 1)
	var any_land := false
	var y := cy
	while y <= y1 and not any_land:
		var x := cx
		while x <= x1:
			if _c[y * width + x] != WATER:
				any_land = true; break
			x += 1
		y += 1
	if not any_land:
		return null
	var pos := PackedVector3Array(); var nrm := PackedVector3Array(); var col := PackedColorArray(); var idx := PackedInt32Array()
	var xs := PackedInt32Array(); var ys := PackedInt32Array()
	var gx := cx
	while gx < x1:
		xs.append(gx); gx += stride
	xs.append(x1)
	var gy := cy
	while gy < y1:
		ys.append(gy); gy += stride
	ys.append(y1)
	var cols := xs.size(); var rows := ys.size()
	for j in range(rows):
		for i in range(cols):
			var px := xs[i]; var py := ys[j]
			var h := _h[py * width + px]
			var hx := _h[py * width + mini(px + stride, width - 1)] - _h[py * width + maxi(px - stride, 0)]
			var hz := _h[mini(py + stride, height - 1) * width + px] - _h[maxi(py - stride, 0) * width + px]
			var nn := Vector3(-hx, 2.0 * stride * step, -hz).normalized()
			var slope := 1.0 - nn.y
			var cls := _c[py * width + px]
			# Sea cells keep their depth (never above the surface), so the shore slopes down under the
			# water instead of ending at a wall; deep water bottoms out where the sea shader goes opaque.
			var yv := h if cls != WATER else clampf(h, DEPTH_FLOOR, -1.0)
			pos.append(Vector3(top_left.x + px * step, yv, top_left.y + py * step))
			nrm.append(nn)
			col.append(_colour(cls, h, slope))
	for j in range(rows - 1):
		for i in range(cols - 1):
			var a := j * cols + i; var b := a + 1; var c := a + cols; var d := c + 1
			idx.append_array(PackedInt32Array([a, c, b, b, c, d]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = pos; arrays[Mesh.ARRAY_NORMAL] = nrm; arrays[Mesh.ARRAY_COLOR] = col; arrays[Mesh.ARRAY_INDEX] = idx
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return m

## Re-plant the forest around the focus when it has moved far enough.
func _update_trees() -> void:
	if focus.distance_to(_tree_focus) < TREE_RADIUS * 0.4:
		return
	_tree_focus = focus
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0; cone.bottom_radius = 2.2; cone.height = 11.0; cone.radial_segments = 6
	mm.mesh = cone
	var rng := RandomNumberGenerator.new()
	var xf: Array[Transform3D] = []
	var tint: Array[Color] = []
	var r := int(TREE_RADIUS / step)
	var gx0 := int((focus.x - global_position.x - top_left.x) / step); var gy0 := int((focus.z - global_position.z - top_left.y) / step)
	for gy in range(maxi(1, gy0 - r), mini(height - 1, gy0 + r)):
		for gx in range(maxi(1, gx0 - r), mini(width - 1, gx0 + r)):
			if _c[gy * width + gx] != 10:
				continue
			rng.seed = gy * 73856093 ^ gx * 19349663
			for k in range(2):  # two trees per 48 m cell: a hint of forest, not a census
				var wx := global_position.x + top_left.x + (gx + rng.randf()) * step
				var wz := global_position.z + top_left.y + (gy + rng.randf()) * step
				if Vector2(wx - focus.x, wz - focus.z).length() > TREE_RADIUS:
					continue
				var h := height_at(wx, wz)
				if h < 1.5:
					continue
				var s := rng.randf_range(0.7, 1.3)
				xf.append(Transform3D(Basis.from_euler(Vector3(0, rng.randf() * TAU, 0)).scaled(Vector3(s, s * rng.randf_range(0.9, 1.4), s)), Vector3(wx, h + 5.0 * s, wz)))
				tint.append(Color(0.05, 0.12, 0.06).lerp(Color(0.03, 0.08, 0.04), rng.randf()))
	mm.instance_count = xf.size()
	for i in range(xf.size()):
		mm.set_instance_transform(i, xf[i])
		mm.set_instance_color(i, tint[i])
	_trees.multimesh = mm
	_trees.material_override = _mat
