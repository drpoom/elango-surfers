/**
 * useStage.js — Stage management composable
 * 
 * Provides reactive stage state management and helper functions
 * for stage transitions, visuals, and mechanics.
 * 
 * Usage:
 *   const { currentStage, stageTime, applyStageVisuals, isStageTransitioning } = useStage()
 */

import { ref, computed } from 'vue'
import { STAGES, getStageById, getStageByIndex } from '../data/stages.js'
import { useConveyor } from './useConveyor.js'

const currentStage = ref(0)
const stageTime = ref(0)
const stageTransitioning = ref(false)

// Import conveyor system for Stage 3
const { conveyorSpeed, conveyorDirection, conveyorActive, conveyorState, initConveyor, updateConveyor, resetConveyor } = useConveyor()

/**
 * Get current stage configuration
 */
const currentStageConfig = computed(() => {
  return getStageByIndex(currentStage.value)
})

/**
 * Get next stage index (wraps around)
 */
const nextStageIndex = computed(() => {
  return (currentStage.value + 1) % STAGES.length
})

/**
 * Check if current stage has special mechanics enabled
 */
function hasSpecialMechanic(mechanicName) {
  const stage = currentStageConfig.value
  if (!stage || !stage.specialMechanics) {
    return false
  }
  return stage.specialMechanics[mechanicName] || false
}

/**
 * Apply stage-specific visuals to the scene
 * @param {number} stageIndex - The stage index to apply visuals for
 * @param {object} scene - Three.js scene object
 * @param {object} materials - Object containing scene materials
 */
function applyStageVisuals(stageIndex, scene, materials) {
  const stage = getStageByIndex(stageIndex)
  if (!stage) return

  // Apply background color
  if (scene && scene.background) {
    scene.background.setStyle(stage.backgroundColor)
  }

  // Apply road texture based on roadType
  if (materials && materials.road) {
    switch (stage.roadType) {
      case 'cobblestone':
        // Load cobblestone texture
        if (materials.road.map) {
          materials.road.map.dispose()
        }
        // Texture loading would happen here
        break
      case 'conveyor':
        // Conveyor belt texture for IKEA stage
        if (materials.road.map) {
          materials.road.map.dispose()
        }
        // Texture loading would happen here
        break
      default:
        // Default asphalt
        break
    }
  }

  // Apply sky type
  if (materials && materials.sky) {
    switch (stage.skyType) {
      case 'sunset':
        // Orange/red sky
        break
      case 'fluorescent':
        // Bright fluorescent lighting for IKEA stage
        break
      default:
        // Sunny/default sky
        break
    }
  }
}

/**
 * Get obstacle spawn rate for current stage
 * @param {string} obstacleType - Type of obstacle
 * @returns {number} Spawn rate (0-1)
 */
function getObstacleSpawnRate(obstacleType) {
  const stage = currentStageConfig.value
  if (!stage || !stage.obstacleSpawnRates) {
    return 0.1 // Default fallback rate
  }
  return stage.obstacleSpawnRates[obstacleType] || 0.1
}

/**
 * Get all obstacle types for current stage
 * @returns {string[]} Array of obstacle type names
 */
function getCurrentStageObstacles() {
  const stage = currentStageConfig.value
  if (!stage || !stage.obstacleSpawnRates) {
    return []
  }
  return Object.keys(stage.obstacleSpawnRates)
}

/**
 * Start stage transition
 */
function beginStageTransition() {
  stageTransitioning.value = true
}

/**
 * End stage transition
 */
function endStageTransition() {
  stageTransitioning.value = false
}

/**
 * Advance to next stage
 */
function advanceStage() {
  currentStage.value = nextStageIndex.value
  stageTime.value = 0
  
  // Initialize conveyor for Stage 3
  const stage = currentStageConfig.value
  if (stage && stage.roadType === 'conveyor') {
    initConveyor(true)
  } else {
    resetConveyor()
  }
}

/**
 * Reset to first stage
 */
function resetStage() {
  currentStage.value = 0
  stageTime.value = 0
  stageTransitioning.value = false
  resetConveyor()
}

/**
 * Set stage by index
 * @param {number} index - Stage index (0-based)
 */
function setStage(index) {
  if (index >= 0 && index < STAGES.length) {
    currentStage.value = index
    stageTime.value = 0
    
    // Initialize conveyor for Stage 3 (index 2, id 3)
    const stage = getStageByIndex(index)
    if (stage && stage.roadType === 'conveyor') {
      initConveyor(true)
    } else {
      resetConveyor()
    }
  }
}

/**
 * Set stage by ID
 * @param {number} id - Stage ID (1-based)
 */
function setStageById(id) {
  const stage = getStageById(id)
  if (stage) {
    currentStage.value = STAGES.indexOf(stage)
    stageTime.value = 0
    
    // Initialize conveyor for Stage 3 (id 3)
    if (stage.roadType === 'conveyor') {
      initConveyor(true)
    } else {
      resetConveyor()
    }
  }
}

export function useStage() {
  return {
    // State
    currentStage,
    stageTime,
    stageTransitioning,
    
    // Conveyor belt state (Stage 3)
    conveyorSpeed,
    conveyorDirection,
    conveyorActive,
    conveyorState,
    
    // Computed
    currentStageConfig,
    nextStageIndex,
    
    // Methods
    applyStageVisuals,
    hasSpecialMechanic,
    getObstacleSpawnRate,
    getCurrentStageObstacles,
    beginStageTransition,
    endStageTransition,
    advanceStage,
    resetStage,
    setStage,
    setStageById,
    
    // Conveyor methods
    updateConveyor,
    initConveyor,
    resetConveyor
  }
}

export default useStage
