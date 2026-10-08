## A dashed ribbon laid a little above the water, the way a chart draws a route. Shared by the
## ferry's track and the float plan's leg.
class_name ChartRibbon
extends RefCounted

static func build(points: PackedVector3Array, colour: Color, half := 22.0, dash := 160.0, gap := 110.0) -> MeshInstance3D:
	var im := ImmediateMesh.new()
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = colour
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.no_depth_test = true
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED  # a ribbon reads from either side; culled, it vanished from the chart
	im.surface_begin(Mesh.PRIMITIVE_TRIANGLES, mat)
	var y := Vector3.UP * 2.5
	for i in range(points.size() - 1):
		var a := points[i]; var b := points[i + 1]
		var seg := b - a
		var len := seg.length()
		if len < 0.01:
			continue
		var d := seg / len
		var n := Vector3(-d.z, 0.0, d.x) * half
		var s := 0.0
		while s < len:
			var e := minf(s + dash, len)
			var p0 := a + d * s; var p1 := a + d * e
			var v0 := p0 - n + y; var v1 := p0 + n + y; var v2 := p1 + n + y; var v3 := p1 - n + y
			im.surface_add_vertex(v0); im.surface_add_vertex(v1); im.surface_add_vertex(v2)
			im.surface_add_vertex(v0); im.surface_add_vertex(v2); im.surface_add_vertex(v3)
			s += dash + gap
	im.surface_end()
	var mi := MeshInstance3D.new()
	mi.mesh = im
	return mi
