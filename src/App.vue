<template>
  <div id="game-container">
    <!-- Error overlay — shown when render loop crashes -->
    <div v-if="renderError" id="error-overlay" @click="reloadPage" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;cursor:pointer;font-family:sans-serif">
      <div style="font-size:48px;margin-bottom:16px">⚠️</div>
      <div style="font-size:24px;font-weight:bold;margin-bottom:8px">Something went wrong</div>
      <div style="font-size:14px;opacity:0.7;margin-bottom:24px">The game encountered an error. Click anywhere to reload.</div>
      <div style="font-size:12px;opacity:0.5;max-width:400px;text-align:center;word-break:break-all">{{ renderErrorMessage }}</div>
    </div>
    <LoadingScreen v-if="showLoadingScreen" :version="VERSION" :progress="loadingProgress" :loaded="isLoaded" @start="onLoadingStart" />
    <div id="game-info">
      <div id="version">{{ VERSION }}</div>
      <div id="score">Score: {{ store.score }}</div>
      <div id="highscore">High Score: {{ store.highScore }}</div>
      <div id="combo" v-if="store.comboCount > 1">🔥 x{{ store.comboCount }}</div>
      <div id="powerup-indicator" v-if="store.activePowerup">{{ store.powerupIcon }} {{ store.powerupName }} {{ store.powerupTimeLeft }}s</div>
      <div id="fly-indicator" v-if="store.micEnabledRef">&#x1F3A4;&#x2708;ï¸ </div>
      <div id="stage-indicator" v-if="!store.gameOver">STAGE {{ store.currentStage + 1 }}: {{ STAGES[store.currentStage].name }}</div>
      <!-- Debug mode indicator -->
      <div v-if="store.debugMode" style="position:fixed;top:10px;left:10px;font-size:18px;z-index:10000">🐛</div>
      <!-- God mode indicator -->
      <div v-if="store.godMode" style="position:fixed;top:10px;left:40px;font-size:14px;font-weight:bold;color:#ffd700;z-index:10000;text-shadow:0 0 5px #ffd700">GOD MODE</div>
      <div id="boss-warning" v-if="store.bossWarning && !store.bossActive" style="color:#ff4444;font-size:20px;font-weight:bold;animation:pulse 0.5s infinite">
        ⚠️ BOSS INCOMING! ⚠️
      </div>
      <div id="boss-bar" v-if="store.bossActive && !store.bossDefeated">
        <div class="boss-label">BOSS</div>
        <div class="boss-health-track"><div class="boss-health-fill" :style="{ width: store.bossHealth + '%' }"></div></div>
      </div>
    </div>
    <!-- DEBUG OVERLAY -->
    <div v-if="showDebugOverlay" id="debug-overlay" style="position:absolute;top:60px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;font-size:10px;padding:8px;border-radius:4px;max-width:280px;z-index:9999;pointer-events:none">
      <div style="font-weight:bold;margin-bottom:4px;color:#ff0">🐛 DEBUG MODE</div>
      <div><strong>TOUCH:</strong> start({{ store.touchStartX }},{{ store.touchStartY }}) end({{ store.touchEndX }},{{ store.touchEndY }}) delta({{ Math.round((store.touchEndX || 0) - store.touchStartX) }},{{ Math.round((store.touchEndY || 0) - store.touchStartY) }})</div>
      <div><strong>TILT:</strong> beta={{ (store.lastBeta ?? 0).toFixed(1) }} gamma={{ (store.lastGamma ?? 0).toFixed(1) }} initBeta={{ store.tiltInitialBeta !== null ? store.tiltInitialBeta.toFixed(1) : 'null' }} enabled={{ store.tiltEnabled }}</div>
      <div><strong>MIC:</strong> vol={{ (store.lastMicVolume ?? 0).toFixed(1) }} enabled={{ store.micEnabledRef }}</div>
      <div><strong>STAGE:</strong> cur={{ store.currentStage }} debug={{ debugStartStage }} name={{ STAGES[store.currentStage]?.name || 'N/A' }}</div>
      <div><strong>SPAWN:</strong> grace={{ (store.gameDuration < 1.5) }} dur={{ store.gameDuration?.toFixed(2) || 'N/A' }} sinceLast={{ (Date.now() % 10000 / 1000).toFixed(2) }} int={{ store.spawnInterval?.toFixed(2) }}</div>
      <div><strong>RENDER:</strong> grassY={{ grassY }} grassRO={{ grassRenderOrder }} grassDW={{ grassDepthWrite }} roadY={{ roadY }} roadRO={{ roadRenderOrder }}</div>
    </div>
    <div id="floating-texts">
      <div id="near-miss" v-if="store.nearMissTextRef">{{ store.nearMissTextRef }}</div>
      <div id="event-alert" v-if="store.eventAlertTextRef">{{ store.eventAlertTextRef }}</div>
      <div id="bonus-zone" v-if="store.inBonusZoneRef">&#x1F308; BONUS ZONE! {{ Math.ceil(store.bonusTimerRef) }}s</div>
      <div id="showroom-zone" v-if="store.inShowroomRef" style="color:#ff69b4;font-size:24px;font-weight:bold;text-shadow:0 0 10px #ff69b4">&#x2728; SHOWROOM! x2 SCORE {{ Math.ceil(store.showroomTimerRef) }}s</div>
    </div>
    <div id="curve-indicator" v-if="!store.gameOver && Math.abs(store.roadCurve) > 0.15"
         :style="{ opacity: Math.min(Math.abs(store.roadCurve) * 1.5, 1) }">
      {{ store.roadCurve > 0 ? '➡️' : '⬅️' }}
    </div>
    <div id="pause-indicator" v-if="store.isPaused" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;font-weight:bold;color:#fff;text-shadow:0 0 20px #000;z-index:9999;pointer-events:none">⏸️ PAUSED<br><span style="font-size:18px">Click/Tap/Press any key to resume</span></div>
    <div id="top-buttons">
      <div id="mic-btn" @click="toggleMic">{{ store.micEnabledRef ? '🎤' : '🎤🔴' }}</div>
      <div id="tilt-btn" @click="toggleTilt">{{ store.tiltEnabledRef ? '📱' : '📱🔴' }}</div>
      <div id="mute-btn" @click="toggleMute">{{ muteIcon }}</div>
      <div id="settings-btn" @click="toggleSettings">⚙️</div>
    </div>
    <div id="instructions" v-if="store.score < 1 && !store.gameOver">A/D ←/→ Move | W/↑ Jump | S/↓ Slide<br>📱 Swipe | Tilt | 🎤 Blow to fly!</div>
    <div id="game-canvas" tabindex="-1"></div>
    <div id="vignette-glow"></div>
    
    <!-- Game Over Panel -->
    <GameOverPanel
      v-if="store.gameOver"
      :score="store.score"
      :high-score="store.highScore"
      :leaderboard="leaderboard"
      :sync-status="syncStatus"
      :show-name-entry="showNameEntry"
      v-model:playerName="playerName"
      v-model:showNameEntry="showNameEntry"
      @submit="submitScore"
    />

    <div v-if="store.countdownActive" id="countdown">{{ store.countdownText }}</div>

    <!-- Settings Panel -->
    <SettingsPanel
      v-if="showSettings"
      :game-settings="gameSettings"
      v-model:roadCurveEnabled="store.roadCurveEnabled"
      v-model:reduce-motion="reduceMotionRef"
      v-model:debug-start-stage="debugStartStage"
      v-model:current-skin="currentSkin"
      v-model:current-hat="currentHat"
      :STAGES="STAGES"
      :unlocked-skins="unlockedSkins"
      :unlocked-hats="unlockedHats"
      :achievements="achievements"
      :ACHIEVEMENTS="ACHIEVEMENTS"
      :show-debug-overlay="showDebugOverlay"
      @close="toggleSettings"
      @change-sound="applySoundSetting"
      @change-music="applyMusicSetting"
      @change-sfx="applySfxSetting"
      @change-sensor="applySensorSetting"
      @toggle-debug="toggleDebug"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, onUnmounted, nextTick, watch } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { useAudio } from './composables/useAudio.js';
