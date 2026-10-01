import Phaser from 'phaser';
import { ensureLandMask } from '../render/world.js';
import { state, newTrip } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    ensureLandMask(this);
    sound.setVolumes(state.save.settings);
    const params = new URLSearchParams(location.search);
    const jump = params.get('scene'); // dev/testing: ?scene=Paddle&mode=school
    if (jump) {
      if (!state.save.trip) {
        // A trip is needed for most scenes.
        newTrip('fridayHarbor');
        this.scene.start(jump, { mode: params.get('mode') ?? undefined });
        return;
      }
      this.scene.start(jump, { mode: params.get('mode') ?? undefined });
      return;
    }
    this.scene.start('Title');
  }
}
