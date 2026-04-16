<template>
  <div id="game-container">
    <div id="game-info">
      <div id="version">{{ VERSION }}</div>
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="combo" v-if="comboCount > 1">🔥 x{{ comboCount }}</div>
      <div id="powerup-indicator" v-if="activePowerup">{{ powerupIcon }} {{ powerupName }} {{ powerupTimeLeft }}s</div>
      <div id="fly-indicator" v-if="micEnabledRef">&#x1F3A4;&#x2708;ï¸</div>
      <div id="stage-indicator" v-if="!gameOver">STAGE {{ currentStage + 1 }}: {{ STAGES[currentStage].name }}</div>
      <div id="boss-warning" v-if="bossWarning && !bossActive" style="color:#ff4444;font-size:20px;font-weight:bold;animation:pulse 0.5s infinite">
        ⚠️ BOSS INCOMING! ⚠️
      </div>
      <div id="boss-bar" v-if="bossActive && !bossDefeated">
        <div class="boss-label">BOSS</div>
        <div class="boss-health-track"><div class="boss-health-fill" :style="{ width: bossHealth + '%' }"></div></div>
      </div>
    </div>
    <div id="floating-texts">
      <div id="near-miss" v-if="nearMissTextRef">{{ nearMissTextRef }}</div>
      <div id="event-alert" v-if="eventAlertTextRef">{{ eventAlertTextRef }}</div>
      <div id="bonus-zone" v-if="inBonusZoneRef">&#x1F308; BONUS ZONE! {{ Math.ceil(bonusTimerRef) }}s</div>
    </div>
    <div id="curve-indicator" v-if="!gameOver && Math.abs(roadCurve) > 0.15"
         :style="{ opacity: Math.min(Math.abs(roadCurve) * 1.5, 1) }">
      {{ roadCurve > 0 ? '➡️' : '⬅️' }}
    </div>
    <div id="top-buttons">
      <div id="mic-btn" @click="toggleMic">{{ micEnabledRef ? '🎤' : '🎤🔴' }}</div>
      <div id="tilt-btn" @click="toggleTilt">{{ tiltEnabledRef ? '📱' : '📱🔴' }}</div>
      <div id="mute-btn" @click="toggleMute">🔊</div>
      <div id="settings-btn" @click="toggleSettings">⚙️</div>
    </div>
    <div id="instructions" v-if="score < 1 && !gameOver">A/D ←/→ Move | W/↑ Jump | S/↓ Slide<br>📱 Swipe | Tilt | 🎤 Blow to fly!</div>
    <div id="game-canvas"></div>
    <div id="vignette-glow"></div>
    <div v-if="gameOver" id="game-over">
      <h1>GAME OVER</h1>
      <p>Your Score: {{ score }}</p>
      <p v-if="score >= highScore" style="color: #ffd700; font-weight: bold;">⭐ NEW HIGH SCORE! ⭐</p>
      <!-- Leaderboard -->
      <div id="leaderboard" v-if="leaderboard.length > 0">
        <h3 style="margin:0.5rem 0 0.25rem;color:#ffd700">🏆 Leaderboard</h3>
        <div v-for="(entry, i) in leaderboard" :key="i" class="lb-entry">
          <span class="lb-rank">{{ i + 1 }}.</span>
          <span class="lb-name">{{ entry.name }}</span>
          <span class="lb-score">{{ entry.score.toLocaleString() }}</span>
        </div>
      </div>
      <!-- Name entry for high score -->
      <div v-if="showNameEntry" id="name-entry">
        <p style="color:#ffd700;font-weight:bold;margin-bottom:0.5rem">Enter your name (3 chars):</p>
        <input 
          v-model="playerName" 
          maxlength="3" 
          placeholder="AAA"
          @keyup.enter="submitScore"
          id="name-input"
        />
        <button @click="submitScore" :disabled="playerName.trim().length === 0" id="submit-btn">SAVE</button>
        <button @click="showNameEntry = false" id="skip-btn">SKIP</button>
      </div>
      <p style="margin-top:0.75rem;font-size:0.8rem;color:#aaa">Press SPACE or tap to restart</p>
    </div>
    <div v-if="countdownActive" id="countdown">{{ countdownText }}</div>
    <div v-if="showSettings" id="settings-panel">
      <h2>⚙️ Settings</h2>
      <button @click="toggleSettings">Close</button>
      <div class="settings-section" style="border-bottom:1px solid #444;padding-bottom:1rem;margin-bottom:1rem">
        <h3>🎮 Game Settings</h3>
        <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" v-model="fovWarpRef" @change="toggleFovWarp" style="width:20px;height:20px;cursor:pointer" /> FOV Warp Effect
        </label>
        <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
          <input type="checkbox" v-model="roadCurveEnabled" style="width:20px;height:20px;cursor:pointer" /> Road Curves
        </label>
      </div>
      <div class="settings-section" style="border-bottom:1px solid #444;padding-bottom:1rem;margin-bottom:1rem">
        <h3>🗺️ Debug: Start Stage</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button @click="debugStartStage = -1"
            :style="{ background: debugStartStage === -1 ? '#4ecdc4' : '#333', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }">
            Normal
          </button>
          <button v-for="(s, i) in STAGES" :key="i" @click="debugStartStage = i"
            :style="{ background: debugStartStage === i ? '#4ecdc4' : '#333', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }">
            {{ i + 1 }}. {{ s.name }}
          </button>
        </div>
        <div style="color:#888;font-size:11px;margin-top:4px">Next game starts at this stage</div>
      </div>
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
import { onMounted, ref, computed, onUnmounted, nextTick, watch } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { useAudio } from './composables/useAudio.js'
import { useLeaderboard } from './composables/useLeaderboard.js'
import { useAchievements } from './composables/useAchievements.js'
import { EARTH_R, STAGES, DAY_DURATION, jumpStrength, slideDuration, laneWidth, FLY_LIFT, FLY_GRAVITY, FLY_MAX_HEIGHT, MIC_THRESHOLD, MIC_PEAK_THRESHOLD, minSwipeDistance, TILT_THRESHOLD, TILT_LR_THRESHOLD, TILT_LANE_COOLDOWN, CALIBRATION_MAX_SAMPLES } from './gameConstants.js'
import { useCurve } from './composables/useCurve.js'
import { useMic } from './composables/useMic.js'

// Version - Update this for each release
const VERSION = 'v4.4.5';

// Score & High Score refs
const score = ref(0);
const highScore = ref(0);

// Game state refs
const gameOver = ref(false);
const countdownActive = ref(false);
const countdownText = ref('');
const showSettings = ref(false);
const debugStartStage = ref(-1);
const tiltEnabledRef = ref(true);

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Achievement system — extracted to useAchievements.js
// Composable instantiated after createFloatingText + player are defined

const fovWarpRef = ref(false);
const roadCurveEnabled = ref(true);

// Stage & road curve state
const currentStage = ref(0)
const stageTime = ref(0)
const bossActive = ref(false)
const bossHealth = ref(100)
const bossDefeated = ref(false)
const bossWarning = ref(false)
const roadCurve = ref(0)
const roadCurveTarget = ref(0)
const stageTransitioning = ref(false)
const curveChangeTimer = ref(0)
const nextCurveChange = ref(3)

// Initialize curve composable
const { getSurfaceY, getSurfaceTilt, getCurveX, curveFrontZ } = useCurve({ roadCurveEnabled, roadCurve })

// Power-up state
let activePowerup = null;
let powerupEndTime = 0;
let powerupIcon = '';
let powerupName = '';
let powerupTimeLeft = ref(0);
let nearMissTextRef = ref('');
let nearMissCountRef = ref(0);
let eventAlertTextRef = ref('');
let inBonusZoneRef = ref(false);
let bonusTimerRef = ref(0);
let scoreMultiplier = 1;
let magnetRange = 0;
let isInvincible = false;

// Day/night cycle
let dayCycleTime = 0;

// Stage system
// === STAGE VISUAL TRANSITIONS ===
let cobblestoneTexture = null;
let originalGroundTexture = null;
let originalGroundColor = null;

function applyStageVisuals(stageIndex) {
  const stage = STAGES[stageIndex];
  if (!roadMesh) return;
  
  // Save originals on first call
  if (!originalGroundTexture) {
    originalGroundTexture = roadMesh.material.map;
    originalGroundColor = roadMesh.material.color.getHex();
  }
  
  if (stage.roadTexture === 'cobblestone') {
    // Load cobblestone texture if not cached
    if (!cobblestoneTexture) {
      cobblestoneTexture = textureLoader.load('assets/road_cobblestone.webp');
      cobblestoneTexture.wrapS = THREE.RepeatWrapping;
      cobblestoneTexture.wrapT = THREE.RepeatWrapping;
      cobblestoneTexture.repeat.set(1, 10);
    }
    roadMesh.material.map = cobblestoneTexture;
    roadMesh.material.color.set(0x888888);
    roadMesh.material.needsUpdate = true;
    // Preload fachwerkhaus texture for medieval buildings
    loadFachwerk();
    // Tint grass darker for medieval
    if (grassMesh) { grassMesh.material.color.set(0x2d5a1e); grassMesh.material.needsUpdate = true; }
    // Darker sky
    if (scene && scene.fog) { scene.fog.color.set(0x4a5568); scene.background = new THREE.Color(0x4a5568); }
    // Switch building facades to fachwerkhaus
    if (buildings.length && fachwerkTexture) {
      buildings.forEach(b => {
        const mesh = b.children.find(c => c.isMesh)
        if (mesh && mesh.material && Array.isArray(mesh.material)) {
          // Facade can be at index 0 (left building), 1 (right building), or 4 (front)
          for (const idx of [0, 1, 4]) {
            if (mesh.material[idx].map) { // only swap facade-textured faces
              mesh.material[idx].map = fachwerkTexture
              mesh.material[idx].color.set(0xd4c4a0)
              mesh.material[idx].needsUpdate = true
            }
          }
        }
      })
    }
    // Switch to medieval BGM
    switchBGMTrack('medieval');
  } else {
    // Highway: restore original
    roadMesh.material.map = originalGroundTexture;
    roadMesh.material.color.set(originalGroundColor);
    roadMesh.material.needsUpdate = true;
    if (grassMesh) { grassMesh.material.color.set(0x3a7d2c); grassMesh.material.needsUpdate = true; }
    if (scene && scene.fog) { scene.fog.color.set(0x87ceeb); scene.background = new THREE.Color(0x87ceeb); }
    // Restore building facades to original textures
    if (buildings.length) {
      buildings.forEach((b, i) => {
        const mesh = b.children.find(c => c.isMesh)
        if (mesh && mesh.material && Array.isArray(mesh.material)) {
          const texIdx = i % buildingTextures.length
          // Facade can be at index 0, 1, or 4
          for (const idx of [0, 1, 4]) {
            if (mesh.material[idx].map) {
              mesh.material[idx].map = buildingTextures[texIdx]
              mesh.material[idx].color.set(buildingDominantColors[texIdx])
              mesh.material[idx].needsUpdate = true
            }
          }
        }
      })
    }
    // Switch to highway BGM
    switchBGMTrack('highway');
  }
}

// Initialize audio composable
const { playSound, playSFX, startBGM, stopBGM, switchBGMTrack, toggleMute, initAudio, isBGMPlaying, bgmStarted } = useAudio({ currentStage, STAGES })

// Attempt BGM start from a user gesture context (resolves autoplay policy)
const tryStartBGMFromGesture = () => {
  initAudio();
  if (!bgmStarted && !isBGMPlaying) {
    startBGM();
  }
};

let scene, camera, renderer, player, clock;
let boss = null;
let obstacles = [];
let coins = [];
let powerups = [];
let particles = [];
let floatingTexts = [];

// Initialize achievement composable (uses lazy getters for player + createFloatingText)
const {
  ACHIEVEMENTS, gameStats, achievements, unlockedSkins, currentSkin,
  unlockedHats, currentHat, loadProgress, saveProgress, checkAchievements
} = useAchievements({
  playSound,
  createFloatingText: (...args) => createFloatingText(...args),
  getPlayer: () => player
})
let currentLane = 1;
let isJumping = false;
let jumpVelocity = 0;
let isSliding = false;
let slideTimer = 0;
const gravity = 0.015;

// Surface/curve math extracted to useCurve.js

// Voice/fly controls
let isFlying = false;
let flyVelocity = 0;
let gameSpeed = 0.25;
let lastSpawnTime = -2; // grace period before first spawn
let spawnInterval = 1.2;
let gameDuration = 0;
let comboCount = 0;
let lastCoinTime = 0;

// Near-miss system
// Near-miss / Bullet time system
let nearMissTimer = 0;
let nearMissCount = 0;
let cameraShakeTimer = 0;
let cameraShakeIntensity = 0;
let originalRoadMaterial = null;
let savedSubstageState = null;
let bonusNoSpawn = false;
let bonusCoins = [];

// Cloud tint colors (module-level to avoid allocation per frame)
const cloudWhiteColor = new THREE.Color(0xffffff);
const cloudNightColor = new THREE.Color(0x667788);
const cloudSunsetColor = new THREE.Color(0xff8866);

// Environmental events
let eventTimer = 0;
let activeEvent = null; // 'fog'
let eventDuration = 0;
let fogDensity = 0;

// Bonus portal
let bonusPortal = null;
let inBonusZone = false;
let bonusTimer = 0;
let bonusPortalSpawned = false;

// Edge glow (red vignette at max difficulty)
let edgeGlowIntensity = 0;

// FOV warp (settings toggle)
let fovWarpEnabled = false;

// Dynamic sky crossfade
let skyBlendFactor = 0;
let prevSkyTex = null;
let currentSkyTex = null;

// Touch/swipe controls
let touchStartX = 0;
let touchStartY = 0;

// Tilt/gyro controls
let tiltEnabled = true;
let tiltInitialBeta = null; // Calibrate on enable
let tiltInitialGamma = null; // Calibrate sideways center
let lastTiltLaneChange = 0;

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1024);

// Tilt calibration during countdown
let tiltCalibrationSamples = [];
let isCalibrating = false;

const startTiltCalibration = () => {
  tiltCalibrationSamples = [];
  isCalibrating = true;
  tiltInitialBeta = null;
  tiltInitialGamma = null;
};

const finishTiltCalibration = () => {
  if (tiltCalibrationSamples.length === 0) {
    // Fallback: use current single reading or 0
    tiltInitialBeta = tiltInitialBeta ?? 45; // Neutral phone hold
    tiltInitialGamma = tiltInitialGamma ?? 0;
  } else {
    // Average all samples
    const avgBeta = tiltCalibrationSamples.reduce((s, v) => s + v.beta, 0) / tiltCalibrationSamples.length;
    const avgGamma = tiltCalibrationSamples.reduce((s, v) => s + v.gamma, 0) / tiltCalibrationSamples.length;
    tiltInitialBeta = avgBeta;
    tiltInitialGamma = avgGamma;
  }
  isCalibrating = false;
  tiltCalibrationSamples = [];
};

