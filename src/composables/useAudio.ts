/**
 * useAudio.ts — Game audio composable (SFX + BGM)
 * 
 * Extracted from App.vue for AI-friendly incremental refactoring.
 * Dependencies: STAGES array, currentStage ref (passed in)
 * 
 * Usage: const { playSound, startBGM, stopBGM, switchBGMTrack, toggleMute, initAudio, isMuted, isBGMPlaying } = useAudio({ currentStage, STAGES })
 */

import type { Ref } from 'vue';
import type { StageConfig } from '../data/stages';

export interface UseAudioParams {
  currentStage: Ref<number>;
  STAGES: StageConfig[];
}

export interface UseAudioReturn {
  playSound: (type: string, pitchMod?: number) => void;
  playSFX: (name: string, volume?: number) => void;
  startBGM: () => boolean;
  stopBGM: () => void;
  switchBGMTrack: (track: string) => void;
  toggleMute: () => boolean;
  initAudio: () => void;
  startStage3Audio: () => void;
  stopStage3Audio: () => void;
  updateIntercom: (delta: number, isStage3: boolean) => void;
  readonly isMuted: boolean;
  readonly isBGMPlaying: boolean;
  readonly bgmStarted: boolean;
}

export function useAudio({ currentStage, STAGES }: UseAudioParams): UseAudioReturn {
  let audioCtx: AudioContext | null = null;
  let isMuted: boolean = false;
  let audioInitialized: boolean = false;
  let bgmAudio: HTMLAudioElement | null = null;
  let bgmGain: GainNode | null = null;
  let bgmSource: MediaElementAudioSourceNode | null = null;
  let bgmMedievalAudio: HTMLAudioElement | null = null;
  let bgmMedievalSource: MediaElementAudioSourceNode | null = null;
  let bgmMedievalGain: GainNode | null = null;
  let isBGMPlaying: boolean = false;
  let isMedievalBGM: boolean = false;
  let bgmInterval: number | null = null;

  // SFX cache: preloaded Audio objects
  const sfxCache: Record<string, HTMLAudioElement | HTMLAudioElement[]> = {};
  const SFX_FILES: Record<string, string | string[]> = {
    truck_honk: 'assets/sfx_truck_honk.ogg',
    dragon_cry: 'assets/sfx_dragon_cry.ogg',
    truck_rev: 'assets/sfx_truck_rev.ogg',
    fire_shoot: 'assets/sfx_fire_shoot.ogg',
    stage_clear: 'assets/sfx_stage_clear.ogg',
    crash_wood: 'assets/sfx-crash-wood.ogg',
    crash_glass: 'assets/sfx-crash-glass.ogg',
    crash_metal: 'assets/sfx-crash-metal.ogg',
    assembly: 'assets/sfx-assembly.ogg',
    portal_whoosh: 'assets/sfx-portal-whoosh.ogg',
    cash_register: 'assets/sfx-cash-register.ogg',
    intercom: [
      'assets/sfx-intercom-1.ogg',
      'assets/sfx-intercom-2.ogg',
      'assets/sfx-intercom-3.ogg',
      'assets/sfx-intercom-4.ogg',
      'assets/sfx-intercom-5.ogg',
    ],
  };

  let intercomTimer: number = 0;
  let intercomInterval: number = 25000;

  const initAudio = (): void => {
    if (audioInitialized) return;
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioInitialized = true;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(err => console.log('Audio resume failed:', err));
    }
    for (const [key, path] of Object.entries(SFX_FILES)) {
      if (Array.isArray(path)) {
        sfxCache[key] = path.map(p => {
          const audio = new Audio(p);
          audio.preload = 'auto';
          audio.volume = 0.8;
          return audio;
        });
      } else {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0.8;
        sfxCache[key] = audio;
      }
    }

    const STAGE1_BGM_FILE = 'assets/elango_main_theme.mp3';
    const STAGE1_BGM_FALLBACK = 'assets/game_music.ogg';
    bgmAudio = new Audio(STAGE1_BGM_FILE);
    bgmAudio.preload = 'auto';
    bgmAudio.loop = true;
    bgmAudio.volume = 1;
    bgmAudio.onerror = () => {
      console.warn('Primary Stage 1 BGM failed, trying fallback...');
      if (bgmAudio) {
        bgmAudio.src = STAGE1_BGM_FALLBACK;
        bgmAudio.load();
      }
    };
    bgmAudio.load();

    bgmMedievalAudio = new Audio('assets/elango_main_theme.mp3');
    bgmMedievalAudio.preload = 'auto';
    bgmMedievalAudio.loop = true;
    bgmMedievalAudio.volume = 1;
    bgmMedievalAudio.load();
  };

  const playSound = (type: string, pitchMod: number = 1): void => {
    if (isMuted) return;
    if (!audioCtx) initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') {
      if (audioCtx) audioCtx.resume();
      return;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
      case 'jump':
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'slide':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'coin':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'crash':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'start':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(800 * pitchMod, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'achievement':
        osc.type = 'square';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        osc.frequency.setValueAtTime(1047, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'shield_hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'crash_wood':
        playSFX('crash_wood', 0.9);
        break;
      case 'crash_glass':
        playSFX('crash_glass', 0.9);
        break;
      case 'crash_metal':
        playSFX('crash_metal', 0.9);
        break;
      case 'assembly':
        playSFX('assembly', 0.7);
        break;
      case 'portal_whoosh':
        playSFX('portal_whoosh', 0.8);
        break;
      case 'cash_register':
        playSFX('cash_register', 0.8);
        break;
    }
  };

  const toggleMute = (): boolean => {
    isMuted = !isMuted;
    if (audioCtx) {
      if (isMuted) {
        audioCtx.suspend();
      } else {
        audioCtx.resume();
        if (!isBGMPlaying) {
          startBGM();
        }
      }
    }
    return isMuted;
  };

  const getCurrentBGMTrack = (): string => {
    const stage = STAGES[currentStage.value];
    return (stage && stage.roadType === 'cobblestone') ? 'medieval' : 'highway';
  };

  let bgmStarted: boolean = false;

  const startBGM = (): boolean => {
    if (isMuted) return false;
    if (!audioCtx) initAudio();
    if (!audioCtx) return false;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
      if (!bgmStarted) return false;
    }
    if (isBGMPlaying) return true;

    isBGMPlaying = true;
    const track = getCurrentBGMTrack();
    isMedievalBGM = (track === 'medieval');

    const STAGE1_BGM_FILE = 'assets/elango_main_theme.mp3';
    const STAGE1_BGM_FALLBACK = 'assets/game_music.ogg';

    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = isMedievalBGM ? 0 : 0.5;
    bgmGain.connect(audioCtx.destination);

    if (!bgmAudio) {
      bgmAudio = new Audio(STAGE1_BGM_FILE);
      bgmAudio.onerror = () => {
        console.warn('Primary Stage 1 BGM failed, trying fallback...');
        if (bgmAudio) {
          bgmAudio.src = STAGE1_BGM_FALLBACK;
          bgmAudio.load();
        }
      };
      bgmAudio.loop = true;
      bgmAudio.volume = 1;
    }
    if (!bgmSource) {
      bgmSource = audioCtx.createMediaElementSource(bgmAudio);
    }
    bgmSource.connect(bgmGain);
    bgmAudio.currentTime = 0;
    const highwayPromise = bgmAudio.play();
    if (highwayPromise) {
      highwayPromise.then(() => { bgmStarted = true; }).catch(e => {
        console.warn('Highway BGM play failed:', e);
      });
    }

    if (!bgmMedievalAudio) {
      bgmMedievalAudio = new Audio('assets/elango_main_theme.mp3');
      bgmMedievalAudio.loop = true;
      bgmMedievalAudio.volume = 1;
    }
    if (!bgmMedievalSource) {
      bgmMedievalSource = audioCtx.createMediaElementSource(bgmMedievalAudio);
    }
    bgmMedievalGain = audioCtx.createGain();
    bgmMedievalGain.gain.value = isMedievalBGM ? 0.5 : 0;
    bgmMedievalGain.connect(audioCtx.destination);
    bgmMedievalSource.connect(bgmMedievalGain);
    bgmMedievalAudio.currentTime = 0;
    const medievalPromise = bgmMedievalAudio.play();
    if (medievalPromise) {
      medievalPromise.then(() => { bgmStarted = true; }).catch(e => {
        console.warn('Medieval BGM play failed:', e);
      });
    }

    return true;
  };

  const switchBGMTrack = (track: string): void => {
    if (!audioCtx || !isBGMPlaying) return;
    const toMedieval = (track === 'medieval');
    if (toMedieval === isMedievalBGM) return;
    isMedievalBGM = toMedieval;
    const fadeTime = audioCtx.currentTime + 2;
    if (bgmGain) bgmGain.gain.linearRampToValueAtTime(toMedieval ? 0 : 0.5, fadeTime);
    if (bgmMedievalGain) bgmMedievalGain.gain.linearRampToValueAtTime(toMedieval ? 0.5 : 0, fadeTime);
  };

  const stopBGM = (): void => {
    isBGMPlaying = false;
    bgmStarted = false;
    isMedievalBGM = false;
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    }
    if (bgmMedievalAudio) {
      bgmMedievalAudio.pause();
      bgmMedievalAudio.currentTime = 0;
    }
    if (bgmGain) {
      try { bgmGain.disconnect(); } catch(e) {}
      bgmGain = null;
    }
    if (bgmMedievalGain) {
      try { bgmMedievalGain.disconnect(); } catch(e) {}
      bgmMedievalGain = null;
    }
    if (bgmInterval !== null) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  };

  const playSFX = (name: string, volume: number = 0.8): void => {
    if (isMuted) return;
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const audio = sfxCache[name];
    if (!audio) return;
    const clone = (audio as HTMLAudioElement).cloneNode() as HTMLAudioElement;
    clone.volume = volume;
    clone.play().catch(() => {});
  };

  const startStage3Audio = (): void => {
    if (!audioCtx) initAudio();
    if (!audioCtx || isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!bgmAudio) {
      bgmAudio = new Audio('assets/elango_main_theme.mp3');
      bgmAudio.loop = true;
      bgmAudio.volume = 1;
    }
    if (!bgmSource) {
      bgmSource = audioCtx.createMediaElementSource(bgmAudio);
    }
    if (!bgmGain) {
      bgmGain = audioCtx.createGain();
      bgmGain.gain.value = 0.5;
      bgmGain.connect(audioCtx.destination);
      bgmSource.connect(bgmGain);
    }
    bgmAudio.currentTime = 0;
    bgmAudio.play().catch(e => console.warn('Stage 3 BGM play failed:', e));
  };

  const stopStage3Audio = (): void => {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    }
    if (bgmGain) {
      try { bgmGain.disconnect(); } catch(e) {}
      bgmGain = null;
    }
  };

  const updateIntercom = (delta: number, isStage3: boolean): void => {
    if (!isStage3 || !audioInitialized) return;
    intercomTimer += delta * 1000;
    if (intercomTimer >= intercomInterval) {
      intercomTimer = 0;
      intercomInterval = 20000 + Math.random() * 10000;
      const clips = sfxCache.intercom;
      if (Array.isArray(clips) && clips.length) {
        const clip = clips[Math.floor(Math.random() * clips.length)];
        const audio = clip.cloneNode() as HTMLAudioElement;
        audio.volume = 0.6;
        audio.play().catch(() => {});
      }
    }
  };

  return {
    playSound,
    playSFX,
    startBGM,
    stopBGM,
    switchBGMTrack,
    toggleMute,
    initAudio,
    startStage3Audio,
    stopStage3Audio,
    updateIntercom,
    get isMuted() { return isMuted; },
    get isBGMPlaying() { return isBGMPlaying; },
    get bgmStarted() { return bgmStarted; },
  };
}