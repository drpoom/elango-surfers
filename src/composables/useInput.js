/**
 * useInput.js — Input handling for tilt calibration, touch/swipe gestures, keyboard, and device orientation
 * 
 * Handles tilt calibration state and functions, plus touch/swipe, keyboard, and tilt input handlers.
 * No THREE.js dependencies — pure state management.
 * 
 * Usage: const { tiltCalibrationSamples, isCalibrating, startTiltCalibration, finishTiltCalibration, useSwipeHandlers, createTiltHandler, createKeyboardHandler } = useInput(tiltInitialBeta, tiltInitialGamma)
 */

import { ref } from 'vue'
import { TILT_THRESHOLD, TILT_LR_THRESHOLD, TILT_LANE_COOLDOWN, CALIBRATION_MAX_SAMPLES } from '../gameConstants.js'

export function useInput(tiltInitialBetaRef = null, tiltInitialGammaRef = null) {
  const tiltCalibrationSamples = ref([]);
  const isCalibrating = ref(false);

  const startTiltCalibration = () => {
    tiltCalibrationSamples.value = [];
    isCalibrating.value = true;
    if (tiltInitialBetaRef) tiltInitialBetaRef.value = null;
    if (tiltInitialGammaRef) tiltInitialGammaRef.value = null;
  };

  const finishTiltCalibration = () => {
    if (tiltCalibrationSamples.value.length === 0) {
      // Fallback: use current single reading or 0
      if (tiltInitialBetaRef) tiltInitialBetaRef.value = tiltInitialBetaRef.value ?? 45; // Neutral phone hold
      if (tiltInitialGammaRef) tiltInitialGammaRef.value = tiltInitialGammaRef.value ?? 0;
    } else {
      // Average all samples
      const avgBeta = tiltCalibrationSamples.value.reduce((s, v) => s + v.beta, 0) / tiltCalibrationSamples.value.length;
      const avgGamma = tiltCalibrationSamples.value.reduce((s, v) => s + v.gamma, 0) / tiltCalibrationSamples.value.length;
      if (tiltInitialBetaRef) tiltInitialBetaRef.value = avgBeta;
      if (tiltInitialGammaRef) tiltInitialGammaRef.value = avgGamma;
    }
    isCalibrating.value = false;
    tiltCalibrationSamples.value = [];
  };

  return {
    tiltCalibrationSamples,
    isCalibrating,
    startTiltCalibration,
    finishTiltCalibration,
  };
}

/**
 * useSwipeHandlers — Touch/swipe gesture handlers for mobile input
 * 
 * Creates touch event handlers that detect swipe gestures and call appropriate callbacks.
 * 
 * @param {Object} options - Callback functions for different actions
 * @param {Function} options.onJump - Called when swipe up or tap detected
 * @param {Function} options.onSlide - Called when swipe down detected
 * @param {Function} options.onLeft - Called when swipe left detected
 * @param {Function} options.onRight - Called when swipe right detected
 * @param {Function} options.onRestart - Called when tap detected during game over
 * @param {Ref<boolean>} options.gameOverRef - Reference to game over state
 * @param {Ref<boolean>} options.countdownLockedRef - Reference to countdown locked state
 * @param {Ref<boolean>} options.showNameEntryRef - Reference to name entry state
 * @param {number} options.minSwipeDistance - Minimum swipe distance in pixels (default: 30)
 * @param {Function} options.onAudioInit - Optional callback to initialize audio on first touch
 * @returns {Object} Touch event handlers and state
 */