let toggleTilt = () => {
  tiltEnabled = !tiltEnabled;
  tiltEnabledRef.value = tiltEnabled;
  tiltInitialBeta = null;
};

const toggleFovWarp = () => {
  fovWarpEnabled = fovWarpRef.value;
  if (!fovWarpEnabled) {
    camera.fov = 60;
    camera.updateProjectionMatrix();
  }
};

// Mic input — extracted to useMic.js
const { micEnabledRef, initMic, toggleMic: _toggleMic, getMicVolume, cleanupMic } = useMic()
const toggleMic = () => _toggleMic(() => { isFlying = false })
// Environment elements
let clouds = [];
let trees = [];
let buildings = [];
let composer;
let groundTexture;
let roadMesh, grassMesh, leftCurbMesh, rightCurbMesh;
let roadOrigPositions, grassOrigPositions, leftCurbOrigPositions, rightCurbOrigPositions;
let skyTextures = {};
let mountainMesh;
let textureLoader = new THREE.TextureLoader();

window.addEventListener('error', (e) => { console.log('GLOBAL ERROR:', e.message, 'at', e.filename + ':' + e.lineno + ':' + e.colno); });
onMounted(() => {
  const saved = localStorage.getItem('elangoSurfersHighScore');
  if (saved) highScore.value = parseInt(saved, 10);
  loadProgress();
  loadLeaderboard();
  checkAchievements();
});

const saveHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('elangoSurfersHighScore', highScore.value.toString());
  }
};

// === LEADERBOARD === (extracted to useLeaderboard.js)
const { leaderboard, playerName, showNameEntry, isHighScore, submitScore, loadLeaderboard } = useLeaderboard({ VERSION, score, highScore })

const initGame = () => {
  scene = new THREE.Scene();
  
  // Colorful cartoon sky with gradient fog
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

  // Load AI-generated sky textures
  const skyUrls = {
    sunny: 'assets/sky_sunny.webp',
    sunset: 'assets/sky_sunset.webp',
    night: 'assets/sky_night.webp'
  };
  Object.keys(skyUrls).forEach(key => {
    textureLoader.load(skyUrls[key], (tex) => {
      skyTextures[key] = tex;
    });
  });
  
  // Load mountain texture for parallax
  textureLoader.load('assets/mountains.webp', (tex) => {
    const mtGeo = new THREE.PlaneGeometry(80, 15);
    const mtMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    mountainMesh = new THREE.Mesh(mtGeo, mtMat);
    mountainMesh.position.set(0, 4 + getSurfaceY(-90), -90);
    mountainMesh.renderOrder = -2;
    scene.add(mountainMesh);
    // Second mountain layer (further back, dimmer)
    const mt2 = new THREE.Mesh(mtGeo.clone(), mtMat.clone());
    mt2.material.opacity = 0.5;
    mt2.material.transparent = true;
    mt2.position.set(0, 5 + getSurfaceY(-120), -120);
    mt2.scale.set(2.0, 1.5, 1);
    mt2.renderOrder = -3;
    scene.add(mt2);
  });

    // No texture loading - all procedural

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);
  camera.lookAt(0, 0, -5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  renderer.shadowMap.enabled = isMobile ? false : true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  document.getElementById('game-canvas').appendChild(renderer.domElement);

  // Post-processing for bloom effect
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  const bloomRes = isMobile ? 0.5 : 0.75;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth * bloomRes, window.innerHeight * bloomRes),
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
  const shadowRes = isMobile ? 512 : 1024;
  directionalLight.shadow.mapSize.width = shadowRes;
  directionalLight.shadow.mapSize.height = shadowRes;
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

  // === ANIMATED CHARACTER (with AI texture skin) ===
  const playerGroup = new THREE.Group();
  const skinColors = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const skinColor = skinColors[currentSkin.value];
  
  // Torso - with clothing texture if available
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
  
  // Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.12, 0.05, 0.25);
  headGroup.add(leftEyeWhite);
  const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  leftPupil.position.set(-0.12, 0.05, 0.3);
  leftPupil.name = 'left-pupil';
  headGroup.add(leftPupil);
  
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.12, 0.05, 0.25);
  headGroup.add(rightEyeWhite);
  const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  rightPupil.position.set(0.12, 0.05, 0.3);
  rightPupil.name = 'right-pupil';
  headGroup.add(rightPupil);
  
  const mouthGeo = new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.08, 0.28);
  mouth.rotation.x = Math.PI;
  headGroup.add(mouth);
  
  playerGroup.add(headGroup);
  
  // Arms
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
  
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.45, 0.2, 0);
  rightArmPivot.name = 'right-arm';
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  playerGroup.add(rightArmPivot);
  
  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.35, 4, 4);
  const legMat = new THREE.MeshToonMaterial({ color: 0x333333 });
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, -0.5, 0);
  leftLegPivot.name = 'left-leg';
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.y = -0.25;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  playerGroup.add(leftLegPivot);
  
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
  
  // Hat
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
  player.rotation.y = Math.PI;
  scene.add(player);
  
  // Update torso texture when loaded async
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
  
  const groundGeo = new THREE.PlaneGeometry(15, 200, 1, 60); // 60 segments for smooth curve
  // Bend the road to follow the earth curve
  const gPos = groundGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const py = gPos.getY(i); // in plane local space, Y is the long axis
    const worldZ = -py - 50; // center at z=-50, so py=0 → z=-50, py=100 → z=-150
    const yOffset = getSurfaceY(worldZ);
    gPos.setZ(i, gPos.getZ(i) + yOffset); // Z in plane = Y in world after rotation
  }
  gPos.needsUpdate = true;
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshToonMaterial({ 
    map: groundTexture,
    color: 0x555555
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; // flat road - curve is via object positions
  ground.position.set(0, 0, -50);
  ground.receiveShadow = false;
  ground.name = 'road';
  scene.add(ground);
  roadMesh = ground;
  // Save original vertex positions for curve animation
  roadOrigPositions = new Float32Array(gPos.array.length);
  roadOrigPositions.set(gPos.array);
  
  // Add colorful grass borders with AI texture
  // Priority load: grass (large surface area)
  const grassTileTex = textureLoader.load('assets/grass_tile.webp');
  grassTileTex.wrapS = THREE.RepeatWrapping;
  grassTileTex.wrapT = THREE.RepeatWrapping;
  grassTileTex.repeat.set(10, 25);
  grassTileTex.colorSpace = THREE.SRGBColorSpace;
  const grassGeo = new THREE.PlaneGeometry(80, 200, 1, 60); // curve match
  const gPosG = grassGeo.attributes.position;
  for (let i = 0; i < gPosG.count; i++) {
    const py = gPosG.getY(i);
    const worldZ = -py - 50;
    const yOffset = getSurfaceY(worldZ);
    gPosG.setZ(i, gPosG.getZ(i) + yOffset);
  }
  gPosG.needsUpdate = true;
  grassGeo.computeVertexNormals();
  const grassMat = new THREE.MeshToonMaterial({ 
    map: grassTileTex,
    color: 0x8bc34a 
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.1, -50); // just below road
  grass.receiveShadow = false;
  scene.add(grass);
  grassMesh = grass;
  grassOrigPositions = new Float32Array(gPosG.array.length);
  grassOrigPositions.set(gPosG.array);
  
  // Road edge curbs (curved to match earth)
  const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 200, 1, 1, 60); // 60 segments for curve
  const curbMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
  // Curve curb vertices
  const curbPos = curbGeo.attributes.position;
  for (let i = 0; i < curbPos.count; i++) {
    const cz = curbPos.getZ(i);
    const worldZ = cz - 50; // same offset as road center
    curbPos.setY(i, curbPos.getY(i) + getSurfaceY(worldZ));
  }
  curbPos.needsUpdate = true;
  curbGeo.computeVertexNormals();
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-7.5, 0.07, -50);
  leftCurb.receiveShadow = false;
  scene.add(leftCurb);
  leftCurbMesh = leftCurb;
  leftCurbOrigPositions = new Float32Array(curbPos.array.length);
  leftCurbOrigPositions.set(curbPos.array);
  const rightCurb = new THREE.Mesh(curbGeo.clone(), curbMat.clone());
  rightCurb.position.set(7.5, 0.07, -50);
  rightCurb.receiveShadow = false;
  scene.add(rightCurb);
  rightCurbMesh = rightCurb;
  rightCurbOrigPositions = new Float32Array(curbPos.array.length);
  rightCurbOrigPositions.set(curbPos.array);
};

const updateRoadCurve = () => {
  // Bend road/grass/curb mesh vertices based on current roadCurve
  // Each vertex's X offset = getCurveX(worldZ) where worldZ depends on vertex position
  
  if (roadMesh && roadOrigPositions) {
    const pos = roadMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origY = roadOrigPositions[i * 3 + 1]; // Y in plane local = Z axis (long)
      const worldZ = -origY - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, roadOrigPositions[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    roadMesh.geometry.computeVertexNormals();
  }
  
  if (grassMesh && grassOrigPositions) {
    const pos = grassMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origY = grassOrigPositions[i * 3 + 1];
      const worldZ = -origY - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, grassOrigPositions[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    grassMesh.geometry.computeVertexNormals();
  }
  
  // Curbs: vertices are in a BoxGeometry with Z as the long axis
  // Need to also clone for right curb since they share geometry originally
  const applyCurbCurve = (mesh, origPos) => {
    if (!mesh || !origPos) return;
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origZ = origPos[i * 3 + 2]; // Z in box = long axis
      const worldZ = origZ - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, origPos[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  };
  applyCurbCurve(leftCurbMesh, leftCurbOrigPositions);
  applyCurbCurve(rightCurbMesh, rightCurbOrigPositions);
};

const createLaneMarkers = () => {
  // Lane markers are now in the road texture only
  // No extra 3D lane markers needed
};

const updateDayNightCycle = (delta) => {
  const cycleProgress = dayCycleTime / DAY_DURATION; // 0 to 1
  
  // 4 stages: sunny(0-0.25), sunset(0.25-0.5), night(0.5-0.75), sunrise(0.75-1.0)
  // Each stage 30s, 5s transition blend between stages
  const TRANSITION = 5 / DAY_DURATION; // 5s as fraction of cycle
  
  // Sky color interpolation with smooth blending
  let skyColor, fogColor;
  const dayColor = new THREE.Color(0x87ceeb);
  const sunsetColor = new THREE.Color(0xff7f50);
  const nightColor = new THREE.Color(0x0a0a2e);
  const sunriseColor = new THREE.Color(0xffb6c1);
  
  // Helper: get stage colors at progress within stage
  const getStageBlend = (progress) => {
    if (progress < 0.25) {
      // Sunny -> Sunset
      const t = progress / 0.25;
      const blendT = Math.min(1, t / (0.25 * TRANSITION * 4));
      return { skyColor: dayColor.clone().lerp(sunsetColor, t), fogColor: null };
    } else if (progress < 0.5) {
      const t = (progress - 0.25) / 0.25;
      return { skyColor: sunsetColor.clone().lerp(nightColor, t), fogColor: null };
    } else if (progress < 0.75) {
      const t = (progress - 0.5) / 0.25;
      return { skyColor: nightColor.clone().lerp(sunriseColor, t), fogColor: null };
    } else {
      const t = (progress - 0.75) / 0.25;
      return { skyColor: sunriseColor.clone().lerp(dayColor, t), fogColor: null };
    }
  };
  
  const stageInfo = getStageBlend(cycleProgress);
  skyColor = stageInfo.skyColor;
  fogColor = skyColor.clone();
  
  scene.background = skyColor;
  scene.fog.color = fogColor;
  
  // Sky texture crossfade using skyBlendFactor
  // Determine current and next sky textures based on cycle progress
  let currentSkyStage, nextSkyStage, blendT;
  const stageKeys = ['sunny', 'sunset', 'night', 'sunset']; // sunrise reuses sunset texture
  const stageBoundaries = [0, 0.25, 0.5, 0.75];
  
  let stageIdx = 0;
  for (let i = stageBoundaries.length - 1; i >= 0; i--) {
    if (cycleProgress >= stageBoundaries[i]) {
      stageIdx = i;
      break;
    }
  }
  
  const stageStart = stageBoundaries[stageIdx];
  const stageEnd = stageIdx < 3 ? stageBoundaries[stageIdx + 1] : 1.0;
  const stageLen = stageEnd - stageStart;
  const stageProgress = (cycleProgress - stageStart) / stageLen;
  
  // Blend factor: smooth transition in last 5s of each stage
  const transitionFraction = 5 / 30; // 5s out of 30s stage
  if (stageProgress > (1 - transitionFraction)) {
    skyBlendFactor = (stageProgress - (1 - transitionFraction)) / transitionFraction;
    skyBlendFactor = skyBlendFactor * skyBlendFactor * (3 - 2 * skyBlendFactor); // smoothstep
  } else {
    skyBlendFactor = 0;
  }
  
  currentSkyTex = skyTextures[stageKeys[stageIdx]] || null;
  nextSkyStage = stageKeys[(stageIdx + 1) % 4];
  // Map sunrise stage (0.75-1.0) back to sunny texture at the end
  if (stageIdx === 3) nextSkyStage = 'sunny';
  prevSkyTex = skyTextures[nextSkyStage] || null;
  
  // If we have sky textures and blend is active, mix them
  if (currentSkyTex && prevSkyTex && skyBlendFactor > 0) {
    // Create a blended background using scene background color mixed with textures
    // We'll use a fullscreen overlay approach via scene.background
    // Since Three.js doesn't support texture blending natively in scene.background,
    // we blend the sky colors (which we already do) and just set the dominant texture
    const dominantTex = skyBlendFactor > 0.5 ? prevSkyTex : currentSkyTex;
    scene.background = dominantTex;
  } else if (currentSkyTex) {
    scene.background = currentSkyTex;
  } else {
    scene.background = skyColor;
  }
  
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
  const cloudMat = new THREE.MeshToonMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.75 
  });
  const shadowMat = new THREE.MeshToonMaterial({ 
    color: 0xdddddd, 
    transparent: true, 
    opacity: 0.5 
  });
  
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();
    // Cumulus cloud: larger center puff, smaller side puffs, arranged horizontally
    const mainSize = 1.0 + Math.random() * 0.8;
    const puffCount = 4 + Math.floor(Math.random() * 4);
    
    // Main large center puff
    const mainGeo = new THREE.SphereGeometry(mainSize, 10, 8);
    const main = new THREE.Mesh(mainGeo, cloudMat);
    main.position.set(0, 0, 0);
    main.scale.set(1.4, 0.9, 1.0);
    cloud.add(main);
    
    // Bottom shadow puff
    const shadowGeo = new THREE.SphereGeometry(mainSize * 0.9, 8, 6);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, -mainSize * 0.3, 0);
    shadow.scale.set(1.5, 0.4, 1.1);
    cloud.add(shadow);
    
    // Side puffs arranged horizontally
    for (let j = 1; j < puffCount; j++) {
      const sideSize = mainSize * (0.4 + Math.random() * 0.5);
      const sideGeo = new THREE.SphereGeometry(sideSize, 8, 6);
      const side = new THREE.Mesh(sideGeo, cloudMat);
      const direction = j % 2 === 0 ? 1 : -1;
      const xOffset = direction * (mainSize * 0.6 + (j * 0.5) + Math.random() * 0.5);
      const yOffset = (Math.random() - 0.5) * mainSize * 0.4;
      const zOffset = (Math.random() - 0.5) * mainSize * 0.5;
      side.position.set(xOffset, yOffset, zOffset);
      side.scale.set(1.2, 0.8, 1.0);
      cloud.add(side);
    }
    
    // Top bumps for fluffy look
    for (let k = 0; k < 2; k++) {
      const bumpSize = mainSize * (0.3 + Math.random() * 0.3);
      const bumpGeo = new THREE.SphereGeometry(bumpSize, 8, 6);
      const bump = new THREE.Mesh(bumpGeo, cloudMat);
      bump.position.set(
        (Math.random() - 0.5) * mainSize,
        mainSize * 0.5 + Math.random() * mainSize * 0.3,
        (Math.random() - 0.5) * mainSize * 0.4
      );
      bump.scale.set(1.0, 0.8, 1.0);
      cloud.add(bump);
    }
    
    const scale = 1.0 + Math.random() * 1.5;
    cloud.scale.setScalar(scale);
    cloud.position.set(
      (Math.random() - 0.5) * 50,
      14 + Math.random() * 6,
      -Math.random() * 60
    );
    cloud.castShadow = false;
    scene.add(cloud);
    clouds.push(cloud);
  }
};

