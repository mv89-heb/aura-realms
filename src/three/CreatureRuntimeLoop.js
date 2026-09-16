/**
 * Connects CreatureRuntime and optional procedural animation to AuraRealms3D's
 * existing animation loop. No second RAF and no renderer monkey-patching.
 */
export function attachCreatureRuntime(game, runtime) {
  if (!game || !runtime || game.__creatureRuntimeLoopAttached) return runtime;

  const originalAnimate = game.animate.bind(game);
  let previousElapsed = game.clock.elapsedTime;

  game.animate = () => {
    const elapsed = game.clock.elapsedTime;
    const dt = Math.min(Math.max(elapsed - previousElapsed, 0), 0.05);
    previousElapsed = elapsed;
    runtime.update(dt);
    game.proceduralCreatureAnimator?.update(dt);
    originalAnimate();
  };

  game.__creatureRuntimeLoopAttached = true;
  return runtime;
}
