## The paddler: one skinned mesh on a skeleton (BodyMesh), dressed for immersion by layer, posed
## every tick — torso winding and unwinding through the stroke, arms solved by two-bone IK onto a
## lofted Greenland paddle, head countering the torso, the body leaning into an edge.
## `dress` 0..4 picks the layers for the outfitting screens; `standing` shows the legs.
class_name Paddler
extends Node3D

@export var dress := 4
@export var standing := false
var who_override: Dictionary = {}   # a look other than the player's (the partner wears one)

const PADDLE_LEN := 2.2
const HAND := 0.33
const UPPER := 0.292   # shoulder → elbow, from BodyMesh.JOINTS
const FORE := 0.262    # elbow → wrist
const HANDLEN := 0.10  # wrist → hand

var anchors := {}
var _body: BodyMesh
var _rig: Node3D
var _paddle: Node3D
var _skirt: MeshInstance3D
var _phase := 1.0
var _side := 1
var _kind := "forward"
var _edge := 0.0

static func _mat(c: Color, rough := 0.7) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	return m

func _ready() -> void:
	build()

func build() -> void:
	for c in get_children():
		c.queue_free()
	var suit_color: Color = [Color("8a98a8"), Color("1c2f4a"), Color("1f6f78"), Color("1f6f78"), Color("1f6f78")][clampi(dress, 0, 4)]
	var who := who_override if not who_override.is_empty() else _who()
	var palette := {
		"skin": who.skin, "suit": suit_color, "pfd": who.pfd, "gasket": Color("151718"),
		"glove": Color("1a1d20"), "boot": Color("1a1d20"), "cap": Color("1a1d20"), "hair": who.hair, "style": who.style,
	}
	_rig = Node3D.new()
	_rig.position = Vector3(0, 0.9 * who.scale if standing else 0.0, 0)
	_rig.scale = Vector3.ONE * who.scale
	add_child(_rig)
	_body = BodyMesh.new()
	_body.build(_rig, palette, dress, standing)
	if not standing:
		# The spray-skirt tunnel (or the suit at the waist before the skirt goes on), lofted, not a box.
		_skirt = MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.165; cm.bottom_radius = 0.31; cm.height = 0.2; cm.radial_segments = 24
		_skirt.mesh = cm
		_skirt.material_override = _mat(Color("1a1d20") if dress >= 3 else suit_color, 0.55)
		_skirt.position = Vector3(0, 0.02, 0)
		add_child(_skirt)
	_paddle = Node3D.new()
	_paddle.position = Vector3(0, 0.46, 0.08)
	add_child(_paddle)
	if not standing:
		var pm := MeshInstance3D.new()
		pm.mesh = Paddler.greenland_paddle()
		pm.material_override = _mat(Color("b98a52"), 0.5)
		_paddle.add_child(pm)
	advance(0.0, 0.0)

## Who this is, from the App autoload when there is one; the headless tests build a paddler with no
## App, and get the default look.
static func _who() -> Dictionary:
	var ml := Engine.get_main_loop()
	var app: Node = ml.root.get_node_or_null("App") if ml is SceneTree else null
	if app and app.has_method("paddler"):
		return app.paddler()
	return { "skin": Color("c9a07a"), "hair": Color("4a3626"), "style": "short", "scale": 1.0, "pfd": Color("f2d016") }

## A Greenland paddle lofted along x: round loom, shoulders, long lens-section blades to thin tips.
static func greenland_paddle() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	# [x, half-width (z), half-thickness (y)] from the centre outward; mirrored for the other blade.
	var prof := [[0.0, 0.017, 0.017], [0.25, 0.017, 0.017], [0.29, 0.03, 0.022], [0.36, 0.034, 0.014], [0.7, 0.042, 0.011], [1.0, 0.044, 0.009], [1.08, 0.036, 0.005], [1.1, 0.004, 0.003]]
	var segs := 14
	for side in [-1.0, 1.0]:
		var rings: Array = []
		for p in prof:
			var ring := PackedVector3Array()
			for s in range(segs):
				var a := TAU * s / segs
				# A lens: the ellipse is pinched toward the edges so the blade reads as carved cedar.
				var w: float = p[1] * cos(a)
				var h: float = p[2] * sin(a) * (0.55 + 0.45 * absf(cos(a))) if p[0] > 0.3 else p[2] * sin(a)
				ring.append(Vector3(side * p[0], h, w))
			rings.append(ring)
		for i in range(rings.size() - 1):
			for s in range(segs):
				var s2 := (s + 1) % segs
				var a: Vector3 = rings[i][s]; var b: Vector3 = rings[i][s2]; var c: Vector3 = rings[i + 1][s2]; var d: Vector3 = rings[i + 1][s]
				if side > 0:
					st.add_vertex(a); st.add_vertex(c); st.add_vertex(b)
					st.add_vertex(a); st.add_vertex(d); st.add_vertex(c)
				else:
					st.add_vertex(a); st.add_vertex(b); st.add_vertex(c)
					st.add_vertex(a); st.add_vertex(c); st.add_vertex(d)
	st.index()
	st.generate_normals()
	return st.commit()

