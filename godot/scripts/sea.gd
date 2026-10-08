## The water scene in three manners. `ambient` (the title): the kayak drifts, the camera circles.
## `school` (Kayak School): the boat, the body and the paddle up close, then the five drills in
## calm water. `trip`: the open water with the touch controls. Content comes from App.content.
extends Node3D

@onready var kayak: Kayak = $Kayak
@onready var controls: Controls = $UI/Controls
@onready var hud: Control = $UI/HUD
@onready var speed_label: Label = $UI/HUD/Speed
@onready var heading_label: Label = $UI/HUD/Heading
@onready var note_label: Label = $UI/HUD/Note
@onready var rig: CameraRig = $CameraRig
@onready var terrain: Terrain = $Terrain

var _compass: Compass
var _places: PlaceLabels
var _dest := Vector3.ZERO      # the cove, on a trip
var _hour := Leg.LAUNCH_HOUR   # the day's clock, on a trip
var _groove := 0.0             # 0..1: a steady cadence has settled and the miles pass
var _arrived := false
var _dest_label: Label
var _route: Dictionary = {}
var _chart: ChartTile
var _traffic: Traffic
var _partner: Partner
var _flow: Dictionary = { "factor": 1.0, "name": "" }   # the local stream, from the leg's rips
var _kick_t := 0.0
var _swimming := false       # capsized on the trip: the rescue cards are up
var _rescue_step := 0
const RESCUE_STEPS := ["coldWater", "wetExit", "tRescue", "pumpOut"]   # with a partner alongside, the T-rescue; the paddle float is the solo drill in Kayak School
const SOLO_STEPS := ["wetExit", "pfRescue", "pumpOut"]                 # Kayak School's rescue drill: alone, with the float
var _rescue_steps: Array = RESCUE_STEPS
var _capsize_in := -1.0      # the rescue drill rolls the boat on its own after a moment
var _since_start := 0.0
var _pack: Dictionary = {}       # Packing.assess of the boat as packed, on a trip
var _swims_today := 0           # capsizes on this leg, for the day's record
var _weather_asked := false     # the wind-is-up card goes up once a leg
var _kelp_said := false         # the kelp's one line, the first time the boat is in it
var _ferry_moved := false       # paddled on while the ferry closed from the horn to the wake
var _ferry_verdicts: Array = []  # "held" or "crossed", one per ferry pass this leg, for the record
const KELP_REACH := 70.0        # metres from a kelp sighting's centre the bed extends
var _waits_today := 0           # times the wind was waited out in a lee
const ROUGH := 0.5              # sea state at which the bail-outs are offered
const RIP_KICK_EVERY := 3.2    # seconds between beam waves in a rip at full strength
## Sightings on the leg: what, which species of the field guide it is, where, and how close you
## must come to notice it. Positions checked against the terrain: seals and kelp on the islet by
## Yellow Island, the heron in the Labs' shallows, the eagle on Point Caution, the porpoise mid-channel.
const SIGHTINGS := [
	{ "leg": 0, "kind": "heron", "species": "heron", "at": Vector3(560.0, 0.0, -1300.0), "face": Vector3(-1, 0, 0), "radius": 220.0 },
	{ "leg": 0, "kind": "eagle", "species": "baldEagle", "at": Vector3(260.0, 0.0, -2600.0), "face": Vector3(1, 0, 0), "radius": 320.0 },
	{ "leg": 0, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-300.0, 0.0, -4200.0), "face": Vector3(0, 0, -1), "radius": 420.0 },
	{ "leg": 0, "kind": "kelp", "species": "bullKelp", "at": Vector3(-900.0, 0.0, -6250.0), "face": Vector3(0, 0, -1), "radius": 200.0 },
	{ "leg": 0, "kind": "seals", "species": "harbourSeal", "at": Vector3(-1100.0, 0.0, -6330.0), "face": Vector3(0, 0, 1), "radius": 260.0 },
	# Day two: seals on the rocks at Spieden's south-east tip, a porpoise working Spieden Channel, kelp
	# off Davison Head and the eagle on the head itself.
	{ "leg": 1, "kind": "seals", "species": "harbourSeal", "at": Vector3(-6760.0, 0.0, -10920.0), "face": Vector3(0, 0, 1), "radius": 300.0 },
	{ "leg": 1, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-7600.0, 0.0, -10450.0), "face": Vector3(-1, 0, 0), "radius": 420.0 },
	# A pod of Bigg's killer whales working Spieden Channel east on the flood, well out from the shore: the card comes up at
	# 1.4 km, the law's thousand yards is the line, and the sighting counts as given room or not in the debrief.
	{ "leg": 1, "kind": "orcas", "species": "biggsOrca", "at": Vector3(-8300.0, 0.0, -10700.0), "face": Vector3(1, 0, 0), "radius": 1400.0 },
	{ "leg": 1, "kind": "kelp", "species": "bullKelp", "at": Vector3(-9300.0, 0.0, -10080.0), "face": Vector3(-1, 0, 0), "radius": 200.0 },
	{ "leg": 1, "kind": "eagle", "species": "baldEagle", "at": Vector3(-9600.0, 0.0, -9930.0), "face": Vector3(0, 0, -1), "radius": 320.0 },
	# Day three, home: the porpoise again in the channel's narrows, seals on the islet by Yellow, the heron at the Labs.
	{ "leg": 2, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-6200.0, 0.0, -10450.0), "face": Vector3(1, 0, 0), "radius": 420.0 },
	{ "leg": 2, "kind": "seals", "species": "harbourSeal", "at": Vector3(-1100.0, 0.0, -6330.0), "face": Vector3(0, 0, 1), "radius": 260.0 },
	{ "leg": 2, "kind": "heron", "species": "heron", "at": Vector3(560.0, 0.0, -1300.0), "face": Vector3(-1, 0, 0), "radius": 220.0 },
]
var _sightings: Array = []   # [{conf, node, seen}]
const GROOVE_AFTER := 6.0       # seconds of steady holding before the day starts to pass
const GROOVE_SPEED := 28.0      # extra metres per second over the ground, in the groove
const GROOVE_HOURS_PER_SEC := 1.0 / 50.0  # the clock in the groove: an hour in fifty seconds
var _day: Dictionary = {}       # the authored day: tides, current, wind
var _set_label: Label

