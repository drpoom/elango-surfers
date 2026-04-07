<template>
  <div id="game-container">
    <div id="ui">
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="instructions">A/D or ←/→ to move | W or ↑ to Jump | Space to Restart<br>📱 Swipe ←/→ to move | Swipe ↑ to jump</div>
    </div>
    <div id="game-canvas"></div>
    <div v-if="gameOver" id="game-over">
      <h1>GAME OVER</h1>
      <p>Your Score: {{ score }}</p>
      <p>Press SPACE or click to restart</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import * as THREE from 'three';

const score = ref(0);
const highScore = ref(0);
const gameOver = ref(false);
let scene, camera, renderer, player, clock;
let obstacles = [];
let coins = [];
let currentLane = 1;
let isJumping = false;
let jumpVelocity = 0;
const jumpStrength = 0.35;
const gravity = 0.015;
const laneWidth = 3;
let gameSpeed = 0.25;
let lastSpawnTime = 0;

// Touch/swipe controls
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 50;

onMounted(() => {
  const saved = localStorage.getItem('elangoSurfersHighScore');
  if (saved) highScore.value = parseInt(saved, 10);
});

const saveHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('elangoSurfersHighScore', highScore.value.toString());
  }
};

const initGame = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);
  camera.lookAt(0, 0, -5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById('game-canvas').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const groundGeo = new THREE.PlaneGeometry(15, 1000);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = -1; i <= 1; i++) {
    const lineGeo = new THREE.PlaneGeometry(0.1, 1000);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i * laneWidth, 0.01, 0);
    scene.add(line);
  }

  const playerGroup = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.8, 1, 0.5);
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff6b35 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  playerGroup.add(body);
  
  const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const headMat = new THREE.MeshPhongMaterial({ color: 0xffd93d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.75;
  head.castShadow = true;
  playerGroup.add(head);
  
  player = playerGroup;
  player.position.set(0, 0.5, 0);
  scene.add(player);

  clock = new THREE.Clock();
  animate();
};

const spawnObstacle = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const fruitGroup = new THREE.Group();
  const colors = [0xff0000, 0xffa500, 0x8b0000, 0xff69b4];
  const fruitColor = colors[Math.floor(Math.random() * colors.length)];
  // Wider obstacle - sphere radius 1.2 (3x original)
  const fruitGeo = new THREE.SphereGeometry(1.2, 16, 16);
  const fruitMat = new THREE.MeshPhongMaterial({ color: fruitColor });
  const fruit = new THREE.Mesh(fruitGeo, fruitMat);
  fruit.castShadow = true;
  fruitGroup.add(fruit);
  
  const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5);
  const stemMat = new THREE.MeshPhongMaterial({ color: 0x228b22 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 1.0;
  fruitGroup.add(stem);
  
  fruitGroup.position.set(laneX, 0.6, -50);
  scene.add(fruitGroup);
  obstacles.push({ mesh: fruitGroup, lane });
};

const spawnCoin = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
  const coinMat = new THREE.MeshPhongMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  coin.position.set(laneX, 1, -50);
  
  scene.add(coin);
  coins.push({ mesh: coin, lane, collected: false });
};

const animate = () => {
  requestAnimationFrame(animate);

  if (gameOver.value) return;

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();
  
  score.value += Math.floor(delta * 50);

  if (time - lastSpawnTime > 1.2) {
    if (Math.random() < 0.7) spawnObstacle();
    if (Math.random() < 0.5) spawnCoin();
    lastSpawnTime = time;
  }

  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += gameSpeed;
    obs.mesh.rotation.y += 0.05;

    const dist = player.position.distanceTo(obs.mesh.position);
    // Collision detection - obstacle radius is 1.2, so use 1.5 for collision threshold
    if (dist < 1.5 && player.position.y < 1.0) {
      gameOver.value = true;
      saveHighScore();
    }

    if (obs.mesh.position.z > 15) {
      scene.remove(obs.mesh);
      obstacles.splice(index, 1);
    }
  });

  coins.forEach((coin, index) => {
    if (coin.collected) return;
    
    coin.mesh.position.z += gameSpeed;
    coin.mesh.rotation.y += 0.1;

    const dist = player.position.distanceTo(coin.mesh.position);
    if (dist < 1.2) {
      coin.collected = true;
      score.value += 100;
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    } else if (coin.mesh.position.z > 15) {
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    }
  });

  if (isJumping) {
    player.position.y += jumpVelocity;
    jumpVelocity -= gravity;
    if (player.position.y <= 0.5) {
      player.position.y = 0.5;
      isJumping = false;
      jumpVelocity = 0;
    }
  }

  const targetX = (currentLane - 1) * laneWidth;
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.15);

  renderer.render(scene, camera);
};

const handleSwipe = (direction) => {
  if (gameOver.value) return;
  
  if (direction === 'left') {
    if (currentLane > 0) currentLane--;
  } else if (direction === 'right') {
    if (currentLane < 2) currentLane++;
  } else if (direction === 'up' && !isJumping) {
    isJumping = true;
    jumpVelocity = jumpStrength;
  }
};

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  
  // Determine if horizontal or vertical swipe
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(diffY) > minSwipeDistance && diffY < 0) {
      handleSwipe('up');
    }
  }
};

const handleKeyDown = (e) => {
  // Restart on Space or Enter when game over
  if (gameOver.value && (e.key === ' ' || e.key === 'Enter')) {
    restartGame();
    return;
  }
  
  if (gameOver.value) return;
  
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    if (currentLane > 0) currentLane--;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    if (currentLane < 2) currentLane++;
  }
  
  if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !isJumping) {
    isJumping = true;
    jumpVelocity = jumpStrength;
  }
};

const restartGame = () => {
  gameOver.value = false;
  score.value = 0;
  currentLane = 1;
  isJumping = false;
  jumpVelocity = 0;
  gameSpeed = 0.25;
  
  obstacles.forEach(obs => scene.remove(obs.mesh));
  obstacles = [];
  
  coins.forEach(coin => scene.remove(coin.mesh));
  coins = [];
  
  player.position.set(0, 0.5, 0);
  
  lastSpawnTime = 0;
  clock.start();
};

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
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
#highscore {
  font-size: 1.2rem;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
#instructions {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 10px;
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
  background: rgba(0,0,0,0.85);
  color: white;
  padding: 2rem;
  text-align: center;
  border-radius: 1rem;
  z-index: 20;
}
button {
  padding: 0.7rem 1.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
  border: none;
  border-radius: 0.5rem;
  margin-top: 1rem;
  transition: transform 0.2s;
}
button:hover {
  transform: scale(1.05);
}
</style>
