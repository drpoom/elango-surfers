<template>
  <div id="game-container">
    <div id="ui">
      <div id="version">v1.2.0 Tier 2</div>
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="mute-btn" @click="toggleMute">🔊</div>
      <div id="instructions">A/D or ←/→ to move | W or ↑ to Jump | Space to Restart<br>📱 Swipe ←/→ to move | Swipe ↑ to jump<br>⚡ Speed increases over time!</div>
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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Audio system
let audioCtx = null;
let isMuted = false;
let audioInitialized = false;

const initAudio = () => {
  if (audioInitialized) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioInitialized = true;
  // Resume context if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playSound = (type) => {
  if (isMuted) return;
  
  // Initialize audio on first sound if not already done
  if (!audioCtx) {
    initAudio();
  }
  
  if (!audioCtx || audioCtx.state === 'suspended') {
    if (audioCtx) audioCtx.resume();
    return;
  }
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  switch (type) {
    case 'jump':
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'coin':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'crash':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'start':
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
  }
};

const toggleMute = () => {
  isMuted = !isMuted;
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
  }
  if (audioCtx) {
    if (isMuted) {
      audioCtx.suspend();
    } else {
      audioCtx.resume();
    }
  }
};

const score = ref(0);
const highScore = ref(0);
const gameOver = ref(false);
let scene, camera, renderer, player, clock;
let obstacles = [];
let coins = [];
let particles = [];
let currentLane = 1;
let isJumping = false;
let jumpVelocity = 0;
const jumpStrength = 0.35;
const gravity = 0.015;
const laneWidth = 3;
let gameSpeed = 0.25;
let lastSpawnTime = 0;
let spawnInterval = 1.2;
let gameDuration = 0;
let comboCount = 0;
let lastCoinTime = 0;

// Touch/swipe controls
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 50;

// Environment elements
let clouds = [];
let trees = [];
let buildings = [];
let composer;
let groundTexture;

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
  
  // Colorful cartoon sky with gradient fog
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);
  camera.lookAt(0, 0, -5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('game-canvas').appendChild(renderer.domElement);

  // Post-processing for bloom effect
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,  // strength
    0.5,  // radius
    0.85  // threshold
  );
  composer.addPass(bloomPass);

  // Enhanced cartoon lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffd700, 1.0);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);
  
  // Hemisphere light for colorful sky/ground contrast
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8bc34a, 0.4);
  scene.add(hemiLight);

  // Create textured ground with cartoon style
  createGround();
  
  // Add lane markers
  createLaneMarkers();
  
  // Add decorative environment
  createClouds();
  createBackgroundElements();

  const playerGroup = new THREE.Group();
  const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.8, 8, 8);
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xff6b35 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  playerGroup.add(body);
  
  const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const headMat = new THREE.MeshToonMaterial({ color: 0xffd93d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.6;
  head.castShadow = true;
  playerGroup.add(head);
  
  // Add cute eyes
  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.12, 0.65, 0.28);
  playerGroup.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.12, 0.65, 0.28);
  playerGroup.add(rightEye);
  
  player = playerGroup;
  player.position.set(0, 0.5, 0);
  scene.add(player);

  clock = new THREE.Clock();
  animate();
};

const createGround = () => {
  // Create striped cartoon road texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base asphalt color
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 512, 512);
  
  // Add noise/texture
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  
  groundTexture = new THREE.CanvasTexture(canvas);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(1, 10);
  
  const groundGeo = new THREE.PlaneGeometry(15, 200);
  const groundMat = new THREE.MeshToonMaterial({ 
    map: groundTexture,
    color: 0x555555
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -50;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add colorful grass borders
  const grassGeo = new THREE.PlaneGeometry(30, 200);
  const grassMat = new THREE.MeshToonMaterial({ color: 0x8bc34a });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.z = -50;
  grass.position.y = -0.1;
  grass.receiveShadow = true;
  scene.add(grass);
};

const createLaneMarkers = () => {
  const colors = [0xffffff, 0xffd700, 0xffffff];
  for (let i = -1; i <= 1; i++) {
    const lineGeo = new THREE.PlaneGeometry(0.15, 200);
    const lineMat = new THREE.MeshBasicMaterial({ 
      color: colors[i + 1], 
      opacity: 0.6, 
      transparent: true 
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i * laneWidth, 0.02, -50);
    scene.add(line);
  }
};

const createClouds = () => {
  const cloudGeo = new THREE.SphereGeometry(1, 8, 8);
  const cloudMat = new THREE.MeshToonMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.9 
  });
  
  for (let i = 0; i < 15; i++) {
    const cloud = new THREE.Group();
    const puffCount = 3 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < puffCount; j++) {
      const puff = new THREE.Mesh(cloudGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 2
      );
      puff.scale.setScalar(0.8 + Math.random() * 0.6);
      cloud.add(puff);
    }
    
    cloud.position.set(
      (Math.random() - 0.5) * 40,
      8 + Math.random() * 4,
      -Math.random() * 60
    );
    cloud.castShadow = true;
    scene.add(cloud);
    clouds.push(cloud);
  }
};

