<template>
  <div id="game-container">
    <div id="ui">
      <div id="version">{{ VERSION }}</div>
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="combo" v-if="comboCount > 1">🔥 Combo x{{ comboCount }}</div>
      <div id="powerup-indicator" v-if="activePowerup">{{ powerupIcon }} {{ powerupName }} ({{ powerupTimeLeft }}s)</div>
      <div id="fly-indicator" v-if="micEnabledRef">🎤✈️</div>
      <div id="mute-btn" @click="toggleMute">🔊</div>
      <div id="tilt-btn" @click="toggleTilt">{{ tiltEnabledRef ? '📱' : '📱🔴' }}</div>
      <div id="mic-btn" @click="toggleMic">{{ micEnabledRef ? '🎤' : '🎤🔴' }}</div>
      <div id="settings-btn" @click="toggleSettings">⚙️</div>
      <div id="instructions">A/D ←/→ Move | W/↑ Jump | S/↓ Slide | Space Restart<br>📱 Swipe | Tilt | 🎤 Blow to fly!<br>⚡ Speed increases over time!</div>
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

// Version - Update this for each release
const VERSION = 'v2.3.3 Mic Sensitivity';

// Audio system
let audioCtx = null;
let isMuted = false;
let audioInitialized = false;
let bgmOscillators = [];
let bgmGain = null;
let isBGMPlaying = false;
let bgmInterval = null;

const initAudio = () => {
  if (audioInitialized) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioInitialized = true;
  // Resume context if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log('Audio resumed, starting BGM');
      startBGM();
    }).catch(err => console.log('Audio resume failed:', err));
  } else {
    console.log('Audio already running, starting BGM');
    startBGM();
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
      // Restart BGM if it stopped
      if (!isBGMPlaying) {
        startBGM();
      }
    }
  }
};

// Action BGM - continuous looping electronic track
const startBGM = () => {
  if (!audioCtx || isBGMPlaying || isMuted) return;
  
  isBGMPlaying = true;
  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = 0.15; // Quieter background level
  bgmGain.connect(audioCtx.destination);
  
  // Play one bar of music
  const playBar = () => {
    if (!isBGMPlaying || !audioCtx || audioCtx.state !== 'running') return;
    
    const now = audioCtx.currentTime;
    
    // Bass: 4 notes (A-C-G-A)
    const bassFreqs = [110, 130, 98, 110];
    bassFreqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bgmGain);
      
      const startTime = now + (i * 0.25);
      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.start(startTime);
      osc.stop(startTime + 0.25);
      bgmOscillators.push(osc);
    });
    
    // Hi-hats: 8 notes
    for (let i = 0; i < 8; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1500;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bgmGain);
      
      const startTime = now + (i * 0.125);
      const vol = (i % 2 === 0) ? 0.15 : 0.08;
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.06);
      
      osc.start(startTime);
      osc.stop(startTime + 0.1);
      bgmOscillators.push(osc);
    }
  };
  
  // Play first bar immediately
  playBar();
  
  // Loop every 1 second using setInterval (more reliable than setTimeout)
  bgmInterval = setInterval(() => {
    if (isBGMPlaying && !isMuted && audioCtx && audioCtx.state === 'running') {
      playBar();
    }
  }, 1000);
};

