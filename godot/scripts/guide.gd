## The field guide and the credits, from the title. Every species in the content by group, the ones
## met on the water marked from the save; the words on the water; then every source the game cites (Principle VIII), with
## its licence, and a way to open it. One scrolling page, so it reads the same on a phone.
extends Control

var _scroll: ScrollContainer

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
	_scroll = ScrollContainer.new()
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(_scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 10)
	_scroll.add_child(col)
	_species(col)
	var words := _words(col)
	_credits(col)
	if App._url_param("at") == "credits":
		_scroll.call_deferred("set_v_scroll", 100000)
	elif App._url_param("at") == "words":  # `?scene=guide&at=words`: the glossary, for checks
		await get_tree().process_frame
		await get_tree().process_frame
		_scroll.set_v_scroll(int(words.position.y))

func _species(col: VBoxContainer) -> void:
	var seen: Array = App.save.get("seen", [])
	var species: Array = App.content.get("species", [])
	var groups: Array = []
	for sp in species:
		if not groups.has(sp.group):
			groups.append(sp.group)
	col.add_child(UIKit.label("The field guide · %d species · %d met on the water" % [species.size(), seen.size()], 12, UIKit.MIST))
	for g in groups:
		col.add_child(UIKit.kicker(str(g)))
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
			var card := UIKit.card("%s%s" % [sp.common, "  · met" if met else ""], text, "%s · %s" % [sp.get("scientific", ""), App.sources_line(sp.get("sourceIds", []))], [], "")
			col.add_child(card)

## The words the chart, the plan and the notes use, each in a sentence or two with its source. Returns
## the section's heading, so a check can scroll to it.
func _words(col: VBoxContainer) -> Control:
	var head := UIKit.kicker("Words on the water")
	col.add_child(head)
	for w in App.content.get("glossary", []):
		col.add_child(UIKit.card(str(w.term), str(w.text), App.sources_line(w.get("sourceIds", [])), [], ""))
	return head

func _credits(col: VBoxContainer) -> void:
	col.add_child(UIKit.spacer())
	col.add_child(UIKit.kicker("Credits and sources"))
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
