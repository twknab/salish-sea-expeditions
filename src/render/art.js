// Illustrations: hand-authored SVGs in src/art, recoloured with the chosen kayak skin and
// rasterised by the browser at the size they will be shown (sharp on Retina).
import paddlerSide from '../art/paddler-side.svg?raw';
import paddle from '../art/paddle.svg?raw';
import kayakSide from '../art/kayak-side.svg?raw';
import { skinById, DEFAULT_SKIN } from '../content/skins.js';

export const ART = {
  // `view` crops the drawing to the part that matters on a phone screen.
  paddlerSide: { svg: paddlerSide, w: 640, h: 440, view: [150, 40, 640, 440] },
  paddle: { svg: paddle, w: 1000, h: 230, view: [0, 80, 1000, 230] },
  kayakSide: { svg: kayakSide, w: 1000, h: 150, view: [0, 105, 1000, 150] },
};

function recolour(svg, skinId) {
  const s = skinById[skinId] ?? skinById[DEFAULT_SKIN];
  return svg.replaceAll('{{DECK_HI}}', s.deckHi).replaceAll('{{DECK_LO}}', s.deckLo)
    .replaceAll('{{DECK}}', s.deck).replaceAll('{{ACCENT}}', s.accent);
}

/**
 * Rasterise an illustration into a texture of `widthPx` device pixels and resolve with its key.
 * Keys include the skin and size, so a change of skin produces a new texture.
 */
export function loadArt(scene, name, skinId, widthPx) {
  const a = ART[name];
  const w = Math.round(widthPx), h = Math.round((widthPx * a.h) / a.w);
  const key = `art-${name}-${skinId}-${w}`;
  if (scene.textures.exists(key)) return Promise.resolve(key);
  let svg = recolour(a.svg, skinId).replace('<svg ', `<svg preserveAspectRatio="xMidYMid meet" `)
    .replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);
  if (a.view) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${a.view.join(' ')}"`);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { if (!scene.textures.exists(key)) scene.textures.addImage(key, img); resolve(key); };
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
