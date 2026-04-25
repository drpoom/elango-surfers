/**
 * gameConstants.js — All tunable game constants in one place
 * 
 * Extracted from App.vue for easy tuning and AI readability.
 * Import as: import { EARTH_R, DAY_DURATION, ... } from './gameConstants.js'
 */

export const EARTH_R = 350           // planet radius — larger = less curve
export const DAY_DURATION = 120      // 120s per full cycle (4 stages × 30s)
export const jumpStrength = 0.35
export const slideDuration = 0.6
export const laneWidth = 3
export const FLY_LIFT = 0.02         // upward force when blowing
export const FLY_GRAVITY = 0.008     // gravity when not blowing (gentler than jump gravity)
export const FLY_MAX_HEIGHT = 4.0    // max fly height
export const MIC_THRESHOLD = 20      // volume level to sustain flying (0-128)
export const MIC_PEAK_THRESHOLD = 45  // spike to start flying
export const minSwipeDistance = 50
export const TILT_THRESHOLD = 20      // degrees tilt to trigger action
export const TILT_LR_THRESHOLD = 25   // degrees for left/right
export const TILT_LANE_COOLDOWN = 300  // ms between lane changes from tilt
export const CALIBRATION_MAX_SAMPLES = 60  // ~3 seconds at 20Hz