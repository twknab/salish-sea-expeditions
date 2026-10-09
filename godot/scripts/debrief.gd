## The debrief, at the end of the expedition: what you paddled, each day as it went, what you
## demonstrated and what you saw, and how the points came. From the title once the expedition is
## done, and straight from the take-out at Friday Harbor.
extends Control

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("0b2b33")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var v := UIKit.page(self, 52, 16)
	v.add_child(UIKit.kicker("The expedition · %s" % str(App.chosen_day().get("label", ""))))
	v.add_child(UIKit.label("Friday Harbor · Jones · Posey · home", 22, UIKit.FOAM, true, true))
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 10)
	scroll.add_child(col)
	var legs := Leg.all()
	var save: Dictionary = App.save
	if App._url_param("demo") == "1":  # `?scene=debrief&demo=1`: a finished expedition, for checks
		save = {
			"days": [
				{ "leg": 0, "metres": 11200.0, "launchHour": 9.5, "arrivedHour": 12.1, "verdict": "good", "swims": 0, "respectful": 2, "boatSpot": "edge", "boatVerdict": "floated", "foodVerdict": "taken" },
				{ "leg": 1, "metres": 9600.0, "launchHour": 10.0, "arrivedHour": 13.4, "verdict": "fair", "swims": 1, "respectful": 1, "violations": 1, "ferryHeld": 1, "boatVerdict": "dry", "dark": true, "waterVerdict": "thirsty" },
				{ "leg": 2, "metres": 18500.0, "launchHour": 6.0, "arrivedHour": 11.2, "verdict": "good", "fog": true, "fogInHour": 6.0, "fogOffM": 260.0, "thirsty": true, "floatPlan": "forgot" },
			],
			"nights": 2, "cleanCamps": 2, "seen": ["harbourSeal", "baldEagle", "harbourPorpoise"], "drills": ["forward", "reverse", "brace"],
		}
	var r := Score.record(save, legs)
	var stats := HBoxContainer.new()
	stats.add_theme_constant_override("separation", 8)
	for pair in [["%.1f" % float(r.nm), "nautical miles"], [str(r.nights), "night out" if int(r.nights) == 1 else "nights out"], [str(Score.total(r)), "score"]]:
		var box := VBoxContainer.new()
		box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var big := UIKit.label(pair[0], 28, UIKit.SUN, false, true)
		big.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		box.add_child(big)
		var small := UIKit.kicker(pair[1])
		small.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		box.add_child(small)
		stats.add_child(box)
	col.add_child(stats)
	_days(col, legs, save)
	_section(col, "How the points came", _rows(Score.parts(r)))
	var calls := Seamanship.calls(save.get("days", []))
	if not calls.is_empty():
		_section(col, "Seamanship · %d of %d calls" % [Seamanship.kept(calls), calls.size()], Seamanship.lines(calls))
	var drills: Array = save.get("drills", [])
	var names: Array = []
	for d in App.content.get("drills", []):
		names.append("%s  %s" % ["●" if drills.has(d.id) else "○", str(d.title)])
	_section(col, "Kayak School · %d of %d demonstrated" % [drills.size(), names.size()], names)
	var seen: Array = save.get("seen", [])
	var species: Array = []
	for sp in App.content.get("species", []):
		if seen.has(sp.id):
			species.append(str(sp.common))
	_section(col, "Seen on the way · %d" % species.size(), species if not species.is_empty() else ["Nothing came within reach this time."])
	col.add_child(UIKit.label("● kept, demonstrated   ○ not this time · the calls are the expedition's, the drills are in Kayak School from the title", 11, UIKit.MIST))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var share := UIKit.button("Share this trip")
	share.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	share.pressed.connect(func() -> void: _share(r, species.size(), share))
	row.add_child(share)
	var guide := UIKit.button("Field guide", false)
	guide.pressed.connect(func() -> void: App.go("guide"))
	row.add_child(guide)
	v.add_child(row)
	# The loop closes: the same water on the other day, from the first float plan, with the boat built
	# and Kayak School behind you.
	var other: Dictionary = {}
	for d in App.days():
		if str(d.get("id", "")) != str(App.chosen_day().get("id", "")):
			other = d
			break
	if not other.is_empty() and App._url_param("demo") != "1":
		var again := UIKit.button("Paddle it again · %s" % str(other.get("label", "another day")).to_lower(), false)
		again.pressed.connect(func() -> void: App.paddle_again(str(other.get("id", ""))))
		v.add_child(again)
	elif App._url_param("demo") == "1":
		v.add_child(UIKit.button("Paddle it again · a september day", false))

