const DEFAULT_CLIPS = Object.freeze({
  idle: ['Idle', 'idle', 'IDLE'],
  walk: ['Walk', 'walk', 'WALK'],
  attack: ['Attack', 'attack', 'ATTACK'],
  hit: ['Hit', 'hit', 'HIT'],
  defeat: ['Defeat', 'defeat', 'DEATH', 'Death'],
  victory: ['Victory', 'victory', 'WIN', 'Win']
});

const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms));

/**
 * Battle animation orchestration for optional GLB creatures.
 * Missing clips are treated as a normal fallback so procedural creatures
 * and incomplete GLBs never break the battle flow.
 */
export class CreatureBattleAnimator {
  constructor(runtime, { clips = DEFAULT_CLIPS } = {}) {
    this.runtime = runtime;
    this.clips = clips;
    this.current = new Map();
  }

  resolveClip(id, state) {
    const candidates = this.clips[state] || [];
    const instance = this.runtime?.visuals?.instances?.get(id);
    if (!instance) return null;
    for (const name of candidates) {
      if (instance.actions.has(name)) return name;
    }
    return null;
  }

  play(id, state, options = {}) {
    const clip = this.resolveClip(id, state);
    if (!clip) return false;
    const played = this.runtime.play(id, clip, options);
    if (played) this.current.set(id, state);
    return played;
  }

  stop(id, state = this.current.get(id)) {
    const clip = this.resolveClip(id, state);
    if (!clip) return false;
    this.runtime.visuals.stop(id, clip);
    return true;
  }

  async attack(id, { hitDelay = 260, recoveryDelay = 420 } = {}) {
    this.play(id, 'attack', { reset: true, fade: 0.06 });
    await sleep(hitDelay);
    await sleep(recoveryDelay);
    this.play(id, 'idle', { reset: true, fade: 0.1 });
  }

  async receiveHit(id, { hitDelay = 180, recoveryDelay = 360 } = {}) {
    this.play(id, 'hit', { reset: true, fade: 0.04 });
    await sleep(hitDelay + recoveryDelay);
    this.play(id, 'idle', { reset: true, fade: 0.1 });
  }

  async defeat(id, { duration = 900 } = {}) {
    this.play(id, 'defeat', { reset: true, fade: 0.05 });
    await sleep(duration);
  }

  async victory(id, { duration = 1000 } = {}) {
    this.play(id, 'victory', { reset: true, fade: 0.08 });
    await sleep(duration);
    this.play(id, 'idle', { reset: true, fade: 0.12 });
  }

  dispose() {
    this.current.clear();
  }
}
