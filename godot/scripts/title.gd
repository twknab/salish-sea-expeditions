## The title: the kayak drifting on the water behind the name, with Begin, Continue and About.
extends Node3D

func _ready() -> void:
	App.sea_mode = "ambient"
	var scene: Node = load("res://scenes/sea.tscn").instantiate()
	add_child(scene)
	var ui := CanvasLayer.new()
	ui.layer = 10
	add_child(ui)
	var scrim := TextureRect.new()
	var grad := Gradient.new()
	grad.set_color(0, Color(0.02, 0.08, 0.1, 0.72))
	grad.set_color(1, Color(0.02, 0.08, 0.1, 0.0))
	var gt := GradientTexture2D.new()
	gt.gradient = grad
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(0, 1)
	gt.width = 8; gt.height = 256
	scrim.texture = gt
	scrim.stretch_mode = TextureRect.STRETCH_SCALE
	scrim.set_anchors_preset(Control.PRESET_TOP_WIDE)
	scrim.anchor_bottom = 0.5
	scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(scrim)
	var v := UIKit.page(ui, 72, 28)
	v.add_child(UIKit.kicker("A sea-kayak journey"))
	v.add_child(UIKit.label("Salish Sea Expeditions", 36, UIKit.FOAM, true, true))
	v.add_child(UIKit.label("The San Juan and Gulf Islands, by folding kayak. Learn the strokes, read the water, and travel lightly through a place of First Peoples.", 14, UIKit.MIST))
	v.add_child(UIKit.spacer())
	var begin := UIKit.button("Begin at Anacortes")
	begin.pressed.connect(func() -> void:
		App.save.legIndex = 0
		for k in ["days", "nights", "cleanCamps", "launchHour", "arrivedHour", "assembly", "swims", "ferriesMet"]:  # a fresh record; the field guide and the drills are yours for good
			App.save.erase(k)
		App.go("acknowledgment"))
	v.add_child(begin)
	# Which day to paddle it on: the settled July day, or September's spring tide and southerly.
	var day_row := HBoxContainer.new()
	day_row.add_theme_constant_override("separation", 8)
	var day_blurb := UIKit.label("", 12, UIKit.MIST)
	var day_buttons: Array = []
	var refresh := func() -> void:
		var chosen: Dictionary = App.chosen_day()
		for pair in day_buttons:
			var sb: StyleBoxFlat = pair[1].get_theme_stylebox("normal").duplicate()
			sb.bg_color = UIKit.SEA if str(pair[0]) == str(chosen.get("id", "")) else Color(1, 1, 1, 0.08)
			pair[1].add_theme_stylebox_override("normal", sb)
		day_blurb.text = str(chosen.get("blurb", ""))
	for d in App.days():
		var id := str(d.get("id", ""))
		var b := UIKit.button(str(d.get("label", id)), id == str(App.chosen_day().get("id", "")))
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func() -> void: App.save.dayId = id; App.persist(); refresh.call())
		day_buttons.append([id, b])
		day_row.add_child(b)
	if day_buttons.size() > 1:
		v.add_child(day_row)
		v.add_child(day_blurb)
		refresh.call()
	var stage: String = App.save.get("stage", "title")
	if stage != "title" and App.SCENES.has(stage):
		var day := "day %d · " % (int(App.save.get("legIndex", 0)) + 1) if stage in ["plan", "trip", "camp"] else ""
		var cont := UIKit.button("Continue · %s%s" % [day, stage.capitalize()], false)
		cont.pressed.connect(func() -> void: App.go(stage))
		v.add_child(cont)
	if stage == "camp_done":
		# The expedition is done: any of its days can be paddled again, from its float plan.
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var legs := Leg.all()
		for i in range(legs.size()):
			var day := i
			var again := UIKit.button("Day %d again" % (day + 1), false)
			again.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			again.pressed.connect(func() -> void:
				App.save.legIndex = day
				App.save.erase("launchHour")
				App.save.erase("arrivedHour")
				App.go("plan"))
			row.add_child(again)
		v.add_child(row)
	if stage == "camp_done" or not App.save.get("days", []).is_empty():
		var debrief := UIKit.button("The debrief · how it went", false)
		debrief.pressed.connect(func() -> void: App.go("debrief"))
		v.add_child(debrief)
	var school := UIKit.button("Kayak School · the orientation", false)
	school.pressed.connect(func() -> void: App.school_from = 0; App.go("school"))
	v.add_child(school)
	var guide := UIKit.button("Field guide & credits", false)
	guide.pressed.connect(func() -> void: App.go("guide"))
	v.add_child(guide)
	var about := UIKit.button("About", false)
	about.pressed.connect(_about)
	v.add_child(about)
	if App._url_param("about") == "1":  # `?about=1` opens About, for checks
		call_deferred("_about")
	v.add_child(UIKit.label("Not a substitute for instruction and practice on the water.", 11, UIKit.MIST))

func _about() -> void:
	var ui := CanvasLayer.new()
	ui.layer = 20
	add_child(ui)
	var bg := ColorRect.new()
	bg.color = Color(0.02, 0.07, 0.09, 0.94)  # the title stays faintly behind, not legibly
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui.add_child(bg)
	var v := UIKit.page(ui, 52, 16)
	var head := HBoxContainer.new()
	var title := UIKit.label("About", 22, UIKit.FOAM, true, true)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(title)
	var close := UIKit.button("Close", false)
	close.pressed.connect(func() -> void: ui.queue_free())
	head.add_child(close)
	v.add_child(head)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 10)
	scroll.add_child(col)
	var game := "A love letter to sea kayaking in the San Juan and Gulf Islands, and to the folding touring kayak that makes a walk-on ferry trip possible. "
	game += "It teaches real sea kayaking in a real place, with a source for every fact; the boat is an uncredited homage to the one its maker paddles, "
	game += "and it is an independent project, not made, sponsored or endorsed by the kayak's maker. Built with Godot."
	col.add_child(UIKit.card("The game", game, "", [], "Salish Sea Expeditions"))
	var ack: Dictionary = App.content.get("acknowledgment", {})
	var ack_text: String = "\n\n".join(PackedStringArray(ack.get("paragraphs", [])))
	if str(ack.get("note", "")) != "":
		ack_text += "\n\n" + str(ack.note)
	col.add_child(UIKit.card(str(ack.get("title", "Land acknowledgment")), ack_text, App.sources_line(ack.get("sourceIds", [])), [], "Always here"))
	var safety: Dictionary = App.content.get("safetyNote", {})
	col.add_child(UIKit.card(str(safety.get("title", "Safety")), "\n\n".join(PackedStringArray(safety.get("paragraphs", []))), "", [], "Not a substitute for instruction and practice on the water"))
	var maker := UIKit.button("Made by Tim Knab · timknab.dev", false)
	maker.pressed.connect(func() -> void: OS.shell_open("https://timknab.dev/"))
	col.add_child(maker)
	var guide := UIKit.button("Field guide, credits and sources", false)
	guide.pressed.connect(func() -> void: App.go("guide"))
	col.add_child(guide)