## Where the game puts you in on the water: the harbour at Friday Harbor, off the town float with
## Brown Island to starboard, pointed up San Juan Channel. Metres from the town, and degrees true.
const HARBOUR_SPAWN := Vector3(420.0, 0.1, -700.0)
const HARBOUR_HEADING := 32.0

var mode := "trip"
var sea: Seascape
var _count := 0
var _ui: VBoxContainer
var _card: PanelContainer
var _phase := 0            # index into _tour
var _tour: Array = []      # [{kind, title, text, source, anchor, dist, az, el}]
var _drill := -1
var _drill_state := {}
var _drill_bar: ProgressBar
var _wobble := 0.0

func _ready() -> void:
	mode = App.sea_mode
	sea = Seascape.new()
	sea.follow = kayak
	sea.sea_state = 0.08 if mode == "school" else 0.22
	sea.terrain = terrain
	add_child(sea)
	move_child(sea, 0)
	_route = Leg.current()
	if mode == "trip":
		kayak.global_position = Leg.start(_route) + Vector3(0.0, 0.1, 0.0)
		kayak.rotation.y = -deg_to_rad(Leg.heading_deg(_route))  # heading = -yaw (see Kayak.heading)
	else:
		kayak.global_position = terrain.place("fridayHarbor") + HARBOUR_SPAWN
		kayak.rotation.y = -deg_to_rad(HARBOUR_HEADING)
	terrain.focus = kayak.global_position
	var sk := App.skin()
	kayak.deck_color = Color(sk.deck)
	kayak.panel_color = Color(sk.panel) if sk.panel else Color(sk.deck)
	kayak.hull_color = Color(sk.hull)
	kayak.sea_state = sea.sea_state
	kayak.assembly = clampf(float(App.save.get("assembly", 1.0)), 0.3, 1.0)  # the boat as it went together on the beach
	kayak.build_hull()
	controls.stroke.connect(_on_stroke)
	kayak.capsized.connect(_on_capsized)
	controls.edge_changed.connect(func(v: float) -> void: kayak.edge = v)
	controls.steer_changed.connect(func(v: float) -> void: kayak.steer = v)
	_ui = UIKit.page($UI, 48, 24)
	if not controls.touch():
		note_label.size.x = 640.0  # a desktop window has the width: the opening line stays on one line, clear of the destination
	heading_label.visible = false
	_compass = Compass.new()
	_compass.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	var top := 150.0 if controls.touch() else 40.0  # under the note on a phone, beside it on a desktop
	_compass.offset_left = -112; _compass.offset_right = -14; _compass.offset_top = top; _compass.offset_bottom = top + 118
	hud.add_child(_compass)
	_places = PlaceLabels.new()
	_places.reach = 8000.0  # the landings ahead show as you come up the channel without crowding the horizon
	$UI.add_child(_places)
	$UI.move_child(_places, 0)
	for p in terrain.meta.get("places", []):
		if p.id in ["anacortes", "thatcher", "harney", "wasp", "sanJuanChannel", "fridayHarbor"]:
			continue
		var w := terrain.place(p.id)
		_places.add_place(p.id, p.name, Vector3(w.x, maxf(terrain.height_at(w.x, w.z), 0.0) + 12.0, w.z), 12)
	match mode:
		"ambient":
			controls.visible = false
			hud.visible = false
			rig.orbit()
		"school":
			controls.visible = false
			hud.visible = false
			_build_tour()
			_phase = App.school_from
			var drill_param := App._url_param("drill")  # `?scene=school&drill=rescue` opens on a drill, for checks
			if drill_param != "":
				var want := -1
				for k in range(_drills().size()):
					if _drills()[k].id == drill_param:
						want = k
				if want >= 0:
					_start_drills()
					_start_drill(want)
					return
			_show_phase()
		_:
			_tilt_chip()
			_dest = Leg.cove(_route)
			_day = App.day()
			_hour = Leg.launch_hour()  # the launch the float plan chose
			sea.apply_hour(_hour)
			_set_label = UIKit.label("", 12, UIKit.MIST, controls.touch())  # wraps on a phone
			_set_label.position = Vector2(20, 172)
			_set_label.size = Vector2(350, 40) if controls.touch() else Vector2(520, 20)
			hud.add_child(_set_label)
			_dest_label = UIKit.label("", 13, UIKit.FOAM, false, true)
			_dest_label.position = Vector2(20, 150)
			_dest_label.size = Vector2(360, 24)
			hud.add_child(_dest_label)
			# The boat as it was packed: the trim is physics, and the gear left behind is gone.
			var pack_param := App._url_param("pack")  # `?pack=bow` opens with everything in the bow, for checks
			var gear: Array = App.content.get("gear", [])
			var layout: Dictionary = Packing.lopsided(gear, "bowEnd") if pack_param == "bow" else (Packing.suggested(gear) if pack_param == "ideal" else App.save.get("packing", Packing.suggested(gear)))
			_pack = Packing.assess(layout, gear)
			kayak.set_trim(_pack)
			_spawn_sightings()
			# The ferry works the channel whatever day it is: leaving the landing behind you on day one,
			# coming in to meet you on the way home.
			# The partner: another preset, another skin, holding station off the starboard quarter.
			_partner = Partner.new()
			var mine: Dictionary = App.save.get("paddler", {})
			var preset := Partner.pick_preset(App.content.get("paddlers", []), mine)
			_partner.preset = preset
			var skins: Array = App.content.get("skins", [])
			var other_skin: Dictionary = skins[0] if not skins.is_empty() else {}
			for candidate in skins:
				if candidate.id != App.save.get("skin", "blackBlue"):
					other_skin = candidate
					break
			add_child(_partner)
			_partner.setup(App.look_for(preset), other_skin, Partner.station_for(kayak.global_position, kayak.global_basis), -kayak.rotation.y)
			_traffic = Traffic.new()
			add_child(_traffic)
			if Leg.index() == 0:
				_traffic.inbound_in(0.0)  # coming down the channel to meet you in the first quarter hour
			else:
				_traffic.inbound_in(420.0)
			# The chart in the deck bag, under the HUD's lines on the left; folded by default on a phone.
			_chart = ChartTile.new()
			_chart.terrain = terrain
			_chart.route = Leg.waypoints(_route)
			_chart.dest = _dest
			_chart.position = Vector2(20, 224 if controls.touch() else 200)
			_chart.folded = controls.touch() or bool(App.save.get("chartFolded", false))
			hud.add_child(_chart)
			match App._url_param("near"):  # starts for checks
				"jones", "posey", "home":
					kayak.global_position = _dest + Vector3(0.0, 0.1, -900.0)  # 900 m north of the cove
					kayak.rotation.y = PI  # heading south, into the cove
				"ferry":  # `?scene=trip&near=ferry`: the ferry 600 m ahead, coming up the channel
					kayak.global_position = Vector3(500.0, 0.1, -2900.0)
					kayak.rotation.y = -deg_to_rad(340.0)
					_traffic.place_near(kayak.global_position, 600.0)
				"orcas":  # `?scene=trip&leg=1&near=orcas`: the pod 1.1 km ahead, coming the other way
					if App._url_param("close") == "1":  # `&close=1`: in the pod's path as it starts its pass, to look at it
						kayak.global_position = Vector3(-8800.0, 0.1, -10712.0)
						kayak.rotation.y = -deg_to_rad(270.0)  # facing west down the pod's line: it comes on from 100 m
					else:
						kayak.global_position = Vector3(-7200.0, 0.1, -10700.0)
						kayak.rotation.y = -deg_to_rad(270.0)
				"spieden":
					kayak.global_position = Vector3(-7000.0, 0.1, -10450.0)
					kayak.rotation.y = -deg_to_rad(270.0)  # west down Spieden Channel, the porpoise ahead
				"yellow":
					if App._url_param("close") == "1":  # `&close=1`: seventy metres off the seals' rock, inside the hundred yards
						kayak.global_position = Vector3(-1040.0, 0.1, -6270.0)
						kayak.rotation.y = -deg_to_rad(315.0)  # the rock is north-west
					else:
						kayak.global_position = Vector3(-860.0, 0.1, -6225.0)
						kayak.rotation.y = -deg_to_rad(300.0)  # the kelp 50 m ahead, the seals' rock beyond
				"labs":
					kayak.global_position = Vector3(590.0, 0.1, -1312.0)
					kayak.rotation.y = -deg_to_rad(250.0)  # the heron 30 m off in the shallows
			var opening := "Friday Harbor · San Juan Channel opens ahead" if Leg.index() == 0 else "Day %d · %s" % [Leg.index() + 1, str(_route.get("title", ""))]
			if _partner:
				opening += " · with %s" % str(_partner.preset.get("name", "a partner"))
			note_label.text = "%s\n%s" % [opening, ("Hold the water to paddle · slide to lean · slide up to back off" if controls.touch() else "Hold W to paddle · A/D lean · S back · Q/E edge · J brace · M chart")]

