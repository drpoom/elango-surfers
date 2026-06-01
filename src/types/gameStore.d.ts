/**
 * Game Store type definitions
 * 
 * Documents the shape of the centralized reactive game store.
 * This serves as both type documentation and a reference for all game state.
 */

export interface GameStats {
  totalCoins: number;
  maxTime: number;
  maxCombo: number;
  maxScore: number;
  powerupsCollected: number;
  nightTime: number;
  skinsUnlocked: number;
  hatsUnlocked: number;
  bestRun: number;
  magnetCoins: number;
}

export interface GameStore {
  // Score & Progress
  score: number;
  highScore: number;
  comboCount: number;
  lastCoinTime: number;
  scoreMultiplier: number;
  gameStats: GameStats;

  // Game State
  gameOver: boolean;
  gameOverTime: number;
  isPaused: boolean;
  pauseStartTime: number;
  countdownActive: boolean;
  countdownText: string;
  countdownLocked: boolean;
  /** rAF-driven countdown state */
  _countdownNextTick: number | null;
  _countdownCount: number;
  _countdownType: string | null;
  _countdownGoTime: number | null;
  stageTransitioning: boolean;
  gameDuration: number;
  gameStartTime: number;
  gameSpeed: number;
  baseGameSpeed: number;
  speedMultiplier: number;
  difficultyMultiplier: number;
  spawnInterval: number;
  lastSpawnTime: number;

  // Stage & Curve
  currentStage: number;
  stageTime: number;
  roadCurve: number;
  roadCurveTarget: number;
  roadCurveEnabled: boolean;
  curveChangeTimer: number;
  nextCurveChange: number;
  curveFrontZ: number;
  dayCycleTime: number;

  // Boss
  bossActive: boolean;
  bossDefeated: boolean;
  bossHealth: number;
  bossWarning: boolean;
  bossAttackTimer: number;
  bossNextAttack: number;
  bossCharging: boolean;
  bossChargeTimer: number;
  bossChargeTarget: number;
  bossState: string;
  bossStateTimer: number;

  // Player
  currentLane: number;
  isJumping: boolean;
  jumpVelocity: number;
  isSliding: boolean;
  slideTimer: number;
  isFlying: boolean;
  flyVelocity: number;
  isSlippery: boolean;
  slipperyTimer: number;
  slideVelocity: number;
  isInvincible: boolean;
  targetLaneX: number;
  lastLaneChangeTime: number;

  // Powerups
  activePowerup: string | null;
  powerupEndTime: number;
  powerupIcon: string;
  powerupName: string;
  powerupTimeLeft: number;
  magnetRange: number;

  // Near Miss
  nearMissCount: number;
  nearMissTimer: number;

  // Bonus Zone
  inBonusZone: boolean;
  bonusTimer: number;
  bonusPortalSpawned: boolean;
  bonusNoSpawn: boolean;

  // Showroom
  inShowroom: boolean;
  showroomTimer: number;
  isShowroomPortal: boolean;

  // Camera
  cameraShakeTimer: number;
  cameraShakeIntensity: number;
  fovWarpEnabled: boolean;

  // Events
  eventTimer: number;
  activeEvent: string | null;
  eventDuration: number;
  fogDensity: number;
  edgeGlowIntensity: number;

  // Debug
  debugMode: boolean;
  godMode: boolean;
  debugStartStage: number;

  // Input
  tiltEnabled: boolean;
  isCalibrating: boolean;
  tiltInitialBeta: number | null;
  tiltInitialGamma: number | null;
  touchStartX: number | null;
  touchStartY: number | null;
  touchEndX: number | null;
  touchEndY: number | null;

  // Three.js objects (set directly, not through reactivity)
  scene: any; // THREE.Scene
  camera: any; // THREE.PerspectiveCamera
  renderer: any; // THREE.WebGLRenderer
  clock: any; // THREE.Clock
  composer: any; // EffectComposer
  player: any; // THREE.Group
  boss: any; // THREE.Group | null
  roadMesh: any; // THREE.Mesh
  grassMesh: any; // THREE.Mesh
  leftCurbMesh: any; // THREE.Mesh
  rightCurbMesh: any; // THREE.Mesh
  groundTexture: any; // THREE.Texture
  roadOrigPositions: any;
  grassOrigPositions: any;
  leftCurbOrigPositions: any;
  rightCurbOrigPositions: any;
  grassTileTex: any; // THREE.Texture
  mountainMesh: any; // THREE.Mesh

  // Entity arrays
  obstacles: any[];
  coins: any[];
  powerups: any[];
  particles: any[];
  floatingTexts: any[];
  bossProjectiles: any[];
  bossVulnerableOrbs: any[];
  buildings: any[];
  trees: any[];
  clouds: any[];
  medievalFlowers: any[];
  bonusCoins: any[];
  bonusPortal: any;

  // Saved state
  savedSubstageState: any;
  originalRoadMaterial: any;
  originalGroundTexture: any;
  originalGroundColor: any;
}