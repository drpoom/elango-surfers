import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UseLoadingProgressReturn {
  loadingProgress: ComputedRef<number>;
  isLoaded: ComputedRef<boolean>;
  trackTexture: () => void;
  onTextureLoaded: () => void;
  resetProgress: () => void;
}

export function useLoadingProgress(): UseLoadingProgressReturn {
  const totalTextures: Ref<number> = ref(0);
  const loadedTextures: Ref<number> = ref(0);
  const loadingProgress: ComputedRef<number> = computed(() => {
    if (totalTextures.value === 0) return 0;
    return Math.round((loadedTextures.value / totalTextures.value) * 100);
  });
  const isLoaded: ComputedRef<boolean> = computed(() => loadingProgress.value >= 100);

  function trackTexture(): void {
    totalTextures.value++;
  }

  function onTextureLoaded(): void {
    loadedTextures.value++;
  }

  function resetProgress(): void {
    totalTextures.value = 0;
    loadedTextures.value = 0;
  }

  return { loadingProgress, isLoaded, trackTexture, onTextureLoaded, resetProgress };
}