const stopBGM = () => {
  isBGMPlaying = false;
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  bgmOscillators = [];
  if (bgmGain) {
    bgmGain.disconnect();
    bgmGain = null;
  }
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
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
const tiltEnabledRef = ref(true);
const micEnabledRef = ref(false);
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
let isSliding = false;
let slideTimer = 0;
const slideDuration = 0.6;
const gravity = 0.015;
const laneWidth = 3;

// Voice/fly controls
let micStream = null;
let micAnalyser = null;
let micDataArray = null;
let micEnabled = false;
let isFlying = false;
let flyVelocity = 0;
const FLY_LIFT = 0.02; // Upward force when blowing
const FLY_GRAVITY = 0.008; // Gravity when not blowing (gentler than jump gravity)
const FLY_MAX_HEIGHT = 4.0; // Max fly height
const MIC_THRESHOLD = 15; // Volume level to sustain flying (0-128)
const MIC_PEAK_THRESHOLD = 35; // Spike to start flying
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

// Tilt/gyro controls
let tiltEnabled = true;
let tiltInitialBeta = null; // Calibrate on enable
const TILT_THRESHOLD = 20; // degrees tilt to trigger action
const TILT_LR_THRESHOLD = 15; // degrees for left/right
let lastTiltLaneChange = 0;
const TILT_LANE_COOLDOWN = 300; // ms between lane changes from tilt

const toggleTilt = () => {
  tiltEnabled = !tiltEnabled;
  tiltEnabledRef.value = tiltEnabled;
  tiltInitialBeta = null; // Re-calibrate when re-enabling
};

// Voice/fly - mic input
const initMic = async () => {
  if (micStream) return; // Already initialized
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 256;
    source.connect(micAnalyser);
    micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);
    micEnabled = true;
    micEnabledRef.value = true;
  } catch (e) {
    console.log('Mic not available:', e);
  }
};

const toggleMic = async () => {
  if (micEnabled) {
    // Disable mic
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    micAnalyser = null;
    micDataArray = null;
    micEnabled = false;
    micEnabledRef.value = false;
    isFlying = false;
  } else {
    await initMic();
  }
};

const getMicVolume = () => {
  if (!micAnalyser || !micDataArray) return 0;
  micAnalyser.getByteFrequencyData(micDataArray);
  let sum = 0;
  for (let i = 0; i < micDataArray.length; i++) sum += micDataArray[i];
  return sum / micDataArray.length;
};

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
    0.35,  // strength (reduced for performance)
    0.4,   // radius
    0.85   // threshold
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

  // === ANIMATED CHARACTER ===
  const playerGroup = new THREE.Group();
  const skinColors = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const skinColor = skinColors[currentSkin.value];
  
  // Torso
  const torsoGeo = new THREE.CapsuleGeometry(0.35, 0.6, 8, 8);
  const torsoMat = new THREE.MeshToonMaterial({ color: skinColor });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.castShadow = true;
  torso.name = 'torso';
  playerGroup.add(torso);
  
  // Head group (rotates to face direction)
  const headGroup = new THREE.Group();
  headGroup.name = 'head-group';
  headGroup.position.y = 0.7;
  
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const headMat = new THREE.MeshToonMaterial({ color: 0xffd93d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  headGroup.add(head);
  
  // Eyes - on head so they rotate with it
  const eyeWhiteGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  // Left eye
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.12, 0.05, 0.25);
  headGroup.add(leftEyeWhite);
  const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  leftPupil.position.set(-0.12, 0.05, 0.3);
  leftPupil.name = 'left-pupil';
  headGroup.add(leftPupil);
  
  // Right eye
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.12, 0.05, 0.25);
  headGroup.add(rightEyeWhite);
  const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  rightPupil.position.set(0.12, 0.05, 0.3);
  rightPupil.name = 'right-pupil';
  headGroup.add(rightPupil);
  
  // Mouth (small smile)
  const mouthGeo = new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.08, 0.28);
  mouth.rotation.x = Math.PI;
  headGroup.add(mouth);
  
  playerGroup.add(headGroup);
  
  // Left arm
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 4);
  const armMat = new THREE.MeshToonMaterial({ color: skinColor });
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.45, 0.2, 0);
  leftArmPivot.name = 'left-arm';
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.y = -0.25;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  playerGroup.add(leftArmPivot);
  
  // Right arm
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.45, 0.2, 0);
  rightArmPivot.name = 'right-arm';
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  playerGroup.add(rightArmPivot);
  
  // Left leg
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.35, 4, 4);
  const legMat = new THREE.MeshToonMaterial({ color: 0x333333 }); // Dark pants
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, -0.5, 0);
  leftLegPivot.name = 'left-leg';
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.y = -0.25;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  playerGroup.add(leftLegPivot);
  
  // Right leg
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, -0.5, 0);
  rightLegPivot.name = 'right-leg';
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.y = -0.25;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  playerGroup.add(rightLegPivot);
  
  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.35);
  const shoeMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.45, 0.05);
  leftShoe.castShadow = true;
  leftLegPivot.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.45, 0.05);
  rightShoe.castShadow = true;
  rightLegPivot.add(rightShoe);
  
  // Add hat if equipped
  if (currentHat.value === 'cap') {
    const capGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 16);
    const capMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.3;
    cap.castShadow = true;
    headGroup.add(cap);
    const brimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.25, 0.22);
    brim.rotation.x = 0.2;
    brim.castShadow = true;
    headGroup.add(brim);
  } else if (currentHat.value === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.3, 6);
    const crownMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.35;
    crown.castShadow = true;
    headGroup.add(crown);
  } else if (currentHat.value === 'helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = new THREE.MeshToonMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.3;
    helmet.castShadow = true;
    headGroup.add(helmet);
  }
  
  player = playerGroup;
  player.position.set(0, 0.5, 0);
  // Rotate entire character 180° so they face AWAY from camera (running forward)
  player.rotation.y = Math.PI;
  scene.add(player);

  clock = new THREE.Clock();
  animate();
};

