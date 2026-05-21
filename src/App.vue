<template>
  <div id="game-container">
    <LoadingScreen v-if="showLoadingScreen" :version="VERSION" :progress="loadingProgress" :loaded="isLoaded" @start="onLoadingStart" />
    <div id="game-info">
      <div id="version">{{ VERSION }}</div>
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="combo" v-if="comboCount > 1">🔥 x{{ comboCount }}</div>
      <div id="powerup-indicator" v-if="activePowerup">{{ powerupIcon }} {{ powerupName }} {{ powerupTimeLeft }}s</div>
      <div id="fly-indicator" v-if="micEnabledRef">&#x1F3A4;&#x2708;ï¸ </div>
      <div id="stage-indicator" v-if="!gameOver">STAGE {{ currentStage + 1 }}: {{ STAGES[currentStage].name }}</div>
      <!-- Debug mode indicator -->
      <div v-if="debugMode" style="position:fixed;top:10px;left:10px;font-size:18px;z-index:10000">🐛</div>
      <!-- God mode indicator -->
      <div v-if="godMode" style="position:fixed;top:10px;left:40px;font-size:14px;font-weight:bold;color:#ffd700;z-index:10000;text-shadow:0 0 5px #ffd700">GOD MODE</div>
      <div id="boss-warning" v-if="bossWarning && !bossActive" style="color:#ff4444;font-size:20px;font-weight:bold;animation:pulse 0.5s infinite">
        ⚠️ BOSS INCOMING! ⚠️
      </div>
      <div id="boss-bar" v-if="bossActive && !bossDefeated">
        <div class="boss-label">BOSS</div>
        <div class="boss-health-track"><div class="boss-health-fill" :style="{ width: bossHealth + '%' }"></div></div>
      </div>
    </div>
    <!-- DEBUG OVERLAY -->
    <div v-if="showDebugOverlay" id="debug-overlay" style="position:absolute;top:60px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;font-size:10px;padding:8px;border-radius:4px;max-width:280px;z-index:9999;pointer-events:none">
      <div style="font-weight:bold;margin-bottom:4px;color:#ff0">🐛 DEBUG MODE</div>
      <div><strong>TOUCH:</strong> start({{ touchStartX }},{{ touchStartY }}) end({{ touchEndX }},{{ touchEndY }}) delta({{ Math.round((touchEndX || 0) - touchStartX) }},{{ Math.round((touchEndY || 0) - touchStartY) }})</div>
      <div><strong>TILT:</strong> beta={{ (lastBeta ?? 0).toFixed(1) }} gamma={{ (lastGamma ?? 0).toFixed(1) }} initBeta={{ tiltInitialBeta !== null ? tiltInitialBeta.toFixed(1) : 'null' }} enabled={{ tiltEnabled }}</div>
      <div><strong>MIC:</strong> vol={{ (lastMicVolume ?? 0).toFixed(1) }} enabled={{ micEnabledRef }}</div>
      <div><strong>STAGE:</strong> cur={{ currentStage }} debug={{ debugStartStage }} name={{ STAGES[currentStage]?.name || 'N/A' }}</div>
      <div><strong>SPAWN:</strong> grace={{ (gameDuration < 1.5) }} dur={{ gameDuration?.toFixed(2) || 'N/A' }} sinceLast={{ (Date.now() % 10000 / 1000).toFixed(2) }} int={{ spawnInterval?.toFixed(2) }}</div>
      <div><strong>RENDER:</strong> grassY={{ grassY }} grassRO={{ grassRenderOrder }} grassDW={{ grassDepthWrite }} roadY={{ roadY }} roadRO={{ roadRenderOrder }}</div>
    </div>
    <div id="floating-texts">
      <div id="near-miss" v-if="nearMissTextRef">{{ nearMissTextRef }}</div>
      <div id="event-alert" v-if="eventAlertTextRef">{{ eventAlertTextRef }}</div>
      <div id="bonus-zone" v-if="inBonusZoneRef">&#x1F308; BONUS ZONE! {{ Math.ceil(bonusTimerRef) }}s</div>
      <div id="showroom-zone" v-if="inShowroomRef" style="color:#ff69b4;font-size:24px;font-weight:bold;text-shadow:0 0 10px #ff69b4">&#x2728; SHOWROOM! x2 SCORE {{ Math.ceil(showroomTimerRef) }}s</div>
    </div>
    <div id="curve-indicator" v-if="!gameOver && Math.abs(roadCurve) > 0.15"
         :style="{ opacity: Math.min(Math.abs(roadCurve) * 1.5, 1) }">
      {{ roadCurve > 0 ? '➡️' : '⬅️' }}
    </div>
    <div id="pause-indicator" v-if="isPaused" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;font-weight:bold;color:#fff;text-shadow:0 0 20px #000;z-index:9999;pointer-events:none">⏸️ PAUSED<br><span style="font-size:18px">Click/Tap/Press any key to resume</span></div>
    <div id="top-buttons">
      <div id="mic-btn" @click="toggleMic">{{ micEnabledRef ? '🎤' : '🎤🔴' }}</div>
      <div id="tilt-btn" @click="toggleTilt">{{ tiltEnabledRef ? '📱' : '📱🔴' }}</div>
      <div id="mute-btn" @click="toggleMute">{{ muteIcon }}</div>
      <div id="settings-btn" @click="toggleSettings">⚙️</div>
    </div>
    <div id="instructions" v-if="score < 1 && !gameOver">A/D ←/→ Move | W/↑ Jump | S/↓ Slide<br>📱 Swipe | Tilt | 🎤 Blow to fly!</div>
    <div id="game-canvas" tabindex="-1"></div>
    <div id="vignette-glow"></div>
    
    <!-- Game Over Panel -->
    <GameOverPanel
      v-if="gameOver"
      :score="score"
      :high-score="highScore"
      :leaderboard="leaderboard"
      :sync-status="syncStatus"
      :show-name-entry="showNameEntry"
      v-model:playerName="playerName"
      v-model:showNameEntry="showNameEntry"
      @submit="submitScore"
    />

    <div v-if="countdownActive" id="countdown">{{ countdownText }}</div>

    <!-- Settings Panel -->
    <SettingsPanel
      v-if="showSettings"
      :game-settings="gameSettings"
      v-model:roadCurveEnabled="roadCurveEnabled"
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
import { EARTH_R, DAY_DURATION, jumpStrength, slideDuration, laneWidth, FLY_LIFT, FLY_GRAVITY, FLY_MAX_HEIGHT, MIC_THRESHOLD, MIC_PEAK_THRESHOLD, minSwipeDistance, TILT_THRESHOLD, TILT_LR_THRESHOLD, TILT_LANE_COOLDOWN, CALIBRATION_MAX_SAMPLES } from './gameConstants.js';
import { STAGES } from './data/stages.js';
import { useCurve } from './composables/useCurve.js';
import { useMic } from './composables/useMic.js';
import LoadingScreen from './components/LoadingScreen.vue';
import GameOverPanel from './components/GameOverPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';

