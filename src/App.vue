<template>
  <div id="game-container">
    <div id="ui">
      <div id="version">v1.3.0 Tier 3</div>
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="combo" v-if="comboCount > 1">🔥 Combo x{{ comboCount }}</div>
      <div id="powerup-indicator" v-if="activePowerup">{{ powerupIcon }} {{ powerupName }} ({{ powerupTimeLeft }}s)</div>
      <div id="mute-btn" @click="toggleMute">🔊</div>
      <div id="settings-btn" @click="toggleSettings">⚙️</div>
      <div id="instructions">A/D or ←/→ to move | W or ↑ to Jump | Space to Restart<br>📱 Swipe ←/→ to move | Swipe ↑ to jump<br>⚡ Speed increases over time!</div>
    </div>
    <div id="game-canvas"></div>
    <div v-if="gameOver" id="game-over">
      <h1>GAME OVER</h1>
      <p>Your Score: {{ score }}</p>
      <p>Press SPACE or click to restart</p>
    </div>
    <div v-if="showSettings" id="settings-panel">
      <h2>⚙️ Settings</h2>
      <button @click="toggleSettings">Close</button>
      <div class="settings-section">
        <h3>🎨 Skins</h3>
        <div class="skin-selector">
          <button 
            v-for="(skin, i) in [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21]" 
            :key="i"
            :style="{ background: '#' + skin.toString(16).padStart(6, '0') }"
            @click="currentSkin = i"
            :disabled="!unlockedSkins.includes(i)"
          >{{ unlockedSkins.includes(i) ? '🎨' : '🔒' }}</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>🎩 Hats</h3>
        <div class="hat-selector">
          <button @click="currentHat = null" :class="{ selected: currentHat === null }">None</button>
          <button 
            v-for="hat in ['cap', 'crown', 'helmet']" 
            :key="hat"
            @click="currentHat = hat"
            :disabled="!unlockedHats.includes(hat)"
            :class="{ selected: currentHat === hat }"
          >{{ unlockedHats.includes(hat) ? hat.charAt(0).toUpperCase() + hat.slice(1) : '🔒 ' + hat }}</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>🏆 Achievements ({{ achievements.filter(a => a.unlocked).length }}/{{ ACHIEVEMENTS.length }})</h3>
        <ul class="achievement-list">
          <li v-for="ach in ACHIEVEMENTS" :key="ach.id" :class="{ unlocked: ach.unlocked }">
            {{ ach.unlocked ? '✅' : '🔒' }} {{ ach.name }}
          </li>
        </ul>
      </div>
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

