class_name SchoolTour
extends RefCounted
## Kayak School's walk around the boat, the body and the paddle, as data: one stop per part in the
## content, each with where the camera looks and from how far, then the drills. Pure, so the tests
## can walk it; the scene passes in what reads the autoloads (`sources`) and the figure (`anchor`).

## The tour's stops, in order. `anchor` finds a body or paddle point on the figure by id;
## `sources` turns a part's `sourceIds` into its source line.
static func build(content: Dictionary, anchor: Callable, sources: Callable) -> Array:
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
	var tour: Array = []
	tour.append({ "kind": "intro", "kicker": "Kayak School", "title": "Know your boat, your body, your paddle", "text": "Before the crossing, a quiet beach and the boat you will paddle all game. Tap Next to walk around it.", "source": "", "anchor": Vector3(0, 0.2, 0), "dist": 7.0, "az": 0.7, "el": 0.45 })
	for p in content.get("kayakParts", []):
		var v: Array = views.get(p.id, [3.0, 0.8, 0.4])
		tour.append({ "kind": "boat", "kicker": "The boat", "title": p.name, "text": p.text, "source": sources.call(p.sourceIds), "anchor": anchors.get(p.id, Vector3.ZERO), "dist": v[0], "az": v[1], "el": v[2] })
	var body_views := { "feet": [2.2, 0.9, 0.5], "knees": [2.0, 1.0, 0.55], "hips": [2.2, 1.3, 0.35], "back": [2.2, 2.6, 0.4], "head": [1.8, 0.8, 0.3] }
	for b in content.get("bodyPoints", []):
		var v: Array = body_views.get(b.id, [2.2, 1.0, 0.4])
		tour.append({ "kind": "body", "kicker": "The body", "title": b.name, "text": b.text, "source": sources.call(b.sourceIds), "anchor": anchor.call(b.id), "dist": v[0], "az": v[1], "el": v[2] })
	var paddle_views := { "blade": [1.6, 1.4, 0.5], "loom": [1.6, 0.2, 0.7], "shoulder": [1.4, 1.6, 0.6], "tip": [1.4, 1.7, 0.4], "box": [2.0, 0.1, 0.5] }
	for pp in content.get("paddleParts", []):
		var v: Array = paddle_views.get(pp.id, [1.6, 1.0, 0.5])
		tour.append({ "kind": "paddle", "kicker": "The paddle", "title": pp.name, "text": pp.text, "source": sources.call(pp.sourceIds), "anchor": anchor.call(pp.id), "dist": v[0], "az": v[1], "el": v[2] })
	tour.append({ "kind": "drills", "kicker": "Calm water", "title": "Now paddle it", "text": "Ten short drills: forward and reverse strokes, edging, the sweep turn, the low brace, a compass bearing, a ferry angle, an eddy line on an edge, the draw, and the rescue. Everything later builds on these.", "source": "", "anchor": Vector3(0, 0.3, 0), "dist": 6.0, "az": 0.2, "el": 0.5 })
	return tour
