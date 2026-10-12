## The paddling partner: a second boat that holds station off your starboard quarter, keeps your
## pace, strokes in the cadence, and is the other half of a T-rescue. Nobody paddles the islands
## alone in this game; the plans say "together" and here is who that means. The boat is a frozen
## Kayak moved by its station — the same hull and figure, a different preset and skin.
class_name Partner
extends Node3D

const STATION := Vector3(9.0, 0.0, -3.0)   # metres off the player's starboard beam, a little ahead: two boat lengths, in the chase camera's frame
const CATCH_UP := 3.0                      # how quickly the gap closes, per second
const MIN_SPEED := 0.3                     # m/s before the figure strokes
const CADENCE := 0.984                     # the player's stroke cadence (Controls.CADENCE; kept here so the headless tests load this script without the App autoload)
const RAFT_GAP := 0.16                     # the station's share when rafted up: about a metre and a half between centrelines, hulls touching
const DRAW_IN := 0.3                       # how much of the station one draw toward the partner closes
const SPREAD := 0.15                       # per second, how fast the station opens again once the player paddles on
const OVER_STATE := 0.45                   # the drawn sea (0.10 calm to 0.70 its roughest) steep enough to put the partner over: about where the bail-outs card goes up
const OVER_AFTER := 25.0                   # seconds of it, out of a raft and with no card up, before it does (once a leg)
const REACH_M := 4.0                       # how close your boat must come to theirs to start the T-rescue

var preset: Dictionary = {}
var kayak: Kayak
var _side := 1
var _stroke_t := 0.0
var _last := Vector3.ZERO
var gap := 1.0  # the share of the station kept: 1 at two boat lengths, RAFT_GAP rafted up alongside
var rafts := 0  # times the boats rafted up on this leg, for the record
var over := false        # the partner is in the water beside an upturned boat
var swims := 0           # times the partner went over on this leg
var rescues_given := 0   # T-rescues the player gave on this leg, for the record

## Where the partner belongs for a player at `pos` facing along `basis`, `gap` of the way out.
static func station_for(pos: Vector3, basis: Basis, share := 1.0) -> Vector3:
	var p := pos + (basis.x * STATION.x + basis.z * STATION.z) * share
	return Vector3(p.x, 0.0, p.z)

## The preset that is not the player: the first whose parts differ from the save's pick.
static func pick_preset(presets: Array, mine: Dictionary) -> Dictionary:
	for p in presets:
		if p.skin != mine.get("skin", "") or p.hair != mine.get("hair", "") or p.style != mine.get("style", ""):
			return p
	return presets[0] if not presets.is_empty() else {}

func setup(look: Dictionary, skin: Dictionary, at: Vector3, heading_rad: float) -> void:
	kayak = Kayak.new()
	kayak.freeze = true
	kayak.paddler_look = look
	kayak.deck_color = Color(str(skin.get("deck", "#1b1e21")))
	kayak.panel_color = Color(str(skin.get("panel", "#2d9be0"))) if skin.get("panel") else kayak.deck_color
	kayak.hull_color = Color(str(skin.get("hull", "#f0f1ee")))
	add_child(kayak)
	kayak.build_hull()
	kayak.global_position = at
	kayak.rotation.y = -heading_rad
	_last = at

## A draw by the player: toward the partner (starboard), the boats close; true when that rafts them up.
func drew(side: int) -> bool:
	if side <= 0 or rafted() or over:
		return false
	gap = maxf(RAFT_GAP, gap - DRAW_IN)
	if rafted():
		rafts += 1
	return rafted()

## The debrief's words for a day's rafts, or nothing on a day without one.
static func rafts_line(n: int) -> String:
	if n <= 0:
		return ""
	return "rafted up %s" % ("once" if n == 1 else ("twice" if n == 2 else "%d times" % n))

## Rafted up at once: the card's choice in a blow, the partner coming alongside rather than you drawing in.
func raft_now() -> void:
	if not rafted():
		gap = RAFT_GAP
		rafts += 1

