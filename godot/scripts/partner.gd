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

var preset: Dictionary = {}
var kayak: Kayak
var _side := 1
var _stroke_t := 0.0
var _last := Vector3.ZERO
var gap := 1.0  # the share of the station kept: 1 at two boat lengths, RAFT_GAP rafted up alongside
var rafts := 0  # times the boats rafted up on this leg, for the record

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
	if side <= 0 or rafted():
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

func rafted() -> bool:
	return gap <= RAFT_GAP + 0.001

## Follow the player: close on the station, face their way, ride the same water, stroke in time.
func follow(player: Kayak, sea: Node, delta: float) -> void:  # the Seascape, untyped so this script loads without the autoloads it reads
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
