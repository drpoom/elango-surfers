import { ref, computed } from 'vue'

export function useLoadingProgress() {
  const totalTextures = ref(0)
  const loadedTextures = ref(0)
  const loadingProgress = computed(() => {
    if (totalTextures.value === 0) return 0
    return Math.round((loadedTextures.value / totalTextures.value) * 100)
  })
  const isLoaded = computed(() => loadingProgress.value >= 100)
  
  function trackTexture() {
    totalTextures.value++
  }
  
  function onTextureLoaded() {
    loadedTextures.value++
  }
  
  function resetProgress() {
    totalTextures.value = 0
    loadedTextures.value = 0
  }
  
  return { loadingProgress, isLoaded, trackTexture, onTextureLoaded, resetProgress }
}
