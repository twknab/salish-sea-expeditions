## Outfitting on the dock at Anacortes: pick the boat's colours, get dressed for immersion one
## layer at a time on a figure you can see, then the kit by where it rides, and the legal minimum.
extends Node3D

var _page := 0
var _ui: VBoxContainer
var _subject: Node3D
var _kayak: Kayak
var _figure: Paddler
var _cam: Camera3D
var _sea: Seascape
var _terrain: Terrain
var _spin := 0.0
var _pages: Array = []

func _ready() -> void:
	_sea = Seascape.new()
	_sea.sea_state = 0.1
	_sea.hour = 7.5
	# The real shore: the terrain is shifted so the float sits just off the Anacortes terminal,
	# with Guemes Channel and Guemes Island north across the water behind the figure.
	_terrain = Terrain.new()
	add_child(_terrain)
	var dock_at := _terrain.place("anacortes") + Vector3(-60.0, 0.0, -320.0)
	_terrain.position = -dock_at
	_sea.terrain = _terrain
	add_child(_sea)
	# A float to stand on, and the subjects.
	_subject = Node3D.new()
	add_child(_subject)
	_sea.follow = _subject  # the float stays put; the water and the land are built around it
	var dock := MeshInstance3D.new()
	var bm := BoxMesh.new(); bm.size = Vector3(6.0, 0.3, 4.0)
	dock.mesh = bm
	var dm := StandardMaterial3D.new(); dm.albedo_color = Color("6b5538"); dm.roughness = 0.95
	dock.material_override = dm
	dock.position = Vector3(0, 0.25, 0)
	_subject.add_child(dock)
	_kayak = Kayak.new()
	_kayak.freeze = true
	_kayak.position = Vector3(0, 0.55, 0.0)
	_subject.add_child(_kayak)
	_figure = Paddler.new()
	_figure.standing = true
	_figure.dress = 0
	_figure.position = Vector3(0, 0.4, 0.0)
	_subject.add_child(_figure)
	_cam = Camera3D.new()
	_cam.fov = 50.0
	add_child(_cam)
	_cam.position = Vector3(0, 2.4, 6.2)
	_cam.look_at(Vector3(0, 0.9, 0.2), Vector3.UP)
	var ui := CanvasLayer.new()
	add_child(ui)
	_ui = UIKit.page(ui, 48, 24)
	_build_pages()
	_apply_skin()
	_show()

func _build_pages() -> void:
	var c := App.content
	_pages = [{ "kind": "boat", "kicker": "Your boat", "title": "A folding sea kayak", "text": "4.9 m of skin-on-frame kayak that packs into one wheeled bag — small enough to walk onto the ferry. Pick its colours; the hull stays white below the perimeter line so an upturned boat is easy to spot.", "source": App.sources_line(["trak", "arctic"]) }]
	var i := 1
	for l in c.get("layers", []):
		_pages.append({ "kind": "layer", "level": i, "kicker": "Dressing for immersion · %d of %d" % [i, c.layers.size()], "title": l.name, "text": l.text, "source": App.sources_line(l.sourceIds) })
		i += 1
	for g in c.get("kitGroups", []):
		var lines: Array[String] = []
		for k in c.get("kit", []):
			if k.group == g.id:
				lines.append("• %s — %s" % [k.name, k.text])
		_pages.append({ "kind": "kit", "kicker": "The weekend kit · %s" % g.name, "title": g.name, "text": g.text + "\n\n" + "\n".join(lines), "source": "" })
	var legal: Array[String] = []
	for l in c.get("legal", []):
		legal.append("%s: %s." % [l.country, "; ".join(l.items)])
	_pages.append({ "kind": "legal", "kicker": "Two countries", "title": "The legal minimum", "text": "\n\n".join(legal) + "\n\nThis first trip stays in US waters; later ones cross into Canada, so the kit covers both lists.", "source": App.sources_line(["cgaux-paddlers", "colregs", "mec-mandatory"]) })

func _apply_skin() -> void:
	var sk := App.skin()
	_kayak.deck_color = Color(sk.deck)
	_kayak.panel_color = Color(sk.panel) if sk.panel else Color(sk.deck)
	_kayak.hull_color = Color(sk.hull)
	_kayak.build_hull()

func _show() -> void:
	for ch in _ui.get_children():
		ch.queue_free()
	var p: Dictionary = _pages[_page]
	_kayak.visible = p.kind == "boat" or p.kind == "kit"
	_figure.visible = p.kind == "layer"
	if p.kind == "layer":
		_figure.dress = p.level
		_figure.build()
	_cam.position = Vector3(0, 2.4, 6.2) if p.kind != "layer" else Vector3(0, 1.7, 3.9)
	_cam.look_at(Vector3(0, 0.9, 0.0) if p.kind != "layer" else Vector3(0, 1.35, 0.0), Vector3.UP)
	var actions: Array = []
	if _page > 0:
		actions.append(["Back", func() -> void: _page -= 1; _show(), false])
	if _page + 1 < _pages.size():
		actions.append(["Next", func() -> void: _page += 1; _show(), true])
	else:
		actions.append(["To the ferry", func() -> void: App.next(), true])
	if p.kind == "boat":
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		row.alignment = BoxContainer.ALIGNMENT_CENTER
		for sk in App.content.get("skins", []):
			var b := Button.new()
			b.custom_minimum_size = Vector2(52, 36)
			b.tooltip_text = sk.name
			var sb := StyleBoxFlat.new()
			sb.bg_color = Color(sk.deck)
			sb.border_color = Color(sk.panel) if sk.panel else Color(sk.deck)
			sb.set_border_width_all(4)
			sb.set_corner_radius_all(10)
			if sk.id == App.save.get("skin", ""):
				sb.border_color = UIKit.SUN
			b.add_theme_stylebox_override("normal", sb)
			b.add_theme_stylebox_override("hover", sb)
			b.add_theme_stylebox_override("pressed", sb)
			b.add_theme_stylebox_override("focus", sb)
			b.pressed.connect(func() -> void: App.save.skin = sk.id; App.persist(); _apply_skin(); _show())
			row.add_child(b)
		_ui.add_child(UIKit.spacer())
		_ui.add_child(row)
	else:
		_ui.add_child(UIKit.spacer())
	_ui.add_child(UIKit.card(p.title, p.text, p.source, actions, p.kicker))
	_ui.add_child(UIKit.dots(_pages.size(), _page))

func _process(delta: float) -> void:
	_spin += delta * 0.25
	_kayak.rotation.y = _spin
	_figure.rotation.y = _spin + PI
