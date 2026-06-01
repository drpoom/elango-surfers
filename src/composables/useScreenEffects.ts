import { ref, type Ref } from 'vue';

// Reduce motion setting - shared across the app
export const reduceMotionRef: Ref<boolean> = ref(false);

/**
 * Initialize screen effects settings from localStorage
 */
export function initScreenEffects(): void {
  const saved = localStorage.getItem('elangoSurfersReduceMotion');
  if (saved !== null) {
    reduceMotionRef.value = saved === 'true';
  }
}

/**
 * Save screen effects settings to localStorage
 */
export function saveScreenEffects(): void {
  localStorage.setItem('elangoSurfersReduceMotion', reduceMotionRef.value.toString());
}

/**
 * Hook to skip motion effects if reduce motion is enabled.
 * Call this at the top of any effect function.
 * 
 * @returns true if effect should be skipped (reduce motion enabled)
 */
export function shouldSkipEffect(): boolean {
  return reduceMotionRef.value;
}