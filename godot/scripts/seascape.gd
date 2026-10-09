## The sea and the sky as one node any scene can drop in: the Gerstner water plane riding under a
## `follow` node, a procedural sky, the sun for the hour, fog, and the sound loops' sea state.
class_name Seascape
extends Node3D

@export var hour := 8.5
@export var sunrise := 5.5    # hours; the chosen day's, read from App when there is one
@export var sunset := 21.17
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
var _stars: MeshInstance3D
var _star_mat: StandardMaterial3D
var night := 0.0   # 0 by day, 1 at full dark; scenes read it (the camp's bioluminescence waits for it)
var fog := 0.0     # 0 a clear day, 1 socked in; set_fog() — the leg's morning fog, if it has one
var rain := 0.0    # 0 dry, 1 a squall; set_rain() — streaks over the follow node and a grey sky
var _rain: CPUParticles3D

## Take the day's sunrise and sunset from the chosen day, when the app is running.
func set_day(day: Dictionary) -> void:
	sunrise = float(day.get("sunrise", 330)) / 60.0
	sunset = float(day.get("sunset", 1270)) / 60.0

func _ready() -> void:
	var app := get_tree().root.get_node_or_null("App")
	if app and app.has_method("chosen_day"):
		set_day(app.chosen_day())
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
	_build_stars()
	apply_hour(hour)
	add_child(sun)

## The night sky: a few hundred points on a dome, brighter along one band for the Milky Way, that
## follow the viewer and fade in with the dark. Points, not quads: the Compatibility renderer draws
## a point size, and a star is a point.
func _build_stars() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 48_123
	var pts := PackedVector3Array()
	var cols := PackedColorArray()
	var band := Vector3(0.55, 0.3, 0.78).normalized()  # the galactic plane, tilted across the sky
	for i in range(1400):
		var d := Vector3(rng.randfn(), rng.randfn(), rng.randfn()).normalized()
		if i % 5 != 0:
			d = (d - band * d.dot(band) * rng.randf_range(0.6, 0.97)).normalized()  # pulled toward the band
		if d.y < 0.03:
			continue
		pts.append(d * 9000.0)
		var b := rng.randf_range(0.45, 1.0)
		b = b * b
		cols.append(Color(0.85 + 0.15 * rng.randf(), 0.9, 1.0, b))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = pts
	arrays[Mesh.ARRAY_COLOR] = cols
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_POINTS, arrays)
	_stars = MeshInstance3D.new()
	_stars.mesh = mesh
	_star_mat = StandardMaterial3D.new()
	_star_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_star_mat.vertex_color_use_as_albedo = true
	_star_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_star_mat.use_point_size = true
	_star_mat.point_size = 3.5
	_star_mat.set_flag(BaseMaterial3D.FLAG_DISABLE_FOG, true)
	_star_mat.set_flag(BaseMaterial3D.FLAG_DISABLE_DEPTH_TEST, false)
	_star_mat.albedo_color = Color(1, 1, 1, 0.0)
	_stars.material_override = _star_mat
	_stars.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_stars.visible = false
	add_child(_stars)

