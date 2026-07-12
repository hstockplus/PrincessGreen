import Phaser from 'phaser';
import { registerGameAssets, preloadGameAssets } from '../art/AssetRegistry.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    preloadGameAssets(this);
  }

  create() {
    registerGameAssets(this);
    this.scene.start('MenuScene');
  }
}