## Each day as it went: the launch the plan chose and its verdict, the landing, the swims.
func _days(col: VBoxContainer, legs: Array, save: Dictionary) -> void:
	var lines: Array = []
	for d in save.get("days", []):
		var i := int(d.get("leg", -1))
		if i < 0 or i >= legs.size():
			continue
		var verdict := str(d.get("verdict", "fair"))
		var swims := int(d.get("swims", 0))
		var line := "Day %d · %s · launched %s on a %s window · landed %s" % [i + 1, str(legs[i].get("title", "")), Leg.clock(float(d.get("launchHour", 9.0))), verdict, Leg.clock(float(d.get("arrivedHour", 17.0)))]
		if swims > 0:
			line += " · in the water %s" % ("once" if swims == 1 else "%d times" % swims)
		var waits := int(d.get("waits", 0))
		if waits > 0:
			line += " · waited out the wind %s" % ("once" if waits == 1 else "%d times" % waits)
		match str(d.get("boatVerdict", "")):
			"floated":
				line += " · the tide found the boat in the night"
			"close":
				line += " · the tide came within a hand of the boat"
			"dry":
				line += " · the boat slept dry"
		match str(d.get("foodVerdict", "")):
			"taken":
				line += " · raccoons took the breakfast"
			"worked":
				line += " · raccoons worked the hatch"
		if bool(d.get("dark", false)):
			line += " · landed in the dark"
		if bool(d.get("thirsty", false)):
			line += " · paddled thirsty"
		match str(d.get("floatPlan", "")):
			"forgot":
				line += " · the float plan was never closed"
			"late":
				line += " · closed the float plan late"
		if float(d.get("lateStart", 0.0)) > 0.0:
			line += " · an hour to Roche Harbor for water first"
		match str(d.get("waterVerdict", "")):
			"thirsty":
				line += " · drank tomorrow's water"
			"late":
				line += " · kept tomorrow for the tap"
		if bool(d.get("fog", false)):
			var off := float(d.get("fogOffM", -1.0))
			line += " · in fog from %s%s" % [Leg.clock(float(d.get("fogInHour", d.get("launchHour", 9.0)))), (", came out on the line" if off < 150.0 else ", came out %d m off the line" % int(off)) if off >= 0.0 else " to the landing"]
		if int(d.get("ferryHeld", 0)) > 0:
			line += " · held for the ferry"
		if int(d.get("ferryCrossed", 0)) > 0:
			line += " · paddled on as the ferry came"
		var room := int(d.get("respectful", 0))
		var close := int(d.get("violations", 0))
		if room > 0 or close > 0:
			line += " · %d given room%s" % [room, (", %d too close" % close) if close > 0 else ""]
		lines.append(line)
	if lines.is_empty():
		lines.append("No day landed yet.")
	_section(col, "Each day", lines)

func _rows(parts: Array) -> Array:
	var out: Array = []
	for p in parts:
		out.append("%s%d  %s" % ["+" if int(p[1]) > 0 else "", int(p[1]), str(p[0])])
	return out

func _section(col: VBoxContainer, title: String, lines: Array) -> void:
	var card := UIKit.card(title, "\n".join(PackedStringArray(lines)), "", [], "")
	col.add_child(card)

func _share(r: Dictionary, species: int, btn: Button) -> void:
	var calls := Seamanship.calls(App.save.get("days", []))
	var msg := "Salish Sea Expeditions — Friday Harbor to Jones, Posey and home: %.1f nm, %d night%s out, %d species met, %d of %d seamanship calls kept, score %d." % [float(r.nm), int(r.nights), "" if int(r.nights) == 1 else "s", species, Seamanship.kept(calls), calls.size(), Score.total(r)]
	if OS.has_feature("web"):
		var js := "(async () => { const m = %s; const u = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: 'Salish Sea Expeditions', text: m, url: u }); else await navigator.clipboard.writeText(m + ' ' + u); } catch (e) {} })()" % JSON.stringify(msg)
		JavaScriptBridge.eval(js)
	else:
		DisplayServer.clipboard_set(msg)
	btn.text = "Shared · copied"
	get_tree().create_timer(2.0).timeout.connect(func() -> void: btn.text = "Share this trip")
