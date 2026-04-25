/**
 * useMic.js — Microphone input for voice/fly controls
 * 
 * Handles mic stream init, volume analysis, and toggle.
 * No THREE.js dependencies — pure browser audio API.
 * 
 * Usage: const { micEnabledRef, initMic, toggleMic, getMicVolume } = useMic()
 */

import { ref } from 'vue'

export function useMic() {
  let micStream = null;
  let micAnalyser = null;
  let micDataArray = null;
  const micEnabledRef = ref(false);
  let micEnabled = false;
  let ambientNoiseBaseline = 0;
  let isCalibrating = false;
  let calibrationSamples = [];

  const initMic = async () => {
    if (micStream) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micStream);
      micAnalyser = audioCtx.createAnalyser();
      micAnalyser.fftSize = 256;
      source.connect(micAnalyser);
      micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);
      micEnabled = true;
      micEnabledRef.value = true;
    } catch (e) {
      console.log('Mic not available:', e);
    }
  };

  const toggleMic = async (onDisable) => {
    if (micEnabled) {
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
        micStream = null;
      }
      micAnalyser = null;
      micDataArray = null;
      micEnabled = false;
      micEnabledRef.value = false;
      if (onDisable) onDisable();
    } else {
      await initMic();
    }
  };

  const getMicVolume = () => {
    if (!micAnalyser || !micDataArray) return 0;
    micAnalyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for (let i = 0; i < micDataArray.length; i++) sum += micDataArray[i];
    const rawVolume = sum / micDataArray.length;
    // Subtract ambient baseline (clamped to 0)
    return Math.max(0, rawVolume - ambientNoiseBaseline);
  };

  // Calibrate ambient noise baseline during countdown
  const startCalibration = () => {
    if (!micAnalyser || !micDataArray) return;
    isCalibrating = true;
    calibrationSamples = [];
    const collectSample = () => {
      if (!isCalibrating) return;
      micAnalyser.getByteFrequencyData(micDataArray);
      let sum = 0;
      for (let i = 0; i < micDataArray.length; i++) sum += micDataArray[i];
      calibrationSamples.push(sum / micDataArray.length);
      if (calibrationSamples.length < 30) { // ~1.5s at 20Hz
        setTimeout(collectSample, 50);
      } else {
        // Calculate average baseline
        const avg = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
        ambientNoiseBaseline = avg;
        isCalibrating = false;
        calibrationSamples = [];
        console.log('Mic calibrated: ambient baseline =', ambientNoiseBaseline.toFixed(1));
      }
    };
    collectSample();
  };

  // Cleanup: stop mic stream
  const cleanupMic = () => {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    micAnalyser = null;
    micDataArray = null;
    micEnabled = false;
    micEnabledRef.value = false;
  };

  return {
    micEnabledRef,
    initMic,
    toggleMic,
    getMicVolume,
    cleanupMic,
    startCalibration,
  };
}