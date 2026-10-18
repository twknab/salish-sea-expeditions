class_name NavBuoy
extends Node3D
## A red nun buoy marking the channel into Friday Harbor. "Red, right, returning": coming in from
## sea, keep the red marks on your right; going out, on your left. A kayak keeps to the edge of the
## channel the marks define, out of the way of what needs the deep water. The note is static, for the
## tests; the buoy rides the swell.

signal said(text: String)

const AT := Vector3(760.0, 0.0, -1180.0)  # just to the right of the line home as it comes into the harbour
const NEAR_M := 70.0

var _kayak: Node3D
var _sea: Node             # the Seascape, untyped so this script loads without the autoloads it reads
var _returning := false
var _said := false

## The note for passing the mark, coming home or heading out.
static func note(returning: bool) -> String:
	if returning:
		return "A red nun: red, right, returning. Coming in from sea, the red marks stay on your right. Keep to the edge of the channel they make."
	return "A red nun marks the harbour channel. Red, right, returning: heading out, the reds are on your left. Keep to the channel's edge."

func setup(kayak: Node3D, sea: Node, returning: bool) -> void:
	_kayak = kayak
	_sea = sea
	_returning = returning
	global_position = AT
	var red := StandardMaterial3D.new()
	red.albedo_color = Color(0.78, 0.12, 0.1)
	red.roughness = 0.7
	var body := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.55
	cyl.bottom_radius = 0.55
	cyl.height = 1.1
	body.mesh = cyl
	body.material_override = red
	body.position.y = 0.45
	add_child(body)
	var nun := MeshInstance3D.new()  # a nun's pointed top
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.55
	cone.height = 0.7
	nun.mesh = cone
	nun.material_override = red
	nun.position.y = 1.35
	add_child(nun)

func _process(_delta: float) -> void:
	if _kayak == null:
		return
	global_position.y = float(_sea.height_at(global_position.x, global_position.z))
	if not _said and Vector2(_kayak.global_position.x - AT.x, _kayak.global_position.z - AT.z).length() < NEAR_M:
		_said = true
		said.emit(note(_returning))