import { useLeaderboard } from './composables/useLeaderboard.js';
import { useAchievements } from './composables/useAchievements.js';
import { useLoadingProgress } from './composables/useLoadingProgress.js';
import { reduceMotionRef, initScreenEffects, saveScreenEffects } from './composables/useScreenEffects.js';
import { loadSettings, saveSettings, getDefaultSettings } from './composables/useGameSettings.js';
import { EARTH_R, DAY_DURATION, jumpStrength, slideDuration, laneWidth, FLY_LIFT, FLY_GRAVITY, FLY_MAX_HEIGHT, MIC_THRESHOLD, MIC_PEAK_THRESHOLD, minSwipeDistance, TILT_THRESHOLD, TILT_LR_THRESHOLD, TILT_LANE_COOLDOWN, CALIBRATION_MAX_SAMPLES, CAMERA_POS_Y, CAMERA_POS_Z, CAMERA_LOOK_Y, CAMERA_LOOK_Z, CAMERA_LERP, CAMERA_FOV, CAMERA_FOV_RESET, FOG_NEAR, FOG_FAR, FOG_COLOR, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD, BLOOM_RES_DESKTOP, BLOOM_RES_MOBILE, SHADOW_RES_DESKTOP, SHADOW_RES_MOBILE, SHADOW_CAMERA_NEAR, SHADOW_CAMERA_FAR, AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY, DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY, DIRECTIONAL_LIGHT_POS, HEMI_SKY_COLOR, HEMI_GROUND_COLOR, HEMI_LIGHT_INTENSITY, GAME_OVER_TAP_COOLDOWN, SPAWN_GRACE_PERIOD, BOSS_WARNING_TIME, INVINCIBILITY_GRACE, INITIAL_SPAWN_INTERVAL, MIN_SPAWN_INTERVAL, SPAWN_INTERVAL_DECAY, OBSTACLE_SPAWN_CHANCE, FLOATING_OBSTACLE_CHANCE, COIN_SPAWN_BASE_CHANCE, COIN_SPAWN_GROWTH, POWERUP_SPAWN_CHANCE, BOSS_BASE_HEALTH, BOSS_MAX_HEALTH, BOSS_HIT_DAMAGE, BOSS_DEFEAT_DELAY, COUNTDOWN_SECONDS, COUNTDOWN_TICK_MS, STAGE_COUNTDOWN_GO_DELAY, BASE_GAME_SPEEDS, DIFFICULTY_DIVISOR, MAX_DIFFICULTY_MULTIPLIER, BOSS_DIFFICULTY_DIVISOR, CURVE_CHANGE_MIN, CURVE_CHANGE_MAX, CURVE_STRAIGHT_MIN, CURVE_STRAIGHT_MAX, CURVE_INTENSITY_MIN, CURVE_INTENSITY_MAX, CURVE_LERP, CURVE_FRONT_Z_START, CURVE_FRONT_Z_SPEED, GRAVITY } from './gameConstants.js';
import { STAGES } from './data/stages.js';
import { useCurve } from './composables/useCurve.js';
import { useMic } from './composables/useMic.js';
import LoadingScreen from './components/LoadingScreen.vue';
import GameOverPanel from './components/GameOverPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';