const createGround = () => {
  // Create detailed cartoon road texture with lane markings
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Base asphalt color
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 512, 1024);
  
  // Add noise/texture
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
  }
  
  // Dashed center line
  ctx.strokeStyle = '#ffdd00';
  ctx.lineWidth = 6;
  ctx.setLineDash([40, 30]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 1024);
  ctx.stroke();
  
  // Side lines (solid white)
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(85, 0);
  ctx.lineTo(85, 1024);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(427, 0);
  ctx.lineTo(427, 1024);
  ctx.stroke();
  
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
  ground.name = 'road';
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
  
  // Road edge curbs
  const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 200);
  const curbMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-7.5, 0.07, -50);
  leftCurb.receiveShadow = true;
  scene.add(leftCurb);
  const rightCurb = new THREE.Mesh(curbGeo, curbMat);
  rightCurb.position.set(7.5, 0.07, -50);
  rightCurb.receiveShadow = true;
  scene.add(rightCurb);
};

const createLaneMarkers = () => {
  // Lane markers are now in the road texture only
  // No extra 3D lane markers needed
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
  
  // Add colorful cartoon buildings with windows
  const buildingColors = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd, 0xffa07a, 0xadd8e6];
  for (let i = 0; i < 12; i++) {
    const height = 5 + Math.random() * 10;
    const width = 3 + Math.random() * 4;
    const buildingGroup = new THREE.Group();
    
    const buildingGeo = new THREE.BoxGeometry(width, height, width);
    const buildingMat = new THREE.MeshToonMaterial({ 
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)] 
    });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    
    // Add windows
    const windowRows = Math.floor(height / 2);
    const windowCols = Math.floor(width / 1.5);
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const winGeo = new THREE.PlaneGeometry(0.4, 0.5);
        const isLit = Math.random() > 0.4;
        const winMat = new THREE.MeshBasicMaterial({ 
          color: isLit ? 0xffffaa : 0x666666,
          transparent: !isLit,
          opacity: isLit ? 1.0 : 0.7
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(
          (col - (windowCols - 1) / 2) * 1.2,
          (row - (windowRows - 1) / 2) * 1.8,
          width / 2 + 0.01
        );
        buildingGroup.add(win);
      }
    }
    
    // Rooftop detail
    const roofGeo = new THREE.BoxGeometry(width + 0.3, 0.3, width + 0.3);
    const roofMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height / 2 + 0.15;
    buildingGroup.add(roof);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    buildingGroup.position.set(
      side * (15 + Math.random() * 10),
      height / 2,
      -30 - Math.random() * 50
    );
    scene.add(buildingGroup);
    buildings.push(buildingGroup);
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
  obstacles.push({ mesh: fruitGroup, lane, type: 'ground' });
};

