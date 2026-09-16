export class CombatFeedback {
  constructor(game) {
    this.game = game;
    this.message = game?.ui?.message || null;
    this.busyUntil = 0;
    this.messageTimer = 0;
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

  damage(value, { critical = false } = {}) {
    this.show(critical ? `CRITICAL −${value}` : `−${value}`);
  }

  dispose() {
    clearTimeout(this.messageTimer);
    this.messageTimer = 0;
    this.busyUntil = 0;
  }
}
