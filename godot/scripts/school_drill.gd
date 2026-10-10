class_name SchoolDrill
extends RefCounted
## How far along a Kayak School drill is, for the drills that are only the boat's own motion:
## strokes counted, an edge held, a bearing held, a slide sideways, a turn on an edge. The drills
## with water or a capsize in them (ferry, eddy line, rescue, brace) stay in the water scene. Pure,
## so the tests can paddle them.

const PURE := ["forward", "reverse", "edge", "compass", "draw", "sweep"]

## The drill's progress, 0 to 1 (more is done), from this frame's boat. Updates `s` as it goes.
## `heading` is in radians, `speed` m/s, `edge` and `steer` -1..1.
static func measure(id: String, s: Dictionary, delta: float, heading: float, speed: float, edge: float, steer: float, at: Vector3) -> float:
	match id:
		"forward":
			return s.count / 6.0
		"reverse":
			return s.count / 4.0
		"edge":
			s.t = s.t + delta if absf(edge) > 0.6 else maxf(0.0, s.t - delta * 2.0)
			return s.t / 3.0
		"compass":
			var off := absf(angle_difference(deg_to_rad(float(s.get("target", 0.0))), heading))
			var on_line := off < deg_to_rad(10.0) and speed > 0.4
			s.t = s.t + delta if on_line else maxf(0.0, s.t - delta * 0.5)
			return s.t / 12.0
		"draw":
			var slid := absf((at - (s.origin as Vector3)).dot(s.right))
			return slid / 2.0 if absf(angle_difference(float(s.h0), heading)) < deg_to_rad(15.0) else 0.0
		"sweep":
			var dh := angle_difference(s.prev, heading)
			s.prev = heading
			if absf(edge) > 0.4 or absf(steer) > 0.5:
				s.turned += absf(dh)
			return s.turned / PI
	return 0.0
