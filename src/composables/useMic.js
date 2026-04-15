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
    return sum / micDataArray.length;
  };

  return {
    micEnabledRef,
    initMic,
    toggleMic,
    getMicVolume,
  };
}