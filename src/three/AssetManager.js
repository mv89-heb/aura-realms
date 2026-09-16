import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_MAX_ENTRIES = 48;
const DEFAULT_MAX_TEXTURE_BYTES = 96 * 1024 * 1024;

/**
 * Mobile-safe GLB/GLTF cache.
 *
 * Assets are reference-counted so an LRU eviction can never dispose a model
 * that is still attached to an active scene. Gameplay code should call
 * acquire() when an asset becomes active and release() when its zone unloads.
 */
export class AssetManager {
  constructor({
    maxEntries = DEFAULT_MAX_ENTRIES,
    maxTextureBytes = DEFAULT_MAX_TEXTURE_BYTES,
  } = {}) {
    this.maxEntries = maxEntries;
    this.maxTextureBytes = maxTextureBytes;
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
        const entry = {
          gltf,
          refs: 0,
          lastUsed: performance.now(),
          textureBytes: estimateTextureMemory(gltf.scene),
        };
        this.cache.set(url, entry);
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

  async acquire(url) {
    const gltf = await this.loadGLTF(url);
    const entry = this.cache.get(url);
    if (!entry) throw new Error(`Asset was evicted during load: ${url}`);
    entry.refs += 1;
    entry.lastUsed = performance.now();
    return gltf;
  }

  release(url) {
    const entry = this.cache.get(url);
    if (!entry) return false;
    entry.refs = Math.max(0, entry.refs - 1);
    entry.lastUsed = performance.now();
    this.evictIfNeeded();
    return true;
  }

  touch(url) {
    const entry = this.cache.get(url);
    if (entry) entry.lastUsed = performance.now();
  }

  getStats() {
    let textureBytes = 0;
    let referencedEntries = 0;
    for (const entry of this.cache.values()) {
      textureBytes += entry.textureBytes;
      if (entry.refs > 0) referencedEntries += 1;
    }
    return {
      entries: this.cache.size,
      referencedEntries,
      loading: this.loading.size,
      textureBytes,
      textureMegabytes: textureBytes / (1024 * 1024),
    };
  }

  evictIfNeeded(protectedUrl = null) {
    const overEntries = () => this.cache.size > this.maxEntries;
    const overTextureBudget = () => this.getStats().textureBytes > this.maxTextureBytes;

    while (overEntries() || overTextureBudget()) {
      let oldestUrl = null;
      let oldestTime = Infinity;

      for (const [url, entry] of this.cache) {
        if (url === protectedUrl || entry.refs > 0) continue;
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestUrl = url;
        }
      }

      if (!oldestUrl) break;
      this.unload(oldestUrl);
    }
  }

  unload(url, { force = false } = {}) {
    const entry = this.cache.get(url);
    if (!entry) return false;
    if (!force && entry.refs > 0) return false;

    disposeObject3D(entry.gltf.scene);
    this.cache.delete(url);
    return true;
  }

  clear({ force = false } = {}) {
    for (const url of [...this.cache.keys()]) this.unload(url, { force });
    if (force) this.loading.clear();
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

export const ASSET_BUDGET = Object.freeze({
  maxEntries: DEFAULT_MAX_ENTRIES,
  maxTextureBytes: DEFAULT_MAX_TEXTURE_BYTES,
  preferredTextureDimension: 512,
  maxTextureDimension: 1024,
});
