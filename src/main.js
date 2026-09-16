import { AuraRealms3D } from './three/AuraRealms3D.js';
import { CreatureRuntime } from './three/CreatureRuntime.js';
import { CreatureBattleAnimator } from './three/CreatureBattleAnimator.js';
import { CreatureBattleIntegration } from './three/CreatureBattleIntegration.js';
import { ProceduralCreatureAnimator } from './three/ProceduralCreatureAnimator.js';
import { CombatFeedback } from './three/CombatFeedback.js';
import { attachCreatureRuntime } from './three/CreatureRuntimeLoop.js';
import { configureMobileRenderer, batchEnvironment, addBlobShadow } from './three/MobilePerformance.js';
import { MobilePerformanceController, warmupRenderer } from './three/MobilePerformanceController.js';

const game = new AuraRealms3D(document.getElementById('game'));

// Mobile-first rendering policy: cap internal resolution and avoid full shadow maps.
configureMobileRenderer(game.renderer);

// Collapse repeated environment meshes into a handful of instanced draw calls.
const batched = batchEnvironment(game.world);

// Replace expensive dynamic character shadows with cheap blob shadows.
if (game.player) addBlobShadow(game.player, 0.95);
for (const creature of game.wild) addBlobShadow(creature, 0.78);

game.performanceStats = batched;

// Optional GLB creatures and the procedural fallback share the same game loop.
const creatureRuntime = attachCreatureRuntime(game, new CreatureRuntime());
const proceduralCreatureAnimator = new ProceduralCreatureAnimator(game);
game.proceduralCreatureAnimator = proceduralCreatureAnimator;
window.auraCreatureRuntime = creatureRuntime;

// Keep battle rules untouched while mapping battle events to visual feedback.
const creatureBattleAnimator = new CreatureBattleAnimator(creatureRuntime);
const combatFeedback = new CombatFeedback(game);
const creatureBattleIntegration = new CreatureBattleIntegration(
  game,
  creatureBattleAnimator,
  proceduralCreatureAnimator,
  combatFeedback
).attach();
game.creatureBattleAnimator = creatureBattleAnimator;
game.creatureBattleIntegration = creatureBattleIntegration;
game.combatFeedback = combatFeedback;
window.auraCreatureBattleAnimator = creatureBattleAnimator;

const performanceController = new MobilePerformanceController(game);
performanceController.start();

game.start();
void warmupRenderer(game);

window.addEventListener('resize', () => {
  configureMobileRenderer(game.renderer);
  game.resize();
  performanceController.sample();
});

window.addEventListener('pagehide', () => {
  creatureBattleIntegration.dispose();
  proceduralCreatureAnimator.dispose();
  creatureBattleAnimator.dispose();
  performanceController.dispose();
  creatureRuntime.dispose();
}, { once: true });