## Put the animals and the kelp where they live, on the shore or the water the terrain says is there.
func _spawn_sightings() -> void:
	for conf in SIGHTINGS:
		if int(conf.get("leg", 0)) != Leg.index():
			continue
		var at: Vector3 = conf.at
		var y := 0.0
		if conf.kind == "eagle" or conf.kind == "seals":
			y = maxf(terrain.height_at(at.x, at.z), 0.0) + (0.0 if conf.kind == "eagle" else 0.3)
		var node := Wildlife.make(conf.kind, Vector3(at.x, y, at.z), conf.face)
		add_child(node)
		_sightings.append({ "conf": conf, "node": node, "seen": false })

## Coming within reach of a sighting names it once, from the field guide, and keeps it in the save.
func _watch_sightings() -> void:
	for s in _sightings:
		if s.seen:
			# Be Whale Wise: inside the field guide's approach distance is too close, and the debrief counts it.
			var keep := int(_species(s.conf.species).get("approachMetres", 0))
			var d := kayak.global_position.distance_to(s.node.global_position)
			if s.conf.kind == "seals":
				# Hauled-out seals: heads come up inside a hundred yards, and inside fifty they flush.
				var level := 2 if d < 50.0 else (1 if d < float(keep) else 0)
				if level > s.node.alarm:
					s.node.alarm = level
					if level == 2:
						note_label.text = "The seals have flushed off the rock. That is the disturbance the hundred yards prevents: a seal in the water is a seal not resting."
			if keep > 0 and not s.close and d < float(keep):
				s.close = true
				if s.conf.kind != "seals" or s.node.alarm < 2:
					note_label.text = "Too close: %d m is the distance. Let it come to you, or not." % keep
			continue
		var conf: Dictionary = s.conf
		if kayak.global_position.distance_to(s.node.global_position) > float(conf.radius):
			continue
		s.seen = true
		s.close = false
		var sp := _species(conf.species)
		if sp.is_empty():
			continue
		var seen: Array = App.save.get("seen", [])
		if not seen.has(conf.species):
			seen.append(conf.species)
			App.save.seen = seen
			App.persist()
		var text: String = sp.get("blurb", "")
		var facts: Array = sp.get("facts", [])
		if not facts.is_empty():
			text += "\n\n" + str(facts[0])
		var approach := int(sp.get("approachMetres", 0))
		if approach > 0:
			text += "\n\nKeep %d m off: let it come to you, or not." % approach
		_clear_card()
		_card = UIKit.card(sp.get("common", conf.species), text, App.sources_line(sp.get("sourceIds", [])), [["Noted", _clear_card, true]], "Sighting · %s" % sp.get("group", ""))
		_ui.add_child(UIKit.spacer())
		_ui.add_child(_card)
		Sound.gull()

