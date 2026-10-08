// The chart tile's paper: land, shallows and deep water read from the terrain's height texture
// (metres = r * 48 - 40), north up, for a window of the world given in metres.
shader_type canvas_item;

uniform sampler2D depth_map : filter_linear, repeat_disable;
uniform vec4 map_rect = vec4(0.0);   // x0, z0, width, height of the whole map, world metres
uniform vec4 view_rect = vec4(0.0);  // x0, z0, width, height of the window this tile shows
uniform vec3 land_color : source_color = vec3(0.78, 0.74, 0.58);
uniform vec3 shoal_color : source_color = vec3(0.52, 0.76, 0.80);
uniform vec3 water_color : source_color = vec3(0.20, 0.42, 0.56);
uniform vec3 deep_color : source_color = vec3(0.12, 0.26, 0.38);

void fragment() {
	vec2 world = view_rect.xy + UV * view_rect.zw;
	vec2 muv = (world - map_rect.xy) / map_rect.zw;
	float h = -40.0;
	if (muv.x > 0.0 && muv.x < 1.0 && muv.y > 0.0 && muv.y < 1.0) {
		h = texture(depth_map, muv).r * 48.0 - 40.0;
	}
	vec3 col;
	if (h > 0.4) {
		col = land_color;
	} else if (h > -6.0) {
		col = mix(shoal_color, water_color, clamp(-h / 6.0, 0.0, 1.0));
	} else {
		col = mix(water_color, deep_color, clamp((-h - 6.0) / 30.0, 0.0, 1.0));
	}
	// A hairline at the water's edge, the way a chart inks its coastline.
	float e = fwidth(h) * 1.5;
	float edge = 1.0 - smoothstep(0.0, e, abs(h - 0.4));
	col = mix(col, vec3(0.10, 0.12, 0.14), edge * 0.8);
	COLOR = vec4(col, 0.92);
}
