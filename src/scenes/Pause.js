// The pause menu, over whichever scene was paused. Progress is already saved by the time it opens
// (ui/pause.js); from here you can resume, mute, turn the music off, or go home and continue later.
import Phaser from 'phaser';
import { focusRing } from '../ui/focus.js';
import { text, button, glass } from '../ui/widgets.js';
import { CSS, layout, px } from '../ui/theme.js';
import { state, persist } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class Pause extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) { this.from = data?.from; }

  create() {
    const W = layout.W, H = layout.H;
    sound.duck(true);
    const shade = this.add.rectangle(0, 0, px(W), px(H), 0x06202a, 0.84).setOrigin(0).setInteractive();
    shade.on('pointerup', () => {}); // swallow taps so nothing underneath reacts
    const pw = Math.min(W - 40, 340), ph = 344, x0 = (W - pw) / 2, y0 = Math.max(layout.safe.top + 40, (H - ph) / 2);
    glass(this, x0, y0, pw, ph, { alpha: 0.97, radius: 24 });
    text(this, W / 2, y0 + 22, 'Paused', 28, { serif: true, weight: '600', origin: [0.5, 0] });
    const t = state.save.trip;
    const saved = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    text(this, W / 2, y0 + 62, t ? `Trip saved at ${saved} — safe to put the phone away.` : `Saved at ${saved}.`, 12.5, { color: CSS.fog, origin: [0.5, 0], align: 'center', wrap: pw - 40 });

    const s = state.save.settings;
    let y = y0 + 124;
    button(this, W / 2, y, 'Resume', () => this.resumeGame(), { w: pw - 48 });
    y += 62;
    const soundLabel = () => `Sound: ${s.muted ? 'off' : 'on'}`;
    const sb = button(this, W / 2, y, soundLabel(), () => {
      s.muted = !s.muted; sound.unlock(); sound.mute(s.muted); persist(); sb.label.setText(soundLabel());
    }, { primary: false, w: pw - 48, h: 46, size: 14 });
    y += 56;
    const musicLabel = () => `Music: ${s.soundtrack !== false ? 'on' : 'off'}`;
    const mb = button(this, W / 2, y, musicLabel(), () => {
      s.soundtrack = s.soundtrack === false; sound.unlock(); sound.soundtrack(s.soundtrack); persist(); mb.label.setText(musicLabel());
    }, { primary: false, w: pw - 48, h: 46, size: 14 });
    y += 56;
    button(this, W / 2, y, t ? 'Save & go home' : 'Home', () => this.home(), { primary: false, w: pw - 48, h: 46, size: 14 });
    text(this, W / 2, y0 + ph - 22, 'P or Esc to resume', 11, { color: CSS.mist, origin: [0.5, 0.5] }).setVisible(!!this.input.keyboard && !this.sys.game.device.input.touch);

    this.onBack = () => this.resumeGame();
    focusRing(this);
    this.input.keyboard?.on('keydown', (e) => { if ((e.key === 'p' || e.key === 'P') && !e.repeat) this.resumeGame(); });
  }

  resumeGame() {
    if (this.leaving) return;
    this.leaving = true;
    sound.duck(false);
    this.scene.stop();
    if (this.from) this.scene.resume(this.from, { fromPause: true });
  }

  home() {
    if (this.leaving) return;
    this.leaving = true;
    sound.duck(false);
    persist();
    // Stop everything under the menu (a rescue sits over a paused paddle), then go home.
    for (const sc of this.scene.manager.getScenes(false)) {
      if (sc.scene.key !== 'Pause' && sc.scene.key !== 'Title' && (sc.sys.isActive() || sc.sys.isPaused())) sc.scene.stop();
    }
    this.scene.start('Title');
  }

  update(_t, dms) { sound.update(dms / 1000); }
}