func _species(id: String) -> Dictionary:
	for sp in App.content.get("species", []):
		if sp.id == id:
			return sp
	return {}

## The leg: where the cove is, how the day passes, and landing.
func _leg(delta: float) -> void:
	var here := kayak.global_position
	var dist := Vector2(_dest.x - here.x, _dest.z - here.z).length()
	var brg := Leg.bearing_deg(here, _dest)
	_compass.target = deg_to_rad(brg)
	# A steady hold settles into the groove: the boat makes ground over the chart and the clock runs.
	var steady := controls.holding_for() > GROOVE_AFTER and absf(controls.steer) < 0.3 and kayak.speed > 0.4
	_groove = move_toward(_groove, 1.0 if steady else 0.0, delta * (0.5 if steady else 1.5))
	if _groove > 0.01:
		var fwd := -kayak.global_basis.z
		var ahead := here + fwd * 60.0
		if terrain.height_at(ahead.x, ahead.z) < -0.5:
			kayak.global_position += fwd * GROOVE_SPEED * _groove * delta
		_hour += GROOVE_HOURS_PER_SEC * _groove * delta
	else:
		_hour += delta / 3600.0 * 12.0  # out of the groove the day still passes, twelve times real
	sea.apply_hour(_hour)
	# The current carries the boat over the ground, in the groove and out of it (the groove's hours
	# pass faster, so its drift is scaled with them).
	_flow = Leg.flow_at(_route, here)
	var factor: float = _flow.factor
	var cur := Tides.current_vector(_day, _hour) * factor
	# The water of the hour: wind builds the sea, wind against the stream stands it up, and a rip
	# throws the odd wave on the beam that the paddler must brace for.
	# Bull kelp: a bed is a drag on the hull and a lee in a chop — the fronds lie the swell down.
	var kelp := 0.0
	for s in _sightings:
		if s.conf.kind == "kelp":
			kelp = maxf(kelp, 1.0 - clampf(here.distance_to(s.node.global_position) / KELP_REACH, 0.0, 1.0))
	kayak.kelp = kelp
	if kelp > 0.3 and not _kelp_said:
		_kelp_said = true
		note_label.text = "In the kelp: the fronds grab the blade and the swell lies down. A kelp bed is a lee, and a slow one."
	var state := Tides.sea_state(_day, _hour, factor) * (1.0 - 0.6 * kelp)
	if state >= ROUGH and not _weather_asked and _card == null:
		_offer_bailouts(state)
	var w := Tides.wind(_day, _hour)
	kayak.wind = Windage.vector(float(w.kn), float(w.fromDeg))
	sea.set_sea_state(lerpf(sea.sea_state, lerpf(0.10, 0.70, state), minf(1.0, delta * 0.3)))
	kayak.sea_state = sea.sea_state
	if factor > 1.15 and kayak.speed > 0.3:
		_kick_t -= delta * (factor - 1.0) / 0.8
		if _kick_t <= 0.0:
			_kick_t = RIP_KICK_EVERY
			kayak.kick(0.7 + 0.8 * state)  # up to a wave that will put an unbraced boat over
			Sound.hull_slap(0.4 + 0.4 * state)
	var drift := cur * delta * (1.0 + _groove * (GROOVE_HOURS_PER_SEC * 3600.0 - 1.0) * 0.25)
	var landing := here + drift * 4.0
	if terrain.height_at(landing.x, landing.z) < -0.5:
		kayak.global_position += drift
	var rip := " · ×%.1f %s" % [factor, str(_flow.name)] if factor > 1.15 else ""
	var trim_note := " · " + Packing.trim_words(_pack) if Packing.handling_penalty(_pack) > 0.2 else ""
	if kayak.assembly < 0.7:
		trim_note += " · slack hull"
	_set_label.text = "%s: %s%s · wind %d kn from %03d°%s" % [str(_route.get("channel", "San Juan Channel")), Tides.describe(_day, _hour), rip, int(round(Tides.wind(_day, _hour).kn)), int(round(Tides.wind(_day, _hour).fromDeg)), trim_note]
	_dest_label.text = "%s · %.1f km · %03d° · %s%s" % [Leg.cove_name(_route), dist / 1000.0, int(round(brg)), Leg.clock(_hour), " · in the groove" if _groove > 0.5 else ""]
	if dist < 220.0:
		_arrived = true
		_groove = 0.0
		App.save.arrivedHour = _hour
		_record_day()
		App.persist()
		controls.visible = false
		Sound.gull()
		_clear_card()
		var land_card: Dictionary = _route.get("landing", {})
		_card = UIKit.card(land_card.get("title", "Landing"), "%s The day is done at %s." % [land_card.get("text", ""), Leg.clock(_hour)], App.sources_line(land_card.get("sourceIds", [])), [["Land and make camp", func() -> void: App.next(), true]], "Landing · day %d" % (Leg.index() + 1))
		_ui.add_child(UIKit.spacer())
		_ui.add_child(_card)

