/**
 * useAudio — Game audio composable (SFX + BGM)
 * 
 * Extracted from App.vue for AI-friendly incremental refactoring.
 * Dependencies: STAGES array, currentStage ref (passed in)
 * 
 * Usage: const { playSound, startBGM, stopBGM, switchBGMTrack, toggleMute, initAudio, isMuted, isBGMPlaying } = useAudio({ currentStage, STAGES })
 */

export function useAudio({ currentStage, STAGES }) {
  let audioCtx = null;
  let isMuted = false;
  let audioInitialized = false;
  let bgmAudio = null;
  let bgmGain = null;
  let bgmSource = null;
  let bgmMedievalAudio = null;
  let bgmMedievalSource = null;
  let bgmMedievalGain = null;
  let isBGMPlaying = false;
  let isMedievalBGM = false;
  let bgmInterval = null;

  // SFX cache: preloaded Audio objects
  const sfxCache = {};
  const SFX_FILES = {
    truck_honk: 'assets/sfx_truck_honk.ogg',
    dragon_cry: 'assets/sfx_dragon_cry.ogg',
    truck_rev: 'assets/sfx_truck_rev.ogg',
    fire_shoot: 'assets/sfx_fire_shoot.ogg',
    stage_clear: 'assets/sfx_stage_clear.ogg',
  };

  const initAudio = () => {
    if (audioInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(err => console.log('Audio resume failed:', err));
    }
    // Preload SFX files
    for (const [key, path] of Object.entries(SFX_FILES)) {
      sfxCache[key] = new Audio(path);
      sfxCache[key].preload = 'auto';
      sfxCache[key].volume = 0.8;
    }
  };

  const playSound = (type, pitchMod = 1) => {
    if (isMuted) return;
    if (!audioCtx) {
      initAudio();
    }
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
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
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
    }
  };

  const toggleMute = () => {
    isMuted = !isMuted;
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }
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
  };

  const getCurrentBGMTrack = () => {
    const stage = STAGES[currentStage.value];
    return (stage && stage.roadTexture === 'cobblestone') ? 'medieval' : 'highway';
  };

  const startBGM = () => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isBGMPlaying) return;
    if (isMuted) return;

    isBGMPlaying = true;
    const track = getCurrentBGMTrack();
    isMedievalBGM = (track === 'medieval');

    // Highway BGM
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = isMedievalBGM ? 0 : 0.5;
    bgmGain.connect(audioCtx.destination);

    if (!bgmAudio) {
      bgmAudio = new Audio('assets/game_music.ogg');
      bgmAudio.loop = true;
      bgmAudio.volume = 1;
      bgmSource = audioCtx.createMediaElementSource(bgmAudio);
    }
    bgmSource.connect(bgmGain);
    bgmAudio.currentTime = 0;
    bgmAudio.play().catch(e => console.warn('Highway BGM play failed:', e));

    // Medieval BGM
    if (!bgmMedievalAudio) {
      bgmMedievalAudio = new Audio('assets/medieval_music.ogg');
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
    bgmMedievalAudio.play().catch(e => console.warn('Medieval BGM play failed:', e));
  };

  const switchBGMTrack = (track) => {
    if (!audioCtx || !isBGMPlaying) return;
    const toMedieval = (track === 'medieval');
    if (toMedieval === isMedievalBGM) return;
    isMedievalBGM = toMedieval;
    const fadeTime = audioCtx.currentTime + 2;
    if (bgmGain) bgmGain.gain.linearRampToValueAtTime(toMedieval ? 0 : 0.5, fadeTime);
    if (bgmMedievalGain) bgmMedievalGain.gain.linearRampToValueAtTime(toMedieval ? 0.5 : 0, fadeTime);
  };

  const stopBGM = () => {
    isBGMPlaying = false;
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
    if (bgmInterval) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  };

  const playSFX = (name, volume = 0.8) => {
    if (isMuted) return;
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const audio = sfxCache[name];
    if (!audio) return;
    // Clone to allow overlapping plays (e.g. multiple fireballs)
    const clone = audio.cloneNode();
    clone.volume = volume;
    clone.play().catch(() => {});
  };

  return {
    playSound,
    playSFX,
    startBGM,
    stopBGM,
    switchBGMTrack,
    toggleMute,
    initAudio,
    get isMuted() { return isMuted; },
    get isBGMPlaying() { return isBGMPlaying; },
  };
}