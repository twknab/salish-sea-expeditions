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
	"guide": "res://scenes/guide.tscn",
}

var content: Dictionary = {}
var save: Dictionary = { "stage": "title", "seenIntro": false, "skin": "blackBlue", "skills": {}, "paddler": { "skin": "tan", "hair": "dark", "style": "short", "build": "medium", "pfd": "sun" } }
var current := "title"
var sea_mode := "ambient"   # what sea.tscn should be when it loads: ambient | school | trip
var school_from := 0        # school phase to resume at
var _home: CanvasLayer
var _title_btn: Button

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
	_title_btn = b
	_title_btn.visible = false
	# Sound and music switches, kept in the save and on every screen: a web game must be muteable.
	var sound_btn := _chip("", 76)
	var music_btn := _chip("", 76 + 92)
	var refresh := func() -> void:
		sound_btn.text = "Sound %s" % ("on" if bool(save.get("sound", true)) else "off")
		music_btn.text = "Music %s" % ("on" if bool(save.get("music", true)) else "off")
	sound_btn.pressed.connect(func() -> void:
		save.sound = not bool(save.get("sound", true))
		persist()
		Sound.set_enabled(bool(save.sound))
		refresh.call())
	music_btn.pressed.connect(func() -> void:
		save.music = not bool(save.get("music", true))
		persist()
		Sound.set_music(bool(save.music))
		refresh.call())
	refresh.call()
	Sound.call_deferred("set_enabled", bool(save.get("sound", true)))
	Sound.call_deferred("set_music", bool(save.get("music", true)))
	# `?scene=ferry` jumps straight to a screen (smoke tests and the editor's play button).
	var leg_param := _url_param("leg")  # `?leg=1` opens the second day, for checks
	if leg_param != "":
		save.legIndex = int(leg_param)
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
	if name != "title" and name != "guide":
		save.stage = name
		persist()
	Sound.mood({ "title": "title", "acknowledgment": "title", "outfit": "calm", "ferry": "ferry", "school": "dawn", "plan": "calm", "trip": "drive", "camp": "night" }.get(name, "calm"))
	_title_btn.visible = name != "title"
	get_tree().change_scene_to_file(SCENES[name])

## The water of the current leg's day: the authored day, run later for each day out.
func day() -> Dictionary:
	var d := Tides.shifted(content.get("tripDay", {}), Leg.TIDE_LAG_MINUTES_PER_DAY * Leg.index())
	d.floodSetDeg = Leg.current().get("floodSetDeg", d.get("floodSetDeg", 330))  # which way this leg's channel floods
	return d

## From camp to the next day's float plan, or home when the last leg is done.
func advance_leg() -> void:
	if Leg.is_last():
		save.stage = "camp_done"
		persist()
		go("title")
		return
	save.legIndex = Leg.index() + 1
	save.erase("launchHour")
	save.erase("arrivedHour")
	persist()
	go("plan")

func _chip(text: String, x: float) -> Button:
	var c := UIKit.button(text, false)
	c.custom_minimum_size = Vector2(84, 34)
	c.add_theme_font_size_override("font_size", 12)
	c.position = Vector2(x, 10)
	_home.add_child(c)
	return c

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

## The paddler's look, resolved from the save against the parts in content: colours and scale.
func paddler() -> Dictionary:
	var parts: Dictionary = content.get("paddlerParts", {})
	var pick: Dictionary = save.get("paddler", {})
	var out := { "skin": Color("c9a07a"), "hair": Color("4a3626"), "style": "short", "scale": 1.0, "pfd": Color("f2d016") }
	for p in parts.get("skin", []):
		if p.id == pick.get("skin", ""):
			out.skin = Color(p.hex)
	for p in parts.get("hair", []):
		if p.id == pick.get("hair", ""):
			out.hair = Color(p.hex)
	for p in parts.get("pfd", []):
		if p.id == pick.get("pfd", ""):
			out.pfd = Color(p.hex)
	for p in parts.get("build", []):
		if p.id == pick.get("build", ""):
			out.scale = float(p.scale)
	out.style = str(pick.get("style", "short"))
	return out

func skin() -> Dictionary:
	for s in content.get("skins", []):
		if s.id == save.get("skin", "blackBlue"):
			return s
	return { "deck": "#1b1e21", "panel": "#2d9be0", "hull": "#f0f1ee" }
