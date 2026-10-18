class_name DayRecord
extends RefCounted
## The day for the debrief: the launch and its verdict, the landing, the swims, and the wildlife
## given room or not. One entry per leg; paddling a day again replaces its entry. Read off the water
## scene at the landing; kept here so the scene keeps to the water.

static func keep(sea: Node) -> void:
	var respectful := 0
	var violations := 0
	for s in sea._sightings:
		if not s.seen or int(sea._species(s.conf.species).get("approachMetres", 0)) <= 0:
			continue
		if bool(s.get("close", false)):
			violations += 1
		else:
			respectful += 1
	var launch := Leg.launch_hour()
	var entry := {
		"leg": Leg.index(), "metres": Leg.length_m(sea._route), "launchHour": launch, "arrivedHour": sea._hour,
		"verdict": str(Tides.judge(sea._day, launch, Leg.hours_at_touring_pace(sea._route), str(sea._route.get("favours", "flood"))).verdict),
		"swims": sea._swims_today, "rolls": sea._rolls_today, "rescuesGiven": sea._partner.rescues_given if sea._partner else 0, "reachS": sea._partner.reach_s if sea._partner else -1.0, "waits": sea._waits_today, "blows": sea._blows.x, "pushes": sea._blows.y, "slackWaited": sea._cross.slack == 2, "respectful": respectful, "violations": violations,
		"ferryHeld": sea._ferry_verdicts.count("held"), "ferryCrossed": sea._ferry_verdicts.count("crossed"),
		"streamS": sea._cross.stream_s, "onLineS": sea._cross.on_line_s, "maxKn": snappedf(sea._cross.max_kn, 0.1), "maxAt": sea._cross.max_at, "eddy": sea._cross.eddy_said, "linesEdged": sea._cross.lines_edged, "rafts": sea._partner.rafts if sea._partner else 0, "missing": Array(sea._pack.get("missing", [])).size(), "linesTripped": sea._cross.lines_tripped,
		"fog": sea._fogged, "fogInHour": sea._fog_in_hour, "fogOffM": sea._fog_off_m, "dark": sea._dark, "thirsty": sea._thirsty, "rain": sea._rained, "rainRafted": sea._rain_rafted, "light": sea._light_call, "logStruck": sea._log.struck if sea._log else 0, "netSnagged": sea._net.snagged if sea._net else -1,
		"notes": sea._notes.duplicate(), "noteAt": sea._note_at.duplicate(),
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
