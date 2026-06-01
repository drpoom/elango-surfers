/**
 * gameConstants.ts — All tunable game constants in one place
 * 
 * Extracted from App.vue for easy tuning and AI readability.
 * Import as: import { EARTH_R, DAY_DURATION, ... } from './gameConstants'
 */

// ==================== PLANET & CYCLE ====================
export const EARTH_R: number = 350           // planet radius — larger = less curve
export const DAY_DURATION: number = 150      // 150s per full cycle (3 stages × 50s)

// ==================== PLAYER PHYSICS ====================
export const jumpStrength: number = 0.35
export const slideDuration: number = 0.6
export const GRAVITY: number = 0.015          // gravity for jump arc
export const laneWidth: number = 3
export const FLY_LIFT: number = 0.02         // upward force when blowing
export const FLY_GRAVITY: number = 0.008     // gravity when not blowing (gentler than jump gravity)
export const FLY_MAX_HEIGHT: number = 4.0    // max fly height

// ==================== INPUT THRESHOLDS ====================
export const MIC_THRESHOLD: number = 20      // volume level to sustain flying (0-128)
export const MIC_PEAK_THRESHOLD: number = 45  // spike to start flying
export const minSwipeDistance: number = 50
export const TILT_THRESHOLD: number = 20      // degrees tilt to trigger action
export const TILT_LR_THRESHOLD: number = 25   // degrees for left/right
export const TILT_LANE_COOLDOWN: number = 300  // ms between lane changes from tilt
export const CALIBRATION_MAX_SAMPLES: number = 60  // ~3 seconds at 20Hz

// ==================== CAMERA ====================
export const CAMERA_POS_Y: number = 6
export const CAMERA_POS_Z: number = 12
export const CAMERA_LOOK_Y: number = 1
export const CAMERA_LOOK_Z: number = -8
export const CAMERA_LERP: number = 0.05
export const CAMERA_FOV: number = 75

// ==================== FOG ====================
export const FOG_NEAR: number = 20
export const FOG_FAR: number = 80
export const FOG_COLOR: number = 0x87ceeb

// ==================== BLOOM (POST-PROCESSING) ====================
export const BLOOM_STRENGTH: number = 0.35
export const BLOOM_RADIUS: number = 0.4
export const BLOOM_THRESHOLD: number = 0.85
export const BLOOM_RES_DESKTOP: number = 0.75
export const BLOOM_RES_MOBILE: number = 0.5

// ==================== SHADOWS ====================
export const SHADOW_RES_DESKTOP: number = 1024
export const SHADOW_RES_MOBILE: number = 512
export const SHADOW_CAMERA_NEAR: number = 0.5
export const SHADOW_CAMERA_FAR: number = 50

// ==================== LIGHTING ====================
export const AMBIENT_LIGHT_COLOR: number = 0xffffff
export const AMBIENT_LIGHT_INTENSITY: number = 0.7
export const DIRECTIONAL_LIGHT_COLOR: number = 0xffd700
export const DIRECTIONAL_LIGHT_INTENSITY: number = 1.0
export const DIRECTIONAL_LIGHT_POS: { x: number; y: number; z: number } = { x: 10, y: 15, z: 10 }
export const HEMI_SKY_COLOR: number = 0x87ceeb
export const HEMI_GROUND_COLOR: number = 0x8bc34a
export const HEMI_LIGHT_INTENSITY: number = 0.4

// ==================== GAMEPLAY ====================
export const GAME_OVER_TAP_COOLDOWN: number = 1000   // ms before tap-to-restart after game over
export const SPAWN_GRACE_PERIOD: number = 1.5        // seconds before obstacles start spawning
export const BOSS_WARNING_TIME: number = 5           // seconds before boss appears
export const INVINCIBILITY_GRACE: number = 2000      // ms of invincibility after countdown
export const INITIAL_SPAWN_INTERVAL: number = 1.2    // seconds between spawns at start
export const MIN_SPAWN_INTERVAL: number = 0.35       // minimum spawn interval (fastest)
export const SPAWN_INTERVAL_DECAY: number = 80       // divisor for spawn interval decrease over time
export const OBSTACLE_SPAWN_CHANCE: number = 0.7     // chance to spawn obstacle vs nothing
export const FLOATING_OBSTACLE_CHANCE: number = 0.3  // chance obstacle is floating (UFO)
export const COIN_SPAWN_BASE_CHANCE: number = 0.5   // base chance to spawn coin
export const COIN_SPAWN_GROWTH: number = 120         // divisor for coin spawn chance growth over time
export const POWERUP_SPAWN_CHANCE: number = 0.05     // chance to spawn powerup
export const BOSS_BASE_HEALTH: number = 100
export const BOSS_MAX_HEALTH: number = 250
export const BOSS_HIT_DAMAGE: number = 25
export const BOSS_PROJECTILE_HIT_RADIUS: number = 0.5
export const BOSS_BEAM_HIT_RADIUS: number = 0.8
export const BOSS_DEFEAT_DELAY: number = 1500         // ms before stage transition after boss defeat
export const COUNTDOWN_SECONDS: number = 3
export const COUNTDOWN_TICK_MS: number = 1000
export const STAGE_COUNTDOWN_GO_DELAY: number = 500   // ms delay after "GO!" before unlocking

