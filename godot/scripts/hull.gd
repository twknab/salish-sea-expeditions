## The folding sea kayak's lines, ported number for number from the three.js model so the Godot boat
## is the same boat: 4.88 m long, 0.57 m beam, cockpit centre just aft of midships, keel with rocker
## sweeping into raked stems. Station s runs 0 at the bow to 1 at the stern.
class_name Hull
extends RefCounted

const L := 4.88
const B := 0.57
const COCKPIT_S := 0.52
const COCKPIT_X := 0.42
const COCKPIT_Z := 0.2

## Half-beam at station s: fine ends that close to a stem, fullest just aft of midships.
static func half_beam(s: float) -> float:
	var t := clampf(s, 0.0, 1.0)
	return (B / 2.0) * pow(sin(PI * t), 0.7) * (1.0 - 0.06 * (1.0 - t))

## x (metres, bow positive) of station s, with the cockpit centre at x = 0.
static func x_at(s: float) -> float:
	return (COCKPIT_S - s) * L

## Heights along the hull: sheer, deck ridge, keel and chine (metres, waterline at 0).
static func heights(s: float) -> Dictionary:
	var e := absf(s - 0.5) * 2.0
	var bow := pow(1.0 - s / 0.5, 3.0) if s < 0.5 else 0.0
	var stern := pow((s - 0.5) / 0.5, 3.0) if s > 0.5 else 0.0
	var sheer := 0.15 + 0.12 * bow + 0.07 * stern
	var cockpit := exp(-pow((s - COCKPIT_S) / 0.08, 2.0))
	var fore := 1.0 if s < COCKPIT_S else 0.6
	var ridge := sheer + 0.11 * fore * (1.0 - pow(e, 3.0)) - 0.035 * cockpit + 0.015 * bow
	var near := exp(-pow((s - COCKPIT_S) / 0.075, 4.0))
	ridge = ridge + (0.255 - ridge) * near
	var keel := -0.15 * (1.0 - pow(e, 2.4))
	var k := clampf((e - 0.62) / 0.38, 0.0, 1.0)
	var stem := k * k * (3.0 - 2.0 * k)
	keel = keel + (sheer - 0.002 - keel) * pow(stem, 2.2)
	var chine := keel + (maxf(keel, sheer * 0.35) - keel) * 0.45
	return { "sheer": sheer, "ridge": ridge, "keel": keel, "chine": chine }

## Deck height at station s and lateral offset z.
static func deck_y(s: float, z: float) -> float:
	var h := heights(s)
	var w := maxf(half_beam(s) * 0.97, 1e-4)
	var t := maxf(0.0, 1.0 - absf(z) / w)
	return h.sheer + (h.ridge - h.sheer) * sin(t * PI / 2.0)

## One side's section at s from keel to ridge as (z, y) points; side is -1 port, +1 starboard.
static func section(s: float, side: float) -> PackedVector2Array:
	var w := half_beam(s)
	var h := heights(s)
	var pts := PackedVector2Array()
	pts.append(Vector2(0.0, h.keel))
	pts.append(Vector2(side * w * 0.55, h.chine))
	pts.append(Vector2(side * w * 0.92, lerpf(h.chine, h.sheer, 0.55)))
	pts.append(Vector2(side * w, h.sheer))
	var n := 5
	for i in range(1, n + 1):
		var z := side * w * (1.0 - float(i) / n)
		pts.append(Vector2(z, deck_y(s, z)))
	return pts

## Build the hull as an ArrayMesh: a loft through STATIONS sections, smooth-shaded, with a deck
## colour (skin) and a pale hull colour below the sheer, vertex-coloured so one material does it.
static func build_mesh(deck: Color, hull: Color, panel: Color) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var stations := 56
	var rings: Array[PackedVector3Array] = []
	var colors: Array[PackedColorArray] = []
	for i in range(stations + 1):
		var s := float(i) / stations
		var x := x_at(s)
		var ring := PackedVector3Array()
		var col := PackedColorArray()
		var port := section(s, -1.0)
		var star := section(s, 1.0)
		# Walk starboard keel→ridge then port ridge→keel so the ring is closed.
		var seq: Array = []
		for p in star:
			seq.append(p)
		var rev := Array(port)
		rev.reverse()
		for p in rev:
			seq.append(p)
		var h := heights(s)
		for p in seq:
			ring.append(Vector3(x, p.y, p.x))
			var on_deck: bool = p.y > h.sheer + 0.004
			var c := deck if on_deck else hull
			# A colour panel along the foredeck, like the real skins' side stripes.
			if on_deck and s > 0.12 and s < 0.44 and absf(p.x) > half_beam(s) * 0.35:
				c = panel
			col.append(c)
		rings.append(ring)
		colors.append(col)
	var n := rings[0].size()
	for i in range(stations):
		for j in range(n):
			var j2 := (j + 1) % n
			var a := rings[i][j]
			var b := rings[i][j2]
			var c := rings[i + 1][j2]
			var d := rings[i + 1][j]
			var ca := colors[i][j]
			var cb := colors[i][j2]
			var cc := colors[i + 1][j2]
			var cd := colors[i + 1][j]
			st.set_color(ca); st.add_vertex(a)
			st.set_color(cc); st.add_vertex(c)
			st.set_color(cb); st.add_vertex(b)
			st.set_color(ca); st.add_vertex(a)
			st.set_color(cd); st.add_vertex(d)
			st.set_color(cc); st.add_vertex(c)
	st.generate_normals()
	st.index()
	return st.commit()
