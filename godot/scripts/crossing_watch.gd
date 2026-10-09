## A leg's crossing of the stream, watched frame by frame: the course made good against the line, the
## seconds the boat held that line in a real stream (for the record and the seamanship call), and the
## two things worth saying — once the stream sets the boat well off, the ferry angle; once it outruns
## a boat at touring pace, the card to wait for slack. Pure: the water scene feeds it, so the headless
## tests can drive it too.
class_name CrossingWatch
extends RefCounted

const REAL_STREAM_KN := 0.45   # under this a stream is not a crossing, and not judged
const SET_SAID_DEG := 12.0     # the ferry note goes up once the stream sets the boat this far off
const NO_HEADWAY := 0.25       # m/s along the line at the ferry angle: below it, the stream has the boat
const EDDY_NEAR := 80.0        # metres off the shore inside which its eddies take most of the stream
const EDDY_FAR := 240.0        # and beyond which the channel's stream runs full
const EDDY_LEFT := 0.3         # how much of the stream is left close in
const LINE_K := 0.6            # the eddy line: where the shore's share of the stream changes fast
const LINE_KN := 1.5           # a line is only felt with this much stream running outside it
const LINE_EVERY := 20.0       # seconds before the next line crossing is worth a note

var stream_s := 0.0     # seconds under way in a real stream
var on_line_s := 0.0    # of those, the seconds making good the line
var cmg := NAN          # course made good this frame, degrees, NAN with no way on
var set_deg := 0.0      # how far the stream sets the boat off its heading, signed
var steer := NAN        # the heading that holds the line at touring pace, NAN when none can
var ferry_said := false
var slack := 0          # the slack card: 0 not yet, 1 asked, 2 waited for
var eddy_k := 1.0      # how much of the channel's stream reaches the boat here, this frame
var eddy_said := false
var _raw_kn := 0.0      # the stream here before the shore takes any of it, knots
var _place := ""        # where the stream runs hard here ("in the narrows of Spieden Channel"), or ""
var line_dir := 0       # this frame: +1 out of an eddy into the stream, -1 into an eddy, 0 not crossing
var _inside := false
var _read := false      # the first reading only sets which side of the line the boat is on
var _line_cool := 0.0
var max_kn := 0.0       # the hardest stream the boat met on the leg, knots, as it reached the boat
var max_at := ""        # and where, for the record
var _was_sign := 0.0    # the way the channel's stream last ran: + flood, - ebb, 0 not yet read

## One frame. `fwd` is the bow's direction, `speed` its pace through the water (m/s), `line_deg` the
## bearing to the landing, `stream` the set and drift here. Returns "slack" when the card should go
## up, "ferry" when the note should, or "".
func tick(delta: float, fwd: Vector3, speed: float, line_deg: float, stream: Vector3, blind: bool, card_open: bool) -> String:
	cmg = FerryGlide.course_made_good(fwd * speed, stream) if speed > 0.4 else NAN
	var felt := stream.length() / FerryGlide.KN
	if felt > max_kn:
		max_kn = felt
		max_at = _place
	var heading := FerryGlide.course_made_good(fwd, Vector3.ZERO)
	set_deg = FerryGlide.set_off(heading, cmg)
	var real := stream.length() > REAL_STREAM_KN * FerryGlide.KN
	if real and not is_nan(cmg):
		stream_s += delta
		if FerryGlide.off_line(cmg, line_deg) <= SET_SAID_DEG:
			on_line_s += delta
	var tour := maxf(speed, Leg.TOURING_KNOTS * FerryGlide.KN)  # the advice is for a boat under way, not one just starting
	steer = FerryGlide.heading_for(line_deg, tour, stream)
	var way := FerryGlide.headway(line_deg, tour, stream)
	if blind:
		return ""
	if way < NO_HEADWAY and speed > 0.4 and slack == 0 and not card_open:
		slack = 1
		return "slack"
	if eddy_k < 0.5 and absf(_raw_kn) > 1.0 and speed > 0.4 and not eddy_said:
		eddy_said = true
		return "eddy"
	if way >= NO_HEADWAY and real and absf(set_deg) > SET_SAID_DEG and eddy_k >= 0.5 and not ferry_said:  # the ferry angle is for open water
		ferry_said = true
		return "ferry"
	return ""

