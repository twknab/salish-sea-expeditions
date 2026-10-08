// The Salish Sea. Four Gerstner waves displace the vertices (Waves.gd computes the same heights on
// the CPU for buoyancy, so the kayak sits on the water it is drawn on), a scrolling noise normal map
// adds wind ripple, Fresnel blends deep green-blue water with the sky, foam whitens the steep crests,
// and the shallows warm toward sand where the real seabed (Terrain.height_texture) comes up.
shader_type spatial;
render_mode cull_disabled, depth_draw_always;

uniform vec4 waves[4];          // dir.x, dir.z, steepness, wavelength — mirrored in waves.gd
uniform float sea_state : hint_range(0.0, 1.0) = 0.3;
uniform float t = 0.0;
uniform vec3 deep_color : source_color = vec3(0.02, 0.09, 0.13);
uniform vec3 shallow_color : source_color = vec3(0.10, 0.34, 0.36);
uniform vec3 sand_color : source_color = vec3(0.55, 0.52, 0.40);
uniform vec3 sky_color : source_color = vec3(0.40, 0.54, 0.66);
uniform sampler2D ripple : hint_normal, filter_linear_mipmap, repeat_enable;
uniform float ripple_scale = 0.18;
uniform sampler2D depth_map : filter_linear, repeat_disable;  // Terrain heights, metres = r * 48 - 40
uniform vec4 map_rect = vec4(0.0);                               // x0, z0, width, height in world metres; 0 = no map
uniform int debug_view = 0;                                       // 1 paints the seabed depth (?debug=depth)

varying float crest;

void vertex() {
	vec3 p = VERTEX;
	vec3 world = (MODEL_MATRIX * vec4(p, 1.0)).xyz;
	vec3 disp = vec3(0.0);
	vec3 tangent = vec3(1.0, 0.0, 0.0);
	vec3 binormal = vec3(0.0, 0.0, 1.0);
	float jac = 0.0;
	for (int i = 0; i < 4; i++) {
		vec2 d = normalize(waves[i].xy);
		float steep = waves[i].z * mix(0.35, 1.0, sea_state);
		float k = 2.0 * PI / waves[i].w;
		float c = sqrt(9.81 / k);
		float f = k * (dot(d, world.xz) - c * t);
		float a = steep / k;
		disp.x += d.x * a * cos(f);
		disp.y += a * sin(f);
		disp.z += d.y * a * cos(f);
		tangent += vec3(-d.x * d.x * steep * sin(f), d.x * steep * cos(f), -d.x * d.y * steep * sin(f));
		binormal += vec3(-d.x * d.y * steep * sin(f), d.y * steep * cos(f), -d.y * d.y * steep * sin(f));
		jac += steep * sin(f);
	}
	VERTEX = p + disp;
	NORMAL = normalize(cross(binormal, tangent));
	crest = clamp((jac - 0.55) * 2.5, 0.0, 1.0);
}

float seabed(vec2 w) {
	if (map_rect.z <= 0.0) {
		return -40.0;
	}
	vec2 uv = (w - map_rect.xy) / map_rect.zw;
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
		return -40.0;
	}
	return texture(depth_map, uv).r * 48.0 - 40.0;
}

void fragment() {
	vec2 w = (INV_VIEW_MATRIX * vec4(VERTEX, 1.0)).xz;
	vec3 n1 = texture(ripple, w * ripple_scale + vec2(t * 0.012, t * 0.004)).xyz * 2.0 - 1.0;
	vec3 n2 = texture(ripple, w * ripple_scale * 2.3 - vec2(t * 0.007, -t * 0.011)).xyz * 2.0 - 1.0;
	vec3 detail = normalize(vec3(n1.xy + n2.xy, 1.0));
	float wind = mix(0.08, 0.3, sea_state);
	NORMAL_MAP = normalize(vec3(detail.xy * wind, 1.0));
	NORMAL_MAP_DEPTH = 1.0;
	float bed = seabed(w);
	float depth_t = clamp(-bed / 28.0, 0.0, 1.0);
	vec3 water = mix(sand_color, mix(shallow_color, deep_color, depth_t), smoothstep(0.0, 0.09, depth_t));
	// A lace of foam where the water meets the shore.
	float lace = (1.0 - smoothstep(0.0, 0.05, depth_t)) * (0.55 + 0.45 * sin(t * 1.3 + w.x * 0.21 + w.y * 0.17));
	float fresnel = pow(1.0 - clamp(dot(normalize(NORMAL), VIEW), 0.0, 1.0), 4.0);
	vec3 col = mix(water, sky_color, 0.12 + 0.6 * fresnel);
	col = mix(col, vec3(0.92, 0.95, 0.96), clamp(crest * 0.8 + lace * 0.5, 0.0, 1.0));
	if (debug_view == 1) {
		col = vec3(depth_t, 1.0 - depth_t, step(bed, -39.9));
	}
	ALBEDO = col;
	ROUGHNESS = mix(0.14, 0.3, crest);
	SPECULAR = 0.4;
	METALLIC = 0.0;
	ALPHA = 1.0;
}
