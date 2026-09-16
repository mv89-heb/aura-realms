import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import WorldScene from './scenes/WorldScene.js';
import BattleScene from './scenes/BattleScene.js';

new Phaser.Game({
  ...gameConfig,
  scene: [BootScene, WorldScene, BattleScene]
});
