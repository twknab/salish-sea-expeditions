## Autoload: the content, the save, and the order of the opening. One place decides what comes
## next, so every screen only says "App.next()".
extends Node

const SAVE_PATH := "user://save.json"
## The opening, in the order the player meets it. The ferry is not optional: a folding kayak walks
## on at Anacortes, and the crossing is where the islands are first learned.
const FLOW: Array[String] = ["title", "acknowledgment", "outfit", "ferry", "assemble", "school", "pack", "plan", "trip", "camp"]
const SCENES := {
	"title": "res://scenes/title.tscn",
	"acknowledgment": "res://scenes/acknowledgment.tscn",
	"outfit": "res://scenes/outfit.tscn",
	"ferry": "res://scenes/ferry.tscn",
	"assemble": "res://scenes/assemble.tscn",
	"school": "res://scenes/sea.tscn",
	"trip": "res://scenes/sea.tscn",
	"pack": "res://scenes/pack.tscn",
	"plan": "res://scenes/plan.tscn",
	"camp": "res://scenes/camp.tscn",
	"guide": "res://scenes/guide.tscn",
	"debrief": "res://scenes/debrief.tscn",
}

var content: Dictionary = {}
var save: Dictionary = { "stage": "title", "seenIntro": false, "skin": "blackBlue", "skills": {}, "paddler": { "skin": "tan", "hair": "dark", "style": "short", "build": "medium", "pfd": "sun" } }
var current := "title"
var sea_mode := "ambient"   # what sea.tscn should be when it loads: ambient | school | trip
var school_from := 0        # school phase to resume at
var _home: CanvasLayer
var _title_btn: Button
var _pause_btn: Button
var _perf: Label            # `?perf=1`: the go/no-go numbers on screen, for a phone in the hand
var _perf_t := 0.0
var _perf_min_fps := 1000.0
var _first_frame_ms := -1.0
var _perf_said := false
var _pause_layer: CanvasLayer   # the pause card, over everything, alive while the tree is paused

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS  # the chips and the pause card work while the tree is paused
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
	# Pause, on the water and in Kayak School: the chip, Escape or P, and the page going into a pocket.
	_pause_btn = _chip("Pause", 76 + 92 * 2)
	_pause_btn.visible = false
	_pause_btn.pressed.connect(func() -> void: set_paused(not get_tree().paused))
	Sound.call_deferred("set_enabled", bool(save.get("sound", true)))
	Sound.call_deferred("set_music", bool(save.get("music", true)))
	# `?scene=ferry` jumps straight to a screen (smoke tests and the editor's play button).
	var leg_param := _url_param("leg")  # `?leg=1` opens the second day, for checks
	if leg_param != "":
		save.legIndex = int(leg_param)
	var launch_param := _url_param("launch")  # `?launch=15` chooses the launch hour, for checks
	if launch_param != "":
		save.launchHour = float(launch_param)
	if _url_param("perf") == "1":
		_perf = UIKit.label("", 11, UIKit.SUN, false)
		_perf.position = Vector2(12, 0)
		_perf.size = Vector2(380, 18)
		_perf.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
		_perf.offset_top = -22
		_perf.offset_bottom = -4
		_perf.offset_left = 12
		_perf.offset_right = 392
		_home.add_child(_perf)
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
	if name != "title" and name != "guide" and name != "debrief":
		save.stage = name
		persist()
	Sound.mood({ "title": "title", "acknowledgment": "title", "outfit": "calm", "ferry": "ferry", "assemble": "calm", "school": "dawn", "pack": "calm", "plan": "calm", "trip": "drive", "camp": "night", "debrief": "drive" }.get(name, "calm"))
	_title_btn.visible = name != "title"
	set_paused(false)
	_pause_btn.visible = name in ["trip", "school"]
	get_tree().change_scene_to_file(SCENES[name])

## The days the title offers, and the one this expedition is paddled on (`?day=september` for checks).
func days() -> Array:
	var all: Array = content.get("tripDays", [])
	return all if not all.is_empty() else [content.get("tripDay", {})]

func chosen_day() -> Dictionary:
	var want := _url_param("day")
	if want == "":
		want = str(save.get("dayId", "july"))
	for d in days():
		if str(d.get("id", "")) == want:
			return d
	return days()[0]

## The water of the current leg's day: the chosen day, run later for each day out.
func day() -> Dictionary:
	var d := Tides.shifted(chosen_day(), Leg.TIDE_LAG_MINUTES_PER_DAY * Leg.index())
	d.floodSetDeg = Leg.current().get("floodSetDeg", d.get("floodSetDeg", 330))  # which way this leg's channel floods
	return d

