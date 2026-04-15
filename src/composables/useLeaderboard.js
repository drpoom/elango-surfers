/**
 * useLeaderboard — Leaderboard + high score composable
 * 
 * Extracted from App.vue for AI-friendly incremental refactoring.
 * Dependencies: VERSION string, score ref, highScore ref (passed in)
 * 
 * Usage: const { leaderboard, playerName, showNameEntry, isHighScore, submitScore, loadLeaderboard } = useLeaderboard({ VERSION, score, highScore })
 */

import { ref, computed, watch, nextTick } from 'vue'

export function useLeaderboard({ VERSION, score, highScore }) {
  const LEADERBOARD_KEY = 'elangoSurfersLeaderboard';
  const LEADERBOARD_VERSION_KEY = 'elangoSurfersLBVersion';
  const leaderboard = ref([]);
  const playerName = ref('');
  const showNameEntry = ref(false);

  const loadLeaderboard = () => {
    const storedVersion = localStorage.getItem(LEADERBOARD_VERSION_KEY);
    if (storedVersion !== VERSION) {
      localStorage.removeItem(LEADERBOARD_KEY);
      localStorage.setItem(LEADERBOARD_VERSION_KEY, VERSION);
      leaderboard.value = [];
      return;
    }
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      leaderboard.value = JSON.parse(saved);
    } else {
      leaderboard.value = [];
    }
  };

  const saveLeaderboard = () => {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard.value));
  };

  const submitScore = () => {
    const name = playerName.value.trim().toUpperCase();
    if (name.length < 1) return;
    const entry = { name: name.substring(0, 3), score: score.value, date: new Date().toLocaleDateString() };
    leaderboard.value.push(entry);
    leaderboard.value.sort((a, b) => b.score - a.score);
    leaderboard.value = leaderboard.value.slice(0, 10);
    saveLeaderboard();
    showNameEntry.value = false;
    playerName.value = '';
  };

  const isHighScore = computed(() => {
    return score.value > 0 && score.value >= highScore.value;
  });

  watch(showNameEntry, (val) => {
    if (val) {
      nextTick(() => {
        const input = document.getElementById('name-input');
        if (input) input.focus();
      });
    }
  });

  return {
    leaderboard,
    playerName,
    showNameEntry,
    isHighScore,
    submitScore,
    loadLeaderboard,
  };
}