## The sea and the sky as one node any scene can drop in: the Gerstner water plane riding under a
## `follow` node, a procedural sky, the sun for the hour, fog, and the sound loops' sea state.
class_name Seascape
extends Node3D

@export var hour := 8.5
@export var sea_state := 0.22
@export var fog_density := 0.00022  # at sea level Orcas, 12 km off, is a shape in the haze; a chart from altitude wants far less
@export var follow: Node3D
## The real land, when a scene has it: the shader reads its heights for the shallows and the
## shore foam, and a flat far plane carries the water out to the horizon under the islands.
var terrain: Terrain

var time := 0.0
var _water: MeshInstance3D
var _far: MeshInstance3D
var _debug_no_water := false  # ?debug=nowater hides the sea, to look at the land alone
var _mat: ShaderMaterial
var sun: DirectionalLight3D
var _sky_mat: ProceduralSkyMaterial
var _env: Environment

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
	if terrain and not Terrain._cache_meta.is_empty():
		_mat.set_shader_parameter("depth_map", Terrain.height_texture())
		_mat.set_shader_parameter("map_rect", terrain.map_rect())
	else:
		var deep := Image.create(1, 1, false, Image.FORMAT_R8)
		_mat.set_shader_parameter("depth_map", ImageTexture.create_from_image(deep))
		_mat.set_shader_parameter("map_rect", Vector4(0, 0, 0, 0))
	if App._url_param("debug") == "depth":
		_mat.set_shader_parameter("debug_view", 1)
	_debug_no_water = App._url_param("debug") == "nowater"
	_water.material_override = _mat
	_water.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_water)
	# The far water: the same shader with the swell switched off, so the islands kilometres away
	# stand in water rather than in sky, and the near plane rides on top of it.
	_far = MeshInstance3D.new()
	var fm := PlaneMesh.new()
	fm.size = Vector2(40000, 40000)
	fm.subdivide_width = 40
	fm.subdivide_depth = 40
	_far.mesh = fm
	var far_mat: ShaderMaterial = _mat.duplicate()
	var flat: Array[Vector4] = []
	for w in Waves.WAVES:
		flat.append(Vector4(w.x, w.y, 0.0, w.w))
	far_mat.set_shader_parameter("waves", flat)
	_far.material_override = far_mat
	_far.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_far.position.y = -0.6
	add_child(_far)
	if _debug_no_water:
		_water.visible = false
		_far.visible = false
	_sky()
	Sound.set_sea(sea_state)

## The sea state as it changes through the day: the shader, the hull and the sound follow.
func set_sea_state(v: float) -> void:
	sea_state = clampf(v, 0.0, 1.0)
	if _mat:
		_mat.set_shader_parameter("sea_state", sea_state)
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
	_sky_mat = pm
	_env = env
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.9
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.95
	env.fog_enabled = true
	env.fog_light_color = Color("c0d0d8")
	env.fog_density = fog_density
	env.fog_sky_affect = 0.2
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	apply_hour(hour)
	add_child(sun)

## Put the sun and the sky where the clock says. Called at start and whenever `hour` moves.
func apply_hour(h: float) -> void:
	hour = h
	var dusk := clampf(absf(hour - 13.0) / 7.0, 0.0, 1.0)
	var night := clampf((absf(hour - 13.0) - 7.5) / 2.0, 0.0, 1.0)  # 20:30 → 22:30 fades to night
	var elev := deg_to_rad(-10.0 - 48.0 * sin(clampf((hour - 6.0) / 14.0, 0.0, 1.0) * PI))
	sun.rotation = Vector3(elev, deg_to_rad(-55.0 + (hour - 6.0) * 12.0), 0.0)
	sun.light_color = Color("fff1d6").lerp(Color("ffb070"), dusk * dusk)
	sun.light_energy = lerpf(1.1, 0.05, night)
	if _sky_mat:
		_sky_mat.sky_top_color = Color("3f6f9a").lerp(Color("2a3f6a"), dusk * 0.6).lerp(Color("05070f"), night)
		_sky_mat.sky_horizon_color = Color("a9bcc8").lerp(Color("e0a878"), dusk * dusk).lerp(Color("141a2a"), night)
		_sky_mat.ground_horizon_color = Color("9fb3bc").lerp(Color("10161f"), night)
	if _env:
		_env.ambient_light_energy = lerpf(1.0, 0.25, night)
		_env.fog_light_color = Color("c0d0d8").lerp(Color("0c1018"), night)

func _process(delta: float) -> void:
	time += delta
	_mat.set_shader_parameter("t", time)
	(_far.material_override as ShaderMaterial).set_shader_parameter("t", time)
	if follow:
		_water.global_position = Vector3(follow.global_position.x, 0.0, follow.global_position.z)
		_far.global_position = Vector3(follow.global_position.x, -0.6, follow.global_position.z)
		if terrain:
			terrain.focus = follow.global_position

func height_at(x: float, z: float) -> float:
	return Waves.height(x, z, time, sea_state)