import { createPlayer, disposeHierarchy } from './utils/sceneHelpers.js';

import { useGameScene } from './composables/useGameScene.js';
import { useGameSpawns } from './composables/useGameSpawns.js';
import { useGameBoss } from './composables/useGameBoss.js';
import { useGameControls } from './composables/useGameControls.js';
import { useGameUpdates } from './composables/useGameUpdates.js';
import { useGameLifecycle } from './composables/useGameLifecycle.js';
// Version - Imported from centralized version.js
import { VERSION, VERSION_MAJOR_MINOR } from './version.js';


// Score & High Score refs
const score = ref(0);
const showLoadingScreen = ref(true);
const highScore = ref(0);

// Loading progress tracking
const { loadingProgress, isLoaded, trackTexture, onTextureLoaded, resetProgress } = useLoadingProgress();

// Game state refs
const gameOver = ref(false);
const countdownActive = ref(false);
const countdownText = ref('');
let countdownLocked = false; // prevents input during countdown
let initialCountdownTimeout = null; // Track initial countdown timeout to clear on reset
let stageCountdownTimeout = null; // Track stage countdown timeout
let gameOverShakeInterval = null; // Track game over shake interval
let spawnStateInterval = null; // Track spawn debug interval
const showSettings = ref(false);
const isPaused = ref(false); // Pause state
const debugStartStage = ref(-1);
const tiltEnabledRef = ref(true);
let tiltEnabled = true;
let invincibilityTimeout = null;
let bossDefeatTimeout1 = null;

// Game settings persistence
const gameSettings = ref(getDefaultSettings());
const applySoundSetting = () => { saveSettings(gameSettings.value); const isMuted = _toggleMute(); muteIcon.value = isMuted ? '🔇' : '🔊'; };
const applyMusicSetting = () => saveSettings(gameSettings.value);
const applySfxSetting = () => saveSettings(gameSettings.value);
const applySensorSetting = () => { saveSettings(gameSettings.value); if (gameSettings.value.sensorEnabled !== tiltEnabled) toggleTilt(); };
const muteIcon = ref('🔊');

// Clear ALL pending timeouts and intervals - call on stage reset to prevent stale callbacks
const clearAllTimers = () => {
  if (initialCountdownTimeout) { clearTimeout(initialCountdownTimeout); initialCountdownTimeout = null; }
  if (stageCountdownTimeout) { clearTimeout(stageCountdownTimeout); stageCountdownTimeout = null; }
  if (debugKeyTimer) { clearTimeout(debugKeyTimer); debugKeyTimer = null; }
  if (gameOverShakeInterval) { clearInterval(gameOverShakeInterval); gameOverShakeInterval = null; }
  if (spawnStateInterval) { clearInterval(spawnStateInterval); spawnStateInterval = null; }
  if (window._spawnStateInterval) { clearInterval(window._spawnStateInterval); window._spawnStateInterval = null; }
  if (invincibilityTimeout) { clearTimeout(invincibilityTimeout); invincibilityTimeout = null; }
  if (bossDefeatTimeout1) { clearTimeout(bossDefeatTimeout1); bossDefeatTimeout1 = null; }
};

// Debug overlay refs
const showDebugOverlay = ref(false);
const lastBeta = ref(0);
const lastGamma = ref(0);
const lastMicVolume = ref(0);
const grassY = ref(0);
const grassRenderOrder = ref(0);
const grassDepthWrite = ref(false);
const roadY = ref(0);
const roadRenderOrder = ref(0);

const toggleDebug = () => {
  showDebugOverlay.value = !showDebugOverlay.value;
};

const toggleSettings = () => {
  if (showSettings.value) {
    showSettings.value = false;
    resumeGame();
  } else {
    if (!gameOver.value && !countdownActive.value && !countdownLocked && !stageTransitioning.value) {
      pauseGame();
    }
    showSettings.value = true;
  }
};