## The day for the debrief: the launch and its verdict, the landing, the swims, and the wildlife
## given room or not. One entry per leg; paddling a day again replaces its entry.
func _record_day() -> void:
	var respectful := 0
	var violations := 0
	for s in _sightings:
		if not s.seen or int(_species(s.conf.species).get("approachMetres", 0)) <= 0:
			continue
		if bool(s.get("close", false)):
			violations += 1
		else:
			respectful += 1
	var launch := Leg.launch_hour()
	var entry := {
		"leg": Leg.index(), "metres": Leg.length_m(_route), "launchHour": launch, "arrivedHour": _hour,
		"verdict": str(Tides.judge(_day, launch, Leg.hours_at_touring_pace(_route), str(_route.get("favours", "flood"))).verdict),
		"swims": _swims_today, "waits": _waits_today, "respectful": respectful, "violations": violations,
		"ferryHeld": _ferry_verdicts.count("held"), "ferryCrossed": _ferry_verdicts.count("crossed"),
	}
	var days: Array = App.save.get("days", [])
	var kept: Array = []
	for d in days:
		if int(d.get("leg", -1)) != Leg.index():
			kept.append(d)
	kept.append(entry)
	App.save.days = kept

## The wind is up: the float plan's bail-outs, with their distances, and the choice — push on, or
## tuck into the nearest lee and let the afternoon blow through. Nobody has to make it in one push.
func _offer_bailouts(state: float) -> void:
	_weather_asked = true
	var here := kayak.global_position
	var w := Tides.wind(_day, _hour)
	var nearest := ""
	var nearest_d := INF
	var lines: Array[String] = []
	for id in Leg.bailouts(_route):
		var at := terrain.place(str(id))
		var d := Vector2(at.x - here.x, at.z - here.z).length()
		var nm: String = str(id)
		for p in terrain.meta.get("places", []):
			if p.id == id:
				nm = p.name
		lines.append("%s · %.1f km" % [nm, d / 1000.0])
		if d < nearest_d:
			nearest_d = d
			nearest = nm
	var body := "%s: %d knots from %03d° and the sea is standing up%s. The float plan's bail-outs:\n%s\n\nNobody has to make it in one push. In a lee the afternoon wind blows through in an hour or two." % [str(_route.get("channel", "San Juan Channel")), int(round(float(w.kn))), int(round(float(w.fromDeg))), " against the stream" if Tides.wind_against_tide(_day, _hour) else "", "\n".join(lines)]
	var l := _lesson("bailouts")
	_clear_card()
	_card = UIKit.card("The wind is up", body, App.sources_line(["uscg", "aca"]) if l.get("text", "") == "" else App.sources_line(l.get("sourceIds", [])), [
		["Push on", _clear_card, false],
		["Wait it out · %s" % nearest, func() -> void: _wait_in_lee(nearest), true],
	], "Sea state %d%% · %s" % [int(round(state * 100.0)), Leg.clock(_hour)])
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

## An hour and a half in the lee: the clock moves, the water is read again, and the day's record
## keeps the judgment.
func _wait_in_lee(where: String) -> void:
	_clear_card()
	_hour += 1.5
	_waits_today += 1
	_groove = 0.0
	sea.apply_hour(_hour)
	var after := Tides.sea_state(_day, _hour, _flow.factor)
	note_label.text = "An hour and a half in the lee of %s, out of the wind, warm drink in hand. %s" % [where, "The sea has eased. Go on when you are ready." if after < ROUGH else "It is still rough. The next landing is the day's end if it does not ease."]
	if after < ROUGH:
		_weather_asked = false  # it can come up again later in the day

## On a phone, the option to edge by tilting the handset (off by default; it stays as set).
func _tilt_chip() -> void:
	if not controls.touch():
		return
	var b := UIKit.button("Tilt to edge: %s" % ("on" if controls.tilt_enabled else "off"), false)
	b.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	b.offset_left = -190; b.offset_right = -12; b.offset_top = -(Controls.HIPS_H + Controls.PAD * 2 + 48); b.offset_bottom = -(Controls.HIPS_H + Controls.PAD * 2 + 12)
	b.pressed.connect(func() -> void:
		controls.set_tilt(not controls.tilt_enabled)
		b.text = "Tilt to edge: %s" % ("on" if controls.tilt_enabled else "off"))
	hud.add_child(b)

func _process(delta: float) -> void:
	kayak.sea_time = sea.time
	speed_label.text = "%.1f kn" % absf(kayak.speed_knots())
	_compass.heading = kayak.heading
	_since_start += delta
	if mode == "trip" and not _arrived and not _swimming and App._url_param("capsize") == "1" and _since_start > 2.0 and not kayak.over:
		kayak.over = true  # `?scene=trip&capsize=1`: straight into the water, for checks
		kayak.global_basis = kayak.global_basis.rotated(-kayak.global_basis.z, PI)
		_on_capsized()
	if mode == "trip" and not _arrived and not _swimming:
		_leg(delta)
		_watch_traffic(delta)
	if _partner and mode == "trip" and not _arrived:
		_partner.follow(kayak, sea, delta)
		if _chart:
			_chart.boat = kayak.global_position
			_chart.heading = kayak.heading
		_watch_sightings()
	_places.visible = hud.visible
	if _places.visible:
		_places.update(rig.camera())
	if _drill >= 0:
		_drill_progress(delta)

