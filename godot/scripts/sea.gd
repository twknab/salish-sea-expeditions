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
var _fog := 0.0                 # Fog.amount of the hour (or 1 under `?fog=1`)
var _fog_said := false          # the fog note goes up once a leg
var _fog_signal_t := 0.0        # seconds to the ferry's next blast in the fog
var _fogged := false            # launched or paddled in fog today, for the record
var _fog_in_hour := -1.0        # when the fog closed in, for the record
var _dark_said := false         # the night-on-the-water note goes up once
var _rain_said := false         # the squall's note goes up once
var _note_hold := 0.0           # seconds a time-critical note keeps the line before the squall's or the night's may take it
const NOTE_HOLD := 8.0
var _notes: Array = []          # every note the day put up, in order, for the field notes
var _note_at: Array = []        # [[x, z]] where each was said, for the chart of the expedition
var _last_note := ""
const NOTES_KEPT := 24
var _rained := false            # rain fell on the leg, for the record
var _rain_now := 0.0            # the rain of the hour, read before the sea state is set
var _cross := CrossingWatch.new()  # the stream crossing: the line held, the ferry note, the slack card
var _thirsty := false           # last night's water was drunk: the strokes are shorter today
var _watchers: Array = []       # [{boat: WhaleWatch, pod: Wildlife, heading, seen}] — the fleet on the pod
var _thirsty_said := false
var _dark := false              # the light went before the landing, for the record
var _fog_off_m := -1.0          # how far off the planned line the boat was when it lifted
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
	# The pod again on the way home, working the channel west on the ebb this time, and the eagle on Jones's south point.
	{ "leg": 2, "kind": "orcas", "species": "biggsOrca", "at": Vector3(-7400.0, 0.0, -10560.0), "face": Vector3(-1, 0, 0), "radius": 1400.0 },
	{ "leg": 2, "kind": "porpoise", "species": "harbourPorpoise", "at": Vector3(-6200.0, 0.0, -10450.0), "face": Vector3(1, 0, 0), "radius": 420.0 },
	{ "leg": 2, "kind": "eagle", "species": "baldEagle", "at": Vector3(-2300.0, 0.0, -8900.0), "face": Vector3(0, 0, 1), "radius": 320.0 },
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
	for l: Label in [speed_label, note_label]:  # read against fog-grey as well as blue water
		l.add_theme_color_override("font_outline_color", Color(0.03, 0.06, 0.08, 0.7))
		l.add_theme_constant_override("outline_size", 4)
	if not controls.touch():
		note_label.size.x = 640.0  # a desktop window has the width: the opening line stays on one line, clear of the destination
	heading_label.visible = false
	_compass = Compass.new()
	_compass.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	var top := 222.0 if controls.touch() else 40.0  # under the note and the trip lines on a phone, beside them on a desktop
	_compass.offset_left = -112; _compass.offset_right = -14; _compass.offset_top = top; _compass.offset_bottom = top + 118
	hud.add_child(_compass)
	_places = PlaceLabels.new()
	_places.reach = 8000.0  # the landings ahead show as you come up the channel without crowding the horizon
	# The names stay off the HUD: the speed, the note and the destination lines at the top left, the
	# compass at the top right, and the chart tile below them (a phone's HUD is taller and wider).
	if controls.touch():
		_places.keep_out = [Rect2(0, 0, 4000, 420), Rect2(0, 420, 180, 160)]
	else:
		_places.keep_out = [Rect2(0, 0, 700, 170), Rect2(0, 170, 180, 160), Rect2(1180, 0, 400, 140)]
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
					kayak.linear_velocity = -kayak.global_basis.z * (1.6 if App._url_param("underway") == "1" else 0.0)  # `&underway=1`
					return
			_show_phase()
		_:
			_tilt_chip()
			_dest = Leg.cove(_route)
			_day = App.day()
			_hour = Leg.launch_hour()  # the launch the float plan chose
			kayak.effort = clampf(float(App.save.get("effort", 1.0)), 0.5, 1.0)
			_thirsty = kayak.effort < 0.99
			if App._url_param("hour") != "":  # `?scene=trip&hour=20`: the clock set, for checks
				_hour = clampf(float(App._url_param("hour")), 0.0, 26.0)
			sea.apply_hour(_hour)
			_set_label = UIKit.label("", 12, UIKit.MIST, controls.touch())  # wraps on a phone
			_set_label.position = Vector2(20, 172)
			_set_label.size = Vector2(350, 40) if controls.touch() else Vector2(520, 20)
			hud.add_child(_set_label)
			_dest_label = UIKit.label("", 13, UIKit.FOAM, false, true)
			for l: Label in [_set_label, _dest_label]:
				l.add_theme_color_override("font_outline_color", Color(0.03, 0.06, 0.08, 0.7))
				l.add_theme_constant_override("outline_size", 4)
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
			var start := CheckStarts.at(App._url_param("near"), App._url_param("close") == "1")  # starts for checks
			if not start.is_empty():
				kayak.global_position = Vector3(float(start[0]), 0.1, float(start[1]))
				kayak.rotation.y = -deg_to_rad(float(start[2]))
			match App._url_param("near"):
				"jones", "posey", "home":
					kayak.global_position = _dest + Vector3(0.0, 0.1, -900.0)  # 900 m north of the cove
					kayak.rotation.y = PI  # heading south, into the cove
				"ferry":  # `?scene=trip&near=ferry`: the ferry 600 m ahead, coming up the channel
					_traffic.place_near(kayak.global_position, 600.0)
				"fleet":  # `?scene=trip&leg=1&near=fleet`: astern of the whale-watch boat, looking along the pod's line
					if not _watchers.is_empty():
						var w: Dictionary = _watchers[0]
						var b: Vector3 = w.boat.global_position
						var h: Vector3 = Vector3(w.heading).normalized()
						kayak.global_position = Vector3(b.x, 0.1, b.z) - h * 60.0  # the boat walks with the pod, away from here
						kayak.rotation = Vector3(0.0, atan2(-h.x, -h.z), 0.0)  # the bow (-z) along the pod's heading, the boat on it
			if App._url_param("hdg") != "":  # `&hdg=0`: the bow on a bearing, for checks
				kayak.rotation.y = -deg_to_rad(float(App._url_param("hdg")))
			if App._url_param("underway") == "1":  # `&underway=1`: the boat already making way, for checks
				kayak.linear_velocity = -kayak.global_basis.z * 1.6
			var opening := "Friday Harbor · San Juan Channel opens ahead" if Leg.index() == 0 else "Day %d · %s" % [Leg.index() + 1, str(_route.get("title", ""))]
			if _partner:
				opening += " · with %s" % str(_partner.preset.get("name", "a partner"))
			note_label.text = "%s\n%s" % [opening, ("Hold to paddle · slide to lean" if controls.touch() else "Hold W to paddle · A/D lean · S back · Q/E edge · J brace · M chart")]

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
		if conf.kind == "orcas":
			# The blow carries: loud alongside, a breath on the wind at a kilometre, nothing beyond.
			node.breathed.connect(func() -> void: Sound.blow(1.0 - clampf(kayak.global_position.distance_to(node.global_position) / 1200.0, 0.0, 1.0)))
		if conf.kind == "orcas" and mode == "trip":
			# The whale-watch fleet is on every pod in the channel, holding off abeam at the distance.
			var boat := WhaleWatch.new()
			add_child(boat)
			var heading: Vector3 = conf.face
			var keep := float(_species(conf.species).get("approachMetres", WhaleWatch.STANDOFF))  # the field guide's distance, the fleet's too
			# Abeam on whichever side is water along the pod's whole pass; nearer if neither is.
			var side := 1.0
			var at_keep := keep
			if not _water_along(node.global_position, heading, 1.0, keep):
				side = -1.0
				if not _water_along(node.global_position, heading, -1.0, keep):
					side = 1.0
					at_keep = WhaleWatch.STANDOFF
			# The pod's walk starts 600 m back along its heading (Wildlife._process), so the boat starts there too.
			boat.global_position = WhaleWatch.station_for(node.global_position - heading.normalized() * 600.0, heading, side, at_keep)
			_watchers.append({ "boat": boat, "pod": node, "heading": heading, "keep": at_keep, "side": side, "seen": false })