import { createPlayer, disposeHierarchy } from './utils/sceneHelpers.js';
import { attachTestHelpers, detachTestHelpers } from './utils/testHelpers.js';
import { createTimerTracker } from './utils/timerTracker.js';

import { useGameScene } from './composables/useGameScene.js';
import { useGameSpawns } from './composables/useGameSpawns.js';
import { useGameBoss } from './composables/useGameBoss.js';
import { useGameControls } from './composables/useGameControls.js';
import { useGameUpdates } from './composables/useGameUpdates.js';
import { useGameLifecycle } from './composables/useGameLifecycle.js';
import { useGameStore } from './composables/useGameStore.js';
// Version - Imported from centralized version.js
import { VERSION, VERSION_MAJOR_MINOR } from './version.js';

// Initialize centralized game store (replaces ctx bridge)
const store = useGameStore();

// UI-only refs (not game state, just template display control)
const showLoadingScreen = ref(true);
const showSettings = ref(false);
const renderError = ref(false);
const renderErrorMessage = ref('');
const reloadPage = () => location.reload();
const muteIcon = ref('🔊');
const showDebugOverlay = ref(false);
const debugStartStage = ref(-1);
const gameSettings = ref(getDefaultSettings());
const fovWarpRef = ref(false);
const grassY = ref(0);
const grassRenderOrder = ref(0);
const grassDepthWrite = ref(false);
const roadY = ref(0);
const roadRenderOrder = ref(0);

