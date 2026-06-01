/**
 * NPC Configuration Data
 * Defines chicken and pedestrian NPC properties
 */

export const CHICKEN_CONFIG = {
  modelType: 'chicken',
  speed: 0.02,
  wanderRadius: 2,
  spawnWeight: 0.15,
  colors: [0xffffff, 0x8B4513, 0x2F4F2F],
  hitRadius: 0.4,
  scoreBonus: 10
}

export const PEDESTRIAN_CONFIG = {
  modelType: 'pedestrian',
  speed: 0.015,
  wanderRadius: 1.5,
  spawnWeight: 0.10,
  colors: [0xff6b35, 0x4ecdc4, 0xffd93d],
  hitRadius: 0.5,
  scoreBonus: 5
}
