import Phaser from 'phaser';
import { registerGameAssets } from '../art/AssetRegistry.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    registerGameAssets(this);
    this.scene.start('MenuScene');
  }
}