// Apply settings helpers
const applySoundSetting = () => { saveSettings(gameSettings.value); const isMuted = _toggleMute(); muteIcon.value = isMuted ? '🔇' : '🔊'; };
const applyMusicSetting = () => saveSettings(gameSettings.value);
const applySfxSetting = () => saveSettings(gameSettings.value);
const applySensorSetting = () => { saveSettings(gameSettings.value); if (gameSettings.value.sensorEnabled !== store.tiltEnabled) toggleTilt(); };

// Loading progress tracking
const { loadingProgress, isLoaded, trackTexture, onTextureLoaded, resetProgress } = useLoadingProgress();

// Timer tracker — replaces manual setTimeout/setInterval tracking
const timer = createTimerTracker();

// Clear ALL pending timeouts and intervals - call on stage reset to prevent stale callbacks
const clearAllTimers = () => {
  timer.clearAll();
  if (window._spawnStateInterval) { clearInterval(window._spawnStateInterval); window._spawnStateInterval = null; }
};

const toggleDebug = () => {
  showDebugOverlay.value = !showDebugOverlay.value;
};

const toggleSettings = () => {
  if (showSettings.value) {
    showSettings.value = false;
    resumeGame();
  } else {
    if (!store.gameOver && !store.countdownActive && !store.countdownLocked && !store.stageTransitioning) {
      pauseGame();
    }
    showSettings.value = true;
  }
};

// Initialize curve composable
const { getSurfaceY, getSurfaceTilt, getCurveX, getCurveSlope, curveFrontZ } = useCurve({ roadCurveEnabled: computed(() => store.roadCurveEnabled), roadCurve: computed(() => store.roadCurve) });

// Wire curve functions into store for composable access
store.getSurfaceY = getSurfaceY;
store.getSurfaceTilt = getSurfaceTilt;
store.getCurveX = getCurveX;
store.getCurveSlope = getCurveSlope;

// Expose spawn counts for Playwright tests (namespaced, dev-only)
attachTestHelpers({
  getSpawnCounts: () => ({ obstacles: store.obstacles.length, coins: store.coins.length }),
  getSpawnDebug: () => ({
    obstacles: store.obstacles.length,
    coins: store.coins.length,
    gameDuration: store.gameDuration,
    gameOver: store.gameOver,
    isPaused: store.isPaused
  }),
  getRoadMesh: () => store.roadMesh,
}, store);

// Initialize audio composable
const { playSound, playSFX, startBGM, stopBGM, switchBGMTrack, toggleMute: _toggleMute, initAudio, isBGMPlaying, bgmStarted, startStage3Audio, stopStage3Audio, updateIntercom } = useAudio({ currentStage: computed(() => store.currentStage), STAGES });

// Wire audio functions into store for composable access
store.playSound = playSound;
store.playSFX = playSFX;
store.startBGM = startBGM;
store.stopBGM = stopBGM;
store.switchBGMTrack = switchBGMTrack;
store.initAudio = initAudio;

const tryStartBGMFromGesture = () => {
  initAudio();
  if (!bgmStarted && !isBGMPlaying) {
    startBGM();
  }
};
store.tryStartBGMFromGesture = tryStartBGMFromGesture;

