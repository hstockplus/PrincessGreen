import Phaser from 'phaser';
import { registerGameAssets, preloadGameAssets } from '../art/AssetRegistry.js';
import { startAmbientMusic } from '../systems/SimpleSFX.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    preloadGameAssets(this);
  }

  create() {
    registerGameAssets(this);
    startAmbientMusic();
    this.scene.start('MenuScene');
  }
}