## True when the station abeam of the pod's line, over its whole walk, is on the water.
func _water_along(origin: Vector3, heading: Vector3, side: float, keep: float) -> bool:
	for along in [-600.0, -300.0, 0.0, 300.0, 600.0]:
		var p := WhaleWatch.station_for(origin + heading.normalized() * along, heading, side, keep)
		if terrain.height_at(p.x, p.z) > -0.5:
			return false
	return true

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
					if level == 1:
						note_label.text = _said("seals") + "Heads up on the rock: you are inside the hundred yards. Ease off and they settle."
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
		if conf.kind == "eagle":
			Sound.eagle()
		var text: String = (_said("orcas") if conf.kind == "orcas" else "") + str(sp.get("blurb", ""))
		var facts: Array = sp.get("facts", [])
		if not facts.is_empty():
			text += "\n\n" + str(facts[0])
		var approach := int(sp.get("approachMetres", 0))
		if approach > 0:
			text += "\n\nKeep %d m off: let it come to you, or not." % approach
		_show(UIKit.card(sp.get("common", conf.species), text, App.sources_line(sp.get("sourceIds", [])), [["Noted", _clear_card, true]], "Sighting · %s" % sp.get("group", "")))
		Sound.gull()

func _species(id: String) -> Dictionary:
	for sp in App.content.get("species", []):
		if sp.id == id:
			return sp
	return {}

