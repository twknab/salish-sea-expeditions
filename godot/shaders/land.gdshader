// The island: a vertex-coloured mesh (sand, meadow, forest by height and slope) with a little
// grain so the slopes do not read as flat plastic.
shader_type spatial;
render_mode cull_back;

uniform sampler2D grain : filter_linear_mipmap, repeat_enable;

void fragment() {
	vec3 w = (INV_VIEW_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float g = texture(grain, w.xz * 0.08).r;
	ALBEDO = pow(COLOR.rgb, vec3(2.2)) * (0.86 + 0.28 * g);
	ROUGHNESS = 0.95;
	SPECULAR = 0.1;
}
