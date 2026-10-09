## The interface, built in code so every screen shares one voice: a calm dark glass card, a kicker,
## a title, body text, a source line, and buttons. Everything fits the screen or is paged.
class_name UIKit
extends RefCounted

const INK := Color(0.03, 0.09, 0.11, 0.78)
const FOAM := Color("eef3f4")
const MIST := Color("b7c6cb")
const SUN := Color("f2d016")
const SEA := Color("2d9be0")

static func panel_style(alpha := 0.78, radius := 22) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(INK, alpha)
	sb.set_corner_radius_all(radius)
	sb.border_color = Color(1, 1, 1, 0.1)
	sb.set_border_width_all(1)
	sb.content_margin_left = 18; sb.content_margin_right = 18
	sb.content_margin_top = 16; sb.content_margin_bottom = 16
	return sb

static var _bold: Font = null

static func bold() -> Font:
	if _bold == null:
		_bold = load("res://fonts/DejaVuSans-Bold.ttf")
	return _bold

static func label(text: String, size: int, color: Color = FOAM, wrap := true, heavy := false) -> Label:
	var l := Label.new()
	l.text = text
	if heavy:
		l.add_theme_font_override("font", bold())
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	if wrap:
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return l

static func kicker(text: String) -> Label:
	var l := label(text.to_upper(), 10, MIST)
	return l

static func button(text: String, primary := true) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 46)
	b.add_theme_font_size_override("font_size", 15)
	var sb := StyleBoxFlat.new()
	sb.bg_color = SEA if primary else Color(1, 1, 1, 0.08)
	sb.set_corner_radius_all(23)
	sb.content_margin_left = 22; sb.content_margin_right = 22
	var hover := sb.duplicate(); hover.bg_color = sb.bg_color.lightened(0.12)
	var press := sb.duplicate(); press.bg_color = sb.bg_color.darkened(0.12)
	var focus := sb.duplicate(); focus.border_color = SUN; focus.set_border_width_all(2)
	b.add_theme_stylebox_override("normal", sb)
	b.add_theme_stylebox_override("hover", hover)
	b.add_theme_stylebox_override("pressed", press)
	b.add_theme_stylebox_override("focus", focus)
	b.add_theme_color_override("font_color", FOAM)
	b.add_theme_color_override("font_hover_color", FOAM)
	b.add_theme_color_override("font_pressed_color", FOAM)
	b.add_theme_color_override("font_focus_color", FOAM)
	return b

## A teaching card. `actions` is an Array of [label, Callable, primary].
static func card(title: String, body: String, source := "", actions: Array = [], kicker_text := "") -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_style())
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	p.add_child(v)
	if kicker_text != "":
		v.add_child(kicker(kicker_text))
	if title != "":
		v.add_child(label(title, 20, SUN, true, true))
	if body != "":
		v.add_child(label(body, 14))
	if source != "":
		v.add_child(label(source, 11, MIST))
	if actions.size() > 0:
		var h := HBoxContainer.new()
		h.add_theme_constant_override("separation", 10)
		h.alignment = BoxContainer.ALIGNMENT_END
		for a in actions:
			var b := button(a[0], a[2] if a.size() > 2 else true)
			b.pressed.connect(a[1])
			h.add_child(b)
		v.add_child(h)
	return p

## Progress dots for a paged screen.
static func dots(count: int, active: int) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 6)
	for i in range(count):
		var d := ColorRect.new()
		d.custom_minimum_size = Vector2(16 if i == active else 6, 6)
		d.color = SUN if i == active else Color(1, 1, 1, 0.3)
		h.add_child(d)
	return h

## Full-screen margin box for a portrait layout: 16 pt sides, safe top and bottom.
static func page(parent: Node, top := 52, bottom := 24) -> VBoxContainer:
	var m := MarginContainer.new()
	m.set_anchors_preset(Control.PRESET_FULL_RECT)
	m.add_theme_constant_override("margin_left", 16)
	m.add_theme_constant_override("margin_right", 16)
	m.add_theme_constant_override("margin_top", top)
	m.add_theme_constant_override("margin_bottom", bottom)
	m.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(m)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	m.add_child(v)
	return v

static func spacer() -> Control:
	var c := Control.new()
	c.size_flags_vertical = Control.SIZE_EXPAND_FILL
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return c

## A thin progress bar across the foot of a screen, `rise` points up from the bottom edge.
static func thin_bar(rise: int) -> ProgressBar:
	var b := ProgressBar.new()
	b.show_percentage = false
	b.custom_minimum_size = Vector2(0, 5)
	b.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	b.offset_left = 30; b.offset_right = -30
	b.offset_top = -rise; b.offset_bottom = -rise + 5
	var bg := StyleBoxFlat.new(); bg.bg_color = Color(1, 1, 1, 0.15); bg.set_corner_radius_all(3)
	var fg := StyleBoxFlat.new(); fg.bg_color = SUN; fg.set_corner_radius_all(3)
	b.add_theme_stylebox_override("background", bg)
	b.add_theme_stylebox_override("fill", fg)
	return b
