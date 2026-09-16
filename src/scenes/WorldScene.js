import Phaser from 'phaser';
import Creature from '../entities/Creature.js';
import { CREATURES } from '../data/creatures.js';
import { loadSave, saveGame } from '../systems/SaveSystem.js';
import { createHUD } from '../ui/HUD.js';

export default class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    this.save = loadSave();
    this.drawWorld();
    this.hud = createHUD(this, this.save);
    this.player = new Creature(this, 360, 980, CREATURES[this.save.creature], 1.05);
    this.player.root.setDepth(20);

    this.wild = new Creature(this, 505, 505, CREATURES.mossli, 0.82);
    this.wild.root.setDepth(18);
    this.add.text(505, 455, 'WILD', { fontSize:'16px', color:'#d9ffe3', fontStyle:'bold' }).setOrigin(0.5).setDepth(19);

    this.pointerTarget = new Phaser.Math.Vector2(360, 980);
    this.input.on('pointerdown', p => {
      if (p.y < 160) return;
      this.pointerTarget.set(p.x, p.y);
    });
    this.input.on('pointermove', p => {
      if (p.isDown && p.y >= 160) this.pointerTarget.set(p.x, p.y);
    });

    this.info = this.add.text(360, 1190, 'Tap the meadow to move • Approach the wild creature', {
      fontSize:'20px', color:'#d7eff7', align:'center', backgroundColor:'#071522cc', padding:{x:18,y:10}
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.cameras.main.setBounds(0, 0, 720, 1280);
    this.cameras.main.startFollow(this.player.root, true, 0.08, 0.08);
  }

  drawWorld() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b2030, 0x0b2030, 0x123b2e, 0x123b2e, 1);
    g.fillRect(0,0,720,1280);
    g.fillStyle(0x1a503c, 1); g.fillRoundedRect(70,180,580,920,70);
    g.fillStyle(0x2c7350, 0.8); g.fillRoundedRect(145,245,430,790,55);
    g.fillStyle(0x5bb0d8, 0.72); g.fillEllipse(360,690,180,920);
    g.fillStyle(0x7bd4ee, 0.18); g.fillEllipse(345,690,120,860);

    for (let i=0;i<22;i++) {
      const x = 95 + ((i*137)%530);
      const y = 205 + ((i*211)%850);
      if (Math.abs(x-360)<100 && y>300 && y<1000) continue;
      this.drawTree(x,y,0.8 + (i%3)*0.1);
    }
    for (let i=0;i<12;i++) this.drawRock(105 + ((i*191)%510), 260 + ((i*127)%760));

    this.drawShrine(360, 330);
    this.add.text(360, 270, 'AURA SHRINE', { fontSize:'18px', fontStyle:'bold', color:'#dffaff' }).setOrigin(0.5).setDepth(5);
  }

  drawTree(x,y,s) {
    const g=this.add.graphics();
    g.fillStyle(0x573b29,1); g.fillRoundedRect(x-8*s,y,16*s,45*s,8*s);
    g.fillStyle(0x2b8b52,1); g.fillCircle(x,y-12*s,35*s); g.fillStyle(0x47b86d,1); g.fillCircle(x-15*s,y-27*s,22*s); g.fillCircle(x+18*s,y-22*s,24*s);
  }
  drawRock(x,y) {
    const g=this.add.graphics(); g.fillStyle(0x506b72,1); g.fillEllipse(x,y,48,30); g.fillStyle(0x718c91,0.6); g.fillEllipse(x-8,y-5,20,10);
  }
  drawShrine(x,y) {
    const g=this.add.graphics();
    g.fillStyle(0x163a4d,1); g.fillTriangle(x-42,y+40,x,y-28,x+42,y+40);
    g.fillStyle(0x79e7ff,0.8); g.fillCircle(x,y+5,20); g.lineStyle(5,0xb8f5ff,0.65); g.strokeCircle(x,y+5,34);
    this.tweens.add({targets:g, alpha:0.45, duration:900, yoyo:true, repeat:-1});
  }

  update() {
    const p=this.player.root;
    const d=Phaser.Math.Distance.Between(p.x,p.y,this.pointerTarget.x,this.pointerTarget.y);
    if (d>12) {
      const angle=Phaser.Math.Angle.Between(p.x,p.y,this.pointerTarget.x,this.pointerTarget.y);
      p.x += Math.cos(angle)*3.2;
      p.y += Math.sin(angle)*3.2;
    }
    p.x=Phaser.Math.Clamp(p.x,100,620); p.y=Phaser.Math.Clamp(p.y,210,1070);
    const wild=this.wild.root;
    if (Phaser.Math.Distance.Between(p.x,p.y,wild.x,wild.y)<75 && !this.encountered) this.startEncounter();
  }

  startEncounter() {
    this.encountered=true;
    this.player.pulse();
    this.cameras.main.flash(250,120,230,255);
    this.time.delayedCall(280,()=>this.scene.start('BattleScene',{ player:this.save.creature, enemy:'mossli', save:this.save }));
  }
}