## The partner's words for a moment, to go in front of a note or a card; empty on a drill, alone.
func _said(event: String) -> String:
	if _partner == null or mode != "trip":
		return ""
	return PartnerVoice.said(str(_partner.preset.get("name", "Your partner")), event)

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
	# The white light: shown after dark and in fog, on both boats, as the kit list said it would be.
	var lights := sea.night > 0.3 or Fog.blind(_fog)
	for k in [kayak, _partner.kayak if _partner else null]:
		if k: k.set_light(lights)
	_note_hold = maxf(0.0, _note_hold - delta)
	if sea.night > 0.3 and not _dark_said and _note_hold <= 0.0:
		_dark_said = true
		_dark = true
		note_label.text = _said("dark") + ("Night on the water. The white light goes on, the shore is a shape, and the landing is by compass and the sound of the beach." if not controls.touch() else "Night on the water: light on, land by compass.")
	# The current carries the boat over the ground, in the groove and out of it (scaled with its hours).
	_flow = Leg.flow_at(_route, here)
	var factor: float = _flow.factor
	var cur := Tides.current_vector(_day, _hour) * factor * _cross.eddy(terrain.shore_distance(here.x, here.z), Tides.current_kn(_day, _hour) * factor)
	# The crossing: the course made good against the line, timed for the record, and the ferry note or
	# the slack card when the stream calls for one.
	var said := _cross.tick(delta, -kayak.global_basis.z, kayak.speed, brg, cur, Fog.blind(_fog), _card != null)
	if _chart:
		_chart.stream = cur  # the tile shows where the water is going, rips included
		_chart.cmg = _cross.cmg
	var kn := Tides.current_kn(_day, _hour)
	Sound.set_rip(CrossingWatch.rip_level(factor, kn))
	if _cross.turned(kn) and not Fog.blind(_fog) and _card == null:
		note_label.text = _said("turn") + CrossingWatch.turn_note(kn, str(_route.get("favours", "flood")), controls.touch())
		_note_hold = NOTE_HOLD
	elif said == "slack":
		_offer_slack(cur.length() / FerryGlide.KN)
	elif said == "eddy":
		note_label.text = _said("eddy") + CrossingWatch.eddy_note(controls.touch())
		_note_hold = NOTE_HOLD
	elif said == "ferry":
		note_label.text = FerryGlide.note(_cross.set_deg, _cross.steer, Leg.cove_name(_route), controls.touch())
		_note_hold = NOTE_HOLD
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
		note_label.text = _said("kelp") + "In the kelp: the fronds grab the blade and the swell lies down. A kelp bed is a lee, and a slow one."
	_rain_now = 1.0 if App._url_param("rain") == "1" else Tides.rain(_day, _hour)  # `?rain=1` for checks
	var state := Tides.sea_state(_day, _hour, factor) * (1.0 - 0.6 * kelp) * (1.0 - 0.25 * _rain_now)  # rain lies the chop down a little
	if state >= ROUGH and not _weather_asked and _card == null:
		_offer_bailouts(state)
	var w := Tides.wind(_day, _hour)
	kayak.wind = Windage.vector(float(w.kn), float(w.fromDeg))
	# Fog: the leg's morning may start in it. The islands go, the chart loses its fix, the compass
	# holds the bearing; the ferry sounds its blast every two minutes until it burns off.
	match App._url_param("fog"):  # `?fog=1` socks any leg in; `?fog=lift` lifts it after a second
		"1":
			_fog = 1.0
		"lift":
			_fog = 1.0 if _since_start < 1.0 else 0.0
		_:
			_fog = Fog.amount(_route, _hour)
	if Fog.blind(_fog) and _fog_in_hour < 0.0:
		_fog_in_hour = _hour
	elif not Fog.blind(_fog) and _fog_in_hour >= 0.0 and _fog_off_m < 0.0:
		# The fog lifts: the islands come back, and the compass work is judged by where you are.
		_fog_off_m = Leg.off_track_m(_route, here)
		var line := "The fog lifts. %s" % ("You are on the line you planned: %s is fine on the bow at %03d°." % [Leg.cove_name(_route), int(round(brg))] if _fog_off_m < 150.0 else "You came out %d m off the line you planned; %s bears %03d°. Dead reckoning drifts with the stream — that is why the fix matters." % [int(_fog_off_m), Leg.cove_name(_route), int(round(brg))])
		note_label.text = _said("fog_lifts") + line
	sea.set_fog(_fog)
	var rain := _rain_now
	sea.set_rain(rain)
	Sound.set_rain(rain)
	if rain > 0.3:
		_rained = true
		if not _rain_said and _note_hold <= 0.0:
			_rain_said = true
			note_label.text = _said("rain") + ("Rain. Hood up and keep paddling: the drops flatten the chop, and it is the wind behind the front that matters, not the water on your deck." if not controls.touch() else "Rain. Hood up, keep paddling; watch the wind behind it.")
	if _chart:
		_chart.blind = Fog.blind(_fog)
	if Fog.blind(_fog):
		_fogged = true
		if not _fog_said:
			_fog_said = true
			if controls.touch():  # three lines is the phone's room
				note_label.text = _said("fog") + "Fog. The chart has no fix; the compass does. Hold %03d°, and stop for a long blast." % int(round(brg))
			else:
				note_label.text = _said("fog") + "Fog. The islands are gone and the chart has no fix; the compass does. Hold %03d°, count your strokes, keep a paddle length off. A long blast is a vessel under way: stop and listen." % int(round(brg))
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
	if Fog.blind(_fog):
		_dest_label.text = "%s · fog, %d m · steer %03d° · %s%s" % [Leg.cove_name(_route), int(Fog.visibility_m(_fog)), int(round(brg)), Leg.clock(_hour), " · in the groove" if _groove > 0.5 else ""]
	else:
		_dest_label.text = "%s · %.1f km · %03d° · %s%s" % [Leg.cove_name(_route), dist / 1000.0, int(round(brg)), Leg.clock(_hour), " · in the groove" if _groove > 0.5 else ""]
	if dist < 220.0:
		_arrived = true
		_groove = 0.0
		App.save.arrivedHour = _hour
		_record_day()
		App.persist()
		controls.visible = false
		Sound.gull()
		var land_card: Dictionary = _route.get("landing", {})
		_show(UIKit.card(land_card.get("title", "Landing"), "%s%s The day is done at %s." % [_said("landing"), land_card.get("text", ""), Leg.clock(_hour)], App.sources_line(land_card.get("sourceIds", [])), [["Land and make camp", func() -> void: App.next(), true]], "Landing · day %d" % (Leg.index() + 1)))

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
		"swims": _swims_today, "waits": _waits_today, "slackWaited": _cross.slack == 2, "respectful": respectful, "violations": violations,
		"ferryHeld": _ferry_verdicts.count("held"), "ferryCrossed": _ferry_verdicts.count("crossed"),
		"streamS": _cross.stream_s, "onLineS": _cross.on_line_s,
		"fog": _fogged, "fogInHour": _fog_in_hour, "fogOffM": _fog_off_m, "dark": _dark, "thirsty": _thirsty, "rain": _rained,
		"notes": _notes.duplicate(), "noteAt": _note_at.duplicate(),
		"lateStart": float(App.save.get("lateStart", 0.0)),
	}
	App.save.erase("lateStart")  # the water run and the thirst are this day's; tomorrow starts fresh
	App.save.erase("effort")
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
	var opener := "%s: %d knots from %03d° and the sea is standing up%s. The float plan's bail-outs:\n%s"
	var body := _said("rough") + (opener + "\n\nNobody has to make it in one push. In a lee the afternoon wind blows through in an hour or two.") % [str(_route.get("channel", "San Juan Channel")), int(round(float(w.kn))), int(round(float(w.fromDeg))), " against the stream" if Tides.wind_against_tide(_day, _hour) else "", "\n".join(lines)]
	var l := _lesson("bailouts")
	_show(UIKit.card("The wind is up", body, App.sources_line(["uscg", "aca"]) if l.get("text", "") == "" else App.sources_line(l.get("sourceIds", [])), [
		["Push on", _clear_card, false],
		["Wait it out · %s" % nearest, func() -> void: _wait_in_lee(nearest), true],
	], "Sea state %d%% · %s" % [int(round(state * 100.0)), Leg.clock(_hour)]))