const spawnFloatingObstacle = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const ufoGroup = new THREE.Group();
  
  // UFO dome (top)
  const domeGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshToonMaterial({ color: 0x88ff88, emissive: 0x22aa22, emissiveIntensity: 0.3 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0.1;
  dome.castShadow = true;
  ufoGroup.add(dome);
  
  // UFO saucer body (flattened disc)
  const saucerGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 24);
  const saucerMat = new THREE.MeshToonMaterial({ color: 0xcccccc, emissive: 0x444444, emissiveIntensity: 0.2 });
  const saucer = new THREE.Mesh(saucerGeo, saucerMat);
  saucer.castShadow = true;
  ufoGroup.add(saucer);
  
  // UFO bottom ring (glowing)
  const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.15;
  ring.name = 'ufo-ring';
  ufoGroup.add(ring);
  
  // UFO lights around the rim
  const lightGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const lightColors = [0xff0000, 0xffff00, 0x00ff00, 0x0088ff, 0xff00ff];
  for (let i = 0; i < 5; i++) {
    const lightMat = new THREE.MeshBasicMaterial({ color: lightColors[i] });
    const ufoLight = new THREE.Mesh(lightGeo, lightMat);
    const angle = (i / 5) * Math.PI * 2;
    ufoLight.position.set(Math.cos(angle) * 1.1, -0.05, Math.sin(angle) * 1.1);
    ufoLight.name = 'ufo-light-' + i;
    ufoGroup.add(ufoLight);
  }
  
  // Tractor beam (cone below)
  const beamGeo = new THREE.ConeGeometry(1.2, 1.5, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -1.0;
  beam.rotation.x = Math.PI; // Point downward
  ufoGroup.add(beam);
  
  ufoGroup.position.set(laneX, 2.2, -50);
  scene.add(ufoGroup);
  obstacles.push({ mesh: ufoGroup, lane, type: 'floating' });
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

  if (gameOver.value) {
    // Still update powerup timer even when game over
    if (activePowerup) {
      powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
      if (powerupTimeLeft.value <= 0) {
        deactivatePowerup();
      }
    }
    return;
  }

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
    if (Math.random() < 0.7) {
    if (Math.random() < 0.3) {
      spawnFloatingObstacle();
    } else {
      spawnObstacle();
    }
  }
    if (Math.random() < 0.5 + (gameDuration / 120)) spawnCoin();
    if (Math.random() < 0.05) spawnPowerup(); // 5% chance per spawn
    lastSpawnTime = time;
  }

  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += gameSpeed;
    // Spin UFOs faster, ground obstacles slow spin
    obs.mesh.rotation.y += obs.type === 'floating' ? 0.08 : 0.05;

    // Horizontal + Z distance (ignore Y for collision range check)
    const dx = player.position.x - obs.mesh.position.x;
    const dz = player.position.z - obs.mesh.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const isFloating = obs.type === 'floating';
    
    // Ground obstacles: hit if player is on ground level and not flying
    const hitGroundObs = !isFloating && player.position.y < 1.0 && !isFlying;
    // Floating/UFO: hit if player is NOT sliding (must slide under), regardless of y-distance
    // Standing, jumping, or flying through a UFO all hit unless sliding
    const hitFloatingObs = isFloating && !isSliding;
    // Flying characters still avoid ground obstacles
    if (horizDist < 1.5 && (hitGroundObs || hitFloatingObs)) {
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
        
        // Screen shake effect
        const shakeIntensity = 0.5;
        const originalPos = camera.position.clone();
        let shakeTime = 0;
        const shakeInterval = setInterval(() => {
          shakeTime += 0.05;
          if (shakeTime > 0.5) {
            camera.position.copy(originalPos);
            clearInterval(shakeInterval);
            return;
          }
          camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
          camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
        }, 30);
        
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
    
    const dist = player.position.distanceTo(coin.mesh.position);
    
    // Magnet effect - strong pull to player position
    if (magnetRange > 0 && activePowerup === 'magnet' && dist < magnetRange) {
      // Check if there's an obstacle blocking the path (obstacle must be between coin and player)
      const hasObstacle = obstacles.some(obs => {
        // Obstacle must be roughly in the same lane and between coin and player
        const inSameLane = Math.abs(obs.mesh.position.x - coin.mesh.position.x) < 2;
        const betweenCoinAndPlayer = (
          (obs.mesh.position.z > coin.mesh.position.z && obs.mesh.position.z < player.position.z) ||
          (obs.mesh.position.z < coin.mesh.position.z && obs.mesh.position.z > player.position.z)
        );
        const closeToLine = obs.mesh.position.distanceTo(
          new THREE.Vector3(coin.mesh.position.x, 0, coin.mesh.position.z).lerp(
            new THREE.Vector3(player.position.x, 0, player.position.z),
            0.5
          )
        ) < 1.5;
        return inSameLane && betweenCoinAndPlayer && closeToLine;
      });
      
      if (!hasObstacle) {
        // Strong magnet - coins fly directly to player (not just lerp, but override movement)
        const direction = new THREE.Vector3().subVectors(player.position, coin.mesh.position).normalize();
        const pullSpeed = 0.8; // Much faster than gameSpeed
        coin.mesh.position.add(direction.multiplyScalar(pullSpeed));
        coin.mesh.rotation.y += 0.2;
      } else {
        // Blocked by obstacle - continue normal movement
        coin.mesh.position.z += gameSpeed;
        coin.mesh.rotation.y += 0.1;
      }
    } else {
      // No magnet - normal movement
      coin.mesh.position.z += gameSpeed;
      coin.mesh.rotation.y += 0.1;
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
  
  // === DUST TRAIL PARTICLES behind player ===
  if (!isJumping && Math.random() < 0.3) {
    const dustGeo = new THREE.SphereGeometry(0.06, 4, 4);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0xccaa88, transparent: true, opacity: 0.6 });
    const dust = new THREE.Mesh(dustGeo, dustMat);
    dust.position.set(
      player.position.x + (Math.random() - 0.5) * 0.5,
      0.1 + Math.random() * 0.2,
      player.position.z + 0.5 + Math.random() * 0.3
    );
    dust.userData = { life: 0.6, velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, 0.02, 0.05) };
    scene.add(dust);
    particles.push(dust);
  }
  
  // === SPEED LINES at high speed ===
  if (difficultyMultiplier > 1.3 && Math.random() < 0.2) {
    const lineGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const speedLine = new THREE.Mesh(lineGeo, lineMat);
    speedLine.position.set(
      (Math.random() - 0.5) * 8,
      0.5 + Math.random() * 3,
      player.position.z - 5 - Math.random() * 10
    );
    speedLine.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    speedLine.userData = { life: 0.4, velocity: new THREE.Vector3(0, 0, 0.3) };
    scene.add(speedLine);
    particles.push(speedLine);
  }
  
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

  // Animate particles (dust, speed lines, effects)
  particles.forEach((particle, index) => {
    if (particle.velocity) {
      particle.position.add(particle.velocity);
      particle.velocity.y -= 0.005;
    }
    if (particle.life !== undefined) {
      particle.life -= 0.02;
      if (particle.material) particle.material.opacity = Math.max(0, particle.life);
      particle.scale.setScalar(Math.max(0.01, particle.life));
    } else {
      particle.life = (particle.life || 1) - 0.02;
      particle.scale.setScalar(Math.max(0.01, particle.life));
    }
    
    if (particle.life <= 0) {
      scene.remove(particle);
      particles.splice(index, 1);
    }
  });

  // Voice/fly - mic input
  const micVolume = getMicVolume();
  if (micEnabled && micVolume > MIC_PEAK_THRESHOLD && !isJumping && !isFlying && !isSliding && !gameOver.value) {
    // Volume spike → start flying
    isFlying = true;
    flyVelocity = 0.15;
  }
  
  if (isFlying) {
    if (micEnabled && micVolume > MIC_THRESHOLD) {
      // Still blowing → keep flying (apply lift)
      flyVelocity += FLY_LIFT;
      if (flyVelocity > 0.15) flyVelocity = 0.15; // Cap upward speed
    } else {
      // Volume dropped → fall
      flyVelocity -= FLY_GRAVITY;
    }
    
    player.position.y += flyVelocity;
    
    // Cap max height
    if (player.position.y > FLY_MAX_HEIGHT) {
      player.position.y = FLY_MAX_HEIGHT;
      flyVelocity = 0;
    }
    
    // Landed
    if (player.position.y <= 0.5) {
      player.position.y = 0.5;
      isFlying = false;
      flyVelocity = 0;
    }
  } else if (isJumping) {
    player.position.y += jumpVelocity;
    jumpVelocity -= gravity;
    if (player.position.y <= 0.5) {
      player.position.y = 0.5;
      isJumping = false;
      jumpVelocity = 0;
    }
  }
  
  // Slide timer
  if (isSliding) {
    slideTimer -= delta;
    if (slideTimer <= 0) {
      isSliding = false;
      slideTimer = 0;
    }
  }
  
  // === SCROLL ROAD TEXTURE ===
  if (groundTexture) {
    groundTexture.offset.y -= gameSpeed * 0.15;
  }
  
  // === CHARACTER ANIMATION ===
  const leftArm = player.getObjectByName('left-arm');
  const rightArm = player.getObjectByName('right-arm');
  const leftLeg = player.getObjectByName('left-leg');
  const rightLeg = player.getObjectByName('right-leg');
  const headGroup = player.getObjectByName('head-group');
  const leftPupil = player.getObjectByName('left-pupil');
  const rightPupil = player.getObjectByName('right-pupil');
  
  const targetX = (currentLane - 1) * laneWidth;
  const moveDir = targetX - player.position.x;
  
  // Running animation - arms and legs swing
  if (isSliding) {
    // Slide pose - character ducks low
    if (leftArm) leftArm.rotation.x = 0.8;
    if (rightArm) rightArm.rotation.x = 0.8;
    if (leftLeg) leftLeg.rotation.x = -1.0;
    if (rightLeg) rightLeg.rotation.x = -1.0;
    player.position.y = 0.3;
    player.scale.y = 0.5;
  } else if (isFlying) {
    // Fly pose - arms spread out like wings
    if (leftArm) leftArm.rotation.z = -1.5; // Arms out sideways
    if (rightArm) rightArm.rotation.z = 1.5;
    if (leftLeg) leftLeg.rotation.x = 0.3;
    if (rightLeg) rightLeg.rotation.x = 0.3;
    player.scale.y = 1.0;
  } else if (!isJumping) {
    const runSpeed = 8 + gameSpeed * 10;
    const swing = Math.sin(time * runSpeed) * 0.6;
    
    if (leftArm) leftArm.rotation.x = swing;
    if (rightArm) rightArm.rotation.x = -swing;
    if (leftLeg) leftLeg.rotation.x = -swing * 0.8;
    if (rightLeg) rightLeg.rotation.x = swing * 0.8;
    
    player.position.y = 0.5 + Math.abs(Math.sin(time * runSpeed)) * 0.05;
    player.scale.y = 1.0;
  } else {
    if (leftArm) leftArm.rotation.x = -1.2;
    if (rightArm) rightArm.rotation.x = -1.2;
    if (leftLeg) leftLeg.rotation.x = 0.5;
    if (rightLeg) rightLeg.rotation.x = 0.5;
    player.scale.y = 1.0;
  }
  
  // Head faces movement direction
  // Since player is rotated 180°, we negate the head rotation
  if (headGroup) {
    const targetHeadRotY = THREE.MathUtils.clamp(moveDir * -0.5, -0.6, 0.6);
    headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadRotY, 0.1);
  }
  
  // Eyes look in movement direction
  if (leftPupil && rightPupil) {
    const lookX = THREE.MathUtils.clamp(moveDir * -0.05, -0.04, 0.04);
    leftPupil.position.x = -0.12 + lookX;
    rightPupil.position.x = 0.12 + lookX;
  }
  
  // Smooth lane movement
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.15);
  
  // Body lean on turn
  const tiltAmount = moveDir * -0.08;
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, tiltAmount, 0.1);
  player.rotation.x = 0;
  
  // Body faces forward (base rotation = PI) with slight turn into movement
  const bodyTurn = THREE.MathUtils.clamp(moveDir * 0.15, -0.3, 0.3);
  player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, Math.PI + bodyTurn, 0.08);

  // Power-up timer
  if (activePowerup) {
    powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
    if (powerupTimeLeft.value <= 0) {
      deactivatePowerup();
    }
  }

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
  } else if (direction === 'down') {
    handleSlide();
  }
};

