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
    // Stage 3 SFX
    crash_wood: 'assets/sfx-crash-wood.ogg',
    crash_glass: 'assets/sfx-crash-glass.ogg',
    crash_metal: 'assets/sfx-crash-metal.ogg',
    assembly: 'assets/sfx-assembly.ogg',
    portal_whoosh: 'assets/sfx-portal-whoosh.ogg',
    cash_register: 'assets/sfx-cash-register.ogg',
    // Intercom clips (loaded as array)
    intercom: [
      'assets/sfx-intercom-1.ogg',
      'assets/sfx-intercom-2.ogg',
      'assets/sfx-intercom-3.ogg',
      'assets/sfx-intercom-4.ogg',
      'assets/sfx-intercom-5.ogg',
    ],
  };
  
  // Stage 3 BGM and ambient
  let ambientAudio = null;
  let ambientGain = null;
  let bgmIkeaAudio = null;
  let bgmIkeaGain = null;
  let isStage3BGM = false;
  
  // Intercom randomizer state
  let intercomTimer = 0;
  let intercomInterval = 25000; // 25 seconds average

  const initAudio = () => {
    if (audioInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(err => console.log('Audio resume failed:', err));
    }
    // Preload SFX files
    for (const [key, path] of Object.entries(SFX_FILES)) {
      if (Array.isArray(path)) {
        // Intercom clips - preload as array
        sfxCache[key] = path.map(p => {
          const audio = new Audio(p);
          audio.preload = 'auto';
          audio.volume = 0.8;
          return audio;
        });
      } else {
        sfxCache[key] = new Audio(path);
        sfxCache[key].preload = 'auto';
        sfxCache[key].volume = 0.8;
      }
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

  let bgmStarted = false; // track whether BGM has ever started successfully

  const startBGM = () => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      // Must resume from a user gesture — return false so caller can retry
      audioCtx.resume();
      if (!bgmStarted) return false;
    }
    if (isBGMPlaying) return true;
    if (isMuted) return false;

    isBGMPlaying = true;
    const track = getCurrentBGMTrack();
    isMedievalBGM = (track === 'medieval');

    // ============================================
    // STAGE 1 BGM - HIGHWAY THEME
    // ============================================
    // PLACEHOLDER FOR NEW STAGE 1 BGM:
    // Drop your new Stage 1 BGM file in: /public/assets/
    // Supported formats: .ogg OR .mp3
    // Recommended filename: stage1_bgm.ogg or stage1_bgm.mp3
    // Then update the STAGE1_BGM_FILE constant below.
    //
    // Current temp BGM: game_music.ogg (highway theme)
    // ============================================
    const STAGE1_BGM_FILE = 'assets/game_music.ogg'; // <-- REPLACE THIS with your new BGM filename
    const STAGE1_BGM_FALLBACK = 'assets/game_music.mp3'; // Optional MP3 fallback

    // Highway BGM
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = isMedievalBGM ? 0 : 0.5;
    bgmGain.connect(audioCtx.destination);

    if (!bgmAudio) {
      // Try primary format (.ogg), fallback to .mp3 if needed
      bgmAudio = new Audio(STAGE1_BGM_FILE);
      bgmAudio.onerror = () => {
        console.warn('Primary Stage 1 BGM failed, trying fallback...');
        bgmAudio.src = STAGE1_BGM_FALLBACK;
        bgmAudio.load();
      };
      bgmAudio.loop = true;
      bgmAudio.volume = 1;
      bgmSource = audioCtx.createMediaElementSource(bgmAudio);
    }
    bgmSource.connect(bgmGain);
    bgmAudio.currentTime = 0;
    const highwayPromise = bgmAudio.play();
    if (highwayPromise) {
      highwayPromise.then(() => { bgmStarted = true; }).catch(e => {
        console.warn('Highway BGM play failed:', e);
        return false;
      });
    }

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
    const medievalPromise = bgmMedievalAudio.play();
    if (medievalPromise) {
      medievalPromise.then(() => { bgmStarted = true; }).catch(e => {
        console.warn('Medieval BGM play failed:', e);
        return false;
      });
    }

    return true;
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
  
  // Stage 3: IKEA-pocalypse BGM and ambient controls
  const startStage3Audio = () => {
    if (!audioCtx) initAudio();
    if (!audioCtx || isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    isStage3BGM = true;
    
    // IKEA polka BGM
    if (!bgmIkeaAudio) {
      bgmIkeaAudio = new Audio('assets/bgm-ikea-polka.ogg');
      bgmIkeaAudio.loop = true;
      bgmIkeaAudio.volume = 1;
    }
    if (!bgmIkeaGain) {
      bgmIkeaGain = audioCtx.createGain();
      bgmIkeaGain.gain.value = 0.5;
      bgmIkeaGain.connect(audioCtx.destination);
      const source = audioCtx.createMediaElementSource(bgmIkeaAudio);
      source.connect(bgmIkeaGain);
    }
    bgmIkeaAudio.currentTime = 0;
    bgmIkeaAudio.play().catch(e => console.warn('IKEA BGM play failed:', e));
    
    // Conveyor ambient hum
    if (!ambientAudio) {
      ambientAudio = new Audio('assets/ambient-conveyor-hum.ogg');
      ambientAudio.loop = true;
      ambientAudio.volume = 1;
    }
    if (!ambientGain) {
      ambientGain = audioCtx.createGain();
      ambientGain.gain.value = 0.3;
      ambientGain.connect(audioCtx.destination);
      const ambientSource = audioCtx.createMediaElementSource(ambientAudio);
      ambientSource.connect(ambientGain);
    }
    ambientAudio.currentTime = 0;
    ambientAudio.play().catch(e => console.warn('Ambient hum play failed:', e));
  };
  
  const stopStage3Audio = () => {
    isStage3BGM = false;
    if (bgmIkeaAudio) {
      bgmIkeaAudio.pause();
      bgmIkeaAudio.currentTime = 0;
    }
    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio.currentTime = 0;
    }
    if (bgmIkeaGain) {
      try { bgmIkeaGain.disconnect(); } catch(e) {}
      bgmIkeaGain = null;
    }
    if (ambientGain) {
      try { ambientGain.disconnect(); } catch(e) {}
      ambientGain = null;
    }
  };
  
  // Intercom randomizer - call this every frame in animate loop
  const updateIntercom = (delta, isStage3) => {
    if (!isStage3 || isMuted || !audioCtx) return;
    intercomTimer += delta * 1000;
    if (intercomTimer >= intercomInterval) {
      intercomTimer = 0;
      intercomInterval = 20000 + Math.random() * 10000; // 20-30 seconds
      const clips = sfxCache.intercom;
      if (clips && clips.length > 0) {
        const clip = clips[Math.floor(Math.random() * clips.length)];
        const clone = clip.cloneNode();
        clone.volume = 0.6;
        clone.play().catch(() => {});
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