const spawnBonusPortal = () => {
  if (bonusPortal || inBonusZone) return;
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const portalGroup = new THREE.Group();
  
  // Golden ring
  const ringGeo = new THREE.TorusGeometry(1.5, 0.15, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = 'portal-ring';
  portalGroup.add(ring);
  
  // Inner shimmer
  const innerGeo = new THREE.CircleGeometry(1.4, 32);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.name = 'portal-inner';
  portalGroup.add(inner);
  
  // Rainbow particles around portal
  for (let i = 0; i < 8; i++) {
    const sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);
    const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x0000ff, 0x8800ff, 0xff00ff];
    const sparkMat = new THREE.MeshBasicMaterial({ color: colors[i] });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    const angle = (i / 8) * Math.PI * 2;
    spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
    spark.name = 'spark-' + i;
    portalGroup.add(spark);
  }
  
  portalGroup.position.set(laneX, 1.5, -50);
  portalGroup.userData = { lane };
  scene.add(portalGroup);
  bonusPortal = { mesh: portalGroup, lane };
};

const triggerRandomEvent = () => {
  if (activeEvent) return;
  activeEvent = 'fog';
  eventDuration = 6;
  fogDensity = 2; // gentler fog (was 5 — too hard)
  eventAlertTextRef.value = '\u{1F32B}\u{FE0F} FOG!';
};

const updateEvent = (delta) => {
  // Fog decay
  if (activeEvent === 'fog') {
    eventDuration -= delta;
    fogDensity = Math.max(0, fogDensity - delta * 0.3);
    if (eventDuration <= 0 || fogDensity <= 0) {
      fogDensity = 0;
      activeEvent = null;
      eventAlertTextRef.value = '';
    }
  }
  
  // Fog effect on scene fog
  if (scene.fog) {
    const baseNear = 20;
    const baseFar = 80;
    if (fogDensity > 0) {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, baseNear * 0.5, delta * 2);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar * 0.5, delta * 2);
    } else {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, baseNear, delta * 2);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar, delta * 2);
    }
  }
};

const createBackgroundElements = () => {
  // Priority texture loading: most visible objects first
  // 1. Building facades (most visible, darkest when missing)
  const buildingTextures = [
    textureLoader.load('assets/building_pink.webp'),
    textureLoader.load('assets/building_blue.webp'),
    textureLoader.load('assets/building_green.webp'),
  ];
  // Medieval fachwerkhaus texture
  let fachwerkTexture = null;
  const loadFachwerk = () => {
    if (!fachwerkTexture) {
      fachwerkTexture = textureLoader.load('assets/building_fachwerk.webp');
      fachwerkTexture.wrapS = THREE.RepeatWrapping;
      fachwerkTexture.wrapT = THREE.RepeatWrapping;
      fachwerkTexture.colorSpace = THREE.SRGBColorSpace;
    }
    return fachwerkTexture;
  };
  // Set dominant colors as fallback so buildings don't appear dark before texture loads
  const buildingDominantColors = [0xffb6c1, 0x87ceeb, 0x98fb98]; // pink, blue, green
  buildingTextures.forEach((tex, idx) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
  });
  // 2. Trees (billboard sprites) — grass already loaded above
  const treeRoundTex = textureLoader.load('assets/tree_round_clean.webp');
  const treePineTex = textureLoader.load('assets/tree_pine_clean.webp');
  
  for (let i = 0; i < 20; i++) {
    const isPine = Math.random() > 0.5;
    const treeTex = isPine ? treePineTex : treeRoundTex;
    const treeH = isPine ? 5.6 : 4.8;
    const treeW = isPine ? 3.2 : 4.0;
    
    // Billboard tree sprite (always faces camera)
    const spriteMat = new THREE.SpriteMaterial({ 
      map: treeTex, 
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    // Offset sprite up so bottom of visible content aligns with ground
    // Tree textures have ~12% bottom padding — shift center up by half
    sprite.scale.set(treeW, treeH, 1);
    
    const tree = new THREE.Group();
    tree.add(sprite);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    const treeZ = -10 - Math.random() * 30;
    const treeScale = 0.7 + Math.random() * 0.3;
    tree.scale.setScalar(treeScale);
    const treeBaseY = (treeH / 2) * treeScale;
    tree.position.set(
      side * (8 + Math.random() * 10),
      treeBaseY + getSurfaceY(treeZ),
      treeZ
    );
    tree.baseY = treeBaseY;
    tree.baseX = tree.position.x; // store for road curve
    // Store initial position for restart
    tree.userData.initX = tree.position.x;
    tree.userData.initZ = treeZ;
    tree.userData.initBaseX = tree.baseX;
    scene.add(tree);
    trees.push(tree);
  }
  
  // buildingTextures and buildingDominantColors loaded above
  const buildingColors = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd, 0xffa07a, 0xadd8e6];
  
  for (let i = 0; i < 12; i++) {
    const height = 5 + Math.random() * 10;
    const width = 3 + Math.random() * 4;
    const buildingGroup = new THREE.Group();
    
    // Use AI texture on front face, color on sides/back
    const texIdx = Math.floor(Math.random() * buildingTextures.length);
    const facadeTex = buildingTextures[texIdx];
    const facadeDominant = buildingDominantColors[texIdx]; // fallback color before texture loads
    const buildingGeo = new THREE.BoxGeometry(width, height, width);
    // Determine side early so we can texture the camera-visible face
    const side = Math.random() > 0.5 ? 1 : -1;
    // Multi-material: +X right, -X left, +Y top, -Y bottom, +Z front, -Z back
    // Camera-visible side gets facade texture
    const sideMat = new THREE.MeshToonMaterial({
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
    });
    const frontMat = new THREE.MeshToonMaterial({
      map: facadeTex,
      color: facadeDominant
    });
    const topMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const buildingMats = side < 0
      ? [frontMat, sideMat, topMat, topMat, frontMat, sideMat]  // left building: +X face visible
      : [sideMat, frontMat, topMat, topMat, frontMat, sideMat]  // right building: -X face visible
    const building = new THREE.Mesh(buildingGeo, buildingMats);
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    
    // Rooftop detail
    const roofGeo = new THREE.BoxGeometry(width + 0.3, 0.3, width + 0.3);
    const roofMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height / 2 + 0.15;
    buildingGroup.add(roof);
    
    const bldgZ = -20 - Math.random() * 60;
    buildingGroup.position.set(
      side * (10 + Math.random() * 10),
      height / 2 + getSurfaceY(bldgZ),
      bldgZ
    );
    scene.add(buildingGroup);
    buildingGroup.baseY = height / 2;
    buildingGroup.baseX = buildingGroup.position.x; // store for road curve
    // Store initial position for restart
    buildingGroup.userData.initX = buildingGroup.position.x;
    buildingGroup.userData.initZ = bldgZ;
    buildingGroup.userData.initBaseX = buildingGroup.baseX;
    buildings.push(buildingGroup);
  }
};

