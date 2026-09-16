const clamp01 = value => Math.max(0, Math.min(1, value));

export class CombatFeedback {
  constructor(game) {
    this.game = game;
    this.camera = game?.camera || null;
    this.message = game?.ui?.message || null;
    this.battle = game?.ui?.battle || null;
    this.battleHp = game?.ui?.battleHp || null;
    this.busyUntil = 0;
    this.messageTimer = 0;
    this.active = null;
    this.baseCameraX = this.camera?.position?.x ?? 0;
    this.originalBattleHpStyle = this.battleHp?.getAttribute('style') || '';
    this.installHud();
  }

  installHud() {
    if (!this.battleHp || this.battleHp.dataset.enhanced === '1') return;
    this.battleHp.dataset.enhanced = '1';
    this.battleHp.style.display = 'grid';
    this.battleHp.style.gap = '8px';
    this.battleHp.style.marginBottom = '16px';
    this.battleHp.innerHTML = '';
    this.playerRow = this.createHpRow('YOU');
    this.enemyRow = this.createHpRow('WILD');
    this.battleHp.append(this.playerRow.root, this.enemyRow.root);

    this.turnBadge = document.createElement('div');
    this.turnBadge.style.cssText = 'position:absolute;top:-14px;right:16px;padding:6px 10px;border-radius:999px;background:#ffffff18;border:1px solid #ffffff2b;font-size:10px;font-weight:900;letter-spacing:.08em;opacity:.85;';
    this.turnBadge.textContent = 'READY';
    const panel = this.battleHp.parentElement;
    if (panel) {
      panel.style.position = 'relative';
      panel.appendChild(this.turnBadge);
    }
  }

  createHpRow(label) {
    const root = document.createElement('div');
    root.style.cssText = 'display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;font-size:11px;font-weight:800;';
    const name = document.createElement('span');
    name.textContent = label;
    name.style.opacity = '.72';
    const track = document.createElement('div');
    track.style.cssText = 'height:8px;border-radius:999px;background:#ffffff12;overflow:hidden;border:1px solid #ffffff18;';
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;width:100%;border-radius:999px;background:#7c5cff;transform-origin:left center;transition:transform .22s ease;';
    track.appendChild(fill);
    const value = document.createElement('span');
    value.style.cssText = 'min-width:54px;text-align:right;opacity:.82;';
    root.append(name, track, value);
    return { root, name, fill, value };
  }

  startTurn(duration = 620) {
    const now = performance.now();
    if (now < this.busyUntil) return false;
    this.busyUntil = now + duration;
    this.setTurn('YOUR TURN', true);
    return true;
  }

  setTurn(text, enabled) {
    if (this.turnBadge) this.turnBadge.textContent = text;
    const buttons = [this.game?.ui?.strike, this.game?.ui?.burst, this.game?.ui?.retreat].filter(Boolean);
    buttons.forEach(button => {
      button.disabled = !enabled;
      button.style.opacity = enabled ? '1' : '.5';
      button.style.pointerEvents = enabled ? 'auto' : 'none';
    });
  }

  syncBattleUI() {
    const battle = this.game?.battle;
    if (!battle) return;
    const playerMax = Math.max(1, this.game.playerData?.hp || battle.playerHp || 1);
    const enemyMax = Math.max(1, battle.enemy?.hp || battle.enemy?.currentHp || 1);
    this.setRow(this.playerRow, this.game.playerData?.name || 'YOU', battle.playerHp, playerMax);
    this.setRow(this.enemyRow, battle.enemy?.name || 'WILD', battle.enemy.currentHp, enemyMax);
  }

  setRow(row, label, hp, maxHp) {
    if (!row) return;
    const ratio = clamp01(hp / maxHp);
    row.name.textContent = label;
    row.fill.style.transform = `scaleX(${ratio})`;
    row.value.textContent = `${Math.max(0, hp)} / ${maxHp}`;
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

  hit({ critical = false, burst = false } = {}) {
    this.active = {
      elapsed: 0,
      duration: critical ? 240 : 170,
      strength: critical ? 0.18 : 0.085,
      frequency: critical ? 0.16 : 0.2
    };
    this.show(burst ? 'AURA BURST!' : critical ? 'CRITICAL HIT!' : 'HIT!', 500);
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
    if (this.battleHp) {
      this.battleHp.removeAttribute('data-enhanced');
      this.battleHp.setAttribute('style', this.originalBattleHpStyle);
    }
    this.setTurn('READY', true);
    this.active = null;
    this.busyUntil = 0;
  }
}
