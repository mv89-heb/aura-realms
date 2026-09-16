export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#07111f',
  render: { antialias: true, pixelArt: false, roundPixels: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  input: { activePointers: 3 }
};