const spawnObstacle = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  // Pick obstacle type based on difficulty
  const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
  const stage = STAGES[currentStage.value]
  const isMedieval = stage.id === 'medieval'
  // Base obstacle types — filter for stage theme
  const types = isMedieval
    ? ['fruit', 'fruit', 'barrel', 'stone'] // medieval: no cars/buses
    : ['fruit', 'fruit', 'car']; // modern: cars allowed
  if (difficultyMultiplier > 1.3) types.push('stone', 'barrier');
  if (!isMedieval) {
    if (difficultyMultiplier > 1.8) types.push('police', 'bus');
    if (difficultyMultiplier > 2.2) types.push('fireengine', 'wall');
  } else {
    if (difficultyMultiplier > 1.8) types.push('wall', 'barrel');
    if (difficultyMultiplier > 2.2) types.push('barrier', 'stone');
  }
  if (difficultyMultiplier > 2.8) types.push('wall', 'barrel');
  const obsType = types[Math.floor(Math.random() * types.length)];
  
  let group, obsLane = lane, hitWidth = 1.5;
  
  switch (obsType) {
    case 'fruit': {
      group = new THREE.Group();
      const colors = [0xff0000, 0xffa500, 0x8b0000, 0xff69b4];
      const fruitColor = colors[Math.floor(Math.random() * colors.length)];
      const fruitGeo = new THREE.SphereGeometry(1.2, 24, 24);
      const fruitMat = new THREE.MeshToonMaterial({ color: fruitColor });
      const fruit = new THREE.Mesh(fruitGeo, fruitMat);
      fruit.castShadow = false;
      group.add(fruit);
      const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
      const stemMat = new THREE.MeshToonMaterial({ color: 0x228b22 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 1.0;
      group.add(stem);
      const leafGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const leafMat = new THREE.MeshToonMaterial({ color: 0x32cd32 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0.2, 1.2, 0);
      leaf.scale.set(1, 0.3, 1);
      group.add(leaf);
      group.position.set(laneX, 0.6, -50);
      break;
    }
    
    case 'car': {
      group = new THREE.Group();
      // Car body
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.0);
      const carColors = [0xff3333, 0x3366ff, 0xffcc00, 0x33cc33, 0xff6600, 0xcc33ff];
      const carMat = new THREE.MeshToonMaterial({ color: carColors[Math.floor(Math.random() * carColors.length)] });
      const body = new THREE.Mesh(bodyGeo, carMat);
      body.position.y = 0.6;
      body.castShadow = false;
      group.add(body);
      // Roof/cabin
      const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 1.5);
      const roofMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 1.2, -0.3);
      group.add(roof);
      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const [wx, wz] of [[-0.9, 1.0], [0.9, 1.0], [-0.9, -1.0], [0.9, -1.0]]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.3, wz);
        group.add(wheel);
      }
      // Headlights
      const hlGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      for (const hx of [-0.6, 0.6]) {
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(hx, 0.6, 1.51);
        group.add(hl);
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'police': {
      group = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.2);
      const bodyMat = new THREE.MeshToonMaterial({ color: 0x111133 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.6;
      body.castShadow = false;
      group.add(body);
      // White stripe
      const stripeGeo = new THREE.BoxGeometry(1.82, 0.2, 2.0);
      const stripeMat = new THREE.MeshToonMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.7, 0);
      group.add(stripe);
      // Roof + lights
      const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 1.5);
      const roofMat = new THREE.MeshToonMaterial({ color: 0x111133 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 1.2, -0.3);
      group.add(roof);
      // Siren lights (flash red/blue)
      const sirenGeo = new THREE.BoxGeometry(0.4, 0.15, 0.3);
      const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const blueMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const sirenL = new THREE.Mesh(sirenGeo, redMat);
      sirenL.position.set(-0.3, 1.55, -0.3);
      sirenL.name = 'siren-red';
      group.add(sirenL);
      const sirenR = new THREE.Mesh(sirenGeo, blueMat);
      sirenR.position.set(0.3, 1.55, -0.3);
      sirenR.name = 'siren-blue';
      group.add(sirenR);
      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const [wx, wz] of [[-0.9, 1.1], [0.9, 1.1], [-0.9, -1.1], [0.9, -1.1]]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.3, wz);
        group.add(wheel);
      }
      group.position.set(laneX, 0, -50);
      group.rotation.y = Math.PI / 2; // Police car across the road
      break;
    }
    
    case 'fireengine': {
      group = new THREE.Group();
      // Long red body
      const bodyGeo = new THREE.BoxGeometry(1.8, 1.2, 5.0);
      const bodyMat = new THREE.MeshToonMaterial({ color: 0xcc0000 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = false;
      group.add(body);
      // Cabin
      const cabGeo = new THREE.BoxGeometry(1.6, 1.0, 1.5);
      const cabMat = new THREE.MeshToonMaterial({ color: 0xcc0000 });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0, 1.8, 1.5);
      group.add(cab);
      // Windshield
      const wsGeo = new THREE.BoxGeometry(1.2, 0.6, 0.05);
      const wsMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      const ws = new THREE.Mesh(wsGeo, wsMat);
      ws.position.set(0, 1.9, 2.26);
      group.add(ws);
      // Ladder on top
      const ladderGeo = new THREE.BoxGeometry(0.15, 0.1, 3.5);
      const ladderMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
      for (const lx of [-0.4, 0.4]) {
        const rail = new THREE.Mesh(ladderGeo, ladderMat);
        rail.position.set(lx, 2.5, -0.5);
        group.add(rail);
      }
      // Ladder rungs
      const rungGeo = new THREE.BoxGeometry(0.8, 0.06, 0.06);
      for (let rz = -2.0; rz <= 1.0; rz += 0.4) {
        const rung = new THREE.Mesh(rungGeo, ladderMat);
        rung.position.set(0, 2.5, rz);
        group.add(rung);
      }
      // Wheels (6 wheels - 3 per side)
      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const wz of [1.8, 0.0, -1.8]) {
        for (const wx of [-0.95, 0.95]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.35, wz);
          group.add(wheel);
        }
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'bus': {
      group = new THREE.Group();
      // Long bus body
      const bodyGeo = new THREE.BoxGeometry(2.0, 1.5, 5.5);
      const busMat = new THREE.MeshToonMaterial({ color: 0xffaa00 });
      const body = new THREE.Mesh(bodyGeo, busMat);
      body.position.y = 1.1;
      body.castShadow = false;
      group.add(body);
      // Windows row
      const winGeo = new THREE.BoxGeometry(0.5, 0.4, 0.05);
      const winMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      for (let wz = -2.0; wz <= 2.0; wz += 0.8) {
        for (const wx of [-1.0, 1.0]) {
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(wx * (1.01), 1.3, wz);
          win.rotation.y = wx > 0 ? 0 : Math.PI;
          group.add(win);
        }
      }
      // Windshield
      const fwsGeo = new THREE.BoxGeometry(1.6, 0.6, 0.05);
      const fws = new THREE.Mesh(fwsGeo, winMat);
      fws.position.set(0, 1.3, 2.76);
      group.add(fws);
      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const wz of [2.0, -2.0]) {
        for (const wx of [-1.0, 1.0]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.35, wz);
          group.add(wheel);
        }
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'stone': {
      group = new THREE.Group();
      const stoneGeo = new THREE.DodecahedronGeometry(1.0, 1);
      const stoneMat = new THREE.MeshToonMaterial({ color: 0x888888 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.y = 0.7;
      stone.castShadow = false;
      // Random rotation for variety
      stone.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      group.add(stone);
      // Moss patches
      const mossGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const mossMat = new THREE.MeshToonMaterial({ color: 0x447744 });
      for (let m = 0; m < 3; m++) {
        const moss = new THREE.Mesh(mossGeo, mossMat);
        moss.position.set((Math.random()-0.5)*0.8, 1.0+Math.random()*0.3, (Math.random()-0.5)*0.8);
        moss.scale.set(1, 0.3, 1);
        group.add(moss);
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'barrier': {
      group = new THREE.Group();
      // Horizontal bar
      const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8);
      const barMat = new THREE.MeshToonMaterial({ color: 0xff6600 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.8;
      group.add(bar);
      // Striped cones
      const coneGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
      for (const cx of [-0.8, 0.0, 0.8]) {
        const coneMat = new THREE.MeshToonMaterial({ color: cx === 0 ? 0xff6600 : 0xffaa00 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(cx, 0.3, 0);
        group.add(cone);
      }
      // Stripes on bar (white bands)
      const stripGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.15, 8);
      const stripMat = new THREE.MeshToonMaterial({ color: 0xffffff });
      for (const sx of [-0.6, -0.2, 0.2, 0.6]) {
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.rotation.z = Math.PI / 2;
        strip.position.set(sx, 0.8, 0);
        group.add(strip);
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'wall': {
      group = new THREE.Group();
      // Wall spans 2 lanes — find which 2 to block
      const gapLane = lane; // the lane with the gap
      const blockedLanes = [0, 1, 2].filter(l => l !== gapLane);
      const wallX = ((blockedLanes[0] + blockedLanes[1] - 2) / 2) * laneWidth;
      
      // Brick wall
      const wallGeo = new THREE.BoxGeometry(4.0, 2.0, 0.5);
      const wallMat = new THREE.MeshToonMaterial({ color: 0xcc6633 });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.y = 1.0;
      wall.castShadow = false;
      group.add(wall);
      // Brick lines
      const lineGeo = new THREE.BoxGeometry(4.02, 0.04, 0.52);
      const lineMat = new THREE.MeshToonMaterial({ color: 0x993311 });
      for (let ly = 0.2; ly < 2.0; ly += 0.3) {
        const brickLine = new THREE.Mesh(lineGeo, lineMat);
        brickLine.position.y = ly;
        group.add(brickLine);
      }
      // Vertical brick gaps
      const vlineGeo = new THREE.BoxGeometry(0.04, 0.25, 0.52);
      for (let ly = 0.2; ly < 2.0; ly += 0.3) {
        const offset = (Math.floor(ly / 0.3) % 2) * 0.4;
        for (let lx = -1.8 + offset; lx < 2.0; lx += 0.8) {
          const vline = new THREE.Mesh(vlineGeo, lineMat);
          vline.position.set(lx, ly + 0.15, 0);
          group.add(vline);
        }
      }
      group.position.set(wallX, 0, -50);
      obsLane = gapLane; // gap lane for spawning purposes
      hitWidth = 2.5;
      group.userData.baseX = wallX; // custom X position (between 2 lanes)
      break;
    }
    
    case 'barrel': {
      group = new THREE.Group();
      // Barrel lying on its side: cylinder axis along Z (rolling direction)
      const barrelGroup = new THREE.Group();
      // Main barrel body
      const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 12);
      const barrelMat = new THREE.MeshToonMaterial({ color: 0x336699 });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = Math.PI / 2; // lay on side
      barrelGroup.add(barrel);
      // Hazard stripes on barrel body
      const stripeGeo2 = new THREE.CylinderGeometry(0.52, 0.52, 0.1, 12);
      const stripeMat2 = new THREE.MeshToonMaterial({ color: 0xffcc00 });
      const stripe1 = new THREE.Mesh(stripeGeo2, stripeMat2);
      stripe1.rotation.z = Math.PI / 2;
      stripe1.position.z = 0.3; // offset along barrel length
      barrelGroup.add(stripe1);
      const stripe2 = new THREE.Mesh(stripeGeo2, stripeMat2);
      stripe2.rotation.z = Math.PI / 2;
      stripe2.position.z = -0.3;
      barrelGroup.add(stripe2);
      // Barrel lids on each end
      const lidGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 12);
      const lidMat = new THREE.MeshToonMaterial({ color: 0x224466 });
      const lid1 = new THREE.Mesh(lidGeo, lidMat);
      lid1.rotation.z = Math.PI / 2;
      lid1.position.z = 0.5;
      barrelGroup.add(lid1);
      const lid2 = new THREE.Mesh(lidGeo, lidMat);
      lid2.rotation.z = Math.PI / 2;
      lid2.position.z = -0.5;
      barrelGroup.add(lid2);
      // Position barrel group: center at ground level (radius 0.5)
      barrelGroup.position.y = 0.5;
      group.add(barrelGroup);
      group.position.set(laneX, 0, -50);
      // Barrel rolls sideways across the road
      group.userData = { driftDir: Math.random() > 0.5 ? 1 : -1, driftSpeed: 0.015 + Math.random() * 0.02, barrelGroup };
      break;
    }
  }
  
  scene.add(group);
  group.position.y += getSurfaceY(-50); // apply curve at spawn
  group.baseY = group.position.y - getSurfaceY(-50); // store flat Y
  obstacles.push({ mesh: group, lane: obsLane, type: 'ground', obstacleType: obsType, hitWidth });
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
  dome.castShadow = false;
  ufoGroup.add(dome);
  
  // UFO saucer body (flattened disc)
  const saucerGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 24);
  const saucerMat = new THREE.MeshToonMaterial({ color: 0xcccccc, emissive: 0x444444, emissiveIntensity: 0.2 });
  const saucer = new THREE.Mesh(saucerGeo, saucerMat);
  saucer.castShadow = false;
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
  ufoGroup.position.y += getSurfaceY(-50); // apply curve at spawn
  ufoGroup.baseY = ufoGroup.position.y - getSurfaceY(-50); // store flat Y
  obstacles.push({ mesh: ufoGroup, lane, type: 'floating' });
};

// Shared geometry/material caches (avoid re-creating per spawn)
let sharedCoinGeo, sharedCoinMat;
let sharedShadowGeo, sharedShadowMat;

const spawnCoin = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  if (!sharedCoinGeo) {
    sharedCoinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    sharedCoinMat = new THREE.MeshToonMaterial({ 
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    });
  }
  const coinObj = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
  coinObj.castShadow = false;
  coinObj.position.set(laneX, 1, -50);
  
  scene.add(coinObj);
  coinObj.position.y += getSurfaceY(-50); // apply curve at spawn
  coinObj.baseY = coinObj.position.y - getSurfaceY(-50); // store flat Y
  coins.push({ mesh: coinObj, lane, collected: false });
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
  
  powerupGroup.position.set(laneX, 1 + getSurfaceY(-50), -50);
  powerupGroup.userData = { type };
  powerupGroup.baseY = 1; // flat Y without curve
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

const createFloatingText = (text, position, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = color || 'white';
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

// Boss spawn function
// Boss attack state
let bossAttackTimer = 0
let bossNextAttack = 3 // seconds until first attack
let bossProjectiles = []
let bossCharging = false
let bossChargeTimer = 0
let bossChargeTarget = 0

// Pending timeouts that must be cancelled on restart
let bossDefeatTimeout1 = null
let invincibilityTimeout = null
let gameOverShakeInterval = null
let gameOverTime = 0 // timestamp of game over, prevents instant restart
let gameStartTime = 0 // timestamp when game started, grace period for collisions

// Centralized game-over handler — all death paths must call this
const triggerGameOver = (shakeIntensity = 0.5) => {
  if (gameOver.value) return // already dead, don't double-fire
  gameOver.value = true
  gameOverTime = Date.now() // block restart for 1 second
  // Clean up bonus zone
  if (bonusPortal) { scene.remove(bonusPortal.mesh); bonusPortal = null; }
  inBonusZone = false; inBonusZoneRef.value = false; bonusTimer = 0; bonusTimerRef.value = 0;
  bonusNoSpawn = false;
  bonusCoins.forEach(bc => scene.remove(bc.mesh));
  bonusCoins = [];
  scene.userData.bonusEnvActive = false;
  if (scene.userData.nyanCat) {
    scene.remove(scene.userData.nyanCat);
    scene.userData.nyanCat = null;
    scene.userData.nyanCatTime = 0;
  }
  // Restore road material if in rainbow mode
  const roadGO = scene.getObjectByName('road');
  if (roadGO && originalRoadMaterial) {
    roadGO.material.dispose();
    roadGO.material = originalRoadMaterial;
    originalRoadMaterial = null;
  }
  // Discard saved substage state (we're starting fresh)
  if (savedSubstageState) {
    savedSubstageState.obstacles.forEach(obs => scene.remove(obs.mesh));
    savedSubstageState.coins.forEach(coin => scene.remove(coin.mesh));
    savedSubstageState = null;
  }
  // Restore building/tree visibility
  buildings.forEach(b => { b.visible = true; });
  trees.forEach(t => { t.visible = true; });
  // Immediately remove all game objects from scene so they can't interfere on restart
  obstacles.forEach(obs => { obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); }); scene.remove(obs.mesh); });
  obstacles = [];
  coins.forEach(coin => scene.remove(coin.mesh));
  coins = [];
  powerups.forEach(pw => scene.remove(pw.mesh));
  powerups = [];
  bossProjectiles.forEach(fb => scene.remove(fb));
  bossProjectiles = [];
  particles.forEach(p => scene.remove(p));
  particles = [];
  floatingTexts.forEach(t => scene.remove(t));
  floatingTexts = [];
  if (boss) { scene.remove(boss); boss = null; }
  // Cancel any pending boss/stage timeouts
  if (bossDefeatTimeout1) { clearTimeout(bossDefeatTimeout1); bossDefeatTimeout1 = null; }
  bossDefeated.value = false;
  bossCharging = false;

  // Save score + stats
  saveHighScore();
  if (score.value > gameStats.maxScore) gameStats.maxScore = score.value;
  if (gameDuration > gameStats.maxTime) gameStats.maxTime = gameDuration;
  if (score.value > gameStats.bestRun) gameStats.bestRun = score.value;
  saveProgress();
  // Effects
  playSound('crash');
  createParticleEffect(player.position, 0xff0000, 30);
  comboCount = 0;
  // Screen shake
  const originalPos = camera.position.clone();
  let shakeTime = 0;
  gameOverShakeInterval = setInterval(() => {
    shakeTime += 0.05;
    if (shakeTime > 0.5) {
      camera.position.copy(originalPos);
      clearInterval(gameOverShakeInterval);
      gameOverShakeInterval = null;
      return;
    }
    camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
    camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
  }, 30);
  // Show name entry if high score
  showNameEntry.value = isHighScore.value;
};

function spawnBoss(bossType) {
  if (boss) { scene.remove(boss); boss = null; }
  bossProjectiles = []
  bossAttackTimer = 0
  bossNextAttack = 2 + Math.random() * 2
  bossCharging = false
  bossChargeTimer = 0
  
  const group = new THREE.Group()
  group.name = 'boss'
  
  if (bossType === 'truck') {
    // Truck boss — big red box with headlights
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 5),
      new THREE.MeshPhongMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.2 })
    )
    body.position.y = 1.5
    group.add(body)
    // Cab
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshPhongMaterial({ color: 0xcc1111 })
    )
    cab.position.set(0, 3, 1)
    group.add(cab)
    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.2, 6, 6)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff88 })
    const hl = new THREE.Mesh(lightGeo, lightMat)
    hl.position.set(-0.8, 1.5, 2.5)
    group.add(hl)
    const hr = new THREE.Mesh(lightGeo, lightMat)
    hr.position.set(0.8, 1.5, 2.5)
    group.add(hr)
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8)
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
    for (const [x, z] of [[-1.6, 1.5], [1.6, 1.5], [-1.6, -1.5], [1.6, -1.5]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat)
      w.rotation.z = Math.PI / 2
      w.position.set(x, 0.4, z)
      group.add(w)
    }
  } else {
    // Dragon boss — detailed polygon dragon
    const dMat = new THREE.MeshPhongMaterial({ color: 0x9933ff, emissive: 0x4400aa, emissiveIntensity: 0.25 })
    const dMatDark = new THREE.MeshPhongMaterial({ color: 0x6622aa, emissive: 0x330066, emissiveIntensity: 0.2 })
    const dMatBelly = new THREE.MeshPhongMaterial({ color: 0xcc88ff, emissive: 0x8844cc, emissiveIntensity: 0.15 })
    // Body — elongated ellipsoid
    const bodyGeo = new THREE.SphereGeometry(1, 8, 6)
    bodyGeo.scale(1.2, 0.8, 2.0)
    const body = new THREE.Mesh(bodyGeo, dMat)
    body.position.y = 0
    group.add(body)
    // Belly — slightly protruding underside
    const bellyGeo = new THREE.SphereGeometry(0.7, 6, 4)
    bellyGeo.scale(0.9, 0.6, 1.8)
    const belly = new THREE.Mesh(bellyGeo, dMatBelly)
    belly.position.set(0, -0.3, 0.1)
    group.add(belly)
    // Head — sphere + snout
    const headGeo = new THREE.SphereGeometry(0.6, 8, 6)
    const head = new THREE.Mesh(headGeo, dMat)
    head.position.set(0, 0.5, 2.2)
    group.add(head)
    // Snout
    const snoutGeo = new THREE.ConeGeometry(0.35, 1.0, 6)
    const snout = new THREE.Mesh(snoutGeo, dMat)
    snout.rotation.x = -Math.PI / 2
    snout.position.set(0, 0.3, 3.0)
    group.add(snout)
    // Eyes — glowing
    const eyeGeo = new THREE.SphereGeometry(0.12, 6, 6)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
    const le = new THREE.Mesh(eyeGeo, eyeMat)
    le.position.set(-0.25, 0.7, 2.7)
    group.add(le)
    const re = new THREE.Mesh(eyeGeo, eyeMat)
    re.position.set(0.25, 0.7, 2.7)
    group.add(re)
    // Horns
    const hornGeo = new THREE.ConeGeometry(0.1, 0.8, 5)
    const hornMat = new THREE.MeshPhongMaterial({ color: 0xddcc88 })
    const lh = new THREE.Mesh(hornGeo, hornMat)
    lh.position.set(-0.3, 1.0, 2.1)
    lh.rotation.z = 0.4
    group.add(lh)
    const rh = new THREE.Mesh(hornGeo, hornMat)
    rh.position.set(0.3, 1.0, 2.1)
    rh.rotation.z = -0.4
    group.add(rh)
    // Wings — large bat-like (3 segments each)
    const wingMat = new THREE.MeshPhongMaterial({ color: 0x7722cc, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    // Left wing — 3 triangular flaps
    for (let s = 0; s < 3; s++) {
      const wGeo = new THREE.BufferGeometry()
      const angle = -0.3 - s * 0.3
      const len = 2.5 - s * 0.5
      const wVerts = new Float32Array([0,0,0, -len, 0.8+s*0.3, -0.3+s*0.2, -len*0.6, -0.2, 0.2+s*0.1])
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3))
      wGeo.computeVertexNormals()
      const wMesh = new THREE.Mesh(wGeo, wingMat)
      wMesh.position.set(-0.8, 0.3, -0.5)
      group.add(wMesh)
    }
    // Right wing
    for (let s = 0; s < 3; s++) {
      const wGeo = new THREE.BufferGeometry()
      const len = 2.5 - s * 0.5
      const wVerts = new Float32Array([0,0,0, len, 0.8+s*0.3, -0.3+s*0.2, len*0.6, -0.2, 0.2+s*0.1])
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3))
      wGeo.computeVertexNormals()
      const wMesh = new THREE.Mesh(wGeo, wingMat)
      wMesh.position.set(0.8, 0.3, -0.5)
      group.add(wMesh)
    }
    // Tail — chain of 5 spheres
    for (let t = 0; t < 5; t++) {
      const tGeo = new THREE.SphereGeometry(0.3 - t * 0.04, 6, 4)
      const tMesh = new THREE.Mesh(tGeo, dMatDark)
      tMesh.position.set(0, -0.1 + Math.sin(t*0.5)*0.2, -1.2 - t * 0.6)
      group.add(tMesh)
    }
    // Tail tip — spike
    const tipGeo = new THREE.ConeGeometry(0.15, 0.5, 4)
    const tip = new THREE.Mesh(tipGeo, hornMat)
    tip.rotation.x = Math.PI / 2
    tip.position.set(0, -0.1, -4.4)
    group.add(tip)
    // Legs — 4 stubby
    const legGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 5)
    for (const [x, z] of [[-0.6, 0.8], [0.6, 0.8], [-0.5, -0.5], [0.5, -0.5]]) {
      const leg = new THREE.Mesh(legGeo, dMatDark)
      leg.position.set(x, -0.7, z)
      group.add(leg)
    }
  }
  
  group.position.set(0, bossType === 'truck' ? 0 : 5, -36)
  scene.add(group)
  boss = group
}

