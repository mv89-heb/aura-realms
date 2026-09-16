import { CreatureVisualSystem } from './CreatureVisualSystem.js';

/**
 * Runtime bridge for animated GLB creatures.
 * Animation is advanced from the game's existing RAF loop; this class never
 * creates a second render loop and never monkey-patches WebGLRenderer.render.
 */
export class CreatureRuntime {
  constructor({ assetManager } = {}) {
    this.visuals = new CreatureVisualSystem({ assetManager });
  }

  update(delta) {
    this.visuals.update(delta);
  }

  async spawn({ id, url, parent, position, scale = 1, animation = null }) {
    const root = await this.visuals.createFromGLTF({ id, url, parent, position, scale });
    if (animation) this.visuals.play(id, animation);
    return root;
  }

  play(id, animation, options) {
    return this.visuals.play(id, animation, options);
  }

  stop(id, animation, fade) {
    return this.visuals.stop(id, animation, fade);
  }

  remove(id) {
    return this.visuals.remove(id);
  }

  dispose() {
    this.visuals.clear();
  }
}
