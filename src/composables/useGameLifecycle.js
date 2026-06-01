import * as THREE from 'three';
import { CAMERA_POS_Y, CAMERA_POS_Z, FOG_NEAR, FOG_FAR, BOSS_BASE_HEALTH, BOSS_DEFEAT_DELAY, BOSS_HIT_DAMAGE, INVINCIBILITY_GRACE, COUNTDOWN_SECONDS, COUNTDOWN_TICK_MS, STAGE_COUNTDOWN_GO_DELAY, INITIAL_SPAWN_INTERVAL, SPAWN_GRACE_PERIOD, GAME_OVER_SHAKE_INTERVAL, GAME_OVER_SHAKE_DURATION } from '../gameConstants.js';
import { STAGES } from '../data/stages.js';
import { VERSION_MAJOR_MINOR } from '../version.js';
import { createTimerTracker } from '../utils/timerTracker.js';

/**
 * Game lifecycle composable — handles game over, reset, countdown, powerups, bonus zones.
 * 
 * @param {Object} deps
 * @param {Object} deps.store - Shared reactive game store
 * @param {Object} deps.gameScene - Game scene composable
 * @param {Object} deps.gameSpawns - Game spawns composable
 * @param {Object} deps.gameBoss - Game boss composable
 * @param {Ref} deps.debugStartStage - Debug start stage ref
 * @param {Ref} deps.achievements - Achievements ref
 * @param {Function} deps.loadProgress - Load game progress
 * @param {Function} deps.saveProgress - Save game progress
 * @param {Function} deps.checkAchievements - Check achievements
 */
