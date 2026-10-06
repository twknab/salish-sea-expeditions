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
	begin.pressed.connect(func() -> void: App.go("acknowledgment"))
	v.add_child(begin)
	var stage: String = App.save.get("stage", "title")
	if stage != "title" and App.SCENES.has(stage):
		var cont := UIKit.button("Continue · %s" % stage.capitalize(), false)
		cont.pressed.connect(func() -> void: App.go(stage))
		v.add_child(cont)
	var school := UIKit.button("Kayak School · the orientation", false)
	school.pressed.connect(func() -> void: App.school_from = 0; App.go("school"))
	v.add_child(school)
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
	v.add_child(UIKit.card("About", "A game that teaches real sea kayaking in a real place, with sources for every fact. The boat is a folding sea kayak, a nod to the one its maker paddles. Built with Godot. Field guide, credits and the full game follow in later slices of this rewrite.", "", [["Close", func() -> void: ui.queue_free(), true]], "Salish Sea Expeditions"))
