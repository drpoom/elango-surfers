/**
 * useAchievements.ts — Achievement tracking, progress persistence, skin/hat unlocks
 * 
 * Extracted from App.vue for AI-friendly incremental refactoring.
 * Dependencies: playSound function, createFloatingText function, player ref (passed in)
 * 
 * Usage: const { ACHIEVEMENTS, gameStats, achievements, unlockedSkins, currentSkin, unlockedHats, currentHat, loadProgress, saveProgress, checkAchievements } = useAchievements({ playSound, createFloatingText, getPlayer: () => player })
 */

import { ref, type Ref } from 'vue'
import * as THREE from 'three'

export interface GameStatsData {
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

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
  condition: (stats: GameStatsData) => boolean;
}

export interface UseAchievementsParams {
  playSound: (type: string, pitchMod?: number) => void;
  createFloatingText: (text: string, position: THREE.Vector3, color: string) => void;
  getPlayer: () => THREE.Group | null;
}

export interface UseAchievementsReturn {
  ACHIEVEMENTS: Achievement[];
  gameStats: GameStatsData;
  achievements: Ref<Achievement[]>;
  unlockedSkins: Ref<number[]>;
  currentSkin: Ref<number>;
  unlockedHats: Ref<string[]>;
  currentHat: Ref<string | null>;
  loadProgress: () => void;
  saveProgress: () => void;
  checkAchievements: () => void;
}

export function useAchievements({ playSound, createFloatingText, getPlayer }: UseAchievementsParams): UseAchievementsReturn {
  const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_coin', name: 'First Coin!', desc: 'Collect your first coin', unlocked: false, condition: (stats) => stats.totalCoins >= 1 },
    { id: 'coin_100', name: 'Coin Collector', desc: 'Collect 100 coins total', unlocked: false, condition: (stats) => stats.totalCoins >= 100 },
    { id: 'survive_60', name: 'Survivor', desc: 'Survive 60 seconds', unlocked: false, condition: (stats) => stats.maxTime >= 60 },
    { id: 'combo_5', name: 'Combo Master', desc: 'Get 5x combo', unlocked: false, condition: (stats) => stats.maxCombo >= 5 },
    { id: 'score_5000', name: 'High Flyer', desc: 'Score 5000 points', unlocked: false, condition: (stats) => stats.maxScore >= 5000 },
    { id: 'powerup_first', name: 'Powered Up', desc: 'Collect first power-up', unlocked: false, condition: (stats) => stats.powerupsCollected >= 1 },
    { id: 'powerup_10', name: 'Power User', desc: 'Collect 10 power-ups', unlocked: false, condition: (stats) => stats.powerupsCollected >= 10 },
    { id: 'night_runner', name: 'Night Runner', desc: 'Play at night', unlocked: false, condition: (stats) => stats.nightTime >= 10 },
    { id: 'skin_unlock', name: 'Fashion Forward', desc: 'Unlock a skin', unlocked: false, condition: (stats) => stats.skinsUnlocked >= 1 },
    { id: 'hat_unlock', name: 'Hat Collector', desc: 'Unlock a hat', unlocked: false, condition: (stats) => stats.hatsUnlocked >= 1 },
    { id: 'perfect_run', name: 'Untouchable', desc: 'Get 1000 points without dying', unlocked: false, condition: (stats) => stats.bestRun >= 1000 },
    { id: 'magnet_master', name: 'Magnet Master', desc: 'Collect 20 coins with magnet', unlocked: false, condition: (stats) => stats.magnetCoins >= 20 },
  ];

  let gameStats: GameStatsData = {
    totalCoins: 0,
    maxTime: 0,
    maxCombo: 0,
    maxScore: 0,
    powerupsCollected: 0,
    nightTime: 0,
    skinsUnlocked: 0,
    hatsUnlocked: 0,
    bestRun: 0,
    magnetCoins: 0,
  };

  const achievements: Ref<Achievement[]> = ref([]);
  const unlockedSkins: Ref<number[]> = ref([0]);
  const currentSkin: Ref<number> = ref(0);
  const unlockedHats: Ref<string[]> = ref([]);
  const currentHat: Ref<string | null> = ref(null);

  const loadProgress = (): void => {
    const saved = localStorage.getItem('elangoSurfersProgress');
    if (saved) {
      const data = JSON.parse(saved);
      gameStats = { ...gameStats, ...data.stats };
      unlockedSkins.value = data.unlockedSkins || [0];
      unlockedHats.value = data.unlockedHats || [];
      currentSkin.value = data.currentSkin || 0;
      currentHat.value = data.currentHat || null;
    }
  };

  const saveProgress = (): void => {
    localStorage.setItem('elangoSurfersProgress', JSON.stringify({
      stats: gameStats,
      unlockedSkins: unlockedSkins.value,
      unlockedHats: unlockedHats.value,
      currentSkin: currentSkin.value,
      currentHat: currentHat.value,
    }));
  };

  const checkAchievements = (): void => {
    const player = getPlayer();
    ACHIEVEMENTS.forEach(ach => {
      if (!ach.unlocked && ach.condition(gameStats)) {
        ach.unlocked = true;
        achievements.value.push(ach);
        playSound('achievement');
        if (player) createFloatingText('🏆 ' + ach.name, player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#FFD700');

        if (ach.id === 'coin_100') {
          if (!unlockedSkins.value.includes(1)) {
            unlockedSkins.value.push(1);
            gameStats.skinsUnlocked++;
            if (player) createFloatingText('🎨 Skin Unlocked!', player.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '#4ECDC4');
          }
        }
        if (ach.id === 'score_5000') {
          if (!unlockedHats.value.includes('cap')) {
            unlockedHats.value.push('cap');
            gameStats.hatsUnlocked++;
            if (player) createFloatingText('🎩 Hat Unlocked!', player.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '#FFD700');
          }
        }
        saveProgress();
      }
    });
  };

  return {
    ACHIEVEMENTS,
    gameStats,
    achievements,
    unlockedSkins,
    currentSkin,
    unlockedHats,
    currentHat,
    loadProgress,
    saveProgress,
    checkAchievements,
  };
}