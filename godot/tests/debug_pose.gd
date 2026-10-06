## Prints the kayak's pose over the first seconds, headless, to see whether it floats.
##   godot --headless --path godot -s res://tests/debug_pose.gd
extends SceneTree
var _f := 0
var _scene: Node
func _init() -> void:
	_scene = load("res://scenes/sea.tscn").instantiate()
	root.add_child(_scene)
func _process(_d: float) -> bool:
	_f += 1
	if _f % 60 == 0:
		var k: Node3D = _scene.get_node("Kayak")
		var cam: Node3D = _scene.get_node("CameraRig")
		print("t=%ds pos=%s up=%s fwd=%s cam=%s" % [_f / 60, k.global_position, k.global_basis.y, -k.global_basis.z, cam.global_position])
	if _f >= 720:
		quit()
	return false
