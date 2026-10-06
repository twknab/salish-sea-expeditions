// The studio: an offscreen three.js renderer that photographs our 3D models into sprites.
// Physically based materials under a sun, a sky and an environment map, with soft shadows caught
// on a transparent water plane that also hides whatever is below the surface. Renders happen once
// and become Phaser textures; nothing here runs per frame.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

let studio = null;

/** Lazily create the renderer. Returns null where WebGL is unavailable (callers fall back). */
export function getStudio() {
  if (studio !== null) return studio || null;
  try {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft is gone in r18x; radius softens PCF
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    // Sky above, sea below: the light a boat on the Salish Sea actually sits in.
    scene.add(new THREE.HemisphereLight(0xcfe3ee, 0x1b4d55, 0.9));
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
    sun.position.set(-3, 9, -4); // high, from aft and to port, so forms model and shadows stay short
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
    const sc = sun.shadow.camera;
    sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 0.5; sc.far = 30;
    scene.add(sun);
    scene.add(sun.target);

    // The sea surface: draws only shadows, but still hides what is under it.
    const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.32 }));
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;
    scene.add(water);
    // Transparent materials draw after opaque ones, so the shadow plane cannot hide anything.
    // A depth-only plane drawn first does: what is under the surface stays under it.
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ colorWrite: false }));
    surface.rotation.x = -Math.PI / 2;
    surface.renderOrder = -10;
    water.add(surface); // follows the water plane's visibility
    surface.rotation.x = 0;

    studio = { THREE, renderer, scene, sun, water };
  } catch {
    studio = false;
  }
  return studio || null;
}

/**
 * Photograph `object` from straight above (or `tilt` radians off vertical, toward +z) into a new
 * canvas of `w × h` pixels covering `spanX × spanZ` metres around (`cx`, `cz`). In the image the
 * model's +x points up. `water: false` removes the sea plane (e.g. for side views).
 */
export function capture(object, { w, h, spanX, spanZ, cx = 0, cz = 0, tilt = 0, water = true, view = 'top', az = 0.7, el = 0.3, fitMargin }) {
  const st = getStudio();
  if (!st) return null;
  const { renderer, scene } = st;
  scene.add(object);
  st.water.visible = water;
  let cam;
  if (view === 'orbit') {
    // A three-quarter portrait: fitted to the model's bounding sphere, from azimuth `az` and
    // elevation `el` (radians), with a little margin. Ignores the span arguments.
    const box = new THREE.Box3().setFromObject(object), sphere = box.getBoundingSphere(new THREE.Sphere());
    const r = sphere.radius * (fitMargin ?? 1.06), c = sphere.center, aspect = w / h;
    cam = new THREE.OrthographicCamera(-r * aspect, r * aspect, r, -r, 0.01, r * 20);
    const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    cam.position.copy(c).addScaledVector(dir, r * 6);
    cam.up.set(0, 1, 0);
    cam.lookAt(c);
    spanX = spanZ = r * 2; cx = c.x; cz = c.z;
  } else if (view === 'top') {
    // Orthographic, looking down; screen-up is +x (the bow), screen-right is +z (starboard).
    cam = new THREE.OrthographicCamera(-spanZ / 2, spanZ / 2, spanX / 2, -spanX / 2, 0.1, 60);
    const d = 20;
    cam.position.set(cx, d * Math.cos(tilt), cz + d * Math.sin(tilt));
    cam.up.set(1, 0, 0);
    cam.lookAt(cx, 0, cz);
  } else {
    // Side view from port, so the bow (+x) faces left as in every other side view in the game.
    cam = new THREE.OrthographicCamera(-spanX / 2, spanX / 2, spanZ / 2, -spanZ / 2, 0.1, 60);
    cam.position.set(cx, cz, -20);
    cam.up.set(0, 1, 0);
    cam.lookAt(cx, cz, 0);
  }
  // Fit the sun's shadow box to what is being photographed, from a 1.6 m seal to a 110 m ferry.
  const R = Math.max(spanX, spanZ) * 0.75;
  const sun = st.sun, scam = sun.shadow.camera;
  const tz = view === 'side' ? 0 : cz;
  if (view === 'orbit') {
    // Key light up and to one side of the camera, so a portrait is modelled, never backlit.
    const ty = object.userData.centreY ?? 0;
    sun.target.position.set(cx, ty, tz);
    sun.position.set(cx + Math.sin(az + 0.8) * R * 2.2, ty + R * 3, tz + Math.cos(az + 0.8) * R * 2.2);
  } else {
    sun.target.position.set(cx, 0, tz);
    sun.position.set(cx - 0.33 * R * 3, R * 3, tz - 0.44 * R * 3);
  }
  scam.left = -R; scam.right = R; scam.top = R; scam.bottom = -R; scam.near = R * 0.1; scam.far = R * 8;
  scam.updateProjectionMatrix();
  sun.target.updateMatrixWorld();
  renderer.setSize(w, h, false);
  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d').drawImage(renderer.domElement, 0, 0);
  scene.remove(object);
  st.water.visible = true;
  out.camera = cam;
  return out;
}

/** Dispose a model's geometries, materials and textures after it has been photographed. */
export function dispose(object) {
  object.traverse((o) => {
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) { for (const k of ['map', 'roughnessMap', 'normalMap', 'bumpMap']) m[k]?.dispose?.(); m.dispose?.(); }
  });
}
