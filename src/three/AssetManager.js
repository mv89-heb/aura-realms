import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Mobile-safe asset cache for GLB/GLTF resources.
 * Keeps loading concerns out of gameplay code and gives us one place to
 * release GPU resources when an area is unloaded.
 */
export class AssetManager {
  constructor({ maxEntries = 48 } = {}) {
    this.maxEntries = maxEntries;
    this.cache = new Map();
    this.loading = new Map();
    this.loader = new GLTFLoader();
  }

  async loadGLTF(url) {
    if (this.cache.has(url)) {
      const entry = this.cache.get(url);
      entry.lastUsed = performance.now();
      return entry.gltf;
    }

    if (this.loading.has(url)) return this.loading.get(url);

    const promise = new Promise((resolve, reject) => {
      this.loader.load(url, gltf => {
        this.cache.set(url, { gltf, lastUsed: performance.now() });
        this.loading.delete(url);
        this.evictIfNeeded(url);
        resolve(gltf);
      }, undefined, error => {
        this.loading.delete(url);
        reject(error);
      });
    });

    this.loading.set(url, promise);
    return promise;
  }

  touch(url) {
    const entry = this.cache.get(url);
    if (entry) entry.lastUsed = performance.now();
  }

  evictIfNeeded(protectedUrl = null) {
    while (this.cache.size > this.maxEntries) {
      let oldestUrl = null;
      let oldestTime = Infinity;
      for (const [url, entry] of this.cache) {
        if (url === protectedUrl) continue;
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestUrl = url;
        }
      }
      if (!oldestUrl) break;
      this.unload(oldestUrl);
    }
  }

  unload(url) {
    const entry = this.cache.get(url);
    if (!entry) return false;
    disposeObject3D(entry.gltf.scene);
    this.cache.delete(url);
    return true;
  }

  clear() {
    for (const url of this.cache.keys()) this.unload(url);
    this.loading.clear();
  }
}

export function disposeObject3D(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root?.traverse(object => {
    if (!object.isMesh) return;
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });

  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

export function estimateTextureMemory(root) {
  let bytes = 0;
  const seen = new Set();
  root?.traverse(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (!material) return;
      Object.values(material).forEach(value => {
        if (!value?.isTexture || seen.has(value)) return;
        seen.add(value);
        const image = value.image;
        if (image?.width && image?.height) bytes += image.width * image.height * 4;
      });
    });
  });
  return bytes;
}
