/**
 * Collision Detection Composable
 * Handles all collision detection for player vs coins, obstacles, boss, boss projectiles, bonus portal, and powerups
 */

import * as THREE from 'three'

/**
 * Check all collisions in the game
 * @param {Object} params - Collision parameters
 * @param {Object} params.player - Player mesh
 * @param {Array} params.coins - Coin array
 * @param {Array} params.obstacles - Obstacle array
 * @param {Object} params.boss - Boss mesh (optional)
 * @param {Array} params.bossProjectiles - Boss projectile array
 * @param {Object} params.bonusPortal - Bonus portal object (optional)
 * @param {Array} params.powerups - Powerup array
 * @param {Array} params.bonusCoins - Bonus coin array
 * @param {boolean} params.isInvincible - Whether player is invincible
 * @param {boolean} params.isSliding - Whether player is sliding
 * @param {boolean} params.isFlying - Whether player is flying
 * @param {string} params.activePowerup - Current active powerup
 * @param {number} params.magnetRange - Magnet powerup range
 * @param {number} params.gameSpeed - Current game speed
 * @param {number} params.laneWidth - Width of each lane
 * @param {Function} params.getCurveX - Function to get curve X position
 * @param {Function} params.getSurfaceY - Function to get surface Y position
 * @param {Function} params.getSurfaceTilt - Function to get surface tilt
 * @param {Object} params.gameOver - Game over ref
 * @param {boolean} params.countdownLocked - Whether countdown is locked
 * @param {Object} params.stageTransitioning - Stage transitioning ref
 * @param {number} params.gameStartTime - Game start timestamp
 * @param {Function} params.triggerGameOver - Function to trigger game over
 * @param {Function} params.createFloatingText - Function to create floating text
 * @param {Function} params.createParticleEffect - Function to create particle effects
 * @param {Function} params.playSound - Function to play sounds
 * @param {Function} params.deactivatePowerup - Function to deactivate powerup
 * @param {Object} params.scene - Three.js scene
 * @param {number} params.time - Elapsed time
 * @param {Object} params.score - Score ref
 * @param {number} params.scoreMultiplier - Score multiplier
 * @param {Object} params.gameStats - Game stats object
 * @param {Object} params.comboCountRef - Combo count ref
 * @param {Object} params.lastCoinTimeRef - Last coin time ref
 * @param {Object} params.nearMissCountRef - Near miss count ref
 * @param {Object} params.nearMissTextRef - Near miss text ref
 * @param {Object} params.nearMissTimerRef - Near miss timer ref
 * @param {Object} params.shieldBlockTextRef - Shield block text ref
 * @param {Object} params.bossHealth - Boss health ref (optional)
 * @param {Object} params.cameraShakeTimerRef - Camera shake timer ref
 * @param {Object} params.cameraShakeIntensityRef - Camera shake intensity ref
 * @param {Object} params.invincibleRef - Invincible state ref
 * @param {Object} params.invincibilityTimeoutRef - Invincibility timeout ref
 * @returns {Object} Collision results { activateBonusZone, activatePowerup }
 */
