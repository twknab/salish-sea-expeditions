## The chart in the deck bag: a small north-up window of the real islands around the boat, with
## the leg's track, the cove, and the boat as an arrow. Drawn from the terrain's height texture by
## chart.gdshader, so it is the same islands the water is reading. Tap or click it (or press M) to
## fold it down to a corner mark; tap again to open it.
class_name ChartTile
extends Control

const SPAN_M := 6000.0        # metres across the open tile
const OPEN := Vector2(168, 168)
const FOLDED := Vector2(44, 44)

var terrain: Terrain
var route: Array[Vector3] = []
var dest := Vector3.ZERO
var boat := Vector3.ZERO
var heading := 0.0            # radians, 0 north, clockwise
var blind := false            # in fog: no fix — the arrow is hollow and the tile says so
var folded := false:
	set(v):
		folded = v
		_apply_size()

var _paper: ColorRect
var _mat: ShaderMaterial

## Where a world point lands on a tile of `size` showing `view` (x0, z0, width, height in metres).
static func to_tile(world: Vector3, view: Vector4, tile: Vector2) -> Vector2:
	return Vector2((world.x - view.x) / view.z * tile.x, (world.z - view.y) / view.w * tile.y)

## The window around the boat: SPAN_M across, as many metres tall as the tile's shape asks.
static func view_for(centre: Vector3, tile: Vector2) -> Vector4:
	var w := SPAN_M
	var h := SPAN_M * (tile.y / maxf(tile.x, 1.0))
	return Vector4(centre.x - w * 0.5, centre.z - h * 0.5, w, h)

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	clip_contents = true
	_paper = ColorRect.new()
	_paper.show_behind_parent = true  # the track and the boat draw over the paper
	_paper.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_paper.set_anchors_preset(Control.PRESET_FULL_RECT)
	_mat = ShaderMaterial.new()
	_mat.shader = load("res://shaders/chart.gdshader")
	_mat.set_shader_parameter("depth_map", Terrain.height_texture())
	_paper.material = _mat
	add_child(_paper)
	_apply_size()

func _apply_size() -> void:
	custom_minimum_size = FOLDED if folded else OPEN
	size = custom_minimum_size
	if _paper:
		_paper.visible = not folded
	queue_redraw()

func _gui_input(ev: InputEvent) -> void:
	if (ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed) or (ev is InputEventScreenTouch and ev.pressed):
		folded = not folded
		accept_event()

func _process(_d: float) -> void:
	if folded or terrain == null:
		return
	_mat.set_shader_parameter("map_rect", terrain.map_rect())
	_mat.set_shader_parameter("view_rect", view_for(boat, size))
	queue_redraw()

func _draw() -> void:
	if folded:
		# A corner mark: a small folded chart, so the tile still reads as something to open.
		draw_rect(Rect2(Vector2.ZERO, size), Color(0.04, 0.08, 0.1, 0.72))
		draw_rect(Rect2(Vector2.ZERO, size).grow(-1), Color(0.85, 0.9, 0.92, 0.5), false, 1.5)
		var m := size * 0.5
		draw_rect(Rect2(m - Vector2(11, 8), Vector2(22, 16)), Color(0.9, 0.86, 0.72, 0.9))
		draw_line(m - Vector2(4, 8), m + Vector2(-4, 8), Color(0.2, 0.3, 0.35, 0.8), 1.0)
		draw_line(m + Vector2(4, -8), m + Vector2(4, 8), Color(0.2, 0.3, 0.35, 0.8), 1.0)
		draw_polyline(PackedVector2Array([m + Vector2(-9, 4), m + Vector2(-2, -3), m + Vector2(3, 2), m + Vector2(9, -5)]), Color(0.95, 0.82, 0.1, 0.95), 1.5)
		return
	var view := view_for(boat, size)
	var clip := Rect2(Vector2.ZERO, size)
	# The track, dashed in the plan's yellow; the cove as a ring.
	for i in range(1, route.size()):
		var a := to_tile(route[i - 1], view, size)
		var b := to_tile(route[i], view, size)
		if clip.grow(60).has_point(a) or clip.grow(60).has_point(b):
			draw_dashed_line(a, b, Color(UIKit.SUN, 0.9), 2.0, 6.0, true, true)
	var d := to_tile(dest, view, size)
	if clip.has_point(d):
		draw_arc(d, 5.0, 0.0, TAU, 24, UIKit.SUN, 2.0, true)
	# The boat: a small arrow pointing the way it heads.
	var c := size * 0.5
	var f := Vector2.from_angle(heading - PI / 2.0)
	var r := Vector2(-f.y, f.x)
	if blind:
		draw_polyline(PackedVector2Array([c + f * 8.0, c - f * 6.0 + r * 5.0, c - f * 3.0, c - f * 6.0 - r * 5.0, c + f * 8.0]), Color(0.98, 0.98, 0.95, 0.9), 1.5, true)
		draw_string(UIKit.bold(), Vector2(8, 14), "fog · last fix", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.1, 0.12, 0.14, 0.9))
	else:
		draw_colored_polygon(PackedVector2Array([c + f * 8.0, c - f * 6.0 + r * 5.0, c - f * 3.0, c - f * 6.0 - r * 5.0]), Color(0.98, 0.98, 0.95))
		draw_polyline(PackedVector2Array([c + f * 8.0, c - f * 6.0 + r * 5.0, c - f * 3.0, c - f * 6.0 - r * 5.0, c + f * 8.0]), Color(0.05, 0.1, 0.12, 0.9), 1.0, true)
	# North arrow and a scale bar: one kilometre.
	var font := UIKit.bold()
	draw_string(font, Vector2(size.x - 14, 14), "N", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.1, 0.12, 0.14, 0.9))
	draw_line(Vector2(size.x - 9, 17), Vector2(size.x - 9, 27), Color(0.1, 0.12, 0.14, 0.9), 1.5)
	var km := 1000.0 / view.z * size.x
	draw_line(Vector2(8, size.y - 8), Vector2(8 + km, size.y - 8), Color(0.1, 0.12, 0.14, 0.9), 2.0)
	draw_string(font, Vector2(8, size.y - 11), "1 km", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.1, 0.12, 0.14, 0.9))
	draw_rect(clip.grow(-0.5), Color(0.85, 0.9, 0.92, 0.5), false, 1.0)
