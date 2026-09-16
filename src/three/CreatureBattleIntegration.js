const wait = (fn, delay) => window.setTimeout(fn, delay);

export class CreatureBattleIntegration {
  constructor(game, animator, proceduralAnimator = null, feedback = null) {
    this.game = game;
    this.animator = animator;
    this.proceduralAnimator = proceduralAnimator;
    this.feedback = feedback;
    this.originalBattleTurn = null;
    this.originalOpenBattle = null;
    this.originalCloseBattle = null;
    this.victoryTimer = 0;
    this.pendingTimers = new Set();
    this.attached = false;
  }

  static playerId(game) {
    const id = game?.playerData?.id || game?.save?.creature || 'player';
    return `player:${id}`;
  }

  static wildId(wild) {
    const id = wild?.userData?.data?.id || wild?.userData?.data?.name || 'wild';
    return `wild:${id}`;
  }

  schedule(fn, delay) {
    const timer = wait(() => {
      this.pendingTimers.delete(timer);
      fn();
    }, delay);
    this.pendingTimers.add(timer);
    return timer;
  }

  clearPendingTimers() {
    for (const timer of this.pendingTimers) window.clearTimeout(timer);
    this.pendingTimers.clear();
  }

  playAll(id, state) {
    this.animator?.play(id, state, { reset: true, fade: 0.06 });
    this.proceduralAnimator?.play(id, state);
  }

  attach() {
    if (this.attached || !this.game || !this.animator) return this;

    this.originalOpenBattle = this.game.openBattle.bind(this.game);
    this.game.openBattle = wild => {
      this.clearPendingTimers();
      this.originalOpenBattle(wild);
      if (this.game.battle) {
        this.game.battle.animationIds = {
          player: CreatureBattleIntegration.playerId(this.game),
          enemy: CreatureBattleIntegration.wildId(wild)
        };
        this.feedback?.syncBattleUI();
        this.feedback?.setTurn('YOUR TURN', true);
      }
    };

    this.originalBattleTurn = this.game.battleTurn.bind(this.game);
    this.game.battleTurn = multiplier => {
      const battle = this.game.battle;
      if (!battle || battle.ending) return;
      if (this.feedback && !this.feedback.startTurn(720)) return;

      this.clearPendingTimers();

      const ids = battle.animationIds || {
        player: CreatureBattleIntegration.playerId(this.game),
        enemy: CreatureBattleIntegration.wildId(battle.wild)
      };
      const enemyHpBefore = battle.enemy.currentHp;
      const playerHpBefore = battle.playerHp;
      const burst = multiplier > 1.2;
      const attackState = burst ? 'burst' : 'attack';

      this.feedback?.setTurn(burst ? 'AURA BURST' : 'STRIKE', false);
      this.playAll(ids.player, attackState);

      // Keep damage and turn rules exactly as implemented by BattleSystem.
      this.originalBattleTurn(multiplier);

      const activeBattle = this.game.battle;
      if (!activeBattle) {
        this.schedule(() => {
          this.playAll(ids.player, 'hit');
          this.feedback?.show('Your creature needs rest.', 900);
        }, 260);
        return;
      }

      const enemyDamage = Math.max(0, enemyHpBefore - activeBattle.enemy.currentHp);
      const playerDamage = Math.max(0, playerHpBefore - activeBattle.playerHp);
      const battleEnded = activeBattle.ending || activeBattle.enemy.currentHp <= 0;

      if (enemyDamage > 0) {
        this.schedule(() => {
          this.playAll(ids.enemy, 'hit');
          this.feedback?.hit({ critical: false, burst });
          this.feedback?.damage(enemyDamage, { critical: false, burst });
        }, 220);
      }

      if (playerDamage > 0 && !battleEnded) {
        this.schedule(() => {
          if (this.game.battle !== activeBattle) return;
          this.playAll(ids.player, 'hit');
          this.feedback?.hit({ critical: false });
          this.feedback?.damage(playerDamage);
        }, 430);
      }

      this.schedule(() => {
        if (this.game.battle !== activeBattle || activeBattle.ending) return;
        this.feedback?.syncBattleUI();
        this.feedback?.setTurn('YOUR TURN', true);
      }, 500);
    };

    this.originalCloseBattle = this.game.closeBattle.bind(this.game);
    this.game.closeBattle = victory => {
      const battle = this.game.battle;
      if (victory && battle) {
        if (battle.ending) return;
        battle.ending = true;
        const ids = battle.animationIds || {
          player: CreatureBattleIntegration.playerId(this.game),
          enemy: CreatureBattleIntegration.wildId(battle.wild)
        };
        this.playAll(ids.enemy, 'defeat');
        this.playAll(ids.player, 'victory');
        this.feedback?.setTurn('VICTORY', false);
        this.feedback?.syncBattleUI();
        this.feedback?.show('VICTORY!', 1100);
        window.clearTimeout(this.victoryTimer);
        this.victoryTimer = this.schedule(() => {
          this.victoryTimer = 0;
          if (this.game.battle === battle) this.originalCloseBattle(true);
        }, 900);
        return;
      }
      this.feedback?.setTurn('BATTLE ENDED', false);
      return this.originalCloseBattle(victory);
    };

    this.attached = true;
    return this;
  }

  dispose() {
    if (!this.attached) return;
    this.clearPendingTimers();
    window.clearTimeout(this.victoryTimer);
    this.victoryTimer = 0;
    this.game.openBattle = this.originalOpenBattle;
    this.game.battleTurn = this.originalBattleTurn;
    this.game.closeBattle = this.originalCloseBattle;
    this.originalOpenBattle = null;
    this.originalBattleTurn = null;
    this.originalCloseBattle = null;
    this.feedback?.dispose();
    this.attached = false;
  }
}
