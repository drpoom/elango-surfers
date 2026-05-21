<template>
  <div id="game-over">
    <h1>GAME OVER</h1>
    <p>Your Score: {{ score }}</p>
    <p v-if="score >= highScore" style="color: #ffd700; font-weight: bold;">⭐ NEW HIGH SCORE! ⭐</p>
    <!-- Leaderboard -->
    <div id="leaderboard" v-if="leaderboard.length > 0">
      <h3 style="margin:0.5rem 0 0.25rem;color:#ffd700">
        🌍 GLOBAL Leaderboard 
        <span v-if="syncStatus === 'syncing'" style="color:#888;font-size:0.7em">⏳ syncing…</span>
        <span v-if="syncStatus === 'error'" style="color:#f66;font-size:0.7em">📡 offline</span>
      </h3>
      <div v-for="(entry, i) in leaderboard" :key="i" class="lb-entry">
        <span class="lb-rank">{{ i + 1 }}.</span>
        <span class="lb-name">{{ entry.name.toUpperCase().padEnd(3, ' ') }}</span>
        <span class="lb-score">{{ entry.score.toLocaleString() }}</span>
      </div>
    </div>
    <!-- Name entry for high score -->
    <div v-if="showNameEntry" id="name-entry">
      <p style="color:#ffd700;font-weight:bold;margin-bottom:0.5rem">Enter your name (3 chars):</p>
      <input 
        v-model="localPlayerName" 
        maxlength="3" 
        placeholder="AAA"
        @keyup.enter="onSubmit"
        id="name-input"
      />
      <button @click="onSubmit" :disabled="localPlayerName.trim().length === 0" id="submit-btn">SAVE</button>
      <button @click="onSkip" id="skip-btn">SKIP</button>
    </div>
    <p style="margin-top:0.75rem;font-size:0.8rem;color:#aaa">Press SPACE or tap to restart</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: {
    type: Number,
    required: true
  },
  highScore: {
    type: Number,
    required: true
  },
  leaderboard: {
    type: Array,
    required: true
  },
  syncStatus: {
    type: String,
    required: true
  },
  showNameEntry: {
    type: Boolean,
    required: true
  },
  playerName: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:playerName', 'update:showNameEntry', 'submit']);

const localPlayerName = computed({
  get: () => props.playerName,
  set: (val) => emit('update:playerName', val)
});

const onSubmit = () => {
  emit('submit');
};

const onSkip = () => {
  emit('update:showNameEntry', false);
};
</script>
