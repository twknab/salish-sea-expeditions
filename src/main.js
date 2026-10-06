import Phaser from 'phaser';
import { setLayout } from './ui/theme.js';
import { Boot } from './scenes/Boot.js';
import { Title } from './scenes/Title.js';
import { Acknowledgment } from './scenes/Acknowledgment.js';
import { StartChoice } from './scenes/StartChoice.js';
import { Outfit } from './scenes/Outfit.js';
import { Ferry } from './scenes/Ferry.js';
import { BoatSchool } from './scenes/BoatSchool.js';
import { Assembly } from './scenes/Assembly.js';
import { Packing } from './scenes/Packing.js';
import { Planning } from './scenes/Planning.js';
import { Paddle } from './scenes/Paddle.js';
import { Rescue } from './scenes/Rescue.js';
import { Camp } from './scenes/Camp.js';
import { TidePools } from './scenes/TidePools.js';
import { Debrief } from './scenes/Debrief.js';
import { FieldGuide } from './scenes/FieldGuide.js';
import { Credits } from './scenes/Credits.js';
import { About } from './scenes/About.js';
import { Pause } from './scenes/Pause.js';
import { pauseRunning } from './ui/pause.js';

// Render at device resolution (capped at 2x: sharp on Retina, affordable for the water shader).
const DPR = Math.min(2, window.devicePixelRatio || 1);

function viewport() {
  const w = window.innerWidth, h = window.innerHeight;
  // Phones held sideways still get a portrait game (the page asks them to rotate).
  const portraitW = Math.min(w, h * 0.62);
  return { w: Math.round(portraitW), h: Math.round(h) };
}

function safeInsets() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const r = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  probe.remove();
  return r;
}

const vp = viewport();
const insets = safeInsets();
setLayout({ S: DPR, W: vp.w, H: vp.h, top: Math.max(insets.top, 12), bottom: Math.max(insets.bottom, 10) });

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'app',
  width: vp.w * DPR,
  height: vp.h * DPR,
  backgroundColor: '#0b2b33',
  antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, zoom: 1 / DPR },
  input: { activePointers: 4 },
  // Mipmaps keep the baked 3D sprites crisp when small and steady while they turn.
  render: { powerPreference: 'high-performance', autoMobileTextures: true, mipmapFilter: 'LINEAR_MIPMAP_LINEAR', maxTextures: 1 },
  scene: [Boot, Title, Acknowledgment, StartChoice, Outfit, Ferry, BoatSchool, Assembly, Packing, Planning, Paddle, Rescue, Camp, TidePools, Debrief, FieldGuide, Credits, About, Pause],
});

document.getElementById('boot')?.remove();
window.__sse = game; // handy for the smoke test

// Into the pocket: the moment the page is hidden (lock, app switch, tab change), save and pause.
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRunning(game); });
window.addEventListener('pagehide', () => pauseRunning(game));

// Resize: keep the game matched to the viewport (rotation, address bar).
let t;
window.addEventListener('resize', () => {
  clearTimeout(t);
  t = setTimeout(() => {
    const v = viewport();
    setLayout({ S: DPR, W: v.w, H: v.h, top: Math.max(insets.top, 12), bottom: Math.max(insets.bottom, 10) });
    game.scale.resize(v.w * DPR, v.h * DPR);
    for (const s of game.scene.getScenes(true)) s.events.emit('relayout');
  }, 150);
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