function spawnBossProjectile(type) {
  if (type === 'truck') {
    // Truck charges — aim for character, then ram straight without changing trajectory
    bossCharging = true
    bossChargeTimer = 0
    bossChargeTarget = -5
    playSFX('truck_rev')
    // Lock target: aim for character's current position, then straight line
    if (boss) {
      boss.userData = boss.userData || {}
      boss.userData.chargeTargetX = player.position.x // aim for character position
      boss.userData.chargeStartX = boss.position.x
      boss.userData.chargeStartZ = boss.position.z
      boss.userData.chargeMissTriggered = false
    }
  } else {
    // Dragon fires 2-3 fireballs at different lanes & heights
    const lanes = [0, 1, 2]
    const playerLane = currentLane
    const otherLanes = lanes.filter(l => l !== playerLane).sort(() => Math.random() - 0.5)
    const attackLanes = [playerLane]
    const extra = Math.random() > 0.3 ? 2 : 1
    for (let i = 0; i < Math.min(extra, otherLanes.length); i++) attackLanes.push(otherLanes[i])
    
    attackLanes.forEach((lane, idx) => {
      const targetX = (lane - 1) * laneWidth
      const fbY = 0.3 + Math.random() * 3.2 // random height between 0.3 and 3.5
      
      const fbGeo = new THREE.SphereGeometry(0.5, 8, 8)
      const fbMat = new THREE.MeshBasicMaterial({ color: 0xff6600 })
      const fb = new THREE.Mesh(fbGeo, fbMat)
      const glowGeo = new THREE.SphereGeometry(0.8, 8, 8)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.4 })
      fb.add(new THREE.Mesh(glowGeo, glowMat))
      
      fb.position.set(boss.position.x + (Math.random() - 0.5) * 3, fbY, boss.position.z + 2 + Math.random() * 2)
      fb.userData = { targetX, targetLane: lane, targetY: fbY, speed: 0.3 + Math.random() * 0.3, delay: idx * 0.15 }
      scene.add(fb)
      bossProjectiles.push(fb)
    })
    createFloatingText('\u{1f525}', new THREE.Vector3((attackLanes[0] - 1) * laneWidth, 2, -5), '#ff6600')
    playSFX('fire_shoot', 0.5) // per volley, not per bullet
  }
}

