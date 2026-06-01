/**
 * useGameStore.js — Centralized reactive game state store
 * 
 * Replaces the 100+ getter/setter ctx bridge with a single reactive object.
 * All game state lives here. Composables receive `store` directly.
 * 
 * Uses shallowReactive to avoid Vue proxying Three.js objects (scene, camera, etc.)
 * which breaks their internal getters like modelViewMatrix.
 * Top-level primitives (score, gameOver, etc.) are still reactive for template bindings.
 * 
 * Usage: const store = useGameStore()
 */

import { shallowReactive, ref, toRefs } from 'vue';

// Singleton store instance
let storeInstance = null;

export function useGameStore() {
  if (storeInstance) return storeInstance;

  const store = shallowReactive({
    // ==================== SCORE & PROGRESS ====================
    score: 0,
    highScore: 0,
    comboCount: 0,
    lastCoinTime: 0,
    scoreMultiplier: 1,
    gameStats: {
      totalCoins: 0,
      maxTime: 0,
      maxCombo: 0,
      maxScore: 0,
      powerupsCollected: 0,
      nightTime: 0,
      skinsUnlocked: 0,
      hatsUnlocked: 0,
      bestRun: 0,
      magnetCoins: 0,
    },

    // ==================== GAME STATE ====================
    gameOver: false,
    gameOverTime: 0,
    isPaused: false,
    pauseStartTime: 0,
    countdownActive: false,
    countdownText: '',
    countdownLocked: false,
    // rAF-driven countdown state (replaces setTimeout which gets throttled in headless browsers)
    _countdownNextTick: null,
    _countdownCount: 0,
    _countdownType: null,
    _countdownGoTime: null,
    stageTransitioning: false,
    gameDuration: 0,
    gameStartTime: 0,
    gameSpeed: 0.25,
    baseGameSpeed: 0.25,
    speedMultiplier: 1.0,
    difficultyMultiplier: 1.0,
    spawnInterval: 1.2,
    lastSpawnTime: 0,

    // ==================== STAGE & CURVE ====================
    currentStage: 0,
    stageTime: 0,
    roadCurve: 0,
    roadCurveTarget: 0,
    roadCurveEnabled: true,
    curveChangeTimer: 0,
    nextCurveChange: 3,
    curveFrontZ: 0,
    dayCycleTime: 0,

    // ==================== BOSS ====================
    bossActive: false,
    bossDefeated: false,
    bossHealth: 100,
    bossWarning: false,
    bossAttackTimer: 0,
    bossNextAttack: 3,
    bossCharging: false,
    bossChargeTimer: 0,
    bossChargeTarget: 0,
    bossState: 'idle',
    bossStateTimer: 0,

    // ==================== PLAYER ====================
    currentLane: 1,
    isJumping: false,
    jumpVelocity: 0,
    isSliding: false,
    slideTimer: 0,
    isFlying: false,
    flyVelocity: 0,
    isSlippery: false,
    slipperyTimer: 0,
    slideVelocity: 0,
    isInvincible: false,
    targetLaneX: 0,
    lastLaneChangeTime: 0,

    // ==================== POWERUPS ====================
    activePowerup: null,
    powerupEndTime: 0,
    powerupIcon: '',
    powerupName: '',
    powerupTimeLeft: 0,
    magnetRange: 0,

    // ==================== NEAR MISS ====================
    nearMissCount: 0,
    nearMissTimer: 0,

    // ==================== BONUS ZONE ====================
    inBonusZone: false,
    bonusTimer: 0,
    bonusPortalSpawned: false,
    bonusNoSpawn: false,

    // ==================== SHOWROOM ====================
    inShowroom: false,
    showroomTimer: 0,
    isShowroomPortal: false,

    // ==================== CAMERA ====================
    cameraShakeTimer: 0,
    cameraShakeIntensity: 0,
    fovWarpEnabled: false,

    // ==================== EVENTS ====================
    eventTimer: 0,
    activeEvent: null,
    eventDuration: 0,
    fogDensity: 0,
    edgeGlowIntensity: 0,

    // ==================== DEBUG ====================
    debugMode: false,
    godMode: false,
    debugStartStage: -1,
    debugKeyBuffer: '',
    debugKeyTimer: null,

    // ==================== INPUT STATE ====================
    tiltEnabled: true,
    tiltEnabledRef: true,
    isCalibrating: false,
    tiltInitialBeta: null,
    tiltInitialGamma: null,
    tiltCalibrationSamples: [],
    touchStartX: null,
    touchStartY: null,
    touchEndX: null,
    touchEndY: null,
    lastBeta: 0,
    lastGamma: 0,
    lastMicVolume: 0,
    micEnabledRef: false,

    // ==================== DISPLAY REFS (template bindings) ====================
    // In the store model, these are just reactive properties — no separate ref() needed
    nearMissTextRef: '',
    nearMissCountRef: 0,
    eventAlertTextRef: '',
    inBonusZoneRef: false,
    bonusTimerRef: 0,
    inShowroomRef: false,
    showroomTimerRef: 0,

    // ==================== THREE.JS OBJECTS (non-reactive refs) ====================
    // These are set directly, not through reactivity
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    composer: null,
    player: null,
    boss: null,
    roadMesh: null,
    grassMesh: null,
    leftCurbMesh: null,
    rightCurbMesh: null,
    groundTexture: null,
    roadOrigPositions: null,
    grassOrigPositions: null,
    leftCurbOrigPositions: null,
    rightCurbOrigPositions: null,
    grassTileTex: null,
    mountainMesh: null,
    skyTextures: {},
    textureLoader: null,

    // ==================== ENTITY ARRAYS ====================
    obstacles: [],
    coins: [],
    powerups: [],
    particles: [],
    floatingTexts: [],
    bossProjectiles: [],
    bossVulnerableOrbs: [],
    buildings: [],
    trees: [],
    clouds: [],
    medievalFlowers: [],
    bonusCoins: [],
    bonusPortal: null,

    // ==================== SAVED STATE ====================
    savedSubstageState: null,
    originalRoadMaterial: null,
    originalGroundTexture: null,
    originalGroundColor: null,

    // ==================== CROSS-COMPOSABLE FUNCTIONS ====================
    // These are set during App.vue initialization to break circular dependencies.
    // Composables access these via store.* instead of receiving them as parameters.
    playSound: null,
    playSFX: null,
    startBGM: null,
    stopBGM: null,
    switchBGMTrack: null,
    initAudio: null,
    tryStartBGMFromGesture: null,
    triggerGameOver: null,
    startCountdown: null,
    startStageCountdown: null,
    deactivatePowerup: null,
    activatePowerup: null,
    createFloatingText: null,
    createParticleEffect: null,
    enterBonusZone: null,
    exitBonusZone: null,
    pauseGame: null,
    resumeGame: null,
    toggleSettings: null,
    getSurfaceY: null,
    getSurfaceTilt: null,
    getCurveX: null,
    getCurveSlope: null,
    getMicVolume: null,
    isHighScore: null,
    startTiltCalibration: null,
    finishTiltCalibration: null,
    startCalibration: null,
    clearAllTimers: null,
  });

  storeInstance = store;
  return store;
}

/**
 * Reset the store singleton (for testing)
 */
export function resetStore() {
  storeInstance = null;
}