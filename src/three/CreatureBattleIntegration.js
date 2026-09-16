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

  playAll(id, state) {
    this.animator?.play(id, state, { reset: true, fade: 0.06 });
    this.proceduralAnimator?.play(id, state);
  }

  attach() {
    if (this.attached || !this.game || !this.animator) return this;

    this.originalOpenBattle = this.game.openBattle.bind(this.game);
    this.game.openBattle = wild => {
      this.originalOpenBattle(wild);
      if (this.game.battle) {
        this.game.battle.animationIds = {
          player: CreatureBattleIntegration.playerId(this.game),
          enemy: CreatureBattleIntegration.wildId(wild)
        };
      }
    };

    this.originalBattleTurn = this.game.battleTurn.bind(this.game);
    this.game.battleTurn = multiplier => {
      const battle = this.game.battle;
      if (!battle || battle.ending) return;
      if (this.feedback && !this.feedback.startTurn()) return;

      const ids = battle.animationIds || {
        player: CreatureBattleIntegration.playerId(this.game),
        enemy: CreatureBattleIntegration.wildId(battle.wild)
      };
      const enemyHpBefore = battle.enemy.currentHp;
      const playerHpBefore = battle.playerHp;

      this.playAll(ids.player, 'attack');
      this.originalBattleTurn(multiplier);

      if (this.game.battle) {
        if (this.game.battle.enemy.currentHp < enemyHpBefore) {
          this.playAll(ids.enemy, 'hit');
          this.feedback?.damage(enemyHpBefore - this.game.battle.enemy.currentHp);
        }
        if (this.game.battle.playerHp < playerHpBefore) {
          this.playAll(ids.player, 'hit');
          this.feedback?.damage(playerHpBefore - this.game.battle.playerHp);
        }
      } else {
        this.playAll(ids.player, 'hit');
        this.feedback?.show('Your creature needs rest.', 900);
      }
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
        this.feedback?.show('VICTORY!', 1100);
        clearTimeout(this.victoryTimer);
        this.victoryTimer = window.setTimeout(() => {
          this.victoryTimer = 0;
          if (this.game.battle === battle) this.originalCloseBattle(true);
        }, 900);
        return;
      }
      return this.originalCloseBattle(victory);
    };

    this.attached = true;
    return this;
  }

  dispose() {
    if (!this.attached) return;
    clearTimeout(this.victoryTimer);
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