const handleTouchStart = (e) => {
  // Don't intercept touches on UI buttons
  if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel')) return;
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  initAudio(); // Start audio on first touch
};

const handleTouchEnd = (e) => {
  if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel')) return;
  e.preventDefault();
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  // If game over, any tap restarts
  if (gameOver.value) {
    restartGame();
    return;
  }
  
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
    if (Math.abs(diffY) > minSwipeDistance) {
      if (diffY < 0) {
        handleSwipe('up');
      } else {
        handleSwipe('down');
      }
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
  const prevPowerup = activePowerup;
  
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
  
  // Visual feedback that powerup expired
  if (prevPowerup) {
    const icon = prevPowerup === 'shield' ? '🛡️' : prevPowerup === 'speed' ? '⚡' : '🧲';
    createFloatingText(icon + ' expired!', player.position.clone().add(new THREE.Vector3(0, 2, 0)));
  }
};

const handleJump = () => {
  if (isJumping || isSliding || isFlying) return;
  isJumping = true;
  jumpVelocity = jumpStrength;
  playSound('jump');
};

const handleSlide = () => {
  if (isJumping || isSliding || isFlying) return;
  isSliding = true;
  slideTimer = slideDuration;
  playSound('jump');
};

const handleDeviceOrientation = (e) => {
  if (!tiltEnabled || gameOver.value) return;
  
  const beta = e.beta;  // Front-back tilt (-180 to 180)
  const gamma = e.gamma; // Left-right tilt (-90 to 90)
  
  if (beta === null || gamma === null) return;
  
  // Calibrate on first reading
  if (tiltInitialBeta === null) {
    tiltInitialBeta = beta;
    return;
  }
  
  const tiltForward = beta - tiltInitialBeta; // Negative = tilted forward (up)
  const tiltSideways = gamma; // Negative = left, Positive = right
  
  // Tilt phone toward you (beta increases) = jump
  if (tiltForward > TILT_THRESHOLD && !isJumping && !isSliding) {
    handleJump();
  }
  
  // Tilt phone away from you (beta decreases) = slide
  if (tiltForward < -TILT_THRESHOLD && !isJumping && !isSliding) {
    handleSlide();
  }
  
  // Tilt left/right = lane change
  const now = Date.now();
  if (now - lastTiltLaneChange > TILT_LANE_COOLDOWN) {
    if (tiltSideways < -TILT_LR_THRESHOLD) {
      if (currentLane > 0) { currentLane--; lastTiltLaneChange = now; }
    } else if (tiltSideways > TILT_LR_THRESHOLD) {
      if (currentLane < 2) { currentLane++; lastTiltLaneChange = now; }
    }
  }
};

const handleKeyDown = (e) => {
  // Prevent default for game controls to stop page scrolling
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key)) {
    e.preventDefault();
  }
  
  // Initialize audio on first keypress
  initAudio();
  
  // Restart on Space, Enter, or any key when game over
  if (gameOver.value) {
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
  if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && !isSliding) {
    handleSlide();
  }
};

