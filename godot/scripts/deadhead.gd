class_name Deadhead
extends Node3D
## A deadhead: a log so waterlogged it floats on end, a hand of it above the surface and the rest
## below. The Salish Sea carries a great many of them, and in a chop they hide between the waves.
## One rides near each day's route; it says so when the boat closes on it, and a boat that hits it
## at speed is jarred hard. The placement and the reading are static, for the tests.

signal said(text: String, struck: bool)

const NEAR_M := 40.0       # close enough to see it lift on the swell
const HIT_M := 2.6         # the bow on it
const HIT_SPEED := 0.8     # m/s: drifting onto it is a nudge, paddling onto it is a blow
const ALONG := 0.45        # how far along the day's line it floats
const OFF_M := 14.0        # and how far to one side

var struck := 0
var _kayak: Node3D
var _sea: Node             # the Seascape, untyped so this script loads without the autoloads it reads
var _near_said := false
var _cool := 0.0

## The point ALONG the waypoints' length, OFF_M to the right of the line there.
static func place(points: Array[Vector3], along := ALONG, off := OFF_M) -> Vector3:
	if points.size() < 2:
		return points[0] if not points.is_empty() else Vector3.ZERO
	var total := 0.0
	for i in points.size() - 1:
		total += points[i].distance_to(points[i + 1])
	var want := total * clampf(along, 0.0, 1.0)
	for i in points.size() - 1:
		var seg := points[i].distance_to(points[i + 1])
		if want <= seg or i == points.size() - 2:
			var dir := (points[i + 1] - points[i]).normalized()
			var at := points[i] + dir * minf(want, seg)
			return at + Vector3(-dir.z, 0.0, dir.x) * off
		want -= seg
	return points[-1]

## "" while it is far, "near" inside NEAR_M, "struck" when the bow is on it at speed.
static func reading(dist: float, speed: float) -> String:
	if dist < HIT_M and speed > HIT_SPEED:
		return "struck"
	return "near" if dist < NEAR_M else ""

func setup(at: Vector3, kayak: Node3D, sea: Node) -> void:
	_kayak = kayak
	_sea = sea
	global_position = at
	var mesh := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.22
	cyl.bottom_radius = 0.26
	cyl.height = 3.2
	mesh.mesh = cyl
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("4a3a2c")
	mat.roughness = 1.0
	mesh.material_override = mat
	mesh.position.y = -1.3  # most of it below: a hand of grey wood above the surface
	mesh.rotation.x = 0.25
	add_child(mesh)

func _process(delta: float) -> void:
	if _kayak == null:
		return
	global_position.y = float(_sea.height_at(global_position.x, global_position.z))
	_cool = maxf(0.0, _cool - delta)
	var here := Vector2(_kayak.global_position.x, _kayak.global_position.z)
	var r := reading(here.distance_to(Vector2(global_position.x, global_position.z)), float(_kayak.get("speed")))
	if r == "struck" and _cool <= 0.0:
		struck += 1
		_cool = 5.0
		said.emit("A deadhead: a waterlogged log floating on end, all but a hand of it under. It stops the bow dead. Look between the waves for the grey wood, and give it room.", true)
	elif r == "near" and not _near_said:
		_near_said = true
		said.emit("A deadhead off the bow: a log floating on end, all but a hand of it under. In a chop it hides between the waves. Give it room.", false)