// Initialize achievement composable
const {
  ACHIEVEMENTS, gameStats, achievements, unlockedSkins, currentSkin,
  unlockedHats, currentHat, loadProgress, saveProgress, checkAchievements
} = useAchievements({
  playSound,
  createFloatingText: (text, pos, col) => store.createFloatingText(text, pos, col),
  getPlayer: () => store.player
});

// Initialize Three.js game scene composable
const gameScene = useGameScene({
  store,
  currentSkin,
  currentHat,
  trackTexture,
  onTextureLoaded,
  gameStats,
  checkAchievements
});

// Initialize Spawns composable
const gameSpawns = useGameSpawns({
  store,
  laneWidth,
  stage3Textures: gameScene.stage3Textures
});

// Wire spawn functions into store for composable access
store.createFloatingText = (text, position, color) => {
  if (gameSpawns) gameSpawns.createFloatingText(text, position, color);
};
store.createParticleEffect = (position, color, count) => {
  if (gameSpawns) gameSpawns.createParticleEffect(position, color, count);
};

// Initialize Boss fight composable
const gameBoss = useGameBoss({
  store,
  laneWidth
});

// Initialize game updates composable
const gameUpdates = useGameUpdates({
  store,
  gameScene,
  gameBoss
});

// Initialize game lifecycle composable
const gameLifecycle = useGameLifecycle({
  store,
  gameScene,
  gameSpawns,
  gameBoss,
  debugStartStage,
  achievements,
  loadProgress,
  saveProgress,
  checkAchievements
});

// Wire lifecycle functions into store for composable access
store.triggerGameOver = (shakeIntensity = 0.5) => gameLifecycle.triggerGameOver(shakeIntensity);
store.startCountdown = () => gameLifecycle.startCountdown();
store.startStageCountdown = () => gameLifecycle.startStageCountdown();
store.deactivatePowerup = () => gameLifecycle.deactivatePowerup();
store.activatePowerup = (type) => gameLifecycle.activatePowerup(type);
store.pauseGame = () => gameLifecycle.pauseGame();
store.resumeGame = () => gameLifecycle.resumeGame();
store.saveHighScore = () => gameLifecycle.saveHighScore();

// Initialize leaderboard composable
const { leaderboard, playerName, showNameEntry, isHighScore, submitScore, loadLeaderboard, syncStatus } = useLeaderboard({ VERSION, score: computed(() => store.score), highScore: computed(() => store.highScore) });

// Wire isHighScore into store for composable access
store.isHighScore = isHighScore;

// Mic input integration
const { micEnabledRef, initMic, toggleMic: _toggleMic, getMicVolume, cleanupMic, startCalibration } = useMic();
const toggleMic = () => _toggleMic(() => { store.isFlying = false; });
const toggleMute = () => {
  const isMuted = _toggleMute();
  muteIcon.value = isMuted ? '🔇' : '🔊';
};

// Wire mic function into store for composable access
store.getMicVolume = getMicVolume;
store.startCalibration = startCalibration;

const gameControls = useGameControls({
  store,
  toggleSettings,
  gameSpawns
});

const onLoadingStart = () => {
  initAudio();
  startBGM();
  store.countdownLocked = true;
  store.stageTransitioning = true;
  timer.setTimeout(() => {
    showLoadingScreen.value = false;
    timer.setTimeout(() => {
      if (!store.gameOver && !store.countdownActive) {
        startStageCountdown();
      }
    }, 400);
  }, 400);
};

const toggleFovWarp = () => {
  store.fovWarpEnabled = fovWarpRef.value;
  if (!store.fovWarpEnabled) {
    store.camera.fov = CAMERA_FOV_RESET;
    store.camera.updateProjectionMatrix();
  }
};

