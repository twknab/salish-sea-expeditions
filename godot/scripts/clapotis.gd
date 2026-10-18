class_name Clapotis
extends RefCounted
## Clapotis: under a steep shore the waves that hit the rock bounce back out and meet the ones still
## coming in, and the sea stands up in peaks with no rhythm to brace to. A gentle beach takes the
## waves; a cliff returns them. A few boat lengths off, the reflected sea has spent itself. Pure, for
## the tests: the sampling below reads the terrain, the reading itself takes numbers.

const RINGS := [30.0, 60.0]  # metres out from the boat: the terrain is a 48 m grid, so nearer reads a smoothed shore
const SPOKES := 8
const STEEP := 0.25          # rise over run below which a shore takes the waves rather than returning them
const FULL := 0.55           # a cliff, as steep as the islands get on this grid

## 0 open water or a beach, 1 hard under a cliff: the steepest land seen, as rise over run.
static func amount(heights: Array, dists: Array) -> float:
	var steepest := 0.0
	for i in heights.size():
		if float(heights[i]) > 0.0:
			steepest = maxf(steepest, float(heights[i]) / maxf(float(dists[i]), 1.0))
	return clampf((steepest - STEEP) / (FULL - STEEP), 0.0, 1.0)

## The amount at a point on the water, sampled from the terrain around it.
static func at(terrain: Terrain, pos: Vector3) -> float:
	var hs: Array = []
	var ds: Array = []
	for r in RINGS:
		for k in SPOKES:
			var a := TAU * float(k) / float(SPOKES)
			hs.append(terrain.height_at(pos.x + cos(a) * r, pos.z + sin(a) * r))
			ds.append(r)
	return amount(hs, ds)

## How much the reflected sea adds to the sea state there: up to two thirds again.
static func lift(state: float, amt: float) -> float:
	return state * (1.0 + 0.66 * amt)
