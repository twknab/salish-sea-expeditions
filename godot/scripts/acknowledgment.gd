## The land acknowledgment and the safety note, before anything else (Principle III and IV).
extends Control

var _page := 0

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("0b2b33")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_show()

func _show() -> void:
	for c in get_children():
		if c is MarginContainer:
			c.queue_free()
	var v := UIKit.page(self, 72, 28)
	var c := App.content
	var ack: Dictionary = c.acknowledgment
	var note: Dictionary = c.safetyNote
	v.add_child(UIKit.spacer())
	if _page == 0:
		var body := "\n\n".join(ack.paragraphs)
		v.add_child(UIKit.card(ack.title, body, App.sources_line(ack.sourceIds) + ("\n" + ack.note if ack.has("note") else ""), [["Continue", func() -> void: _page = 1; _show(), true]], "Before you begin"))
	else:
		var body := "\n\n".join(note.paragraphs)
		v.add_child(UIKit.card(note.title, body, "", [["Back", func() -> void: _page = 0; _show(), false], ["I understand", func() -> void: App.save.seenIntro = true; App.next(), true]], "Safety"))
	v.add_child(UIKit.spacer())
	v.add_child(UIKit.dots(2, _page))
