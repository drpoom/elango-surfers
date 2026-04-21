/**
 * useConveyor.js — Conveyor belt physics for Stage 3 (IKEA-pocalypse)
 * 
 * Provides reactive conveyor belt state with speed variations and reverse sections.
 * The conveyor affects player movement - players must fight against reverse sections.
 * 
 * Usage:
 *   const { conveyorSpeed, conveyorDirection, updateConveyor, isConveyorActive } = useConveyor()
 * 
 * Features:
 * - Base conveyor speed (matches game scroll speed)
 * - Speed variation: randomly speed up/slow down every 5-10 seconds
 * - Reverse sections: occasionally reverse direction for 2-3 seconds
 * - Visual speed indicator (optional UI hint via conveyorState)
 */

import { ref, computed } from 'vue'

// Reactive state
const conveyorSpeed = ref(1.0)        // Multiplier: 1.0 = base speed, >1 = faster, <1 = slower
const conveyorDirection = ref(1)      // 1 = forward (normal), -1 = reverse (fight the belt)
const conveyorActive = ref(false)     // True when in Stage 3 (IKEA conveyor stage)

// Timing state
const variationTimer = ref(0)         // Accumulates time for speed variations
const reverseTimer = ref(0)           // Counts down reverse section duration
const nextVariationTime = ref(5)      // Time until next speed change (5-10 seconds)
const reverseDuration = ref(0)        // Duration of reverse section (2-3 seconds)

// State for UI/computed
const conveyorState = computed(() => {
  if (!conveyorActive.value) return 'inactive'
  if (conveyorDirection.value === -1) return 'reverse'
  if (conveyorSpeed.value > 1.2) return 'fast'
  if (conveyorSpeed.value < 0.8) return 'slow'
  return 'normal'
})

/**
 * Initialize conveyor for Stage 3
 * @param {boolean} isActive - Whether conveyor is active (Stage 3)
 */
function initConveyor(isActive) {
  conveyorActive.value = isActive
  if (isActive) {
    conveyorSpeed.value = 1.0
    conveyorDirection.value = 1
    variationTimer.value = 0
    reverseTimer.value = 0
    nextVariationTime.value = 5 + Math.random() * 5 // 5-10 seconds
  }
}

/**
 * Update conveyor physics (call every frame with deltaTime)
 * @param {number} deltaTime - Time since last frame in seconds
 * @param {number} baseGameSpeed - Current base game speed for reference
 */
function updateConveyor(deltaTime, baseGameSpeed = 0.25) {
  if (!conveyorActive.value) {
    conveyorSpeed.value = 1.0
    conveyorDirection.value = 1
    return
  }

  // Handle reverse section countdown
  if (reverseTimer.value > 0) {
    reverseTimer.value -= deltaTime
    if (reverseTimer.value <= 0) {
      // End reverse section
      conveyorDirection.value = 1
      // Set next variation time
      nextVariationTime.value = 5 + Math.random() * 5
    }
    return // Don't process other variations during reverse
  }

  // Accumulate time for variations
  variationTimer.value += deltaTime

  // Check if it's time for a speed variation
  if (variationTimer.value >= nextVariationTime.value) {
    variationTimer.value = 0
    nextVariationTime.value = 5 + Math.random() * 5 // Reset for next 5-10 seconds

    // Decide what kind of variation to apply
    const rand = Math.random()
    
    if (rand < 0.15) {
      // 15% chance: start a reverse section (2-3 seconds)
      conveyorDirection.value = -1
      reverseTimer.value = 2 + Math.random() // 2-3 seconds
      reverseDuration.value = reverseTimer.value
    } else if (rand < 0.5) {
      // 35% chance: speed up (1.2x to 1.8x base speed)
      conveyorSpeed.value = 1.2 + Math.random() * 0.6
    } else if (rand < 0.85) {
      // 35% chance: slow down (0.5x to 0.9x base speed)
      conveyorSpeed.value = 0.5 + Math.random() * 0.4
    } else {
      // 15% chance: return to normal
      conveyorSpeed.value = 1.0
    }
  }
}

/**
 * Get the effective conveyor speed multiplier for player movement
 * @returns {number} Combined speed and direction multiplier
 */
function getEffectiveMultiplier() {
  return conveyorSpeed.value * conveyorDirection.value
}

/**
 * Apply conveyor effect to player position/movement
 * @param {number} playerZ - Current player Z position
 * @param {number} deltaTime - Time since last frame
 * @param {number} baseGameSpeed - Base game scroll speed
 * @returns {number} Adjusted Z position after conveyor effect
 */
function applyConveyorToPlayer(playerZ, deltaTime, baseGameSpeed) {
  if (!conveyorActive.value) {
    return playerZ
  }
  
  // Conveyor affects how fast the player moves relative to the world
  // When direction is -1 (reverse), player is pushed backward
  const conveyorEffect = baseGameSpeed * conveyorSpeed.value * conveyorDirection.value * deltaTime * 60
  return playerZ + conveyorEffect
}

/**
 * Force reset conveyor state (e.g., when leaving Stage 3)
 */
function resetConveyor() {
  conveyorSpeed.value = 1.0
  conveyorDirection.value = 1
  conveyorActive.value = false
  variationTimer.value = 0
  reverseTimer.value = 0
  nextVariationTime.value = 5
  reverseDuration.value = 0
}

export function useConveyor() {
  return {
    // Reactive state
    conveyorSpeed,
    conveyorDirection,
    conveyorActive,
    
    // Computed state for UI
    conveyorState,
    
    // Methods
    initConveyor,
    updateConveyor,
    getEffectiveMultiplier,
    applyConveyorToPlayer,
    resetConveyor
  }
}

export default useConveyor