func begin_stroke(side: int, kind: String) -> void:
	_side = side
	_kind = kind
	_phase = 0.0

## Per tick. The stroke plays over 0.9 s; `edge` leans the body over the boat.
func advance(delta: float, edge: float) -> void:
	if _body == null:
		return
	_edge = edge
	_phase = minf(1.0, _phase + delta / 0.9)
	var p := _phase
	var swing := sin(p * PI)
	var fwd_kind := _kind != "reverse"
	var wind := 0.0
	if p < 1.0:
		wind = ((0.5 - 1.0 * p) if fwd_kind else (-0.5 + 1.0 * p)) * (1.0 if _kind == "forward" else 0.65)
	# The torso: yaw from the wind-up, a slight forward lean (sitting tall), roll into the edge.
	var yaw := _side * wind
	var lean := -0.1 - 0.06 * swing
	var roll := -edge * 0.14
	if standing:
		yaw = 0.0; lean = 0.0; roll = 0.0
	var tb := Basis.from_euler(Vector3(lean, yaw, roll))
	var jt := BodyMesh.JOINTS
	var hips: Vector3 = jt.hips
	var joints := {}
	for k in ["hips", "spine", "chest", "neck", "head", "shoulder_l", "shoulder_r"]:
		joints[k] = hips + tb * (jt[k] - hips)
	# The head counters the torso, eyes forward.
	var hb := Basis.from_euler(Vector3(lean * 0.5, yaw * 0.4, roll * 0.5))
	joints["head_top"] = joints.head + hb * (jt.head_top - jt.head)
	# The paddle: the stroke-side blade dips and travels from the feet back to the hip.
	var dip := _side * 0.62 * swing
	var travel := (0.6 - 1.2 * p) if fwd_kind else (-0.6 + 1.2 * p)
	if _kind == "sweep":
		travel *= 1.5
		dip *= 0.5
	if p >= 1.0:
		travel = 0.0; dip = 0.0
	_paddle.rotation = Vector3(0.0, _side * travel, dip)
	_paddle.position = Vector3(-_side * 0.12 * swing, 0.46 + 0.04 * swing, (0.08 - 0.22 * swing) if fwd_kind else (0.08 + 0.2 * swing))
	# Arms: hands on the loom (or hanging, standing), elbows down and out by IK.
	for s in ["l", "r"]:
		var sg := -1.0 if s == "l" else 1.0
		var shoulder: Vector3 = joints["shoulder_" + s]
		var target: Vector3
		if standing:
			target = Vector3(sg * 0.25, -0.1, 0.1)
		else:
			target = _rig.to_local(_paddle.to_global(Vector3(sg * HAND, 0.0, 0.0)))
		var pole := Vector3(sg * 0.7, -0.4, -0.3) if not standing else Vector3(sg * 0.4, -0.1, -0.8)
		var elbow := IK.two_bone(shoulder, target, UPPER, FORE + HANDLEN, pole)
		var dir := (target - elbow).normalized()
		joints["elbow_" + s] = elbow
		joints["wrist_" + s] = elbow + dir * FORE
		joints["hand_" + s] = elbow + dir * (FORE + HANDLEN)
	if standing:
		for k in ["hip_l", "knee_l", "ankle_l", "toe_l", "hip_r", "knee_r", "ankle_r", "toe_r"]:
			joints[k] = jt[k]
	_body.pose(joints)
	# Named points for Kayak School's camera, in the paddler's space.
	var pl := _paddle.position
	anchors = {
		"feet": Vector3(0, 0.08, -0.9) if not standing else _rig.position + jt.toe_l,
		"knees": Vector3(0.12, 0.25, -0.55) if not standing else _rig.position + jt.knee_r,
		"hips": _rig.position + joints.hips + Vector3(0, 0.1, 0),
		"back": _rig.position + joints.spine + Vector3(0, 0.1, -0.16),
		"head": _rig.position + joints.head + Vector3(0, 0.12, 0),
		"blade": pl + Vector3(-PADDLE_LEN * 0.37, 0, 0),
		"loom": pl,
		"shoulder": pl + Vector3(PADDLE_LEN * 0.245, 0, 0),
		"tip": pl + Vector3(PADDLE_LEN * 0.5, 0, 0),
		"box": _rig.position + joints.chest + Vector3(0, 0.05, 0.25),
	}
