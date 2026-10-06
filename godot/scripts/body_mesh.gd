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
var _st: SurfaceTool
var _bone_index := {}

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
	_st = SurfaceTool.new()
	_st.begin(Mesh.PRIMITIVE_TRIANGLES)
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
		# Shoulder yokes of the PFD, a thin band over each shoulder.
		for s in ["l", "r"]:
			_blob(JOINTS["shoulder_" + s] * Vector3(0.78, 1.0, 1.0) + Vector3(0, 0.02, 0), Vector3(0.09, 0.05, 0.12), palette.pfd, "chest")
	_tube("neck", "head", [[0.052, 0.05], [0.058, 0.055]], palette.gasket if dress >= 2 else skin, 12, "chest", "head")
	# Head: skull as an ellipsoid loft, a jaw, a nose; cap or hair on top.
	_blob(JOINTS.head + Vector3(0, 0.12, 0), Vector3(0.095, 0.115, 0.105), skin, "head")
	_blob(JOINTS.head + Vector3(0, 0.055, 0.03), Vector3(0.07, 0.065, 0.075), skin, "head")
	_blob(JOINTS.head + Vector3(0, 0.1, 0.105), Vector3(0.016, 0.02, 0.02), skin, "head")
	for s in [-1.0, 1.0]:
		_blob(JOINTS.head + Vector3(s * 0.038, 0.135, 0.085), Vector3(0.012, 0.012, 0.008), Color(0.08, 0.07, 0.06), "head")
	if dress >= 4:
		_blob(JOINTS.head + Vector3(0, 0.135, 0.095), Vector3(0.085, 0.02, 0.02), palette.gasket, "head")  # sunglasses
		_blob(JOINTS.head + Vector3(0, 0.185, -0.005), Vector3(0.1, 0.075, 0.108), palette.cap, "head")   # neoprene cap
		_blob(JOINTS.head + Vector3(0, 0.18, 0.08), Vector3(0.1, 0.012, 0.07), palette.cap, "head")      # brim
	else:
		_blob(JOINTS.head + Vector3(0, 0.185, -0.01), Vector3(0.098, 0.07, 0.106), palette.hair, "head")
	# Arms: shoulder ball, upper arm, elbow, forearm tapering to the wrist gasket, a hand.
	for s in ["l", "r"]:
		_blob(JOINTS["shoulder_" + s], Vector3(0.062, 0.062, 0.062), palette.pfd if pfd else suit, "upper_arm_" + s)
		_tube("shoulder_" + s, "elbow_" + s, [[0.055, 0.055], [0.045, 0.045]], suit, 12, "chest", "forearm_" + s)
		_blob(JOINTS["elbow_" + s], Vector3(0.046, 0.046, 0.046), suit, "forearm_" + s)
		_tube("elbow_" + s, "wrist_" + s, [[0.045, 0.045], [0.034, 0.03]], suit, 12, "upper_arm_" + s, "hand_" + s)
		_blob(JOINTS["wrist_" + s], Vector3(0.036, 0.018, 0.036), palette.gasket if dress >= 2 else skin, "hand_" + s)
		_tube("wrist_" + s, "hand_" + s, [[0.034, 0.024], [0.03, 0.016]], gloves, 10, "forearm_" + s, "")
	# Legs, when they are to be seen.
	if legs:
		for s in ["l", "r"]:
			_tube("hip_" + s, "knee_" + s, [[0.085, 0.085], [0.06, 0.06]], suit, 12, "hips", "shin_" + s)
			_blob(JOINTS["knee_" + s], Vector3(0.06, 0.06, 0.06), suit, "shin_" + s)
			_tube("knee_" + s, "ankle_" + s, [[0.058, 0.058], [0.04, 0.042]], suit, 12, "thigh_" + s, "foot_" + s)
			_tube("ankle_" + s, "toe_" + s, [[0.045, 0.05], [0.04, 0.035]], boots, 10, "shin_" + s, "")
			_blob(JOINTS["ankle_" + s] + Vector3(0, -0.01, -0.03), Vector3(0.045, 0.04, 0.05), boots, "foot_" + s)
	_st.generate_normals()
	_st.index()
	var mesh := _st.commit()
	mesh_instance = MeshInstance3D.new()
	mesh_instance.mesh = mesh
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.vertex_color_is_srgb = true
	mat.roughness = 0.65
	mesh_instance.material_override = mat
	mesh_instance.skin = skeleton.create_skin_from_rest_transforms()
	skeleton.add_child(mesh_instance)

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

