/**
 * Connects CreatureRuntime to AuraRealms3D's existing animation loop.
 * No second RAF and no renderer monkey-patching are introduced.
 */
export function attachCreatureRuntime(game, runtime) {
  if (!game || !runtime || game.__creatureRuntimeLoopAttached) return runtime;

  const originalAnimate = game.animate.bind(game);
  game.animate = () => {
    const dt = Math.min(game.clock.getDelta(), 0.05);
    runtime.update(dt);
    game.clock.elapsedTime -= dt;
    originalAnimate();
  };

  game.__creatureRuntimeLoopAttached = true;
  return runtime;
}
