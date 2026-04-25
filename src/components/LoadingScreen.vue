<template>
  <div 
    class="loading-screen" 
    :class="{ 'fade-out': isFadingOut }"
    @click="handleStart"
  >
    <video class="video-bg" muted loop playsinline v-show="false">
      <!-- Future video source here -->
    </video>
    
    <div class="content">
      <div class="version">{{ version }}</div>
      <div class="prompt">Press any key / Tap to start</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  version: {
    type: String,
    default: 'v0.0.0'
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

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
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

.video-bg {
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
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: bold;
}

.prompt {
  font-size: 18px;
  animation: pulse 2s infinite ease-in-out;
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
