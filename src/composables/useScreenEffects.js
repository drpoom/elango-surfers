import { ref } from 'vue';

// Reduce motion setting - shared across the app
export const reduceMotionRef = ref(false);

/**
 * Initialize screen effects settings from localStorage
 */
export function initScreenEffects() {
  const saved = localStorage.getItem('elangoSurfersReduceMotion');
  if (saved !== null) {
    reduceMotionRef.value = saved === 'true';
  }
}

/**
 * Save screen effects settings to localStorage
 */
export function saveScreenEffects() {
  localStorage.setItem('elangoSurfersReduceMotion', reduceMotionRef.value.toString());
}

/**
 * Hook to skip motion effects if reduce motion is enabled.
 * Call this at the top of any effect function.
 * 
 * @returns {boolean} true if effect should be skipped (reduce motion enabled)
 */
export function shouldSkipEffect() {
  if (reduceMotionRef.value) return true;
  return false;
}
