import * as THREE from 'three';
import { CreatureVisualSystem } from './CreatureVisualSystem.js';

/**
 * Bridges animated GLB creatures into the existing render loop without adding
 * another requestAnimationFrame loop. Animation mixers advance immediately
 * before the renderer draws the frame.
 */
export class CreatureRuntime {
  constructor({ assetManager } = {}) {
    this.visuals = new CreatureVisualSystem({ assetManager });
    this.clock = new THREE.Clock();
    this.renderer = null;
    this.originalRender = null;
    this.attached = false;
  }

  attachRenderer(renderer) {
    if (this.attached || !renderer?.render) return;
    this.renderer = renderer;
    this.originalRender = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => {
      const delta = Math.min(this.clock.getDelta(), 0.05);
      this.visuals.update(delta);
      return this.originalRender(scene, camera);
    };
    this.attached = true;
  }

  async spawn({ id, url, parent, position, scale = 1, animation = null }) {
    const root = await this.visuals.createFromGLTF({ id, url, parent, position, scale });
    if (animation) this.visuals.play(id, animation);
    return root;
  }

  play(id, animation, options) {
    return this.visuals.play(id, animation, options);
  }

  remove(id) {
    return this.visuals.remove(id);
  }

  dispose() {
    this.visuals.clear();
    if (this.attached && this.renderer && this.originalRender) {
      this.renderer.render = this.originalRender;
    }
    this.renderer = null;
    this.originalRender = null;
    this.attached = false;
  }
}
