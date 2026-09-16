const clamp01 = value => Math.max(0, Math.min(1, value));

export class CombatFeedback {
  constructor(game) {
    this.game = game;
    this.camera = game?.camera || null;
    this.message = game?.ui?.message || null;
    this.busyUntil = 0;
    this.messageTimer = 0;
    this.active = null;
    this.baseCameraX = this.camera?.position?.x ?? 0;
  }

  startTurn(duration = 520) {
    const now = performance.now();
    if (now < this.busyUntil) return false;
    this.busyUntil = now + duration;
    return true;
  }

  show(text, duration = 520) {
    if (!this.message) return;
    this.message.textContent = text;
    this.message.style.opacity = '1';
    clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => {
      this.message.style.opacity = '0';
    }, duration);
  }

  hit({ critical = false } = {}) {
    this.active = {
      elapsed: 0,
      duration: critical ? 220 : 170,
      strength: critical ? 0.16 : 0.085,
      frequency: critical ? 0.16 : 0.2
    };
    this.show(critical ? 'CRITICAL HIT!' : 'HIT!', 500);
  }

  damage(value, { critical = false } = {}) {
    this.show(critical ? `CRITICAL −${value}` : `−${value}`, 650);
  }

  update(delta) {
    if (!this.active || !this.camera) return;
    this.active.elapsed += delta * 1000;
    const phase = clamp01(this.active.elapsed / this.active.duration);
    const decay = 1 - phase;
    this.camera.position.x = this.baseCameraX + Math.sin(this.active.elapsed * this.active.frequency * Math.PI) * this.active.strength * decay;
    if (phase >= 1) {
      this.camera.position.x = this.baseCameraX;
      this.active = null;
    }
  }

  dispose() {
    clearTimeout(this.messageTimer);
    this.messageTimer = 0;
    if (this.camera) this.camera.position.x = this.baseCameraX;
    this.active = null;
    this.busyUntil = 0;
  }
}
