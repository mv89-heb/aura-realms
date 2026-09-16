# Aura Realms

Aura Realms is an original 3D creature-exploration and evolution game built with **Three.js + Vite**, designed for a future **Capacitor Android** build.

## 0.3.0 — Mobile performance foundation

The active renderer is Three.js. The current performance layer is deliberately mobile-first so visual quality can grow without assuming desktop-class GPU resources.

### Rendering policy
- Internal pixel ratio is capped and dynamically reduced when the drawing buffer would become too large.
- Repeated trees and rocks are collapsed into `InstancedMesh` batches to reduce draw calls.
- Dynamic WebGL shadow maps are disabled for the exploration world.
- Character/environment depth is reinforced with cheap blob shadows.
- Tone mapping is enabled for a controlled stylized look.
- `disposeObject3D()` is available for explicit GPU resource cleanup during scene replacement.
- The renderer avoids unnecessary full-resolution Retina rendering on high-DPI phones.

Three.js documents `InstancedMesh` as a way to reduce draw calls for repeated geometry/material combinations. Its documentation also recommends disposing GPU resources when objects are no longer used. citeturn0search0

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

The repository now contains `capacitor.config.ts` and the Capacitor 8 packages/scripts needed for the Android integration phase. The native Android project is intentionally generated only after the web build is stable:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Capacitor is designed to wrap modern web applications in native Android/iOS containers while retaining web standards and access to native APIs. citeturn1search4

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
1. Keep the render resolution bounded.
2. Keep repeated environment geometry instanced.
3. Avoid dynamic shadow-map updates during exploration.
4. Avoid unnecessary transparent/post-processing passes.
5. Dispose GPU resources when leaving large scenes.
6. Add real low-poly assets with controlled texture sizes.
7. Profile on physical Android devices before increasing visual complexity.

Three.js specifically notes that high-DPI displays can multiply the number of pixels rendered dramatically and recommends controlling the internal drawing resolution for heavy applications. citeturn0search2

## Roadmap

1. Replace procedural creature meshes with original low-poly models
2. Add proper creature idle/walk/attack animations
3. Add collision/navigation around world obstacles
4. Add capture, collection and evolution progression
5. Add elemental battle multipliers and abilities
6. Add quests, achievements and NPCs
7. Add additional 3D worlds and bosses
8. Add audio, particles, vibration and save migration
9. Generate and optimize the Android project with Capacitor
