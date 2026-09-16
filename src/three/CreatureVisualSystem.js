import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';

/**
 * Coordinates optional GLB creatures without forcing the game to depend on
 * external assets. Procedural creatures continue to work as the fallback.
 */
export class CreatureVisualSystem {
  constructor({ assetManager = new AssetManager() } = {}) {
    this.assets = assetManager;
    this.instances = new Map();
    this.mixers = new Set();
  }

  async createFromGLTF({ id, url, parent, position = new THREE.Vector3(), scale = 1 }) {
    if (this.instances.has(id)) return this.instances.get(id).root;

    const gltf = await this.assets.acquire(url);
    const root = gltf.scene.clone(true);
    root.position.copy(position);
    root.scale.setScalar(scale);
    root.traverse(object => {
      if (object.isMesh) {
        object.frustumCulled = true;
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });

    parent.add(root);

    const mixer = gltf.animations?.length ? new THREE.AnimationMixer(root) : null;
    const actions = new Map();
    if (mixer) {
      this.mixers.add(mixer);
      for (const clip of gltf.animations) {
        actions.set(clip.name, mixer.clipAction(clip));
      }
    }

    const instance = { id, url, root, mixer, actions };
    this.instances.set(id, instance);
    return root;
  }

  play(id, animationName, { reset = true, fade = 0.12 } = {}) {
    const instance = this.instances.get(id);
    const action = instance?.actions.get(animationName);
    if (!action) return false;

    if (reset) action.reset();
    action.fadeIn(fade).play();
    return true;
  }

  stop(id, animationName, fade = 0.12) {
    const instance = this.instances.get(id);
    const action = instance?.actions.get(animationName);
    if (!action) return false;
    action.fadeOut(fade);
    return true;
  }

  update(delta) {
    for (const mixer of this.mixers) mixer.update(delta);
  }

  remove(id) {
    const instance = this.instances.get(id);
    if (!instance) return false;

    instance.mixer?.stopAllAction();
    if (instance.mixer) this.mixers.delete(instance.mixer);
    instance.root.removeFromParent();
    this.assets.release(instance.url);
    this.instances.delete(id);
    return true;
  }

  clear() {
    for (const id of [...this.instances.keys()]) this.remove(id);
  }
}
