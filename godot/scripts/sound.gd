## Autoload: the sea's voice. Loops for water and wind that follow the sea state, splashes and
## drips for every stroke, a hull slap for a wave on the beam, the ferry's horn, a gull now and
## then. Every file is synthesized by tools/synth-audio.mjs — nothing sampled, nothing to licence.
extends Node

var _water: AudioStreamPlayer
var _wind: AudioStreamPlayer
var _one: Array[AudioStreamPlayer] = []
var _streams := {}
var _sea := 0.2
var _gull_t := 12.0
var _enabled := true

## The soundtrack: four full-length pieces (tools/synth-pieces.mjs), one playing at a time, crossfaded
## on a change. A scene asks for a mood; the mood names the piece.
const PIECES := ["dawn", "crossing", "night", "harbor"]
const PIECE_DB := -11.0
const FADE := 2.5  # seconds
const MOODS := {
	"off": "", "title": "dawn", "calm": "harbor", "ferry": "crossing", "drive": "crossing", "night": "night", "dawn": "dawn",
}
var _players: Array[AudioStreamPlayer] = []  # two, so one piece can fade out under the next
var _engine: AudioStreamPlayer
var _rain: AudioStreamPlayer
var _live := 0
var _piece := ""   # what is playing
var _wanted := ""  # what the scene asked for, kept across the music being switched off and on
var _music_on := true
## On the web the pieces are not in the pack (export_presets.cfg excludes them, which took 4.9 MB off the
## first download): they are fetched from audio/ beside the page after the first frame and kept here.
var _cache: Dictionary = {}   # piece -> AudioStreamMP3
var _http: HTTPRequest
var _fetching := ""

func _ready() -> void:
	for n in ["water_loop", "wind_loop", "splash_1", "splash_2", "splash_3", "drip_1", "drip_2", "hull_slap", "ferry_horn", "gull", "blow", "eagle", "engine_idle", "raccoons", "rain_loop"]:
		var s := _load("res://audio/%s.wav" % n)
		if s:
			_streams[n] = s
	_water = _loop("water_loop", -14.0)
	_wind = _loop("wind_loop", -26.0)
	_engine = _loop("engine_idle", -80.0)  # a diesel at idle, brought up when a boat is near
	_rain = _loop("rain_loop", -80.0)      # rain on the water and the deck, brought up with the squall
	for i in range(6):
		var p := AudioStreamPlayer.new()
		add_child(p)
		_one.append(p)
	for i in range(2):
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		p.volume_db = -80.0
		add_child(p)
		_players.append(p)
	_http = HTTPRequest.new()
	_http.request_completed.connect(_on_piece_fetched)
	add_child(_http)
	mood("title")

func _load(path: String) -> AudioStreamWAV:
	var s: AudioStreamWAV = null
	if FileAccess.file_exists(path):
		s = AudioStreamWAV.load_from_file(path)
	if s == null:
		var r = load(path)
		if r is AudioStreamWAV:
			s = r
	return s

func _loop(name: String, db: float) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	var s: AudioStreamWAV = _streams.get(name)
	if s:
		s.loop_mode = AudioStreamWAV.LOOP_FORWARD
		s.loop_begin = 0
		s.loop_end = s.data.size() / 2
		p.stream = s
	p.volume_db = db
	p.autoplay = true
	add_child(p)
	if s:
		p.play()
	return p

func set_sea(sea_state: float) -> void:
	_sea = clampf(sea_state, 0.0, 1.0)
	_water.volume_db = lerpf(-18.0, -8.0, _sea)
	_wind.volume_db = lerpf(-30.0, -12.0, _sea)

func set_enabled(on: bool) -> void:
	_enabled = on
	AudioServer.set_bus_mute(0, not on)

func _play(name: String, db: float, pitch := 1.0) -> void:
	if not _streams.has(name):
		return
	for p in _one:
		if not p.playing:
			p.stream = _streams[name]
			p.volume_db = db
			p.pitch_scale = pitch
			p.play()
			return

## A paddle plant: soft and sweet for a clean stroke, a little louder and lower for a hard one.
func splash(strength := 0.6) -> void:
	_play("splash_%d" % (randi() % 3 + 1), lerpf(-20.0, -10.0, clampf(strength, 0.0, 1.0)), randf_range(0.92, 1.08))
	get_tree().create_timer(randf_range(0.35, 0.6)).timeout.connect(func() -> void: _play("drip_%d" % (randi() % 2 + 1), -22.0, randf_range(0.9, 1.1)))

## A good stroke is nearly silent: a drip off the blade, not a splash.
func dip(strength := 0.4) -> void:
	_play("drip_%d" % (randi() % 2 + 1), lerpf(-30.0, -20.0, clampf(strength, 0.0, 1.0)), randf_range(0.9, 1.1))

