## Gerstner wave field, the CPU twin of shaders/sea.gdshader. Both read the same WAVES table and
## the same formula, so a probe under the hull finds the surface exactly where it is drawn.
class_name Waves
extends RefCounted

## dir.x, dir.z, steepness, wavelength. Steepness is scaled by sea state in both places.
const WAVES: Array[Vector4] = [
	Vector4(1.0, 0.35, 0.22, 11.0),
	Vector4(0.7, -0.6, 0.18, 6.5),
	Vector4(-0.3, 1.0, 0.12, 3.6),
	Vector4(0.9, 0.1, 0.07, 1.9),
]

static func steepness_scale(sea_state: float) -> float:
	return lerpf(0.35, 1.0, clampf(sea_state, 0.0, 1.0))

## Surface height (metres) above y = 0 at world (x, z) and time t.
static func height(x: float, z: float, t: float, sea_state: float) -> float:
	var y := 0.0
	var s := steepness_scale(sea_state)
	for w in WAVES:
		var d := Vector2(w.x, w.y).normalized()
		var k := TAU / w.w
		var c := sqrt(9.81 / k)
		var f := k * (d.dot(Vector2(x, z)) - c * t)
		y += (w.z * s / k) * sin(f)
	return y

## Surface normal at (x, z), from finite differences, for a boat that wants to sit on the slope.
static func normal(x: float, z: float, t: float, sea_state: float) -> Vector3:
	var e := 0.25
	var hx := height(x + e, z, t, sea_state) - height(x - e, z, t, sea_state)
	var hz := height(x, z + e, t, sea_state) - height(x, z - e, t, sea_state)
	return Vector3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)).normalized()