const fovWarpRef = ref(false);
const roadCurveEnabled = ref(true);

// Debug mode state
const debugMode = ref(false);
const godMode = ref(false);
let debugKeyBuffer = '';
let debugKeyTimer = null;

// Stage & road curve state
const currentStage = ref(0);
const stageTime = ref(0);
const bossActive = ref(false);
const bossHealth = ref(100);
const bossDefeated = ref(false);
const bossWarning = ref(false);
const roadCurve = ref(0);
const roadCurveTarget = ref(0);
const stageTransitioning = ref(false);
const curveChangeTimer = ref(0);
const nextCurveChange = ref(3);

// Initialize curve composable
const { getSurfaceY, getSurfaceTilt, getCurveX, getCurveSlope, curveFrontZ } = useCurve({ roadCurveEnabled, roadCurve });

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
// Showroom shortcut
let inShowroom = false;
let inShowroomRef = ref(false);
let showroomTimer = 0;
let showroomTimerRef = ref(0);
let isShowroomPortal = false;
let magnetRange = 0;
let isInvincible = false;

// Day/night cycle
let dayCycleTime = 0;

let scene, camera, renderer, player, clock;
let boss = null;
let obstacles = [];
let coins = [];
let powerups = [];
let particles = [];
let floatingTexts = [];
let bossProjectiles = [];
let bossAttackTimer = 0;
let bossNextAttack = 2 + Math.random() * 2;
let bossCharging = false;
let bossChargeTimer = 0;
let bossChargeTarget = 0;
let bossState = 'idle';
let bossStateTimer = 0;
let bossVulnerableOrbs = [];
let buildings = [];
let trees = [];
let clouds = [];
let medievalFlowers = [];
let composer;
let groundTexture;
let roadMesh, grassMesh, leftCurbMesh, rightCurbMesh;
let roadOrigPositions, grassOrigPositions, leftCurbOrigPositions, rightCurbOrigPositions;
let grassTileTex = null;
let skyTextures = {};
let mountainMesh;
let textureLoader = new THREE.TextureLoader();

const BOSS_BASE_HEALTH = 100;
let gameStartTime = 0;
let gameDuration = 0;
let lastSpawnTime = 0;
let spawnInterval = 1.2;
let comboCount = 0;
let lastCoinTime = 0;
let gameOverTime = 0;
let isCalibrating = false;
let tiltCalibrationSamples = [];
let tiltInitialBeta = null;
let tiltInitialGamma = null;
let touchStartX = null;
let touchStartY = null;
let touchEndX = null;
let touchEndY = null;
let currentLane = 1;
let isJumping = false;
let jumpVelocity = 0;
let isSliding = false;
let slideTimer = 0;
let isSlippery = false;
let slipperyTimer = 0;
let slideVelocity = 0;
const gravity = 0.015;
let isFlying = false;
let flyVelocity = 0;
let baseGameSpeed = 0.25;
let speedMultiplier = 1.0;
let gameSpeed = 0.25;
let difficultyMultiplier = 1.0;
let pauseStartTime = 0;
let lastLaneChangeTime = 0;
let targetLaneX = 0;
let nearMissCount = 0;
let nearMissTimer = 0;
let inBonusZone = false;
let bonusTimer = 0;
let eventTimer = 0;
let activeEvent = null;
let eventDuration = 0;
let fogDensity = 0;
let edgeGlowIntensity = 0;
let bonusPortal = null;
let bonusPortalSpawned = false;
let bonusNoSpawn = false;
let bonusCoins = [];
let fovWarpEnabled = false;
let cameraShakeTimer = 0;
let cameraShakeIntensity = 0;
let savedSubstageState = null;
let originalRoadMaterial = null;
let originalGroundTexture = null;
let originalGroundColor = null;

// Expose spawn counts for Playwright tests
window.__getSpawnCounts = () => ({ obstacles: obstacles.length, coins: coins.length });
window.__getSpawnDebug = () => ({
  obstacles: obstacles.length,
  coins: coins.length,
  gameDuration,
  gameOver: gameOver.value,
  isPaused: isPaused.value
});
window.__getRoadMesh = () => roadMesh;

