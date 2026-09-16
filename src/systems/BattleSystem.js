export function calculateDamage(attack, multiplier=1, variance=0.1) {
  return Math.max(1, Math.round(attack * multiplier * (1 - variance + Math.random()*variance*2)));
}
