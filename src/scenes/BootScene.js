import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#07111f');
    const title = this.add.text(360, 540, 'AURA REALMS', { fontSize:'56px', fontStyle:'bold', color:'#e9fbff' }).setOrigin(0.5);
    const sub = this.add.text(360, 610, 'A living world begins here', { fontSize:'24px', color:'#8fdfff' }).setOrigin(0.5);
    this.tweens.add({ targets:[title, sub], alpha:0, delay:900, duration:500, onComplete:() => this.scene.start('WorldScene') });
  }
}
