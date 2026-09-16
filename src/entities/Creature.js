export default class Creature {
  constructor(scene, x, y, data, scale = 1) {
    this.scene = scene;
    this.data = data;
    this.root = scene.add.container(x, y);
    this.root.setDepth(10);
    this.scale = scale;
    this.draw();
  }

  draw() {
    const g = this.scene.add.graphics();
    g.fillStyle(0x06101c, 0.45);
    g.fillEllipse(0, 34 * this.scale, 70 * this.scale, 22 * this.scale);
    g.fillStyle(this.data.color, 1);
    g.fillCircle(0, 0, 34 * this.scale);
    g.fillStyle(this.data.accent, 0.35);
    g.fillCircle(-10 * this.scale, -10 * this.scale, 12 * this.scale);
    g.fillStyle(0x08111f, 1);
    g.fillCircle(-11 * this.scale, -3 * this.scale, 5 * this.scale);
    g.fillCircle(11 * this.scale, -3 * this.scale, 5 * this.scale);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-9 * this.scale, -5 * this.scale, 1.7 * this.scale);
    g.fillCircle(13 * this.scale, -5 * this.scale, 1.7 * this.scale);
    g.lineStyle(4 * this.scale, this.data.accent, 0.8);
    g.strokeCircle(0, 0, 41 * this.scale);
    this.root.add(g);
  }

  pulse() {
    this.scene.tweens.add({ targets:this.root, scale:1.08, duration:220, yoyo:true, ease:'Sine.easeInOut' });
  }

  destroy() { this.root.destroy(true); }
}