let toggleTilt = () => gameControls.toggleTilt();
const startTiltCalibration = () => gameControls.startTiltCalibration();
const finishTiltCalibration = () => gameControls.finishTiltCalibration();
const handleJump = () => gameControls.handleJump();
const handleSlide = () => gameControls.handleSlide();
const handleSwipe = (direction) => gameControls.handleSwipe(direction);
const handleTouchStart = (e) => gameControls.handleTouchStart(e);
const handleTouchEnd = (e) => gameControls.handleTouchEnd(e);
const handleDeviceOrientation = (e) => gameControls.handleDeviceOrientation(e);
const handleKeyDown = (e) => gameControls.handleKeyDown(e);
const updatePhysics = (delta) => gameControls.updatePhysics(delta, store.gameSpeed);

// Wire control/mic/timer functions into store for composable access
store.startTiltCalibration = startTiltCalibration;
store.finishTiltCalibration = finishTiltCalibration;
store.clearAllTimers = clearAllTimers;

const animate = () => {
  try {
    requestAnimationFrame(animate);

    if (showLoadingScreen.value) {
      store.clock.getDelta();
      return;
    }

    if (store.isPaused) {
      store.clock.getDelta();
      store.composer.render();
      return;
    }

    if (store.gameOver) {
      if (store.activePowerup) {
        store.powerupTimeLeft = Math.max(0, Math.ceil((store.powerupEndTime - Date.now()) / 1000));
        if (store.powerupTimeLeft <= 0) store.deactivatePowerup();
      }
      store.camera.lookAt(0, CAMERA_LOOK_Y, CAMERA_LOOK_Z);
      store.composer.render();
      return;
    }

    if (store.countdownLocked) {
      gameLifecycle.tickCountdown();
      store.clock.getDelta();
      store.camera.lookAt(0, CAMERA_LOOK_Y, CAMERA_LOOK_Z);
      store.composer.render();
      return;
    }

    const realDelta = store.clock.getDelta();
    const delta = realDelta;
    const time = store.clock.getElapsedTime();
    
    if (showDebugOverlay.value) {
      if (store.roadMesh) {
        roadY.value = store.roadMesh.position.y;
        roadRenderOrder.value = store.roadMesh.renderOrder;
      }
      if (store.grassMesh) {
        grassY.value = store.grassMesh.position.y;
        grassRenderOrder.value = store.grassMesh.renderOrder;
        grassDepthWrite.value = store.grassMesh.material.depthWrite;
      }
    }
    
    const stage = STAGES[store.currentStage];
    const isStage3 = stage.id === 3;
    
    updateIntercom(delta, isStage3);
    
    if (!store.gameOver && !store.stageTransitioning && !store.countdownLocked) {
      store.gameDuration += delta;
      store.stageTime += realDelta;
    }
    
    store.dayCycleTime = (store.dayCycleTime + delta) % DAY_DURATION;

    // Curves logic
    if (!store.bossActive && store.roadCurveEnabled) {
      store.curveChangeTimer += realDelta;
      if (store.curveChangeTimer >= store.nextCurveChange) {
        if (Math.abs(store.roadCurveTarget) < 0.1) {
          store.roadCurveTarget = (Math.random() > 0.5 ? 1 : -1) * (CURVE_INTENSITY_MIN + Math.random() * (CURVE_INTENSITY_MAX - CURVE_INTENSITY_MIN));
          curveFrontZ.value = CURVE_FRONT_Z_START;
          store.nextCurveChange = CURVE_CHANGE_MIN + Math.random() * (CURVE_CHANGE_MAX - CURVE_CHANGE_MIN);
        } else {
          store.roadCurveTarget = 0;
          store.nextCurveChange = CURVE_STRAIGHT_MIN + Math.random() * (CURVE_STRAIGHT_MAX - CURVE_STRAIGHT_MIN);
        }
        store.curveChangeTimer = 0;
      }
    }
    
    if (curveFrontZ.value < 0) {
      curveFrontZ.value += realDelta * CURVE_FRONT_Z_SPEED;
      if (curveFrontZ.value > 0) curveFrontZ.value = 0;
    }
    store.roadCurve += (store.roadCurveTarget - store.roadCurve) * CURVE_LERP;

    // Speed scaling
    store.difficultyMultiplier = Math.min(1 + (store.gameDuration / DIFFICULTY_DIVISOR), MAX_DIFFICULTY_MULTIPLIER);
    store.baseGameSpeed = BASE_GAME_SPEEDS[store.currentStage] || BASE_GAME_SPEEDS[0];
    store.gameSpeed = store.baseGameSpeed * store.difficultyMultiplier * store.speedMultiplier;

    // Powerup updates
    if (store.activePowerup) {
      store.powerupTimeLeft = Math.max(0, Math.ceil((store.powerupEndTime - Date.now()) / 1000));
      if (store.powerupTimeLeft <= 0) store.deactivatePowerup();
    }

    // Stage Transitions
    const currentStageDuration = stage.stageDuration || 30;
    if (store.stageTime >= currentStageDuration - BOSS_WARNING_TIME && store.stageTime < currentStageDuration && !store.bossActive && !store.bossDefeated && !store.stageTransitioning) {
      if (!store.bossWarning) {
        store.bossWarning = true;
      }
    }
    if (store.stageTime >= currentStageDuration && !store.bossActive && !store.bossDefeated && !store.stageTransitioning) {
      store.bossActive = true;
      store.bossHealth = Math.min(BOSS_MAX_HEALTH, Math.floor(BOSS_BASE_HEALTH * store.difficultyMultiplier));
      store.bossWarning = false;
      
      // Spawn appropriate boss
      if (stage.id === 1) gameBoss.spawnBoss('truck');
      else if (stage.id === 2) gameBoss.spawnBoss('dragon');
      else if (stage.id === 3) gameBoss.spawnBoss('giantMeatball');
      
      store.createFloatingText('BOSS FIGHT!', new THREE.Vector3(0, 3, -10), '#ff0000');
      playSound('boss_theme');
    }

    // Update Scene environmental curvatures and cycles
    gameScene.updateRoadCurve(delta, getCurveX, time);
    gameScene.updateDayNightCycle(delta);

    // Spawning logic
    if (!store.bossActive && !store.gameOver && !store.stageTransitioning && !store.countdownLocked && store.gameDuration > SPAWN_GRACE_PERIOD) {
      store.spawnInterval = (Math.max(MIN_SPAWN_INTERVAL, INITIAL_SPAWN_INTERVAL - (store.gameDuration / SPAWN_INTERVAL_DECAY)) / STAGES[store.currentStage].difficultyMultiplier) / 1.5;
      if (time - store.lastSpawnTime >= store.spawnInterval) {
        if (Math.random() < OBSTACLE_SPAWN_CHANCE) {
          if (Math.random() < FLOATING_OBSTACLE_CHANCE) gameSpawns.spawnFloatingObstacle(store.gameDuration);
          else gameSpawns.spawnObstacle(store.gameDuration);
        }
        if (Math.random() < COIN_SPAWN_BASE_CHANCE + (store.gameDuration / COIN_SPAWN_GROWTH)) gameSpawns.spawnCoin(store.gameDuration);
        if (Math.random() < POWERUP_SPAWN_CHANCE) gameSpawns.spawnPowerup(store.gameDuration);
        store.lastSpawnTime = time;
      }
    }

    // Update player physics
    updatePhysics(delta);

    // Entity movements & collision loops
    gameUpdates.updateEntities(delta, time);

    store.camera.position.x += (0 - store.camera.position.x) * CAMERA_LERP;
    store.camera.position.y += (CAMERA_POS_Y - store.camera.position.y) * CAMERA_LERP;
    store.camera.position.z += (CAMERA_POS_Z - store.camera.position.z) * CAMERA_LERP;
    store.camera.lookAt(0, CAMERA_LOOK_Y, CAMERA_LOOK_Z);
    store.composer.render();
  } catch (err) {
    console.error('Render loop error:', err);
    renderError.value = true;
    renderErrorMessage.value = err?.message || String(err);
    // Still request next frame so the error overlay can render
    requestAnimationFrame(animate);
  }
};