// Comic-book word art for bullet time

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
    // Still render scene when game over so background stays visible
    camera.lookAt(0, 1, -8);
    composer.render();
    return;
  }

  // Freeze game during countdown
  if (countdownLocked) {
    clock.getDelta(); // consume delta to prevent time jump
    camera.lookAt(0, 1, -8);
    composer.render();
    return;
  }

  const realDelta = clock.getDelta(); // unscaled real time
  const delta = realDelta;
  const time = clock.getElapsedTime();
  
  if (!gameOver.value && !stageTransitioning.value && !countdownLocked) gameDuration += delta;
  dayCycleTime = (dayCycleTime + delta) % DAY_DURATION;
  
  // === STAGE TIME TRACKING ===
  if (!countdownLocked && !gameOver.value && !stageTransitioning.value) {
    stageTime.value += realDelta
  }

  // === CURVE OSCILLATION (not during boss, or disabled) ===
  // Curve front sweeps from horizon toward player so you can see it approaching
  if (!bossActive.value && roadCurveEnabled.value) {
    curveChangeTimer.value += realDelta
    if (curveChangeTimer.value >= nextCurveChange.value) {
      if (Math.abs(roadCurveTarget.value) < 0.1) {
        // Start a new curve — front starts at horizon
        roadCurveTarget.value = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6)
        curveFrontZ.value = -80 // front starts at horizon, sweeps toward player
        nextCurveChange.value = 2.5 + Math.random() * 1.5
      } else {
        // Straighten out — when straight, curve doesn't need a front
        roadCurveTarget.value = 0
        nextCurveChange.value = 5 + Math.random() * 5
      }
      curveChangeTimer.value = 0
    }
    // Lerp curve value
    const lerpSpeed = Math.abs(roadCurveTarget.value) > 0.1 ? Math.min(realDelta * 1.5, 0.1) : Math.min(realDelta * 0.8, 0.05)
    roadCurve.value += (roadCurveTarget.value - roadCurve.value) * lerpSpeed
    // Sweep curve front toward player (0 = right at player)
    // Front moves at road speed so the bend visually approaches
    if (curveFrontZ.value < 0) {
      curveFrontZ.value += realDelta * 25 // takes ~3.2 seconds to sweep from -80 to 0
      if (curveFrontZ.value > 0) curveFrontZ.value = 0
    }
  } else {
    roadCurve.value += (0 - roadCurve.value) * Math.min(realDelta * 1.0, 0.06)
  }

  // === UPDATE ROAD MESH CURVE ===
  updateRoadCurve();
  
  // Scroll cobblestone texture
  if (cobblestoneTexture && currentStage.value > 0) {
    cobblestoneTexture.offset.y += gameSpeed * 0.05;
  }

  // === BOSS WARNING + SPAWN TRIGGER ===
  const stage = STAGES[currentStage.value]
  const bossSpawnTime = stage.stageDuration
  
  // Warning 5s before boss
  if (stageTime.value >= bossSpawnTime - 5 && stageTime.value < bossSpawnTime && !bossActive.value && !bossWarning.value && !bossDefeated.value) {
    bossWarning.value = true
    createFloatingText('\u26A0\uFE0F BOSS INCOMING! \u26A0\uFE0F', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
  }
  
  // Spawn boss
  if (stageTime.value >= bossSpawnTime && !bossActive.value && !bossDefeated.value && !stageTransitioning.value) {
    bossWarning.value = false
    bossActive.value = true
    bossHealth.value = 100
    createFloatingText(`\u26A0\uFE0F ${stage.bossType === 'truck' ? 'ROAD RAGE TRUCK' : 'SKY TERROR DRAGON'} \u26A0\uFE0F`, player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
    playSFX(stage.bossType === 'truck' ? 'truck_honk' : 'dragon_cry', 0.6)
    spawnBoss(stage.bossType)
  }

  // === BOSS TIMER (decrement health over bossDuration seconds) ===
  if (bossActive.value && !bossDefeated.value) {
    bossHealth.value -= (100 / stage.bossDuration) * realDelta
    if (bossHealth.value <= 0) {
      bossDefeated.value = true
      bossActive.value = false
      bossHealth.value = 0
      createFloatingText('\u2728 STAGE CLEAR! \u2728', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#44ff44')
      playSFX('stage_clear')
      // Block spawning immediately — stageTransitioning prevents obstacle/coin/powerup spawns
      stageTransitioning.value = true
      // Boss defeat explosion
      if (boss) {
        const bossPos = boss.position.clone()
        for (let i = 0; i < 20; i++) {
          const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
          const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xffaa00 : 0xff4400 })
          const p = new THREE.Mesh(pGeo, pMat)
          p.position.copy(bossPos).add(new THREE.Vector3((Math.random()-0.5)*3, Math.random()*3, (Math.random()-0.5)*3))
          p.userData = { velocity: new THREE.Vector3((Math.random()-0.5)*0.3, Math.random()*0.2, (Math.random()-0.5)*0.3), life: 1.5 }
          scene.add(p)
          particles.push(p)
        }
        scene.remove(boss); boss = null
      }
      // Clean up boss projectiles
      bossProjectiles.forEach(fb => scene.remove(fb))
      bossProjectiles = []
      // After 5s: reset speed, clear obstacles, transition to next stage, resume spawning
      bossDefeatTimeout1 = setTimeout(() => {
        const nextStage = (currentStage.value + 1) % STAGES.length
        currentStage.value = nextStage
        applyStageVisuals(nextStage)
        createFloatingText(`STAGE ${nextStage + 1}: ${STAGES[nextStage].name}`, player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffffff')
        // Reset for new stage — like a new game but score continues
        gameDuration = 1.5 // skip spawn grace (5s pause was enough)
        gameSpeed = 0.25 // reset to default speed immediately
        stageTime.value = 0
        lastSpawnTime = clock.getElapsedTime() // reset spawn timer
        // Clear remaining obstacles + coins
        obstacles.forEach(obs => scene.remove(obs.mesh))
        obstacles = []
        coins.forEach(coin => scene.remove(coin.mesh))
        coins = []
        powerups.forEach(pw => scene.remove(pw.mesh))
        powerups = []
        spawnInterval = 1.2
        bossDefeated.value = false
        stageTransitioning.value = false
        bossDefeatTimeout1 = null
      }, 5000)
    }
  }

  // === BOSS ANIMATION + ATTACK AI ===
  if (boss && bossActive.value && !bossDefeated.value) {
    const bossType = STAGES[currentStage.value].bossType
    
    if (bossCharging) {
      // Truck charge — straight line from start position to target lane at z=0
      bossChargeTimer += realDelta
      const chargeSpeed = gameSpeed * 1.2
      boss.position.z += chargeSpeed
      // Linear interpolation: X moves proportionally to Z progress
      const startZ = boss.userData.chargeStartZ || -54
      const startXX = boss.userData.chargeStartX || boss.position.x
      const targetX = boss.userData.chargeTargetX
      const totalDist = Math.abs(0 - startZ) // distance from start Z to player Z (0)
      const traveled = Math.abs(boss.position.z - startZ)
      const progress = Math.min(traveled / totalDist, 1)
      boss.position.x = startXX + (targetX - startXX) * progress
      // Clamp X to road width
      boss.position.x = Math.max(-laneWidth * 1.5, Math.min(laneWidth * 1.5, boss.position.x))
      if (bossType === 'truck') boss.position.y = getSurfaceY(boss.position.z)
      
      // Charge past player then retreat
      if (boss.position.z > 5 || bossChargeTimer > 4) {
        bossCharging = false
        boss.userData = boss.userData || {}
        boss.userData.retreatPhase = true
        boss.userData.retreatTimer = 0
        boss.userData.retreatStartX = boss.position.x
        boss.userData.retreatStartZ = boss.position.z
        boss.userData.chargeMissTriggered = false
      }
    } else if (boss.userData?.retreatPhase) {
      // Retreat back to start position (no collision during retreat)
      boss.userData.retreatTimer += realDelta
      const retreatDuration = bossType === 'truck' ? 2.5 : 4.0
      const t = Math.min(boss.userData.retreatTimer / retreatDuration, 1)
      // Ease-out retreat
      const easeT = 1 - Math.pow(1 - t, 3)
      const startZ = boss.userData.retreatStartZ || 5
      const startX = boss.userData.retreatStartX || boss.position.x
      boss.position.z = startZ + (-54 - startZ) * easeT
      if (bossType === 'truck') {
        // Truck: go straight back to center, don't track player
        boss.position.x = startX + (getCurveX(-54) - startX) * easeT
        boss.position.y = getSurfaceY(boss.position.z)
      } else {
        // Dragon: drift toward road curve center
        const targetX = getCurveX(boss.position.z)
        boss.position.x += (targetX - boss.position.x) * 0.1
      }
      if (t >= 1) {
        boss.userData.retreatPhase = false
        boss.position.z = -54
      }
    } else {
      // Idle: hover/sway
      const sway = Math.sin(Date.now() * 0.001) * 3
      boss.position.z = -54 + sway
      if (bossType === 'truck') {
        // Truck: swivel left-right, tracking player lane
        const swivelX = Math.sin(Date.now() * 0.003) * 1.5
        boss.position.x = swivelX + getCurveX(boss.position.z)
        boss.position.y = getSurfaceY(boss.position.z)
        boss.rotation.y = 0
      } else {
        boss.position.x = getCurveX(boss.position.z)
        boss.position.y = 5 + Math.sin(Date.now() * 0.002) * 1.5 + getSurfaceY(boss.position.z)
        boss.rotation.y = 0 // face player, no spinning
        // Animate dragon parts
        boss.children.forEach(child => {
          // Wing flap (left + right wings)
          if (child.position.x < -1) { // left wing segments
            child.rotation.z = 0.3 + Math.sin(Date.now() * 0.005) * 0.3
          } else if (child.position.x > 1) { // right wing segments
            child.rotation.z = -0.3 - Math.sin(Date.now() * 0.005) * 0.3
          }
        })
        // Tail sway
        const tailSway = Math.sin(Date.now() * 0.003) * 0.3
        boss.children.forEach(child => {
          if (child.position.z < -1 && child.geometry?.type === 'SphereGeometry') {
            child.position.x = tailSway * (-child.position.z / 4)
          }
        })
        // Mouth open when about to attack
        if (bossAttackTimer > bossNextAttack * 0.7) {
          const snout = boss.children.find(c => c.geometry?.type === 'ConeGeometry' && c.position.z > 2)
          if (snout) snout.rotation.x = -Math.PI / 2 + Math.sin(Date.now() * 0.01) * 0.15
        }
      }
    }
    
    // Attack timer — skip during truck charge AND retreat (truck uses charge cycles, not projectile spam)
    const truckBusy = bossType === 'truck' && (bossCharging || boss.userData?.retreatPhase)
    if (!truckBusy) {
      bossAttackTimer += realDelta
      if (bossAttackTimer >= bossNextAttack) {
        bossAttackTimer = 0
        bossNextAttack = 0.8 + Math.random() * 0.6 // rapid burst interval
        spawnBossProjectile(bossType)
        // Screen shake on attack
        cameraShakeTimer = 0.3; cameraShakeIntensity = 0.15
      }
    }
  }
  
  // === BOSS PROJECTILE MOVEMENT + COLLISION ===
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const fb = bossProjectiles[i]
    fb.position.z += fb.userData.speed
    fb.position.x += (fb.userData.targetX - fb.position.x) * 0.05
    fb.position.y += (fb.userData.targetY - fb.position.y) * 0.04 // converge to target height
    fb.rotation.y += 0.1
    
    // Skip collision if game over, countdown, or grace period
    if (gameOver.value || countdownLocked || Date.now() - gameStartTime < 2000) continue;
    // Collision with player
    const dist = player.position.distanceTo(fb.position)
    if (dist < 1.5) {
      if (!isInvincible) {
        // Dragon fireball = instant death, truck = damage
        if (STAGES[currentStage.value].bossType === 'dragon') {
          createFloatingText('HIT!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
          triggerGameOver(0.4)
        } else {
          bossHealth.value = Math.min(100, bossHealth.value + 10)
          createFloatingText('HIT', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
          cameraShakeTimer = 0.5; cameraShakeIntensity = 0.25
          isInvincible = true
          invincibilityTimeout = setTimeout(() => { isInvincible = false; invincibilityTimeout = null }, 1500)
        }
      }
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
      continue
    }
    
    // Near-miss — player dodges close, damages boss
    if (!fb.userData.nearMissTriggered && dist < 2.5 && dist >= 1.5) {
      fb.userData.nearMissTriggered = true
      bossHealth.value -= 8
      createFloatingText('⚡', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#44ff44')
    }
    
    // Remove if past player
    if (fb.position.z > 10) {
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
    }
  }
  
  // Boss collision: any touch = game over for both truck and dragon
  if (bossCharging && boss && !gameOver.value && !countdownLocked && Date.now() - gameStartTime >= 2000) {
    const dx = player.position.x - boss.position.x
    const dz = player.position.z - boss.position.z
    const inZRange = Math.abs(dz) < 3
    if (inZRange && Math.abs(dx) < 2.0 && !isInvincible) {
      // Boss hit — instant kill
      createFloatingText('HIT!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
      triggerGameOver(0.5)
    }
    // Near-miss dodge: close but escaped
    if (inZRange && !boss.userData?.chargeMissTriggered && Math.abs(dx) >= 2.0 && Math.abs(dx) < 4.0) {
      if (!boss.userData) boss.userData = {}
      boss.userData.chargeMissTriggered = true
      bossHealth.value -= 12
      createFloatingText('DODGE!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#44ff44')
    }
  }

  // Day/night cycle
  updateDayNightCycle(delta);
  
  // Progressive difficulty scaling
  // Speed increases every 30 seconds, caps at 3.5x base speed
  const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
  const targetSpeed = 0.25 * difficultyMultiplier * STAGES[currentStage.value].difficultyMultiplier;
  gameSpeed = THREE.MathUtils.lerp(gameSpeed, targetSpeed, 0.01);
  
  
  // Spawn interval decreases over time (more obstacles)
  spawnInterval = Math.max(0.35, 1.2 - (gameDuration / 80)) / STAGES[currentStage.value].difficultyMultiplier;
  
  score.value += Math.floor(delta * 50 * difficultyMultiplier);

  // === BONUS PORTAL SPAWN (not during boss) ===
  if (!bonusPortal && !inBonusZone && !bossActive.value && Math.random() < 0.001) {
    spawnBonusPortal();
  }
  
  // Bonus portal animation & collection
  if (bonusPortal) {
    bonusPortal.mesh.position.z += gameSpeed;
    // Road curve: absolute position based on lane + curve offset
    bonusPortal.mesh.position.x = ((bonusPortal.lane - 1) * laneWidth) + getCurveX(bonusPortal.mesh.position.z)
    // Curved earth
    bonusPortal.mesh.position.y = (bonusPortal.mesh.baseY || 1.5) + getSurfaceY(bonusPortal.mesh.position.z);
    bonusPortal.mesh.rotation.x = getSurfaceTilt(bonusPortal.mesh.position.z);
    // Spin and pulse portal
    const ring = bonusPortal.mesh.getObjectByName('portal-ring');
    if (ring) ring.rotation.z += 0.05;
    const inner = bonusPortal.mesh.getObjectByName('portal-inner');
    if (inner) {
      inner.material.color.setHSL((clock.getElapsedTime() * 0.5) % 1, 1, 0.5);
    }
    // Sparkle animation
    for (let i = 0; i < 8; i++) {
      const spark = bonusPortal.mesh.getObjectByName('spark-' + i);
      if (spark) {
        const angle = (i / 8) * Math.PI * 2 + clock.getElapsedTime() * 2;
        spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
      }
    }
    // Collision check (only during active gameplay)
    if (!gameOver.value && !countdownLocked) {
      const dist = player.position.distanceTo(bonusPortal.mesh.position);
      if (dist < 2.0) {
        // Enter bonus zone!
        inBonusZone = true;
        bonusTimer = 5;
        inBonusZoneRef.value = true;
        bonusTimerRef.value = 5;
        scene.remove(bonusPortal.mesh);
        bonusPortal = null;
        playSound('powerup');
      }
    }
    // Clean up portal if it passed the player
    if (bonusPortal && bonusPortal.mesh.position.z > 15) {
      scene.remove(bonusPortal.mesh);
      bonusPortal = null;
    }
  } // end if (bonusPortal)
  
  // Bonus zone timer
  if (inBonusZone) {
    // Hide buildings and trees, change road to rainbow
    if (!scene.userData.bonusEnvActive) {
      // Save all current game state
      savedSubstageState = {
        obstacles: obstacles.slice(),
        coins: coins.slice(),
        gameSpeed,
        spawnInterval,
        dayCycleTime,
        buildingVis: buildings.map(b => b.visible),
        treeVis: trees.map(t => t.visible),
      };
      // Remove obstacle and coin meshes from scene, clear arrays (but don't dispose — we restore them!)
      obstacles.forEach(obs => scene.remove(obs.mesh));
      coins.forEach(coin => scene.remove(coin.mesh));
      obstacles.length = 0;
      coins.length = 0;
      bonusNoSpawn = true;
      // Hide buildings and trees
      buildings.forEach(b => b.visible = false);
      trees.forEach(t => t.visible = false);
      // Rainbow road with left-to-right gradient
      const road = scene.getObjectByName('road');
      if (road) {
        originalRoadMaterial = road.material;
        road.material = new THREE.ShaderMaterial({
          transparent: true,
          uniforms: {
            uTime: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              // Left side = different hue from right, cycling over time
              float hue = fract(vUv.x * 1.5 + uTime * 0.15 + vUv.y * 0.3);
              // RGB from HSL (simplified rainbow) — mild and pastel
              float h = hue * 6.0;
              float c = 0.75; // moderately saturated
              float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
              vec3 col;
              if (h < 1.0) col = vec3(c, x, 0.0);
              else if (h < 2.0) col = vec3(x, c, 0.0);
              else if (h < 3.0) col = vec3(0.0, c, x);
              else if (h < 4.0) col = vec3(0.0, x, c);
              else if (h < 5.0) col = vec3(x, 0.0, c);
              else col = vec3(c, 0.0, x);
              // Mix with light base for soft but colorful look
              col = mix(col, vec3(0.95, 0.95, 1.0), 0.25);
              gl_FragColor = vec4(col, 0.9);
            }
          `,
        });
      }
      // Set fixed bonus speed
      savedSubstageState.savedGameSpeed = gameSpeed;
      gameSpeed = 0.3;
      // Spawn bonus coins at ground level
      bonusCoins = [];
      for (let i = 0; i < 40; i++) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const z = -i * 2.5 - 5;
        const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const coinMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.3 });
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.set(lane * laneWidth, 0.5, z);
        coinMesh.rotation.x = Math.PI / 2;
        scene.add(coinMesh);
        bonusCoins.push({ mesh: coinMesh, collected: false, baseX: lane * laneWidth });
      }
      scene.userData.bonusEnvActive = true;
      
      // Nyan Cat flies across the sky! (meme-accurate PNG sprite)
      const nyanTex = textureLoader.load('assets/nyan_cat.png');
      const nyanSpriteMat = new THREE.SpriteMaterial({
        map: nyanTex,
        transparent: true,
        depthWrite: false
      });
      const nyanCat = new THREE.Sprite(nyanSpriteMat);
      nyanCat.scale.set(5, 5.5, 1); // scale to match real nyan cat proportions
      nyanCat.position.set(-30, 10, -20); // start off-screen LEFT, fly RIGHT
      scene.add(nyanCat);
      scene.userData.nyanCat = nyanCat;
      scene.userData.nyanCatTime = 0;
    }
    // Nyan Cat animation
    if (scene.userData.nyanCat) {
      scene.userData.nyanCatTime += delta * 8; // speed across sky
      const nyanX = -30 + scene.userData.nyanCatTime; // fly RIGHT
      scene.userData.nyanCat.position.x = nyanX;
      scene.userData.nyanCat.position.y = 10 + Math.sin(scene.userData.nyanCatTime * 2) * 0.5; // gentle bob
      // Loop: when off-screen right, restart from left
      if (nyanX > 30) {
        scene.userData.nyanCatTime = 0;
        scene.userData.nyanCat.position.x = -30;
      }
    }
    // Rainbow road animation
    const road = scene.getObjectByName('road');
    if (road && road.material && road.material.uniforms) {
      road.material.uniforms.uTime.value = clock.getElapsedTime();
    }
    bonusTimer -= delta;
    bonusTimerRef.value = Math.ceil(bonusTimer);
    if (bonusTimer <= 0) {
      inBonusZone = false;
      inBonusZoneRef.value = false;
      bonusTimerRef.value = 0;
      // Clear bonus coins
      bonusCoins.forEach(bc => scene.remove(bc.mesh));
      bonusCoins = [];
      // Remove Nyan Cat
      if (scene.userData.nyanCat) {
        scene.remove(scene.userData.nyanCat);
        scene.userData.nyanCat = null;
        scene.userData.nyanCatTime = 0;
      }
      // Restore all saved state
      if (savedSubstageState) {
        // Restore obstacles
        obstacles.length = 0;
        savedSubstageState.obstacles.forEach(obs => { scene.add(obs.mesh); obstacles.push(obs); });
        // Restore coins
        coins.length = 0;
        savedSubstageState.coins.forEach(coin => { scene.add(coin.mesh); coins.push(coin); });
        // Restore speed and timing
        gameSpeed = savedSubstageState.savedGameSpeed || savedSubstageState.gameSpeed;
        spawnInterval = savedSubstageState.spawnInterval;
        dayCycleTime = savedSubstageState.dayCycleTime;
        // Restore buildings/trees visibility
        buildings.forEach((b, i) => { if (savedSubstageState.buildingVis[i] !== undefined) b.visible = savedSubstageState.buildingVis[i]; });
        trees.forEach((t, i) => { if (savedSubstageState.treeVis[i] !== undefined) t.visible = savedSubstageState.treeVis[i]; });
        savedSubstageState = null;
      }
      bonusNoSpawn = false;
      // Restore road
      const road = scene.getObjectByName('road');
      if (road && originalRoadMaterial) {
        road.material.dispose();
        road.material = originalRoadMaterial;
        originalRoadMaterial = null;
      }
      scene.userData.bonusEnvActive = false;
      // Particle burst ejection
      createParticleEffect(player.position, 0xff00ff, 30);
      createParticleEffect(player.position, 0x00ffff, 30);
      playSound('achievement');
    }
  }
  
  // === ENVIRONMENTAL EVENTS ===
  eventTimer += delta;
  if (eventTimer > 30 + Math.random() * 15 && !activeEvent) {
    triggerRandomEvent();
    eventTimer = 0;
  }
  updateEvent(delta);
  
  // Clear event alert text after a delay
  if (eventAlertTextRef.value && !activeEvent) {
    if (!scene.userData.eventAlertTimer) scene.userData.eventAlertTimer = 0;
    scene.userData.eventAlertTimer += delta;
    if (scene.userData.eventAlertTimer > 1.5) {
      eventAlertTextRef.value = '';
      scene.userData.eventAlertTimer = 0;
    }
  } else {
    scene.userData.eventAlertTimer = 0;
  }

  // Grace period: don't spawn obstacles for the first 1.5 seconds (but still move existing ones)
  const spawnGraceActive = gameDuration < 1.5;
  if (!spawnGraceActive && time - lastSpawnTime > spawnInterval && !bonusNoSpawn && !bossActive.value && !stageTransitioning.value) {
    if (Math.random() < 0.7) {
      if (Math.random() < 0.3) {
        spawnFloatingObstacle();
      } else {
        spawnObstacle();
      }
    }
    if (Math.random() < 0.5 + (gameDuration / 120)) spawnCoin();
    if (Math.random() < 0.05) spawnPowerup();
    lastSpawnTime = time;
  }

  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += gameSpeed;
    // Road curvature: shift obstacles laterally based on depth
    const baseX = obs.mesh.userData.baseX !== undefined ? obs.mesh.userData.baseX : ((obs.lane - 1) * laneWidth)
    const laneX = baseX + getCurveX(obs.mesh.position.z)
    // For police/UFO: add accumulated drift offset
    const driftOffset = obs.mesh.userData.driftX || 0
    obs.mesh.position.x = laneX + driftOffset
    obs.mesh.position.y = (obs.mesh.baseY || 0) + getSurfaceY(obs.mesh.position.z);
    obs.mesh.rotation.x = getSurfaceTilt(obs.mesh.position.z);
    // Spin UFOs, ground obstacles gentle spin
    obs.mesh.rotation.y += obs.type === 'floating' ? 0.08 : (obs.obstacleType === 'fruit' ? 0.05 : 0);
    
    // UFO: sin wave + lateral sweep across road
    if (obs.type === 'floating') {
      obs.mesh.position.y = 2.2 + Math.sin(time * 3 + obs.mesh.position.z * 0.1) * 0.5 + getSurfaceY(obs.mesh.position.z);
      // Lateral sweep — random fixed distance movement
      if (!obs.mesh.userData.ufoSwayDir) {
        obs.mesh.userData.ufoSwayDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.ufoSwaySpeed = 0.04 + Math.random() * 0.02;
        obs.mesh.userData.ufoSwayDist = 0;
        obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
        obs.mesh.userData.driftX = 0;
      }
      obs.mesh.userData.driftX += obs.mesh.userData.ufoSwayDir * obs.mesh.userData.ufoSwaySpeed;
      obs.mesh.userData.ufoSwayDist += obs.mesh.userData.ufoSwaySpeed;
      if (obs.mesh.userData.ufoSwayDist >= obs.mesh.userData.ufoSwayMaxDist) {
        obs.mesh.userData.ufoSwayDir *= -1;
        obs.mesh.userData.ufoSwayDist = 0;
        obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
      }
      // Keep within road boundaries
      const maxDriftUFO = laneWidth * 1.5;
      if (obs.mesh.userData.driftX < -maxDriftUFO) obs.mesh.userData.ufoSwayDir = 1;
      else if (obs.mesh.userData.driftX > maxDriftUFO) obs.mesh.userData.ufoSwayDir = -1;
    }
    
    // Barrel: roll across street like a log on its side
    if (obs.obstacleType === 'barrel' && obs.mesh.userData.driftDir) {
      obs.mesh.userData.driftX = (obs.mesh.userData.driftX || 0) + obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed;
      const maxDriftBarrel = laneWidth * 1.2;
      if (obs.mesh.userData.driftX < -maxDriftBarrel || obs.mesh.userData.driftX > maxDriftBarrel) {
        obs.mesh.userData.driftDir *= -1;
      }
      // Roll the inner barrel group around its local Z axis (perpendicular to barrel length)
      // This makes the cylinder spin like a rolling log
      const barrelInner = obs.mesh.userData.barrelGroup || obs.mesh.children[0]
      if (barrelInner) {
        barrelInner.rotation.z += obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed * 8
      }
    }
    // Red car / bus / fireengine: move forward or backward at noticeable speed (slower than player)
    if (obs.obstacleType === 'car' || obs.obstacleType === 'bus' || obs.obstacleType === 'fireengine') {
      if (!obs.mesh.userData.lungeTimer) {
        obs.mesh.userData.lungeTimer = Math.random() * 3;
        obs.mesh.userData.lungeDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.lungeSpeed = 0.02 + Math.random() * 0.03; // noticeable but slower than player
      }
      obs.mesh.userData.lungeTimer -= delta;
      if (obs.mesh.userData.lungeTimer <= 0) {
        obs.mesh.userData.lungeDir *= -1;
        obs.mesh.userData.lungeTimer = 1.5 + Math.random() * 2;
      }
      obs.mesh.position.z += obs.mesh.userData.lungeDir * obs.mesh.userData.lungeSpeed;
    }
    
    // Police car: 90° across the road, slides left or right across lanes
    if (obs.obstacleType === 'police') {
      if (!obs.mesh.userData.policeDir) {
        obs.mesh.userData.policeDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.policeSpeed = 0.05 * difficultyMultiplier;
        obs.mesh.userData.driftX = 0;
      }
      obs.mesh.userData.driftX += obs.mesh.userData.policeDir * obs.mesh.userData.policeSpeed * delta * 60;
      // Bounce between road edges — full road width
      const maxDrift = laneWidth * 2; // can cross all 3 lanes
      if (obs.mesh.userData.driftX < -maxDrift) {
        obs.mesh.userData.policeDir = 1;
      } else if (obs.mesh.userData.driftX > maxDrift) {
        obs.mesh.userData.policeDir = -1;
      }
    }
    
    // Police siren flash
    if (obs.obstacleType === 'police') {
      const sirenR = obs.mesh.getObjectByName('siren-red');
      const sirenB = obs.mesh.getObjectByName('siren-blue');
      if (sirenR && sirenB) {
        const flash = Math.sin(time * 15) > 0;
        sirenR.material.color.setHex(flash ? 0xff0000 : 0x440000);
        sirenB.material.color.setHex(flash ? 0x000044 : 0x0000ff);
      }
    }

    // Skip collision if game over, countdown, or grace period
    if (gameOver.value || countdownLocked || Date.now() - gameStartTime < 2000) return;
    // Horizontal + Z distance (ignore Y for collision range check)
    const dx = player.position.x - obs.mesh.position.x;
    const dz = player.position.z - obs.mesh.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const collisionDist = obs.hitWidth || 1.5;
    const isFloating = obs.type === 'floating';
    
    // Near-miss detection — rare & rewarding (only once per obstacle, tighter band)
    if (!obs.nearMissTriggered && horizDist < collisionDist + 0.4 && horizDist >= collisionDist && Math.abs(dz) < 1.0) {
      obs.nearMissTriggered = true;
      nearMissCount++;
      score.value += 25; // bonus points for close call
      nearMissTextRef.value = 'CLOSE CALL! +25 \u{1F525}';
      nearMissTimer = 1.0;
      nearMissCountRef.value = nearMissCount;
    }
    
    // Hard grace period: no collisions for 2s after game start
    if (Date.now() - gameStartTime < 2000) return;

    // Ground obstacles: hit if player is on ground level and not flying
    const hitGroundObs = !isFloating && player.position.y < 1.0 && !isFlying;
    // Floating/UFO: hit if player is NOT sliding (must slide under)
    const hitFloatingObs = isFloating && !isSliding;
    // Flying characters still avoid ground obstacles
    if (horizDist < collisionDist && (hitGroundObs || hitFloatingObs)) {
      if (isInvincible) {
        // Shield blocks the hit
        playSound('shield_hit');
        createParticleEffect(obs.mesh.position, 0x00bfff, 15);
        deactivatePowerup();
        obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
        scene.remove(obs.mesh);
        obstacles.splice(index, 1);
      } else {
        triggerGameOver(0.5)
      }
    }

    if (obs.mesh.position.z > 15) {
      obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
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
        coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
        coin.mesh.rotation.y += 0.1;
      }
    } else {
      // No magnet - normal movement
      coin.mesh.position.z += gameSpeed;
      coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
      coin.mesh.rotation.y += 0.1;
    }
    
    coin.mesh.position.y = (coin.mesh.baseY || 0.5) + getSurfaceY(coin.mesh.position.z);
    coin.mesh.rotation.x = getSurfaceTilt(coin.mesh.position.z);
    
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

  // Bonus coins movement and collection
  bonusCoins.forEach((bc, index) => {
    if (bc.collected) return;
    bc.mesh.position.z += gameSpeed;
    bc.mesh.position.x = (bc.baseX || 0) + getCurveX(bc.mesh.position.z);
    bc.mesh.rotation.y += 0.1;
    bc.mesh.position.y = 0.5 + getSurfaceY(bc.mesh.position.z);
    bc.mesh.rotation.x = getSurfaceTilt(bc.mesh.position.z);
    const dist = player.position.distanceTo(bc.mesh.position);
    if (dist < 1.2) {
      bc.collected = true;
      comboCount++;
      if (comboCount > gameStats.maxCombo) gameStats.maxCombo = comboCount;
      const now = Date.now();
      const comboBonus = comboCount > 1 && (now - lastCoinTime) < 1000 ? comboCount * 10 : 0;
      score.value += (100 + comboBonus) * scoreMultiplier;
      lastCoinTime = now;
      gameStats.totalCoins++;
      createParticleEffect(bc.mesh.position, 0xffd700, 15);
      createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), bc.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      playSound('coin', 0.9 + Math.random() * 0.2);
      scene.remove(bc.mesh);
      bonusCoins.splice(index, 1);
    } else if (bc.mesh.position.z > 15) {
      scene.remove(bc.mesh);
      bonusCoins.splice(index, 1);
    }
  });

  powerups.forEach((pw, index) => {
    if (pw.collected) return;
    
    pw.mesh.position.z += gameSpeed;
    pw.mesh.position.x = ((pw.lane - 1) * laneWidth) + getCurveX(pw.mesh.position.z);
    pw.mesh.rotation.y += 0.15;
    // Curved earth
    pw.mesh.position.y = (pw.mesh.baseY || 1) + getSurfaceY(pw.mesh.position.z);
    pw.mesh.rotation.x = getSurfaceTilt(pw.mesh.position.z);
    
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

  // Animate clouds drifting + sky-aware coloring
  const cycleProgress = dayCycleTime / DAY_DURATION;
  clouds.forEach((cloud, i) => {
    cloud.position.z += 0.02;
    if (cloud.position.z > 10) {
      cloud.position.z = -60 - Math.random() * 20;
      cloud.position.x = (Math.random() - 0.5) * 40;
    }
    // Tint clouds based on day/night cycle
    const whiteColor = cloudWhiteColor;
    const nightColor = cloudNightColor;
    const sunsetColor = cloudSunsetColor;
    let targetColor;
    if (cycleProgress > 0.35 && cycleProgress < 0.65) {
      // Night: darker clouds
      const nightT = Math.min((cycleProgress - 0.35) / 0.15, (0.65 - cycleProgress) / 0.15, 1);
      targetColor = whiteColor.clone().lerp(nightColor, nightT);
    } else if ((cycleProgress > 0.2 && cycleProgress < 0.35) || (cycleProgress > 0.85 && cycleProgress < 0.95)) {
      // Sunset/sunrise: pinkish
      const sunsetT = cycleProgress < 0.5
        ? Math.min((cycleProgress - 0.2) / 0.1, (0.35 - cycleProgress) / 0.1, 1)
        : Math.min((cycleProgress - 0.85) / 0.1, (0.95 - cycleProgress) / 0.1, 1);
      targetColor = whiteColor.clone().lerp(sunsetColor, sunsetT);
    } else {
      targetColor = whiteColor;
    }
    // Apply color to main cloud puffs (children)
    cloud.children.forEach(child => {
      if (child.isMesh && child.material && child.material.color && child.material.opacity > 0.6) {
        // Only tint the main cloud material (not shadows with lower opacity)
        child.material.color.lerp(targetColor, 0.05);
      }
    });
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
    // Road curve: absolute position from baseX + curve offset
    const treeCurveOffset = getCurveX(tree.position.z);
    tree.position.x = (tree.baseX || 0) + treeCurveOffset;
    tree.position.y = (tree.baseY || 0) + getSurfaceY(tree.position.z);
    if (tree.position.z > 10) {
      // Determine side from baseX (not position.x which has curve offset)
      const side = (tree.baseX || 0) > 0 ? 1 : -1;
      tree.position.z = -Math.random() * 80;
      tree.baseX = side * (8 + Math.random() * 10);
      tree.position.x = tree.baseX + getCurveX(tree.position.z);
      tree.position.y = (tree.baseY || 0) + getSurfaceY(tree.position.z);
    }
  });
  
  // Animate buildings moving
  buildings.forEach((building) => {
    building.position.z += gameSpeed;
    // Road curve: absolute position from baseX + curve offset
    const bldgCurveOffset = getCurveX(building.position.z);
    building.position.x = (building.baseX || 0) + bldgCurveOffset;
    building.position.y = (building.baseY || 0) + getSurfaceY(building.position.z);
    building.rotation.x = getSurfaceTilt(building.position.z);
    if (building.position.z > 20) {
      // Determine side from baseX (not position.x which has curve offset)
      const side = (building.baseX || 0) > 0 ? 1 : -1;
      building.position.z = -20 - Math.random() * 60;
      building.baseX = side * (15 + Math.random() * 10);
      building.position.x = building.baseX + getCurveX(building.position.z);
      building.position.y = (building.baseY || 0) + getSurfaceY(building.position.z);
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
  if (micEnabledRef.value && micVolume > MIC_PEAK_THRESHOLD && !isJumping && !isFlying && !isSliding && !gameOver.value) {
    // Volume spike → start flying
    isFlying = true;
    flyVelocity = 0.15;
  }
  
  if (isFlying) {
    if (micEnabledRef.value && micVolume > MIC_THRESHOLD) {
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
  
  const playerLaneOffset = getCurveX(player.position.z) // follow road curve at player Z
  const targetX = (currentLane - 1) * laneWidth + playerLaneOffset;
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
    if (leftArm) leftArm.rotation.z = -1.5;
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
  if (headGroup) {
    const targetHeadRotY = THREE.MathUtils.clamp(moveDir * -0.5, -0.6, 0.6);
    headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadRotY, 0.1);
  }
  
  // Smooth lane movement
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.15);
  
  // Body lean on turn
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, moveDir * -0.08, 0.1);
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
  
  // === NEAR-MISS TIMER ===
  if (nearMissTimer > 0) {
    nearMissTimer -= realDelta;
    if (nearMissTimer <= 0) {
      nearMissTextRef.value = '';
    }
  }
  // === CAMERA SHAKE (regular near-miss) ===
  if (cameraShakeTimer > 0) {
    cameraShakeTimer -= delta;
    const shakeX = (Math.random() - 0.5) * cameraShakeIntensity * 2;
    const shakeY = (Math.random() - 0.5) * cameraShakeIntensity * 2;
    camera.position.x = shakeX; // Set, don't accumulate
    camera.position.y = 6 + shakeY;
    cameraShakeIntensity *= 0.9; // decay
    if (cameraShakeTimer <= 0) {
      cameraShakeIntensity = 0;
      camera.position.x = 0;
      camera.position.y = 6;
    }
  }

  // Camera: always lerp back to default
  camera.position.x += (0 - camera.position.x) * 0.05;
  camera.position.y += (6 - camera.position.y) * 0.05;
  camera.position.z += (12 - camera.position.z) * 0.05;
  camera.lookAt(0, 1, -8);
  if (!fovWarpEnabled) {
    camera.fov += (60 - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
  }
  
  // === FOV WARP ===
  if (fovWarpEnabled) {
    camera.fov = 60 + difficultyMultiplier * 2;
    camera.updateProjectionMatrix();
  }
  
  // === RED VIGNETTE (edge glow at max difficulty) ===
  if (difficultyMultiplier > 2.5) {
    edgeGlowIntensity = Math.min(1, (difficultyMultiplier - 2.5) / 1.0);
  } else {
    edgeGlowIntensity = 0;
  }
  const vignetteEl = document.getElementById('vignette-glow');
  if (vignetteEl) {
    vignetteEl.style.opacity = edgeGlowIntensity * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 3));
  }

  // Ensure camera always looks at player (unless bullet time is controlling it)
  camera.lookAt(0, 1, -8);
  composer.render();
};

const handleSwipe = (direction) => {
  if (gameOver.value || countdownLocked) return;
  
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
  // Don't intercept touches on UI buttons or name entry
  if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  initAudio(); // Start audio on first touch
  tryStartBGMFromGesture(); // Retry BGM if autoplay blocked it
};

const handleTouchEnd = (e) => {
  if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
  e.preventDefault();
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  // If game over, any tap restarts (but not during name entry, and not within 1s of death)
  if (gameOver.value) {
    if (showNameEntry.value) return;
    if (Date.now() - gameOverTime < 1000) return;
    startCountdown();
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
  // Deactivate any existing powerup first to prevent duplicates
  if (activePowerup) {
    deactivatePowerup();
  }
  activePowerup = type;
  const now = Date.now();
  
  if (type === 'shield') {
    powerupEndTime = now + 10000; // 10s
    powerupIcon = '🛡️';
    powerupName = 'Shield';
    isInvincible = true;
    
    // Add shield aura to player
    const oldShield = player.getObjectByName('shield-aura');
    if (oldShield) player.remove(oldShield);
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
  
  // During calibration (countdown), collect samples
  if (isCalibrating) {
    tiltCalibrationSamples.push({ beta, gamma });
    if (tiltCalibrationSamples.length > CALIBRATION_MAX_SAMPLES) {
      tiltCalibrationSamples.shift();
    }
    return; // Don't process tilt during calibration
  }
  
  // Calibrate on first reading (non-mobile fallback)
  if (tiltInitialBeta === null) {
    tiltInitialBeta = beta;
    tiltInitialGamma = gamma;
    return;
  }
  
  const tiltForward = beta - tiltInitialBeta; // Negative = tilted forward (up)
  const tiltSideways = gamma - (tiltInitialGamma || 0); // Relative to calibrated center
  
  // Tilt phone toward you (beta increases) = jump
  if (tiltForward > TILT_THRESHOLD && !isJumping && !isSliding && !countdownLocked) {
    handleJump();
  }
  
  // Tilt phone away from you (beta decreases) = slide
  if (tiltForward < -TILT_THRESHOLD && !isJumping && !isSliding && !countdownLocked) {
    handleSlide();
  }
  
  // Tilt left/right = lane change
  const now = Date.now();
  if (now - lastTiltLaneChange > TILT_LANE_COOLDOWN && !countdownLocked) {
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
  tryStartBGMFromGesture(); // Retry BGM if autoplay blocked it
  
  // Restart on Space, Enter, or any key when game over (but not during name entry)
  if (gameOver.value) {
    if (showNameEntry.value) return; // Don't restart while entering name
    if (Date.now() - gameOverTime < 1000) return; // Prevent instant restart
    startCountdown();
    return;
  }
  
  if (gameOver.value || countdownLocked) return;
  
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

let countdownLocked = false; // prevents input during countdown

const startCountdown = () => {
  // Reset game state immediately
  restartGame();
  countdownLocked = true;
  countdownActive.value = true;
  
  // Start tilt calibration on mobile during countdown (3s of sampling)
  if (isMobile && tiltEnabled) {
    startTiltCalibration();
  }
  
  let count = 3;
  countdownText.value = count.toString();
  
  const tick = () => {
    count--;
    if (count > 0) {
      countdownText.value = count.toString();
      setTimeout(tick, 1000);
    } else if (count === 0) {
      countdownText.value = 'GO!';
      startBGM(); // Start music on GO!
      // Finish tilt calibration — compute average from countdown samples
      if (isMobile && isCalibrating) {
        finishTiltCalibration();
      }
      setTimeout(() => {
        countdownActive.value = false;
        countdownLocked = false;
        // 2-second invincibility after game starts (green shield)
        isInvincible = true;
        gameStartTime = Date.now();
        const oldGrace = player.getObjectByName('shield-aura');
        if (!oldGrace) {
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          player.add(graceMesh);
        }
        invincibilityTimeout = setTimeout(() => {
          isInvincible = false;
          invincibilityTimeout = null;
          const shield = player.getObjectByName('shield-aura');
          if (shield) player.remove(shield);
        }, 2000);
      }, 500);
    }
  };
  
  setTimeout(tick, 1000);
};

const restartGame = () => {
  stopBGM(); // Stop any playing BGM on restart

  // Cancel any pending timeouts from previous game
  if (bossDefeatTimeout1) { clearTimeout(bossDefeatTimeout1); bossDefeatTimeout1 = null; }
  if (invincibilityTimeout) { clearTimeout(invincibilityTimeout); invincibilityTimeout = null; }
  if (gameOverShakeInterval) { clearInterval(gameOverShakeInterval); gameOverShakeInterval = null; }

  gameOver.value = false;
  showNameEntry.value = false;
  playerName.value = '';
  score.value = 0;
  currentLane = 1;
  isJumping = false;
  jumpVelocity = 0;
  isSliding = false;
  slideTimer = 0;
  isFlying = false;
  flyVelocity = 0;
  tiltInitialBeta = null; // Re-calibrate tilt on restart
  tiltInitialGamma = null;
  tiltCalibrationSamples = [];
  isCalibrating = false;
  gameSpeed = 0.25;
  spawnInterval = 1.2;
  gameDuration = 0; // fresh start, spawn grace active
  // Stage & road curve reset
  roadCurve.value = 0
  roadCurveTarget.value = 0
  curveChangeTimer.value = 0
  nextCurveChange.value = 3
  curveFrontZ.value = 0
  currentStage.value = debugStartStage.value >= 0 ? debugStartStage.value : 0
  stageTime.value = debugStartStage.value >= 0 ? Math.max(0, STAGES[debugStartStage.value].stageDuration - 20) : 0
  bossWarning.value = false
  bossActive.value = false
  bossDefeated.value = false
  bossHealth.value = 100
  bossCharging = false
  bossChargeTimer = 0
  bossChargeTarget = 0
  bossAttackTimer = 0
  bossNextAttack = 3
  stageTransitioning.value = false
  if (boss) { scene.remove(boss); boss = null; }
  applyStageVisuals(currentStage.value)
  comboCount = 0;
  lastCoinTime = 0;
  scoreMultiplier = 1;
  magnetRange = 0;
  isInvincible = false;
  activePowerup = null;
  powerupEndTime = 0;
  powerupIcon = '';
  powerupName = '';
  powerupTimeLeft.value = 0;
  // Explicitly remove shield aura mesh (deactivatePowerup also does this but may not clear ref)
  const shieldBefore = player.getObjectByName('shield-aura');
  if (shieldBefore) player.remove(shieldBefore);
  cameraShakeTimer = 0;
  cameraShakeIntensity = 0;
  // Reset camera to default position (clear any leftover shake)
  camera.position.set(0, 6, 12);
  dayCycleTime = 0;
  skyBlendFactor = 0;
  nearMissTimer = 0;
  nearMissCount = 0;
  nearMissTextRef.value = '';
  nearMissCountRef.value = 0;
  // Word art is HTML overlay
  eventTimer = 0;
  activeEvent = null;
  eventDuration = 0;
  fogDensity = 0;
  // Restore fog to default
  scene.fog.near = 20;
  scene.fog.far = 80;
  edgeGlowIntensity = 0;
  // Reset vignette glow
  const vignetteEl = document.getElementById('vignette-glow');
  if (vignetteEl) vignetteEl.style.opacity = '0';
  bonusPortal = null;
  bonusPortalSpawned = false;
  inBonusZone = false;
  bonusTimer = 0;
  inBonusZoneRef.value = false;
  bonusTimerRef.value = 0;
  bonusNoSpawn = false;
  bonusCoins.forEach(bc => scene.remove(bc.mesh));
  bonusCoins = [];
  // Reset bonus env state
  scene.userData.bonusEnvActive = false;
  if (scene.userData.nyanCat) {
    scene.remove(scene.userData.nyanCat);
    scene.userData.nyanCat = null;
    scene.userData.nyanCatTime = 0;
  }
  // Restore road material if stuck on rainbow
  const roadCheck = scene.getObjectByName('road');
  if (roadCheck && originalRoadMaterial) {
    roadCheck.material.dispose();
    roadCheck.material = originalRoadMaterial;
    originalRoadMaterial = null;
  }
  // Discard any saved substage state
  if (savedSubstageState) {
    savedSubstageState.obstacles.forEach(obs => scene.remove(obs.mesh));
    savedSubstageState.coins.forEach(coin => scene.remove(coin.mesh));
    savedSubstageState = null;
  }
  // Restore buildings/trees visibility and reset positions
  buildings.forEach(b => { 
    b.visible = true; 
    // Reset to initial spawn positions
    if (b.userData.initZ !== undefined) {
      b.position.z = b.userData.initZ;
      b.position.x = b.userData.initX;
      b.baseX = b.userData.initBaseX;
    }
  });
  trees.forEach(t => { 
    t.visible = true;
    if (t.userData.initZ !== undefined) {
      t.position.z = t.userData.initZ;
      t.position.x = t.userData.initX;
      t.baseX = t.userData.initBaseX;
    }
  });
  eventAlertTextRef.value = '';
  
  obstacles.forEach(obs => { obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); }); scene.remove(obs.mesh); });
  obstacles = [];
  
  coins.forEach(coin => scene.remove(coin.mesh));
  coins = [];
  
  powerups.forEach(pw => scene.remove(pw.mesh));
  powerups = [];
  
  particles.forEach(p => scene.remove(p));
  particles = [];
  
  bossProjectiles.forEach(fb => scene.remove(fb));
  bossProjectiles = [];
  
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
  
  lastSpawnTime = -2; // grace period: first obstacle spawns 2s after game start
  clock.start();
  playSound('start');
};

window.addEventListener('error', (e) => { console.log('GLOBAL ERROR:', e.message, 'at', e.filename + ':' + e.lineno + ':' + e.colno); });
onMounted(() => {
  const saved = localStorage.getItem('elangoSurfersHighScore');
  if (saved) highScore.value = parseInt(saved, 10);
  initGame();
  // Start with countdown on initial load
  countdownLocked = true;
  countdownActive.value = true;
  let initCount = 3;
  countdownText.value = initCount.toString();
  const initTick = () => {
    initCount--;
    if (initCount > 0) {
      countdownText.value = initCount.toString();
      setTimeout(initTick, 1000);
    } else if (initCount === 0) {
      countdownText.value = 'GO!';
      startBGM(); // Start music on initial GO!
      setTimeout(() => {
        countdownActive.value = false;
        countdownLocked = false;
        // 2-second invincibility after game starts (green shield)
        isInvincible = true;
        gameStartTime = Date.now();
        const oldGrace = player.getObjectByName('shield-aura');
        if (!oldGrace) {
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          player.add(graceMesh);
        }
        invincibilityTimeout = setTimeout(() => {
          isInvincible = false;
          invincibilityTimeout = null;
          const shield = player.getObjectByName('shield-aura');
          if (shield) player.remove(shield);
        }, 2000);
      }, 500);
    }
  };
  setTimeout(initTick, 1000);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel')) return;
    e.preventDefault();
  }, { passive: false, capture: true });
  window.addEventListener('click', (e) => {
    // Check if click is on settings panel, buttons, or name entry
    if (e.target.closest('#settings-panel') || e.target.closest('#settings-btn') || e.target.closest('#mute-btn') || e.target.closest('#tilt-btn') || e.target.closest('#mic-btn') || e.target.closest('#name-entry')) {
      return;
    }
    if (gameOver.value && !showNameEntry.value && Date.now() - gameOverTime >= 1000) startCountdown();
    initAudio();
    tryStartBGMFromGesture();
  });
  
  // Also initialize audio on any keypress
  window.addEventListener('keydown', () => {
    initAudio();
    tryStartBGMFromGesture();
  }, { once: true });
  
  // Initialize audio on touch
  window.addEventListener('touchstart', () => {
    initAudio();
    tryStartBGMFromGesture();
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
      // iOS 13+ — request permission on first touch (retry-capable, not once:true)
      let iosTiltPermissionRequested = false;
      const requestTiltPermission = async () => {
        if (iosTiltPermissionRequested) return; // already asked this session
        iosTiltPermissionRequested = true;
        try {
          const state = await DeviceOrientationEvent.requestPermission();
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            tiltEnabled = true;
            tiltEnabledRef.value = true;
          } else {
            // User denied — disable tilt and show hint
            tiltEnabled = false;
            tiltEnabledRef.value = false;
          }
        } catch (err) {
          console.log('iOS tilt permission error:', err);
          tiltEnabled = false;
          tiltEnabledRef.value = false;
        }
      };
      // Attach to tilt button click (user gesture required for iOS permission)
      window.addEventListener('touchstart', () => {
        requestTiltPermission();
      }, { once: true });
      // Also attach to tilt toggle button so user can retry
      const origToggleTilt = toggleTilt;
      toggleTilt = async () => {
        if (!tiltEnabled) {
          // Re-request permission on iOS when re-enabling
          iosTiltPermissionRequested = false;
          await requestTiltPermission();
        } else {
          tiltEnabled = false;
          tiltEnabledRef.value = false;
          tiltInitialBeta = null;
        }
      };
    } else {
      // Android / older iOS — auto-granted
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  } else {
    // No DeviceOrientation API available — disable tilt
    tiltEnabled = false;
    tiltEnabledRef.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
  window.removeEventListener('touchmove', handleTouchEnd, { capture: true });
  window.removeEventListener('deviceorientation', handleDeviceOrientation);
  cleanupMic();
  if (composer) composer.dispose();
  stopBGM();
});
</script>

<style scoped>
@import "./game.css";
</style>