const restartGame = () => {
  gameOver.value = false;
  score.value = 0;
  currentLane = 1;
  isJumping = false;
  jumpVelocity = 0;
  isSliding = false;
  slideTimer = 0;
  isFlying = false;
  flyVelocity = 0;
  tiltInitialBeta = null; // Re-calibrate tilt on restart
  gameSpeed = 0.25;
  spawnInterval = 1.2;
  gameDuration = 0;
  comboCount = 0;
  scoreMultiplier = 1;
  magnetRange = 0;
  isInvincible = false;
  activePowerup = null;
  dayCycleTime = 0;
  
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
  
  // Clear achievement notifications
  achievements.value = [];
  
  player.position.set(0, 0.5, 0);
  player.scale.y = 1.0;
  
  // Remove shield aura if exists
  const shield = player.getObjectByName('shield-aura');
  if (shield) player.remove(shield);
  
  // Remove stars if present
  const stars = scene.getObjectByName('stars');
  if (stars) scene.remove(stars);
  scene.userData.starsCreated = false;
  
  lastSpawnTime = 0;
  clock.start();
  playSound('start');
};

onMounted(() => {
  const saved = localStorage.getItem('elangoSurfersHighScore');
  if (saved) highScore.value = parseInt(saved, 10);
  initGame();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel')) return;
    e.preventDefault();
  }, { passive: false, capture: true });
  window.addEventListener('click', (e) => {
    // Check if click is on settings panel or buttons - if so, don't restart
    if (e.target.closest('#settings-panel') || e.target.closest('#settings-btn') || e.target.closest('#mute-btn') || e.target.closest('#tilt-btn') || e.target.closest('#mic-btn')) {
      return;
    }
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
  
  // Tilt/gyro controls (mobile)
  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ - request on first touch
      window.addEventListener('touchstart', () => {
        DeviceOrientationEvent.requestPermission().then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        }).catch(() => {});
      }, { once: true });
    } else {
      // Android / older iOS
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
  window.removeEventListener('touchmove', handleTouchEnd, { capture: true });
  window.removeEventListener('deviceorientation', handleDeviceOrientation);
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (composer) composer.dispose();
  stopBGM();
});
</script>

