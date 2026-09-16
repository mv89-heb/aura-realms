import * as THREE from 'three';
import { MOBILE_PERFORMANCE, getRecommendedPixelRatio } from './MobilePerformance.js';

const MIN_PIXEL_RATIO = 1.0;
const MAX_PIXEL_RATIO = MOBILE_PERFORMANCE.maxPixelRatio;
const SAMPLE_MS = 1500;
const CREATURE_HIDE_DISTANCE = 58;
const CREATURE_AURA_DISTANCE = 26;

export class MobilePerformanceController {
  constructor(game) {
    this.game = game;
    this.renderer = game.renderer;
    this.lastTime = performance.now();
    this.frames = 0;
    this.fps = 60;
    this.pixelRatio = this.renderer.getPixelRatio();
    this.mode = 'balanced';
    this.timer = null;
    this._wrapRender();
  }

  _wrapRender() {
    const renderer = this.renderer;
    const originalRender = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => {
      this.frames += 1;
      return originalRender(scene, camera);
    };
  }

  start() {
    if (this.timer) return;
    this.lastTime = performance.now();
    this.frames = 0;
    this.timer = window.setInterval(() => this.sample(), SAMPLE_MS);
    this.sample();
  }

  updateDistanceCulling() {
    const player = this.game.player;
    if (!player || !Array.isArray(this.game.wild)) return 0;

    let visible = 0;
    const hideDistanceSq = CREATURE_HIDE_DISTANCE * CREATURE_HIDE_DISTANCE;
    const auraDistanceSq = CREATURE_AURA_DISTANCE * CREATURE_AURA_DISTANCE;

    for (const creature of this.game.wild) {
      const distanceSq = player.position.distanceToSquared(creature.position);
      const isVisible = distanceSq <= hideDistanceSq;
      creature.visible = isVisible;

      const aura = creature.userData?.aura;
      if (aura) aura.visible = isVisible && distanceSq <= auraDistanceSq;
      if (isVisible) visible += 1;
    }

    return visible;
  }

  sample() {
    const now = performance.now();
    const elapsed = Math.max(1, now - this.lastTime);
    this.fps = (this.frames * 1000) / elapsed;
    this.frames = 0;
    this.lastTime = now;

    const calls = this.renderer.info.render.calls;
    const triangles = this.renderer.info.render.triangles;
    const recommended = getRecommendedPixelRatio(this.renderer);
    const visibleWild = this.updateDistanceCulling();

    if (this.fps < 48) {
      this.pixelRatio = Math.max(MIN_PIXEL_RATIO, Math.min(this.pixelRatio - 0.15, recommended));
      this.mode = 'performance';
    } else if (this.fps < 56) {
      this.pixelRatio = Math.max(MIN_PIXEL_RATIO, Math.min(this.pixelRatio - 0.05, recommended));
      this.mode = 'balanced';
    } else if (this.fps > 59) {
      this.pixelRatio = Math.min(MAX_PIXEL_RATIO, Math.max(this.pixelRatio + 0.05, recommended));
      this.mode = 'quality';
    }

    this.pixelRatio = THREE.MathUtils.clamp(this.pixelRatio, MIN_PIXEL_RATIO, MAX_PIXEL_RATIO);
    this.renderer.setPixelRatio(this.pixelRatio);

    this.game.performanceSnapshot = {
      fps: Math.round(this.fps),
      drawCalls: calls,
      triangles,
      pixelRatio: Number(this.pixelRatio.toFixed(2)),
      mode: this.mode,
      visibleWild
    };
  }

  dispose() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export async function warmupRenderer(game) {
  try {
    if (typeof game.renderer.compileAsync === 'function') {
      await game.renderer.compileAsync(game.scene, game.camera);
    } else if (typeof game.renderer.compile === 'function') {
      game.renderer.compile(game.scene, game.camera);
    }
  } catch (error) {
    console.debug('Renderer warmup skipped:', error);
  }
}
