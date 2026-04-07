<template>
  <div id="game-container">
    <div id="ui">
      <div id="score">Score: 0</div>
      <div id="instructions">Use A/D or Arrow Keys to switch lanes</div>
    </div>
    <div id="game-canvas"></div>
    <div v-if="gameOver" id="game-over">
      <h1>GAME OVER</h1>
      <p>Your Score: {{ score }}</p>
      <button @click="restartGame">Play Again</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';

const score = ref(0);
const gameOver = ref(false);
let scene, camera, renderer, player, clock;
let obstacles = [];
let currentLane = 1; // 0: Left, 1: Center, 2: Right
const laneWidth = 3;
let gameSpeed = 0.2;

const initGame = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('game-canvas').appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 10, 5);
  scene.add(directionalLight);

  // Ground (The track)
  const groundGeo = new THREE.PlaneGeometry(10, 1000);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Lane Markers
  for (let i = -1; i <= 1; i++) {
    const lineGeo = new THREE.PlaneGeometry(0.1, 1000);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i * laneWidth, 0.01, 0);
    scene.add(line);
  }

  // Player
  const playerGeo = new THREE.BoxGeometry(1, 1, 1);
  const playerMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  player = new THREE.Mesh(playerGeo, playerMat);
  player.position.set(currentLane * laneWidth - laneWidth, 0.5, 0);
  scene.add(player);

  clock = new THREE.Clock();
  animate();
};

const spawnObstacle = () => {
  const geo = new THREE.BoxGeometry(2, 1, 1);
  const mat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const obs = new THREE.Mesh(geo, mat);
  
  const lane = Math.floor(Math.random() * 3);
  obs.position.set(lane * laneWidth - laneWidth, 0.5, -50);
  
  scene.add(obs);
  obstacles.push(obs);
};

const animate = () => {
  if (gameOver.value) return;
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  score.value += Math.floor(delta * 10);

  // Move and spawn obstacles
  if (Math.random() < 0.05) spawnObstacle();

  obstacles.forEach((obs, index) => {
    obs.position.z += gameSpeed;

    // Collision detection
    const dist = player.position.distanceTo(obs.position);
    if (dist < 1.2) {
      gameOver.value = true;
    }

    if (obs.position.z > 15) {
      scene.remove(obs);
      obstacles.splice(index, 1);
    }
  });

  // Smooth player lane transition
  const targetX = (currentLane * laneWidth) - laneWidth;
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.2);

  renderer.render(scene, camera);
};

const handleKeyDown = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    if (currentLane > 0) currentLane--;
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    if (currentLane < 2) currentLane++;
  }
};

const restartGame = () => {
  window.location.reload();
};

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
#game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: Arial, sans-serif;
}
#ui {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  z-index: 10;
  pointer-events: none;
}
#score {
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
#instructions {
  font-size: 1rem;
  opacity: 0.8;
}
#game-canvas {
  width: 100%;
  height: 100%;
}
#game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 2rem;
  text-align: center;
  border-radius: 1rem;
  z-index: 20;
}
button {
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  cursor: pointer;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 0.5rem;
}
</style>
