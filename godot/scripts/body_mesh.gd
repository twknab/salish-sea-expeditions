## A human figure as one smooth skinned mesh on a Skeleton3D, generated in code: every limb and the
## trunk are lofted tubes with elliptical sections and tapering radii, joints are blended between
## the two bones that meet there, and the whole thing deforms when the bones move. No boxes.
class_name BodyMesh
extends RefCounted

## Joint positions of the bind pose (metres, origin at the seat, +y up, −z forward), standing.
const JOINTS := {
	"hips": Vector3(0, 0.0, 0), "spine": Vector3(0, 0.12, 0), "chest": Vector3(0, 0.30, 0),
	"neck": Vector3(0, 0.50, 0.01), "head": Vector3(0, 0.58, 0.02), "head_top": Vector3(0, 0.80, 0.01),
	"shoulder_l": Vector3(-0.19, 0.46, 0), "elbow_l": Vector3(-0.21, 0.17, 0.0), "wrist_l": Vector3(-0.22, -0.09, 0.02), "hand_l": Vector3(-0.22, -0.19, 0.03),
	"shoulder_r": Vector3(0.19, 0.46, 0), "elbow_r": Vector3(0.21, 0.17, 0.0), "wrist_r": Vector3(0.22, -0.09, 0.02), "hand_r": Vector3(0.22, -0.19, 0.03),
	"hip_l": Vector3(-0.1, -0.02, 0), "knee_l": Vector3(-0.1, -0.44, 0.0), "ankle_l": Vector3(-0.1, -0.84, 0.0), "toe_l": Vector3(-0.1, -0.88, 0.14),
	"hip_r": Vector3(0.1, -0.02, 0), "knee_r": Vector3(0.1, -0.44, 0.0), "ankle_r": Vector3(0.1, -0.84, 0.0), "toe_r": Vector3(0.1, -0.88, 0.14),
}
## Bones: name, parent, from-joint, to-joint. Order matters: parents first.
const BONES := [
	["hips", "", "hips", "spine"], ["spine", "hips", "spine", "chest"], ["chest", "spine", "chest", "neck"],
	["neck", "chest", "neck", "head"], ["head", "neck", "head", "head_top"],
	["upper_arm_l", "chest", "shoulder_l", "elbow_l"], ["forearm_l", "upper_arm_l", "elbow_l", "wrist_l"], ["hand_l", "forearm_l", "wrist_l", "hand_l"],
	["upper_arm_r", "chest", "shoulder_r", "elbow_r"], ["forearm_r", "upper_arm_r", "elbow_r", "wrist_r"], ["hand_r", "forearm_r", "wrist_r", "hand_r"],
	["thigh_l", "hips", "hip_l", "knee_l"], ["shin_l", "thigh_l", "knee_l", "ankle_l"], ["foot_l", "shin_l", "ankle_l", "toe_l"],
	["thigh_r", "hips", "hip_r", "knee_r"], ["shin_r", "thigh_r", "knee_r", "ankle_r"], ["foot_r", "shin_r", "ankle_r", "toe_r"],
]

var skeleton: Skeleton3D
var mesh_instance: MeshInstance3D
var _bone_index := {}
# Mesh arrays: built by hand so every vertex carries an analytic normal and smooth shading survives
# the bone weights (SurfaceTool will not merge weighted vertices, so its normals come out faceted).
var _pos := PackedVector3Array()
var _nrm := PackedVector3Array()
var _col := PackedColorArray()
var _bon := PackedInt32Array()
var _wgt := PackedFloat32Array()
var _idx := PackedInt32Array()

