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

var stream_s := 0.0     # seconds under way in a real stream
var on_line_s := 0.0    # of those, the seconds making good the line
var cmg := NAN          # course made good this frame, degrees, NAN with no way on
var set_deg := 0.0      # how far the stream sets the boat off its heading, signed
var steer := NAN        # the heading that holds the line at touring pace, NAN when none can
var ferry_said := false
var slack := 0          # the slack card: 0 not yet, 1 asked, 2 waited for
var _was_sign := 0.0    # the way the channel's stream last ran: + flood, - ebb, 0 not yet read

## One frame. `fwd` is the bow's direction, `speed` its pace through the water (m/s), `line_deg` the
## bearing to the landing, `stream` the set and drift here. Returns "slack" when the card should go
## up, "ferry" when the note should, or "".
func tick(delta: float, fwd: Vector3, speed: float, line_deg: float, stream: Vector3, blind: bool, card_open: bool) -> String:
	cmg = FerryGlide.course_made_good(fwd * speed, stream) if speed > 0.4 else NAN
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
	if way >= NO_HEADWAY and real and absf(set_deg) > SET_SAID_DEG and not ferry_said:
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
