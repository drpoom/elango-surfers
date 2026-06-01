import { onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { STAGES } from '../data/stages.js';
import {
  laneWidth,
  jumpStrength,
  slideDuration,
  FLY_LIFT,
  FLY_GRAVITY,
  FLY_MAX_HEIGHT,
  MIC_THRESHOLD,
  MIC_PEAK_THRESHOLD,
  minSwipeDistance,
  TILT_LR_THRESHOLD,
  TILT_LANE_COOLDOWN,
  CALIBRATION_MAX_SAMPLES,
  GRAVITY
} from '../gameConstants.js';
import { createTimerTracker } from '../utils/timerTracker.js';

const timer = createTimerTracker();

export function useGameControls({
  store,
  toggleSettings,
  gameSpawns
}) {
  // Functions accessed via store (wired in App.vue after init):
  // store.playSound, store.triggerGameOver, store.startCountdown,
  // store.createFloatingText, store.initAudio, store.tryStartBGMFromGesture,
  // store.pauseGame, store.resumeGame, store.getSurfaceY, store.getSurfaceTilt,
  // store.getCurveX, store.getCurveSlope, store.getMicVolume {

  const handleJump = () => {
    if (store.isJumping || store.isSliding || store.isFlying) return;
    store.isJumping = true;
    store.jumpVelocity = jumpStrength;
    store.playSound('jump');
  };

  const handleSlide = () => {
    if (store.isJumping || store.isSliding || store.isFlying) return;
    store.isSliding = true;
    store.slideTimer = slideDuration;
    store.playSound('slide');
  };

  const handleSwipe = (direction) => {
    if (store.gameOver || store.countdownLocked) return;
    if (direction === 'left') {
      if (store.currentLane > 0) store.currentLane--;
    } else if (direction === 'right') {
      if (store.currentLane < 2) store.currentLane++;
    } else if (direction === 'up') {
      handleJump();
    } else if (direction === 'down') {
      handleSlide();
    }
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
    e.preventDefault();
    store.touchStartX = e.touches[0].clientX;
    store.touchStartY = e.touches[0].clientY;
    store.initAudio();
    store.tryStartBGMFromGesture();
  };

  const handleTouchEnd = (e) => {
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
    e.preventDefault();
    const touchEndXLocal = e.changedTouches[0].clientX;
    const touchEndYLocal = e.changedTouches[0].clientY;
    
    if (store.gameOver) {
      if (store.showNameEntry) return;
      if (Date.now() - store.gameOverTime < 1000) return;
      store.startCountdown();
      return;
    }
    
    const diffX = touchEndXLocal - store.touchStartX;
    const diffY = touchEndYLocal - store.touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) handleSwipe('right');
        else handleSwipe('left');
      }
    } else {
      if (Math.abs(diffY) > minSwipeDistance) {
        if (diffY < 0) handleSwipe('up');
        else handleSwipe('down');
      }
    }
  };

  const handleDeviceOrientation = (e) => {
    if (!store.tiltEnabled || store.gameOver) return;
    const beta = e.beta;
    const gamma = e.gamma;
    
    if (beta === null || gamma === null) return;
    
    store.lastBeta = beta;
    store.lastGamma = gamma;
    
    if (store.isCalibrating) {
      store.tiltCalibrationSamples.push({ beta, gamma });
      if (store.tiltCalibrationSamples.length > CALIBRATION_MAX_SAMPLES) {
        store.tiltCalibrationSamples.shift();
      }
      return;
    }
    
    if (store.tiltInitialBeta === null) {
      store.tiltInitialBeta = beta;
      store.tiltInitialGamma = gamma;
      return;
    }
    
    const tiltSideways = gamma - store.tiltInitialGamma;
    const now = Date.now();
    if (now - store.lastLaneChangeTime > TILT_LANE_COOLDOWN) {
      if (tiltSideways < -TILT_LR_THRESHOLD) {
        if (store.currentLane > 0) {
          store.currentLane--;
          store.lastLaneChangeTime = now;
        }
      } else if (tiltSideways > TILT_LR_THRESHOLD) {
        if (store.currentLane < 2) {
          store.currentLane++;
          store.lastLaneChangeTime = now;
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.repeat) return;
    if (store.countdownLocked) return;

    // Shift + Shortcuts for Testing
    if (e.shiftKey) {
      const keyUpper = e.key.toUpperCase();
      if (keyUpper === 'G') {
        store.godMode = !store.godMode;
        console.log('GOD MODE:', store.godMode);
        store.createFloatingText(store.godMode ? 'GOD MODE ON' : 'GOD MODE OFF', new THREE.Vector3(0, 3, -10), '#00ffff');
        return;
      }
      if (keyUpper === 'S') {
        const stage = STAGES[store.currentStage];
        const currentStageDuration = stage.stageDuration || 30;
        store.stageTime = currentStageDuration;
        console.log('STAGE SKIPPED, stageTime set to:', store.stageTime);
        store.createFloatingText('STAGE SKIP!', new THREE.Vector3(0, 3, -10), '#ffff00');
        return;
      }
      if (keyUpper === 'B') {
        const stage = STAGES[store.currentStage];
        const currentStageDuration = stage.stageDuration || 30;
        store.stageTime = currentStageDuration;
        store.bossWarning = false;
        console.log('BOSS TRIGGERED IMMEDIATELY');
        store.createFloatingText('BOSS FIGHT!', new THREE.Vector3(0, 3, -10), '#ff0000');
        return;
      }
      if (keyUpper === 'O') {
        if (gameSpawns) {
          gameSpawns.spawnBonusPortal('showroom');
          console.log('BONUS PORTAL SPAWNED');
          store.createFloatingText('PORTAL!', new THREE.Vector3(0, 3, -10), '#ff00ff');
        }
        return;
      }
      if (keyUpper === 'P') {
        if (gameSpawns) {
          // Spawn shield powerup specifically
          const lane = Math.floor(Math.random() * 3);
          const laneX = (lane - 1) * laneWidth;
          const powerupGroup = new THREE.Group();
          const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
          const orbMat = new THREE.MeshToonMaterial({ 
            color: 0x00bfff, 
            emissive: 0x00bfff, 
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
          });
          const orb = new THREE.Mesh(orbGeo, orbMat);
          powerupGroup.add(orb);
          
          const ringGeo = new THREE.TorusGeometry(0.65, 0.06, 8, 24);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          powerupGroup.add(ring);
          
          const coneGeo = new THREE.ConeGeometry(0.25, 0.4, 4);
          const coneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.rotation.x = Math.PI;
          powerupGroup.add(cone);

          const safeZ = gameSpawns.findSafeZ ? gameSpawns.findSafeZ(lane, -50, 6) : -50;
          powerupGroup.position.set(laneX, 1 + store.getSurfaceY(safeZ), safeZ);
          powerupGroup.userData = { type: 'shield' };
          powerupGroup.baseY = 1;
          store.scene.add(powerupGroup);
          store.powerups.push({ mesh: powerupGroup, lane, type: 'shield', collected: false });
          console.log('SHIELD POWERUP SPAWNED');
          store.createFloatingText('SHIELD SPAWNED!', new THREE.Vector3(0, 3, -10), '#00bfff');
        }
        return;
      }
    }
    
    // Debug mode cheats
    if (store.debugMode) {
      if (e.key === 'g' || e.key === 'G') {
        store.godMode = !store.godMode;
        return;
      }
      if (e.key === 'o' || e.key === 'O') {
        store.score += 1000;
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        store.triggerGameOver();
        return;
      }
    }
    
    // Easter eggs/Debug cheats activation
    if (!store.debugMode) {
      store.debugKeyBuffer += e.key.toLowerCase();
      if (store.debugKeyTimer) clearTimeout(store.debugKeyTimer);
      store.debugKeyTimer = timer.setTimeout(() => { store.debugKeyBuffer = ''; }, 2000);
      if (store.debugKeyBuffer.endsWith('debug')) {
        store.debugMode = true;
        console.log('🐛 DEBUG CHEATS ENABLED! Press G (God), O (Score+1000), K (Die)');
      }
    }

    if (store.gameOver) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (store.showNameEntry) return;
        if (Date.now() - store.gameOverTime < 1000) return;
        store.startCountdown();
      }
      return;
    }
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      if (store.currentLane > 0) store.currentLane--;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (store.currentLane < 2) store.currentLane++;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      handleJump();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      handleSlide();
    }
  };

  const updatePhysics = (delta, gameSpeed) => {
    const player = store.player;
    if (!player) return;

    // Voice fly controls (blow to fly)
    if (store.micEnabledRef && !store.gameOver) {
      const vol = store.getMicVolume();
      store.lastMicVolume = vol;
      if (vol > MIC_THRESHOLD) {
        if (!store.isFlying) {
          store.isFlying = true;
          store.isJumping = false;
          store.isSliding = false;
          store.flyVelocity = 0;
        }
        const liftFactor = Math.min((vol - MIC_THRESHOLD) / (MIC_PEAK_THRESHOLD - MIC_THRESHOLD), 1.5);
        store.flyVelocity += FLY_LIFT * liftFactor;
      }
    }

    const surfaceY = store.getSurfaceY(player.position.z);

    // Find animated limbs
    const leftArm = player.getObjectByName('left-arm');
    const rightArm = player.getObjectByName('right-arm');
    const leftLeg = player.getObjectByName('left-leg');
    const rightLeg = player.getObjectByName('right-leg');
    const headGroup = player.getObjectByName('head-group');

    if (store.isFlying) {
      store.flyVelocity += FLY_GRAVITY;
      player.position.y += store.flyVelocity;
      
      if (player.position.y <= 0.5 + surfaceY) {
        player.position.y = 0.5 + surfaceY;
        store.isFlying = false;
        store.flyVelocity = 0;
      } else if (player.position.y > FLY_MAX_HEIGHT + surfaceY) {
        player.position.y = FLY_MAX_HEIGHT + surfaceY;
        store.flyVelocity = 0;
      }

      // Fly pose - arms spread out like wings
      if (leftArm) { leftArm.rotation.z = -1.5; leftArm.rotation.x = 0; }
      if (rightArm) { rightArm.rotation.z = 1.5; rightArm.rotation.x = 0; }
      if (leftLeg) { leftLeg.rotation.x = 0.3; leftLeg.rotation.z = 0; }
      if (rightLeg) { rightLeg.rotation.x = 0.3; rightLeg.rotation.z = 0; }
      player.scale.y = 1.0;
    } else if (store.isJumping) {
      player.position.y += store.jumpVelocity;
      store.jumpVelocity -= GRAVITY;
      if (player.position.y <= 0.5 + surfaceY) {
        player.position.y = 0.5 + surfaceY;
        store.isJumping = false;
        store.jumpVelocity = 0;
      }

      // Jump pose
      if (leftArm) { leftArm.rotation.x = -1.2; leftArm.rotation.z = 0; }
      if (rightArm) { rightArm.rotation.x = -1.2; rightArm.rotation.z = 0; }
      if (leftLeg) { leftLeg.rotation.x = 0.5; leftLeg.rotation.z = 0; }
      if (rightLeg) { rightLeg.rotation.x = 0.5; rightLeg.rotation.z = 0; }
      player.scale.y = 1.0;
    } else if (store.isSliding) {
      store.slideTimer -= delta;
      
      // Slide pose
      if (leftArm) { leftArm.rotation.x = 0.8; leftArm.rotation.z = 0; }
      if (rightArm) { rightArm.rotation.x = 0.8; rightArm.rotation.z = 0; }
      if (leftLeg) { leftLeg.rotation.x = -1.0; leftLeg.rotation.z = 0; }
      if (rightLeg) { rightLeg.rotation.x = -1.0; rightLeg.rotation.z = 0; }
      
      player.scale.y = 0.5;
      player.position.y = 0.3 + surfaceY;
      
      if (store.slideTimer <= 0) {
        store.isSliding = false;
        player.scale.y = 1.0;
        player.position.y = 0.5 + surfaceY;
      }
    } else {
      // Running swing animation
      const runSpeed = 8 + gameSpeed * 10;
      const time = store.clock ? store.clock.getElapsedTime() : Date.now() * 0.001;
      const swing = Math.sin(time * runSpeed) * 0.6;
      
      if (leftArm) { leftArm.rotation.x = swing; leftArm.rotation.z = 0; }
      if (rightArm) { rightArm.rotation.x = -swing; rightArm.rotation.z = 0; }
      if (leftLeg) { leftLeg.rotation.x = -swing * 0.8; leftLeg.rotation.z = 0; }
      if (rightLeg) { rightLeg.rotation.x = swing * 0.8; rightLeg.rotation.z = 0; }
      
      player.position.y = 0.5 + surfaceY + Math.abs(Math.sin(time * runSpeed)) * 0.05;
      player.scale.y = 1.0;
    }

    if (store.isSlippery) {
      store.slipperyTimer -= delta;
      if (store.slipperyTimer <= 0) {
        store.isSlippery = false;
      }
    }
    
    const playerLaneOffset = store.getCurveX(player.position.z);
    const targetLaneX = (store.currentLane - 1) * laneWidth + playerLaneOffset;
    const laneShiftSpeed = store.isSlippery ? 0.05 : 0.25;
    player.position.x += (targetLaneX - player.position.x) * laneShiftSpeed;
    
    const moveDir = targetLaneX - player.position.x;
    
    // Rotate player's Y-axis to face the road curve direction + body turn
    const bodyTurn = THREE.MathUtils.clamp(moveDir * 0.15, -0.3, 0.3);
    const curveSlope = store.getCurveSlope(player.position.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, Math.PI + bodyTurn + curveSlope, 0.08);
    player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, moveDir * -0.08, 0.1);
    player.rotation.x = store.getSurfaceTilt(player.position.z);

    // Head faces movement direction slightly
    if (headGroup) {
      const targetHeadRotY = THREE.MathUtils.clamp(moveDir * -0.5, -0.6, 0.6);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadRotY, 0.1);
    }
  };

  let iosTiltPermissionRequested = false;
  const requestTiltPermission = async () => {
    if (iosTiltPermissionRequested) return;
    iosTiltPermissionRequested = true;
    try {
      const state = await DeviceOrientationEvent.requestPermission();
      if (state === 'granted') {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        store.tiltEnabled = true;
        store.tiltEnabledRef = true;
      } else {
        store.tiltEnabled = false;
        store.tiltEnabledRef = false;
      }
    } catch (err) {
      console.log('iOS tilt permission error:', err);
      store.tiltEnabled = false;
      store.tiltEnabledRef = false;
    }
  };

  const toggleTilt = async () => {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if (!store.tiltEnabled) {
        iosTiltPermissionRequested = false;
        await requestTiltPermission();
      } else {
        store.tiltEnabled = false;
        store.tiltEnabledRef = false;
        store.tiltInitialBeta = null;
      }
    } else {
      store.tiltEnabled = !store.tiltEnabled;
      store.tiltEnabledRef = store.tiltEnabled;
      store.tiltInitialBeta = null;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    const preventScroll = (e) => {
        if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel')) return;
      if (store.touchStartX !== null && Math.abs(e.touches[0].clientX - store.touchStartX) > 10) {
        e.preventDefault();
      }
    };
    window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
    
    const handleClick = (e) => {
      if (e.target.closest('#settings-panel') || e.target.closest('#settings-btn') || e.target.closest('#mute-btn') || e.target.closest('#tilt-btn') || e.target.closest('#mic-btn') || e.target.closest('#name-entry')) {
        return;
      }
        if (store.isPaused) {
        store.resumeGame();
        return;
      }
      if (store.gameOver && !store.showNameEntry && Date.now() - store.gameOverTime >= 1000) {
        store.startCountdown();
      }
      store.initAudio();
      store.tryStartBGMFromGesture();
    };
    window.addEventListener('click', handleClick);
    
    const handleKeydownBgm = (e) => {
        if (store.isPaused && e.key !== 'Escape') {
        store.resumeGame();
      }
      store.initAudio();
      store.tryStartBGMFromGesture();
    };
    window.addEventListener('keydown', handleKeydownBgm);
    
    const handleTouchstartBgm = () => {
        if (store.isPaused) {
        store.resumeGame();
      }
      store.initAudio();
      store.tryStartBGMFromGesture();
    };
    window.addEventListener('touchstart', handleTouchstartBgm, { passive: true });
    
    const handleResize = () => {
        if (store.camera && store.renderer) {
        store.camera.aspect = window.innerWidth / window.innerHeight;
        store.camera.updateProjectionMatrix();
        store.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    const handleKeydownSettings = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        toggleSettings();
      }
    };
    window.addEventListener('keydown', handleKeydownSettings);
    
    let handleIOSOrientationTrigger = null;
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        handleIOSOrientationTrigger = () => {
          requestTiltPermission();
        };
        window.addEventListener('touchstart', handleIOSOrientationTrigger, { passive: true });
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    } else {
        store.tiltEnabled = false;
      store.tiltEnabledRef = false;
    }
    
    window._gameControlsCleanup = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeydownBgm);
      window.removeEventListener('touchstart', handleTouchstartBgm);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeydownSettings);
      if (handleIOSOrientationTrigger) {
        window.removeEventListener('touchstart', handleIOSOrientationTrigger);
      }
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  });
  
  onUnmounted(() => {
    if (window._gameControlsCleanup) {
      window._gameControlsCleanup();
      window._gameControlsCleanup = null;
    }
  });

  const startTiltCalibration = () => {
    store.tiltCalibrationSamples = [];
    store.isCalibrating = true;
    store.tiltInitialBeta = null;
    store.tiltInitialGamma = null;
  };

  const finishTiltCalibration = () => {
    if (store.tiltCalibrationSamples.length === 0) {
      store.tiltInitialBeta = store.tiltInitialBeta ?? 45;
      store.tiltInitialGamma = store.tiltInitialGamma ?? 0;
    } else {
      const avgBeta = store.tiltCalibrationSamples.reduce((s, v) => s + v.beta, 0) / store.tiltCalibrationSamples.length;
      const avgGamma = store.tiltCalibrationSamples.reduce((s, v) => s + v.gamma, 0) / store.tiltCalibrationSamples.length;
      store.tiltInitialBeta = avgBeta;
      store.tiltInitialGamma = avgGamma;
    }
    store.isCalibrating = false;
    store.tiltCalibrationSamples = [];
  };

  return {
    handleJump,
    handleSlide,
    handleSwipe,
    handleTouchStart,
    handleTouchEnd,
    handleDeviceOrientation,
    handleKeyDown,
    updatePhysics,
    toggleTilt,
    startTiltCalibration,
    finishTiltCalibration
  };
}
