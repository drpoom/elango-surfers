/**
 * stages.js — Stage configuration data
 * 
 * Defines all game stages with their properties, visual settings,
 * obstacle spawn rates, and special mechanics.
 * 
 * Import as: import { STAGES, getStageById, getStageByIndex } from './data/stages.js'
 */

export const STAGES = [
  {
    id: 1,
    name: 'The Modern Highway',
    difficultyMultiplier: 1.0,
    roadType: 'asphalt',
    skyType: 'sunny',
    backgroundColor: '#87CEEB',
    accentColor: '#FFD700',
    obstacleSpawnRates: {
      cone: 0.3,
      barrier: 0.2,
      car: 0.15,
      truck: 0.1
    },
    specialMechanics: {
      screenEffects: false,
      conveyorVariation: false,
      portalShortcuts: false
    },
    bossType: 'truck',
    bossDuration: 25,
    stageDuration: 60
  },
  {
    id: 2,
    name: 'The Medieval Path',
    difficultyMultiplier: 1.3,
    roadType: 'cobblestone',
    skyType: 'sunset',
    backgroundColor: '#8B4513',
    accentColor: '#DAA520',
    obstacleSpawnRates: {
      rock: 0.3,
      barrel: 0.25,
      knight: 0.15,
      dragon: 0.1
    },
    specialMechanics: {
      screenEffects: false,
      conveyorVariation: false,
      portalShortcuts: false
    },
    bossType: 'dragon',
    bossDuration: 25,
    stageDuration: 60
  },
  {
    id: 3,
    name: 'The Infinite IKEA-pocalypse',
    difficultyMultiplier: 1.8,
    roadType: 'conveyor',
    skyType: 'fluorescent',
    backgroundColor: '#005B99',
    accentColor: '#FECC00',
    obstacleSpawnRates: {
      meatball: 0.35,
      allenKey: 0.25,
      shoppingCart: 0.2,
      bookshelf: 0.15
    },
    specialMechanics: {
      screenEffects: true,
      conveyorVariation: true,
      portalShortcuts: true
    },
    bossType: 'giantMeatball',
    bossDuration: 25,
    stageDuration: 60
  }
]

/**
 * Get stage configuration by ID
 * @param {number} id - Stage ID (1, 2, 3, etc.)
 * @returns {object|null} Stage configuration or null if not found
 */
export function getStageById(id) {
  return STAGES.find(stage => stage.id === id) || null
}

/**
 * Get stage configuration by array index
 * @param {number} index - Stage index (0, 1, 2, etc.)
 * @returns {object|null} Stage configuration or null if out of bounds
 */
export function getStageByIndex(index) {
  if (index >= 0 && index < STAGES.length) {
    return STAGES[index]
  }
  return null
}

/**
 * Get total number of stages
 * @returns {number} Total stage count
 */
export function getStageCount() {
  return STAGES.length
}
