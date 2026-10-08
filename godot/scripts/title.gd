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
		for k in ["days", "nights", "cleanCamps", "launchHour", "arrivedHour"]:  # a fresh record; the field guide and the drills are yours for good
			App.save.erase(k)
		App.go("acknowledgment"))
	v.add_child(begin)
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
	v.add_child(UIKit.label("Not a substitute for instruction and practice on the water.", 11, UIKit.MIST))

func _about() -> void:
	var ui := CanvasLayer.new()
	ui.layer = 20
	add_child(ui)
	var v := UIKit.page(ui, 72, 28)
	v.add_child(UIKit.spacer())
	v.add_child(UIKit.card("About", "A game that teaches real sea kayaking in a real place, with sources for every fact. The boat is a folding sea kayak, a nod to the one its maker paddles. Built with Godot. The field guide and every source are a button away on the title screen.", "", [["Close", func() -> void: ui.queue_free(), true]], "Salish Sea Expeditions"))
