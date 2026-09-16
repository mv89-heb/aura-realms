const clamp01 = value => Math.max(0, Math.min(1, value));

/**
 * Lightweight animation fallback for the built-in procedural creatures.
 * Uses transforms only, so it adds no geometry, textures, shaders, or draw calls.
 */
export class ProceduralCreatureAnimator {
  constructor(game) {
    this.game = game;
    this.states = new Map();
  }

  resolve(id) {
    if (id?.startsWith('player:')) return this.game?.player || null;
    if (id?.startsWith('wild:')) {
      const wanted = id.slice(5);
      return this.game?.wild?.find(c => {
        const data = c?.userData?.data;
        return String(data?.id || data?.name || 'wild') === wanted;
      }) || null;
    }
    return null;
  }

  play(id, state) {
    const root = this.resolve(id);
    if (!root) return false;
    const previous = this.states.get(id);
    const baseScale = previous?.baseScale?.clone() || root.scale.clone();
    const aura = root.userData?.aura || null;
    const baseAuraScale = previous?.baseAuraScale?.clone() || aura?.scale?.clone() || null;
    const baseAuraOpacity = previous?.baseAuraOpacity ?? aura?.material?.opacity ?? 0.11;
    this.states.set(id, {
      root,
      aura,
      state,
      elapsed: 0,
      baseScale,
      baseAuraScale,
      baseAuraOpacity,
      baseRotationY: root.rotation.y,
      baseRotationZ: root.rotation.z,
      basePosition: root.position.clone()
    });
    return true;
  }

  stop(id) {
    const state = this.states.get(id);
    if (!state) return false;
    this.resetState(state);
    this.states.delete(id);
    return true;
  }

  resetState(state) {
    state.root.scale.copy(state.baseScale);
    state.root.rotation.y = state.baseRotationY;
    state.root.rotation.z = state.baseRotationZ;
    state.root.position.copy(state.basePosition);
    if (state.aura && state.baseAuraScale) state.aura.scale.copy(state.baseAuraScale);
    if (state.aura?.material) state.aura.material.opacity = state.baseAuraOpacity;
  }

  finishIfExpired(id, state, duration) {
    if (state.elapsed < duration) return false;
    this.resetState(state);
    this.states.delete(id);
    return true;
  }

  update(delta) {
    for (const [id, state] of this.states) {
      const root = state.root;
      if (!root?.parent) {
        this.states.delete(id);
        continue;
      }
      state.elapsed += delta;
      const t = state.elapsed;

      if (state.state === 'attack') {
        const phase = clamp01(t / 0.26);
        root.position.z = state.basePosition.z - Math.sin(phase * Math.PI) * 0.24;
        root.scale.copy(state.baseScale).multiplyScalar(1 + Math.sin(phase * Math.PI) * 0.13);
        this.finishIfExpired(id, state, 0.34);
      } else if (state.state === 'burst') {
        const phase = clamp01(t / 0.34);
        const pulse = Math.sin(phase * Math.PI);
        root.position.z = state.basePosition.z - pulse * 0.34;
        root.scale.copy(state.baseScale).multiplyScalar(1 + pulse * 0.2);
        if (state.aura && state.baseAuraScale) {
          state.aura.scale.copy(state.baseAuraScale).multiplyScalar(1 + pulse * 0.42);
          if (state.aura.material) state.aura.material.opacity = state.baseAuraOpacity + pulse * 0.2;
        }
        this.finishIfExpired(id, state, 0.42);
      } else if (state.state === 'hit') {
        const decay = Math.exp(-t * 8.5);
        root.rotation.z = state.baseRotationZ + Math.sin(t * 48) * 0.11 * decay;
        root.position.x = state.basePosition.x + Math.sin(t * 55) * 0.075 * decay;
        this.finishIfExpired(id, state, 0.62);
      } else if (state.state === 'defeat') {
        const phase = clamp01(t / 0.9);
        root.scale.copy(state.baseScale).multiplyScalar(Math.max(0.06, 1 - phase * 0.94));
        root.rotation.z = state.baseRotationZ + phase * 0.75;
      } else if (state.state === 'victory') {
        const bounce = Math.abs(Math.sin(t * 7.5)) * Math.exp(-t * 0.9);
        root.position.y = state.basePosition.y + bounce * 0.42;
        root.rotation.z = state.baseRotationZ + Math.sin(t * 5.5) * 0.08 * Math.exp(-t * 0.7);
      }
    }
  }

  dispose() {
    for (const state of this.states.values()) this.resetState(state);
    this.states.clear();
  }
}
