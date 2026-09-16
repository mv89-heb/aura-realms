export function createHUD(scene, save) {
  const panel = scene.add.rectangle(360, 62, 650, 92, 0x081522, 0.86).setScrollFactor(0).setDepth(100);
  panel.setStrokeStyle(2, 0x58d6ff, 0.25);
  const title = scene.add.text(48, 30, 'AURA REALMS', { fontSize:'26px', fontStyle:'bold', color:'#e8fbff' }).setScrollFactor(0).setDepth(101);
  const stats = scene.add.text(48, 72, `LV ${save.level}   ✦ ${save.aura}   ◈ ${save.crystals}`, { fontSize:'20px', color:'#b9d7e6' }).setScrollFactor(0).setDepth(101);
  return { panel, title, stats, refresh(s) { stats.setText(`LV ${s.level}   ✦ ${s.aura}   ◈ ${s.crystals}`); } };
}
