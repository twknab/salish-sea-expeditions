## The chart of the whole expedition, for the debrief: the islands from the same height texture the
## water reads, the three legs' tracks, the camps, and a numbered mark where each field note was
## said. The window is the legs' own extent with a margin, so nothing is cropped.
class_name ExpeditionChart
extends Control

const MARGIN_M := 1500.0

var terrain: Terrain
var legs: Array = []          # the legs, with waypoints
var marks: Array = []         # [{x, z, n}] — numbered marks, in the order of the notes
var camps: Array[Vector3] = []
var _paper: ColorRect
var _mat: ShaderMaterial
var _view := Vector4.ZERO

## The window that holds every leg, in the tile's shape.
static func view_for(all_legs: Array, tile: Vector2) -> Vector4:
	var lo := Vector2(INF, INF)
	var hi := Vector2(-INF, -INF)
	for leg in all_legs:
		for w in Leg.waypoints(leg):
			lo = Vector2(minf(lo.x, w.x), minf(lo.y, w.z))
			hi = Vector2(maxf(hi.x, w.x), maxf(hi.y, w.z))
	if not is_finite(lo.x):
		return Vector4(-10000, -14000, 16000, 10000)
	lo -= Vector2.ONE * MARGIN_M
	hi += Vector2.ONE * MARGIN_M
	var w := hi.x - lo.x
	var h := hi.y - lo.y
	var want := tile.y / maxf(tile.x, 1.0)
	if h / w < want:  # taller than the land asks: pad the height
		var nh := w * want
		lo.y -= (nh - h) * 0.5
		h = nh
	else:
		var nw := h / want
		lo.x -= (nw - w) * 0.5
		w = nw
	return Vector4(lo.x, lo.y, w, h)

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip_contents = true
	_paper = ColorRect.new()
	_paper.show_behind_parent = true
	_paper.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_paper.set_anchors_preset(Control.PRESET_FULL_RECT)
	_mat = ShaderMaterial.new()
	_mat.shader = load("res://shaders/chart.gdshader")
	_mat.set_shader_parameter("depth_map", Terrain.height_texture())
	_paper.material = _mat
	add_child(_paper)
	resized.connect(queue_redraw)

func _to_tile(world: Vector3) -> Vector2:
	return Vector2((world.x - _view.x) / _view.z * size.x, (world.z - _view.y) / _view.w * size.y)

func _draw() -> void:
	if terrain == null:
		return
	_view = view_for(legs, size)
	_mat.set_shader_parameter("map_rect", terrain.map_rect())
	_mat.set_shader_parameter("view_rect", _view)
	var font := UIKit.bold()
	# The legs, dashed in the plan's yellow, and the camps as rings.
	for leg in legs:
		var w := Leg.waypoints(leg)
		for i in range(1, w.size()):
			draw_dashed_line(_to_tile(w[i - 1]), _to_tile(w[i]), Color(UIKit.SUN, 0.9), 2.0, 7.0, true, true)
	for c in camps:
		draw_arc(_to_tile(c), 6.0, 0.0, TAU, 24, UIKit.SUN, 2.0, true)
	# The field notes: a numbered dot where each was said.
	for m in marks:
		var p := _to_tile(Vector3(float(m.x), 0.0, float(m.z)))
		draw_circle(p, 8.0, Color(0.05, 0.1, 0.12, 0.9))
		draw_circle(p, 6.5, UIKit.FOAM)
		var label := str(m.n)
		draw_string(font, p + Vector2(-3.5 * label.length(), 3.5), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.05, 0.1, 0.12))
	draw_string(font, Vector2(size.x - 14, 14), "N", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.1, 0.12, 0.14, 0.9))
	draw_line(Vector2(size.x - 9, 17), Vector2(size.x - 9, 27), Color(0.1, 0.12, 0.14, 0.9), 1.5)
	var km := 5000.0 / _view.z * size.x
	draw_line(Vector2(8, size.y - 8), Vector2(8 + km, size.y - 8), Color(0.1, 0.12, 0.14, 0.9), 2.0)
	draw_string(font, Vector2(8, size.y - 11), "5 km", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.1, 0.12, 0.14, 0.9))
	draw_rect(Rect2(Vector2.ZERO, size).grow(-0.5), Color(0.85, 0.9, 0.92, 0.5), false, 1.0)
