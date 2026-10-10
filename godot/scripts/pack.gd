## Pack for the night, on the float at Friday Harbor: tap an item, then where it goes. The boat
## has no hatches, so everything loads through the cockpit into the bags fore and aft. The trim
## line says what the layout does to the boat; the essentials left behind are named before you
## go, and what you leave is what you paddle without.
extends Control

var _gear: Array = []
var _packing: Dictionary = {}
var _chosen := ""
var _diagram: PackDiagram
var _rows: Dictionary = {}    # id → Button
var _trim: Label
var _card: PanelContainer
var _ui: VBoxContainer
var _narrow := false   # a phone: the rows keep to the name and the weight, the diagram says where

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("0b2b33")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_gear = App.content.get("gear", [])
	_packing = App.save.get("packing", Packing.empty())
	for z in Packing.ZONES:
		if not _packing.has(z):
			_packing[z] = []
	match App._url_param("pack"):  # starts for checks
		"bow":
			_packing = Packing.lopsided(_gear, "bowEnd")
		"ideal":
			_packing = Packing.suggested(_gear)
	_narrow = get_viewport_rect().size.x < 600.0
	_ui = UIKit.page(self, 52, 16)
	_ui.add_child(UIKit.kicker("On the float · Friday Harbor"))
	_ui.add_child(UIKit.label("Pack for the night", 22, UIKit.FOAM, true, true))
	var lesson := _lesson("trim")
	_ui.add_child(UIKit.label("%s %s" % [lesson.get("title", ""), lesson.get("text", "")], 12, UIKit.MIST))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_ui.add_child(row)
	_diagram = PackDiagram.new()
	_diagram.zone_tapped.connect(_on_zone)
	for g in _gear:
		_diagram.names[g.id] = str(g.name).split(",")[0].split(" &")[0]
	row.add_child(_diagram)
	var scroll := ScrollContainer.new()
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	row.add_child(scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 4)
	scroll.add_child(col)
	for g in _gear:
		var b := UIKit.button("", false)
		b.custom_minimum_size = Vector2(0, 38)
		b.add_theme_font_size_override("font_size", 12)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.clip_text = not _narrow  # on a phone the row wraps to two lines instead of losing the weight off its end
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART if _narrow else TextServer.AUTOWRAP_OFF
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var id: String = str(g.id)
		b.pressed.connect(func() -> void: _choose(id))
		col.add_child(b)
		_rows[id] = b
	_trim = UIKit.label("", 12, UIKit.SUN)
	_ui.add_child(_trim)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 10)
	var auto := UIKit.button("Pack it for me", false)
	auto.pressed.connect(func() -> void:
		_packing = Packing.suggested(_gear)
		_chosen = ""
		_refresh())
	actions.add_child(auto)
	var done := UIKit.button("Done packing")
	done.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	done.pressed.connect(_done)
	actions.add_child(done)
	_ui.add_child(actions)
	_refresh()

func _lesson(id: String) -> Dictionary:
	for l in App.content.get("lessons", []):
		if l.id == id:
			return l
	return { "title": id, "text": "", "sourceIds": [] }

func _gear_of(id: String) -> Dictionary:
	for g in _gear:
		if g.id == id:
			return g
	return {}

## Tap an item: choose it, or tap the chosen one again to take it out of the boat.
func _choose(id: String) -> void:
	if _chosen == id:
		_chosen = ""
		if Packing.zone_of(_packing, id) != "":
			_packing = Packing.place(_packing, id, "")
	else:
		_chosen = id
	_refresh()

func _on_zone(zone: String) -> void:
	if _chosen == "":
		return
	_packing = Packing.place(_packing, _chosen, zone)
	_chosen = ""
	_refresh()

func _refresh() -> void:
	_diagram.packing = _packing
	_diagram.hot = ""
	if _chosen != "":
		var g := _gear_of(_chosen)
		_diagram.hot = "deck" if bool(g.get("deck", false)) else ("bowEnd" if bool(g.get("bulky", false)) else "sternMid")
	_diagram.queue_redraw()
	for id in _rows.keys():
		var g := _gear_of(id)
		var where := Packing.zone_of(_packing, id)
		var mark := "▸ " if id == _chosen else ("● " if where != "" else "○ ")
		var b: Button = _rows[id]
		b.text = "%s%s · %s\u00a0kg%s" % [mark, g.name, str(g.massKg), ("" if where == "" or _narrow else " · " + str(Packing.ZONE_NAME[where]).to_lower())]
		b.modulate = Color(1, 1, 1, 1.0 if (where != "" or id == _chosen) else 0.75)
	var a := Packing.assess(_packing, _gear)
	var line := "%.1f kg aboard · %s" % [float(a.total), Packing.trim_words(a)]
	if Packing.trim_consequence(a) != "":
		line += " · " + Packing.trim_consequence(a)
	if a.missing.size() > 0:
		line += " · %d essential%s still on the beach" % [a.missing.size(), "" if a.missing.size() == 1 else "s"]
	if _chosen != "":
		var g := _gear_of(_chosen)
		line = "%s — %s Tap where it goes, or tap it again to leave it out." % [g.name, g.get("text", "")]
	_trim.text = line
	App.save.packing = _packing
	App.persist()

func _done() -> void:
	var a := Packing.assess(_packing, _gear)
	if a.missing.size() == 0:
		App.next()
		return
	if _card:
		_card.queue_free()
	var names: Array[String] = []
	for id in a.missing:
		names.append(str(_gear_of(id).name))
	var l := _lesson("essentials")
	_card = UIKit.card("Still on the beach: %s" % ", ".join(names), str(l.get("text", "")) + " What you leave here, you paddle without.", App.sources_line(l.get("sourceIds", [])), [
		["Leave them", func() -> void: App.next(), false],
		["Pack them", func() -> void:
			var ideal := Packing.suggested(_gear)
			for id in a.missing:
				_packing = Packing.place(_packing, id, Packing.zone_of(ideal, id))
			_card.queue_free()
			_card = null
			_refresh(), true],
	], "Carry the essentials")
	_card.set_anchors_preset(Control.PRESET_CENTER)
	_card.custom_minimum_size = Vector2(340, 0)
	_card.position = Vector2(25, 260)
	add_child(_card)