## Build the skeleton and the mesh. `palette` gives colours by region: skin, suit, pfd, glove,
## boot, cap. `dress` 0..4 decides which regions exist. `legs` false hides the legs (under a deck).
func build(parent: Node3D, palette: Dictionary, dress: int, legs: bool) -> void:
	skeleton = Skeleton3D.new()
	skeleton.name = "Skeleton"
	parent.add_child(skeleton)
	for b in BONES:
		var i := skeleton.add_bone(b[0])
		_bone_index[b[0]] = i
		if b[1] != "":
			skeleton.set_bone_parent(i, _bone_index[b[1]])
	for b in BONES:
		var i: int = _bone_index[b[0]]
		var g := _bone_rest_global(b)
		var parent_g := Transform3D.IDENTITY if b[1] == "" else _bone_rest_global(_bone_by_name(b[1]))
		skeleton.set_bone_rest(i, parent_g.affine_inverse() * g)
		skeleton.set_bone_pose(i, parent_g.affine_inverse() * g)
	var suit: Color = palette.suit
	var skin: Color = palette.skin
	var gloves: Color = palette.glove if dress >= 4 else skin
	var boots: Color = palette.boot if dress >= 4 else skin
	# Trunk: hips → chest → neck, pear to broad shoulders; the PFD thickens it when worn.
	var pfd := dress >= 3
	_tube("hips", "spine", [[0.165, 0.11], [0.15, 0.105]], suit, 18, "", "spine")
	_tube("spine", "chest", [[0.15, 0.105], [0.17, 0.115]], palette.pfd if pfd else suit, 18, "hips", "chest", 1.2 if pfd else 1.0)
	_tube("chest", "neck", [[0.175, 0.12], [0.19, 0.11], [0.09, 0.07]], palette.pfd if pfd else suit, 18, "spine", "neck", 1.18 if pfd else 1.0, [0.0, 0.55, 1.0])
	if pfd:
		for s in ["l", "r"]:
			_blob(JOINTS["shoulder_" + s] * Vector3(0.78, 1.0, 1.0) + Vector3(0, 0.02, 0), Vector3(0.09, 0.05, 0.12), palette.pfd, "chest")
	_tube("neck", "head", [[0.052, 0.05], [0.058, 0.055]], palette.gasket if dress >= 2 else skin, 12, "chest", "head")
	# Head: skull, chin, nose, ears, eyes; cap and sunglasses on the water, hair otherwise.
	_blob(JOINTS.head + Vector3(0, 0.125, 0.0), Vector3(0.092, 0.118, 0.104), skin, "head")
	_blob(JOINTS.head + Vector3(0, 0.06, 0.025), Vector3(0.072, 0.07, 0.078), skin, "head")
	_blob(JOINTS.head + Vector3(0, 0.1, 0.1), Vector3(0.014, 0.018, 0.018), skin, "head")
	for s in [-1.0, 1.0]:
		_blob(JOINTS.head + Vector3(s * 0.092, 0.11, -0.005), Vector3(0.012, 0.022, 0.016), skin, "head")
		_blob(JOINTS.head + Vector3(s * 0.036, 0.135, 0.088), Vector3(0.011, 0.011, 0.007), Color(0.08, 0.07, 0.06), "head")
	if dress >= 4:
		_blob(JOINTS.head + Vector3(0, 0.137, 0.09), Vector3(0.082, 0.018, 0.022), palette.gasket, "head")
		_blob(JOINTS.head + Vector3(0, 0.175, -0.003), Vector3(0.097, 0.085, 0.108), palette.cap, "head")
		_blob(JOINTS.head + Vector3(0, 0.168, 0.085), Vector3(0.095, 0.01, 0.06), palette.cap, "head")
	else:
		_blob(JOINTS.head + Vector3(0, 0.172, -0.008), Vector3(0.095, 0.082, 0.106), palette.hair, "head")
	# Arms: shoulder ball, upper arm, elbow, forearm tapering to the wrist gasket, a hand.
	for s in ["l", "r"]:
		_blob(JOINTS["shoulder_" + s], Vector3(0.062, 0.062, 0.062), palette.pfd if pfd else suit, "upper_arm_" + s)
		_tube("shoulder_" + s, "elbow_" + s, [[0.055, 0.055], [0.045, 0.045]], suit, 12, "chest", "forearm_" + s)
		_blob(JOINTS["elbow_" + s], Vector3(0.046, 0.046, 0.046), suit, "forearm_" + s)
		_tube("elbow_" + s, "wrist_" + s, [[0.045, 0.045], [0.034, 0.03]], suit, 12, "upper_arm_" + s, "hand_" + s)
		_blob(JOINTS["wrist_" + s], Vector3(0.036, 0.018, 0.036), palette.gasket if dress >= 2 else skin, "hand_" + s)
		_tube("wrist_" + s, "hand_" + s, [[0.034, 0.024], [0.03, 0.016]], gloves, 10, "forearm_" + s, "")
	if legs:
		for s in ["l", "r"]:
			_tube("hip_" + s, "knee_" + s, [[0.085, 0.085], [0.06, 0.06]], suit, 12, "hips", "shin_" + s)
			_blob(JOINTS["knee_" + s], Vector3(0.06, 0.06, 0.06), suit, "shin_" + s)
			_tube("knee_" + s, "ankle_" + s, [[0.058, 0.058], [0.04, 0.042]], suit, 12, "thigh_" + s, "foot_" + s)
			_tube("ankle_" + s, "toe_" + s, [[0.045, 0.05], [0.04, 0.035]], boots, 10, "shin_" + s, "")
			_blob(JOINTS["ankle_" + s] + Vector3(0, -0.01, -0.03), Vector3(0.045, 0.04, 0.05), boots, "foot_" + s)
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = _pos
	arrays[Mesh.ARRAY_NORMAL] = _nrm
	arrays[Mesh.ARRAY_COLOR] = _col
	arrays[Mesh.ARRAY_BONES] = _bon
	arrays[Mesh.ARRAY_WEIGHTS] = _wgt
	arrays[Mesh.ARRAY_INDEX] = _idx
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh_instance = MeshInstance3D.new()
	mesh_instance.mesh = mesh
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.vertex_color_is_srgb = true
	mat.roughness = 0.65
	mesh_instance.material_override = mat
	mesh_instance.skin = skeleton.create_skin_from_rest_transforms()
	skeleton.add_child(mesh_instance)

