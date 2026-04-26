<template>
  <div 
    class="loading-screen" 
    :class="{ 'fade-out': isFadingOut }"
  >
    <img class="loading-bg" src="/assets/loading-screen.jpg" alt="Elango Surfers" />
    
    <div class="content">
      <div class="version">Elango Surfers {{ version }}</div>
      <div v-if="!loaded" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <div v-if="!loaded" class="loading-text">Loading... {{ progress }}%</div>
      <div v-else class="prompt">Press any key / Tap to start</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  version: {
    type: String,
    default: 'v0.0.0'
  },
  progress: {
    type: Number,
    default: 0
  },
  loaded: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['start']);
const isFadingOut = ref(false);

const handleStart = () => {
  if (isFadingOut.value) return;
  
  isFadingOut.value = true;
  emit('start');
};

const handleKeyDown = (event) => {
  handleStart();
};

const handleClick = () => {
  handleStart();
};

const handleTouch = (event) => {
  event.preventDefault();
  handleStart();
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown, { capture: true });
  document.addEventListener('click', handleClick, { capture: true });
  document.addEventListener('touchstart', handleTouch, { capture: true, passive: false });
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown, { capture: true });
  document.removeEventListener('click', handleClick, { capture: true });
  document.removeEventListener('touchstart', handleTouch, { capture: true });
});
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  background-color: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'Courier New', Courier, monospace;
  cursor: pointer;
  transition: opacity 300ms ease-out;
  opacity: 1;
}

.loading-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.content {
  text-align: center;
  user-select: none;
}

.version {
  font-size: 28px;
  margin-bottom: 20px;
  font-weight: bold;
  text-shadow: 
    2px 2px 0 #000,
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000;
  letter-spacing: 2px;
}

.progress-bar-container {
  width: 300px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto 15px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #44a08d);
  border-radius: 4px;
  transition: width 0.2s ease;
}

.loading-text {
  font-size: 18px;
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 
    2px 2px 0 #000,
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000;
}

.prompt {
  font-size: 20px;
  font-weight: bold;
  animation: pulse 2s infinite ease-in-out;
  text-shadow: 
    2px 2px 0 #000,
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
