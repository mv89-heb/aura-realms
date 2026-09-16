export function addXp(save, amount) {
  save.xp += amount;
  const need = save.level * 100;
  while (save.xp >= need) { save.xp -= need; save.level += 1; }
  return save;
}