func rafted() -> bool:
	return gap <= RAFT_GAP + 0.001

## Follow the player: close on the station, face their way, ride the same water, stroke in time.
func follow(player: Kayak, sea: Node, delta: float) -> void:  # the Seascape, untyped so this script loads without the autoloads it reads
	if over:  # in the water, holding the upturned boat: it stays where it went over, riding the swell
		kayak.global_position.y = sea.height_at(kayak.global_position.x, kayak.global_position.z) + 0.1
		return
	if player.speed > 0.6:
		gap = minf(1.0, gap + SPREAD * delta)  # paddling on: the raft breaks and the station opens again
	var want := station_for(player.global_position, player.global_basis, gap)
	var here := kayak.global_position
	var to := want - Vector3(here.x, 0.0, here.z)
	var step := to * minf(1.0, CATCH_UP * delta)
	var next := Vector3(here.x + step.x, 0.0, here.z + step.z)
	var speed := next.distance_to(Vector3(_last.x, 0.0, _last.z)) / maxf(delta, 1e-4)
	_last = next
	next.y = sea.height_at(next.x, next.z) + 0.05
	kayak.global_position = next
	kayak.sea_time = sea.time
	kayak.sea_state = sea.sea_state
	var want_yaw := player.rotation.y
	kayak.rotation.y = lerp_angle(kayak.rotation.y, want_yaw, minf(1.0, delta * 2.5))
	if speed > MIN_SPEED:
		_stroke_t -= delta
		if _stroke_t <= 0.0:
			_stroke_t = CADENCE
			_side = -_side
			kayak.stroke_anim(_side)

## The squall's note. With a partner, a squall is what rafting up is for, so it says how to get
## alongside; alone, it says to keep paddling.
static func rain_note(partnered: bool, touch: bool) -> String:
	if partnered:
		return "Rain. It is the wind behind the front that matters, not the water on your deck. If it blows, raft up: %s." % ("double-tap a side to draw alongside" if touch else "Shift+A/D draws you alongside")
	if touch:
		return "Rain. Hood up, keep paddling; watch the wind behind it."
	return "Rain. Hood up and keep paddling: the drops flatten the chop, and it is the wind behind the front that matters, not the water on your deck."

## True on the frame the partner goes over: a steep sea for long enough, the first time this leg.
static func goes_over(state: float, rough_s: float, swims_so_far: int) -> bool:
	return swims_so_far == 0 and state >= OVER_STATE and rough_s >= OVER_AFTER

func go_over() -> void:
	over = true
	swims += 1
	gap = 1.0
	kayak.rotation.z = PI  # rolled about the keel line: the hull up, the paddler in the water beside it

## Back in their boat, after the T-rescue you gave.
func righted() -> void:
	over = false
	rescues_given += 1
	kayak.rotation.z = 0.0

## The rescuer's side of the T-rescue, in three cards: come to the bow, drain the boat over your
## deck, hold it while they climb in.
static func given_steps(name: String) -> Array:
	return [
		{ "title": "To the bow", "text": "Come in at right angles to %s's bow. They let go of their boat and hold yours: you are the steady one now. Talk to them; nine-degree water takes the breath first." % name },
		{ "title": "Drain it over your deck", "text": "Lift their bow across your foredeck, upside down, and rock it so the cockpit empties. Then roll it upright, cockpit toward them, and slide it alongside yours, bow to stern." },
		{ "title": "Hold it while they climb in", "text": "Lean across their deck with both hands on the cockpit rim, your weight on it. They come up from the side, legs in, and turn onto the seat. Skirt on, pump it dry, and paddle together while they warm up." },
	]

## The debrief's words for a day's rescues given, or nothing.
static func given_line(n: int, name: String) -> String:
	if n <= 0:
		return ""
	return "gave %s a T-rescue%s" % [name, "" if n == 1 else " %d times" % n]

