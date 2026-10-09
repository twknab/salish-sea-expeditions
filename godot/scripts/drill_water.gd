class_name DrillWater
extends RefCounted
## Kayak School's moving-water drills, out of the water scene: the ferry angle (a knot of stream
## across the line the bow first pointed down) and the eddy line (still water behind the boat, a
## stream a knot and a half beyond a line ahead). Pure where it can be, so the tests can paddle it.

const EDDY_M := 12.0   # the eddy line, this far ahead of where the drill began
const EDDY_KN := 1.5   # the stream beyond it, across the line from the left

## The drill's water when it begins, from where the boat is and the way the bow points.
static func start(id: String, at: Vector3, bow: Vector3) -> Dictionary:
	var line := FerryGlide.course_made_good(bow, Vector3.ZERO)
	if id == "ferry":
		return { "line": line, "stream": FerryGlide.across(line, 1.0) }
	var fwd := Vector3(bow.x, 0.0, bow.z).normalized()
	return { "line": line, "origin": at, "fwd": fwd, "stream": FerryGlide.across(line, EDDY_KN), "out": false }

## Which side of the eddy line `at` is: true beyond it, in the stream.
static func beyond(s: Dictionary, at: Vector3) -> bool:
	return (at - (s.origin as Vector3)).dot(s.fwd as Vector3) > EDDY_M

## The water that carries the boat this frame: the ferry drill's stream everywhere, the eddy
## drill's only beyond the line.
static func carry(id: String, s: Dictionary, at: Vector3) -> Vector3:
	if id == "ferry" or beyond(s, at):
		return s.stream
	return Vector3.ZERO

## One frame of the eddy-line drill: 0 when the boat stayed on its side, 1 when it crossed out into
## the stream, -1 when it crossed back into the eddy. Records the side for the next frame.
static func crossed(s: Dictionary, at: Vector3) -> int:
	var now := beyond(s, at)
	var was: bool = s.out
	s.out = now
	if now == was:
		return 0
	return 1 if now else -1

## The water across the eddy line, as a pale band of shear on the surface, `EDDY_M` ahead and
## sixty metres long.
static func line_mesh(s: Dictionary) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.name = "EddyLine"
	var plane := PlaneMesh.new()
	plane.size = Vector2(60.0, 0.6)
	mi.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.86, 0.93, 0.95, 0.55)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mi.material_override = mat
	var fwd: Vector3 = s.fwd
	var at: Vector3 = (s.origin as Vector3) + fwd * EDDY_M
	mi.position = Vector3(at.x, 0.06, at.z)
	mi.rotation.y = atan2(fwd.x, fwd.z)  # the plane's long side runs across the bow's line
	return mi