## Time waited ashore or in an eddy: the clock moves, the water is read again, and the day's record
## keeps the judgment.
func _wait(hours: float) -> void:
	_clear_card()
	_hour += hours
	_groove = 0.0
	sea.apply_hour(_hour)

## The stream faster across the line than the boat: wait for slack, or push on and be carried.
func _offer_slack(knots: float) -> void:
	var slack := Tides.next_slack(_day, _hour)
	var actions: Array = [["Push on", _clear_card, is_nan(slack)]]
	if not is_nan(slack):
		actions.append(["Wait for slack · %s" % Leg.clock(slack), func() -> void: _wait(slack - _hour); _cross.slack = 2; note_label.text = "Slack water at %s: the stream has stopped. Cross now, before it turns and runs the other way." % Leg.clock(_hour), true])
	_show(UIKit.card("Faster than you paddle", FerryGlide.slack_body(knots, Leg.cove_name(_route), slack, Leg.clock(slack) if not is_nan(slack) else "", slack > Tides.sunset_h(_day)), App.sources_line(["noaa-tides", "aca"]), actions, "Stream %.1f kn · %s" % [knots, Leg.clock(_hour)]))

## An hour and a half in the lee, out of the wind.
func _wait_in_lee(where: String) -> void:
	_wait(1.5)
	_waits_today += 1
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
	if mode == "trip" and note_label.text != _last_note:
		# The field notes: what the water said today, kept for the debrief. The opening line and the
		# stroke counts are not notes.
		_last_note = note_label.text
		var line := _last_note.strip_edges()
		if line != "" and not line.begins_with("Day ") and not line.begins_with("Friday Harbor ·") and not line.contains("rotation strokes") and not _notes.has(line) and _notes.size() < NOTES_KEPT:
			_notes.append(line)
			_note_at.append([snappedf(kayak.global_position.x, 1.0), snappedf(kayak.global_position.z, 1.0)])
	_compass.heading = kayak.heading
	_since_start += delta
	if mode == "trip" and not _arrived and not _swimming and App._url_param("capsize") == "1" and _since_start > 2.0 and not kayak.over:
		kayak.over = true  # `?scene=trip&capsize=1`: straight into the water, for checks
		kayak.global_basis = kayak.global_basis.rotated(-kayak.global_basis.z, PI)
		_on_capsized()
	if mode == "trip" and not _arrived and not _swimming:
		_leg(delta)
		_watch_traffic(delta)
	var engine := 0.0
	for w in _watchers:
		w.boat.follow(w.pod, w.heading, delta, float(w.keep), float(w.side))
		engine = maxf(engine, 1.0 - clampf(kayak.global_position.distance_to(w.boat.global_position) / 500.0, 0.0, 1.0))
		if not w.seen and kayak.global_position.distance_to(w.boat.global_position) < 700.0:
			w.seen = true
			note_label.text = "A whale-watch boat holds off the pod abeam at %d m, engine at idle. The fleet keeps the distance you are asked to keep, and it is watching where you are, too." % int(w.keep)
	Sound.set_engine(engine)
	if _partner and mode == "trip" and not _arrived:
		_partner.follow(kayak, sea, delta)
		if _chart and not _chart.blind:  # in fog the chart keeps the last fix
			_chart.boat = kayak.global_position
			_chart.heading = kayak.heading
		_watch_sightings()
	_places.visible = hud.visible
	if _places.visible:
		_places.reach = minf(minf(8000.0, Fog.visibility_m(_fog)), lerpf(8000.0, 2500.0, _rain_now))  # in fog, and in rain, the shore names go with the shore
		_places.update(rig.camera())
	if controls.touch():  # on a phone the compass sits under the note, however long the note runs
		_compass.position.y = maxf(222.0, note_label.get_rect().end.y + 10.0)
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
	_tour.append({ "kind": "drills", "kicker": "Calm water", "title": "Now paddle it", "text": "Eight short drills: the forward stroke, the reverse stroke, edging, the sweep turn, the low brace, a bearing held on the compass, a stream crossed on a ferry angle, and the rescue. Everything later builds on these.", "source": "", "anchor": Vector3(0, 0.3, 0), "dist": 6.0, "az": 0.2, "el": 0.5 })

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
	_show(UIKit.card(t.title, t.text, t.source, actions, "%s · %d of %d" % [t.kicker, _phase + 1, _tour.size()]))

