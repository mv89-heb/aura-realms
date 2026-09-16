import * as THREE from 'three';

export const MOBILE_PERFORMANCE = Object.freeze({
  maxPixelRatio: 1.75,
  maxPixelCount: 1920 * 1080,
  antialias: false,
  shadowMap: false,
  treeInstances: 70,
  rockInstances: 30
});

export function getRecommendedPixelRatio(renderer, maxPixelCount = MOBILE_PERFORMANCE.maxPixelCount) {
  const dpr = Math.min(window.devicePixelRatio || 1, MOBILE_PERFORMANCE.maxPixelRatio);
  const width = Math.max(1, renderer.domElement.clientWidth || window.innerWidth);
  const height = Math.max(1, renderer.domElement.clientHeight || window.innerHeight);
  const pixels = width * height * dpr * dpr;
  return pixels > maxPixelCount ? dpr * Math.sqrt(maxPixelCount / pixels) : dpr;
}

export function configureMobileRenderer(renderer) {
  renderer.setPixelRatio(getRecommendedPixelRatio(renderer));
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  return renderer;
}

function disposeMeshResources(mesh) {
  mesh.geometry?.dispose();
  if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose());
  else mesh.material?.dispose();
}

function isTreeGroup(object) {
  if (!object?.isGroup || object.children.length !== 2) return false;
  const [a, b] = object.children;
  return a?.isMesh && b?.isMesh && a.geometry?.type === 'CylinderGeometry' && b.geometry?.type === 'DodecahedronGeometry';
}

function isRock(object) {
  return object?.isMesh && object.geometry?.type === 'DodecahedronGeometry' && object.position.y > 0.25;
}

function makeInstancedMesh(source, count) {
  const mesh = new THREE.InstancedMesh(source.geometry, source.material, count);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function batchEnvironment(world) {
  const trees = [];
  const rocks = [];

  world.children.slice().forEach(child => {
    if (isTreeGroup(child)) trees.push(child);
    else if (isRock(child)) rocks.push(child);
  });

  if (trees.length) {
    const trunkSource = trees[0].children[0];
    const crownSource = trees[0].children[1];
    const trunks = makeInstancedMesh(trunkSource, trees.length);
    const crowns = makeInstancedMesh(crownSource, trees.length);
    const treeMatrix = new THREE.Matrix4();
    const childMatrix = new THREE.Matrix4();

    trees.forEach((tree, i) => {
      tree.updateMatrixWorld(true);
      treeMatrix.copy(tree.matrixWorld);

      childMatrix.multiplyMatrices(treeMatrix, trunkSource.matrix);
      trunks.setMatrixAt(i, childMatrix);

      childMatrix.multiplyMatrices(treeMatrix, crownSource.matrix);
      crowns.setMatrixAt(i, childMatrix);
    });

    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();
    world.add(trunks, crowns);

    trees.slice(1).forEach(tree => {
      tree.children.forEach(disposeMeshResources);
      world.remove(tree);
    });
    world.remove(trees[0]);
  }

  if (rocks.length) {
    const source = rocks[0];
    const instanced = makeInstancedMesh(source, rocks.length);
    const matrix = new THREE.Matrix4();

    rocks.forEach((rock, i) => {
      rock.updateMatrixWorld(true);
      matrix.copy(rock.matrixWorld);
      instanced.setMatrixAt(i, matrix);
    });

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
    world.add(instanced);

    rocks.slice(1).forEach(rock => {
      disposeMeshResources(rock);
      world.remove(rock);
    });
    world.remove(rocks[0]);
  }

  return { trees: trees.length, rocks: rocks.length };
}

export function addBlobShadow(parent, radius = 0.85) {
  const geometry = new THREE.CircleGeometry(radius, 24);
  const material = new THREE.MeshBasicMaterial({
    color: 0x172018,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1
  });
  const shadow = new THREE.Mesh(geometry, material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.035;
  shadow.scale.set(1.35, 0.75, 1);
  parent.add(shadow);
  parent.userData.blobShadow = shadow;
  return shadow;
}

export function disposeObject3D(root) {
  root.traverse(object => {
    if (!object.isMesh) return;
    if (object.geometry) object.geometry.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else if (object.material) object.material.dispose();
  });
}
