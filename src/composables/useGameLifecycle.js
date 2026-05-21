import * as THREE from 'three';

export function useGameLifecycle({
  getCtx,
  playSound,
  playSFX,
  startBGM,
  stopBGM,
  switchBGMTrack,
  initAudio,
  tryStartBGMFromGesture,
  gameScene,
  gameSpawns,
  gameBoss,
  STAGES,
  BOSS_BASE_HEALTH,
  VERSION_MAJOR_MINOR,
  loadProgress,
  saveProgress,
  checkAchievements,
  achievements,
  isHighScore,
  getSurfaceY,
  startTiltCalibration,
  finishTiltCalibration,
  startCalibration,
  clearAllTimers,
  debugStartStage,
  createFloatingText,
  createParticleEffect
}) {
  const saveHighScore = () => {
    const ctx = getCtx();
    if (ctx.score > ctx.highScore) {
      ctx.highScore = ctx.score;
      localStorage.setItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`, ctx.highScore.toString());
    }
  };

  const activatePowerup = (type) => {
    const ctx = getCtx();
    if (ctx.activePowerup) {
      deactivatePowerup();
    }
    ctx.activePowerup = type;
    const now = Date.now();
    
    if (type === 'shield') {
      ctx.powerupEndTime = now + 10000;
      ctx.powerupIcon = '🛡️';
      ctx.powerupName = 'Shield';
      ctx.isInvincible = true;
      
      const oldShield = ctx.player.getObjectByName('shield-aura');
      if (oldShield) ctx.player.remove(oldShield);
      const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const shieldMat = new THREE.MeshToonMaterial({ 
        color: 0x00bfff, 
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.name = 'shield-aura';
      ctx.player.add(shieldMesh);
      
    } else if (type === 'coldDrink') {
      ctx.powerupEndTime = now + 5000;
      ctx.powerupIcon = '🥤';
      ctx.powerupName = 'Cold Drink';
      ctx.speedMultiplier = 0.6;
      
    } else if (type === 'magnet') {
      ctx.powerupEndTime = now + 15000;
      ctx.powerupIcon = '🧲';
      ctx.powerupName = 'Magnet';
      ctx.magnetRange = 5;
    }
  };

  const deactivatePowerup = () => {
    const ctx = getCtx();
    if (ctx.activePowerup === 'shield') {
      ctx.isInvincible = false;
      const shield = ctx.player.getObjectByName('shield-aura');
      if (shield) ctx.player.remove(shield);
    } else if (ctx.activePowerup === 'coldDrink') {
      ctx.speedMultiplier = 1.0;
    } else if (ctx.activePowerup === 'magnet') {
      ctx.magnetRange = 0;
    }
    
    ctx.activePowerup = null;
    ctx.powerupTimeLeft = 0;
  };

  const triggerGameOver = (shakeIntensity = 0.5) => {
    const ctx = getCtx();
    if (ctx.gameOver) return;
    ctx.gameOver = true;
    ctx.gameOverTime = Date.now();
    
    if (ctx.bonusPortal) { ctx.scene.remove(ctx.bonusPortal.mesh); ctx.bonusPortal = null; }
    ctx.inBonusZone = false;
    ctx.inBonusZoneRef = false;
    ctx.bonusTimer = 0;
    ctx.bonusTimerRef = 0;
    ctx.inShowroom = false;
    ctx.inShowroomRef = false;
    ctx.showroomTimer = 0;
    ctx.showroomTimerRef = 0;
    ctx.isShowroomPortal = false;
    ctx.bonusNoSpawn = false;
    ctx.bonusCoins.forEach(bc => ctx.scene.remove(bc.mesh));
    ctx.bonusCoins = [];
    ctx.scene.userData.bonusEnvActive = false;
    if (ctx.scene.userData.nyanCat) {
      ctx.scene.remove(ctx.scene.userData.nyanCat);
      ctx.scene.userData.nyanCat = null;
      ctx.scene.userData.nyanCatTime = 0;
    }
    
    const roadGO = ctx.scene.getObjectByName('road');
    if (roadGO && ctx.originalRoadMaterial) {
      roadGO.material.dispose();
      roadGO.material = ctx.originalRoadMaterial;
      ctx.originalRoadMaterial = null;
    }
    
    if (ctx.savedSubstageState) {
      ctx.savedSubstageState.obstacles.forEach(obs => ctx.scene.remove(obs.mesh));
      ctx.savedSubstageState.coins.forEach(coin => ctx.scene.remove(coin.mesh));
      ctx.savedSubstageState = null;
    }
    
    ctx.buildings.forEach(b => { b.visible = true; });
    ctx.trees.forEach(t => { t.visible = true; });
    
    ctx.obstacles.forEach(obs => {
      obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      ctx.scene.remove(obs.mesh);
    });
    ctx.obstacles.length = 0;
    ctx.coins.forEach(coin => ctx.scene.remove(coin.mesh));
    ctx.coins.length = 0;
    ctx.powerups.forEach(pw => ctx.scene.remove(pw.mesh));
    ctx.powerups.length = 0;
    ctx.bossProjectiles.forEach(fb => ctx.scene.remove(fb));
    ctx.bossProjectiles.length = 0;
    
    ctx.bossVulnerableOrbs.forEach(orb => ctx.scene.remove(orb.mesh));
    ctx.bossVulnerableOrbs.length = 0;
    ctx.particles.forEach(p => ctx.scene.remove(p));
    ctx.particles.length = 0;
    ctx.floatingTexts.forEach(t => ctx.scene.remove(t));
    ctx.floatingTexts.length = 0;
    if (ctx.boss) { ctx.scene.remove(ctx.boss); ctx.boss = null; }
    
    if (ctx.bossDefeatTimeout1) { clearTimeout(ctx.bossDefeatTimeout1); ctx.bossDefeatTimeout1 = null; }
    ctx.bossDefeated = false;
    ctx.bossCharging = false;
    ctx.bossState = 'idle';
    ctx.bossStateTimer = 0;

    saveHighScore();
    const gameStats = ctx.gameStats || { maxScore: 0, maxTime: 0, bestRun: 0 };
    if (ctx.score > gameStats.maxScore) gameStats.maxScore = ctx.score;
    if (ctx.gameDuration > gameStats.maxTime) gameStats.maxTime = ctx.gameDuration;
    if (ctx.score > gameStats.bestRun) gameStats.bestRun = ctx.score;
    saveProgress();
    
    playSound('crash');
    createParticleEffect(ctx.player.position, 0xff0000, 30);
    ctx.comboCount = 0;

    const originalPos = ctx.camera.position.clone();
    let shakeTime = 0;
    ctx.gameOverShakeInterval = setInterval(() => {
      shakeTime += 0.05;
      if (shakeTime > 0.5) {
        ctx.camera.position.copy(originalPos);
        clearInterval(ctx.gameOverShakeInterval);
        ctx.gameOverShakeInterval = null;
        return;
      }
      ctx.camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
      ctx.camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
    }, 30);
    
    ctx.showNameEntry = isHighScore.value;
  };

  const resetStage = (preserveScore = false, targetStage = -1) => {
    const ctx = getCtx();
    clearAllTimers();
    ctx.clock.stop();

    if (!preserveScore) ctx.score = 0;
    ctx.gameOver = false;
    ctx.showNameEntry = false;
    ctx.playerName = '';
    ctx.currentLane = 1;
    ctx.isJumping = false;
    ctx.jumpVelocity = 0;
    ctx.isSliding = false;
    ctx.slideTimer = 0;
    ctx.isFlying = false;
    ctx.flyVelocity = 0;

    ctx.gameSpeed = 0.25;
    ctx.spawnInterval = 1.2;
    ctx.gameDuration = 1.5;
    ctx.countdownLocked = false;
    ctx.countdownActive = false;

    ctx.clock.start();
    ctx.lastSpawnTime = 0;
    ctx.stageTransitioning = false;
    gameScene.createStars(); // custom cleanup
    
    ctx.currentStage = targetStage >= 0 ? targetStage : (debugStartStage.value >= 0 ? debugStartStage.value : 0);
    ctx.stageTime = targetStage >= 0 ? 0 : (debugStartStage.value >= 0 ? Math.max(0, STAGES[debugStartStage.value].stageDuration - 20) : 0);
    gameScene.applyStageVisuals(ctx.currentStage);

    ctx.roadCurve = 0;
    ctx.roadCurveTarget = 0;
    ctx.curveChangeTimer = 0;
    ctx.nextCurveChange = 3;
    ctx.curveFrontZ = 0;

    ctx.bossWarning = false;
    ctx.bossActive = false;
    ctx.bossDefeated = false;
    ctx.bossHealth = BOSS_BASE_HEALTH;
    ctx.bossCharging = false;
    ctx.bossChargeTimer = 0;
    ctx.bossChargeTarget = 0;
    ctx.bossAttackTimer = 0;
    ctx.bossNextAttack = 3;
    ctx.bossState = 'idle';
    ctx.bossStateTimer = 0;
    ctx.bossVulnerableOrbs = [];
    
    if (ctx.boss) { ctx.scene.remove(ctx.boss); ctx.boss = null; }

    ctx.comboCount = 0;
    ctx.lastCoinTime = 0;
    ctx.scoreMultiplier = 1;
    ctx.magnetRange = 0;
    ctx.isInvincible = false;
    ctx.activePowerup = null;
    ctx.powerupEndTime = 0;
    ctx.powerupIcon = '';
    ctx.powerupName = '';
    ctx.powerupTimeLeft = 0;
    
    const shieldAura = ctx.player.getObjectByName('shield-aura');
    if (shieldAura) ctx.player.remove(shieldAura);

    ctx.cameraShakeTimer = 0;
    ctx.cameraShakeIntensity = 0;
    ctx.camera.position.set(0, 6, 12);

    ctx.dayCycleTime = 0;
    ctx.nearMissTimer = 0;
    ctx.nearMissCount = 0;
    ctx.nearMissTextRef = '';
    ctx.nearMissCountRef = 0;

    ctx.eventTimer = 0;
    ctx.activeEvent = null;
    ctx.eventDuration = 0;
    ctx.fogDensity = 0;
    ctx.scene.fog.near = 20;
    ctx.scene.fog.far = 80;
    ctx.edgeGlowIntensity = 0;
    
    const vignetteEl = document.getElementById('vignette-glow');
    if (vignetteEl) vignetteEl.style.opacity = '0';

    ctx.bonusPortal = null;
    ctx.bonusPortalSpawned = false;
    ctx.inBonusZone = false;
    ctx.bonusTimer = 0;
    ctx.inBonusZoneRef = false;
    ctx.bonusTimerRef = 0;
    ctx.bonusNoSpawn = false;
    ctx.bonusCoins.forEach(bc => ctx.scene.remove(bc.mesh));
    ctx.bonusCoins = [];
    
    if (ctx.originalRoadMaterial) {
      const roadCheck = ctx.scene.getObjectByName('road');
      if (roadCheck) {
        if (roadCheck.material !== ctx.originalRoadMaterial && roadCheck.material) {
          roadCheck.material.dispose();
        }
        roadCheck.material = ctx.originalRoadMaterial;
        if (ctx.originalGroundTexture) {
          roadCheck.material.map = ctx.originalGroundTexture;
          roadCheck.material.color.set(ctx.originalGroundColor);
          roadCheck.material.needsUpdate = true;
        }
        ctx.originalRoadMaterial = null;
      }
    }
    
    if (ctx.savedSubstageState) {
      ctx.savedSubstageState.obstacles.forEach(obs => ctx.scene.remove(obs.mesh));
      ctx.savedSubstageState.coins.forEach(coin => ctx.scene.remove(coin.mesh));
      ctx.savedSubstageState = null;
    }

    ctx.obstacles.forEach(obs => {
      obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      ctx.scene.remove(obs.mesh);
    });
    ctx.obstacles.length = 0;
    
    ctx.coins.forEach(coin => ctx.scene.remove(coin.mesh));
    ctx.coins.length = 0;
    
    ctx.powerups.forEach(pw => ctx.scene.remove(pw.mesh));
    ctx.powerups.length = 0;
    
    ctx.bossProjectiles.forEach(fb => ctx.scene.remove(fb));
    ctx.bossProjectiles.length = 0;
    
    ctx.particles.forEach(p => ctx.scene.remove(p));
    ctx.particles.length = 0;
    
    ctx.floatingTexts.forEach(t => ctx.scene.remove(t));
    ctx.floatingTexts.length = 0;
    achievements.value = [];

    ctx.player.position.set(0, 0.5, 0);
    ctx.player.scale.y = 1.0;
    
    const starsObj = ctx.scene.getObjectByName('stars');
    if (starsObj) ctx.scene.remove(starsObj);
    ctx.scene.userData.starsCreated = false;

    ctx.buildings.forEach(b => {
      b.visible = true;
      if (b.userData.initZ !== undefined) {
        b.position.z = b.userData.initZ;
        b.position.x = b.userData.initX;
        b.position.y = b.baseY + getSurfaceY(b.userData.initZ);
        b.baseX = b.userData.initBaseX;
      }
    });
    
    ctx.trees.forEach(t => {
      t.visible = true;
      if (t.userData.initZ !== undefined) {
        t.position.z = t.userData.initZ;
        t.position.x = t.userData.initX;
        t.position.y = t.baseY + getSurfaceY(t.userData.initZ);
        t.baseX = t.userData.initBaseX;
      }
    });
    
    ctx.eventAlertTextRef = '';
  };

  const startCountdown = () => {
    const ctx = getCtx();
    console.log('[COUNTDOWN] Starting countdown...');
    resetStage(false);
    ctx.countdownLocked = true;
    ctx.countdownActive = true;
    
    const isMobileLocal = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileLocal && ctx.tiltEnabled) {
      startTiltCalibration();
    }
    
    let count = 3;
    ctx.countdownText = count.toString();
    
    const tick = () => {
      count--;
      if (count > 0) {
        ctx.countdownText = count.toString();
        setTimeout(tick, 1000);
      } else if (count === 0) {
        ctx.countdownText = 'GO!';
        ctx.countdownActive = false;
        ctx.countdownLocked = false;
        ctx.stageTransitioning = false;
        ctx.gameDuration = 1.5;
        ctx.lastSpawnTime = ctx.clock.getElapsedTime() - ctx.spawnInterval;
        ctx.isInvincible = true;
        ctx.gameStartTime = Date.now();
        
        const oldGrace = ctx.player.getObjectByName('shield-aura');
        if (!oldGrace) {
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          ctx.player.add(graceMesh);
        }
        
        ctx.invincibilityTimeout = setTimeout(() => {
          ctx.isInvincible = false;
          ctx.invincibilityTimeout = null;
          const shieldObj = ctx.player.getObjectByName('shield-aura');
          if (shieldObj) ctx.player.remove(shieldObj);
        }, 2000);
        
        try {
          startBGM();
        } catch (err) {
          console.error('[COUNTDOWN] startBGM() error:', err);
        }
        
        if (isMobileLocal && ctx.isCalibrating) {
          finishTiltCalibration();
        }
      }
    };
    
    setTimeout(tick, 1000);
  };

  const startStageCountdown = () => {
    const ctx = getCtx();
    ctx.countdownLocked = true;
    ctx.countdownActive = true;
    if (ctx.micEnabledRef) {
      startCalibration();
    }
    let count = 3;
    ctx.countdownText = count.toString();
    
    const stageTick = () => {
      count--;
      if (count > 0) {
        ctx.countdownText = count.toString();
        setTimeout(stageTick, 1000);
      } else if (count === 0) {
        ctx.countdownText = 'GO!';
        playSound('start');
        ctx.isInvincible = true;
        ctx.gameStartTime = Date.now();
        setTimeout(() => {
          ctx.countdownActive = false;
          ctx.countdownLocked = false;
          ctx.stageTransitioning = false;
          ctx.gameDuration = 1.5;
          ctx.lastSpawnTime = ctx.clock.getElapsedTime() - ctx.spawnInterval;
          ctx.bossWarning = false;
          ctx.bonusPortalSpawned = false; // Allow one rainbow gate per stage
          
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          ctx.player.add(graceMesh);
          
          ctx.invincibilityTimeout = setTimeout(() => {
            ctx.isInvincible = false;
            ctx.invincibilityTimeout = null;
            const shieldObj = ctx.player.getObjectByName('shield-aura');
            if (shieldObj) ctx.player.remove(shieldObj);
          }, 2000);
        }, 500);
      }
    };
    setTimeout(stageTick, 1000);
  };

  const pauseGame = () => {
    const ctx = getCtx();
    if (ctx.isPaused || ctx.gameOver || ctx.countdownActive || ctx.countdownLocked || ctx.stageTransitioning) return;
    ctx.isPaused = true;
    ctx.pauseStartTime = ctx.clock.getElapsedTime();
    createFloatingText('⏸️ PAUSED', ctx.player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffffff');
  };

  const resumeGame = () => {
    const ctx = getCtx();
    if (!ctx.isPaused) return;
    if (ctx.countdownActive || ctx.countdownLocked || ctx.stageTransitioning) {
      ctx.isPaused = false;
      return;
    }
    ctx.isPaused = false;
    const pauseDuration = ctx.clock.getElapsedTime() - ctx.pauseStartTime;
    ctx.clock.elapsedTime -= pauseDuration;
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      pauseGame();
    }
  };

  const enterBonusZone = () => {
    const ctx = getCtx();
    if (ctx.inBonusZone) return;
    
    ctx.inBonusZone = true;
    ctx.inBonusZoneRef = true;
    ctx.bonusTimer = 10;
    ctx.bonusTimerRef = 10;
    
    // Save original road material if not already saved
    if (ctx.roadMesh && ctx.roadMesh.material) {
      if (!ctx.originalRoadMaterial) {
        ctx.originalRoadMaterial = ctx.roadMesh.material;
      }
      // Create a beautiful neon pink basic material
      const bonusMat = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.95
      });
      ctx.roadMesh.material = bonusMat;
      ctx.roadMesh.material.needsUpdate = true;
    }
    
    playSound('powerup');
    createFloatingText('🦄 RAINBOW ZONE!', ctx.player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff00ff');

    // Spawn bonus coins at ground level
    ctx.bonusCoins = [];
    const laneWidthVal = 3;
    for (let i = 0; i < 40; i++) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const z = -i * 2.5 - 5;
      const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
      const coinMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.3 });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(lane * laneWidthVal, 0.5, z);
      coinMesh.rotation.x = Math.PI / 2;
      ctx.scene.add(coinMesh);
      ctx.bonusCoins.push({ mesh: coinMesh, collected: false, baseX: lane * laneWidthVal });
    }
    ctx.scene.userData.bonusEnvActive = true;
    
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
    ctx.scene.add(nyanCat);
    ctx.scene.userData.nyanCat = nyanCat;
    ctx.scene.userData.nyanCatTime = 0;
  };

  const exitBonusZone = () => {
    const ctx = getCtx();
    if (!ctx.inBonusZone) return;
    
    ctx.inBonusZone = false;
    ctx.inBonusZoneRef = false;
    ctx.bonusTimer = 0;
    ctx.bonusTimerRef = 0;
    
    // Restore original road material
    if (ctx.roadMesh && ctx.roadMesh.material && ctx.originalRoadMaterial) {
      ctx.roadMesh.material = ctx.originalRoadMaterial;
      ctx.roadMesh.material.needsUpdate = true;
    }
    
    playSound('powerup_fade');
    createFloatingText('EXITING BONUS!', ctx.player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffff00');

    // Clean up bonus coins
    if (ctx.bonusCoins) {
      ctx.bonusCoins.forEach(bc => ctx.scene.remove(bc.mesh));
      ctx.bonusCoins = [];
    }
    ctx.scene.userData.bonusEnvActive = false;

    // Clean up Nyan Cat
    if (ctx.scene.userData.nyanCat) {
      ctx.scene.remove(ctx.scene.userData.nyanCat);
      ctx.scene.userData.nyanCat = null;
      ctx.scene.userData.nyanCatTime = 0;
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
    pauseGame,
    resumeGame,
    handleVisibilityChange,
    enterBonusZone,
    exitBonusZone
  };
}
