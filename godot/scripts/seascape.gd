## The sea and the sky as one node any scene can drop in: the Gerstner water plane riding under a
## `follow` node, a procedural sky, the sun for the hour, fog, and the sound loops' sea state.
class_name Seascape
extends Node3D

@export var hour := 8.5
@export var sea_state := 0.22
@export var follow: Node3D
@export var island_center := Vector3(0, 0, -140)
@export var island_radius := 55.0

var time := 0.0
var _water: MeshInstance3D
var _mat: ShaderMaterial
var sun: DirectionalLight3D

func _ready() -> void:
	_water = MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(700, 700)
	pm.subdivide_width = 180
	pm.subdivide_depth = 180
	_water.mesh = pm
	_mat = ShaderMaterial.new()
	_mat.shader = load("res://shaders/sea.gdshader")
	var noise := FastNoiseLite.new()
	noise.frequency = 0.06
	noise.fractal_octaves = 3
	var tex := NoiseTexture2D.new()
	tex.width = 256; tex.height = 256
	tex.seamless = true
	tex.as_normal_map = true
	tex.bump_strength = 6.0
	tex.noise = noise
	_mat.set_shader_parameter("ripple", tex)
	_mat.set_shader_parameter("waves", Waves.WAVES)
	_mat.set_shader_parameter("sea_state", sea_state)
	_mat.set_shader_parameter("island_center", island_center)
	_mat.set_shader_parameter("island_radius", island_radius)
	_water.material_override = _mat
	_water.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_water)
	_sky()
	Sound.set_sea(sea_state)

func _sky() -> void:
	var env := Environment.new()
	var sky := Sky.new()
	var pm := ProceduralSkyMaterial.new()
	var dusk := clampf(absf(hour - 13.0) / 7.0, 0.0, 1.0)
	pm.sky_top_color = Color("3f6f9a").lerp(Color("2a3f6a"), dusk * 0.6)
	pm.sky_horizon_color = Color("a9bcc8").lerp(Color("e0a878"), dusk * dusk)
	pm.ground_bottom_color = Color("1a3a44")
	pm.ground_horizon_color = Color("9fb3bc")
	pm.sun_angle_max = 18.0
	pm.sun_curve = 0.12
	sky.sky_material = pm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.9
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.95
	env.fog_enabled = true
	env.fog_light_color = Color("c0d0d8")
	env.fog_density = 0.0012
	env.fog_sky_affect = 0.2
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	var elev := deg_to_rad(-10.0 - 48.0 * sin(clampf((hour - 6.0) / 14.0, 0.0, 1.0) * PI))
	sun.rotation = Vector3(elev, deg_to_rad(-55.0 + (hour - 6.0) * 12.0), 0.0)
	sun.light_color = Color("fff1d6").lerp(Color("ffb070"), dusk * dusk)
	sun.light_energy = 1.1
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 60.0
	add_child(sun)

func _process(delta: float) -> void:
	time += delta
	_mat.set_shader_parameter("t", time)
	if follow:
		_water.global_position = Vector3(follow.global_position.x, 0.0, follow.global_position.z)

func height_at(x: float, z: float) -> float:
	return Waves.height(x, z, time, sea_state)
