## Two-bone inverse kinematics for an arm: where the elbow goes when the hand is on the paddle.
class_name IK
extends RefCounted

## root: shoulder; target: hand; l1/l2: upper arm and forearm lengths; pole: which way the elbow
## should bend (down and out, for a paddler). Returns the elbow position. If the hand is out of
## reach the arm straightens toward it.
static func two_bone(root: Vector3, target: Vector3, l1: float, l2: float, pole: Vector3) -> Vector3:
	var d := target - root
	var dist := d.length()
	if dist < 1e-5:
		return root + Vector3.DOWN * l1
	var dir := d / dist
	dist = clampf(dist, absf(l1 - l2) + 1e-4, l1 + l2 - 1e-4)
	var a := (l1 * l1 - l2 * l2 + dist * dist) / (2.0 * dist)
	var h := sqrt(maxf(0.0, l1 * l1 - a * a))
	var perp := pole - dir * pole.dot(dir)
	if perp.length() < 1e-4:
		perp = Vector3.DOWN - dir * Vector3.DOWN.dot(dir)
	return root + dir * a + perp.normalized() * h
