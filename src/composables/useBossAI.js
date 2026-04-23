/**
 * Boss AI Logic Composable
 * Handles boss behavior including health management, attacks, charging, and retreat patterns
 */

/**
 * Check and trigger boss spawn warning/spawn
 * @param {Object} params - Boss spawn parameters
 */
export function checkBossSpawn(params) {
  const {
    stageTime,
    STAGES,
    currentStage,
    bossActive,
    bossWarning,
    bossDefeated,
    stageTransitioning,
    bossHealth,
    createFloatingText,
    playSFX,
    spawnBoss,
    THREE,
    player
  } = params

  const stage = STAGES[currentStage.value]
  const bossSpawnTime = stage.stageDuration

  // Warning 5s before boss
  if (stageTime.value >= bossSpawnTime - 5 && stageTime.value < bossSpawnTime && !bossActive.value && !bossWarning.value && !bossDefeated.value) {
    bossWarning.value = true
    createFloatingText('⚠️ BOSS INCOMING! ⚠️', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
  }

  // Spawn boss
  if (stageTime.value >= bossSpawnTime && !bossActive.value && !bossDefeated.value && !stageTransitioning.value) {
    bossWarning.value = false
    bossActive.value = true
    bossHealth.value = 100
    createFloatingText(`⚠️ ${stage.bossType === 'truck' ? 'ROAD RAGE TRUCK' : 'SKY TERROR DRAGON'} ⚠️`, player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
    playSFX(stage.bossType === 'truck' ? 'truck_honk' : 'dragon_cry', 0.6)
    spawnBoss(stage.bossType)
  }
}

export function updateBossAI(params) {
  const {
    // Boss state refs
    bossActive,
    bossHealth,
    bossDefeated,
    bossWarning,
    // Boss state - plain vars in mutable state object
    state, // { boss, bossCharging, bossAttackTimer, bossNextAttack, bossChargeTimer, bossProjectiles, particles }
    // Stage info refs
    stageTime,
    currentStage,
    stageTransitioning,
    STAGES,
    // Actions
    spawnBossProjectile,
    createFloatingText,
    playSFX,
    spawnBoss,
    resetStage,
    // Game state refs
    countdownLocked,
    countdownActive,
    countdownText,
    isInvincible,
    gameStartTime,
    gameDuration,
    lastSpawnTime,
    invincibilityTimeout,
    gameOver,
    // Effects refs
    cameraShakeTimer,
    cameraShakeIntensity,
    // Game state - plain vars in mutable state object
    gameState, // { gameSpeed, player, scene, THREE, bonusNoSpawn, clock, spawnInterval }
    // Math helpers
    getCurveX,
    getSurfaceY,
    laneWidth,
    // Callbacks
    triggerGameOver,
    playSound,
    // Timeout handlers
    setTimeoutRef,
    clearTimeoutRef
  } = params

  const realDelta = params.realDelta

  // === BOSS WARNING + SPAWN TRIGGER ===
  checkBossSpawn(params)

  // === BOSS TIMER (decrement health over bossDuration seconds) ===
  if (bossActive.value && !bossDefeated.value) {
    bossHealth.value -= (100 / stage.bossDuration) * realDelta
    if (bossHealth.value <= 0) {
      bossDefeated.value = true
      bossActive.value = false
      bossWarning.value = false
      bossHealth.value = 0
      createFloatingText('✨ STAGE CLEAR! ✨', gameState.player.position.clone().add(new params.THREE.Vector3(0, 3, 0)), '#44ff44')
      playSFX('stage_clear')

      // Block spawning immediately — stageTransitioning prevents obstacle/coin/powerup spawns
      stageTransitioning.value = true

      // Boss defeat explosion
      if (state.boss) {
        const bossPos = state.boss.position.clone()
        for (let i = 0; i < 20; i++) {
          const pGeo = new params.THREE.BoxGeometry(0.3, 0.3, 0.3)
          const pMat = new params.THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xffaa00 : 0xff4400 })
          const p = new params.THREE.Mesh(pGeo, pMat)
          p.position.copy(bossPos).add(new params.THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3))
          p.userData = { velocity: new params.THREE.Vector3((Math.random() - 0.5) * 0.3, Math.random() * 0.2, (Math.random() - 0.5) * 0.3), life: 1.5 }
          gameState.scene.add(p)
          state.particles.push(p)
        }
        gameState.scene.remove(state.boss)
        state.boss = null
      }

      // Clean up boss projectiles
      state.bossProjectiles.forEach(fb => gameState.scene.remove(fb))
      state.bossProjectiles = []

      // Reset world + 3-2-1-GO countdown for next stage (keeps score)
      const nextStage = (currentStage.value + 1) % STAGES.length
      resetStage(true, nextStage) // preserveScore=true, target next stage
      createFloatingText(`STAGE ${nextStage + 1}: ${STAGES[nextStage].name}`, gameState.player.position.clone().add(new params.THREE.Vector3(0, 3, 0)), '#ffffff')
      stageTransitioning.value = true // keep paused during countdown

      // 3-2-1-GO countdown then resume
      countdownLocked.value = true
      countdownActive.value = true
      let count = 3
      countdownText.value = count.toString()

      const stageTick = () => {
        count--
        if (count > 0) {
          countdownText.value = count.toString()
          setTimeoutRef(stageTick, 1000)
        } else if (count === 0) {
          countdownText.value = 'GO!'
          playSound('start')
          setTimeoutRef(() => {
            countdownActive.value = false
            countdownLocked.value = false
            stageTransitioning.value = false // unlock game loop
            bossWarning.value = false // defensive: ensure cleared
            console.log('[STAGE-RESUME] countdown done, stage:', currentStage.value, 'gameDuration:', gameDuration.value, 'lastSpawnTime:', lastSpawnTime.value, 'time:', gameState.clock.getElapsedTime(), 'spawnInterval:', gameState.spawnInterval, 'bossActive:', bossActive.value, 'stageTransitioning:', stageTransitioning.value, 'countdownLocked:', countdownLocked.value, 'bonusNoSpawn:', gameState.bonusNoSpawn, 'gameOver:', gameOver.value)

            // 2-second invincibility after stage starts
            isInvincible.value = true
            gameStartTime.value = Date.now()
            gameDuration.value = 1.5 // skip spawn grace (countdown already provided delay)
            lastSpawnTime.value = gameState.clock.getElapsedTime() - gameState.spawnInterval // trigger spawn immediately

            const graceGeo = new params.THREE.SphereGeometry(1.2, 16, 16)
            const graceMat = new params.THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: params.THREE.DoubleSide })
            const graceMesh = new params.THREE.Mesh(graceGeo, graceMat)
            graceMesh.name = 'shield-aura'
            gameState.player.add(graceMesh)

            invincibilityTimeout.value = setTimeoutRef(() => {
              isInvincible.value = false
              invincibilityTimeout.value = null
              const shield = gameState.player.getObjectByName('shield-aura')
              if (shield) gameState.player.remove(shield)
            }, 2000)
          }, 500)
        }
      }
      setTimeoutRef(stageTick, 1000)
    }
  }

  // === BOSS ANIMATION + ATTACK AI ===
  if (state.boss && bossActive.value && !bossDefeated.value) {
    const bossType = STAGES[currentStage.value].bossType

    if (state.bossCharging) {
      // Truck charge — straight line from start position to target lane at z=0
      state.bossChargeTimer += realDelta
      const chargeSpeed = gameState.gameSpeed * 1.2
      state.boss.position.z += chargeSpeed

      // Linear interpolation: X moves proportionally to Z progress
      const startZ = state.boss.userData.chargeStartZ || -54
      const startX = state.boss.userData.chargeStartX || state.boss.position.x
      const targetX = state.boss.userData.chargeTargetX
      const totalDist = Math.abs(0 - startZ) // distance from start Z to player Z (0)
      const traveled = Math.abs(state.boss.position.z - startZ)
      const progress = Math.min(traveled / totalDist, 1)
      state.boss.position.x = startX + (targetX - startX) * progress

      // Clamp X to road width
      state.boss.position.x = Math.max(-laneWidth * 1.5, Math.min(laneWidth * 1.5, state.boss.position.x))
      if (bossType === 'truck') state.boss.position.y = getSurfaceY(state.boss.position.z)

      // Charge past player then retreat
      if (state.boss.position.z > 5 || state.bossChargeTimer > 4) {
        state.bossCharging = false
        state.boss.userData = state.boss.userData || {}
        state.boss.userData.retreatPhase = true
        state.boss.userData.retreatTimer = 0
        state.boss.userData.retreatStartX = state.boss.position.x
        state.boss.userData.retreatStartZ = state.boss.position.z
        state.boss.userData.chargeMissTriggered = false
      }
    } else if (state.boss.userData?.retreatPhase) {
      // Retreat back to start position (no collision during retreat)
      state.boss.userData.retreatTimer += realDelta
      const retreatDuration = bossType === 'truck' ? 2.5 : 4.0
      const t = Math.min(state.boss.userData.retreatTimer / retreatDuration, 1)

      // Ease-out retreat
      const easeT = 1 - Math.pow(1 - t, 3)
      const startZ = state.boss.userData.retreatStartZ || 5
      const startX = state.boss.userData.retreatStartX || state.boss.position.x
      state.boss.position.z = startZ + (-54 - startZ) * easeT

      if (bossType === 'truck') {
        // Truck: go straight back to center, don't track player
        state.boss.position.x = startX + (getCurveX(-54) - startX) * easeT
        state.boss.position.y = getSurfaceY(state.boss.position.z)
      } else {
        // Dragon: drift toward road curve center
        const targetX = getCurveX(state.boss.position.z)
        state.boss.position.x += (targetX - state.boss.position.x) * 0.1
      }

      if (t >= 1) {
        state.boss.userData.retreatPhase = false
        state.boss.position.z = -54
      }
    } else {
      // Idle: hover/sway
      const sway = Math.sin(Date.now() * 0.001) * 3
      state.boss.position.z = -54 + sway

      if (bossType === 'truck') {
        // Truck: swivel left-right, tracking player lane
        const swivelX = Math.sin(Date.now() * 0.003) * 1.5
        state.boss.position.x = swivelX + getCurveX(state.boss.position.z)
        state.boss.position.y = getSurfaceY(state.boss.position.z)
        state.boss.rotation.y = 0
      } else {
        state.boss.position.x = getCurveX(state.boss.position.z)
        state.boss.position.y = 5 + Math.sin(Date.now() * 0.002) * 1.5 + getSurfaceY(state.boss.position.z)
        state.boss.rotation.y = 0 // face player, no spinning

        // Animate dragon parts
        state.boss.children.forEach(child => {
          // Wing flap (left + right wings)
          if (child.position.x < -1) { // left wing segments
            child.rotation.z = 0.3 + Math.sin(Date.now() * 0.005) * 0.3
          } else if (child.position.x > 1) { // right wing segments
            child.rotation.z = -0.3 - Math.sin(Date.now() * 0.005) * 0.3
          }
        })

        // Tail sway
        const tailSway = Math.sin(Date.now() * 0.003) * 0.3
        state.boss.children.forEach(child => {
          if (child.position.z < -1 && child.geometry?.type === 'SphereGeometry') {
            child.position.x = tailSway * (-child.position.z / 4)
          }
        })

        // Mouth open when about to attack
        if (state.bossAttackTimer > state.bossNextAttack * 0.7) {
          const snout = state.boss.children.find(c => c.geometry?.type === 'ConeGeometry' && c.position.z > 2)
          if (snout) snout.rotation.x = -Math.PI / 2 + Math.sin(Date.now() * 0.01) * 0.15
        }
      }
    }

    // Attack timer — skip during truck charge AND retreat (truck uses charge cycles, not projectile spam)
    const truckBusy = bossType === 'truck' && (state.bossCharging || state.boss.userData?.retreatPhase)
    if (!truckBusy) {
      state.bossAttackTimer += realDelta
      if (state.bossAttackTimer >= state.bossNextAttack) {
        state.bossAttackTimer = 0
        state.bossNextAttack = 0.8 + Math.random() * 0.6 // rapid burst interval
        spawnBossProjectile(bossType)
        // Screen shake on attack
        cameraShakeTimer.value = 0.3
        cameraShakeIntensity.value = 0.15
      }
    }
  }
}

