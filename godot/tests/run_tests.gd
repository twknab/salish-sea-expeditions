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
	# Packing: heavy water in the bow end makes the boat bow-heavy; essentials are tracked; the
	# suggested layout is near level with nothing left behind.
	var gear: Array = [
		{ "id": "water", "name": "Water", "massKg": 8.0, "essential": true, "bulky": false, "enables": ["hydration"] },
		{ "id": "tent", "name": "Tent", "massKg": 2.2, "essential": false, "bulky": true, "enables": ["shelter"] },
		{ "id": "pump", "name": "Pump", "massKg": 0.6, "essential": true, "deck": true, "bulky": false, "enables": ["pumpOut"] },
		{ "id": "food", "name": "Food", "massKg": 3.5, "essential": true, "bulky": false, "enables": ["dinner"] },
	]
	var bow := Packing.assess(Packing.lopsided(gear, "bowEnd"), gear)
	check(bow.pitch > 0.9 and bow.missing.is_empty() and bow.ends > 0.99, "everything in the bow end is bow heavy and ends loaded")
	check(Packing.handling_penalty(bow) > 0.9, "a bow-end boat handles badly")
	var one := Packing.place(Packing.empty(), "pump", "deck")
	var a1 := Packing.assess(one, gear)
	check(a1.missing == ["water", "food"] and a1.enables.has("pumpOut"), "essentials still on the beach are named, packed gear enables")
	check(Packing.zone_of(Packing.place(one, "pump", ""), "pump") == "", "an item can be taken back out")
	var ideal := Packing.assess(Packing.suggested(gear), gear)
	check(ideal.missing.is_empty() and absf(ideal.pitch) < 0.3 and ideal.enables.has("pumpOut"), "the suggested layout is near level with nothing left, pitch %f" % ideal.pitch)
	check(Packing.zone_of(Packing.suggested(gear), "pump") == "deck", "deck gear rides on deck")
	check(Packing.trim_words(bow).begins_with("bow heavy") and Packing.trim_words(ideal) == "level", "trim in words")
	check(Packing.assess(Packing.empty(), gear).pitch == 0.0, "an empty boat is level")
	# Assembly: the Phaser rules; a rushed jack costs the whole boat, a hold has a right length.
	var asm_steps: Array = [{ "id": "unroll", "gesture": "swipeOut" }, { "id": "jackSides", "gesture": "hold" }, { "id": "jackKeel", "gesture": "hold" }, { "id": "check", "gesture": "tapRhythm" }]
	check(absf(Assembly.quality({ "unroll": 1.0, "jackSides": 1.0, "jackKeel": 1.0, "check": 1.0 }, asm_steps) - 1.0) < 1e-6, "a clean assembly is 1")
	check(absf(Assembly.quality({}, asm_steps) - 0.4) < 1e-6, "steps never done count as 0.4")
	var rushed := Assembly.quality({ "unroll": 1.0, "jackSides": 0.25, "jackKeel": 0.25, "check": 1.0 }, asm_steps)
	check(rushed < 0.5 and rushed >= 0.3, "rushed jacks cost most of the boat, got %f" % rushed)
	check(Assembly.hold_quality(Assembly.NEEDED_HOLD) == 1.0 and Assembly.hold_quality(0.0) == 0.0 and Assembly.hold_quality(Assembly.NEEDED_HOLD * 2.0) == 0.0, "a hold is right at its length and wrong either side")
	check(Assembly.is_hold(asm_steps[1]) and not Assembly.is_hold(asm_steps[0]), "the jacks are holds")
	# Windage: a southerly blows north, a westerly east; the bow comes up into a beam wind, more when stern heavy.
	check(Windage.blows_to(180.0).distance_to(Vector3(0, 0, -1)) < 1e-6 and Windage.blows_to(270.0).distance_to(Vector3(1, 0, 0)) < 1e-6, "the wind blows where it blows")
	check(absf(Windage.vector(10.0, 0.0).length() - 5.144) < 1e-3, "ten knots is five metres a second")
	check(Windage.weathercock(1.0, 1.2) > 0.0 and Windage.weathercock(-1.0, 1.2) < 0.0 and Windage.weathercock(1.0, 0.0) == 0.0, "the bow turns into the wind, only with way on")
	check(Windage.weathercock(1.0, 1.2, -0.5) > Windage.weathercock(1.0, 1.2, 0.0), "a stern-heavy boat weathercocks more")
	# Fog: a leg's morning holds it until `until`, burns it off over `burn`; a leg without it is clear.
	var foggy := {"fog": {"until": 7.5, "burn": 1.0}}
	check(Fog.amount(foggy, 6.0) == 1.0 and Fog.amount(foggy, 7.5) == 1.0, "fog holds until the hour it says")
	check(absf(Fog.amount(foggy, 8.0) - 0.5) < 1e-6 and Fog.amount(foggy, 8.5) == 0.0 and Fog.amount(foggy, 12.0) == 0.0, "and burns off over the hour after")
	check(Fog.amount({}, 6.0) == 0.0 and Fog.plan_line({}, 6.0) == "", "a leg without fog is clear")
	check(Fog.blind(1.0) and not Fog.blind(0.2) and Fog.visibility_m(1.0) < 300.0 and Fog.visibility_m(0.0) > 10000.0, "in fog the chart has no fix and the view is short")
	check(Fog.density(1.0, 0.00022) > Fog.density(0.5, 0.00022) and Fog.density(0.0, 0.00022) == 0.00022, "the haze thickens with the fog and clears to the day's")
	check(Fog.plan_line(foggy, 6.0).begins_with("Fog at launch") and Fog.plan_line(foggy, 9.0) == "", "the float plan says so at a launch in fog")
	# Where the boat sleeps: the authored day's night high is 2.5 m at 23:50, above a 17:30 landing's water.
	var tide_day := {"tides": [{"t": -40, "h": 1.3}, {"t": 50, "h": 2.4}, {"t": 430, "h": -0.2}, {"t": 820, "h": 1.9}, {"t": 1110, "h": 1.2}, {"t": 1430, "h": 2.5}, {"t": 1850, "h": 0.1}]}
	# The shore walk's tide: the next low from an hour, within the half day.
	var low := Tides.next_low(tide_day, 17.5)
	check(float(low.hour) > 28.0 and float(low.h) < 0.5 and float(low.h) < Tides.height_m(tide_day, 17.5) - 1.0, "from the evening the next low is in the small hours, a metre and more below")
	check(absf(float(Tides.next_low(tide_day, 5.0).hour) - 7.17) < 0.2, "from first light it is the morning's")
	check(absf(HaulOut.night_high_m(tide_day, 17.5) - 2.5) < 0.02 and absf(HaulOut.night_high_hour(tide_day, 17.5) - 23.83) < 0.2, "the night's high water is read off the table")
	var rise := HaulOut.rise_m(tide_day, 17.5)
	check(rise > 1.0 and rise < 1.4, "it rises more than a metre on the afternoon's water")
	check(HaulOut.verdict("edge", rise) == "floated" and HaulOut.verdict("wrack", rise) == "close" and HaulOut.verdict("grass", rise) == "dry", "the edge floats, the wrack line is a near thing, the grass is dry")
	check(HaulOut.verdict("grass", 0.0) == "dry" and HaulOut.record_words("grass", rise) == "" and HaulOut.record_words("edge", rise) != "", "only trouble is written down")
	check(HaulOut.forecast_line(tide_day, 17.5).begins_with("Tonight’s high water is 2.5 m at 23:"), "the first card reads the table aloud")
	check(FoodStore.verdict("tent") == "taken" and FoodStore.verdict("hatch") == "worked" and FoodStore.verdict("hung") == "safe" and FoodStore.verdict("") == "safe", "the raccoons get the tent, work the hatch, and leave the hung box")
	check(FoodStore.leaves_clean("hung") and FoodStore.leaves_clean("hatch") and not FoodStore.leaves_clean("tent"), "a camp the raccoons scattered is not a clean camp")
	check(FoodStore.record_words("hung") == "" and FoodStore.record_words("tent") != "" and FoodStore.night_line("hatch").contains("claw"), "only trouble with the food is written down")
	# The day's own light: a July night falls after nine, a September one before.
	check(Daylight.night_at(13.0, 5.5, 21.17) == 0.0 and Daylight.night_at(20.0, 5.5, 21.17) == 0.0 and Daylight.night_at(23.0, 5.5, 21.17) == 1.0, "a July evening is light until nine")
	check(Daylight.night_at(20.0, 6.83, 19.0) > 0.5 and Daylight.night_at(21.0, 6.83, 19.0) == 1.0 and Daylight.night_at(18.0, 6.83, 19.0) == 0.0, "a September one is dark by half past eight")
	check(Daylight.dusk_at(13.0, 5.5, 21.17) < 0.05 and Daylight.dusk_at(21.0, 5.5, 21.17) > 0.95 and Daylight.sun_elevation(13.3, 5.5, 21.17) < Daylight.sun_elevation(8.0, 5.5, 21.17), "the sun is highest at the day's noon")
	var short_day := {"sunset": 1140, "tides": [], "current": [], "wind": []}
	var wet_day := {"rain": [{"t": 780, "r": 0.0}, {"t": 840, "r": 0.9}, {"t": 1080, "r": 0.0}]}
	check(Tides.rain(short_day, 14.0) == 0.0 and Tides.rain(wet_day, 12.0) == 0.0 and Tides.rain(wet_day, 14.0) > 0.8 and Tides.rain(wet_day, 19.0) == 0.0, "the squall comes through with the afternoon and goes")
	var wet_calm := {"rain": wet_day.rain, "tides": [], "current": [], "wind": [], "sunset": 1270}
	check(Tides.verdict_line(wet_calm, 12.0, 3.0).contains("squall comes through at 14:00") and not Tides.verdict_line(wet_calm, 6.0, 3.0).contains("squall"), "the float plan names the squall when the leg runs into it")
	check(Tides.lands_in_the_dark(short_day, 16.0, 3.0) and not Tides.lands_in_the_dark(short_day, 12.0, 3.0), "a late launch on a short day lands in the dark")
	check(String(Tides.judge(short_day, 16.0, 3.0).verdict) == "poor" and Tides.verdict_line(short_day, 16.0, 3.0).contains("in the dark"), "and the float plan says so")
	# The whale-watch boat holds off the pod abeam at four hundred yards, whichever way the pod goes.
	var ww := WhaleWatch.station_for(Vector3(100, 0, 200), Vector3(1, 0, 0))
	check(absf(ww.x - 100.0) < 1e-3 and absf(ww.z - 200.0 - WhaleWatch.STANDOFF) < 1e-3 and ww.y == 0.0, "abeam of an eastbound pod is south of it")
	check(absf(WhaleWatch.station_for(Vector3.ZERO, Vector3(1, 0, 0), 1.0, 914.0).z - 914.0) < 1e-3, "at the field guide's distance when it names one")
	check(WhaleWatch.station_for(Vector3.ZERO, Vector3(0, 0, -1)).x > 0.0 and absf(WhaleWatch.station_for(Vector3.ZERO, Vector3(0, 0.5, -1), -1.0).x + WhaleWatch.STANDOFF) < 1e-3, "and east of a northbound one, or west on the other side")
	# The ferry glide: bow north at 1.5 m/s, a 0.5 m/s stream setting east makes good about 018°.
	var cmg := FerryGlide.course_made_good(Vector3(0, 0, -1.5), Vector3(0.5, 0, 0))
	check(absf(cmg - 18.43) < 0.1 and absf(FerryGlide.set_off(0.0, cmg) - 18.43) < 0.1, "a beam stream sets the boat off its heading")
	check(is_nan(FerryGlide.course_made_good(Vector3.ZERO, Vector3.ZERO)) and FerryGlide.set_off(0.0, NAN) == 0.0, "no way on, no course made good")
	var hdg := FerryGlide.heading_for(0.0, 1.5, Vector3(0.5, 0, 0))
	check(absf(hdg - (360.0 - 19.47)) < 0.1, "to hold north against an easterly set, point up into it by asin(0.5/1.5)")
	check(absf(FerryGlide.course_made_good(-Vector3(sin(deg_to_rad(hdg)), 0, -cos(deg_to_rad(hdg))) * -1.5, Vector3(0.5, 0, 0))) < 0.1 or absf(FerryGlide.course_made_good(Vector3(sin(deg_to_rad(hdg)), 0, -cos(deg_to_rad(hdg))) * 1.5, Vector3(0.5, 0, 0))) < 0.1, "and the boat then makes good the line")
	check(is_nan(FerryGlide.heading_for(0.0, 0.4, Vector3(0.5, 0, 0))), "a stream faster across the line than the boat cannot be ferried")
	check(FerryGlide.note(-18.0, 72.0, "Posey Island").contains("18° left") and FerryGlide.note(-18.0, 72.0, "Posey Island").contains("steer about 072°") and FerryGlide.note(30.0, NAN, "Posey Island").contains("wait for slack"), "the ferry note names the set, the side and the heading, or says no angle holds it")
	check(FerryGlide.note(-18.0, 72.0, "Posey Island", true) == "Set 18° left: steer about 072° to hold the line.", "and on a phone in two short lines")
	check(absf(FerryGlide.headway(0.0, 1.5, Vector3.ZERO) - 1.5) < 0.01 and FerryGlide.headway(0.0, 1.5, Vector3(0, 0, 2.0)) < 0.0, "a head stream faster than the boat takes away all its headway")
	check(FerryGlide.headway(0.0, 1.5, Vector3(0.5, 0, 0)) > 1.3 and FerryGlide.headway(0.0, 1.5, Vector3(2.0, 0, 0)) < 0.0, "a ferry angle costs a little headway, and a stream across faster than the boat all of it")
	check(Leg.clock(7.0 + 50.0 / 60.0) == "07:50" and Leg.clock(9.5) == "09:30" and Leg.clock(23.999) == "00:00" and Leg.clock(25.25) == "01:15", "the clock reads to the nearest minute, past midnight too")
	var turns := Tides.slacks({ "current": [{ "t": 0, "kn": 2.0 }, { "t": 120, "kn": -2.0 }, { "t": 240, "kn": 2.0 }] }, 0.0, 4.0)
	check(turns.size() == 2 and absf(float(turns[0]) - 1.0) < 0.05 and absf(float(turns[1]) - 3.0) < 0.05, "the graph's slack marks sit where the stream crosses zero")
	var turns_day := { "current": [{ "t": 0, "kn": 2.0 }, { "t": 120, "kn": -2.0 }, { "t": 240, "kn": 2.0 }] }
	check(Tides.turn_line(turns_day, 0.5, 1.0).contains("turns at 01:00") and Tides.turn_line(turns_day, 0.5, 1.0).contains("runs against you") and Tides.turn_line(turns_day, 0.5, 1.0, "ebb").contains("carries you"), "a turn inside the leg is named, with the way the water runs after it")
	check(Tides.turn_line(turns_day, 1.5, 1.0) == "" and Tides.turn_line(turns_day, 0.9, 1.0) == "", "no turn inside the leg, or one at the launch itself, goes unsaid")
	var rough := { "current": [{ "t": 0, "kn": 0.1 }, { "t": 600, "kn": 0.1 }], "wind": [{ "t": 0, "kn": 25, "fromDeg": 180 }, { "t": 600, "kn": 25, "fromDeg": 180 }] }
	check(Tides.verdict_line(rough, 2.0, 1.0).begins_with("Poor") and Tides.verdict_line(rough, 2.0, 1.0).contains("rough sea") and not Tides.verdict_line(rough, 2.0, 1.0).contains("whole leg"), "a poor day for its chop blames the wind, not the stream for the whole leg")
	var turning := { "current": [{ "t": 0, "kn": 3.0 }, { "t": 120, "kn": 1.0 }, { "t": 180, "kn": -1.0 }] }
	var slack_h := Tides.next_slack(turning, 0.0)
	check(slack_h > 2.3 and slack_h < 2.9 and is_nan(Tides.next_slack({ "current": [{ "t": 0, "kn": 3.0 }, { "t": 900, "kn": 3.0 }] }, 0.0)), "slack is when the stream eases or turns, and a stream that runs on has none")
	check(FerryGlide.slack_body(4.2, "Posey Island", 14.5, "14:30").contains("slack at 14:30") and FerryGlide.slack_body(4.2, "Posey Island", NAN, "").contains("bail-out") and FerryGlide.slack_body(4.2, "Posey Island", 20.0, "20:00", true).contains("in the dark"), "the slack card names the hour, the dark if it comes after sunset, or the bail-out when there is none")
	var sch := FerryGlide.across(90.0, 1.0)
	check(absf(sch.length() - FerryGlide.KN) < 0.001 and sch.z > 0.5 * FerryGlide.KN, "the school's stream runs across the line, to starboard of a boat pointing down it")
	check(fposmod(90.0 - FerryGlide.heading_for(90.0, 1.5, sch), 360.0) < 30.0 and fposmod(90.0 - FerryGlide.heading_for(90.0, 1.5, sch), 360.0) > 15.0, "and holding the line means pointing up into it, to port, by about twenty degrees")
	check(absf(FerryGlide.off_line(355.0, 5.0) - 10.0) < 0.01 and FerryGlide.off_line(NAN, 90.0) == 0.0, "off the line is measured the short way round")
	check(FerryGlide.held(30.0, 0.0) == "" and FerryGlide.held(300.0, 200.0) == "held" and FerryGlide.held(300.0, 100.0) == "set", "a crossing is held on the line three-fifths of the way, and a brush with a stream is not judged")
	check(Seamanship.calls([{"verdict": "good", "streamS": 300.0, "onLineS": 100.0}]).size() == 4 and Seamanship.kept(Seamanship.calls([{"verdict": "good", "streamS": 300.0, "onLineS": 100.0}])) == 3, "a stream crossing is a call when one came up")
	# The partner speaks at the moments that matter, in a few words, and not when there is nothing to say.
	check(PartnerVoice.line("ferry") != "" and PartnerVoice.line("nothing") == "" and PartnerVoice.said("Mina", "nothing") == "", "silent when there is nothing to say")
	check(PartnerVoice.said("Mina", "ferry").begins_with("Mina: “") and PartnerVoice.said("Mina", "ferry").ends_with("”  "), "a line is the name and the words, then room for the note")
	for ev in PartnerVoice.LINES.keys():
		check(PartnerVoice.line(ev).length() < 70, "%s: a few words, not a lecture" % ev)
	# The call ashore: closed from the float, late, or never — and the record only remembers trouble.
	check(FloatPlanClose.verdict("now") == "closed" and FloatPlanClose.verdict("later") == "late" and FloatPlanClose.verdict("forgot") == "forgot" and FloatPlanClose.verdict("") == "closed", "the float plan is closed, late or forgotten")
	check(FloatPlanClose.record_words("now") == "" and FloatPlanClose.closing_line("forgot").contains("Coast Guard"), "forgetting it brings the Coast Guard")
	check(Seamanship.calls([{"verdict": "good", "floatPlan": "forgot"}]).size() == 4 and Seamanship.kept(Seamanship.calls([{"verdict": "good", "floatPlan": "now"}])) == 4, "closing the plan is a call when it came up")
	# The water on Posey: drink it and tomorrow is thirsty; the tap costs an hour; rationed is fine.
	check(WaterPlan.verdict("fill") == "thirsty" and WaterPlan.verdict("ration") == "fine" and WaterPlan.verdict("roche") == "late" and WaterPlan.verdict("") == "fine", "the water has three ends")
	check(WaterPlan.effort("fill") < 0.9 and WaterPlan.effort("ration") == 1.0 and WaterPlan.late_hours("roche") == 1.0 and WaterPlan.late_hours("fill") == 0.0, "thirst shortens the stroke, the tap delays the launch")
	check(WaterPlan.record_words("ration") == "" and WaterPlan.night_line("roche").contains("Roche Harbor"), "only trouble with the water is written down")
	check(Seamanship.calls([{"verdict": "good", "waterVerdict": "thirsty"}]).size() == 4 and Seamanship.kept(Seamanship.calls([{"verdict": "good", "waterVerdict": "thirsty"}])) == 3, "the water is a call when it came up")
	# Seamanship: the calls are read back from the days, and only the ones that came up.
	check(Seamanship.calls([]).is_empty(), "no days, no calls")
	var quiet := Seamanship.calls([{"verdict": "good"}])
	check(quiet.size() == 3 and Seamanship.kept(quiet) == 3, "a clean day with nothing met keeps the launch, the daylight and the boat")
	var busy := Seamanship.calls([{"verdict": "good", "boatVerdict": "floated", "foodVerdict": "hung", "ferryHeld": 1, "fog": true, "fogOffM": 60.0, "respectful": 2, "violations": 1, "swims": 1, "dark": true}])
	check(busy.size() == 8 and Seamanship.kept(busy) == 4, "every call that came up is listed, kept or not")
	check(Seamanship.lines(busy)[1].begins_with("○  Carried the boat") and Seamanship.lines(busy)[4].begins_with("●  Held for the ferry"), "a kept call is a filled mark")
	var line_leg := {"waypoints": [[0, 0], [1000, 0], [1000, 1000]]}
	check(absf(Leg.off_track_m(line_leg, Vector3(500, 0, 300)) - 300.0) < 1e-3 and absf(Leg.off_track_m(line_leg, Vector3(1200, 0, 500)) - 200.0) < 1e-3 and Leg.off_track_m(line_leg, Vector3(1000, 0, 1000)) == 0.0, "the distance off the line is to its nearest leg")
	check(Traffic.bearing_words(Vector3.ZERO, Vector3(0, 0, -100)) == "to the north" and Traffic.bearing_words(Vector3.ZERO, Vector3(100, 0, 0)) == "to the east", "a blast is heard from a direction")
	check(Windage.drift_force(Vector3(5.0, 0, 0), 100.0, 2.2).x > 0.0, "the drift force is downwind")
	# The ferry's wake: on the beam when the boat runs parallel to the ferry, bow-on when across it.
	check(absf(Traffic.wake_beam(Vector3(0, 0, -1), Vector3(0, 0, 1)) - 1.0) < 1e-6 and Traffic.wake_beam(Vector3(1, 0, 0), Vector3(0, 0, 1)) < 1e-6, "the wake is on the beam of a parallel boat and bow-on across the track")
	check(Traffic.wake_kick(1.0) > Traffic.wake_kick(0.0) and Traffic.wake_kick(0.0) > 0.3, "the beam takes the roll, the bow a few pitches")
	# Score: the Phaser rules; going in costs nothing, too close to wildlife does.
	var legs_stub: Array = [{}, {}, {}]
	var rec := Score.record({ "days": [{ "leg": 0, "metres": 11200.0, "verdict": "good", "swims": 1, "respectful": 2 }, { "leg": 1, "metres": 9600.0, "verdict": "fair", "violations": 1 }], "nights": 2, "cleanCamps": 2, "seen": ["seal", "eagle"], "drills": ["forward", "brace"] }, legs_stub)
	check(absf(rec.nm - 20800.0 / 1852.0) < 1e-6 and rec.rescues == 1 and rec.goodWindows == 1 and rec.respectful == 2 and rec.violations == 1, "the record sums the days")
	var parts := Score.parts(rec)
	check(parts.size() == 9 and Score.total(rec) == 1123 + 600 + 100 + 300 - 200 + 500 + 80 + 100 + 200, "the parts and the total follow the rules, got %d" % Score.total(rec))
	check(Score.parts({}).is_empty() and Score.total({ "violations": 5 }) == 0, "zero rows are left out and the total never goes below nought")
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
		check(c.drills.size() == 8 and c.drills[0].id == "forward" and c.drills[5].id == "compass" and c.drills[6].id == "ferry" and c.drills[7].id == "rescue", "eight drills, forward first, the compass then the ferry angle before the rescue, the rescue last")
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