## True on the frame the channel's stream turns, flood to ebb or ebb to flood. A reading of exactly
## zero is slack itself and is not a direction; the first reading only sets the way it runs.
func turned(kn: float) -> bool:
	if kn == 0.0:
		return false
	var sgn := signf(kn)
	var was := _was_sign
	_was_sign = sgn
	return was != 0.0 and sgn != was

## The note when the stream turns under the boat: which way it runs now, and what that means for a
## leg that favours `favours`. `short` is a phone's line.
static func turn_note(kn: float, favours: String, short := false) -> String:
	var tide := "flood" if kn > 0.0 else "ebb"
	var with_you := (kn > 0.0) == (favours != "ebb")
	if short:
		return "Slack water: the %s is starting, %s." % [tide, "with you" if with_you else "against you"]
	return "Slack water: the stream has turned, and the %s is starting. %s" % [tide, "From here it builds with you, and the miles come easier." if with_you else "From here it builds against you: hug the shore where the eddies run, or land and wait for the next turn."]

## How loud the rip runs here, 0 to 1: how much harder than the channel the stream runs at this spot
## (`factor`, 1 in open water), times how hard the channel runs now. Silent at slack and in the open.
static func rip_level(factor: float, kn: float) -> float:
	return clampf((factor - 1.0) / 0.6, 0.0, 1.0) * clampf(absf(kn) * factor / 3.0, 0.0, 1.0)

## How much of the stream runs this close to shore: points and bays turn it back on itself, and a
## paddler working against the run goes up the shore inside the eddies. 1 in open water.
static func eddy_factor(shore_m: float) -> float:
	return lerpf(EDDY_LEFT, 1.0, smoothstep(EDDY_NEAR, EDDY_FAR, shore_m))

## The shore this frame: keeps how much of the stream reaches the boat (and how hard it runs out in
## the channel, `kn`, and where it runs hard, `place`), and returns the factor to scale the stream by.
func eddy(shore_m: float, kn: float, place := "", delta := 0.0) -> float:
	eddy_k = eddy_factor(shore_m)
	var inside := eddy_k < LINE_K
	_line_cool = maxf(0.0, _line_cool - delta)
	line_dir = 0
	if _read and inside != _inside and absf(kn) > LINE_KN and _line_cool <= 0.0:
		line_dir = -1 if inside else 1
		_line_cool = LINE_EVERY
	_inside = inside
	_read = true
	_raw_kn = kn
	_place = place
	return eddy_k

## The note the first time the boat finds the shore's eddy with a real stream running outside it.
static func eddy_note(short := false) -> String:
	if short:
		return "In the shore's eddy: the stream eases in here."
	return "In close to the shore the stream eases: points and bays turn it back on itself in eddies. Working against the run, go up the shore inside them, point to point, and cross where you must."

## The day's hardest water for the record line: "the stream at 3.2 kn in the narrows of Spieden
## Channel" — or empty for a day that never ran a knot.
static func hardest_line(kn: float, at: String) -> String:
	if kn < 1.0:
		return ""
	return "the stream at %.1f kn%s" % [kn, (" " + at) if at != "" else ""]

## Crossing an eddy line the new water shoves the hull sideways: toward downstream coming out into
## the stream, back toward upstream (into the turn) going into an eddy. Edged toward that shove, the
## hull slides over the line; edged away, or flat, the line trips it. `edge` is the hips (-1 port ..
## 1 starboard), `right` the boat's starboard direction, `stream` the channel's set.
static func line_edged(edge: float, right: Vector3, stream: Vector3, dir: int) -> bool:
	var push := stream.normalized() * float(dir)
	var side := signf(push.dot(right))
	return edge * side > 0.4

static func line_note(edged: bool, dir: int, short := false) -> String:
	var where := "out into the stream" if dir > 0 else "into the eddy"
	if short:
		return "Eddy line, %s: %s" % [where, "edged right, and it slid under you." if edged else "it tripped the boat. Edge toward the new water."]
	if edged:
		return "Across the eddy line %s, edged the way the new water pushes: the shear slid under the hull instead of tripping it." % where
	return "The eddy line, %s: the new water grabbed the hull and rolled it. Crossing a line, edge toward where the water will push you — downstream coming out, into the turn going in — and brace if it bites." % where
