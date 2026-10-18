## The field guide and the credits, from the title. Every species in the content by group, the ones
## met on the water marked from the save, and a Listen button for the ones with a call; the words on the water; then every source the game cites (Principle VIII), with
## its licence, and a way to open it. One scrolling page, so it reads the same on a phone.
extends Control

var _scroll: ScrollContainer
var _hint: Label  # says so when Listen is pressed with the sound off
## The jump row's words for the longer group names.
const SHORT := {"Marine mammals": "Mammals", "Intertidal & sea life": "Intertidal", "Kelp & seaweeds": "Seaweeds"}

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("0b2b33")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var v := UIKit.page(self, 52, 16)
	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 10)
	var title := UIKit.label("Field guide & credits", 22, UIKit.FOAM, true, true)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(title)
	v.add_child(head)
	var jumps := HFlowContainer.new()  # a long page on a phone: one tap to a group, the words, the credits
	jumps.add_theme_constant_override("h_separation", 8)
	jumps.add_theme_constant_override("v_separation", 6)
	v.add_child(jumps)
	_hint = UIKit.label("The sound is off: the Sound chip at the top turns it on.", 12, UIKit.SUN)
	_hint.visible = false
	v.add_child(_hint)
	_scroll = ScrollContainer.new()
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(_scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 10)
	_scroll.add_child(col)
	var anchors := _species(col)
	var words := _words(col)
	anchors["Words"] = words
	anchors["Credits"] = _credits(col)
	var seen: Array = App.save.get("seen", [])
	var tally := {}  # group -> [met, all], for the chip
	for sp in App.content.get("species", []):
		var t: Array = tally.get(sp.group, [0, 0])
		tally[sp.group] = [t[0] + (1 if seen.has(sp.id) else 0), t[1] + 1]
	for name in anchors:
		var target: Control = anchors[name]
		var chip: String = str(SHORT.get(name, name))
		if tally.has(name):
			chip += " %d/%d" % tally[name]
		var b := UIKit.button(chip, false)
		b.custom_minimum_size = Vector2(0, 30)
		b.add_theme_font_size_override("font_size", 12)
		for st in ["normal", "hover", "pressed", "focus"]:  # tighter than a page button, so the row stays two lines on a phone
			var sb: StyleBoxFlat = b.get_theme_stylebox(st).duplicate()
			sb.content_margin_left = 12
			sb.content_margin_right = 12
			b.add_theme_stylebox_override(st, sb)
		b.pressed.connect(func() -> void: _scroll.set_v_scroll(int(target.position.y)))
		jumps.add_child(b)
	if App._url_param("at") == "credits":
		_scroll.call_deferred("set_v_scroll", 100000)
	elif App._url_param("at") == "words":  # `?scene=guide&at=words`: the glossary, for checks
		await get_tree().process_frame
		await get_tree().process_frame
		_scroll.set_v_scroll(int(words.position.y))

## The species by group; returns each group's heading by name, for the jump row.
func _species(col: VBoxContainer) -> Dictionary:
	var seen: Array = App.save.get("seen", [])
	var species: Array = App.content.get("species", [])
	var voice := {}  # species -> the sighting kind it is heard as
	for conf in Sightings.ALL:
		if Sound.voiced(conf.kind) and not voice.has(conf.species):
			voice[conf.species] = conf.kind
	var group_of := {}
	for sp in species:
		group_of[sp.id] = sp.group
	var shores: Array = []  # what each day's end ashore shows; a camp with pools has the octopus under its rock, and every camp its night glow
	for leg in Leg.all():
		var shore: Array = leg.get("shore", []).duplicate()
		var camp: bool = str(leg.get("camp", {}).get("kind", "camp")) != "takeout"
		if camp and TidePool.first_pool(shore.map(func(id: String) -> String: return str(group_of.get(id, "")))) >= 0:
			shore.append("octopus")
		if camp:  # every camp's last card is the night in the cove, sparking when the water is touched
			shore.append("bioluminescence")
		shores.append(shore)
	var groups: Array = []
	for sp in species:
		if not groups.has(sp.group):
			groups.append(sp.group)
	col.add_child(UIKit.label("The field guide · %d species · %d met" % [species.size(), seen.size()], 12, UIKit.MIST))
	var anchors := {}
	for g in groups:
		anchors[g] = UIKit.kicker(str(g))
		col.add_child(anchors[g])
		for sp in species:
			if sp.group != g:
				continue
			var met: bool = seen.has(sp.id)
			var text: String = sp.get("blurb", "")
			var where: String = sp.get("where", "")
			if where != "":
				text += "\n%s." % where
			var approach := int(sp.get("approachMetres", 0))
			if approach > 0:
				text += " Keep %d m off." % approach
			var kind: String = voice.get(sp.id, "")
			var listen: Array = [] if kind == "" else [["Listen", func() -> void: _listen(kind), false]]
			if met:
				var when := Sightings.met_line(App.save.get("metOn", {}).get(sp.id, {}))
				if when != "":
					text += "\n" + when
			else:
				var looks: Array = [Sightings.where_to_look(sp.id), Sightings.where_ashore(sp.id, shores)].filter(func(l: String) -> bool: return l != "")
				text += "\n" + ("\n".join(looks) if not looks.is_empty() else "Not on this expedition’s route: one to know, not to find.")
			var card := UIKit.card("%s%s" % [sp.common, "  · met" if met else ""], text, "%s · %s" % [sp.get("scientific", ""), App.sources_line(sp.get("sourceIds", []))], listen, "")
			col.add_child(card)
	return anchors

func _listen(kind: String) -> void:
	_hint.visible = not bool(App.save.get("sound", true))
	Sound.listen(kind)

## The words the chart, the plan and the notes use, each in a sentence or two with its source. Returns
## the section's heading, so a check can scroll to it.
func _words(col: VBoxContainer) -> Control:
	var head := UIKit.kicker("Words on the water")
	col.add_child(head)
	for w in App.content.get("glossary", []):
		col.add_child(UIKit.card(str(w.term), str(w.text), App.sources_line(w.get("sourceIds", [])), [], ""))
	return head

## Every source, with a way to open it; returns the section's heading.
func _credits(col: VBoxContainer) -> Control:
	col.add_child(UIKit.spacer())
	var head := UIKit.kicker("Credits and sources")
	col.add_child(head)
	col.add_child(UIKit.label("Every fact in the game is cited. The islands are drawn from public elevation data and ESA WorldCover (CC BY 4.0); the boat is an uncredited homage to the folding kayak its maker paddles.", 13, UIKit.MIST))
	for c in App.content.get("credits", []):
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		var l := UIKit.label("%s — %s · %s" % [c.title, c.author, c.licence], 12, UIKit.FOAM)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(l)
		var url: String = str(c.get("url", ""))
		if url != "":
			var b := UIKit.button("Open", false)
			b.custom_minimum_size = Vector2(0, 34)
			b.add_theme_font_size_override("font_size", 12)
			b.pressed.connect(func() -> void: OS.shell_open(url))
			row.add_child(b)
		col.add_child(row)
	col.add_child(UIKit.label("Not a substitute for instruction and practice on the water.", 11, UIKit.MIST))
	return head