// ==================== DIFFICULTY SCALING ====================
export const BASE_GAME_SPEEDS: number[] = [0.25, 0.32, 0.40]  // per stage
export const DIFFICULTY_DIVISOR: number = 60                  // gameDuration / this = difficulty ramp
export const MAX_DIFFICULTY_MULTIPLIER: number = 3.5
export const BOSS_DIFFICULTY_DIVISOR: number = 120            // slower scaling for boss charges

// ==================== ROAD CURVE ====================
export const CURVE_CHANGE_MIN: number = 2.5
export const CURVE_CHANGE_MAX: number = 4.0
export const CURVE_STRAIGHT_MIN: number = 5
export const CURVE_STRAIGHT_MAX: number = 10
export const CURVE_INTENSITY_MIN: number = 1.2
export const CURVE_INTENSITY_MAX: number = 1.8
export const CURVE_LERP: number = 0.03
export const CURVE_FRONT_Z_START: number = -80
export const CURVE_FRONT_Z_SPEED: number = 25

// ==================== ENTITY BOUNDS ====================
export const ENTITY_DESPAWN_Z: number = 15          // z position where entities are removed
export const BUILDING_DESPAWN_Z: number = 20        // buildings despawn further
export const COIN_COLLECT_DIST: number = 1.2
export const POWERUP_COLLECT_DIST: number = 1.2
export const PORTAL_COLLECT_DIST: number = 1.5
export const BOSS_COLLISION_DIST: number = 1.8
export const NEAR_MISS_EXTRA_DIST: number = 0.4
export const NEAR_MISS_DZ: number = 1.0
export const NEAR_MISS_SCORE: number = 25
export const OBSTACLE_OVERLAP_RADIUS: number = 2.5
export const COIN_OBSTACLE_OVERLAP_RADIUS: number = 1.8

// ==================== SCORING ====================
export const COIN_BASE_SCORE: number = 100
export const COMBO_WINDOW_MS: number = 1000         // ms window for combo chain
export const COMBO_BONUS_MULTIPLIER: number = 10    // comboCount * this = bonus per coin

// ==================== POWERUP DURATIONS ====================
export const SHIELD_DURATION: number = 10000        // ms
export const COLDDRINK_DURATION: number = 5000      // ms
export const MAGNET_DURATION: number = 15000        // ms
export const MAGNET_PULL_SPEED: number = 0.8
export const COLDDRINK_SPEED_MULT: number = 0.6

// ==================== BONUS ZONE ====================
export const BONUS_ZONE_DURATION: number = 10       // seconds
export const BONUS_COIN_COUNT: number = 40
export const BONUS_COIN_SPACING: number = 2.5
export const BONUS_COIN_START_Z: number = -5

// ==================== CAMERA SHAKE ====================
export const GAME_OVER_SHAKE_INTERVAL: number = 30  // ms between shake steps
export const GAME_OVER_SHAKE_DURATION: number = 0.5  // seconds

// ==================== CLOUDS ====================
export const CLOUD_SPEED: number = 0.02
export const CLOUD_RESPAWN_Z: number = 10
export const CLOUD_SPAWN_Z_MIN: number = -60
export const CLOUD_SPAWN_Z_RANGE: number = -20
export const CLOUD_X_RANGE: number = 40

// ==================== SCENE ZONES ====================
export const TREE_ZONE_MIN: number = 7.5
export const TREE_ZONE_MAX: number = 11.0
export const BUILDING_ZONE_MIN: number = 14.5
export const BUILDING_ZONE_MAX: number = 23.0