## A card at the foot of the screen, in place of the last one, pushed down by a spacer.
func _show(card: PanelContainer) -> void:
	_clear_card()
	_card = card
	_ui.add_child(UIKit.spacer())
	_ui.add_child(card)

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
		_drill_bar = UIKit.thin_bar(234)
		hud.add_child(_drill_bar)
	_drill_bar.value = 0
	_wobble = 2.5 if d.id == "brace" else _wobble
	_capsize_in = 2.5 if d.id == "rescue" else _capsize_in
	if d.id == "compass":
		# Seventy degrees round from where the bow points now: a real turn to make, then a line to hold.
		var target_deg := fposmod(FerryGlide.course_made_good(-kayak.global_basis.z, Vector3.ZERO) + 70.0, 360.0)
		s_target_set(target_deg)
		note_label.text = "%s\n%s\nGoal: steer %03d° and hold it for twelve seconds, under way.%s" % [d.title, d.text, int(round(target_deg)), keys]
	elif d.id == "ferry":
		# The line is where the bow points now; a knot of stream runs across it from the left.
		_drill_state.line = FerryGlide.course_made_good(-kayak.global_basis.z, Vector3.ZERO)  # the bow now, not last tick's heading
		_drill_state.stream = FerryGlide.across(float(_drill_state.line), 1.0)
		_compass.target = deg_to_rad(float(_drill_state.line))
	else:
		_compass.target = NAN