// Context Bridge
const ctx = {
  get scene() { return scene; }, set scene(v) { scene = v; },
  get player() { return player; }, set player(v) { player = v; },
  get boss() { return boss; }, set boss(v) { boss = v; },
  get buildings() { return buildings; }, set buildings(v) { buildings = v; },
  get medievalFlowers() { return medievalFlowers; }, set medievalFlowers(v) { medievalFlowers = v; },
  get roadMesh() { return roadMesh; }, set roadMesh(v) { roadMesh = v; },
  get grassMesh() { return grassMesh; }, set grassMesh(v) { grassMesh = v; },
  get trees() { return trees; }, set trees(v) { trees = v; },
  get groundTexture() { return groundTexture; }, set groundTexture(v) { groundTexture = v; },
  get roadOrigPositions() { return roadOrigPositions; }, set roadOrigPositions(v) { roadOrigPositions = v; },
  get grassTileTex() { return grassTileTex; }, set grassTileTex(v) { grassTileTex = v; },
  get grassOrigPositions() { return grassOrigPositions; }, set grassOrigPositions(v) { grassOrigPositions = v; },
  get leftCurbMesh() { return leftCurbMesh; }, set leftCurbMesh(v) { leftCurbMesh = v; },
  get leftCurbOrigPositions() { return leftCurbOrigPositions; }, set leftCurbOrigPositions(v) { leftCurbOrigPositions = v; },
  get rightCurbMesh() { return rightCurbMesh; }, set rightCurbMesh(v) { rightCurbMesh = v; },
  get rightCurbOrigPositions() { return rightCurbOrigPositions; }, set rightCurbOrigPositions(v) { rightCurbOrigPositions = v; },
  get clouds() { return clouds; }, set clouds(v) { clouds = v; },
  get obstacles() { return obstacles; }, set obstacles(v) { obstacles = v; },
  get coins() { return coins; }, set coins(v) { coins = v; },
  get powerups() { return powerups; }, set powerups(v) { powerups = v; },
  get bonusPortal() { return bonusPortal; }, set bonusPortal(v) { bonusPortal = v; },
  get particles() { return particles; }, set particles(v) { particles = v; },
  get floatingTexts() { return floatingTexts; }, set floatingTexts(v) { floatingTexts = v; },
  get bossProjectiles() { return bossProjectiles; }, set bossProjectiles(v) { bossProjectiles = v; },
  get bossAttackTimer() { return bossAttackTimer; }, set bossAttackTimer(v) { bossAttackTimer = v; },
  get bossNextAttack() { return bossNextAttack; }, set bossNextAttack(v) { bossNextAttack = v; },
  get bossCharging() { return bossCharging; }, set bossCharging(v) { bossCharging = v; },
  get bossChargeTimer() { return bossChargeTimer; }, set bossChargeTimer(v) { bossChargeTimer = v; },
  get bossState() { return bossState; }, set bossState(v) { bossState = v; },
  get bossStateTimer() { return bossStateTimer; }, set bossStateTimer(v) { bossStateTimer = v; },
  get bossVulnerableOrbs() { return bossVulnerableOrbs; }, set bossVulnerableOrbs(v) { bossVulnerableOrbs = v; },
  get bossChargeTarget() { return bossChargeTarget; }, set bossChargeTarget(v) { bossChargeTarget = v; },
  get currentLane() { return currentLane; }, set currentLane(v) { currentLane = v; },
  get isJumping() { return isJumping; }, set isJumping(v) { isJumping = v; },
  get jumpVelocity() { return jumpVelocity; }, set jumpVelocity(v) { jumpVelocity = v; },
  get isSliding() { return isSliding; }, set isSliding(v) { isSliding = v; },
  get slideTimer() { return slideTimer; }, set slideTimer(v) { slideTimer = v; },
  get isFlying() { return isFlying; }, set isFlying(v) { isFlying = v; },
  get flyVelocity() { return flyVelocity; }, set flyVelocity(v) { flyVelocity = v; },
  get isSlippery() { return isSlippery; }, set isSlippery(v) { isSlippery = v; },
  get slipperyTimer() { return slipperyTimer; }, set slipperyTimer(v) { slipperyTimer = v; },
  get slideVelocity() { return slideVelocity; }, set slideVelocity(v) { slideVelocity = v; },
  get tiltEnabled() { return tiltEnabled; }, set tiltEnabled(v) { tiltEnabled = v; },
  get tiltInitialBeta() { return tiltInitialBeta; }, set tiltInitialBeta(v) { tiltInitialBeta = v; },
  get tiltInitialGamma() { return tiltInitialGamma; }, set tiltInitialGamma(v) { tiltInitialGamma = v; },
  get isCalibrating() { return isCalibrating; }, set isCalibrating(v) { isCalibrating = v; },
  get tiltCalibrationSamples() { return tiltCalibrationSamples; }, set tiltCalibrationSamples(v) { tiltCalibrationSamples = v; },
  get touchStartX() { return touchStartX; }, set touchStartX(v) { touchStartX = v; },
  get touchStartY() { return touchStartY; }, set touchStartY(v) { touchStartY = v; },
  get touchEndX() { return touchEndX; }, set touchEndX(v) { touchEndX = v; },
  get touchEndY() { return touchEndY; }, set touchEndY(v) { touchEndY = v; },
  get debugKeyBuffer() { return debugKeyBuffer; }, set debugKeyBuffer(v) { debugKeyBuffer = v; },
  get debugKeyTimer() { return debugKeyTimer; }, set debugKeyTimer(v) { debugKeyTimer = v; },
  get countdownLocked() { return countdownLocked; }, set countdownLocked(v) { countdownLocked = v; },
  get gameOverTime() { return gameOverTime; }, set gameOverTime(v) { gameOverTime = v; },
  get lastLaneChangeTime() { return lastLaneChangeTime; }, set lastLaneChangeTime(v) { lastLaneChangeTime = v; },
  get score() { return score.value; }, set score(v) { score.value = v; },
  get gameOver() { return gameOver.value; }, set gameOver(v) { gameOver.value = v; },
  get countdownActive() { return countdownActive.value; }, set countdownActive(v) { countdownActive.value = v; },
  get countdownText() { return countdownText.value; }, set countdownText(v) { countdownText.value = v; },
  get isPaused() { return isPaused.value; }, set isPaused(v) { isPaused.value = v; },
  get debugMode() { return debugMode.value; }, set debugMode(v) { debugMode.value = v; },
  get godMode() { return godMode.value; }, set godMode(v) { godMode.value = v; },
  get showNameEntry() { return showNameEntry.value; }, set showNameEntry(v) { showNameEntry.value = v; },
  get playerName() { return playerName.value; }, set playerName(v) { playerName.value = v; },
  get micEnabledRef() { return micEnabledRef.value; }, set micEnabledRef(v) { micEnabledRef.value = v; },
  get tiltEnabledRef() { return tiltEnabledRef.value; }, set tiltEnabledRef(v) { tiltEnabledRef.value = v; },
  get lastBeta() { return lastBeta.value; }, set lastBeta(v) { lastBeta.value = v; },
  get lastGamma() { return lastGamma.value; }, set lastGamma(v) { lastGamma.value = v; },
  get lastMicVolume() { return lastMicVolume.value; }, set lastMicVolume(v) { lastMicVolume.value = v; },
  get speedMultiplier() { return speedMultiplier; }, set speedMultiplier(v) { speedMultiplier = v; },
  get isInvincible() { return isInvincible; }, set isInvincible(v) { isInvincible = v; },
  get magnetRange() { return magnetRange; }, set magnetRange(v) { magnetRange = v; },
  get baseGameSpeed() { return baseGameSpeed; }, set baseGameSpeed(v) { baseGameSpeed = v; },
  get gameSpeed() { return gameSpeed; }, set gameSpeed(v) { gameSpeed = v; },
  get difficultyMultiplier() { return difficultyMultiplier; }, set difficultyMultiplier(v) { difficultyMultiplier = v; },
  get gameDuration() { return gameDuration; }, set gameDuration(v) { gameDuration = v; },
  get stageTime() { return stageTime.value; }, set stageTime(v) { stageTime.value = v; },
  get currentStage() { return currentStage.value; }, set currentStage(v) { currentStage.value = v; },
  get dayCycleTime() { return dayCycleTime; }, set dayCycleTime(v) { dayCycleTime = v; },
  get roadCurve() { return roadCurve.value; }, set roadCurve(v) { roadCurve.value = v; },
  get roadCurveTarget() { return roadCurveTarget.value; }, set roadCurveTarget(v) { roadCurveTarget.value = v; },
  get curveChangeTimer() { return curveChangeTimer.value; }, set curveChangeTimer(v) { curveChangeTimer.value = v; },
  get nextCurveChange() { return nextCurveChange.value; }, set nextCurveChange(v) { nextCurveChange.value = v; },
  get camera() { return camera; }, set camera(v) { camera = v; },
  get clock() { return clock; }, set clock(v) { clock = v; },
  get composer() { return composer; }, set composer(v) { composer = v; },
  get renderer() { return renderer; }, set renderer(v) { renderer = v; },
  get bossActive() { return bossActive.value; }, set bossActive(v) { bossActive.value = v; },
  get bossDefeated() { return bossDefeated.value; }, set bossDefeated(v) { bossDefeated.value = v; },
  get bossHealth() { return bossHealth.value; }, set bossHealth(v) { bossHealth.value = v; },
  get bossWarning() { return bossWarning.value; }, set bossWarning(v) { bossWarning.value = v; },
  get stageTransitioning() { return stageTransitioning.value; }, set stageTransitioning(v) { stageTransitioning.value = v; },
  get comboCount() { return comboCount; }, set comboCount(v) { comboCount = v; },
  get lastCoinTime() { return lastCoinTime; }, set lastCoinTime(v) { lastCoinTime = v; },
  get scoreMultiplier() { return scoreMultiplier; }, set scoreMultiplier(v) { scoreMultiplier = v; },
  get powerupEndTime() { return powerupEndTime; }, set powerupEndTime(v) { powerupEndTime = v; },
  get powerupIcon() { return powerupIcon; }, set powerupIcon(v) { powerupIcon = v; },
  get powerupName() { return powerupName; }, set powerupName(v) { powerupName = v; },
  get powerupTimeLeft() { return powerupTimeLeft.value; }, set powerupTimeLeft(v) { powerupTimeLeft.value = v; },
  get activePowerup() { return activePowerup; }, set activePowerup(v) { activePowerup = v; },
  get lastSpawnTime() { return lastSpawnTime; }, set lastSpawnTime(v) { lastSpawnTime = v; },
  get spawnInterval() { return spawnInterval; }, set spawnInterval(v) { spawnInterval = v; },
  get curveFrontZ() { return curveFrontZ.value; }, set curveFrontZ(v) { curveFrontZ.value = v; },
  get nearMissTextRef() { return nearMissTextRef.value; }, set nearMissTextRef(v) { nearMissTextRef.value = v; },
  get nearMissCountRef() { return nearMissCountRef.value; }, set nearMissCountRef(v) { nearMissCountRef.value = v; },
  get eventAlertTextRef() { return eventAlertTextRef.value; }, set eventAlertTextRef(v) { eventAlertTextRef.value = v; },
  get inBonusZoneRef() { return inBonusZoneRef.value; }, set inBonusZoneRef(v) { inBonusZoneRef.value = v; },
  get bonusTimerRef() { return bonusTimerRef.value; }, set bonusTimerRef(v) { bonusTimerRef.value = v; },
  get inBonusZone() { return inBonusZone; }, set inBonusZone(v) { inBonusZone = v; },
  get bonusTimer() { return bonusTimer; }, set bonusTimer(v) { bonusTimer = v; },
  get bonusNoSpawn() { return bonusNoSpawn; }, set bonusNoSpawn(v) { bonusNoSpawn = v; },
  get bonusCoins() { return bonusCoins; }, set bonusCoins(v) { bonusCoins = v; },
  get bonusPortalSpawned() { return bonusPortalSpawned; }, set bonusPortalSpawned(v) { bonusPortalSpawned = v; },
  enterBonusZone() { if (gameLifecycle) gameLifecycle.enterBonusZone(); },
  exitBonusZone() { if (gameLifecycle) gameLifecycle.exitBonusZone(); },
  get cameraShakeTimer() { return cameraShakeTimer; }, set cameraShakeTimer(v) { cameraShakeTimer = v; },
  get cameraShakeIntensity() { return cameraShakeIntensity; }, set cameraShakeIntensity(v) { cameraShakeIntensity = v; },
  get savedSubstageState() { return savedSubstageState; }, set savedSubstageState(v) { savedSubstageState = v; },
  get originalRoadMaterial() { return originalRoadMaterial; }, set originalRoadMaterial(v) { originalRoadMaterial = v; },
  get originalGroundTexture() { return originalGroundTexture; }, set originalGroundTexture(v) { originalGroundTexture = v; },
  get originalGroundColor() { return originalGroundColor; }, set originalGroundColor(v) { originalGroundColor = v; },
  get bossDefeatTimeout1() { return bossDefeatTimeout1; }, set bossDefeatTimeout1(v) { bossDefeatTimeout1 = v; },
  get invincibilityTimeout() { return invincibilityTimeout; }, set invincibilityTimeout(v) { invincibilityTimeout = v; },
  get gameOverShakeInterval() { return gameOverShakeInterval; }, set gameOverShakeInterval(v) { gameOverShakeInterval = v; },
  activatePowerup(type) { activatePowerup(type); },
  deactivatePowerup() { deactivatePowerup(); },
  triggerGameOver(shake) { triggerGameOver(shake); },
  saveHighScore() { saveHighScore(); }
};
const getCtx = () => ctx;

