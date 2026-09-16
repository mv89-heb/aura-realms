import * as THREE from 'three';
import { CREATURES } from '../data/creatures.js';
import { loadSave, saveGame } from '../systems/SaveSystem.js';
import { calculateDamage } from '../systems/BattleSystem.js';

const WORLD_SIZE = 120;
const PLAYER_SPEED = 7;

export class AuraRealms3D {
  constructor(container) {
    this.container = container;
    this.save = loadSave();
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x86c9d7);
    this.scene.fog = new THREE.Fog(0x86c9d7, 45, 125);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 250);
    this.camera.position.set(0, 8, 13);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.wild = [];
    this.keys = new Set();
    this.joystick = { active: false, x: 0, y: 0, pointerId: null };
    this.player = null;
    this.messageTimer = 0;
    this.battle = null;
    this.ui = this.createUI();

    this.setupLights();
    this.createWorld();
    this.createPlayer();
    this.createWildCreatures();
    this.bindInput();
    this.resize();
  }

  start() {
    this.showMessage('Welcome to Verdant Meadow');
    this.animate();
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0xd9f6ff, 0x35502f, 2.2);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4d0, 3.2);
    sun.position.set(-25, 35, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    this.scene.add(sun);
  }

  createWorld() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x63a95f, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.world.add(ground);

    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 125),
      new THREE.MeshStandardMaterial({ color: 0x4da7d8, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.92 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(20, 0.025, 0);
    this.world.add(river);

    for (let i = 0; i < 70; i++) this.addTree(this.randomPosition(9));
    for (let i = 0; i < 30; i++) this.addRock(this.randomPosition(8));
    this.addShrine(39, -28);
    this.addSign(-25, -39);
  }

  addTree(pos) {
    if (Math.abs(pos.x - 20) < 10) return;
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x754b2d }));
    trunk.position.y = 1.25;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), new THREE.MeshStandardMaterial({ color: 0x2f7d45, roughness: 0.9 }));
    crown.position.y = 3.1;
    trunk.castShadow = crown.castShadow = true;
    group.add(trunk, crown);
    group.position.copy(pos);
    group.scale.setScalar(0.75 + Math.random() * 0.65);
    this.world.add(group);
  }

  addRock(pos) {
    if (Math.abs(pos.x - 20) < 9) return;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.8, 0), new THREE.MeshStandardMaterial({ color: 0x71807b, roughness: 1 }));
    rock.position.set(pos.x, 0.55, pos.z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    this.world.add(rock);
  }

  addShrine(x, z) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x52637a, roughness: 0.8 }));
    base.position.y = 0.4;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.5), new THREE.MeshStandardMaterial({ color: 0x9d7cff, emissive: 0x5a2bc0, emissiveIntensity: 1.6, roughness: 0.25 }));
    crystal.position.y = 2.5;
    group.add(base, crystal);
    group.position.set(x, 0, z);
    group.userData.crystal = crystal;
    this.world.add(group);
    this.shrine = group;
  }

  addSign(x, z) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 6), new THREE.MeshStandardMaterial({ color: 0x6b452a }));
    post.position.set(x, 1, z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.3, 0.2), new THREE.MeshStandardMaterial({ color: 0xb47a45 }));
    board.position.set(x, 2, z);
    this.world.add(post, board);
  }

  createPlayer() {
    const data = CREATURES[this.save.creature] || CREATURES.lumiko;
    this.player = this.createCreatureMesh(data, true);
    this.player.position.set(0, 0, 12);
    this.world.add(this.player);
    this.playerData = data;
  }

  createWildCreatures() {
    const ids = ['mossli', 'aquini', 'emberu', 'voltin', 'nocti'];
    ids.forEach((id, index) => {
      const data = CREATURES[id];
      const mesh = this.createCreatureMesh(data, false);
      const angle = index * 1.2 + 0.4;
      mesh.position.set(Math.cos(angle) * (12 + index * 4), 0, Math.sin(angle) * (12 + index * 4));
      mesh.userData = { ...mesh.userData, data, home: mesh.position.clone(), phase: Math.random() * Math.PI * 2, speed: 0.35 + Math.random() * 0.45 };
      this.world.add(mesh);
      this.wild.push(mesh);
    });
  }

  createCreatureMesh(data, player) {
    const group = new THREE.Group();
    const color = new THREE.Color(data.color || 0x8ee7ff);
    const accent = new THREE.Color(data.accent || 0xffffff);
    const body = new THREE.Mesh(new THREE.SphereGeometry(player ? 1.15 : 1.0, 20, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.65 }));
    body.scale.y = 1.12;
    body.position.y = 1.15;
    const belly = new THREE.Mesh(new THREE.SphereGeometry(player ? 0.72 : 0.62, 16, 12), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.7 }));
    belly.scale.set(1, 0.9, 0.55);
    belly.position.set(0, 1.05, 0.82);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    [-0.34, 0.34].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), eyeMat);
      eye.position.set(x, 1.5, 0.92);
      group.add(eye);
    });
    const earGeo = new THREE.ConeGeometry(0.35, 0.8, 6);
    [-0.62, 0.62].forEach(x => {
      const ear = new THREE.Mesh(earGeo, new THREE.MeshStandardMaterial({ color: accent }));
      ear.position.set(x, 2.0, 0);
      ear.rotation.z = x > 0 ? -0.35 : 0.35;
      group.add(ear);
    });
    const aura = new THREE.Mesh(new THREE.SphereGeometry(player ? 1.65 : 1.35, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.11, wireframe: true }));
    aura.position.y = 1.15;
    group.add(body, belly, aura);
    group.userData.aura = aura;
    group.userData.data = data;
    group.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return group;
  }

  createUI() {
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;color:white;user-select:none;';
    root.innerHTML = `
      <div id="hud" style="position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;gap:10px;align-items:center;">
        <div style="padding:10px 14px;border:1px solid #ffffff2b;border-radius:16px;background:#07111fcc;backdrop-filter:blur(8px);font-weight:800">AURA REALMS <span style="opacity:.55;font-weight:600">3D</span></div>
        <div id="stats" style="padding:10px 14px;border:1px solid #ffffff2b;border-radius:16px;background:#07111fcc;backdrop-filter:blur(8px);font-size:13px">LV 1 · ✦ 12 · ◇ 25</div>
      </div>
      <div id="message" style="position:absolute;top:82px;left:50%;transform:translateX(-50%);padding:9px 16px;border-radius:999px;background:#07111fcc;border:1px solid #ffffff24;opacity:0;transition:opacity .2s;white-space:nowrap;font-weight:700"></div>
      <div id="joystick" style="position:absolute;left:24px;bottom:26px;width:118px;height:118px;border-radius:50%;border:2px solid #ffffff36;background:#07111f66;pointer-events:auto;touch-action:none;">
        <div id="stick" style="position:absolute;width:54px;height:54px;left:30px;top:30px;border-radius:50%;background:#ffffff28;border:1px solid #ffffff55"></div>
      </div>
      <div id="hint" style="position:absolute;right:18px;bottom:28px;max-width:230px;padding:12px 14px;border-radius:15px;background:#07111fcc;border:1px solid #ffffff24;font-size:12px;line-height:1.4;text-align:right">Move with the joystick.<br>Get close to a wild creature to encounter it.</div>
      <div id="battle" style="display:none;position:absolute;inset:0;align-items:flex-end;justify-content:center;padding:20px;pointer-events:auto;background:linear-gradient(transparent,#07111fbb 55%,#07111fee);">
        <div style="width:min(520px,94vw);padding:18px;border:1px solid #ffffff2b;border-radius:22px;background:#07111ff2;backdrop-filter:blur(12px)">
          <div id="battleTitle" style="font-size:22px;font-weight:900;margin-bottom:8px"></div>
          <div id="battleHp" style="font-size:13px;opacity:.8;margin-bottom:14px"></div>
          <div style="display:flex;gap:8px">
            <button id="strike" style="flex:1;padding:12px;border:0;border-radius:14px;background:#7c5cff;color:white;font-weight:900;cursor:pointer">STRIKE</button>
            <button id="burst" style="flex:1;padding:12px;border:0;border-radius:14px;background:#25b7d3;color:white;font-weight:900;cursor:pointer">AURA BURST</button>
            <button id="retreat" style="padding:12px;border:0;border-radius:14px;background:#ffffff18;color:white;font-weight:800;cursor:pointer">RUN</button>
          </div>
        </div>
      </div>`;
    this.container.appendChild(root);
    const $ = id => root.querySelector(id);
    $(' #strike');
    return { root, stats: $('#stats'), message: $('#message'), joystick: $('#joystick'), stick: $('#stick'), battle: $('#battle'), battleTitle: $('#battleTitle'), battleHp: $('#battleHp'), strike: $('#strike'), burst: $('#burst'), retreat: $('#retreat') };
  }

  bindInput() {
    const joy = this.ui.joystick;
    const move = e => {
      const r = joy.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const len = Math.min(45, Math.hypot(dx, dy));
      const a = Math.atan2(dy, dx);
      this.joystick.x = Math.cos(a) * len / 45;
      this.joystick.y = Math.sin(a) * len / 45;
      this.ui.stick.style.transform = `translate(${this.joystick.x * 30}px,${this.joystick.y * 30}px)`;
    };
    joy.addEventListener('pointerdown', e => { this.joystick.active = true; this.joystick.pointerId = e.pointerId; joy.setPointerCapture(e.pointerId); move(e); });
    joy.addEventListener('pointermove', e => { if (this.joystick.active && e.pointerId === this.joystick.pointerId) move(e); });
    const end = e => { if (e.pointerId === this.joystick.pointerId) { this.joystick.active = false; this.joystick.x = this.joystick.y = 0; this.ui.stick.style.transform = ''; } };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    window.addEventListener('keydown', e => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    this.ui.strike.onclick = () => this.battleTurn(1);
    this.ui.burst.onclick = () => this.battleTurn(1.35);
    this.ui.retreat.onclick = () => this.closeBattle();
  }

  updatePlayer(dt) {
    let x = this.joystick.x, z = this.joystick.y;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) z -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) z += 1;
    const len = Math.hypot(x, z);
    if (len > 0.05) {
      x /= len; z /= len;
      this.player.position.x += x * PLAYER_SPEED * dt;
      this.player.position.z += z * PLAYER_SPEED * dt;
      this.player.rotation.y = Math.atan2(x, z);
      this.player.userData.aura.rotation.y += dt * 2;
    }
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -WORLD_SIZE / 2 + 2, WORLD_SIZE / 2 - 2);
    this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -WORLD_SIZE / 2 + 2, WORLD_SIZE / 2 - 2);
  }

  updateWild(time) {
    this.wild.forEach((c, i) => {
      const a = time * c.userData.speed + c.userData.phase;
      const targetX = c.userData.home.x + Math.cos(a) * 2.5;
      const targetZ = c.userData.home.z + Math.sin(a * 0.8) * 2.5;
      c.position.x = THREE.MathUtils.lerp(c.position.x, targetX, 0.015);
      c.position.z = THREE.MathUtils.lerp(c.position.z, targetZ, 0.015);
      c.position.y = Math.sin(time * 3 + i) * 0.06;
      c.userData.aura.rotation.y += 0.01;
      c.rotation.y += Math.sin(time + i) * 0.002;
    });
  }

  updateCamera(dt) {
    const target = new THREE.Vector3(this.player.position.x, 2.5, this.player.position.z + 8);
    const desired = new THREE.Vector3(this.player.position.x, 8.5, this.player.position.z + 13);
    this.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    this.camera.lookAt(target);
  }

  checkEncounter() {
    if (this.battle) return;
    for (const wild of this.wild) {
      const distance = this.player.position.distanceTo(wild.position);
      if (distance < 2.8) { this.openBattle(wild); break; }
    }
  }

  openBattle(wild) {
    this.battle = { wild, enemy: { ...wild.userData.data, currentHp: wild.userData.data.hp }, playerHp: this.playerData.hp };
    this.ui.battleTitle.textContent = `${this.battle.enemy.name} appeared!`;
    this.ui.battle.style.display = 'flex';
    this.ui.hint.style.display = 'none';
    this.updateBattleUI();
  }

  updateBattleUI() {
    if (!this.battle) return;
    this.ui.battleHp.textContent = `${this.playerData.name} HP ${this.battle.playerHp} · ${this.battle.enemy.name} HP ${Math.max(0, this.battle.enemy.currentHp)}`;
  }

  battleTurn(multiplier) {
    if (!this.battle) return;
    const damage = calculateDamage(this.playerData.attack, multiplier);
    this.battle.enemy.currentHp -= damage;
    if (this.battle.enemy.currentHp <= 0) {
      this.save.xp += 35;
      this.save.aura += 4;
      this.save.crystals += 8;
      this.save.wins += 1;
      saveGame(this.save);
      this.showMessage(`Victory! +35 XP · +4 Aura · +8 Crystals`);
      this.closeBattle(true);
      this.updateStats();
      return;
    }
    const retaliation = calculateDamage(this.battle.enemy.attack, 1);
    this.battle.playerHp -= retaliation;
    if (this.battle.playerHp <= 0) {
      this.showMessage('Your creature needs rest.');
      this.closeBattle();
      return;
    }
    this.updateBattleUI();
  }

  closeBattle(victory = false) {
    if (victory && this.battle) {
      const index = this.wild.indexOf(this.battle.wild);
      if (index >= 0) {
        this.world.remove(this.battle.wild);
        this.wild.splice(index, 1);
      }
    }
    this.battle = null;
    this.ui.battle.style.display = 'none';
    this.ui.hint.style.display = '';
  }

  showMessage(text) {
    this.ui.message.textContent = text;
    this.ui.message.style.opacity = '1';
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => { this.ui.message.style.opacity = '0'; }, 2400);
  }

  updateStats() {
    this.ui.stats.textContent = `LV ${this.save.level} · ✦ ${this.save.aura} · ◇ ${this.save.crystals}`;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    if (!this.battle) {
      this.updatePlayer(dt);
      this.updateWild(time);
      this.checkEncounter();
      this.updateCamera(dt);
    }
    if (this.shrine) {
      this.shrine.userData.crystal.rotation.y += dt * 0.7;
      this.shrine.userData.crystal.position.y = 2.5 + Math.sin(time * 2) * 0.15;
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  randomPosition(minDistance = 0) {
    let x, z;
    do {
      x = (Math.random() - 0.5) * (WORLD_SIZE - 8);
      z = (Math.random() - 0.5) * (WORLD_SIZE - 8);
    } while (Math.hypot(x, z) < minDistance);
    return new THREE.Vector3(x, 0, z);
  }
}