## The compass drill's mark on the dome, and the number the note names.
func s_target_set(target_deg: float) -> void:
	_drill_state.target = target_deg
	_compass.target = deg_to_rad(target_deg)

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
		"compass":
			var off := absf(angle_difference(deg_to_rad(float(s.get("target", 0.0))), kayak.heading))
			var on_line := off < deg_to_rad(10.0) and kayak.speed > 0.4
			s.t = s.t + delta if on_line else maxf(0.0, s.t - delta * 0.5)
			p = s.t / 12.0
		"ferry":
			kayak.global_position += s.stream * delta  # the water carries the boat, whatever it points at
			var cmg := FerryGlide.course_made_good(-kayak.global_basis.z * kayak.speed, s.stream) if kayak.speed > 0.4 else NAN
			s.t = s.t + delta if FerryGlide.off_line(cmg, float(s.line)) < 10.0 and not is_nan(cmg) else maxf(0.0, s.t - delta * 0.5)
			p = s.t / 12.0
			note_label.text = "%s\n%s\nGoal: %s." % [d.title, str(d.text) if is_nan(cmg) else "The line is the mark, %03d°. Making good %03d°." % [int(s.line), int(round(cmg))], d.goal]  # the lesson while still, numbers under way
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
		_compass.target = NAN  # the drills' marks were theirs; the trip puts the cove's there
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
	_show(UIKit.card("Kayak School complete", "Power from the torso, control from the hips, head down in a brace. Everything from here builds on this.", App.sources_line(["aca"]), [["Pack the boat", func() -> void: App.next(), true]], "Kayak School"))

