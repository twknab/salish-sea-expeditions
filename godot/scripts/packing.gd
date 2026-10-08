## Packing a folding kayak: no hatches, so dry bags go in through the cockpit into the flotation
## bags fore and aft, and a few things ride on deck. The same rules as the Phaser build's
## src/sim/packing.js: heavy low and central, bulky to the ends, essentials or you go without.
class_name Packing
extends RefCounted

const ZONES: Array[String] = ["bowEnd", "bowMid", "sternMid", "sternEnd", "deck"]
const ARM := { "bowEnd": 2.0, "bowMid": 1.0, "sternMid": -1.0, "sternEnd": -2.0, "deck": 0.0 }
const ZONE_NAME := { "bowEnd": "Bow · far end", "bowMid": "Bow · by the cockpit", "sternMid": "Stern · by the cockpit", "sternEnd": "Stern · far end", "deck": "On deck" }

static func empty() -> Dictionary:
	var p := {}
	for z in ZONES:
		p[z] = []
	return p

static func gear_by_id(gear: Array) -> Dictionary:
	var out := {}
	for g in gear:
		out[g.id] = g
	return out

## Where an item is, or "" when it is still on the beach.
static func zone_of(packing: Dictionary, id: String) -> String:
	for z in ZONES:
		if packing.get(z, []).has(id):
			return z
	return ""

## Move an item to a zone ("" takes it out of the boat). Returns a new layout.
static func place(packing: Dictionary, id: String, zone: String) -> Dictionary:
	var out := {}
	for z in ZONES:
		var items: Array = packing.get(z, []).duplicate()
		items.erase(id)
		if z == zone:
			items.append(id)
		out[z] = items
	return out

## Trim and handling from a layout. pitch: + bow heavy, − stern heavy (−1..1). ends: the share of
## the mass at the ends (sluggish turning). top: deck mass beyond a few kilos (less stable).
## missing: essentials left on the beach. enables: what the packed gear makes possible later.
static func assess(packing: Dictionary, gear: Array) -> Dictionary:
	var by_id := gear_by_id(gear)
	var total := 0.0
	var moment := 0.0
	var ends := 0.0
	var deck := 0.0
	var packed := {}
	for z in ZONES:
		for id in packing.get(z, []):
			if not by_id.has(id):
				continue
			var g: Dictionary = by_id[id]
			packed[id] = true
			var m := float(g.massKg)
			total += m
			moment += m * float(ARM[z])
			if z.ends_with("End"):
				ends += m
			if z == "deck":
				deck += m
	var missing: Array[String] = []
	var enables := {}
	for g in gear:
		if bool(g.get("essential", false)) and not packed.has(g.id):
			missing.append(str(g.id))
		if packed.has(g.id):
			for e in g.get("enables", []):
				enables[str(e)] = true
	return {
		"total": total,
		"pitch": clampf(moment / (total * 1.2), -1.0, 1.0) if total > 0.0 else 0.0,
		"ends": ends / total if total > 0.0 else 0.0,
		"top": maxf(0.0, (deck - 3.0) / 6.0),
		"missing": missing,
		"packed": packed.keys(),
		"enables": enables.keys(),
	}

## Handling penalty 0..1 for the HUD and the boat.
static func handling_penalty(a: Dictionary) -> float:
	return minf(1.0, absf(float(a.pitch)) * 0.8 + float(a.ends) * 0.4 + float(a.top) * 0.6)

## The trim in words, for the HUD line and the packing screen.
static func trim_words(a: Dictionary) -> String:
	var p := float(a.pitch)
	if p > 0.15:
		return "bow heavy"
	if p < -0.15:
		return "stern heavy"
	if float(a.top) > 0.3:
		return "top heavy"
	if float(a.ends) > 0.45:
		return "ends loaded"
	return "level"

## What the trim does to the boat, for the packing screen.
static func trim_consequence(a: Dictionary) -> String:
	return { "bow heavy": "the boat ploughs and every stroke costs more", "stern heavy": "the bow blows off downwind", "top heavy": "tender: the brace comes sooner", "ends loaded": "slow to turn", "level": "" }.get(trim_words(a), "")

## A good layout: deck gear on deck, the rest heaviest first into whichever bag keeps the boat
## nearest level — the heavy, compact things by the cockpit and the bulky ones at the ends.
static func suggested(gear: Array) -> Dictionary:
	var p := empty()
	var moment := 0.0
	var sorted := gear.duplicate()
	sorted.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a.massKg) > float(b.massKg))
	for g in sorted:
		var m := float(g.massKg)
		if bool(g.get("deck", false)):
			p.deck.append(g.id)
			continue
		var pair: Array = ["bowEnd", "sternEnd"] if bool(g.get("bulky", false)) else ["bowMid", "sternMid"]
		var zone: String = pair[0] if absf(moment + m * float(ARM[pair[0]])) <= absf(moment + m * float(ARM[pair[1]])) else pair[1]
		p[zone].append(g.id)
		moment += m * float(ARM[zone])
	return p

## Everything into one bag, for the checks.
static func lopsided(gear: Array, zone: String) -> Dictionary:
	var p := empty()
	for g in gear:
		p[zone].append(g.id)
	return p