/**
 * Update boss projectiles - movement and collision detection
 * @param {Object} params - Boss projectile parameters
 */
export function updateBossProjectiles(params) {
  const {
    // Boss state
    bossProjectiles,
    boss,
    bossCharging,
    bossHealth,
    // Player state
    player,
    isInvincible,
    // Game state
    gameOver,
    countdownLocked,
    stageTransitioning,
    gameStartTime,
    currentStage,
    STAGES,
    // Actions
    createFloatingText,
    triggerGameOver,
    playSFX,
    // Effects
    scene,
    cameraShakeTimer,
    cameraShakeIntensity,
    // Timeout handlers
    setTimeoutRef,
    clearTimeoutRef,
    // Plain vars
    invincibilityTimeout
  } = params

  // Update projectile positions and check collisions
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const fb = bossProjectiles[i]
    fb.position.z += fb.userData.speed
    fb.position.x += (fb.userData.targetX - fb.position.x) * 0.05
    fb.position.y += (fb.userData.targetY - fb.position.y) * 0.04 // converge to target height
    fb.rotation.y += 0.1

    // Skip collision if game over, countdown, grace period, or stage transition
    if (gameOver.value || countdownLocked || stageTransitioning.value || Date.now() - gameStartTime < 2000) continue

    // Collision with player
    const dist = player.position.distanceTo(fb.position)
    if (dist < 1.5) {
      if (!isInvincible.value) {
        // Dragon fireball = instant death, truck = damage
        if (STAGES[currentStage.value].bossType === 'dragon') {
          createFloatingText('HIT!', player.position.clone().add(new params.THREE.Vector3(0, 2, 0)), '#ff4444')
          triggerGameOver(0.4)
        } else {
          bossHealth.value = Math.min(100, bossHealth.value + 10)
          createFloatingText('HIT', player.position.clone().add(new params.THREE.Vector3(0, 2, 0)), '#ff4444')
          cameraShakeTimer.value = 0.5
          cameraShakeIntensity.value = 0.25
          isInvincible.value = true
          invincibilityTimeout.value = setTimeoutRef(() => {
            isInvincible.value = false
            invincibilityTimeout.value = null
          }, 1500)
        }
      }
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
      continue
    }

    // Near-miss — player dodges close, damages boss
    if (!fb.userData.nearMissTriggered && dist < 2.5 && dist >= 1.5) {
      fb.userData.nearMissTriggered = true
      bossHealth.value -= 8
      createFloatingText('⚡', player.position.clone().add(new params.THREE.Vector3(0, 2, 0)), '#44ff44')
    }

    // Remove if past player
    if (fb.position.z > 10) {
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
    }
  }

  // Boss collision: any touch = game over for both truck and dragon
  if (bossCharging && boss && !gameOver.value && !countdownLocked && Date.now() - gameStartTime >= 2000) {
    const dx = player.position.x - boss.position.x
    const dz = player.position.z - boss.position.z
    const inZRange = Math.abs(dz) < 3
    if (inZRange && Math.abs(dx) < 2.0 && !isInvincible.value) {
      // Boss hit — instant kill
      createFloatingText('HIT!', player.position.clone().add(new params.THREE.Vector3(0, 2, 0)), '#ff4444')
      triggerGameOver(0.5)
    }
    // Near-miss dodge: close but escaped
    if (inZRange && !boss.userData?.chargeMissTriggered && Math.abs(dx) >= 2.0 && Math.abs(dx) < 4.0) {
      if (!boss.userData) boss.userData = {}
      boss.userData.chargeMissTriggered = true
      bossHealth.value -= 12
      createFloatingText('DODGE!', player.position.clone().add(new params.THREE.Vector3(0, 2, 0)), '#44ff44')
    }
  }
}
