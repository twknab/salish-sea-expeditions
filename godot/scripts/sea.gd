## The scene conductor: sky and sun for the hour, the water's clock, the kayak and the touch
## controls wired together, and a small HUD. Everything here is a first slice of a Godot rewrite —
## see specs/007-godot-rewrite.
extends Node3D

@export var hour := 8.5
@export var sea_state := 0.3

@onready var water: MeshInstance3D = $Water
@onready var kayak: Kayak = $Kayak
@onready var controls: Controls = $UI/Controls
@onready var speed_label: Label = $UI/HUD/Speed
@onready var heading_label: Label = $UI/HUD/Heading
@onready var note_label: Label = $UI/HUD/Note

var _t := 0.0
var _sun: DirectionalLight3D
var _count := 0

func _ready() -> void:
	_sky()
	var mat := water.material_override as ShaderMaterial
	mat.set_shader_parameter("waves", Waves.WAVES)
	mat.set_shader_parameter("sea_state", sea_state)
	mat.set_shader_parameter("island_center", $Island.global_position)
	mat.set_shader_parameter("island_radius", ($Island as Island).radius * 0.78)
	kayak.sea_state = sea_state
	controls.stroke.connect(_on_stroke)
	controls.edge_changed.connect(func(v: float) -> void: kayak.edge = v)
	note_label.text = "Friday Harbor · calm water\nSwipe a blade zone from the top to the hip line."

func _sky() -> void:
	var env := Environment.new()
	var sky := Sky.new()
	var pm := ProceduralSkyMaterial.new()
	pm.sky_top_color = Color("3f6f9a")
	pm.sky_horizon_color = Color("c7d6df")
	pm.ground_bottom_color = Color("1a3a44")
	pm.ground_horizon_color = Color("b9c9d0")
	pm.sun_angle_max = 18.0
	pm.sun_curve = 0.12
	sky.sky_material = pm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.9
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.05
	env.fog_enabled = true
	env.fog_light_color = Color("c0d0d8")
	env.fog_density = 0.0016
	env.fog_sky_affect = 0.25
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	_sun = DirectionalLight3D.new()
	var elev := deg_to_rad(-12.0 - 46.0 * sin(clampf((hour - 6.0) / 14.0, 0.0, 1.0) * PI))
	_sun.rotation = Vector3(elev, deg_to_rad(-55.0 + (hour - 6.0) * 12.0), 0.0)
	_sun.light_color = Color("fff1d6")
	_sun.light_energy = 1.3
	_sun.shadow_enabled = true
	_sun.directional_shadow_max_distance = 60.0
	add_child(_sun)

func _process(delta: float) -> void:
	_t += delta
	(water.material_override as ShaderMaterial).set_shader_parameter("t", _t)
	kayak.sea_time = _t
	# The water plane rides along under the boat so the sea never ends.
	water.global_position = Vector3(kayak.global_position.x, 0.0, kayak.global_position.z)
	speed_label.text = "%.1f kn" % kayak.speed_knots()
	var deg := fposmod(rad_to_deg(kayak.heading), 360.0)
	heading_label.text = "%03d°" % int(round(deg))

func _on_stroke(side: int, q: float, kind: String) -> void:
	match kind:
		"forward":
			kayak.stroke(side, q)
			if q >= StrokeMath.GOOD_STROKE:
				_count += 1
				note_label.text = "%d rotation strokes" % _count
			else:
				note_label.text = "Not counted — rotate, don't pull"
		"sweep":
			kayak.sweep(side)
		"reverse":
			kayak.reverse(side)