const saveHighScore = () => gameLifecycle.saveHighScore();
const activatePowerup = (type) => gameLifecycle.activatePowerup(type);
const deactivatePowerup = () => gameLifecycle.deactivatePowerup();
const triggerGameOver = (shakeIntensity = 0.5) => gameLifecycle.triggerGameOver(shakeIntensity);

// stable wrapper functions
const createFloatingText = (text, position, color) => {
  if (gameSpawns) gameSpawns.createFloatingText(text, position, color);
};
const createParticleEffect = (position, color, count) => {
  if (gameSpawns) gameSpawns.createParticleEffect(position, color, count);
};

// Initialize audio composable
const { playSound, playSFX, startBGM, stopBGM, switchBGMTrack, toggleMute: _toggleMute, initAudio, isBGMPlaying, bgmStarted, startStage3Audio, stopStage3Audio, updateIntercom } = useAudio({ currentStage, STAGES });

const tryStartBGMFromGesture = () => {
  initAudio();
  if (!bgmStarted && !isBGMPlaying) {
    startBGM();
  }
};

// Initialize achievement composable
const {
  ACHIEVEMENTS, gameStats, achievements, unlockedSkins, currentSkin,
  unlockedHats, currentHat, loadProgress, saveProgress, checkAchievements
} = useAchievements({
  playSound,
  createFloatingText: (text, pos, col) => createFloatingText(text, pos, col),
  getPlayer: () => player
});