const playSound = (type, pitchMod = 1) => {
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
    case 'powerup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(800 * pitchMod, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'achievement':
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      osc.frequency.setValueAtTime(1047, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'shield_hit':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
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

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Achievement system
const ACHIEVEMENTS = [
  { id: 'first_coin', name: 'First Coin!', desc: 'Collect your first coin', unlocked: false, condition: (stats) => stats.totalCoins >= 1 },
  { id: 'coin_100', name: 'Coin Collector', desc: 'Collect 100 coins total', unlocked: false, condition: (stats) => stats.totalCoins >= 100 },
  { id: 'survive_60', name: 'Survivor', desc: 'Survive 60 seconds', unlocked: false, condition: (stats) => stats.maxTime >= 60 },
  { id: 'combo_5', name: 'Combo Master', desc: 'Get 5x combo', unlocked: false, condition: (stats) => stats.maxCombo >= 5 },
  { id: 'score_5000', name: 'High Flyer', desc: 'Score 5000 points', unlocked: false, condition: (stats) => stats.maxScore >= 5000 },
  { id: 'powerup_first', name: 'Powered Up', desc: 'Collect first power-up', unlocked: false, condition: (stats) => stats.powerupsCollected >= 1 },
  { id: 'powerup_10', name: 'Power User', desc: 'Collect 10 power-ups', unlocked: false, condition: (stats) => stats.powerupsCollected >= 10 },
  { id: 'night_runner', name: 'Night Runner', desc: 'Play at night', unlocked: false, condition: (stats) => stats.nightTime >= 10 },
  { id: 'skin_unlock', name: 'Fashion Forward', desc: 'Unlock a skin', unlocked: false, condition: (stats) => stats.skinsUnlocked >= 1 },
  { id: 'hat_unlock', name: 'Hat Collector', desc: 'Unlock a hat', unlocked: false, condition: (stats) => stats.hatsUnlocked >= 1 },
  { id: 'perfect_run', name: 'Untouchable', desc: 'Get 1000 points without dying', unlocked: false, condition: (stats) => stats.bestRun >= 1000 },
  { id: 'magnet_master', name: 'Magnet Master', desc: 'Collect 20 coins with magnet', unlocked: false, condition: (stats) => stats.magnetCoins >= 20 }
];

let gameStats = {
  totalCoins: 0,
  maxTime: 0,
  maxCombo: 0,
  maxScore: 0,
  powerupsCollected: 0,
  nightTime: 0,
  skinsUnlocked: 0,
  hatsUnlocked: 0,
  bestRun: 0,
  magnetCoins: 0
};

const loadProgress = () => {
  const saved = localStorage.getItem('elangoSurfersProgress');
  if (saved) {
    const data = JSON.parse(saved);
    gameStats = { ...gameStats, ...data.stats };
    unlockedSkins.value = data.unlockedSkins || [0];
    unlockedHats.value = data.unlockedHats || [];
    currentSkin.value = data.currentSkin || 0;
    currentHat.value = data.currentHat || null;
  }
};

const saveProgress = () => {
  localStorage.setItem('elangoSurfersProgress', JSON.stringify({
    stats: gameStats,
    unlockedSkins: unlockedSkins.value,
    unlockedHats: unlockedHats.value,
    currentSkin: currentSkin.value,
    currentHat: currentHat.value
  }));
};

const checkAchievements = () => {
  ACHIEVEMENTS.forEach(ach => {
    if (!ach.unlocked && ach.condition(gameStats)) {
      ach.unlocked = true;
      achievements.value.push(ach);
      playSound('achievement');
      createFloatingText('🏆 ' + ach.name, player.position.clone().add(new THREE.Vector3(0, 2, 0)));
      
      // Unlock rewards
      if (ach.id === 'coin_100') {
        if (!unlockedSkins.value.includes(1)) {
          unlockedSkins.value.push(1);
          gameStats.skinsUnlocked++;
          createFloatingText('🎨 Skin Unlocked!', player.position.clone().add(new THREE.Vector3(0, 2.5, 0)));
        }
      }
      if (ach.id === 'score_5000') {
        if (!unlockedHats.value.includes('cap')) {
          unlockedHats.value.push('cap');
          gameStats.hatsUnlocked++;
          createFloatingText('🎩 Hat Unlocked!', player.position.clone().add(new THREE.Vector3(0, 2.5, 0)));
        }
      }
      saveProgress();
    }
  });
};

const score = ref(0);
const highScore = ref(0);
const gameOver = ref(false);
const showSettings = ref(false);
const achievements = ref([]);
const unlockedSkins = ref([0]);
const currentSkin = ref(0);
const unlockedHats = ref([]);
const currentHat = ref(null);

// Power-up state
let activePowerup = null;
let powerupEndTime = 0;
let powerupIcon = '';
let powerupName = '';
let powerupTimeLeft = ref(0);
let scoreMultiplier = 1;
let magnetRange = 0;
let isInvincible = false;

// Day/night cycle
let dayCycleTime = 0;
const DAY_DURATION = 60; // seconds per full cycle
let scene, camera, renderer, player, clock;
let obstacles = [];
let coins = [];
let powerups = [];
let particles = [];
let floatingTexts = [];
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
  loadProgress();
  checkAchievements();
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
  const skinColors = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const bodyMat = new THREE.MeshToonMaterial({ color: skinColors[currentSkin.value] });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  playerGroup.add(body);
  
  const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const headMat = new THREE.MeshToonMaterial({ color: 0xffd93d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.6;
  head.castShadow = true;
  playerGroup.add(head);
  
  // Add hat if equipped
  if (currentHat.value === 'cap') {
    const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
    const capMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.95;
    cap.castShadow = true;
    playerGroup.add(cap);
    
    const brimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.9, 0.25);
    brim.rotation.x = 0.2;
    brim.castShadow = true;
    playerGroup.add(brim);
  } else if (currentHat.value === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.3, 6);
    const crownMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.9;
    crown.castShadow = true;
    playerGroup.add(crown);
  } else if (currentHat.value === 'helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = new THREE.MeshToonMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.92;
    helmet.castShadow = true;
    playerGroup.add(helmet);
  }
  
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

const updateDayNightCycle = (delta) => {
  const cycleProgress = dayCycleTime / DAY_DURATION; // 0 to 1
  
  // Sky color interpolation: day (blue) -> sunset (orange) -> night (dark) -> sunrise (pink) -> day
  let skyColor, fogColor;
  const dayColor = new THREE.Color(0x87ceeb);
  const sunsetColor = new THREE.Color(0xff7f50);
  const nightColor = new THREE.Color(0x0a0a2e);
  const sunriseColor = new THREE.Color(0xffb6c1);
  
  if (cycleProgress < 0.25) {
    // Day -> Sunset
    const t = cycleProgress / 0.25;
    skyColor = dayColor.clone().lerp(sunsetColor, t);
    fogColor = skyColor.clone();
  } else if (cycleProgress < 0.5) {
    // Sunset -> Night
    const t = (cycleProgress - 0.25) / 0.25;
    skyColor = sunsetColor.clone().lerp(nightColor, t);
    fogColor = skyColor.clone();
  } else if (cycleProgress < 0.75) {
    // Night -> Sunrise
    const t = (cycleProgress - 0.5) / 0.25;
    skyColor = nightColor.clone().lerp(sunriseColor, t);
    fogColor = skyColor.clone();
  } else {
    // Sunrise -> Day
    const t = (cycleProgress - 0.75) / 0.25;
    skyColor = sunriseColor.clone().lerp(dayColor, t);
    fogColor = skyColor.clone();
  }
  
  scene.background = skyColor;
  scene.fog.color = fogColor;
  
  // Track night time for achievements
  if (cycleProgress > 0.35 && cycleProgress < 0.65) {
    gameStats.nightTime += delta;
    checkAchievements();
  }
  
  // Adjust lighting
  const directionalLight = scene.children.find(c => c.isDirectionalLight);
  if (directionalLight) {
    directionalLight.intensity = cycleProgress > 0.25 && cycleProgress < 0.75 ? 0.5 : 1.0;
  }
  
  // Stars at night
  if (!scene.userData.starsCreated && (cycleProgress > 0.35 || cycleProgress < 0.15)) {
    createStars();
    scene.userData.starsCreated = true;
  } else if (scene.userData.starsCreated && cycleProgress >= 0.15 && cycleProgress <= 0.35) {
    // Remove stars during day
    const stars = scene.getObjectByName('stars');
    if (stars) {
      scene.remove(stars);
      scene.userData.starsCreated = false;
    }
  }
};

const createStars = () => {
  const starsGroup = new THREE.Group();
  starsGroup.name = 'stars';
  
  const starGeo = new THREE.SphereGeometry(0.1, 4, 4);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  for (let i = 0; i < 200; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(
      (Math.random() - 0.5) * 100,
      20 + Math.random() * 30,
      (Math.random() - 0.5) * 100 - 30
    );
    starsGroup.add(star);
  }
  
  scene.add(starsGroup);
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

const spawnPowerup = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  const type = Math.random() < 0.33 ? 'shield' : (Math.random() < 0.5 ? 'speed' : 'magnet');
  
  const powerupGroup = new THREE.Group();
  
  if (type === 'shield') {
    const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const orbMat = new THREE.MeshToonMaterial({ 
      color: 0x00bfff, 
      emissive: 0x00bfff, 
      emissiveIntensity: 0.5,
      transparent: true, 
      opacity: 0.8 
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    powerupGroup.add(orb);
    
    const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00bfff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    powerupGroup.add(ring);
  } else if (type === 'speed') {
    const boltGeo = new THREE.ConeGeometry(0.3, 1, 8);
    const boltMat = new THREE.MeshToonMaterial({ 
      color: 0xffd700, 
      emissive: 0xffd700, 
      emissiveIntensity: 0.6 
    });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.rotation.x = Math.PI / 2;
    powerupGroup.add(bolt);
  } else if (type === 'magnet') {
    const waveGeo = new THREE.TorusGeometry(0.6, 0.1, 8, 16);
    const waveMat = new THREE.MeshToonMaterial({ 
      color: 0x9932cc, 
      emissive: 0x9932cc, 
      emissiveIntensity: 0.5,
      transparent: true, 
      opacity: 0.7 
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    powerupGroup.add(wave);
    
    const wave2 = wave.clone();
    wave2.scale.setScalar(1.3);
    wave2.material = waveMat.clone();
    wave2.material.opacity = 0.4;
    powerupGroup.add(wave2);
  }
  
  powerupGroup.position.set(laneX, 1, -50);
  powerupGroup.userData = { type };
  scene.add(powerupGroup);
  powerups.push({ mesh: powerupGroup, lane, type, collected: false });
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

const createFloatingText = (text, position) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.textAlign = 'center';
  ctx.strokeText(text, 256, 80);
  ctx.fillText(text, 256, 80);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(4, 1, 1);
  sprite.userData = { life: 2.0, velocity: new THREE.Vector3(0, 0.5, 0) };
  scene.add(sprite);
  floatingTexts.push(sprite);
};

const animate = () => {
  requestAnimationFrame(animate);

  if (gameOver.value) return;

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();
  
  gameDuration += delta;
  dayCycleTime = (dayCycleTime + delta) % DAY_DURATION;
  
  // Day/night cycle
  updateDayNightCycle(delta);
  
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
    if (Math.random() < 0.5 + (gameDuration / 120)) spawnCoin();
    if (Math.random() < 0.05) spawnPowerup(); // 5% chance per spawn
    lastSpawnTime = time;
  }

  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += gameSpeed;
    obs.mesh.rotation.y += 0.05;

    const dist = player.position.distanceTo(obs.mesh.position);
    // Collision detection - obstacle radius is 1.2, so use 1.5 for collision threshold
    if (dist < 1.5 && player.position.y < 1.0) {
      if (isInvincible) {
        // Shield blocks the hit
        playSound('shield_hit');
        createParticleEffect(obs.mesh.position, 0x00bfff, 15);
        deactivatePowerup();
        scene.remove(obs.mesh);
        obstacles.splice(index, 1);
      } else {
        gameOver.value = true;
        saveHighScore();
        playSound('crash');
        createParticleEffect(player.position, 0xff0000, 30);
        comboCount = 0;
        
        // Update stats
        if (score.value > gameStats.maxScore) gameStats.maxScore = score.value;
        if (gameDuration > gameStats.maxTime) gameStats.maxTime = gameDuration;
        if (score.value > gameStats.bestRun) gameStats.bestRun = score.value;
        saveProgress();
      }
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
    // Magnet effect
    if (magnetRange > 0 && dist < magnetRange) {
      coin.mesh.position.lerp(player.position, 0.1);
    }
    
    if (dist < 1.2) {
      coin.collected = true;
      comboCount++;
      if (comboCount > gameStats.maxCombo) gameStats.maxCombo = comboCount;
      const now = Date.now();
      const comboBonus = comboCount > 1 && (now - lastCoinTime) < 1000 ? comboCount * 10 : 0;
      score.value += (100 + comboBonus) * scoreMultiplier;
      lastCoinTime = now;
      gameStats.totalCoins++;
      
      if (magnetRange > 0) gameStats.magnetCoins++;
      
      createParticleEffect(coin.mesh.position, 0xffd700, 15);
      createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), coin.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      playSound('coin', 0.9 + Math.random() * 0.2);
      
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    } else if (coin.mesh.position.z > 15) {
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    }
  });

  powerups.forEach((pw, index) => {
    if (pw.collected) return;
    
    pw.mesh.position.z += gameSpeed;
    pw.mesh.rotation.y += 0.15;
    
    // Animate rings
    if (pw.type === 'shield') {
      pw.mesh.children[1].rotation.z += 0.05;
    } else if (pw.type === 'magnet') {
      pw.mesh.children.forEach((c, i) => {
        c.scale.setScalar(1 + Math.sin(time * 5 + i) * 0.2);
      });
    }

    const dist = player.position.distanceTo(pw.mesh.position);
    if (dist < 1.2) {
      pw.collected = true;
      gameStats.powerupsCollected++;
      activatePowerup(pw.type);
      playSound('powerup', 0.9 + Math.random() * 0.2);
      createParticleEffect(pw.mesh.position, pw.type === 'shield' ? 0x00bfff : (pw.type === 'speed' ? 0xffd700 : 0x9932cc), 20);
      createFloatingText(pw.type === 'shield' ? '🛡️ SHIELD' : (pw.type === 'speed' ? '⚡ SPEED' : '🧲 MAGNET'), pw.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      
      scene.remove(pw.mesh);
      powerups.splice(index, 1);
    } else if (pw.mesh.position.z > 15) {
      scene.remove(pw.mesh);
      powerups.splice(index, 1);
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
  
  // Animate floating texts
  floatingTexts.forEach((text, index) => {
    text.position.add(text.userData.velocity);
    text.userData.velocity.y -= 0.02;
    text.userData.life -= 0.02;
    text.material.opacity = text.userData.life / 2.0;
    text.scale.setScalar(text.userData.life);
    
    if (text.userData.life <= 0) {
      scene.remove(text);
      floatingTexts.splice(index, 1);
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

  // Power-up timer
  if (activePowerup) {
    powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
    if (powerupTimeLeft.value <= 0) {
      deactivatePowerup();
    }
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

const activatePowerup = (type) => {
  activePowerup = type;
  const now = Date.now();
  
  if (type === 'shield') {
    powerupEndTime = now + 10000; // 10s
    powerupIcon = '🛡️';
    powerupName = 'Shield';
    isInvincible = true;
    
    // Add shield aura to player
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshToonMaterial({ 
      color: 0x00bfff, 
      transparent: true, 
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.name = 'shield-aura';
    player.add(shield);
    
  } else if (type === 'speed') {
    powerupEndTime = now + 5000; // 5s
    powerupIcon = '⚡';
    powerupName = 'Speed';
    scoreMultiplier = 2;
    
  } else if (type === 'magnet') {
    powerupEndTime = now + 15000; // 15s
    powerupIcon = '🧲';
    powerupName = 'Magnet';
    magnetRange = 5;
  }
};

const deactivatePowerup = () => {
  if (activePowerup === 'shield') {
    isInvincible = false;
    const shield = player.getObjectByName('shield-aura');
    if (shield) player.remove(shield);
  } else if (activePowerup === 'speed') {
    scoreMultiplier = 1;
  } else if (activePowerup === 'magnet') {
    magnetRange = 0;
  }
  
  activePowerup = null;
  powerupTimeLeft.value = 0;
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
  scoreMultiplier = 1;
  magnetRange = 0;
  isInvincible = false;
  activePowerup = null;
  
  // Update stats
  if (score.value > gameStats.maxScore) gameStats.maxScore = score.value;
  if (gameDuration > gameStats.maxTime) gameStats.maxTime = gameDuration;
  if (score.value > gameStats.bestRun) gameStats.bestRun = score.value;
  
  obstacles.forEach(obs => scene.remove(obs.mesh));
  obstacles = [];
  
  coins.forEach(coin => scene.remove(coin.mesh));
  coins = [];
  
  powerups.forEach(pw => scene.remove(pw.mesh));
  powerups = [];
  
  particles.forEach(p => scene.remove(p));
  particles = [];
  
  floatingTexts.forEach(t => scene.remove(t));
  floatingTexts = [];
  
  player.position.set(0, 0.5, 0);
  
  // Remove shield aura if exists
  const shield = player.getObjectByName('shield-aura');
  if (shield) player.remove(shield);
  
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
  
  // Pause on P key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      toggleSettings();
    }
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
#settings-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  pointer-events: auto;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
#settings-btn:hover {
  transform: scale(1.1);
}
#settings-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.95);
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  z-index: 30;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}
#settings-panel h2 {
  margin-top: 0;
  text-align: center;
}
#settings-panel h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.1rem;
}
.settings-section {
  margin-bottom: 1.5rem;
}
.skin-selector, .hat-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.skin-selector button {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid white;
  cursor: pointer;
  font-size: 1.2rem;
}
.hat-selector button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 2px solid white;
  background: #333;
  color: white;
  cursor: pointer;
}
.hat-selector button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hat-selector button.selected {
  background: #ff6b35;
}
.achievement-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.achievement-list li {
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.achievement-list li.unlocked {
  background: rgba(255,215,0,0.2);
  border-left: 3px solid gold;
}
#combo {
  font-size: 1.5rem;
  color: #ff6b35;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: pulse 0.5s ease-in-out;
}
#powerup-indicator {
  font-size: 1.2rem;
  color: #00bfff;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
