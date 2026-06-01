/**
 * gameConstants.js — All tunable game constants in one place
 * 
 * Extracted from App.vue for easy tuning and AI readability.
 * Import as: import { EARTH_R, DAY_DURATION, ... } from './gameConstants.js'
 */

// ==================== PLANET & CYCLE ====================
export const EARTH_R = 350           // planet radius — larger = less curve
export const DAY_DURATION = 120      // 120s per full cycle (4 stages × 30s)

// ==================== PLAYER PHYSICS ====================
export const jumpStrength = 0.35
export const slideDuration = 0.6
export const GRAVITY = 0.015          // gravity for jump arc
export const laneWidth = 3
export const FLY_LIFT = 0.02         // upward force when blowing
export const FLY_GRAVITY = 0.008     // gravity when not blowing (gentler than jump gravity)
export const FLY_MAX_HEIGHT = 4.0    // max fly height

// ==================== INPUT THRESHOLDS ====================
export const MIC_THRESHOLD = 20      // volume level to sustain flying (0-128)
export const MIC_PEAK_THRESHOLD = 45  // spike to start flying
export const minSwipeDistance = 50
export const TILT_THRESHOLD = 20      // degrees tilt to trigger action
export const TILT_LR_THRESHOLD = 25   // degrees for left/right
export const TILT_LANE_COOLDOWN = 300  // ms between lane changes from tilt
export const CALIBRATION_MAX_SAMPLES = 60  // ~3 seconds at 20Hz

// ==================== CAMERA ====================
export const CAMERA_POS_Y = 6
export const CAMERA_POS_Z = 12
export const CAMERA_LOOK_Y = 1
export const CAMERA_LOOK_Z = -8
export const CAMERA_LERP = 0.05
export const CAMERA_FOV = 75
export const CAMERA_FOV_RESET = 60

// ==================== FOG ====================
export const FOG_NEAR = 20
export const FOG_FAR = 80
export const FOG_COLOR = 0x87ceeb

// ==================== BLOOM (POST-PROCESSING) ====================
export const BLOOM_STRENGTH = 0.35
export const BLOOM_RADIUS = 0.4
export const BLOOM_THRESHOLD = 0.85
export const BLOOM_RES_DESKTOP = 0.75
export const BLOOM_RES_MOBILE = 0.5

// ==================== SHADOWS ====================
export const SHADOW_RES_DESKTOP = 1024
export const SHADOW_RES_MOBILE = 512
export const SHADOW_CAMERA_NEAR = 0.5
export const SHADOW_CAMERA_FAR = 50

// ==================== LIGHTING ====================
export const AMBIENT_LIGHT_COLOR = 0xffffff
export const AMBIENT_LIGHT_INTENSITY = 0.7
export const DIRECTIONAL_LIGHT_COLOR = 0xffd700
export const DIRECTIONAL_LIGHT_INTENSITY = 1.0
export const DIRECTIONAL_LIGHT_POS = { x: 10, y: 15, z: 10 }
export const HEMI_SKY_COLOR = 0x87ceeb
export const HEMI_GROUND_COLOR = 0x8bc34a
export const HEMI_LIGHT_INTENSITY = 0.4

// ==================== GAMEPLAY ====================
export const GAME_OVER_TAP_COOLDOWN = 1000   // ms before tap-to-restart after game over
export const SPAWN_GRACE_PERIOD = 1.5        // seconds before obstacles start spawning
export const BOSS_WARNING_TIME = 5           // seconds before boss appears
export const INVINCIBILITY_GRACE = 2000      // ms of invincibility after countdown
export const INITIAL_SPAWN_INTERVAL = 1.2    // seconds between spawns at start
export const MIN_SPAWN_INTERVAL = 0.35       // minimum spawn interval (fastest)
export const SPAWN_INTERVAL_DECAY = 80       // divisor for spawn interval decrease over time
export const OBSTACLE_SPAWN_CHANCE = 0.7     // chance to spawn obstacle vs nothing
export const FLOATING_OBSTACLE_CHANCE = 0.3  // chance obstacle is floating (UFO)
export const COIN_SPAWN_BASE_CHANCE = 0.5   // base chance to spawn coin
export const COIN_SPAWN_GROWTH = 120         // divisor for coin spawn chance growth over time
export const POWERUP_SPAWN_CHANCE = 0.05     // chance to spawn powerup
export const BOSS_BASE_HEALTH = 100
export const BOSS_MAX_HEALTH = 250
export const BOSS_HIT_DAMAGE = 25
export const BOSS_PROJECTILE_HIT_RADIUS = 0.5
export const BOSS_BEAM_HIT_RADIUS = 0.8
export const BOSS_DEFEAT_DELAY = 1500         // ms before stage transition after boss defeat
export const COUNTDOWN_SECONDS = 3
export const COUNTDOWN_TICK_MS = 1000
export const STAGE_COUNTDOWN_GO_DELAY = 500   // ms delay after "GO!" before unlocking

