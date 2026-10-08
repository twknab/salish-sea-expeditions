## Names floated over the land: a 2D label per place, placed each frame where its point projects,
## hidden behind the camera or beyond `reach`. Shared by the ferry's chart and the water scenes.
class_name PlaceLabels
extends Control

var reach := 16000.0
var _points: Dictionary = {}  # id -> Vector3
var _labels: Dictionary = {}  # id -> Label

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func add_place(id: String, text: String, world: Vector3, size := 13) -> void:
	var l := UIKit.label(text, size, UIKit.FOAM, false, true)
	l.add_theme_constant_override("outline_size", 6)
	l.add_theme_color_override("font_outline_color", Color(0.05, 0.09, 0.12, 0.85))
	l.visible = false
	add_child(l)
	l.reset_size()
	_labels[id] = l
	_points[id] = world

func update(cam: Camera3D) -> void:
	for id in _labels:
		var w: Vector3 = _points[id]
		var l: Label = _labels[id]
		var show := not cam.is_position_behind(w) and w.distance_to(cam.global_position) < reach
		l.visible = show
		if show:
			l.position = cam.unproject_position(w) - l.size * 0.5