func _weights(bone: String, blend_bone: String, w: float) -> void:
	var bi: int = _bone_index[bone]
	if blend_bone == "" or w <= 0.001 or not _bone_index.has(blend_bone):
		_st.set_bones(PackedInt32Array([bi, 0, 0, 0]))
		_st.set_weights(PackedFloat32Array([1.0, 0.0, 0.0, 0.0]))
	else:
		_st.set_bones(PackedInt32Array([bi, _bone_index[blend_bone], 0, 0]))
		_st.set_weights(PackedFloat32Array([1.0 - w, w, 0.0, 0.0]))

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
	var ring_pts: Array = []
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
		var pts := PackedVector3Array()
		for s in range(segs):
			var ang := TAU * s / segs
			pts.append(f * Vector3(cos(ang) * rx, t * len, sin(ang) * rz))
		ring_pts.append({ "pts": pts, "t": t })
	for i in range(rings):
		var r0: Dictionary = ring_pts[i]
		var r1: Dictionary = ring_pts[i + 1]
		for s in range(segs):
			var s2 := (s + 1) % segs
			var quad := [[r0, s], [r1, s2], [r0, s2], [r0, s], [r1, s], [r1, s2]]
			for q in quad:
				var ring: Dictionary = q[0]
				var t: float = ring.t
				var blend_bone := prev_bone if t < 0.5 else next_bone
				var w := 0.0
				if t < 0.2 and prev_bone != "":
					w = (0.2 - t) / 0.2 * 0.5
				elif t > 0.8 and next_bone != "":
					w = (t - 0.8) / 0.2 * 0.5
				_weights(bone, blend_bone, w)
				_st.set_color(color)
				_st.add_vertex(ring.pts[q[1]])

## An ellipsoid at a point, fully weighted to one bone (joints, head, nose, eyes, cap).
func _blob(center: Vector3, radii: Vector3, color: Color, bone: String) -> void:
	var lat := 7
	var lon := 12
	var grid: Array = []
	for i in range(lat + 1):
		var v := PI * i / lat
		var row := PackedVector3Array()
		for j in range(lon):
			var u := TAU * j / lon
			row.append(center + Vector3(sin(v) * cos(u) * radii.x, cos(v) * radii.y, sin(v) * sin(u) * radii.z))
		grid.append(row)
	_weights(bone, "", 0.0)
	_st.set_color(color)
	for i in range(lat):
		for j in range(lon):
			var j2 := (j + 1) % lon
			var a: Vector3 = grid[i][j]; var b: Vector3 = grid[i + 1][j]; var c: Vector3 = grid[i + 1][j2]; var d: Vector3 = grid[i][j2]
			_weights(bone, "", 0.0); _st.set_color(color); _st.add_vertex(a)
			_weights(bone, "", 0.0); _st.set_color(color); _st.add_vertex(c)
			_weights(bone, "", 0.0); _st.set_color(color); _st.add_vertex(b)
			_weights(bone, "", 0.0); _st.set_color(color); _st.add_vertex(a)
			_weights(bone, "", 0.0); _st.set_color(color); _st.add_vertex(d)
			_weights(bone, "", 0.0); _st.set_color(color); _st.add_vertex(c)

## Pose a chain of bones so that each joint sits at the given world position (skeleton space).
## `joints` maps joint names to positions; bones whose both joints are given are posed.
func pose(joints: Dictionary, ref: Vector3 = Vector3.FORWARD) -> void:
	for b in BONES:
		if joints.has(b[2]) and joints.has(b[3]):
			var i: int = _bone_index[b[0]]
			skeleton.set_bone_global_pose(i, BodyMesh.frame(joints[b[2]], joints[b[3]], ref))

func bone(name: String) -> int:
	return _bone_index.get(name, -1)