func _physics_process(_delta: float) -> void:
	# Running aground: the hull stops in the shallows instead of climbing the beach.
	var fwd := -kayak.global_basis.z
	var ahead := kayak.global_position + fwd * (2.6 if kayak.speed >= 0.0 else -2.6)
	if terrain.height_at(ahead.x, ahead.z) > -0.5:
		kayak.linear_velocity *= 0.6
		kayak.apply_central_force(-fwd * signf(kayak.speed) * kayak.mass * 4.0)
		if mode == "trip" and _drill < 0:
			note_label.text = "Aground — reverse off (drag up, or hold S)."

# ---------- Kayak School ----------

## Every stop on the tour: boat parts on the hull, body points on the paddler, paddle parts, then
## the drills. Anchors are in the kayak's local space (x starboard, y up, z aft).
func _build_tour() -> void:
	var c := App.content
	var hull_anchor := func(s: float, lat: float, which: String) -> Vector3:
		var h := Hull.heights(s)
		return Vector3(lat, h[which], -Hull.x_at(s))
	var anchors := {
		"bow": hull_anchor.call(0.02, 0.0, "ridge"), "stern": hull_anchor.call(0.98, 0.0, "ridge"),
		"deck": hull_anchor.call(0.25, 0.0, "ridge"), "hull": hull_anchor.call(0.3, 0.22, "chine"),
		"keel": hull_anchor.call(0.48, 0.0, "keel"), "chine": hull_anchor.call(0.76, 0.22, "chine"),
		"cockpit": Vector3(0, 0.26, -0.35), "skirt": Vector3(0, 0.3, 0.0), "frame": hull_anchor.call(0.15, 0.15, "sheer"),
		"jacks": Vector3(0.2, 0.2, -0.05), "float": hull_anchor.call(0.82, 0.1, "sheer"),
	}
	var views := {
		"bow": [3.2, 0.4, 0.25], "stern": [3.2, PI - 0.4, 0.25], "deck": [2.6, 1.1, 0.7], "hull": [3.0, 1.3, -0.05],
		"keel": [3.4, 1.5, -0.25], "chine": [2.8, 1.7, 0.05], "cockpit": [2.4, 0.9, 0.8], "skirt": [2.0, 0.5, 0.9],
		"frame": [2.4, 1.2, 0.5], "jacks": [2.2, 1.4, 0.6], "float": [2.6, 2.3, 0.5],
	}
	_tour.clear()
	_tour.append({ "kind": "intro", "kicker": "Kayak School", "title": "Know your boat, your body, your paddle", "text": "Before the crossing, a quiet beach and the boat you will paddle all game. Tap Next to walk around it.", "source": "", "anchor": Vector3(0, 0.2, 0), "dist": 7.0, "az": 0.7, "el": 0.45 })
	for p in c.get("kayakParts", []):
		var v: Array = views.get(p.id, [3.0, 0.8, 0.4])
		_tour.append({ "kind": "boat", "kicker": "The boat", "title": p.name, "text": p.text, "source": App.sources_line(p.sourceIds), "anchor": anchors.get(p.id, Vector3.ZERO), "dist": v[0], "az": v[1], "el": v[2] })
	var body_views := { "feet": [2.2, 0.9, 0.5], "knees": [2.0, 1.0, 0.55], "hips": [2.2, 1.3, 0.35], "back": [2.2, 2.6, 0.4], "head": [1.8, 0.8, 0.3] }
	for b in c.get("bodyPoints", []):
		var v: Array = body_views.get(b.id, [2.2, 1.0, 0.4])
		_tour.append({ "kind": "body", "kicker": "The body", "title": b.name, "text": b.text, "source": App.sources_line(b.sourceIds), "anchor": kayak.paddler_anchor(b.id), "dist": v[0], "az": v[1], "el": v[2] })
	var paddle_views := { "blade": [1.6, 1.4, 0.5], "loom": [1.6, 0.2, 0.7], "shoulder": [1.4, 1.6, 0.6], "tip": [1.4, 1.7, 0.4], "box": [2.0, 0.1, 0.5] }
	for pp in c.get("paddleParts", []):
		var v: Array = paddle_views.get(pp.id, [1.6, 1.0, 0.5])
		_tour.append({ "kind": "paddle", "kicker": "The paddle", "title": pp.name, "text": pp.text, "source": App.sources_line(pp.sourceIds), "anchor": kayak.paddler_anchor(pp.id), "dist": v[0], "az": v[1], "el": v[2] })
	_tour.append({ "kind": "drills", "kicker": "Calm water", "title": "Now paddle it", "text": "Six short drills: the forward stroke, the reverse stroke, edging, the sweep turn, the low brace, and the rescue. Everything later builds on these.", "source": "", "anchor": Vector3(0, 0.3, 0), "dist": 6.0, "az": 0.2, "el": 0.5 })

func _show_phase() -> void:
	App.school_from = _phase
	var t: Dictionary = _tour[_phase]
	rig.focus(t.anchor, t.dist, t.az, t.el)
	_clear_card()
	var actions: Array = []
	if _phase > 0:
		actions.append(["Back", func() -> void: _phase -= 1; _show_phase(), false])
	if t.kind == "drills":
		actions.append(["Into the water", _start_drills, true])
	else:
		actions.append(["Next", func() -> void: _phase += 1; _show_phase(), true])
	_card = UIKit.card(t.title, t.text, t.source, actions, "%s · %d of %d" % [t.kicker, _phase + 1, _tour.size()])
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

