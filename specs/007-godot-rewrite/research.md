# Research: Godot for Salish Sea Expeditions

## Decision: Godot 4.5, Compatibility renderer, web export without threads

**Why Godot at all.** The Phaser game draws real 3D (three.js) but only to bake sprites; the sea
is a 2D shader. A believable ocean — swell the boat rides, reflections, crests, fog, light that
changes through the day — is a 3D scene, and Godot gives us the scene graph, physics, PBR
lighting, shadows, sky, fog and a shader language in one engine with a real editor, plus native
mobile exports later (iOS, Android) from the same project.

**Why Compatibility (OpenGL ES 3 / WebGL 2).** Forward+ and Mobile renderers need Vulkan or
Metal and do not export to the web. Compatibility is the only web renderer, and it is also the
right choice for older phones.

**Why no threads.** Godot's threaded web build needs `SharedArrayBuffer`, which needs
cross-origin isolation headers (COOP/COEP), which break every third-party embed and are flaky on
iOS Safari. The `nothreads` template runs everywhere at the cost of audio running on the main
thread. Our static server does not need the headers.

## What was measured here (headless Linux, SwiftShader)

| Item                                  | Result                                        |
| ------------------------------------- | --------------------------------------------- |
| Headless unit tests                   | 32 pass in under 2 s                          |
| Web export                            | 38 MB `index.wasm` (about 9 MB gzip), 44 KB pck |
| Headless load in Chromium/SwiftShader | loads; screenshot in `tests/smoke/out`        |

The wasm is the engine itself and does not grow with the game; the Phaser build was 2.5 MB. This
is the single biggest risk for a phone on cellular and is the first thing to measure on a device.

## Alternatives considered

- **Stay on Phaser + three.js, render the world live in three.js.** Lowest risk, keeps 2.5 MB,
  and the studio already renders the boat. Loses an editor, physics, and native exports. This is
  the fallback if the go/no-go fails.
- **Unity.** Web export is heavier still (WebGL 2, 20–40 MB), licensing is a moving target.
- **Babylon.js / PlayCanvas.** Web-native 3D with an editor (PlayCanvas), lighter than Godot on
  the web, but no native mobile path and less of a physics story.

## Risks

1. Download size on cellular (see above). Mitigation: brotli at the edge, a loading screen that
   teaches, PWA caching.
2. iOS Safari memory: a 38 MB wasm compiles to a lot of memory; Safari may reload the tab.
3. Audio without threads: fine for ambience and strokes; the generative EDM soundtrack would need
   to be rebuilt with Godot's audio generator, which is costlier on the main thread.
4. Content porting is mechanical (JSON out of the JS modules), but Help markdown, the field guide
   and the save migration need a Godot UI.

## Sources

- Godot docs: Exporting for the Web (threads, COOP/COEP, Safari notes); Compatibility renderer.
- Gerstner waves: Tessendorf, "Simulating Ocean Water" (2001) — the standard reference.
