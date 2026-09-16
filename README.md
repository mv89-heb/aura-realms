# Aura Realms

Aura Realms is an original 3D creature-exploration and evolution game built with **Three.js + Vite**, designed for a future **Capacitor Android** build.

## 0.3.0 — Mobile performance foundation

The active renderer is Three.js. The performance layer is deliberately mobile-first so visual quality can grow without assuming desktop-class GPU resources.

### Rendering policy
- Internal pixel ratio is capped and adaptively adjusted from measured frame time.
- A drawing-buffer pixel budget prevents high-DPI phones from rendering excessive pixels.
- Repeated trees and rocks are collapsed into `InstancedMesh` batches to reduce draw calls.
- Dynamic WebGL shadow maps are disabled for the exploration world.
- Character/environment depth is reinforced with cheap blob shadows.
- Tone mapping is enabled for a controlled stylized look.
- `disposeObject3D()` is available for explicit GPU resource cleanup during scene replacement.
- Renderer warmup is attempted before the player enters sustained gameplay to reduce first-use shader stalls.

### Adaptive performance controller
`src/three/MobilePerformanceController.js` samples the actual renderer loop and keeps a small quality budget:

- Below 48 FPS: reduce internal pixel ratio aggressively.
- 48–56 FPS: reduce resolution gradually.
- Above 59 FPS: cautiously restore resolution.
- Pixel ratio never falls below 1.0 or above the configured mobile ceiling.
- The controller records FPS, draw calls, triangles, pixel ratio and quality mode for development diagnostics.

The goal is not to promise 60 FPS on every Android device; the game should degrade gracefully when GPU/thermal conditions are weaker.

### Current vertical slice
- Procedural 3D Verdant Meadow
- Third-person follow camera
- Mobile virtual joystick
- Keyboard controls for desktop testing
- Original procedural 3D creature models
- Five roaming wild creatures
- River, trees, rocks and Aura Shrine
- Proximity-based encounters
- Turn-based battle overlay
- XP, Aura, Crystals and wins
- Local save support
- Responsive mobile-first UI

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Capacitor preparation

The repository contains the Capacitor configuration and package scripts needed for the Android integration phase. The native Android project should be generated after the web build is stable:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## Architecture

```text
src/
├── data/       Game data: creatures, moves, worlds, quests, achievements
├── systems/    Save, battle, encounter, progression and evolution logic
├── three/      3D runtime, world rendering and mobile performance
└── main.js     Application bootstrap
```

## Performance targets

The working target is **stable 60 FPS on capable mid/high-range Android devices**, with graceful degradation on weaker devices rather than forcing maximum Retina resolution.

Priority order:
1. Keep the render resolution bounded and adaptive.
2. Keep repeated environment geometry instanced.
3. Avoid dynamic shadow-map updates during exploration.
4. Avoid unnecessary transparent/post-processing passes.
5. Dispose GPU resources when leaving large scenes.
6. Add real low-poly assets with controlled texture sizes.
7. Profile on physical Android devices before increasing visual complexity.

## Roadmap

1. Add distance-based culling and LOD for world/creature assets
2. Replace procedural creature meshes with original low-poly GLB/GLTF models
3. Add proper creature idle/walk/attack animations
4. Add collision/navigation around world obstacles
5. Add capture, collection and evolution progression
6. Add elemental battle multipliers and abilities
7. Add quests, achievements and NPCs
8. Add additional 3D worlds and bosses
9. Add audio, particles, vibration and save migration
10. Generate and optimize the Android project with Capacitor