export function useSwipeHandlers({
  onJump,
  onSlide,
  onLeft,
  onRight,
  onRestart,
  gameOverRef,
  countdownLockedRef,
  showNameEntryRef,
  minSwipeDistance = 30,
  onAudioInit,
} = {}) {
  const touchStartX = ref(0);
  const touchStartY = ref(0);

  const handleSwipe = (direction) => {
    if (gameOverRef?.value || countdownLockedRef?.value) return;
    
    if (direction === 'left') {
      onLeft?.();
    } else if (direction === 'right') {
      onRight?.();
    } else if (direction === 'up') {
      onJump?.();
    } else if (direction === 'down') {
      onSlide?.();
    }
  };

  const handleTouchStart = (e) => {
    // Don't intercept touches on UI buttons or name entry
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
    e.preventDefault();
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
    // Initialize audio on first touch
    onAudioInit?.();
  };

  const handleTouchEnd = (e) => {
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    // If game over, any tap restarts (but not during name entry, and not within 1s of death)
    if (gameOverRef?.value) {
      if (showNameEntryRef?.value) return;
      // Note: gameOverTime check should be done by caller in onRestart
      onRestart?.();
      return;
    }
    
    const diffX = touchEndX - touchStartX.value;
    const diffY = touchEndY - touchStartY.value;
    
    // Determine if horizontal or vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
          handleSwipe('right');
        } else {
          handleSwipe('left');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > minSwipeDistance) {
        if (diffY < 0) {
          handleSwipe('up');
        } else {
          handleSwipe('down');
        }
      }
    }
  };

  return {
    touchStartX,
    touchStartY,
    handleSwipe,
    handleTouchStart,
    handleTouchEnd,
  };
}

/**
 * createTiltHandler — Device orientation handler for mobile tilt controls
 * 
 * Creates a deviceorientation event handler that processes tilt data and calls callbacks.
 * 
 * @param {Object} options - State refs and callbacks
 * @param {Ref<boolean>} options.tiltEnabledRef - Whether tilt is enabled
 * @param {Ref<boolean>} options.gameOverRef - Game over state
 * @param {Ref<boolean>} options.isCalibratingRef - Calibration state
 * @param {Ref<Array>} options.tiltCalibrationSamplesRef - Calibration samples array
 * @param {Ref<number|null>} options.tiltInitialBetaRef - Calibrated beta reference
 * @param {Ref<number|null>} options.tiltInitialGammaRef - Calibrated gamma reference
 * @param {Ref<number>} options.currentLaneRef - Current lane (0-2)
 * @param {Ref<boolean>} options.isJumpingRef - Whether player is jumping
 * @param {Ref<boolean>} options.isSlidingRef - Whether player is sliding
 * @param {Ref<boolean>} options.countdownLockedRef - Countdown locked state
 * @param {Function} options.onJump - Callback for jump action
 * @param {Function} options.onSlide - Callback for slide action
 * @param {Function} options.onLaneChange - Callback for lane change (direction: -1 or 1)
 * @returns {Function} Device orientation event handler
 */