## From camp to the next day's float plan, or home when the last leg is done.
func advance_leg() -> void:
	if Leg.is_last():
		save.stage = "camp_done"
		save.ferryHome = true  # the ferry scene runs home, then the debrief
		persist()
		go("ferry")
		return
	save.legIndex = Leg.index() + 1
	save.erase("launchHour")
	save.erase("arrivedHour")
	persist()
	go("plan")

## Pause: the physics and the clock stop, a card says so, and the save is written. Escape or P
## toggles it on the water; the page being hidden pauses it on its own, so a phone can go into a
## pocket mid-channel and come out where it was.
func set_paused(on: bool) -> void:
	if on == get_tree().paused:
		return
	get_tree().paused = on
	_pause_btn.text = "Resume" if on else "Pause"
	if on:
		persist()
		_pause_layer = CanvasLayer.new()
		_pause_layer.layer = 60
		_pause_layer.process_mode = Node.PROCESS_MODE_ALWAYS
		add_child(_pause_layer)
		var scrim := ColorRect.new()
		scrim.color = Color(0.02, 0.07, 0.09, 0.55)
		scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
		_pause_layer.add_child(scrim)
		var v := UIKit.page(_pause_layer, 120, 40)
		v.add_child(UIKit.spacer())
		var touch := DisplayServer.is_touchscreen_available()
		var how := "Hold the water to paddle · slide to lean · slide up to back off · the hips bar edges" if touch else "Hold W to paddle · A/D lean · S back · Q/E edge · J brace · M chart · P or Escape pauses"
		v.add_child(UIKit.card("Paused", "The boat holds where it is and the clock stops. Your place is saved.\n\n" + how, "", [["Title", func() -> void: go("title"), false], ["Continue", func() -> void: set_paused(false), true]], current.capitalize()))
		v.add_child(UIKit.spacer())
	elif _pause_layer:
		_pause_layer.queue_free()
		_pause_layer = null

## The go/no-go rows of specs/007-godot-rewrite/spec.md, measured where they matter: on the phone in
## the hand. Frames per second now and the worst of the last ten seconds, the frame time, the time
## from the page starting to load to the first frame drawn, the engine's memory, and the device.
## Printed once to the console at ten seconds, so a smoke run can read it too.
func _process(delta: float) -> void:
	if _perf == null:
		return
	if _first_frame_ms < 0.0:
		_first_frame_ms = float(JavaScriptBridge.eval("performance.now()")) if OS.has_feature("web") else float(Time.get_ticks_msec())
	_perf_t += delta
	var fps := Engine.get_frames_per_second()
	if _perf_t > 2.0:
		_perf_min_fps = minf(_perf_min_fps, fps)
	if fmod(_perf_t, 0.5) < delta:
		var mb := int(Performance.get_monitor(Performance.MEMORY_STATIC) / 1048576.0)  # the web build reports none; Chrome's heap stands in
		if mb == 0 and OS.has_feature("web"):
			mb = int(float(JavaScriptBridge.eval("(performance.memory && performance.memory.usedJSHeapSize) || 0")) / 1048576.0)
		_perf.text = "%d fps · worst %d · %.1f ms · first frame %.1f s%s · %s" % [fps, int(_perf_min_fps) if _perf_min_fps < 1000.0 else fps, Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0, _first_frame_ms / 1000.0, (" · %d MB" % mb) if mb > 0 else "", _device()]
	if _perf_t > 10.0 and not _perf_said:
		_perf_said = true
		print("PERF ", _perf.text)

func _device() -> String:
	if not OS.has_feature("web"):
		return OS.get_name()
	var ua := str(JavaScriptBridge.eval("navigator.userAgent"))
	for k in ["iPhone", "iPad", "Android", "Macintosh", "Windows", "Linux"]:
		if ua.contains(k):
			return k
	return "web"

func _unhandled_input(ev: InputEvent) -> void:
	if ev is InputEventKey and ev.pressed and not ev.echo and (ev.keycode == KEY_ESCAPE or ev.keycode == KEY_P) and _pause_btn.visible:
		set_paused(not get_tree().paused)

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and _pause_btn != null and _pause_btn.visible:
		set_paused(true)

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
	return look_for(save.get("paddler", {}))

## A look resolved from a pick of parts (a preset's, or the save's): colours and scale.
func look_for(pick: Dictionary) -> Dictionary:
	var parts: Dictionary = content.get("paddlerParts", {})
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
