import Phaser from 'phaser';
import Creature from '../entities/Creature.js';
import { CREATURES } from '../data/creatures.js';
import { saveGame } from '../systems/SaveSystem.js';

export default class BattleScene extends Phaser.Scene {
  constructor(){ super('BattleScene'); }

  init(data){ this.playerId=data.player||'lumiko'; this.enemyId=data.enemy||'mossli'; this.save=data.save; }

  create(){
    this.drawArena();
    this.player=new Creature(this,190,610,CREATURES[this.playerId],1.35);
    this.enemy=new Creature(this,530,360,CREATURES[this.enemyId],1.45);
    this.playerHP=CREATURES[this.playerId].hp; this.enemyHP=CREATURES[this.enemyId].hp;
    this.playerMax=this.playerHP; this.enemyMax=this.enemyHP;
    this.add.text(70,90,CREATURES[this.playerId].name,{fontSize:'30px',fontStyle:'bold',color:'#eafcff'});
    this.add.text(650,90,CREATURES[this.enemyId].name,{fontSize:'30px',fontStyle:'bold',color:'#eafcff'}).setOrigin(1,0);
    this.pBar=this.makeBar(70,135,250); this.eBar=this.makeBar(400,135,250);
    this.status=this.add.text(360,760,'Choose an action',{fontSize:'24px',color:'#d9f7ff',align:'center'}).setOrigin(0.5);
    this.makeButton(160,930,'STRIKE',()=>this.attack(1));
    this.makeButton(360,930,'AURA BURST',()=>this.attack(1.35));
    this.makeButton(560,930,'RETREAT',()=>this.retreat());
  }

  drawArena(){
    const g=this.add.graphics();
    g.fillGradientStyle(0x081424,0x081424,0x1d1530,0x0d2630,1); g.fillRect(0,0,720,1280);
    g.fillStyle(0x1b2f42,1); g.fillEllipse(360,560,640,360);
    g.lineStyle(6,0x71dfff,0.22); g.strokeEllipse(360,560,640,360);
  }
  makeBar(x,y,w){ const bg=this.add.rectangle(x,y,w,24,0x16232d).setOrigin(0,0.5); const fill=this.add.rectangle(x,y,w,24,0x62e1a5).setOrigin(0,0.5); return {bg,fill,w}; }
  updateBar(bar,value,max){ bar.fill.width=bar.w*Math.max(0,value/max); }
  makeButton(x,y,label,fn){
    const b=this.add.rectangle(x,y,175,76,0x102638,0.96).setStrokeStyle(2,0x69dcff,0.45).setInteractive({useHandCursor:true});
    this.add.text(x,y,label,{fontSize:'19px',fontStyle:'bold',color:'#e9fbff'}).setOrigin(0.5);
    b.on('pointerdown',()=>{this.tweens.add({targets:b,scale:0.94,duration:70,yoyo:true});fn();});
  }
  attack(mult){
    if(this.busy) return; this.busy=true;
    const dmg=Math.round(CREATURES[this.playerId].attack*mult*(0.9+Math.random()*0.2));
    this.enemyHP=Math.max(0,this.enemyHP-dmg); this.updateBar(this.eBar,this.enemyHP,this.enemyMax);
    this.status.setText(`Hit for ${dmg}!`); this.enemy.pulse();
    this.time.delayedCall(550,()=>{
      if(this.enemyHP<=0){this.win();return;}
      const edmg=Math.round(CREATURES[this.enemyId].attack*(0.9+Math.random()*0.2));
      this.playerHP=Math.max(0,this.playerHP-edmg); this.updateBar(this.pBar,this.playerHP,this.playerMax); this.status.setText(`The wild creature hits for ${edmg}.`); this.player.pulse();
      this.time.delayedCall(500,()=>{if(this.playerHP<=0)this.lose();else this.busy=false;});
    });
  }
  win(){
    this.save.wins=(this.save.wins||0)+1; this.save.xp=(this.save.xp||0)+35; this.save.aura=(this.save.aura||0)+4; this.save.crystals=(this.save.crystals||0)+8; saveGame(this.save);
    this.status.setText('Victory! +35 XP  +4 Aura  +8 Crystals');
    this.time.delayedCall(1300,()=>this.scene.start('WorldScene'));
  }
  lose(){ this.status.setText('The creature escaped.'); this.time.delayedCall(1200,()=>this.scene.start('WorldScene')); }
  retreat(){ this.scene.start('WorldScene'); }
}