func _clear_card() -> void:
	for ch in _ui.get_children():
		ch.queue_free()
	_card = null

func _start_drills() -> void:
	_clear_card()
	controls.visible = true
	hud.visible = true
	rig.chase()
	_start_drill(0)

func _drills() -> Array:
	return App.content.get("drills", [])

func _start_drill(i: int) -> void:
	_drill = i
	_drill_state = { "count": 0, "t": 0.0, "turned": 0.0, "prev": kayak.heading }
	var d: Dictionary = _drills()[i]
	var keys := "" if DisplayServer.is_touchscreen_available() else "\nKeyboard: %s." % d.get("keys", "")
	note_label.text = "%s\n%s\nGoal: %s.%s" % [d.title, d.text, d.goal, keys]
	if _drill_bar == null:
		_drill_bar = ProgressBar.new()
		_drill_bar.show_percentage = false
		_drill_bar.custom_minimum_size = Vector2(0, 5)
		_drill_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
		_drill_bar.offset_left = 30; _drill_bar.offset_right = -30
		_drill_bar.offset_top = -234; _drill_bar.offset_bottom = -229
		var bg := StyleBoxFlat.new(); bg.bg_color = Color(1, 1, 1, 0.15); bg.set_corner_radius_all(3)
		var fg := StyleBoxFlat.new(); fg.bg_color = UIKit.SUN; fg.set_corner_radius_all(3)
		_drill_bar.add_theme_stylebox_override("background", bg)
		_drill_bar.add_theme_stylebox_override("fill", fg)
		hud.add_child(_drill_bar)
	_drill_bar.value = 0
	if d.id == "brace":
		_wobble = 2.5
	if d.id == "rescue":
		_capsize_in = 2.5

func _drill_progress(delta: float) -> void:
	var d: Dictionary = _drills()[_drill]
	var s := _drill_state
	var p := 0.0
	match d.id:
		"forward": p = s.count / 6.0
		"reverse": p = s.count / 4.0
		"edge":
			s.t = s.t + delta if absf(kayak.edge) > 0.6 else maxf(0.0, s.t - delta * 2.0)
			p = s.t / 3.0
		"sweep":
			var dh := angle_difference(s.prev, kayak.heading)
			s.prev = kayak.heading
			if absf(kayak.edge) > 0.4 or absf(controls.steer) > 0.5:
				s.turned += absf(dh)
			p = s.turned / PI
		"rescue":
			if _capsize_in > 0.0:
				_capsize_in -= delta
				if _capsize_in <= 0.0 and not kayak.over and not _swimming:
					kayak.over = true
					kayak.global_basis = kayak.global_basis.rotated(-kayak.global_basis.z, PI)
					_on_capsized()
			p = float(s.count)
		"brace":
			_wobble -= delta
			if _wobble <= 0.0:
				_wobble = 3.2
				kayak.kick(1.3)  # rolls the boat to about 35°: a brace settles it, an unbraced boat survives it
				Sound.hull_slap(0.7)
			if kayak.wobbling() and controls.braced and not s.get("braced_now", false):
				s.braced_now = true
				s.count += 1
				kayak.settle()
				note_label.text = "Braced — %d of 3" % s.count
			elif not kayak.wobbling():
				s.braced_now = false
			p = s.count / 3.0
	_drill_bar.value = clampf(p, 0.0, 1.0) * 100.0
	if p >= 1.0:
		_drill = -1
		var done: Array = App.save.get("drills", [])
		if not done.has(d.id):
			done.append(d.id)
			App.save.drills = done
			App.persist()
		var next_i := _drills().find(d) + 1
		note_label.text = "Nicely done."
		if next_i < _drills().size():
			get_tree().create_timer(1.0).timeout.connect(func() -> void: _start_drill(next_i))
		else:
			_finish_school()

func _finish_school() -> void:
	controls.visible = false
	_drill_bar.visible = false
	_clear_card()
	_card = UIKit.card("Kayak School complete", "Power from the torso, control from the hips, head down in a brace. Everything from here builds on this.", App.sources_line(["aca"]), [["Pack the boat", func() -> void: App.next(), true]], "Kayak School")
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

# ---------- Strokes ----------

func _on_stroke(side: int, q: float, kind: String) -> void:
	match kind:
		"forward":
			kayak.stroke(side, q)
			if q >= StrokeMath.GOOD_STROKE:
				Sound.dip(0.5)  # good paddling is nearly silent
			else:
				Sound.splash(0.45)
			if _drill >= 0 and _drills()[_drill].id == "forward":
				if q >= StrokeMath.GOOD_STROKE:
					_drill_state.count += 1
					note_label.text = "%d of 6 rotation strokes" % _drill_state.count
				else:
					note_label.text = "Not counted — %s" % _why_arms()
			elif mode == "trip":
				if q >= StrokeMath.GOOD_STROKE:
					_count += 1
					note_label.text = "%d rotation strokes" % _count
				else:
					note_label.text = "Arms — rotate"
		"sweep":
			kayak.sweep(side)
			Sound.splash(0.7)
		"reverse":
			kayak.reverse(side)
			Sound.dip(0.6)
			if _drill >= 0 and _drills()[_drill].id == "reverse":
				_drill_state.count += 1
				note_label.text = "%d of 4 reverse strokes" % _drill_state.count