# ---------- Strokes ----------

func _on_stroke(side: int, q: float, kind: String) -> void:
	match kind:
		"forward":
			kayak.stroke(side, q)
			if _thirsty and not _thirsty_said and mode == "trip":
				_thirsty_said = true
				note_label.text = "Thirsty from last night: the strokes are shorter and the day is longer than the chart says. A mouthful every half hour, and the tap at the town float."
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
		text = _said("capsize") + "You are in nine-degree water. %s is turning toward you. " % str(_partner.preset.get("name", "Your partner")) + text
	if _rescue_steps[_rescue_step] == "pumpOut" and not solo and not _pack.get("enables", []).has("pumpOut"):
		text = "The pump is on the beach at Friday Harbor. Bail with a sponge and a hat: twice as long with a boat full of nine-degree water. " + text
	_show(UIKit.card(l.get("title", ""), text, App.sources_line(l.get("sourceIds", [])), actions, kicker))

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
	if Fog.blind(_fog) and d < Fog.HEARD_M:
		_fog_signal_t -= delta
		if _fog_signal_t <= 0.0:
			_fog_signal_t = Fog.SIGNAL_EVERY
			Sound.horn(d > Traffic.HORN_M)
			if not _traffic.warned:
				var where := Traffic.bearing_words(kayak.global_position, _traffic.global_position)
				note_label.text = ("A long blast in the fog, %s: a vessel under way. Stop and listen; keep to the edge of the lane." if controls.touch() else "A long blast in the fog, %s: a vessel under way, somewhere in the channel. Stop paddling and listen. Keep to the edge of the lane until it has passed.") % where
	else:
		_fog_signal_t = 0.0
	if d < Traffic.WARN_M and not _traffic.warned:
		_traffic.warned = true
		_show(UIKit.card("Ferry in the channel", _said("ferry") + "Hold your position and let it pass well ahead — it cannot stop or turn for you, and it is faster than it looks. When it has gone by, cross its wake at right angles, bow into the waves.", App.sources_line(["colregs", "wsf"]), [["Holding", _clear_card, true]], "Traffic"))
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
		note_label.text = _said("wake") + wake_line + (" You paddled on as it came: a ferry cannot stop for you, and the lane is its." if _ferry_moved else " You held and let it pass: that is the crossing rule.")

func _exit_tree() -> void:
	Sound.hush_water()  # the idle, the rain and the rip belong to the water; the next screen starts quiet