// ==================== DIFFICULTY SCALING ====================
export const BASE_GAME_SPEEDS = [0.25, 0.32, 0.40]  // per stage
export const DIFFICULTY_DIVISOR = 60                  // gameDuration / this = difficulty ramp
export const MAX_DIFFICULTY_MULTIPLIER = 3.5
export const BOSS_DIFFICULTY_DIVISOR = 120            // slower scaling for boss charges

// ==================== ROAD CURVE ====================
export const CURVE_CHANGE_MIN = 2.5
export const CURVE_CHANGE_MAX = 4.0
export const CURVE_STRAIGHT_MIN = 5
export const CURVE_STRAIGHT_MAX = 10
export const CURVE_INTENSITY_MIN = 1.2
export const CURVE_INTENSITY_MAX = 1.8
export const CURVE_LERP = 0.03
export const CURVE_FRONT_Z_START = -80
export const CURVE_FRONT_Z_SPEED = 25

// ==================== ENTITY BOUNDS ====================
export const ENTITY_DESPAWN_Z = 15          // z position where entities are removed
export const BUILDING_DESPAWN_Z = 20        // buildings despawn further
export const COIN_COLLECT_DIST = 1.2
export const POWERUP_COLLECT_DIST = 1.2
export const PORTAL_COLLECT_DIST = 1.5
export const BOSS_COLLISION_DIST = 1.8
export const NEAR_MISS_EXTRA_DIST = 0.4
export const NEAR_MISS_DZ = 1.0
export const NEAR_MISS_SCORE = 25
export const OBSTACLE_OVERLAP_RADIUS = 2.5
export const COIN_OBSTACLE_OVERLAP_RADIUS = 1.8

// ==================== SCORING ====================
export const COIN_BASE_SCORE = 100
export const COMBO_WINDOW_MS = 1000         // ms window for combo chain
export const COMBO_BONUS_MULTIPLIER = 10    // comboCount * this = bonus per coin

// ==================== POWERUP DURATIONS ====================
export const SHIELD_DURATION = 10000        // ms
export const COLDDRINK_DURATION = 5000      // ms
export const MAGNET_DURATION = 15000        // ms
export const MAGNET_PULL_SPEED = 0.8
export const COLDDRINK_SPEED_MULT = 0.6

// ==================== BONUS ZONE ====================
export const BONUS_ZONE_DURATION = 10       // seconds
export const BONUS_COIN_COUNT = 40
export const BONUS_COIN_SPACING = 2.5
export const BONUS_COIN_START_Z = -5

// ==================== CAMERA SHAKE ====================
export const GAME_OVER_SHAKE_INTERVAL = 30  // ms between shake steps
export const GAME_OVER_SHAKE_DURATION = 0.5  // seconds

// ==================== CLOUDS ====================
export const CLOUD_SPEED = 0.02
export const CLOUD_RESPAWN_Z = 10
export const CLOUD_SPAWN_Z_MIN = -60
export const CLOUD_SPAWN_Z_RANGE = -20
export const CLOUD_X_RANGE = 40

// ==================== SCENE ZONES ====================
export const TREE_ZONE_MIN = 7.5
export const TREE_ZONE_MAX = 11.0
export const BUILDING_ZONE_MIN = 14.5
export const BUILDING_ZONE_MAX = 23.0