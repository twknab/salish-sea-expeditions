## Names floated over the land: a 2D label per place, placed each frame where its point projects,
## hidden behind the camera or beyond `reach`. Shared by the ferry's chart and the water scenes.
class_name PlaceLabels
extends Control

var reach := 16000.0
const TOP_BAND := 46.0  # the Title / Sound / Music chips: a name never sits under them
var avoid: Array = []  # controls the names stay off wherever they are this frame: a see-through panel, a card
var keep_out: Array[Rect2] = []  # screen rects the names stay off: the HUD's lines, the chart in the deck bag
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

## Nearer places win: a label that would sit on top of a nearer one stays hidden until it clears.
func update(cam: Camera3D) -> void:
	var order: Array = _labels.keys()
	order.sort_custom(func(a: String, b: String) -> bool: return _points[a].distance_to(cam.global_position) < _points[b].distance_to(cam.global_position))
	var taken: Array[Rect2] = keep_out.duplicate()
	avoid = avoid.filter(func(c: Variant) -> bool: return is_instance_valid(c))  # a card replaced is a card freed
	for c in avoid:
		if (c as Control).is_visible_in_tree():
			taken.append((c as Control).get_global_rect())
	var screen := get_viewport_rect().grow_individual(0.0, -TOP_BAND, 0.0, 0.0)  # whole names only, below the chips
	for id in order:
		var w: Vector3 = _points[id]
		var l: Label = _labels[id]
		var show := not cam.is_position_behind(w) and w.distance_to(cam.global_position) < reach
		if show:
			var at := cam.unproject_position(w) - l.size * 0.5
			var rect := Rect2(at, l.size).grow(2.0)
			show = screen.encloses(rect)
			for t in taken:
				if t.intersects(rect):
					show = false
					break
			if show:
				l.position = at
				taken.append(rect)
		l.visible = show
