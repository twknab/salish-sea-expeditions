## Headless unit tests for the pure parts: run with
##   godot --headless --path godot -s res://tests/run_tests.gd
extends SceneTree

var _fails := 0
var _n := 0

func check(cond: bool, what: String) -> void:
	_n += 1
	if not cond:
		_fails += 1
		printerr("FAIL: " + what)

func _init() -> void:
	# Waves: finite, periodic in time at the deep-water phase speed, flat at sea state 0 only in amplitude.
	var h0 := Waves.height(3.0, -2.0, 1.0, 0.3)
	check(is_finite(h0), "wave height is finite")
	check(absf(Waves.height(0.0, 0.0, 0.0, 0.3)) < 1.0, "wave height at origin is sane")
	var big := 0.0
	for i in range(200):
		big = maxf(big, absf(Waves.height(i * 0.37, i * 0.11, i * 0.05, 1.0)))
	check(big > 0.15 and big < 1.2, "sea state 1 amplitude in a kayaker's range, got %f" % big)
	var small := 0.0
	for i in range(200):
		small = maxf(small, absf(Waves.height(i * 0.37, i * 0.11, i * 0.05, 0.0)))
	check(small < big, "calmer sea state is lower")
	var nrm := Waves.normal(1.0, 1.0, 0.5, 0.5)
	check(nrm.y > 0.6, "normal points mostly up")
	# Hull: stems close, fullest near midships, keel below the sheer, stems meet the sheer.
	check(Hull.half_beam(0.0) < 1e-6 and Hull.half_beam(1.0) < 1e-6, "stems close")
	check(Hull.half_beam(0.5) > 0.25, "beam near midships")
	check(absf(Hull.x_at(0.0) - Hull.COCKPIT_S * Hull.L) < 1e-6, "bow x from cockpit")
	for s in [0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]:
		var h := Hull.heights(s)
		check(h.keel <= h.sheer, "keel under sheer at s=%f" % s)
		check(h.ridge >= h.sheer - 1e-6, "ridge over sheer at s=%f" % s)
	check(Hull.heights(0.5).keel < -0.1, "draft midships")
	var mesh := Hull.build_mesh(Color.BLACK, Color.WHITE, Color.BLUE)
	check(mesh.get_surface_count() == 1 and mesh.get_aabb().size.x > 4.5, "hull mesh spans the boat's length")
	# Stroke grading mirrors the Phaser rules.
	check(absf(StrokeMath.rotation_quality(1.0, 1.0, true) - 1.0) < 1e-6, "perfect stroke is 1")
	check(StrokeMath.rotation_quality(0.2, 0.5, false) < StrokeMath.GOOD_STROKE, "an arm stroke fails the bar")
	check(StrokeMath.rotation_quality(0.9, 0.9, true) >= StrokeMath.GOOD_STROKE, "a rotation stroke passes")
	check(StrokeMath.stroke_yaw(0.2, 0.4) > StrokeMath.stroke_yaw(0.9, 0.4), "arm strokes yaw more")
	check(StrokeMath.stroke_yaw(0.8, 0.8) > StrokeMath.stroke_yaw(0.8, 0.1), "rocker turns quicker")
	# Buoyancy: nothing above the water, weight share at the settle depth, capped.
	check(StrokeMath.buoyancy(-0.1, 100.0, 0.1) == 0.0, "no lift above water")
	check(absf(StrokeMath.buoyancy(0.1, 100.0, 0.1) - 100.0) < 1e-6, "weight share at settle depth")
	check(StrokeMath.buoyancy(5.0, 100.0, 0.1) <= 400.0 + 1e-6, "lift is capped")
	# Content: every source id a card cites resolves to a credit, and the opening is in order.
	var f := FileAccess.open("res://content/content.json", FileAccess.READ)
	check(f != null, "content.json present")
	if f:
		var c = JSON.parse_string(f.get_as_text())
		check(c is Dictionary and c.has("kayakParts") and c.has("layers") and c.has("places"), "content has the opening's data")
		var ids := {}
		for cr in c.credits:
			ids[cr.id] = true
		var missing := 0
		for key in ["kayakParts", "bodyPoints", "paddleParts", "layers", "kit", "places", "lessons", "legal"]:
			for item in c[key]:
				for sid in item.get("sourceIds", []):
					if not ids.has(sid):
						missing += 1
						printerr("unknown source ", sid, " in ", key)
		check(missing == 0, "all sourceIds resolve")
		check(c.drills.size() == 5 and c.drills[0].id == "forward", "five drills, forward first")
	# IK: the elbow keeps both bone lengths and bends toward the pole.
	var sh := Vector3(0.2, 1.4, 0)
	var hand := Vector3(0.45, 1.1, 0.3)
	var el := IK.two_bone(sh, hand, 0.3, 0.27, Vector3(1, -1, 0))
	check(absf(el.distance_to(sh) - 0.3) < 1e-4, "upper arm length kept")
	check(absf(el.distance_to(hand) - 0.27) < 1e-4, "forearm length kept")
	check(el.y < (sh.y + hand.y) / 2.0, "elbow bends downward toward the pole")
	var far := IK.two_bone(sh, sh + Vector3(2, 0, 0), 0.3, 0.27, Vector3.DOWN)
	check(absf(far.distance_to(sh) - 0.3) < 1e-4, "out of reach straightens, upper length kept")
	# Sounds exist for every call the game makes.
	for n in ["water_loop", "wind_loop", "splash_1", "splash_2", "splash_3", "drip_1", "drip_2", "hull_slap", "ferry_horn", "gull"]:
		check(FileAccess.file_exists("res://audio/%s.wav" % n), "audio %s present" % n)
	# The skinned body: one mesh, a bone per BONES row, head above feet, and a pose that moves a hand.
	var holder := Node3D.new()
	root.add_child(holder)
	var body := BodyMesh.new()
	body.build(holder, { "skin": Color.WHITE, "suit": Color.BLUE, "pfd": Color.YELLOW, "gasket": Color.BLACK, "glove": Color.BLACK, "boot": Color.BLACK, "cap": Color.BLACK, "hair": Color.BLACK }, 4, true)
	check(body.skeleton.get_bone_count() == BodyMesh.BONES.size(), "a bone per row")
	var aabb := body.mesh_instance.mesh.get_aabb()
	check(aabb.size.y > 1.6 and aabb.size.y < 2.0, "figure about 1.7 m tall, got %f" % aabb.size.y)
	check(body.mesh_instance.mesh.get_surface_count() == 1, "one surface")
	var before := body.skeleton.get_bone_pose(body.bone("forearm_r"))
	body.pose({ "shoulder_r": BodyMesh.JOINTS.shoulder_r, "elbow_r": Vector3(0.4, 0.5, 0.2), "wrist_r": Vector3(0.5, 0.7, 0.3), "hand_r": Vector3(0.55, 0.78, 0.33) })
	var after := body.skeleton.get_bone_pose(body.bone("forearm_r"))
	check(not before.is_equal_approx(after), "posing changes the forearm's local pose")
	var g := body.skeleton.get_bone_global_pose(body.bone("hand_r")).origin
	check(g.distance_to(Vector3(0.5, 0.7, 0.3)) < 0.05, "hand bone sits at the wrist it was given, got %s" % g)
	# Tides: the authored day's table reads back, interpolates, and the current points along the set.
	var day := { "tides": [{ "t": 0, "h": 1.0 }, { "t": 60, "h": 3.0 }], "current": [{ "t": 0, "kn": 0.0 }, { "t": 120, "kn": 2.0 }, { "t": 240, "kn": 0.0 }, { "t": 360, "kn": -1.0 }], "floodSetDeg": 0, "wind": [{ "t": 0, "kn": 4, "fromDeg": 180 }] }
	check(absf(Tides.height_m(day, 0.5) - 2.0) < 1e-6, "tide height interpolates")
	check(absf(Tides.height_m(day, 5.0) - 3.0) < 1e-6, "tide height holds beyond the table")
	check(absf(Tides.current_kn(day, 1.0) - 1.0) < 1e-6, "current interpolates to the flood")
	var cv := Tides.current_vector(day, 2.0)
	check(cv.z < -0.9 and absf(cv.x) < 1e-6, "a flood setting 000° runs north (−z), got %s" % cv)
	check(Tides.describe(day, 2.0).begins_with("flood 2.0 kn"), "describe names the flood")
	check(Tides.describe(day, 6.0).begins_with("ebb 1.0 kn setting 180"), "describe turns the ebb round")
	check(Tides.describe(day, 4.0) == "slack water", "slack near zero")
	check(int(Tides.wind(day, 1.0).fromDeg) == 180, "wind reads back")
	# Judging a launch: a morning flood with light wind is good; wind against the ebb is poor.
	var july := { "tides": [{ "t": 430, "h": -0.2 }, { "t": 820, "h": 1.9 }], "current": [{ "t": 460, "kn": 0.0 }, { "t": 610, "kn": 1.4 }, { "t": 790, "kn": 0.0 }, { "t": 980, "kn": -2.0 }, { "t": 1170, "kn": 0.0 }], "floodSetDeg": 330, "wind": [{ "t": 600, "kn": 5, "fromDeg": 185 }, { "t": 900, "kn": 14, "fromDeg": 180 }, { "t": 1260, "kn": 5, "fromDeg": 200 }] }
	check(Tides.judge(july, 9.5, 2.0).verdict == "good", "a 09:30 launch on the flood is good, got %s" % Tides.judge(july, 9.5, 2.0))
	check(Tides.wind_against_tide(july, 16.0), "a southerly against the afternoon ebb is wind against tide")
	check(Tides.judge(july, 15.5, 2.0).verdict == "poor", "a 15:30 launch into wind against the ebb is poor, got %s" % Tides.judge(july, 15.5, 2.0))
	check(Tides.sea_state(july, 16.0) > Tides.sea_state(july, 9.5), "the chop is worse in the afternoon")
	check(Tides.verdict_line(july, 9.5, 2.0).begins_with("Good"), "the verdict reads as a sentence")
	check(Tides.judge(july, 9.5, 2.0, "ebb").cur < 0.0, "a leg that rides the ebb reads the morning flood as against it")
	check(Tides.judge(july, 13.0, 2.0, "ebb").cur > 0.0, "and the afternoon ebb as with it")
	if Leg.all().size() >= 3:
		var home: Dictionary = Leg.all()[2]
		var day3 := Tides.shifted({ "tides": [], "current": [{ "t": 90, "kn": 0.0 }, { "t": 270, "kn": -1.6 }, { "t": 460, "kn": 0.0 }, { "t": 610, "kn": 1.4 }, { "t": 790, "kn": 0.0 }], "floodSetDeg": 330, "wind": [{ "t": 360, "kn": 2, "fromDeg": 190 }] }, 100.0)
		check(Tides.judge(day3, float(home.suggestedLaunch), 3.0, "ebb").verdict == "good", "the suggested first-light launch home rides the night's ebb")
	check(absf(Leg.launch_hour() - Leg.LAUNCH_HOUR) < 1e-6, "with no App the launch is the default")
	# The legs: two days over the real water, chained, read without an App.
	var legs := Leg.all()
	check(legs.size() >= 3, "three legs load from content/legs.json, got %d" % legs.size())
	if legs.size() >= 2:
		check(Leg.start(legs[1]).distance_to(Leg.cove(legs[0])) < 1.0, "day two starts in the cove day one landed in")
		check(Leg.length_m(legs[0]) > 9000.0 and Leg.length_m(legs[1]) > 8000.0, "both legs are a day's paddle")
		check(Leg.waypoints(legs[1]).size() >= 6, "the second leg follows the channel, not a straight line")
	check(Leg.index() == 0 and Leg.current().get("id", "") == "leg1", "with no App the first leg is current")
	var later := Tides.shifted(day, 60.0)
	check(absf(Tides.height_m(later, 1.5) - Tides.height_m(day, 0.5)) < 1e-6, "a shifted day runs the same water later")
	check(absf(Tides.height_m(day, 0.5) - 2.0) < 1e-6, "shifting copies; the original is untouched")
	# The chart tile's window: the boat sits at the centre, north up, a kilometre is a fixed width.
	var tile := Vector2(168, 168)
	var view := ChartTile.view_for(Vector3(100.0, 0.0, -500.0), tile)
	check(ChartTile.to_tile(Vector3(100.0, 0.0, -500.0), view, tile).is_equal_approx(tile * 0.5), "the boat is at the centre of the chart")
	var north := ChartTile.to_tile(Vector3(100.0, 0.0, -1500.0), view, tile)
	check(north.y < tile.y * 0.5 and absf(north.x - tile.x * 0.5) < 1e-3, "north is up on the chart")
	check(absf(ChartTile.to_tile(Vector3(1100.0, 0.0, -500.0), view, tile).x - tile.x * 0.5 - 1000.0 / ChartTile.SPAN_M * tile.x) < 1e-3, "a kilometre east is a kilometre's width")
	# Rips: the stream runs harder inside an authored rip, falls off to the channel's figure at its edge.
	if legs.size() >= 2:
		var rip: Dictionary = legs[1].rips[0]
		var at := Vector3(float(rip.at[0]), 0.0, float(rip.at[1]))
		check(absf(float(Leg.flow_at(legs[1], at).factor) - float(rip.factor)) < 1e-6, "the rip's centre runs at its factor")
		check(absf(float(Leg.flow_at(legs[1], at + Vector3(float(rip.radius) + 1.0, 0.0, 0.0)).factor) - 1.0) < 1e-6, "outside the rip the stream is the channel's")
		check(String(Leg.flow_at(legs[1], at).name) != "", "a rip names where it is")
	check(Tides.sea_state(july, 16.0, 1.8) > Tides.sea_state(july, 16.0, 1.0), "a stronger stream against the wind stands the sea up more")
	# Secondary stability: righting grows, peaks, dies at the point of no return, and turns against the boat.
	check(StrokeMath.righting(0.3) > 0.0 and StrokeMath.righting(0.6) > StrokeMath.righting(0.3), "righting grows with the roll")
	check(absf(StrokeMath.righting(StrokeMath.NO_RETURN_ROLL)) < 1e-6, "no righting at the point of no return")
	check(StrokeMath.righting(2.0) < 0.0 and StrokeMath.righting(-2.0) > 0.0, "past it the boat goes over, either side")
	check(not StrokeMath.capsized(1.0) and StrokeMath.capsized(1.6), "capsized is past the point of no return by a margin")
	# The ferry's stretch: distances accumulate, the ends are the ends, and the nearest point is on the line.
	var tr := Traffic.stretch([[0, 0], [1000, 0], [1000, 1000]], 0)
	var cum := Traffic.cumulative(tr)
	check(absf(cum[2] - 2000.0) < 1e-3, "the stretch is two kilometres")
	check(Traffic.point_at(tr, cum, 0.0).is_equal_approx(Vector3.ZERO) and Traffic.point_at(tr, cum, 2000.0).is_equal_approx(Vector3(1000, 0, 1000)), "the ends are the ends")
	check(Traffic.point_at(tr, cum, 1500.0).is_equal_approx(Vector3(1000, 0, 500)), "halfway up the second leg")
	check(absf(Traffic.nearest_s(tr, cum, Vector3(500.0, 0.0, 300.0)) - 500.0) < 1e-3, "the nearest point on the track to a boat beside it")
	# The partner's station is off the starboard quarter however the player is pointed; the preset is never the player's.
	var st := Partner.station_for(Vector3.ZERO, Basis.IDENTITY)
	check(st.x > 0.0 and st.z < 0.0 and absf(st.y) < 1e-6, "station is starboard and a little ahead of a boat facing north")
	var turned := Partner.station_for(Vector3.ZERO, Basis(Vector3.UP, PI / 2.0))
	check(absf(turned.length() - st.length()) < 1e-3 and not turned.is_equal_approx(st), "the station turns with the boat")
	var presets := [{ "id": "a", "skin": "tan", "hair": "dark", "style": "short" }, { "id": "b", "skin": "deep", "hair": "black", "style": "crop" }]
	check(Partner.pick_preset(presets, { "skin": "tan", "hair": "dark", "style": "short" }).id == "b", "the partner is not dressed as the player")
	var paddle := Paddler.greenland_paddle()
	check(paddle.get_aabb().size.x > 2.1 and paddle.get_aabb().size.z < 0.1, "Greenland paddle is long and narrow")
	print("tests: %d passed, %d failed" % [_n - _fails, _fails])
	quit(1 if _fails > 0 else 0)
