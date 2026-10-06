extends SceneTree
var _f := 0
var _node: Node
func _process(_d: float) -> bool:
	_f += 1
	if _f == 1:
		_node = load("res://scenes/outfit.tscn").instantiate()
		root.add_child(_node)
	if _f == 30:
		_node._page = 3
		_node._show()
	if _f == 60:
		var fig: Node3D = _node._figure
		var cam: Camera3D = _node._cam
		print("figure children=", fig.get_child_count(), " visible=", fig.is_visible_in_tree(), " pos=", fig.global_position, " head=", fig.global_position + fig.anchors.head)
		print("cam=", cam.global_position, " in_frustum=", cam.is_position_in_frustum(fig.global_position + fig.anchors.head), " unproj=", cam.unproject_position(fig.global_position + fig.anchors.head))
		for c in fig.get_children():
			if c is MeshInstance3D:
				print("  ", c.mesh.get_class(), " at ", c.global_position)
				break
		quit()
	return false