func hull_slap(strength := 0.6) -> void:
	_play("hull_slap", lerpf(-22.0, -10.0, strength), randf_range(0.9, 1.1))

## The ferry's long blast; `far` is the one heard across the fog, not the one that is on you.
func horn(far := false) -> void:
	_play("ferry_horn", -18.0 if far else -6.0)

func gull() -> void:
	_play("gull", -20.0, randf_range(0.9, 1.15))

## An orca's blow, `near` 1 alongside to 0 at the edge of hearing.
func blow(near: float) -> void:
	if near <= 0.02:
		return
	_play("blow", lerpf(-34.0, -10.0, clampf(near, 0.0, 1.0)), randf_range(0.92, 1.08))

func eagle() -> void:
	_play("eagle", -16.0, randf_range(0.95, 1.05))

func raccoons() -> void:
	_play("raccoons", -14.0)

## Rain, 0 dry to 1 a squall; glides.
func set_rain(a: float) -> void:
	if _rain == null:
		return
	var want := lerpf(-80.0, -14.0, clampf(a, 0.0, 1.0)) if a > 0.01 else -80.0
	_rain.volume_db = lerpf(_rain.volume_db, want, 0.1)

## The idle of the nearest boat, `near` 1 alongside to 0 out of hearing; glides, so it never pops.
func set_engine(near: float) -> void:
	if _engine == null:
		return
	var want := lerpf(-80.0, -16.0, clampf(near, 0.0, 1.0)) if near > 0.01 else -80.0
	_engine.volume_db = lerpf(_engine.volume_db, want, 0.15)

## Pick the soundtrack's mood; stems glide to their new levels.
func mood(name: String) -> void:
	_wanted = str(MOODS.get(name, "dawn"))
	play_piece(_wanted)

## Start a piece, fading the one playing out under it. The same piece asked for again keeps playing;
## with the music off, nothing starts and whatever plays fades out.
func play_piece(name: String) -> void:
	if not _music_on:
		name = ""
	if name == _piece:
		return
	_piece = name
	if name == "" or not name in PIECES:
		_live = 1 - _live  # nothing new starts; whatever plays fades out under silence
		return
	var stream := _stream_for(name)
	if stream:
		_start(stream)
	elif OS.has_feature("web") and _fetching != name:
		_fetch(name)

## The piece's stream: from the cache, from the project when it is in the pack, else nothing yet.
func _stream_for(name: String) -> AudioStreamMP3:
	if _cache.has(name):
		return _cache[name]
	if not OS.has_feature("web"):
		var stream := load("res://audio/piece_%s.mp3" % name) as AudioStreamMP3
		if stream:
			stream.loop = true
			_cache[name] = stream
		return stream
	return null

func _start(stream: AudioStreamMP3) -> void:
	var nxt := 1 - _live
	var p := _players[nxt]
	p.stream = stream
	p.volume_db = -80.0
	p.play()
	_live = nxt

func _fetch(name: String) -> void:
	if _fetching != "":
		_http.cancel_request()
	_fetching = name
	# HTTPRequest wants an absolute URL: resolve the file against the page the game is served from.
	var url: String = str(JavaScriptBridge.eval("new URL('audio/piece_%s.mp3', location.href).href" % name))
	var err := _http.request(url)
	if err != OK:
		push_warning("piece %s: request failed (%d)" % [name, err])
		_fetching = ""

func _on_piece_fetched(result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	var name := _fetching
	_fetching = ""
	if result != HTTPRequest.RESULT_SUCCESS or code != 200 or body.is_empty():
		push_warning("piece %s: fetch failed (result %d, status %d)" % [name, result, code])
		return
	var stream := AudioStreamMP3.new()
	stream.data = body
	stream.loop = true
	_cache[name] = stream
	print("piece %s fetched (%d bytes)" % [name, body.size()])
	if _piece == name:
		_start(stream)
	elif _piece != "" and not _cache.has(_piece):
		_fetch(_piece)  # the scene moved on while this one was coming

func set_music(on: bool) -> void:
	_music_on = on
	play_piece(_wanted)

func _process(delta: float) -> void:
	for i in range(_players.size()):
		var p := _players[i]
		var want := PIECE_DB if (i == _live and p.playing and _music_on) else -80.0
		p.volume_db = move_toward(p.volume_db, want, delta * (80.0 - PIECE_DB) / FADE)
		if p.volume_db <= -79.0 and p.playing and i != _live:
			p.stop()
	_gull_t -= delta
	if _gull_t <= 0.0:
		_gull_t = randf_range(14.0, 36.0)
		gull()