export function useGameLifecycle({
  store,
  gameScene,
  gameSpawns,
  gameBoss,
  debugStartStage,
  achievements,
  loadProgress,
  saveProgress,
  checkAchievements
}) {
  // Functions accessed via store (wired in App.vue after init):
  // store.playSound, store.playSFX, store.startBGM, store.stopBGM,
  // store.switchBGMTrack, store.initAudio, store.tryStartBGMFromGesture,
  // store.createFloatingText, store.createParticleEffect, store.getSurfaceY,
  // store.isHighScore, store.startTiltCalibration, store.finishTiltCalibration,
  // store.startCalibration, store.clearAllTimers

  // Local timer tracker for this composable's setTimeout/setInterval calls
  const timer = createTimerTracker();

  const saveHighScore = () => {
    if (store.score > store.highScore) {
      store.highScore = store.score;
      localStorage.setItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`, store.highScore.toString());
    }
  };

  const activatePowerup = (type) => {
    if (store.activePowerup) {
      deactivatePowerup();
    }
    store.activePowerup = type;
    const now = Date.now();
    
    if (type === 'shield') {
      store.powerupEndTime = now + 10000;
      store.powerupIcon = '🛡️';
      store.powerupName = 'Shield';
      store.isInvincible = true;
      
      const oldShield = store.player.getObjectByName('shield-aura');
      if (oldShield) store.player.remove(oldShield);
      const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const shieldMat = new THREE.MeshToonMaterial({ 
        color: 0x00bfff, 
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.name = 'shield-aura';
      store.player.add(shieldMesh);
      
    } else if (type === 'coldDrink') {
      store.powerupEndTime = now + 5000;
      store.powerupIcon = '🥤';
      store.powerupName = 'Cold Drink';
      store.speedMultiplier = 0.6;
      
    } else if (type === 'magnet') {
      store.powerupEndTime = now + 15000;
      store.powerupIcon = '🧲';
      store.powerupName = 'Magnet';
      store.magnetRange = 5;
    }
  };

  const deactivatePowerup = () => {
    if (store.activePowerup === 'shield') {
      store.isInvincible = false;
      const shield = store.player.getObjectByName('shield-aura');
      if (shield) store.player.remove(shield);
    } else if (store.activePowerup === 'coldDrink') {
      store.speedMultiplier = 1.0;
    } else if (store.activePowerup === 'magnet') {
      store.magnetRange = 0;
    }
    
    store.activePowerup = null;
    store.powerupTimeLeft = 0;
  };

  const triggerGameOver = (shakeIntensity = 0.5) => {
    if (store.gameOver) return;
    store.gameOver = true;
    store.gameOverTime = Date.now();
    
    if (store.bonusPortal) { store.scene.remove(store.bonusPortal.mesh); store.bonusPortal = null; }
    store.inBonusZone = false;
    store.inBonusZoneRef = false;
    store.bonusTimer = 0;
    store.bonusTimerRef = 0;
    store.inShowroom = false;
    store.inShowroomRef = false;
    store.showroomTimer = 0;
    store.showroomTimerRef = 0;
    store.isShowroomPortal = false;
    store.bonusNoSpawn = false;
    store.bonusCoins.forEach(bc => store.scene.remove(bc.mesh));
    store.bonusCoins = [];
    store.scene.userData.bonusEnvActive = false;
    if (store.scene.userData.nyanCat) {
      store.scene.remove(store.scene.userData.nyanCat);
      store.scene.userData.nyanCat = null;
      store.scene.userData.nyanCatTime = 0;
    }
    
    const roadGO = store.scene.getObjectByName('road');
    if (roadGO && store.originalRoadMaterial) {
      roadGO.material.dispose();
      roadGO.material = store.originalRoadMaterial;
      store.originalRoadMaterial = null;
    }
    
    if (store.savedSubstageState) {
      store.savedSubstageState.obstacles.forEach(obs => store.scene.remove(obs.mesh));
      store.savedSubstageState.coins.forEach(coin => store.scene.remove(coin.mesh));
      store.savedSubstageState = null;
    }
    
    store.buildings.forEach(b => { b.visible = true; });
    store.trees.forEach(t => { t.visible = true; });
    
    store.obstacles.forEach(obs => {
      obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      store.scene.remove(obs.mesh);
    });
    store.obstacles.length = 0;
    store.coins.forEach(coin => store.scene.remove(coin.mesh));
    store.coins.length = 0;
    store.powerups.forEach(pw => store.scene.remove(pw.mesh));
    store.powerups.length = 0;
    store.bossProjectiles.forEach(fb => store.scene.remove(fb));
    store.bossProjectiles.length = 0;
    
    store.bossVulnerableOrbs.forEach(orb => store.scene.remove(orb.mesh));
    store.bossVulnerableOrbs.length = 0;
    store.particles.forEach(p => store.scene.remove(p));
    store.particles.length = 0;
    store.floatingTexts.forEach(t => store.scene.remove(t));
    store.floatingTexts.length = 0;
    if (store.boss) { store.scene.remove(store.boss); store.boss = null; }
    
    if (store.bossDefeatTimeout1) { clearTimeout(store.bossDefeatTimeout1); store.bossDefeatTimeout1 = null; }
    store.bossDefeated = false;
    store.bossCharging = false;
    store.bossState = 'idle';
    store.bossStateTimer = 0;

    saveHighScore();
    const gameStats = store.gameStats || { maxScore: 0, maxTime: 0, bestRun: 0 };
    if (store.score > gameStats.maxScore) gameStats.maxScore = store.score;
    if (store.gameDuration > gameStats.maxTime) gameStats.maxTime = store.gameDuration;
    if (store.score > gameStats.bestRun) gameStats.bestRun = store.score;
    saveProgress();
    
    store.playSound('crash');
    store.createParticleEffect(store.player.position, 0xff0000, 30);
    store.comboCount = 0;

    const originalPos = store.camera.position.clone();
    let shakeTime = 0;
    const shakeId = timer.setInterval(() => {
      shakeTime += 0.05;
      if (shakeTime > GAME_OVER_SHAKE_DURATION) {
        store.camera.position.copy(originalPos);
        timer.clearInterval(shakeId);
        return;
      }
      store.camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
      store.camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
    }, GAME_OVER_SHAKE_INTERVAL);
    
    store.showNameEntry = store.isHighScore.value;
  };

  const resetStage = (preserveScore = false, targetStage = -1) => {
    store.clearAllTimers();
    store.clock.stop();

    if (!preserveScore) store.score = 0;
    store.gameOver = false;
    store.showNameEntry = false;
    store.playerName = '';
    store.currentLane = 1;
    store.isJumping = false;
    store.jumpVelocity = 0;
    store.isSliding = false;
    store.slideTimer = 0;
    store.isFlying = false;
    store.flyVelocity = 0;

    store.gameSpeed = 0.25;
    store.spawnInterval = INITIAL_SPAWN_INTERVAL;
    store.gameDuration = SPAWN_GRACE_PERIOD;
    store.countdownLocked = false;
    store.countdownActive = false;

    store.clock.start();
    store.lastSpawnTime = 0;
    store.stageTransitioning = false;
    gameScene.createStars(); // custom cleanup
    
    store.currentStage = targetStage >= 0 ? targetStage : (debugStartStage.value >= 0 ? debugStartStage.value : 0);
    store.stageTime = targetStage >= 0 ? 0 : (debugStartStage.value >= 0 ? Math.max(0, STAGES[debugStartStage.value].stageDuration - 20) : 0);
    gameScene.applyStageVisuals(store.currentStage);

    store.roadCurve = 0;
    store.roadCurveTarget = 0;
    store.curveChangeTimer = 0;
    store.nextCurveChange = 3;
    store.curveFrontZ = 0;

    store.bossWarning = false;
    store.bossActive = false;
    store.bossDefeated = false;
    store.bossHealth = BOSS_BASE_HEALTH;
    store.bossCharging = false;
    store.bossChargeTimer = 0;
    store.bossChargeTarget = 0;
    store.bossAttackTimer = 0;
    store.bossNextAttack = 3;
    store.bossState = 'idle';
    store.bossStateTimer = 0;
    store.bossVulnerableOrbs = [];
    
    if (store.boss) { store.scene.remove(store.boss); store.boss = null; }

    store.comboCount = 0;
    store.lastCoinTime = 0;
    store.scoreMultiplier = 1;
    store.magnetRange = 0;
    store.isInvincible = false;
    store.activePowerup = null;
    store.powerupEndTime = 0;
    store.powerupIcon = '';
    store.powerupName = '';
    store.powerupTimeLeft = 0;
    
    const shieldAura = store.player.getObjectByName('shield-aura');
    if (shieldAura) store.player.remove(shieldAura);

    store.cameraShakeTimer = 0;
    store.cameraShakeIntensity = 0;
    store.camera.position.set(0, CAMERA_POS_Y, CAMERA_POS_Z);

    store.dayCycleTime = 0;
    store.nearMissTimer = 0;
    store.nearMissCount = 0;
    store.nearMissTextRef = '';
    store.nearMissCountRef = 0;

    store.eventTimer = 0;
    store.activeEvent = null;
    store.eventDuration = 0;
    store.fogDensity = 0;
    store.scene.fog.near = FOG_NEAR;
    store.scene.fog.far = FOG_FAR;
    store.edgeGlowIntensity = 0;
    
    const vignetteEl = document.getElementById('vignette-glow');
    if (vignetteEl) vignetteEl.style.opacity = '0';

    store.bonusPortal = null;
    store.bonusPortalSpawned = false;
    store.inBonusZone = false;
    store.bonusTimer = 0;
    store.inBonusZoneRef = false;
    store.bonusTimerRef = 0;
    store.bonusNoSpawn = false;
    store.bonusCoins.forEach(bc => store.scene.remove(bc.mesh));
    store.bonusCoins = [];
    
    if (store.originalRoadMaterial) {
      const roadCheck = store.scene.getObjectByName('road');
      if (roadCheck) {
        if (roadCheck.material !== store.originalRoadMaterial && roadCheck.material) {
          roadCheck.material.dispose();
        }
        roadCheck.material = store.originalRoadMaterial;
        if (store.originalGroundTexture) {
          roadCheck.material.map = store.originalGroundTexture;
          roadCheck.material.color.set(store.originalGroundColor);
          roadCheck.material.needsUpdate = true;
        }
        store.originalRoadMaterial = null;
      }
    }
    
    if (store.savedSubstageState) {
      store.savedSubstageState.obstacles.forEach(obs => store.scene.remove(obs.mesh));
      store.savedSubstageState.coins.forEach(coin => store.scene.remove(coin.mesh));
      store.savedSubstageState = null;
    }

    store.obstacles.forEach(obs => {
      obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      store.scene.remove(obs.mesh);
    });
    store.obstacles.length = 0;
    
    store.coins.forEach(coin => store.scene.remove(coin.mesh));
    store.coins.length = 0;
    
    store.powerups.forEach(pw => store.scene.remove(pw.mesh));
    store.powerups.length = 0;
    
    store.bossProjectiles.forEach(fb => store.scene.remove(fb));
    store.bossProjectiles.length = 0;
    
    store.particles.forEach(p => store.scene.remove(p));
    store.particles.length = 0;
    
    store.floatingTexts.forEach(t => store.scene.remove(t));
    store.floatingTexts.length = 0;
    achievements.value = [];

    store.player.position.set(0, 0.5, 0);
    store.player.scale.y = 1.0;
    
    const starsObj = store.scene.getObjectByName('stars');
    if (starsObj) store.scene.remove(starsObj);
    store.scene.userData.starsCreated = false;

    store.buildings.forEach(b => {
      b.visible = true;
      if (b.userData.initZ !== undefined) {
        b.position.z = b.userData.initZ;
        b.position.x = b.userData.initX;
        b.position.y = b.baseY + store.getSurfaceY(b.userData.initZ);
        b.baseX = b.userData.initBaseX;
      }
    });
    
    store.trees.forEach(t => {
      t.visible = true;
      if (t.userData.initZ !== undefined) {
        t.position.z = t.userData.initZ;
        t.position.x = t.userData.initX;
        t.position.y = t.baseY + store.getSurfaceY(t.userData.initZ);
        t.baseX = t.userData.initBaseX;
      }
    });
    
    store.eventAlertTextRef = '';
  };

  const startCountdown = () => {
    console.log('[COUNTDOWN] Starting countdown...');
    resetStage(false);
    store.countdownLocked = true;
    store.countdownActive = true;
    
    const isMobileLocal = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileLocal && store.tiltEnabled) {
      store.startTiltCalibration();
    }
    
    let count = COUNTDOWN_SECONDS;
    store.countdownText = count.toString();
    store._countdownNextTick = Date.now() + COUNTDOWN_TICK_MS;
    store._countdownCount = count;
    store._countdownType = 'start';
  };

  const startStageCountdown = () => {
    store.countdownLocked = true;
    store.countdownActive = true;
    if (store.micEnabledRef) {
      store.startCalibration();
    }
    let count = COUNTDOWN_SECONDS;
    store.countdownText = count.toString();
    store._countdownNextTick = Date.now() + COUNTDOWN_TICK_MS;
    store._countdownCount = count;
    store._countdownType = 'stage';
  };

  const pauseGame = () => {
    if (store.isPaused || store.gameOver || store.countdownActive || store.countdownLocked || store.stageTransitioning) return;
    store.isPaused = true;
    store.pauseStartTime = store.clock.getElapsedTime();
    store.createFloatingText('⏸️ PAUSED', store.player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffffff');
  };

  const resumeGame = () => {
    if (!store.isPaused) return;
    if (store.countdownActive || store.countdownLocked || store.stageTransitioning) {
      store.isPaused = false;
      return;
    }
    store.isPaused = false;
    const pauseDuration = store.clock.getElapsedTime() - store.pauseStartTime;
    store.clock.elapsedTime -= pauseDuration;
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      pauseGame();
    }
  };

  const enterBonusZone = () => {
    if (store.inBonusZone) return;
    
    store.inBonusZone = true;
    store.inBonusZoneRef = true;
    store.bonusTimer = 10;
    store.bonusTimerRef = 10;
    
    // Save original road material if not already saved
    if (store.roadMesh && store.roadMesh.material) {
      if (!store.originalRoadMaterial) {
        store.originalRoadMaterial = store.roadMesh.material;
      }
      // Create a beautiful neon pink basic material
      const bonusMat = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.95
      });
      store.roadMesh.material = bonusMat;
      store.roadMesh.material.needsUpdate = true;
    }
    
    store.playSound('powerup');
    store.createFloatingText('🦄 RAINBOW ZONE!', store.player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff00ff');

    // Spawn bonus coins at ground level
    store.bonusCoins = [];
    const laneWidthVal = 3;
    for (let i = 0; i < 40; i++) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const z = -i * 2.5 - 5;
      const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
      const coinMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.3 });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(lane * laneWidthVal, 0.5, z);
      coinMesh.rotation.x = Math.PI / 2;
      store.scene.add(coinMesh);
      store.bonusCoins.push({ mesh: coinMesh, collected: false, baseX: lane * laneWidthVal });
    }
    store.scene.userData.bonusEnvActive = true;
    
    // Spawn Nyan Cat sprite at 60% Y-scale of original (5.5) -> 3.3
    const textureLoader = new THREE.TextureLoader();
    const nyanTex = textureLoader.load('assets/nyan_cat.png');
    const nyanSpriteMat = new THREE.SpriteMaterial({
      map: nyanTex,
      transparent: true,
      depthWrite: false
    });
    const nyanCat = new THREE.Sprite(nyanSpriteMat);
    nyanCat.scale.set(5, 3.3, 1);
    nyanCat.position.set(-30, 10, -20);
    store.scene.add(nyanCat);
    store.scene.userData.nyanCat = nyanCat;
    store.scene.userData.nyanCatTime = 0;
  };

  const exitBonusZone = () => {
    if (!store.inBonusZone) return;
    
    store.inBonusZone = false;
    store.inBonusZoneRef = false;
    store.bonusTimer = 0;
    store.bonusTimerRef = 0;
    
    // Restore original road material
    if (store.roadMesh && store.roadMesh.material && store.originalRoadMaterial) {
      store.roadMesh.material = store.originalRoadMaterial;
      store.roadMesh.material.needsUpdate = true;
    }
    
    store.playSound('powerup_fade');
    store.createFloatingText('EXITING BONUS!', store.player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffff00');

    // Clean up bonus coins
    if (store.bonusCoins) {
      store.bonusCoins.forEach(bc => store.scene.remove(bc.mesh));
      store.bonusCoins = [];
    }
    store.scene.userData.bonusEnvActive = false;

    // Clean up Nyan Cat
    if (store.scene.userData.nyanCat) {
      store.scene.remove(store.scene.userData.nyanCat);
      store.scene.userData.nyanCat = null;
      store.scene.userData.nyanCatTime = 0;
    }
  };

  /**
   * Tick the countdown timer — called from the animate loop (requestAnimationFrame).
   * Replaces setTimeout-based countdown which gets throttled in headless browsers.
   */
  const tickCountdown = () => {
    if (!store.countdownActive || !store.countdownLocked) return;

    const now = Date.now();

    // Handle "GO!" delay for stage countdown (must check even when _countdownNextTick is null)
    if (store._countdownType === 'stage' && store._countdownGoTime) {
      if (now - store._countdownGoTime >= STAGE_COUNTDOWN_GO_DELAY) {
        store.countdownActive = false;
        store.countdownLocked = false;
        store.stageTransitioning = false;
        store.gameDuration = SPAWN_GRACE_PERIOD;
        store.lastSpawnTime = store.clock.getElapsedTime() - store.spawnInterval;
        store.bossWarning = false;
        store.bonusPortalSpawned = false;
        store._countdownGoTime = null;
        store._countdownType = null;

        const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const graceMesh = new THREE.Mesh(graceGeo, graceMat);
        graceMesh.name = 'shield-aura';
        store.player.add(graceMesh);

        timer.setTimeout(() => {
          store.isInvincible = false;
          const shieldObj = store.player.getObjectByName('shield-aura');
          if (shieldObj) store.player.remove(shieldObj);
        }, INVINCIBILITY_GRACE);
      }
      // Still waiting for GO delay to expire — return and check again next frame
      return;
    }

    // Countdown tick logic
    if (!store._countdownNextTick) return;
    if (now < store._countdownNextTick) return;

    const count = (store._countdownCount || 0) - 1;

    if (count > 0) {
      store._countdownCount = count;
      store.countdownText = count.toString();
      store._countdownNextTick = now + COUNTDOWN_TICK_MS;
    } else if (count === 0) {
      store.countdownText = 'GO!';
      store._countdownNextTick = null;
      store._countdownCount = 0;

      if (store._countdownType === 'stage') {
        // Stage countdown completion — play sound, set GO time for delay
        store.playSound('start');
        store.isInvincible = true;
        store.gameStartTime = Date.now();
        store._countdownGoTime = now;
      } else {
        // Start countdown completion — immediately unlock
        store.countdownActive = false;
        store.countdownLocked = false;
        store.stageTransitioning = false;
        store.gameDuration = SPAWN_GRACE_PERIOD;
        store.lastSpawnTime = store.clock.getElapsedTime() - store.spawnInterval;
        store.isInvincible = true;
        store.gameStartTime = Date.now();

        const oldGrace = store.player.getObjectByName('shield-aura');
        if (!oldGrace) {
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          store.player.add(graceMesh);
        }

        timer.setTimeout(() => {
          store.isInvincible = false;
          const shieldObj = store.player.getObjectByName('shield-aura');
          if (shieldObj) store.player.remove(shieldObj);
        }, INVINCIBILITY_GRACE);

        try {
          store.startBGM();
        } catch (err) {
          console.error('[COUNTDOWN] startBGM() error:', err);
        }

        const isMobileLocal = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobileLocal && store.isCalibrating) {
          store.finishTiltCalibration();
        }
      }
    }
  };

  return {
    saveHighScore,
    activatePowerup,
    deactivatePowerup,
    triggerGameOver,
    resetStage,
    startCountdown,
    startStageCountdown,
    tickCountdown,
    pauseGame,
    resumeGame,
    handleVisibilityChange,
    enterBonusZone,
    exitBonusZone
  };
}