// Initialize Three.js game scene composable
const gameScene = useGameScene({
  getCtx,
  getSurfaceY,
  getCurveX,
  currentStage,
  roadCurveEnabled,
  roadCurve,
  currentSkin,
  currentHat,
  trackTexture,
  onTextureLoaded,
  switchBGMTrack,
  gameStats,
  checkAchievements
});

// Initialize Spawns composable
const gameSpawns = useGameSpawns({
  getCtx,
  getSurfaceY,
  currentStage,
  laneWidth,
  stage3Textures: gameScene.stage3Textures
});

// Initialize Boss fight composable
const gameBoss = useGameBoss({
  getCtx,
  currentStage,
  laneWidth,
  currentLane: computed(() => currentLane),
  playSFX,
  createFloatingText,
  playSound,
  switchBGMTrack
});

// Initialize game updates composable
const gameUpdates = useGameUpdates({
  getCtx,
  getSurfaceY,
  getSurfaceTilt,
  getCurveX,
  getCurveSlope,
  playSound: (...args) => playSound(...args),
  createFloatingText: (...args) => createFloatingText(...args),
  createParticleEffect: (...args) => createParticleEffect(...args),
  deactivatePowerup: (...args) => deactivatePowerup(...args),
  activatePowerup: (...args) => activatePowerup(...args),
  triggerGameOver: (...args) => triggerGameOver(...args),
  startStageCountdown: (...args) => startStageCountdown(...args),
  gameScene,
  gameBoss,
  STAGES
});