const createBackgroundElements = () => {
  // Create stylized low-poly trees
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
  const trunkMat = new THREE.MeshToonMaterial({ color: 0x8b4513 });
  const leavesGeo = new THREE.ConeGeometry(1.5, 3, 6);
  const leavesColors = [0x228b22, 0x32cd32, 0x8fbc8f, 0x90ee90];
  
  for (let i = 0; i < 20; i++) {
    const tree = new THREE.Group();
    
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    tree.add(trunk);
    
    const leavesMat = new THREE.MeshToonMaterial({ 
      color: leavesColors[Math.floor(Math.random() * leavesColors.length)] 
    });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3;
    leaves.castShadow = true;
    tree.add(leaves);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    tree.position.set(
      side * (8 + Math.random() * 10),
      0,
      -Math.random() * 80
    );
    tree.scale.setScalar(0.8 + Math.random() * 0.4);
    scene.add(tree);
    trees.push(tree);
  }
  
  // Add colorful cartoon buildings in distance
  const buildingColors = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd];
  for (let i = 0; i < 12; i++) {
    const height = 5 + Math.random() * 10;
    const width = 3 + Math.random() * 4;
    const buildingGeo = new THREE.BoxGeometry(width, height, width);
    const buildingMat = new THREE.MeshToonMaterial({ 
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)] 
    });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    building.position.set(
      side * (15 + Math.random() * 10),
      height / 2,
      -30 - Math.random() * 50
    );
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    buildings.push(building);
  }
};

const spawnObstacle = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const fruitGroup = new THREE.Group();
  const colors = [0xff0000, 0xffa500, 0x8b0000, 0xff69b4];
  const fruitColor = colors[Math.floor(Math.random() * colors.length)];
  // Wider obstacle - sphere radius 1.2 (3x original)
  const fruitGeo = new THREE.SphereGeometry(1.2, 24, 24);
  const fruitMat = new THREE.MeshToonMaterial({ color: fruitColor });
  const fruit = new THREE.Mesh(fruitGeo, fruitMat);
  fruit.castShadow = true;
  fruitGroup.add(fruit);
  
  const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
  const stemMat = new THREE.MeshToonMaterial({ color: 0x228b22 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 1.0;
  fruitGroup.add(stem);
  
  // Add leaf
  const leafGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const leafMat = new THREE.MeshToonMaterial({ color: 0x32cd32 });
  const leaf = new THREE.Mesh(leafGeo, leafMat);
  leaf.position.set(0.2, 1.2, 0);
  leaf.scale.set(1, 0.3, 1);
  fruitGroup.add(leaf);
  
  fruitGroup.position.set(laneX, 0.6, -50);
  scene.add(fruitGroup);
  obstacles.push({ mesh: fruitGroup, lane });
};

const spawnCoin = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
  const coinMat = new THREE.MeshToonMaterial({ 
    color: 0xffd700,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3
  });
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.castShadow = true;
  coin.position.set(laneX, 1, -50);
  
  scene.add(coin);
  coins.push({ mesh: coin, lane, collected: false });
};

const createParticleEffect = (position, color, count = 10) => {
  const particleGeo = new THREE.SphereGeometry(0.1, 4, 4);
  const particleMat = new THREE.MeshBasicMaterial({ color });
  
  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3 + 0.2,
      (Math.random() - 0.5) * 0.3
    );
    particle.life = 1.0;
    scene.add(particle);
    particles.push(particle);
  }
};

