## The ferry on the water. One island ferry shuttles the San Juan Channel stretch of the real ferry
## track (content/ferry_route.json, from Wasp Passage to the Friday Harbor landing) at a ferry's
## speed in real seconds, with a dwell at each end, so legs that run the channel meet it. The chart
## flyover drives the same model along the whole track; this is the boat you have to keep out of
## the way of. Pure track maths is static, for the tests.
class_name Traffic
extends Node3D

const SPEED := 8.2        # m/s, about sixteen knots
const DWELL := 60.0       # seconds alongside at each end
const WARN_M := 800.0     # the card: hold position, let it pass
const HORN_M := 450.0     # five short blasts are for danger; one long one is "I am coming"
const WAKE_M := 260.0     # the wake reaches the boat

var _track: PackedVector2Array
var _cum: PackedFloat32Array
var _length := 0.0
var _s := 0.0              # distance along the stretch; 0 is Wasp Passage, _length the landing
var _dir := 1.0            # +1 toward Friday Harbor, -1 away
var _dwell := 0.0
var _model: FerryModel
var warned := false
var honked := false
var waked := false

## The channel stretch of a track: from the point index `from` to the end.
## How much of the wake the boat takes on the beam: the wake runs out at right angles to the
## ferry's track, so a boat parallel to the ferry has it on the beam (1) and a boat turned across
## the track, bow into the waves, takes it bow-on (0).
static func wake_beam(kayak_fwd: Vector3, ferry_fwd: Vector3) -> float:
	var k := Vector2(kayak_fwd.x, kayak_fwd.z).normalized()
	var f := Vector2(ferry_fwd.x, ferry_fwd.z).normalized()
	return absf(k.dot(f))

## The roll the wake gives the boat: a few pitches bow-on, the full roll on the beam.
## Where a sound comes from, in the words a paddler would use: "to the north-east".
static func bearing_words(from: Vector3, to: Vector3) -> String:
	var names := ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"]
	var brg := Leg.bearing_deg(from, to)
	return "to the " + names[int(round(brg / 45.0)) % 8]

static func wake_kick(beam: float) -> float:
	return 0.35 + 0.95 * clampf(beam, 0.0, 1.0)

static func stretch(track: Array, from: int) -> PackedVector2Array:
	var out := PackedVector2Array()
	for i in range(from, track.size()):
		out.append(Vector2(float(track[i][0]), float(track[i][1])))
	return out

static func cumulative(track: PackedVector2Array) -> PackedFloat32Array:
	var cum := PackedFloat32Array()
	cum.append(0.0)
	for i in range(1, track.size()):
		cum.append(cum[i - 1] + track[i].distance_to(track[i - 1]))
	return cum

static func point_at(track: PackedVector2Array, cum: PackedFloat32Array, s: float) -> Vector3:
	var length := cum[cum.size() - 1]
	s = clampf(s, 0.0, length)
	var i := 1
	while i < cum.size() - 1 and cum[i] < s:
		i += 1
	var t := inverse_lerp(cum[i - 1], cum[i], s) if cum[i] > cum[i - 1] else 0.0
	var p := track[i - 1].lerp(track[i], t)
	return Vector3(p.x, 0.0, p.y)

## The distance along the track nearest a world point.
static func nearest_s(track: PackedVector2Array, cum: PackedFloat32Array, pos: Vector3) -> float:
	var best := 0.0
	var best_d := INF
	var q := Vector2(pos.x, pos.z)
	for i in range(1, track.size()):
		var a := track[i - 1]
		var b := track[i]
		var ab := b - a
		var t := clampf((q - a).dot(ab) / maxf(ab.length_squared(), 1e-6), 0.0, 1.0)
		var d := q.distance_to(a + ab * t)
		if d < best_d:
			best_d = d
			best = cum[i - 1] + ab.length() * t
	return best

func _ready() -> void:
	var f := FileAccess.open("res://content/ferry_route.json", FileAccess.READ)
	var doc: Dictionary = JSON.parse_string(f.get_as_text()) if f else {}
	var from := 0
	for e in doc.get("events", []):
		if e.place == "waspPassage":
			from = int(e.index)
	_track = stretch(doc.get("track", [[1400, -6450], [300, -650]]), from)
	_cum = cumulative(_track)
	_length = _cum[_cum.size() - 1]
	_model = FerryModel.new()
	add_child(_model)
	_place()

## Start the ferry leaving Friday Harbor `delay` seconds from now (negative: already under way).
func depart_landing_in(delay: float) -> void:
	_s = _length
	_dir = -1.0
	_dwell = maxf(delay, 0.0)
	if delay < 0.0:
		_s = maxf(_length + delay * SPEED, 0.0)
	_place()

## Start the ferry inbound from Wasp Passage, `delay` seconds from now.
func inbound_in(delay: float) -> void:
	_s = 0.0
	_dir = 1.0
	_dwell = maxf(delay, 0.0)
	if delay < 0.0:
		_s = minf(-delay * SPEED, _length)
	_place()

## Put the ferry `ahead` metres up the track from a point, coming toward it (for checks).
func place_near(pos: Vector3, ahead: float) -> void:
	var s := nearest_s(_track, _cum, pos)
	# Distance along the stretch grows toward the landing, so up-channel of the boat is s - ahead,
	# and from there the ferry runs inbound, toward the boat.
	_s = clampf(s - ahead, 0.0, _length)
	_dir = 1.0
	_dwell = 0.0
	_place()

func advance(delta: float) -> void:
	if _dwell > 0.0:
		_dwell -= delta
		return
	_s += _dir * SPEED * delta
	if _s >= _length or _s <= 0.0:
		_s = clampf(_s, 0.0, _length)
		_dir = -_dir
		_dwell = DWELL
		warned = false
		honked = false
		waked = false
	_place()

func _place() -> void:
	global_position = point_at(_track, _cum, _s)
	var ahead := point_at(_track, _cum, clampf(_s + _dir * 120.0, 0.0, _length))
	var d := ahead - global_position
	if d.length() > 0.5:
		look_at(global_position + d, Vector3.UP)

## Alongside at a landing: no warning, no horn, no wake.
func docked() -> bool:
	return _dwell > 0.0 and (_s <= 0.0 or _s >= _length)

func distance_to_boat(pos: Vector3) -> float:
	return Vector2(pos.x - global_position.x, pos.z - global_position.z).length()
