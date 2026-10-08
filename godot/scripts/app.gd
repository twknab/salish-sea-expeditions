## Autoload: the content, the save, and the order of the opening. One place decides what comes
## next, so every screen only says "App.next()".
extends Node

const SAVE_PATH := "user://save.json"
## The opening, in the order the player meets it. The ferry is not optional: a folding kayak walks
## on at Anacortes, and the crossing is where the islands are first learned.
const FLOW: Array[String] = ["title", "acknowledgment", "outfit", "ferry", "school", "plan", "trip", "camp"]
const SCENES := {
	"title": "res://scenes/title.tscn",
	"acknowledgment": "res://scenes/acknowledgment.tscn",
	"outfit": "res://scenes/outfit.tscn",
	"ferry": "res://scenes/ferry.tscn",
	"school": "res://scenes/sea.tscn",
	"trip": "res://scenes/sea.tscn",
	"plan": "res://scenes/plan.tscn",
	"camp": "res://scenes/camp.tscn",
}

var content: Dictionary = {}
var save: Dictionary = { "stage": "title", "seenIntro": false, "skin": "blackBlue", "skills": {} }
var current := "title"
var sea_mode := "ambient"   # what sea.tscn should be when it loads: ambient | school | trip
var school_from := 0        # school phase to resume at
var _home: CanvasLayer

func _ready() -> void:
	var f := FileAccess.open("res://content/content.json", FileAccess.READ)
	if f:
		var parsed = JSON.parse_string(f.get_as_text())
		if parsed is Dictionary:
			content = parsed
	_load()
	# The interface is laid out in points for a 390 × 844 phone and scaled to the window by hand:
	# the engine's canvas_items stretch dropped the whole 2D layer in landscape windows on the web.
	get_tree().root.size_changed.connect(_fit)
	_fit()
	# A way home from every screen: a small Title button in the top-left corner.
	_home = CanvasLayer.new()
	_home.layer = 50
	add_child(_home)
	var b := UIKit.button("Title", false)
	b.custom_minimum_size = Vector2(0, 34)
	b.add_theme_font_size_override("font_size", 12)
	b.position = Vector2(12, 10)
	b.pressed.connect(func() -> void: go("title"))
	_home.add_child(b)
	_home.visible = false
	# `?scene=ferry` jumps straight to a screen (smoke tests and the editor's play button).
	var want := _url_param("scene")
	if want != "" and SCENES.has(want):
		call_deferred("go", want)

func _fit() -> void:
	var sz := get_tree().root.size
	var f := minf(sz.x / 390.0, sz.y / 844.0)
	get_tree().root.content_scale_factor = clampf(f, 0.75, 2.5)

func _url_param(name: String) -> String:
	if not OS.has_feature("web"):
		return ""
	var v = JavaScriptBridge.eval("new URLSearchParams(location.search).get('%s') || ''" % name)
	return str(v) if v != null else ""

func credit(id: String) -> Dictionary:
	for c in content.get("credits", []):
		if c.id == id:
			return c
	return {}

## "Source: American Canoe Association · TRAK Kayaks" for a card footer.
func sources_line(ids: Array) -> String:
	var names: Array[String] = []
	for id in ids:
		var c := credit(str(id))
		if not c.is_empty() and not names.has(c.author):
			names.append(c.author)
	return "Source: " + " · ".join(names) if names.size() > 0 else ""

func go(name: String) -> void:
	current = name
	if name == "school" or name == "trip":
		sea_mode = name
	elif name == "title":
		sea_mode = "ambient"
	if name != "title":
		save.stage = name
		persist()
	Sound.mood({ "title": "title", "acknowledgment": "title", "outfit": "calm", "ferry": "ferry", "school": "calm", "plan": "calm", "trip": "drive", "camp": "title" }.get(name, "calm"))
	_home.visible = name != "title"
	get_tree().change_scene_to_file(SCENES[name])

func next() -> void:
	var i := FLOW.find(current)
	if i >= 0 and i + 1 < FLOW.size():
		go(FLOW[i + 1])

func persist() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save))

func _load() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f:
		var parsed = JSON.parse_string(f.get_as_text())
		if parsed is Dictionary:
			for k in parsed.keys():
				save[k] = parsed[k]

func skin() -> Dictionary:
	for s in content.get("skins", []):
		if s.id == save.get("skin", "blackBlue"):
			return s
	return { "deck": "#1b1e21", "panel": "#2d9be0", "hull": "#f0f1ee" }