<style scoped>
#game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: Arial, sans-serif;
  touch-action: none; /* Prevent zoom/scroll on mobile */
  user-select: none; /* Prevent text selection */
  -webkit-touch-callout: none; /* Prevent iOS callout menu */
  overscroll-behavior: none; /* Prevent pull-to-refresh */
  -webkit-overflow-scrolling: none; /* Disable iOS momentum scroll */
}

#game-container * {
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}
#ui {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  z-index: 10;
  pointer-events: none;
}
#version {
  font-size: 0.6rem;
  opacity: 0.5;
  margin-bottom: 2px;
  font-family: monospace;
}
#score {
  font-size: 1.4rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
#highscore {
  font-size: 0.85rem;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
#instructions {
  font-size: 0.65rem;
  opacity: 0.8;
  margin-top: 6px;
  line-height: 1.3;
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
  top: 10px;
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
#mute-btn {
  position: absolute;
  top: 10px;
  right: 70px;
  font-size: 1.3rem;
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
#tilt-btn {
  position: absolute;
  top: 10px;
  right: 120px;
  font-size: 1.3rem;
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
#mic-btn {
  position: absolute;
  top: 10px;
  right: 170px;
  font-size: 1.3rem;
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
  font-size: 1rem;
  color: #ff6b35;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: pulse 0.5s ease-in-out;
}
#powerup-indicator {
  font-size: 0.85rem;
  color: #00bfff;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
#fly-indicator {
  font-size: 0.85rem;
  color: #ff69b4;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
