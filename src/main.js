import { AuraRealms3D } from './three/AuraRealms3D.js';

const game = new AuraRealms3D(document.getElementById('game'));
game.start();

window.addEventListener('resize', () => game.resize());
