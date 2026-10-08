## The animals and plants of the field guide as their own assets: each a small built model with a
## life of its own, placed in the world where that species really lives. Nothing here is a sprite
## or a shared blob — a seal is a seal, a heron a heron, kelp a bed of kelp.
class_name Wildlife
extends Node3D

var kind := "seal"
var _t := randf() * 10.0
var _parts: Array[Node3D] = []
var _origin := Vector3.ZERO
var _heading := Vector3.FORWARD

static func _mat(c: Color, rough := 0.8) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	return m

static func _ball(parent: Node3D, radii: Vector3, c: Color, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 1.0; sm.height = 2.0; sm.radial_segments = 16; sm.rings = 10
	mi.mesh = sm
	mi.scale = radii
	mi.position = pos
	mi.rotation = rot
	mi.material_override = _mat(c)
	parent.add_child(mi)
	return mi

static func _rod(parent: Node3D, r: float, len: float, c: Color, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = r; cm.bottom_radius = r; cm.height = len; cm.radial_segments = 10
	mi.mesh = cm
	mi.position = pos
	mi.rotation = rot
	mi.material_override = _mat(c)
	parent.add_child(mi)
	return mi

static func _cone(parent: Node3D, r: float, len: float, c: Color, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.0; cm.bottom_radius = r; cm.height = len; cm.radial_segments = 10
	mi.mesh = cm
	mi.position = pos
	mi.rotation = rot
	mi.material_override = _mat(c)
	parent.add_child(mi)
	return mi

static func make(what: String, at: Vector3, heading := Vector3.FORWARD) -> Wildlife:
	var w := Wildlife.new()
	w.kind = what
	w._origin = at
	w._heading = heading.normalized()
	w.position = at
	w.look_at_from_position(at, at + w._heading, Vector3.UP)
	match what:
		"seals": w._seals()
		"heron": w._heron()
		"eagle": w._eagle()
		"kelp": w._kelp()
		"porpoise": w._porpoise()
	return w

## Harbour seals hauled out on a rock at the tide line: banana-curved, heads and tails up.
func _seals() -> void:
	_ball(self, Vector3(3.2, 0.9, 2.4), Color(0.38, 0.37, 0.35), Vector3(0, -0.3, 0))  # the rock
	var grey := Color(0.55, 0.56, 0.58)
	for i in range(3):
		var s := Node3D.new()
		s.position = Vector3(-1.1 + i * 1.1, 0.55, -0.6 + 0.5 * (i % 2))
		s.rotation.y = 0.3 * (i - 1)
		add_child(s)
		_ball(s, Vector3(0.34, 0.3, 0.75), grey.darkened(0.08 * i), Vector3(0, 0, 0))
		_ball(s, Vector3(0.2, 0.19, 0.24), grey, Vector3(0, 0.2, 0.78))     # head, lifted
		_ball(s, Vector3(0.16, 0.08, 0.3), grey, Vector3(0, 0.1, -0.8))     # tail flippers
		_ball(s, Vector3(0.05, 0.05, 0.05), Color(0.08, 0.08, 0.09), Vector3(0.1, 0.26, 0.96))
		_ball(s, Vector3(0.05, 0.05, 0.05), Color(0.08, 0.08, 0.09), Vector3(-0.1, 0.26, 0.96))
		_parts.append(s)

## A great blue heron standing in the shallows, neck in its S, watching the water.
func _heron() -> void:
	var blue := Color(0.42, 0.47, 0.52)
	_rod(self, 0.012, 0.6, Color(0.2, 0.18, 0.14), Vector3(0.06, 0.3, 0))
	_rod(self, 0.012, 0.6, Color(0.2, 0.18, 0.14), Vector3(-0.06, 0.3, 0))
	_ball(self, Vector3(0.14, 0.13, 0.3), blue, Vector3(0, 0.72, 0), Vector3(deg_to_rad(-10), 0, 0))
	_rod(self, 0.03, 0.3, blue.lightened(0.15), Vector3(0, 0.9, 0.18), Vector3(deg_to_rad(40), 0, 0))
	_rod(self, 0.028, 0.3, blue.lightened(0.15), Vector3(0, 1.1, 0.14), Vector3(deg_to_rad(-25), 0, 0))
	_ball(self, Vector3(0.06, 0.055, 0.09), Color(0.92, 0.92, 0.9), Vector3(0, 1.25, 0.2))
	_ball(self, Vector3(0.062, 0.03, 0.08), Color(0.12, 0.12, 0.14), Vector3(0, 1.28, 0.2))  # the black crown stripe
	_cone(self, 0.018, 0.16, Color(0.85, 0.7, 0.25), Vector3(0, 1.24, 0.34), Vector3(deg_to_rad(-80), 0, 0))
	_ball(self, Vector3(0.1, 0.05, 0.26), blue.darkened(0.2), Vector3(0, 0.78, -0.16))  # folded wings

## A bald eagle on the top of a fir on the point.
func _eagle() -> void:
	_rod(self, 0.14, 7.0, Color(0.3, 0.22, 0.15), Vector3(0, 3.5, 0))
	for i in range(3):
		_cone(self, 1.7 - i * 0.45, 3.2, Color(0.1, 0.22, 0.12).darkened(0.1 * i), Vector3(0, 3.6 + i * 1.6, 0))
	var perch := Node3D.new()
	perch.position = Vector3(0.15, 8.7, 0)
	add_child(perch)
	_ball(perch, Vector3(0.14, 0.2, 0.26), Color(0.22, 0.15, 0.1), Vector3(0, 0.2, 0), Vector3(deg_to_rad(20), 0, 0))
	_ball(perch, Vector3(0.09, 0.09, 0.1), Color(0.95, 0.95, 0.93), Vector3(0, 0.46, 0.12))
	_cone(perch, 0.03, 0.09, Color(0.95, 0.75, 0.15), Vector3(0, 0.45, 0.24), Vector3(deg_to_rad(-90), 0, 0))
	_ball(perch, Vector3(0.1, 0.03, 0.12), Color(0.95, 0.95, 0.93), Vector3(0, 0.0, -0.22))  # the white tail

## A bed of bull kelp: floats at the surface, stipes down into the dark, blades streaming.
func _kelp() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = int(_origin.x * 7 + _origin.z * 13)
	for i in range(26):
		var k := Node3D.new()
		k.position = Vector3(rng.randf_range(-14.0, 14.0), 0.0, rng.randf_range(-10.0, 10.0))
		add_child(k)
		var brown := Color(0.42, 0.33, 0.14).lerp(Color(0.3, 0.3, 0.1), rng.randf())
		_ball(k, Vector3(0.11, 0.1, 0.11), brown.lightened(0.1), Vector3(0, 0.02, 0))        # the float
		_rod(k, 0.02, 5.0, brown, Vector3(0, -2.5, 0))                                        # the stipe
		for b in range(3):
			var blade := _ball(k, Vector3(0.06, 0.006, 0.9), brown.darkened(0.1), Vector3(0.1 * (b - 1), 0.0, 0.95), Vector3(0, 0.2 * (b - 1), 0))
			_parts.append(blade)

## A harbour porpoise: small, dark, rolling through the surface every few seconds and gone.
func _porpoise() -> void:
	var body := Node3D.new()
	add_child(body)
	_ball(body, Vector3(0.22, 0.2, 0.8), Color(0.12, 0.13, 0.15), Vector3.ZERO)
	_ball(body, Vector3(0.14, 0.1, 0.5), Color(0.75, 0.75, 0.75), Vector3(0, -0.1, 0.1))  # the pale belly
	_cone(body, 0.12, 0.22, Color(0.1, 0.11, 0.13), Vector3(0, 0.26, -0.05))              # the small triangular fin
	_ball(body, Vector3(0.3, 0.03, 0.12), Color(0.12, 0.13, 0.15), Vector3(0, 0, -0.85))  # flukes
	_parts.append(body)

func _process(delta: float) -> void:
	_t += delta
	match kind:
		"seals":
			for i in range(_parts.size()):
				var s := _parts[i]
				s.rotation.x = -0.06 + 0.05 * sin(_t * 0.7 + i * 2.1)  # a head lifts now and then
		"kelp":
			for i in range(_parts.size()):
				var b := _parts[i]
				b.rotation.y = 0.2 * ((i % 3) - 1) + 0.25 * sin(_t * 0.6 + i * 0.7)
		"porpoise":
			# A slow circuit, breaking the surface in an arc every few seconds.
			var body := _parts[0]
			var cyc := fmod(_t, 7.0)
			var up := clampf(1.0 - absf(cyc - 1.0) / 1.0, 0.0, 1.0)
			var along := _t * 1.6
			body.position = Vector3(sin(along * 0.05) * 25.0, -0.9 + 1.25 * sin(up * PI), fmod(along, 60.0) - 30.0)
			body.rotation.x = -0.9 * cos(up * PI) * up
			if up > 0.95 and not _breathed:
				_breathed = true
				Sound.splash(0.25)
			if up <= 0.0:
				_breathed = false

var _breathed := false
