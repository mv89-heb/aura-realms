export class CreatureBattleIntegration {
  constructor(game, animator) {
    this.game = game;
    this.animator = animator;
    this.originalBattleTurn = null;
    this.originalOpenBattle = null;
    this.originalCloseBattle = null;
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
      if (!battle) return;

      const ids = battle.animationIds || {
        player: CreatureBattleIntegration.playerId(this.game),
        enemy: CreatureBattleIntegration.wildId(battle.wild)
      };
      const enemyHpBefore = battle.enemy.currentHp;
      const playerHpBefore = battle.playerHp;

      void this.animator.attack(ids.player);
      this.originalBattleTurn(multiplier);

      if (this.game.battle) {
        if (this.game.battle.enemy.currentHp < enemyHpBefore) {
          void this.animator.receiveHit(ids.enemy);
        }
        if (this.game.battle.playerHp < playerHpBefore) {
          void this.animator.receiveHit(ids.player);
        }
      } else if (this.game.save.wins === (this.game.save.wins || 0)) {
        // The original battle flow already handled the outcome. A closed battle
        // without a win is the defeat/retreat path; victory animation is handled
        // by the closeBattle wrapper below.
        void this.animator.receiveHit(ids.player);
      }
    };

    this.originalCloseBattle = this.game.closeBattle.bind(this.game);
    this.game.closeBattle = victory => {
      const battle = this.game.battle;
      if (victory && battle) {
        const ids = battle.animationIds || {
          player: CreatureBattleIntegration.playerId(this.game),
          enemy: CreatureBattleIntegration.wildId(battle.wild)
        };
        void this.animator.defeat(ids.enemy);
        void this.animator.victory(ids.player);
      }
      return this.originalCloseBattle(victory);
    };

    this.attached = true;
    return this;
  }

  dispose() {
    if (!this.attached) return;
    this.game.openBattle = this.originalOpenBattle;
    this.game.battleTurn = this.originalBattleTurn;
    this.game.closeBattle = this.originalCloseBattle;
    this.originalOpenBattle = null;
    this.originalBattleTurn = null;
    this.originalCloseBattle = null;
    this.attached = false;
  }
}
