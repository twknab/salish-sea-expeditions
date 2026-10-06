## A chase camera that stays level, follows the kayak from behind and above, and looks a little
## ahead of it so the water the paddler is reading fills the portrait frame.
class_name CameraRig
extends Node3D

@export var target_path: NodePath
var _target: Node3D
var _cam: Camera3D
var _fwd := Vector3.FORWARD

func _ready() -> void:
	_target = get_node(target_path)
	_cam = Camera3D.new()
	_cam.fov = 58.0
	_cam.near = 0.2
	_cam.far = 1200.0
	add_child(_cam)
	_snap()

func _snap() -> void:
	_fwd = -_target.global_basis.z
	_fwd.y = 0.0
	_fwd = _fwd.normalized()
	global_position = _target.global_position - _fwd * 7.5 + Vector3.UP * 4.0
	_look()

func _look() -> void:
	_cam.global_position = global_position
	_cam.look_at(_target.global_position + _fwd * 3.0 + Vector3.UP * 0.6, Vector3.UP)

func _process(delta: float) -> void:
	var f := -_target.global_basis.z
	f.y = 0.0
	if f.length() > 0.01:
		_fwd = _fwd.slerp(f.normalized(), minf(1.0, delta * 2.2)).normalized()
	var want := _target.global_position - _fwd * 7.5 + Vector3.UP * 4.0
	want.y = maxf(want.y, 2.6)
	global_position = global_position.lerp(want, minf(1.0, delta * 3.0))
	_look()