func _why_arms() -> String:
	return "hold and let the rhythm settle; a tap is an arm stroke"

func _unhandled_input(ev: InputEvent) -> void:
	if ev is InputEventKey and ev.pressed and not ev.echo and ev.keycode == KEY_M and _chart:
		_chart.folded = not _chart.folded
		App.save.chartFolded = _chart.folded
		App.persist()

## Over. On the trip the rescue is taught where it happens: the 1-10-1 rule, the wet exit, the
## paddle-float re-entry, pumping out — then back in the boat, fifteen minutes and a lot of warmth
## later. In Kayak School the boat simply comes back up with a word about bracing earlier.
func _on_capsized() -> void:
	Sound.splash(1.0)
	var rescue_drill: bool = mode == "school" and _drill >= 0 and _drills()[_drill].id == "rescue"
	if rescue_drill:
		_swimming = true
		controls.visible = false
		_rescue_steps = SOLO_STEPS
		_rescue_step = 0
		_show_rescue()
		return
	if mode != "trip":
		kayak.right()
		note_label.text = "That one went over. Set up earlier: blade flat on the water, hips snap the boat back under you."
		return
	_swimming = true
	_groove = 0.0
	controls.visible = false
	App.save.swims = int(App.save.get("swims", 0)) + 1
	_swims_today += 1
	App.persist()
	_rescue_steps = RESCUE_STEPS
	_rescue_step = 0
	_show_rescue()

func _lesson(id: String) -> Dictionary:
	for l in App.content.get("lessons", []):
		if l.id == id:
			return l
	return { "title": id, "text": "", "sourceIds": [] }

func _show_rescue() -> void:
	_clear_card()
	var l := _lesson(_rescue_steps[_rescue_step])
	var last := _rescue_step >= _rescue_steps.size() - 1
	var actions: Array = [[("Back in the boat" if last else "Next"), func() -> void:
		if last:
			_righted()
		else:
			_rescue_step += 1
			_show_rescue(), true]]
	var solo := _rescue_steps == SOLO_STEPS
	var kicker := ("Kayak School · in the water · %d of %d" % [_rescue_step + 1, _rescue_steps.size()]) if solo else ("In the water · %s · %d of %d" % [Leg.clock(_hour), _rescue_step + 1, _rescue_steps.size()])
	var text: String = l.get("text", "")
	if _rescue_step == 0 and solo:
		text = "Over you go, on purpose, in the harbour's flat water. " + text
	if _rescue_step == 0 and not solo:
		text = "You are in nine-degree water. %s is turning toward you. " % str(_partner.preset.get("name", "Your partner")) + text
	if _rescue_steps[_rescue_step] == "pumpOut" and not solo and not _pack.get("enables", []).has("pumpOut"):
		text = "The pump is on the beach at Friday Harbor. Bail with a sponge and a hat: twice as long with a boat full of nine-degree water. " + text
	_card = UIKit.card(l.get("title", ""), text, App.sources_line(l.get("sourceIds", [])), actions, kicker)
	_ui.add_child(UIKit.spacer())
	_ui.add_child(_card)

func _righted() -> void:
	_clear_card()
	kayak.right()
	_swimming = false
	controls.visible = true
	if _rescue_steps == SOLO_STEPS:
		_drill_state.count = 1  # the drill is done: back in and pumped dry
		note_label.text = "Back in the boat and dry. Alone, that is the paddle float; with a partner it is the T-rescue, and faster."
		return
	_hour += 0.15
	note_label.text = "Nine minutes in the water with a partner alongside. Paddle to warm up, and make the next landing the bail-out if the shivering does not stop."

## The ferry: a card as it comes within reach, a long blast as it closes, and its wake on the beam.
func _watch_traffic(delta: float) -> void:
	if _traffic == null:
		return
	_traffic.advance(delta)
	if _traffic.docked():
		return
	var d := _traffic.distance_to_boat(kayak.global_position)
	if d < Traffic.WARN_M and not _traffic.warned:
		_traffic.warned = true
		_clear_card()
		_card = UIKit.card("Ferry in the channel", "Hold your position and let it pass well ahead — it cannot stop or turn for you, and it is faster than it looks. When it has gone by, cross its wake at right angles, bow into the waves.", App.sources_line(["colregs", "wsf"]), [["Holding", _clear_card, true]], "Traffic")
		_ui.add_child(UIKit.spacer())
		_ui.add_child(_card)
		var met := int(App.save.get("ferriesMet", 0))
		App.save.ferriesMet = met + 1
		App.persist()
	if d < Traffic.HORN_M and not _traffic.honked:
		_traffic.honked = true
		_ferry_moved = false
		Sound.horn()
	if _traffic.honked and not _traffic.waked and kayak.speed > 0.8:
		_ferry_moved = true  # paddling on with the ferry closing is the thing the card said not to do
	if d < Traffic.WAKE_M and not _traffic.waked:
		_traffic.waked = true
		# Taken bow-on the wake is a few pitches; on the beam it is the roll the card warned of.
		var beam := Traffic.wake_beam(-kayak.global_basis.z, -_traffic.global_basis.z)
		kayak.kick(Traffic.wake_kick(beam))
		Sound.hull_slap(0.4 + 0.5 * beam)
		var wake_line := "The ferry's wake, bow-on: a few pitches and it is past." if beam < 0.4 else "The ferry's wake on the beam: brace, and next time turn the bow into it."
		_ferry_verdicts.append("crossed" if _ferry_moved else "held")
		note_label.text = wake_line + (" You paddled on as it came: a ferry cannot stop for you, and the lane is its." if _ferry_moved else " You held and let it pass: that is the crossing rule.")