// Initialize game lifecycle composable
const gameLifecycle = useGameLifecycle({
  getCtx,
  playSound: (...args) => playSound(...args),
  playSFX: (...args) => playSFX(...args),
  startBGM: (...args) => startBGM(...args),
  stopBGM: (...args) => stopBGM(...args),
  switchBGMTrack: (...args) => switchBGMTrack(...args),
  initAudio: (...args) => initAudio(...args),
  tryStartBGMFromGesture: (...args) => tryStartBGMFromGesture(...args),
  gameScene,
  gameSpawns,
  gameBoss,
  STAGES,
  BOSS_BASE_HEALTH,
  VERSION_MAJOR_MINOR,
  loadProgress: (...args) => loadProgress(...args),
  saveProgress: (...args) => saveProgress(...args),
  checkAchievements: (...args) => checkAchievements(...args),
  achievements,
  isHighScore: (...args) => isHighScore(...args),
  getSurfaceY,
  startTiltCalibration: (...args) => startTiltCalibration(...args),
  finishTiltCalibration: (...args) => finishTiltCalibration(...args),
  startCalibration: (...args) => startCalibration(...args),
  clearAllTimers: (...args) => clearAllTimers(...args),
  debugStartStage,
  createFloatingText: (...args) => createFloatingText(...args),
  createParticleEffect: (...args) => createParticleEffect(...args)
});

// Initialize leaderboard composable
const { leaderboard, playerName, showNameEntry, isHighScore, submitScore, loadLeaderboard, syncStatus } = useLeaderboard({ VERSION, score, highScore });

// Mic input integration
const { micEnabledRef, initMic, toggleMic: _toggleMic, getMicVolume, cleanupMic, startCalibration } = useMic();
const toggleMic = () => _toggleMic(() => { isFlying = false; });
const toggleMute = () => {
  const isMuted = _toggleMute();
  muteIcon.value = isMuted ? '🔇' : '🔊';
};

const gameControls = useGameControls({
  getCtx,
  getSurfaceY,
  getSurfaceTilt,
  getCurveX,
  getCurveSlope,
  getMicVolume,
  playSound: (...args) => playSound(...args),
  triggerGameOver: (...args) => triggerGameOver(...args),
  startCountdown: (...args) => startCountdown(...args),
  createFloatingText: (...args) => createFloatingText(...args),
  initAudio: (...args) => initAudio(...args),
  tryStartBGMFromGesture: (...args) => tryStartBGMFromGesture(...args),
  pauseGame: (...args) => pauseGame(...args),
  resumeGame: (...args) => resumeGame(...args),
  toggleSettings: (...args) => toggleSettings(...args),
  gameSpawns
});

const onLoadingStart = () => {
  initAudio();
  startBGM();
  countdownLocked = true;
  stageTransitioning.value = true;
  setTimeout(() => {
    showLoadingScreen.value = false;
    setTimeout(() => {
      if (!gameOver.value && !countdownActive.value) {
        startStageCountdown();
      }
    }, 400);
  }, 400);
};

