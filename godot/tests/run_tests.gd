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
	print("tests: %d passed, %d failed" % [_n - _fails, _fails])
	quit(1 if _fails > 0 else 0)
