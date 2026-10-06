## One camera, three manners: chase (behind and above the kayak, level, looking a little ahead),
## orbit (the title screen's slow circle), and focus (Kayak School's close looks at a named part).
class_name CameraRig
extends Node3D

@export var target_path: NodePath
var mode := "chase"
var _target: Node3D
var _cam: Camera3D
var _fwd := Vector3.FORWARD
var _orbit_a := 0.0
var _focus_point := Vector3.ZERO
var _focus_from := Vector3.ZERO
var _focus_t := 1.0
var _want_pos := Vector3.ZERO
var _want_look := Vector3.ZERO

func _ready() -> void:
	_target = get_node(target_path)
	_cam = Camera3D.new()
	_cam.fov = 58.0
	_cam.near = 0.1
	_cam.far = 1500.0
	add_child(_cam)
	_fwd = _flat_forward()
	global_position = _target.global_position - _fwd * 7.5 + Vector3.UP * 4.0
	_cam.global_position = global_position
	_cam.look_at(_target.global_position + _fwd * 3.0 + Vector3.UP * 0.6, Vector3.UP)

func camera_position() -> Vector3:
	return _cam.global_position

func _flat_forward() -> Vector3:
	var f := -_target.global_basis.z
	f.y = 0.0
	return f.normalized() if f.length() > 0.01 else _fwd

## Look at a point in the target's local space from `dist` metres, at azimuth `az` (radians from
## the stern) and elevation `el`. The move eases over half a second.
func focus(local_point: Vector3, dist: float, az: float, el: float) -> void:
	mode = "focus"
	_focus_point = local_point
	_focus_from = _cam.global_position
	_focus_t = 0.0
	var fwd := -_target.global_basis.z
	var right := _target.global_basis.x
	var dir := (-fwd * cos(az) + right * sin(az)) * cos(el) + Vector3.UP * sin(el)
	_want_pos = _target.to_global(local_point) + dir.normalized() * dist
	_want_look = _target.to_global(local_point)

func chase() -> void:
	mode = "chase"

func orbit() -> void:
	mode = "orbit"

func _process(delta: float) -> void:
	match mode:
		"chase":
			_fwd = _fwd.slerp(_flat_forward(), minf(1.0, delta * 2.2)).normalized()
			var want := _target.global_position - _fwd * 7.5 + Vector3.UP * 4.0
			want.y = maxf(want.y, 2.6)
			global_position = global_position.lerp(want, minf(1.0, delta * 3.0))
			_cam.global_position = global_position
			_cam.look_at(_target.global_position + _fwd * 3.0 + Vector3.UP * 0.6, Vector3.UP)
		"orbit":
			_orbit_a += delta * 0.07
			var want := _target.global_position + Vector3(cos(_orbit_a) * 9.0, 3.2, sin(_orbit_a) * 9.0)
			global_position = global_position.lerp(want, minf(1.0, delta * 2.0))
			_cam.global_position = global_position
			_cam.look_at(_target.global_position + Vector3.UP * 0.4, Vector3.UP)
		"focus":
			_focus_t = minf(1.0, _focus_t + delta / 0.55)
			var k := _focus_t * _focus_t * (3.0 - 2.0 * _focus_t)
			_cam.global_position = _focus_from.lerp(_want_pos, k)
			_cam.look_at(_want_look, Vector3.UP)
			global_position = _cam.global_position