const animate = () => {
  requestAnimationFrame(animate);

  if (gameOver.value) return;

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();
  
  gameDuration += delta;
  
  // Progressive difficulty scaling
  // Speed increases every 30 seconds, caps at 2x base speed
  const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 2);
  const targetSpeed = 0.25 * difficultyMultiplier;
  gameSpeed = THREE.MathUtils.lerp(gameSpeed, targetSpeed, 0.01);
  
  // Spawn interval decreases over time (more obstacles)
  spawnInterval = Math.max(0.6, 1.2 - (gameDuration / 60));
  
  score.value += Math.floor(delta * 50 * difficultyMultiplier);

  if (time - lastSpawnTime > spawnInterval) {
    if (Math.random() < 0.7) spawnObstacle();
    if (Math.random() < 0.5 + (gameDuration / 120)) spawnCoin(); // More coins over time
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
      playSound('crash');
      createParticleEffect(player.position, 0xff0000, 30);
      comboCount = 0;
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
      comboCount++;
      const now = Date.now();
      const comboBonus = comboCount > 1 && (now - lastCoinTime) < 1000 ? comboCount * 10 : 0;
      score.value += 100 + comboBonus;
      lastCoinTime = now;
      
      createParticleEffect(coin.mesh.position, 0xffd700, 15);
      playSound('coin');
      
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    } else if (coin.mesh.position.z > 15) {
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    }
  });

  // Animate clouds drifting
  clouds.forEach((cloud, i) => {
    cloud.position.z += 0.02;
    if (cloud.position.z > 10) {
      cloud.position.z = -60 - Math.random() * 20;
      cloud.position.x = (Math.random() - 0.5) * 40;
    }
  });
  
  // Animate trees moving
  trees.forEach((tree) => {
    tree.position.z += gameSpeed;
    if (tree.position.z > 10) {
      const side = tree.position.x > 0 ? 1 : -1;
      tree.position.z = -Math.random() * 80;
      tree.position.x = side * (8 + Math.random() * 10);
    }
  });
  
  // Animate buildings moving
  buildings.forEach((building) => {
    building.position.z += gameSpeed;
    if (building.position.z > 20) {
      const side = building.position.x > 0 ? 1 : -1;
      building.position.z = -30 - Math.random() * 50;
      building.position.x = side * (15 + Math.random() * 10);
    }
  });
  
  // Animate particles
  particles.forEach((particle, index) => {
    particle.position.add(particle.velocity);
    particle.velocity.y -= 0.01;
    particle.life -= 0.02;
    particle.scale.setScalar(particle.life);
    
    if (particle.life <= 0) {
      scene.remove(particle);
      particles.splice(index, 1);
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
  
  // Add subtle player bobbing animation
  if (!isJumping) {
    player.position.y = 0.5 + Math.sin(time * 10) * 0.05;
  }

  const targetX = (currentLane - 1) * laneWidth;
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.15);
  
  // Add slight tilt when moving
  const tiltAmount = (player.position.x - targetX) * 0.1;
  player.rotation.z = tiltAmount;
  player.rotation.x = Math.sin(time * 10) * 0.05;

  composer.render();
};

const handleSwipe = (direction) => {
  if (gameOver.value) return;
  
  if (direction === 'left') {
    if (currentLane > 0) currentLane--;
  } else if (direction === 'right') {
    if (currentLane < 2) currentLane++;
  } else if (direction === 'up') {
    handleJump();
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

const handleJump = () => {
  if (isJumping) return;
  isJumping = true;
  jumpVelocity = jumpStrength;
  playSound('jump');
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
    handleJump();
  }
};

const restartGame = () => {
  gameOver.value = false;
  score.value = 0;
  currentLane = 1;
  isJumping = false;
  jumpVelocity = 0;
  gameSpeed = 0.25;
  spawnInterval = 1.2;
  gameDuration = 0;
  comboCount = 0;
  
  obstacles.forEach(obs => scene.remove(obs.mesh));
  obstacles = [];
  
  coins.forEach(coin => scene.remove(coin.mesh));
  coins = [];
  
  particles.forEach(p => scene.remove(p));
  particles = [];
  
  player.position.set(0, 0.5, 0);
  
  lastSpawnTime = 0;
  clock.start();
  playSound('start');
};

onMounted(() => {
  const saved = localStorage.getItem('elangoSurfersHighScore');
  if (saved) highScore.value = parseInt(saved, 10);
  initGame();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('click', () => {
    if (gameOver.value) restartGame();
    initAudio();
  });
  
  // Also initialize audio on any keypress
  window.addEventListener('keydown', () => {
    initAudio();
  }, { once: true });
  
  // Initialize audio on touch
  window.addEventListener('touchstart', () => {
    initAudio();
  }, { once: true, passive: true });
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
  if (composer) composer.dispose();
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
#version {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-bottom: 5px;
  font-family: monospace;
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
