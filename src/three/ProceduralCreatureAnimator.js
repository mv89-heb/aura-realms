import * as THREE from 'three';

const clamp01 = value => Math.max(0, Math.min(1, value));

/**
 * Lightweight animation fallback for the built-in procedural creatures.
 * Uses transforms only, so it adds no geometry, textures, shaders, or draw calls.
 */
export class ProceduralCreatureAnimator {
  constructor(game) {
    this.game = game;
    this.states = new Map();
    this.renderer = null;
    this.originalRender = null;
    this.attached = false;
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
    this.states.set(id, {
      root,
      state,
      elapsed: 0,
      baseScale,
      baseRotationY: root.rotation.y,
      basePosition: root.position.clone()
    });
    return true;
  }

  stop(id) {
    const state = this.states.get(id);
    if (!state) return false;
    state.root.scale.copy(state.baseScale);
    state.root.rotation.y = state.baseRotationY;
    state.root.position.y = state.basePosition.y;
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
        const lunge = Math.sin(phase * Math.PI) * 0.24;
        root.position.z = state.basePosition.z - lunge;
        const pulse = 1 + Math.sin(phase * Math.PI) * 0.13;
        root.scale.copy(state.baseScale).multiplyScalar(pulse);
      } else if (state.state === 'hit') {
        const decay = Math.exp(-t * 8.5);
        root.rotation.z = Math.sin(t * 48) * 0.11 * decay;
        root.position.x = state.basePosition.x + Math.sin(t * 55) * 0.075 * decay;
      } else if (state.state === 'defeat') {
        const phase = clamp01(t / 0.9);
        const scale = Math.max(0.06, 1 - phase * 0.94);
        root.scale.copy(state.baseScale).multiplyScalar(scale);
        root.rotation.z = phase * 0.75;
        root.position.y = state.basePosition.y + Math.sin(phase * Math.PI) * 0.18;
      } else if (state.state === 'victory') {
        const bounce = Math.abs(Math.sin(t * 7.5)) * Math.exp(-t * 0.9);
        root.position.y = state.basePosition.y + bounce * 0.42;
        root.rotation.z = Math.sin(t * 5.5) * 0.08 * Math.exp(-t * 0.7);
      }
    }
  }

  attachRenderer(renderer) {
    if (this.attached || !renderer?.render) return;
    this.renderer = renderer;
    this.originalRender = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => {
      const delta = Math.min(this.game?.clock?.getDelta?.() || 0, 0.05);
      this.update(delta);
      return this.originalRender(scene, camera);
    };
    this.attached = true;
  }

  dispose() {
    for (const state of this.states.values()) {
      state.root.scale.copy(state.baseScale);
      state.root.rotation.y = state.baseRotationY;
      state.root.rotation.z = 0;
      state.root.position.copy(state.basePosition);
    }
    this.states.clear();
    if (this.attached && this.renderer && this.originalRender) {
      this.renderer.render = this.originalRender;
    }
    this.renderer = null;
    this.originalRender = null;
    this.attached = false;
  }
}
