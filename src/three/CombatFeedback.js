const clamp01 = value => Math.max(0, Math.min(1, value));

export class CombatFeedback {
  constructor(game) {
    this.game = game;
    this.camera = game?.camera || null;
    this.root = game?.ui?.battle || null;
    this.message = game?.ui?.message || null;
    this.active = null;
    this.busyUntil = 0;
    this.baseCameraPosition = this.camera?.position?.clone() || null;
  }

  startTurn() {
    const now = performance.now();
    if (now < this.busyUntil) return false;
    this.busyUntil = now + 520;
    return true;
  }

  hit({ critical = false } = {}) {
    this.active = {
      elapsed: 0,
      duration: 180,
      strength: critical ? 0.12 : 0.07
    };
    if (this.message) {
      this.message.textContent = critical ? 'CRITICAL HIT!' : 'HIT!';
      this.message.style.opacity = '1';
    }
  }

  damage(value, { critical = false } = {}) {
    if (this.message) {
      this.message.textContent = critical ? `CRITICAL −${value}` : `−${value}`;
      this.message.style.opacity = '1';
    }
  }

  update(delta) {
    if (!this.active || !this.camera) return;
    this.active.elapsed += delta * 1000;
    const phase = clamp01(this.active.elapsed / this.active.duration);
    const decay = 1 - phase;
    this.camera.position.x += Math.sin(this.active.elapsed * 0.14) * this.active.strength * decay;
    if (phase >= 1) this.active = null;
  }

  dispose() {
    if (this.camera && this.baseCameraPosition) this.camera.position.copy(this.baseCameraPosition);
    this.active = null;
  }
}
