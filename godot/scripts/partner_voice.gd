## What the partner says at the moments that matter: a few words, never a lecture — the card and
## the note carry the teaching, the partner carries the nerve. Pure, so the headless tests can
## check it; `sea.gd` puts the line in front of the note or the card.
class_name PartnerVoice

const LINES := {
	"ferry": "Hold here. Let it go by.",
	"rough": "Say the word and we tuck in. No prizes for pushing on.",
	"fog": "On my quarter. Count with me — one, two…",
	"fog_lifts": "There it is. Told you the compass was right.",
	"orcas": "Paddles down. Let them choose.",
	"seals": "Easy — give the rock some room.",
	"capsize": "I’ve got your bow. Kick, and I’ll pull.",
	"dark": "Light on. Stay where I can see you.",
	"landing": "Nose it in. I’ll come in behind you.",
	"wake": "Bow into it. There — that’s all it is.",
	"kelp": "Kelp. Short strokes, we’re fine.",
	"rain": "Here it comes. Hood up — it’ll pass.",
	"turn": "Feel that? It’s turning.",
	"eddy": "In close. Feel it ease?",
}

## The partner's words for an event, by name, or empty when there are none.
static func line(event: String) -> String:
	return str(LINES.get(event, ""))

## The line as it goes in front of a note: `Mina: “Hold here. Let it go by.”  ` — empty when silent.
static func said(name: String, event: String) -> String:
	var l := line(event)
	return "" if l == "" else "%s: “%s”  " % [name, l]
