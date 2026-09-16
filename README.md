# Aura Realms

Aura Realms is an original 3D creature-exploration and evolution game built with **Three.js + Vite**.

## 0.2.0 — 3D foundation

The project has moved from the Phaser 2D prototype to a real-time 3D renderer while keeping the game systems/data independent from the rendering layer.

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

### Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Architecture

```text
src/
├── data/       Game data: creatures, moves, worlds, quests, achievements
├── systems/    Save, battle, encounter, progression and evolution logic
├── three/      3D game runtime and world rendering
└── main.js     Application bootstrap
```

The old Phaser prototype files remain temporarily as migration reference, but the active application entry point is now Three.js.

## Roadmap

1. Replace procedural creature meshes with original low-poly models
2. Add proper creature idle/walk/attack animations
3. Add collision/navigation around world obstacles
4. Add capture, collection and evolution progression
5. Add elemental battle multipliers and abilities
6. Add quests, achievements and NPCs
7. Add additional 3D worlds and bosses
8. Add audio, particles, vibration and save migration
9. Package for Android with Capacitor
