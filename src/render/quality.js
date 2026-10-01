// Quality governor (Principle VII): watch the real frame rate and step the shaders' detail down
// rather than let the picture judder. Steps down fast, recovers slowly.

export class Quality {
  constructor(game) {
    this.game = game;
    this.q = 1;
    this.t = 0;
    this.low = 0;
    this.high = 0;
  }

  /** Call every frame with dt in seconds; returns the current quality 0..1. */
  update(dt) {
    this.t += dt;
    if (this.t < 2) return this.q; // let the first frames settle
    const fps = this.game.loop.actualFps;
    if (fps < 45) { this.low += dt; this.high = 0; } else if (fps > 57) { this.high += dt; this.low = 0; }
    if (this.low > 1.5 && this.q > 0) { this.q = Math.max(0, this.q - 0.5); this.low = 0; }
    if (this.high > 8 && this.q < 1) { this.q = Math.min(1, this.q + 0.5); this.high = 0; }
    return this.q;
  }
}