const resetStage = (preserveScore = false, targetStage = -1) => gameLifecycle.resetStage(preserveScore, targetStage);
const startCountdown = () => gameLifecycle.startCountdown();
const startStageCountdown = () => gameLifecycle.startStageCountdown();
const pauseGame = () => gameLifecycle.pauseGame();
const resumeGame = () => gameLifecycle.resumeGame();
const handleVisibilityChange = () => gameLifecycle.handleVisibilityChange();

const initGame = () => {
  gameScene.preloadStageTextures(1);
  disposeHierarchy(store.trees, store.scene);
  disposeHierarchy(store.buildings, store.scene);
  
  store.scene = new THREE.Scene();
  store.scene.background = new THREE.Color(FOG_COLOR);
  store.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

  gameScene.initSceneTextures('assets/sky_sunny.webp', 'assets/sky_sunset.webp', 'assets/sky_night.webp', 'assets/mountains.webp');

  store.camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
  store.camera.position.set(0, CAMERA_POS_Y, CAMERA_POS_Z);
  store.camera.lookAt(0, 0, -5);

  store.renderer = new THREE.WebGLRenderer({ antialias: true });
  store.renderer.setSize(window.innerWidth, window.innerHeight);
  const isMobileLocal = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  store.renderer.shadowMap.enabled = !isMobileLocal;
  store.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  store.renderer.setPixelRatio(isMobileLocal ? 1 : Math.min(window.devicePixelRatio, 2));
  
  const canvasContainer = document.getElementById('game-canvas');
  if (canvasContainer) {
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(store.renderer.domElement);
  }

  store.composer = new EffectComposer(store.renderer);
  const renderPass = new RenderPass(store.scene, store.camera);
  store.composer.addPass(renderPass);
  
  const bloomRes = isMobileLocal ? BLOOM_RES_MOBILE : BLOOM_RES_DESKTOP;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth * bloomRes, window.innerHeight * bloomRes),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD
  );
  store.composer.addPass(bloomPass);

  const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
  store.scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
  directionalLight.position.set(DIRECTIONAL_LIGHT_POS.x, DIRECTIONAL_LIGHT_POS.y, DIRECTIONAL_LIGHT_POS.z);
  directionalLight.castShadow = true;
  const shadowRes = isMobileLocal ? SHADOW_RES_MOBILE : SHADOW_RES_DESKTOP;
  directionalLight.shadow.mapSize.width = shadowRes;
  directionalLight.shadow.mapSize.height = shadowRes;
  directionalLight.shadow.camera.near = SHADOW_CAMERA_NEAR;
  directionalLight.shadow.camera.far = SHADOW_CAMERA_FAR;
  store.scene.add(directionalLight);
  
  const hemiLight = new THREE.HemisphereLight(HEMI_SKY_COLOR, HEMI_GROUND_COLOR, HEMI_LIGHT_INTENSITY);
  store.scene.add(hemiLight);

  gameScene.createGround();
  gameScene.createLaneMarkers();
  gameScene.createClouds();
  gameScene.createBackgroundElements();

  const playerGroup = createPlayer(currentSkin.value, currentHat.value);
  store.player = playerGroup;
  store.player.position.set(0, 0.5, 0);
  store.player.rotation.y = Math.PI;
  store.scene.add(store.player);
  
  store.clock = new THREE.Clock();
  store.clock.start();
  animate();
};

onMounted(() => {
  const saved = localStorage.getItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`);
  if (saved) store.highScore = parseInt(saved, 10);
  initScreenEffects();
  loadProgress();
  loadLeaderboard();
  checkAchievements();
  
  gameSettings.value = loadSettings();
  if (!gameSettings.value.soundEnabled) {
    _toggleMute();
    muteIcon.value = '🔇';
  }
  if (!gameSettings.value.sensorEnabled && store.tiltEnabled) {
    toggleTilt();
  }
  
  initGame();
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  cleanupMic();
  if (store.composer) store.composer.dispose();
  stopBGM();
  detachTestHelpers();
});
</script>

<style scoped>
@import "./game.css";
</style>
