## Runs every opening scene headless for two seconds each and reports script errors.
##   godot --headless --path godot -s res://tests/debug_scenes.gd
extends SceneTree
var _order := ["title", "acknowledgment", "outfit", "ferry", "assemble", "school", "pack", "plan", "trip", "camp", "guide", "debrief"]
var _i := -1
var _f := 0
var _node: Node
func _process(_d: float) -> bool:
	_f += 1
	if _f % 120 == 1:
		if _node:
			_node.queue_free()
		_i += 1
		if _i >= _order.size():
			print("scenes ok")
			quit()
			return false
		var name: String = _order[_i]
		var app = root.get_node("App")
		app.sea_mode = name if name in ["school", "trip"] else "ambient"
		app.current = name
		print("--- scene ", name)
		_node = load(app.SCENES[name]).instantiate()
		root.add_child(_node)
	return false