const toggleFovWarp = () => {
  fovWarpEnabled = fovWarpRef.value;
  if (!fovWarpEnabled) {
    camera.fov = 60;
    camera.updateProjectionMatrix();
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
const updatePhysics = (delta) => gameControls.updatePhysics(delta, gameSpeed);

const animate = () => {
  requestAnimationFrame(animate);

  if (showLoadingScreen.value) {
    clock.getDelta();
    return;
  }

  if (isPaused.value) {
    clock.getDelta();
    composer.render();
    return;
  }

  if (gameOver.value) {
    if (activePowerup) {
      powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
      if (powerupTimeLeft.value <= 0) deactivatePowerup();
    }
    camera.lookAt(0, 1, -8);
    composer.render();
    return;
  }

  if (countdownLocked) {
    clock.getDelta();
    camera.lookAt(0, 1, -8);
    composer.render();
    return;
  }

  const realDelta = clock.getDelta();
  const delta = realDelta;
  const time = clock.getElapsedTime();
  
  if (showDebugOverlay.value) {
    if (roadMesh) {
      roadY.value = roadMesh.position.y;
      roadRenderOrder.value = roadMesh.renderOrder;
    }
    if (grassMesh) {
      grassY.value = grassMesh.position.y;
      grassRenderOrder.value = grassMesh.renderOrder;
      grassDepthWrite.value = grassMesh.material.depthWrite;
    }
  }
  
  const stage = STAGES[currentStage.value];
  const isStage3 = stage.id === 3;
  
  updateIntercom(delta, isStage3);
  
  if (!gameOver.value && !stageTransitioning.value && !countdownLocked) {
    gameDuration += delta;
    stageTime.value += realDelta;
  }
  
  dayCycleTime = (dayCycleTime + delta) % DAY_DURATION;

  // Curves logic
  if (!bossActive.value && roadCurveEnabled.value) {
    curveChangeTimer.value += realDelta;
    if (curveChangeTimer.value >= nextCurveChange.value) {
      if (Math.abs(roadCurveTarget.value) < 0.1) {
        roadCurveTarget.value = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6);
        curveFrontZ.value = -80;
        nextCurveChange.value = 2.5 + Math.random() * 1.5;
      } else {
        roadCurveTarget.value = 0;
        nextCurveChange.value = 5 + Math.random() * 5;
      }
      curveChangeTimer.value = 0;
    }
  }
  
  if (curveFrontZ.value < 0) {
    curveFrontZ.value += realDelta * 25;
    if (curveFrontZ.value > 0) curveFrontZ.value = 0;
  }
  roadCurve.value += (roadCurveTarget.value - roadCurve.value) * 0.03;

  // Speed scaling
  difficultyMultiplier = Math.min(1 + (gameDuration / 60), 3.5);
  const stageBaseSpeeds = [0.25, 0.32, 0.40];
  baseGameSpeed = stageBaseSpeeds[currentStage.value] || 0.25;
  gameSpeed = baseGameSpeed * difficultyMultiplier * speedMultiplier;

  // Powerup updates
  if (activePowerup) {
    powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
    if (powerupTimeLeft.value <= 0) deactivatePowerup();
  }

  // Stage Transitions
  const currentStageDuration = stage.stageDuration || 30;
  if (stageTime.value >= currentStageDuration - 5 && stageTime.value < currentStageDuration && !bossActive.value && !bossDefeated.value && !stageTransitioning.value) {
    if (!bossWarning.value) {
      bossWarning.value = true;
    }
  }
  if (stageTime.value >= currentStageDuration && !bossActive.value && !bossDefeated.value && !stageTransitioning.value) {
    bossActive.value = true;
    bossHealth.value = Math.min(250, Math.floor(BOSS_BASE_HEALTH * difficultyMultiplier));
    bossWarning.value = false;
    
    // Spawn appropriate boss
    if (stage.id === 1) gameBoss.spawnBoss('truck');
    else if (stage.id === 2) gameBoss.spawnBoss('dragon');
    else if (stage.id === 3) gameBoss.spawnBoss('giantMeatball');
    
    createFloatingText('BOSS FIGHT!', new THREE.Vector3(0, 3, -10), '#ff0000');
    playSound('boss_theme');
  }

  // Update Scene environmental curvatures and cycles
  gameScene.updateRoadCurve(delta, getCurveX, time);
  gameScene.updateDayNightCycle(delta);

  // Spawning logic
  if (!bossActive.value && !gameOver.value && !stageTransitioning.value && !countdownLocked && gameDuration > 1.5) {
    spawnInterval = (Math.max(0.35, 1.2 - (gameDuration / 80)) / STAGES[currentStage.value].difficultyMultiplier) / 1.5;
    if (time - lastSpawnTime >= spawnInterval) {
      if (Math.random() < 0.7) {
        if (Math.random() < 0.3) gameSpawns.spawnFloatingObstacle(gameDuration);
        else gameSpawns.spawnObstacle(gameDuration);
      }
      if (Math.random() < 0.5 + (gameDuration / 120)) gameSpawns.spawnCoin(gameDuration);
      if (Math.random() < 0.05) gameSpawns.spawnPowerup(gameDuration);
      lastSpawnTime = time;
    }
  }

  // Update player physics
  updatePhysics(delta);

  // Entity movements & collision loops
  gameUpdates.updateEntities(delta, time);

  camera.position.x += (0 - camera.position.x) * 0.05;
  camera.position.y += (6 - camera.position.y) * 0.05;
  camera.position.z += (12 - camera.position.z) * 0.05;
  camera.lookAt(0, 1, -8);
  composer.render();
};

const resetStage = (preserveScore = false, targetStage = -1) => gameLifecycle.resetStage(preserveScore, targetStage);
const startCountdown = () => gameLifecycle.startCountdown();
const startStageCountdown = () => gameLifecycle.startStageCountdown();
const pauseGame = () => gameLifecycle.pauseGame();
const resumeGame = () => gameLifecycle.resumeGame();
const handleVisibilityChange = () => gameLifecycle.handleVisibilityChange();

const initGame = () => {
  gameScene.preloadStageTextures(1);
  disposeHierarchy(trees, scene);
  disposeHierarchy(buildings, scene);
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

  gameScene.initSceneTextures('assets/sky_sunny.webp', 'assets/sky_sunset.webp', 'assets/sky_night.webp', 'assets/mountains.webp');

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);
  camera.lookAt(0, 0, -5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const isMobileLocal = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  renderer.shadowMap.enabled = !isMobileLocal;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(isMobileLocal ? 1 : Math.min(window.devicePixelRatio, 2));
  
  const canvasContainer = document.getElementById('game-canvas');
  if (canvasContainer) {
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(renderer.domElement);
  }

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  const bloomRes = isMobileLocal ? 0.5 : 0.75;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth * bloomRes, window.innerHeight * bloomRes),
    0.35,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffd700, 1.0);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  const shadowRes = isMobileLocal ? 512 : 1024;
  directionalLight.shadow.mapSize.width = shadowRes;
  directionalLight.shadow.mapSize.height = shadowRes;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);
  
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8bc34a, 0.4);
  scene.add(hemiLight);

  gameScene.createGround();
  gameScene.createLaneMarkers();
  gameScene.createClouds();
  gameScene.createBackgroundElements();

  const playerGroup = createPlayer(currentSkin.value, currentHat.value);
  player = playerGroup;
  player.position.set(0, 0.5, 0);
  player.rotation.y = Math.PI;
  scene.add(player);
  
  clock = new THREE.Clock();
  clock.start();
  animate();
};

onMounted(() => {
  const saved = localStorage.getItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`);
  if (saved) highScore.value = parseInt(saved, 10);
  initScreenEffects();
  loadProgress();
  loadLeaderboard();
  checkAchievements();
  
  gameSettings.value = loadSettings();
  if (!gameSettings.value.soundEnabled) {
    _toggleMute();
    muteIcon.value = '🔇';
  }
  if (!gameSettings.value.sensorEnabled && tiltEnabled) {
    toggleTilt();
  }
  
  initGame();
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  cleanupMic();
  if (composer) composer.dispose();
  stopBGM();
});
</script>

<style scoped>
@import "./game.css";
</style>