export function checkCollisions(params) {
  const {
    player,
    coins,
    obstacles,
    boss,
    bossProjectiles,
    bonusPortal,
    powerups,
    bonusCoins,
    isInvincible,
    isSliding,
    isFlying,
    activePowerup,
    magnetRange,
    gameSpeed,
    laneWidth,
    getCurveX,
    getSurfaceY,
    getSurfaceTilt,
    gameOver,
    countdownLocked,
    stageTransitioning,
    gameStartTime,
    triggerGameOver,
    createFloatingText,
    createParticleEffect,
    playSound,
    deactivatePowerup,
    scene,
    time,
    score,
    scoreMultiplier,
    gameStats,
    comboCountRef,
    lastCoinTimeRef,
    nearMissCountRef,
    nearMissTextRef,
    nearMissTimerRef,
    shieldBlockTextRef,
    bossHealth,
    cameraShakeTimerRef,
    cameraShakeIntensityRef,
    invincibleRef,
    invincibilityTimeoutRef,
    STAGES,
    currentStage
  } = params

  const now = Date.now()
  const gracePeriod = now - gameStartTime < 2000
  let result = {}

  // === BOSS PROJECTILE MOVEMENT + COLLISION ===
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const fb = bossProjectiles[i]
    fb.position.z += fb.userData.speed
    fb.position.x += (fb.userData.targetX - fb.position.x) * 0.05
    fb.position.y += (fb.userData.targetY - fb.position.y) * 0.04
    fb.rotation.y += 0.1

    // Skip collision if game over, countdown, grace period, or stage transition
    if (gameOver.value || countdownLocked || stageTransitioning.value || gracePeriod) continue

    // Collision with player
    const dist = player.position.distanceTo(fb.position)
    if (dist < 1.5) {
      if (!isInvincible) {
        // Dragon fireball = instant death, truck = damage
        if (STAGES[currentStage.value].bossType === 'dragon') {
          createFloatingText('HIT!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
          triggerGameOver(0.4)
        } else {
          bossHealth.value = Math.min(100, bossHealth.value + 10)
          createFloatingText('HIT', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
          cameraShakeTimerRef.value = 0.5
          cameraShakeIntensityRef.value = 0.25
          invincibleRef.value = true
          if (invincibilityTimeoutRef.value) clearTimeout(invincibilityTimeoutRef.value)
          invincibilityTimeoutRef.value = setTimeout(() => {
            invincibleRef.value = false
            invincibilityTimeoutRef.value = null
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
      createFloatingText('⚡', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#44ff44')
    }

    // Remove if past player
    if (fb.position.z > 10) {
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
    }
  }

  // === BOSS COLLISION ===
  if (boss && boss.userData?.charging && !gameOver.value && !countdownLocked && !gracePeriod) {
    const dx = player.position.x - boss.position.x
    const dz = player.position.z - boss.position.z
    const inZRange = Math.abs(dz) < 3
    if (inZRange && Math.abs(dx) < 2.0 && !isInvincible) {
      // Boss hit — instant kill
      createFloatingText('HIT!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
      triggerGameOver(0.5)
    }
    // Near-miss dodge: close but escaped
    if (inZRange && !boss.userData.chargeMissTriggered && Math.abs(dx) >= 2.0 && Math.abs(dx) < 4.0) {
      boss.userData.chargeMissTriggered = true
      bossHealth.value -= 12
      createFloatingText('DODGE!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#44ff44')
    }
  }

  // === BONUS PORTAL COLLISION ===
  if (bonusPortal && !gameOver.value && !countdownLocked) {
    bonusPortal.mesh.position.z += gameSpeed
    bonusPortal.mesh.position.x = ((bonusPortal.lane - 1) * laneWidth) + getCurveX(bonusPortal.mesh.position.z)
    bonusPortal.mesh.position.y = (bonusPortal.mesh.baseY || 1.5) + getSurfaceY(bonusPortal.mesh.position.z)
    bonusPortal.mesh.rotation.x = getSurfaceTilt(bonusPortal.mesh.position.z)

    // Spin and pulse portal
    const ring = bonusPortal.mesh.getObjectByName('portal-ring')
    if (ring) ring.rotation.z += 0.05
    const inner = bonusPortal.mesh.getObjectByName('portal-inner')
    if (inner) {
      inner.material.color.setHSL((time * 0.5) % 1, 1, 0.5)
    }

    // Sparkle animation
    for (let i = 0; i < 8; i++) {
      const spark = bonusPortal.mesh.getObjectByName('spark-' + i)
      if (spark) {
        const angle = (i / 8) * Math.PI * 2 + time * 2
        spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0)
      }
    }

    // Collision check
    const dist = player.position.distanceTo(bonusPortal.mesh.position)
    if (dist < 2.0) {
      // Enter bonus zone!
      result.activateBonusZone = true
      scene.remove(bonusPortal.mesh)
      playSound('powerup')
      return result
    }

    // Clean up portal if it passed the player
    if (bonusPortal.mesh.position.z > 15) {
      scene.remove(bonusPortal.mesh)
      result.removeBonusPortal = true
    }
  }

  // === OBSTACLE COLLISION ===
  const sharedCoinGeo = coins.length > 0 ? coins[0].mesh.geometry : null
  obstacles.forEach((obs, index) => {
    // Animate obstacles
    if (obs.type === 'police') {
      const sirenR = obs.mesh.getObjectByName('siren-red')
      const sirenB = obs.mesh.getObjectByName('siren-blue')
      if (sirenR && sirenB) {
        const flash = Math.sin(time * 15) > 0
        sirenR.material.color.setHex(flash ? 0xff0000 : 0x440000)
        sirenB.material.color.setHex(flash ? 0x000044 : 0x0000ff)
      }
    }

    // Skip collision if game over, countdown, grace period, or stage transition
    if (gameOver.value || countdownLocked || stageTransitioning.value || gracePeriod) return

    // Horizontal + Z distance (ignore Y for collision range check)
    const dx = player.position.x - obs.mesh.position.x
    const dz = player.position.z - obs.mesh.position.z
    const horizDist = Math.sqrt(dx * dx + dz * dz)
    const collisionDist = obs.hitWidth || 1.5
    const isFloating = obs.type === 'floating'

    // Near-miss detection — rare & rewarding (only once per obstacle, tighter band)
    if (!obs.nearMissTriggered && horizDist < collisionDist + 0.4 && horizDist >= collisionDist && Math.abs(dz) < 1.0) {
      obs.nearMissTriggered = true
      nearMissCountRef.value++
      score.value += 25
      nearMissTextRef.value = 'CLOSE CALL! +25 🔥'
      nearMissTimerRef.value = 1.0
    }

    // Ground obstacles: hit if player is on ground level and not flying
    const hitGroundObs = !isFloating && player.position.y < 1.0 && !isFlying
    // Floating/UFO: hit if player is NOT sliding (must slide under)
    const hitFloatingObs = isFloating && !isSliding

    if (horizDist < collisionDist && (hitGroundObs || hitFloatingObs)) {
      if (isInvincible) {
        // Shield blocks the hit
        playSound('shield_hit')
        createParticleEffect(obs.mesh.position, 0x00bfff, 15)
        deactivatePowerup()
        obs.mesh.traverse(c => {
          if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose()
        })
        scene.remove(obs.mesh)
        obstacles.splice(index, 1)
        if (shieldBlockTextRef) {
          shieldBlockTextRef.value = 'SHIELD BLOCK!'
        }
      } else {
        triggerGameOver(0.5)
      }
    }

    // Remove if past player
    if (obs.mesh.position.z > 15) {
      obs.mesh.traverse(c => {
        if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose()
      })
      scene.remove(obs.mesh)
      obstacles.splice(index, 1)
    }
  })

  // === COIN COLLECTION ===
  coins.forEach((coin, index) => {
    if (coin.collected) return

    const dist = player.position.distanceTo(coin.mesh.position)

    // Magnet effect - strong pull to player position
    if (magnetRange > 0 && activePowerup === 'magnet' && dist < magnetRange) {
      // Check if there's an obstacle blocking the path
      const hasObstacle = obstacles.some(obs => {
        const inSameLane = Math.abs(obs.mesh.position.x - coin.mesh.position.x) < 2
        const betweenCoinAndPlayer = (
          (obs.mesh.position.z > coin.mesh.position.z && obs.mesh.position.z < player.position.z) ||
          (obs.mesh.position.z < coin.mesh.position.z && obs.mesh.position.z > player.position.z)
        )
        const closeToLine = obs.mesh.position.distanceTo(
          new THREE.Vector3(coin.mesh.position.x, 0, coin.mesh.position.z).lerp(
            new THREE.Vector3(player.position.x, 0, player.position.z),
            0.5
          )
        ) < 1.5
        return inSameLane && betweenCoinAndPlayer && closeToLine
      })

      if (!hasObstacle) {
        // Strong magnet - coins fly directly to player
        const direction = new THREE.Vector3().subVectors(player.position, coin.mesh.position).normalize()
        const pullSpeed = 0.8
        coin.mesh.position.add(direction.multiplyScalar(pullSpeed))
        coin.mesh.rotation.y += 0.2
      } else {
        // Blocked by obstacle - continue normal movement
        coin.mesh.position.z += gameSpeed
        coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z)
        coin.mesh.rotation.y += 0.1
      }
    } else {
      // No magnet - normal movement
      coin.mesh.position.z += gameSpeed
      coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z)
      coin.mesh.rotation.y += 0.1
    }

    coin.mesh.position.y = (coin.mesh.baseY || 0.5) + getSurfaceY(coin.mesh.position.z)
    coin.mesh.rotation.x = getSurfaceTilt(coin.mesh.position.z)

    if (dist < 1.2) {
      coin.collected = true
      comboCountRef.value++
      if (comboCountRef.value > gameStats.maxCombo) gameStats.maxCombo = comboCountRef.value
      const comboBonus = comboCountRef.value > 1 && (now - lastCoinTimeRef.value) < 1000 ? comboCountRef.value * 10 : 0
      score.value += (100 + comboBonus) * scoreMultiplier
      lastCoinTimeRef.value = now
      gameStats.totalCoins++

      if (magnetRange > 0) {
        gameStats.magnetCoins++
      }

      createParticleEffect(coin.mesh.position, 0xffd700, 15)
      createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), coin.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)))
      playSound('coin', 0.9 + Math.random() * 0.2)

      scene.remove(coin.mesh)
      coins.splice(index, 1)
    } else if (coin.mesh.position.z > 15) {
      scene.remove(coin.mesh)
      coins.splice(index, 1)
    }
  })

  // === BONUS COINS COLLECTION ===
  bonusCoins.forEach((bc, index) => {
    if (bc.collected) return
    bc.mesh.position.z += gameSpeed
    bc.mesh.position.x = (bc.baseX || 0) + getCurveX(bc.mesh.position.z)
    bc.mesh.rotation.y += 0.1
    bc.mesh.position.y = 0.5 + getSurfaceY(bc.mesh.position.z)
    bc.mesh.rotation.x = getSurfaceTilt(bc.mesh.position.z)

    const dist = player.position.distanceTo(bc.mesh.position)
    if (dist < 1.2) {
      bc.collected = true
      comboCountRef.value++
      if (comboCountRef.value > gameStats.maxCombo) gameStats.maxCombo = comboCountRef.value
      const comboBonus = comboCountRef.value > 1 && (now - lastCoinTimeRef.value) < 1000 ? comboCountRef.value * 10 : 0
      score.value += (100 + comboBonus) * scoreMultiplier
      lastCoinTimeRef.value = now
      gameStats.totalCoins++
      createParticleEffect(bc.mesh.position, 0xffd700, 15)
      createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), bc.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)))
      playSound('coin', 0.9 + Math.random() * 0.2)
      scene.remove(bc.mesh)
      bonusCoins.splice(index, 1)
    } else if (bc.mesh.position.z > 15) {
      scene.remove(bc.mesh)
      bonusCoins.splice(index, 1)
    }
  })

  // === POWERUP COLLECTION ===
  powerups.forEach((pw, index) => {
    if (pw.collected) return

    pw.mesh.position.z += gameSpeed
    pw.mesh.position.x = ((pw.lane - 1) * laneWidth) + getCurveX(pw.mesh.position.z)
    pw.mesh.rotation.y += 0.15
    pw.mesh.position.y = (pw.mesh.baseY || 1) + getSurfaceY(pw.mesh.position.z)
    pw.mesh.rotation.x = getSurfaceTilt(pw.mesh.position.z)

    // Animate rings
    if (pw.type === 'shield') {
      pw.mesh.children[1].rotation.z += 0.05
    } else if (pw.type === 'magnet') {
      pw.mesh.children.forEach((c, i) => {
        c.scale.setScalar(1 + Math.sin(time * 5 + i) * 0.2)
      })
    }

    const dist = player.position.distanceTo(pw.mesh.position)
    if (dist < 1.2) {
      pw.collected = true
      gameStats.powerupsCollected++
      result.activatePowerup = pw.type
      playSound('powerup', 0.9 + Math.random() * 0.2)
      scene.remove(pw.mesh)
      powerups.splice(index, 1)
    } else if (pw.mesh.position.z > 15) {
      scene.remove(pw.mesh)
      powerups.splice(index, 1)
    }
  })

  return result
}
