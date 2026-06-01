/**
 * Composable parameter interface definitions
 * 
 * Documents the dependency surface of each composable.
 * After the store migration, composables receive `store` instead of `getCtx`.
 */

import type { GameStore } from './gameStore';

export interface UseGameLifecycleParams {
  store: GameStore;
  playSound: (type: string, pitchMod?: number) => void;
  playSFX: (name: string, volume?: number) => void;
  startBGM: () => void;
  stopBGM: () => void;
  switchBGMTrack: (track: string) => void;
  initAudio: () => void;
  tryStartBGMFromGesture: () => void;
  gameScene: any;
  gameSpawns: any;
  gameBoss: any;
  STAGES: any[];
  BOSS_BASE_HEALTH: number;
  VERSION_MAJOR_MINOR: string;
  loadProgress: () => void;
  saveProgress: () => void;
  checkAchievements: () => void;
  achievements: any;
  isHighScore: (score: number) => boolean;
  getSurfaceY: (z: number) => number;
  startTiltCalibration: () => void;
  finishTiltCalibration: () => void;
  startCalibration: () => void;
  clearAllTimers: () => void;
  debugStartStage: any;
  createFloatingText: (text: string, position: any, color: string) => void;
  createParticleEffect: (position: any, color: number, count: number) => void;
}

export interface UseGameUpdatesParams {
  store: GameStore;
  getSurfaceY: (z: number) => number;
  getSurfaceTilt: (z: number) => number;
  getCurveX: (z: number) => number;
  getCurveSlope: (z: number) => number;
  playSound: (type: string, pitchMod?: number) => void;
  createFloatingText: (text: string, position: any, color: string) => void;
  createParticleEffect: (position: any, color: number, count: number) => void;
  deactivatePowerup: () => void;
  activatePowerup: (type: string) => void;
  triggerGameOver: (shakeIntensity?: number) => void;
  startStageCountdown: () => void;
  gameScene: any;
  gameBoss: any;
  STAGES: any[];
}

export interface UseGameControlsParams {
  store: GameStore;
  getSurfaceY: (z: number) => number;
  getSurfaceTilt: (z: number) => number;
  getCurveX: (z: number) => number;
  getCurveSlope: (z: number) => number;
  getMicVolume: () => number;
  playSound: (type: string, pitchMod?: number) => void;
  triggerGameOver: (shakeIntensity?: number) => void;
  startCountdown: () => void;
  createFloatingText: (text: string, position: any, color: string) => void;
  initAudio: () => void;
  tryStartBGMFromGesture: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  toggleSettings: () => void;
  gameSpawns: any;
}

export interface UseGameSpawnsParams {
  store: GameStore;
  getSurfaceY: (z: number) => number;
  currentStage: any;
  laneWidth: number;
  stage3Textures: any;
}

export interface UseGameBossParams {
  store: GameStore;
  currentStage: any;
  laneWidth: number;
  currentLane: any;
  playSFX: (name: string, volume?: number) => void;
  createFloatingText: (text: string, position: any, color: string) => void;
  playSound: (type: string, pitchMod?: number) => void;
  switchBGMTrack: (track: string) => void;
}

export interface UseGameSceneParams {
  store: GameStore;
  getSurfaceY: (z: number) => number;
  getCurveX: (z: number) => number;
  currentStage: any;
  roadCurveEnabled: any;
  roadCurve: any;
  currentSkin: any;
  currentHat: any;
  trackTexture: () => void;
  onTextureLoaded: () => void;
  switchBGMTrack: (track: string) => void;
  gameStats: any;
  checkAchievements: () => void;
}