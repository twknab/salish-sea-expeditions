import Phaser from 'phaser';
import { text, button, fadeIn } from '../ui/widgets.js';
import { layout } from '../ui/theme.js';
import { go } from '../state.js';

export class Acknowledgment extends Phaser.Scene {
  constructor() { super('Acknowledgment'); }
  create() {
    fadeIn(this);
    text(this, layout.W / 2, layout.H / 2 - 40, 'Acknowledgment', 24, { serif: true, origin: [0.5, 0.5] });
    button(this, layout.W / 2, layout.H / 2 + 30, 'Back to title', () => go(this, 'Title'));
  }
}
