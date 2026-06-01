/**
 * stages.ts — Stage configuration data
 * 
 * Defines all game stages with their properties, visual settings,
 * obstacle spawn rates, and special mechanics.
 * 
 * Import as: import { STAGES, getStageById, getStageByIndex } from './data/stages'
 */

export interface ObstacleSpawnRates {
  [key: string]: number;
}

export interface SpecialMechanics {
  screenEffects: boolean;
  conveyorVariation: boolean;
  portalShortcuts: boolean;
}

export interface StageConfig {
  id: number;
  name: string;
  difficultyMultiplier: number;
  roadType: string;
  skyType: string;
  backgroundColor: string;
  accentColor: string;
  obstacleSpawnRates: ObstacleSpawnRates;
  specialMechanics: SpecialMechanics;
  bossType: string;
  bossDuration: number;
  stageDuration: number;
}

export const STAGES: StageConfig[] = [
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
    name: 'The Concrete Jungle',
    difficultyMultiplier: 1.8,
    roadType: 'concrete',
    skyType: 'urban',
    backgroundColor: '#2C3E50',
    accentColor: '#95A5A6',
    obstacleSpawnRates: {
      constructionCone: 0.3,
      barrier: 0.25,
      trafficSign: 0.2,
      debris: 0.15
    },
    specialMechanics: {
      screenEffects: false,
      conveyorVariation: false,
      portalShortcuts: false
    },
    bossType: 'giantMeatball',
    bossDuration: 25,
    stageDuration: 60
  }
];

/**
 * Get stage configuration by ID
 */
export function getStageById(id: number): StageConfig | null {
  return STAGES.find(stage => stage.id === id) || null;
}

/**
 * Get stage configuration by array index
 */
export function getStageByIndex(index: number): StageConfig | null {
  if (index >= 0 && index < STAGES.length) {
    return STAGES[index];
  }
  return null;
}

/**
 * Get total number of stages
 */
export function getStageCount(): number {
  return STAGES.length;
}