## Put the sun and the sky where the clock says. Called at start and whenever `hour` moves.
func apply_hour(h: float) -> void:
	hour = h
	var dusk := Daylight.dusk_at(hour, sunrise, sunset)
	night = Daylight.night_at(hour, sunrise, sunset)  # a July night falls 20:55 → 22:40; a September one 18:45 → 20:30
	if _star_mat:
		_star_mat.albedo_color = Color(1, 1, 1, night)
		_stars.visible = night > 0.01
	var elev := Daylight.sun_elevation(hour, sunrise, sunset)
	sun.rotation = Vector3(elev, deg_to_rad(-55.0 + (hour - sunrise - 0.5) * 12.0), 0.0)
	sun.light_color = Color("fff1d6").lerp(Color("ffb070"), dusk * dusk)
	sun.light_energy = lerpf(1.1, 0.05, night)
	if _sky_mat:
		_sky_mat.sky_top_color = Color("3f6f9a").lerp(Color("2a3f6a"), dusk * 0.6).lerp(Color("05070f"), night)
		_sky_mat.sky_horizon_color = Color("a9bcc8").lerp(Color("e0a878"), dusk * dusk).lerp(Color("141a2a"), night)
		_sky_mat.ground_horizon_color = Color("9fb3bc").lerp(Color("10161f"), night)
	sun.light_energy *= (1.0 - 0.7 * fog) * (1.0 - 0.45 * rain)
	if _sky_mat and rain > 0.0:
		var slate := Color("6f7a82").lerp(Color("141a2a"), night)
		_sky_mat.sky_top_color = _sky_mat.sky_top_color.lerp(slate, rain * 0.8)
		_sky_mat.sky_horizon_color = _sky_mat.sky_horizon_color.lerp(slate.lightened(0.15), rain * 0.8)
	if _sky_mat and fog > 0.0:
		var grey := Color("d8dde0").lerp(Color("141a2a"), night)
		_sky_mat.sky_top_color = _sky_mat.sky_top_color.lerp(grey, fog * 0.85)
		_sky_mat.sky_horizon_color = _sky_mat.sky_horizon_color.lerp(grey, fog)
		_sky_mat.ground_horizon_color = _sky_mat.ground_horizon_color.lerp(grey, fog)
	if _env:
		_env.ambient_light_energy = lerpf(1.0, 0.25, night) * (1.0 - 0.3 * fog)
		_env.fog_light_color = Color("c0d0d8").lerp(Color("d8dde0"), fog).lerp(Color("0c1018"), night)
		_env.fog_density = Fog.density(fog, fog_density)
		_env.fog_sky_affect = lerpf(0.2, 0.9, fog)

## Rain on the water, 0 to 1: streaks fall around whatever the sea follows, and the light goes flat.
func set_rain(a: float) -> void:
	a = clampf(a, 0.0, 1.0)
	if absf(a - rain) < 0.002:
		return
	rain = a
	if _rain == null:
		_rain = CPUParticles3D.new()
		_rain.amount = 900
		_rain.lifetime = 1.1
		_rain.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
		_rain.emission_box_extents = Vector3(28.0, 0.5, 28.0)
		_rain.direction = Vector3(0, -1, 0)
		_rain.spread = 2.0
		_rain.initial_velocity_min = 11.0
		_rain.initial_velocity_max = 14.0
		_rain.gravity = Vector3(0, -4.0, 0)
		_rain.scale_amount_min = 0.6
		_rain.scale_amount_max = 1.0
		var bm := BoxMesh.new()
		bm.size = Vector3(0.012, 0.45, 0.012)
		_rain.mesh = bm
		var mat := StandardMaterial3D.new()
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.albedo_color = Color(0.85, 0.9, 0.95, 0.55)
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_rain.material_override = mat
		_rain.position = Vector3(0, 14.0, 0)
		add_child(_rain)
	_rain.emitting = rain > 0.05
	_rain.amount_ratio = rain
	apply_hour(hour)

## How much fog is on the water, 0 to 1. The sky, the sun and the haze follow it.
func set_fog(a: float) -> void:
	a = clampf(a, 0.0, 1.0)
	if absf(a - fog) < 0.002:
		return
	fog = a
	apply_hour(hour)

func _process(delta: float) -> void:
	time += delta
	_mat.set_shader_parameter("t", time)
	(_far.material_override as ShaderMaterial).set_shader_parameter("t", time)
	if follow:
		_water.global_position = Vector3(follow.global_position.x, 0.0, follow.global_position.z)
		if _stars:
			_stars.global_position = Vector3(follow.global_position.x, 0.0, follow.global_position.z)
		_far.global_position = Vector3(follow.global_position.x, -0.6, follow.global_position.z)
		if _rain:
			_rain.global_position = Vector3(follow.global_position.x, 14.0, follow.global_position.z)
		if terrain:
			terrain.focus = follow.global_position

func height_at(x: float, z: float) -> float:
	return Waves.height(x, z, time, sea_state)
