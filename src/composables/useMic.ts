/**
 * useMic.ts — Microphone input for voice/fly controls
 * 
 * Handles mic stream init, volume analysis, and toggle.
 * No THREE.js dependencies — pure browser audio API.
 * 
 * Usage: const { micEnabledRef, initMic, toggleMic, getMicVolume } = useMic()
 */

import { ref, type Ref } from 'vue'

export interface UseMicReturn {
  micEnabledRef: Ref<boolean>;
  initMic: () => Promise<void>;
  toggleMic: (onDisable?: () => void) => Promise<void>;
  getMicVolume: () => number;
  cleanupMic: () => void;
  startCalibration: () => void;
}

export function useMic(): UseMicReturn {
  let micStream: MediaStream | null = null;
  let micAnalyser: AnalyserNode | null = null;
  let micDataArray: Uint8Array | null = null;
  const micEnabledRef: Ref<boolean> = ref(false);
  let micEnabled: boolean = false;
  let ambientNoiseBaseline: number = 0;
  let isCalibrating: boolean = false;
  let calibrationSamples: number[] = [];

  const initMic = async (): Promise<void> => {
    if (micStream) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const toggleMic = async (onDisable?: () => void): Promise<void> => {
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

  const getMicVolume = (): number => {
    if (!micAnalyser || !micDataArray) return 0;
    micAnalyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for (let i = 0; i < micDataArray.length; i++) sum += micDataArray[i];
    const rawVolume = sum / micDataArray.length;
    return Math.max(0, rawVolume - ambientNoiseBaseline);
  };

  const startCalibration = (): void => {
    if (!micAnalyser || !micDataArray) return;
    isCalibrating = true;
    calibrationSamples = [];
    const collectSample = (): void => {
      if (!isCalibrating) return;
      micAnalyser!.getByteFrequencyData(micDataArray!);
      let sum = 0;
      for (let i = 0; i < micDataArray!.length; i++) sum += micDataArray![i];
      calibrationSamples.push(sum / micDataArray!.length);
      if (calibrationSamples.length < 30) {
        setTimeout(collectSample, 50);
      } else {
        const avg = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
        ambientNoiseBaseline = avg;
        isCalibrating = false;
        calibrationSamples = [];
        console.log('Mic calibrated: ambient baseline =', ambientNoiseBaseline.toFixed(1));
      }
    };
    collectSample();
  };

  const cleanupMic = (): void => {
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