export function createTiltHandler({
  tiltEnabledRef,
  gameOverRef,
  isCalibratingRef,
  tiltCalibrationSamplesRef,
  tiltInitialBetaRef,
  tiltInitialGammaRef,
  currentLaneRef,
  isJumpingRef,
  isSlidingRef,
  countdownLockedRef,
  onJump,
  onSlide,
  onLaneChange,
} = {}) {
  let lastTiltLaneChange = 0;

  return (e) => {
    if (!tiltEnabledRef?.value || gameOverRef?.value) return;
    
    const beta = e.beta;  // Front-back tilt (-180 to 180)
    const gamma = e.gamma; // Left-right tilt (-90 to 90)
    
    if (beta === null || gamma === null) return;
    
    // During calibration (countdown), collect samples
    if (isCalibratingRef?.value) {
      tiltCalibrationSamplesRef?.value.push({ beta, gamma });
      if (tiltCalibrationSamplesRef?.value.length > CALIBRATION_MAX_SAMPLES) {
        tiltCalibrationSamplesRef?.value.shift();
      }
      return; // Don't process tilt during calibration
    }
    
    // Calibrate on first reading (non-mobile fallback)
    if (tiltInitialBetaRef?.value === null) {
      tiltInitialBetaRef.value = beta;
      tiltInitialGammaRef.value = gamma;
      return;
    }
    
    const tiltForward = beta - tiltInitialBetaRef.value; // Negative = tilted forward (up)
    const tiltSideways = gamma - (tiltInitialGammaRef.value || 0); // Relative to calibrated center
    
    // Tilt phone toward you (beta increases) = jump
    if (tiltForward > TILT_THRESHOLD && !isJumpingRef?.value && !isSlidingRef?.value && !countdownLockedRef?.value) {
      onJump?.();
    }
    
    // Tilt phone away from you (beta decreases) = slide
    if (tiltForward < -TILT_THRESHOLD && !isJumpingRef?.value && !isSlidingRef?.value && !countdownLockedRef?.value) {
      onSlide?.();
    }
    
    // Tilt left/right = lane change
    const now = Date.now();
    if (now - lastTiltLaneChange > TILT_LANE_COOLDOWN && !countdownLockedRef?.value) {
      if (tiltSideways < -TILT_LR_THRESHOLD) {
        if (currentLaneRef?.value > 0) {
          currentLaneRef.value--;
          lastTiltLaneChange = now;
          onLaneChange?.(-1);
        }
      } else if (tiltSideways > TILT_LR_THRESHOLD) {
        if (currentLaneRef?.value < 2) {
          currentLaneRef.value++;
          lastTiltLaneChange = now;
          onLaneChange?.(1);
        }
      }
    }
  };
}

/**
 * createKeyboardHandler — Keyboard event handler for desktop controls
 * 
 * Creates a keydown event handler that processes keyboard input and calls callbacks.
 * 
 * @param {Object} options - State refs and callbacks
 * @param {Ref<boolean>} options.gameOverRef - Game over state
 * @param {Ref<number>} options.gameOverTimeRef - Game over timestamp
 * @param {Ref<boolean>} options.showNameEntryRef - Name entry visible state
 * @param {Ref<boolean>} options.countdownLockedRef - Countdown locked state
 * @param {Ref<number>} options.currentLaneRef - Current lane (0-2)
 * @param {Ref<boolean>} options.isJumpingRef - Whether player is jumping
 * @param {Ref<boolean>} options.isSlidingRef - Whether player is sliding
 * @param {Function} options.onStartCountdown - Callback to start countdown/restart
 * @param {Function} options.onJump - Callback for jump action
 * @param {Function} options.onSlide - Callback for slide action
 * @param {Function} options.onLaneChange - Callback for lane change (direction: -1 or 1)
 * @param {Function} options.onAudioInit - Optional callback to initialize audio
 * @returns {Function} Keyboard event handler
 */
export function createKeyboardHandler({
  gameOverRef,
  gameOverTimeRef,
  showNameEntryRef,
  countdownLockedRef,
  currentLaneRef,
  isJumpingRef,
  isSlidingRef,
  onStartCountdown,
  onJump,
  onSlide,
  onLaneChange,
  onAudioInit,
} = {}) {
  return (e) => {
    // Prevent default for game controls to stop page scrolling
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    // Initialize audio on first keypress
    onAudioInit?.();
    
    // Restart on Space, Enter, or any key when game over (but not during name entry)
    if (gameOverRef?.value) {
      if (showNameEntryRef?.value) return; // Don't restart while entering name
      if (Date.now() - gameOverTimeRef?.value < 1000) return; // Prevent instant restart
      onStartCountdown?.();
      return;
    }
    
    if (gameOverRef?.value || countdownLockedRef?.value) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      if (currentLaneRef?.value > 0) {
        currentLaneRef.value--;
        onLaneChange?.(-1);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (currentLaneRef?.value < 2) {
        currentLaneRef.value++;
        onLaneChange?.(1);
      }
    }
    
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !isJumpingRef?.value) {
      onJump?.();
    }
    if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && !isSlidingRef?.value) {
      onSlide?.();
    }
  };
}