func _vert(p: Vector3, n: Vector3, c: Color, bone: String, blend_bone: String, w: float) -> int:
	_pos.append(p)
	_nrm.append(n.normalized())
	_col.append(c)
	var bi: int = _bone_index[bone]
	if blend_bone == "" or w <= 0.001 or not _bone_index.has(blend_bone):
		_bon.append_array(PackedInt32Array([bi, 0, 0, 0]))
		_wgt.append_array(PackedFloat32Array([1.0, 0.0, 0.0, 0.0]))
	else:
		_bon.append_array(PackedInt32Array([bi, _bone_index[blend_bone], 0, 0]))
		_wgt.append_array(PackedFloat32Array([1.0 - w, w, 0.0, 0.0]))
	return _pos.size() - 1

func _quad(a: int, b: int, c: int, d: int) -> void:
	# a-b-c-d around the quad; two triangles, counter-clockwise seen from outside.
	_idx.append_array(PackedInt32Array([a, c, b, a, d, c]))

## A tube from joint `a` to joint `b` with elliptical radii per profile stop, weighted to the bone
## that spans it and blended into the neighbouring bones at its ends.
func _tube(a: String, b: String, profile: Array, color: Color, segs: int, prev_bone: String, next_bone: String, scale := 1.0, stops: Array = []) -> void:
	var bone := ""
	for bb in BONES:
		if bb[2] == a and bb[3] == b:
			bone = bb[0]
	if bone == "":
		return
	var pa: Vector3 = JOINTS[a]
	var pb: Vector3 = JOINTS[b]
	var f := BodyMesh.frame(pa, pb, Vector3.FORWARD)
	var len := pa.distance_to(pb)
	var rings := 6
	var ring_ids: Array = []
	for i in range(rings + 1):
		var t := float(i) / rings
		var rx := 0.0
		var rz := 0.0
		if stops.is_empty():
			var k := t * (profile.size() - 1)
			var j := clampi(int(floor(k)), 0, profile.size() - 2)
			var u := k - j
			rx = lerpf(profile[j][0], profile[j + 1][0], u)
			rz = lerpf(profile[j][1], profile[j + 1][1], u)
		else:
			var j := 0
			while j < stops.size() - 2 and t > stops[j + 1]:
				j += 1
			var u := clampf((t - stops[j]) / maxf(1e-4, stops[j + 1] - stops[j]), 0.0, 1.0)
			u = u * u * (3.0 - 2.0 * u)
			rx = lerpf(profile[j][0], profile[j + 1][0], u)
			rz = lerpf(profile[j][1], profile[j + 1][1], u)
		rx *= scale; rz *= scale
		var blend_bone := prev_bone if t < 0.5 else next_bone
		var w := 0.0
		if t < 0.2 and prev_bone != "":
			w = (0.2 - t) / 0.2 * 0.5
		elif t > 0.8 and next_bone != "":
			w = (t - 0.8) / 0.2 * 0.5
		var ids := PackedInt32Array()
		for s in range(segs + 1):
			var ang := TAU * (s % segs) / segs
			var local := Vector3(cos(ang) * rx, t * len, sin(ang) * rz)
			var n_local := Vector3(cos(ang) / maxf(rx, 1e-4), 0.0, sin(ang) / maxf(rz, 1e-4))
			ids.append(_vert(f * local, f.basis * n_local, color, bone, blend_bone, w))
		ring_ids.append(ids)
	for i in range(rings):
		for s in range(segs):
			_quad(ring_ids[i][s], ring_ids[i][s + 1], ring_ids[i + 1][s + 1], ring_ids[i + 1][s])

