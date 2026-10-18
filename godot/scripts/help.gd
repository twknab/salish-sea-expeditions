## Help, from the title: how the expedition runs, how to paddle on a keyboard and on a phone, and
## what is on the screen. One scrolling page, like the field guide, so it reads the same on a phone.
extends Control

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("0b2b33")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var v := UIKit.page(self, 52, 16)
	v.add_child(UIKit.label("Help", 22, UIKit.FOAM, true, true))
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 10)
	scroll.add_child(col)
	var drills: Array = App.content.get("drills", []).map(func(d: Dictionary) -> String: return str(d.title))
	var touch := DisplayServer.is_touchscreen_available()
	var sections := HelpText.sections(drills)
	if touch:  # on a phone, the phone's section first
		var keys: Dictionary = sections[1]
		sections[1] = sections[2]
		sections[2] = keys
	for s in sections:
		col.add_child(UIKit.card(str(s.title), str(s.body), "", [], ""))
	var back := UIKit.button("Back to the title", false)
	back.pressed.connect(func() -> void: App.go("title"))
	col.add_child(back)
