// The Salish Sea. Four Gerstner waves displace the vertices (Waves.gd computes the same heights on
// the CPU for buoyancy, so the kayak sits on the water it is drawn on), a scrolling noise normal map
// adds wind ripple, Fresnel blends deep green-blue water with the sky, foam whitens the steep crests,
// and shallows warm toward sand near the island.
shader_type spatial;
render_mode cull_disabled, depth_draw_always;

uniform vec4 waves[4];          // dir.x, dir.z, steepness, wavelength — mirrored in waves.gd
uniform float sea_state : hint_range(0.0, 1.0) = 0.3;
uniform float t = 0.0;
uniform vec3 deep_color : source_color = vec3(0.02, 0.09, 0.13);
uniform vec3 shallow_color : source_color = vec3(0.10, 0.34, 0.36);
uniform vec3 sand_color : source_color = vec3(0.55, 0.52, 0.40);
uniform vec3 sky_color : source_color = vec3(0.50, 0.64, 0.76);
uniform sampler2D ripple : hint_normal, filter_linear_mipmap, repeat_enable;
uniform float ripple_scale = 0.18;
uniform vec3 island_center = vec3(0.0, 0.0, -140.0);
uniform float island_radius = 70.0;

varying float crest;
varying float depth_t;

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
	float dist = length(world.xz + disp.xz - island_center.xz);
	depth_t = clamp((dist - island_radius) / 60.0, 0.0, 1.0);
}

void fragment() {
	vec2 w = (INV_VIEW_MATRIX * vec4(VERTEX, 1.0)).xz;
	vec3 n1 = texture(ripple, w * ripple_scale + vec2(t * 0.012, t * 0.004)).xyz * 2.0 - 1.0;
	vec3 n2 = texture(ripple, w * ripple_scale * 2.3 - vec2(t * 0.007, -t * 0.011)).xyz * 2.0 - 1.0;
	vec3 detail = normalize(vec3(n1.xy + n2.xy, 1.0));
	float wind = mix(0.08, 0.3, sea_state);
	NORMAL_MAP = normalize(vec3(detail.xy * wind, 1.0));
	NORMAL_MAP_DEPTH = 1.0;
	vec3 water = mix(sand_color, mix(shallow_color, deep_color, depth_t), smoothstep(0.0, 0.25, depth_t));
	float fresnel = pow(1.0 - clamp(dot(normalize(NORMAL), VIEW), 0.0, 1.0), 4.0);
	vec3 col = mix(water, sky_color, 0.12 + 0.6 * fresnel);
	col = mix(col, vec3(0.92, 0.95, 0.96), crest * 0.8);
	ALBEDO = col;
	ROUGHNESS = mix(0.14, 0.3, crest);
	SPECULAR = 0.4;
	METALLIC = 0.0;
	ALPHA = 1.0;
}