## An ellipsoid at a point, fully weighted to one bone (joints, head, nose, eyes, cap).
func _blob(center: Vector3, radii: Vector3, color: Color, bone: String) -> void:
	var lat := 8
	var lon := 14
	var grid: Array = []
	for i in range(lat + 1):
		var v := PI * i / lat
		var row := PackedInt32Array()
		for j in range(lon + 1):
			var u := TAU * (j % lon) / lon
			var d := Vector3(sin(v) * cos(u), cos(v), sin(v) * sin(u))
			var p := center + d * radii
			var n := Vector3(d.x / radii.x, d.y / radii.y, d.z / radii.z)
			row.append(_vert(p, n, color, bone, "", 0.0))
		grid.append(row)
	for i in range(lat):
		for j in range(lon):
			_quad(grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j])

func _bone_by_name(n: String) -> Array:
	for b in BONES:
		if b[0] == n:
			return b
	return []

## Rest transform of a bone: origin at its from-joint, +y along the bone.
func _bone_rest_global(b: Array) -> Transform3D:
	var a: Vector3 = JOINTS[b[2]]
	var c: Vector3 = JOINTS[b[3]]
	return BodyMesh.frame(a, c, Vector3.FORWARD)

## A transform at `origin` whose +y points at `target`; `ref` steadies the roll.
static func frame(origin: Vector3, target: Vector3, ref: Vector3) -> Transform3D:
	var y := (target - origin).normalized()
	if y.length() < 1e-5:
		y = Vector3.UP
	var r := ref
	if absf(r.normalized().dot(y)) > 0.95:
		r = Vector3.RIGHT
	var x := r.cross(y).normalized()
	var z := x.cross(y).normalized()
	return Transform3D(Basis(x, y, z), origin)

## Pose a chain of bones so that each joint sits at the given world position (skeleton space).
## `joints` maps joint names to positions; bones whose both joints are given are posed.
func pose(joints: Dictionary, ref: Vector3 = Vector3.FORWARD) -> void:
	for b in BONES:
		if joints.has(b[2]) and joints.has(b[3]):
			var i: int = _bone_index[b[0]]
			skeleton.set_bone_global_pose(i, BodyMesh.frame(joints[b[2]], joints[b[3]], ref))

func bone(name: String) -> int:
	return _bone_index.get(name, -1)
