import * as THREE from 'three';
import { laneWidth, BOSS_HIT_DAMAGE, BOSS_DEFEAT_DELAY, BOSS_DIFFICULTY_DIVISOR, BOSS_COLLISION_DIST, BOSS_PROJECTILE_HIT_RADIUS, BOSS_BEAM_HIT_RADIUS, COIN_COLLECT_DIST, POWERUP_COLLECT_DIST, NEAR_MISS_EXTRA_DIST, NEAR_MISS_DZ, NEAR_MISS_SCORE, COIN_BASE_SCORE, COMBO_WINDOW_MS, COMBO_BONUS_MULTIPLIER, MAGNET_PULL_SPEED, COLDDRINK_SPEED_MULT, SHIELD_DURATION, COLDDRINK_DURATION, MAGNET_DURATION, ENTITY_DESPAWN_Z, BUILDING_DESPAWN_Z, CLOUD_SPEED, CLOUD_RESPAWN_Z, CLOUD_SPAWN_Z_MIN, CLOUD_X_RANGE, TREE_ZONE_MIN, TREE_ZONE_MAX, BUILDING_ZONE_MIN, BUILDING_ZONE_MAX } from '../gameConstants.js';
import { STAGES } from '../data/stages.js';
import { createTimerTracker } from '../utils/timerTracker.js';

const timer = createTimerTracker();

/**
 * Game updates composable — handles entity movement, collisions, scoring, boss updates.
 * 
 * @param {Object} deps
 * @param {Object} deps.store - Shared reactive game store
 * @param {Object} deps.gameScene - Game scene composable
 * @param {Object} deps.gameBoss - Game boss composable
 */
export function useGameUpdates({
  store,
  gameScene,
  gameBoss
}) {
  // Functions accessed via store (wired in App.vue after init):
  // store.playSound, store.createFloatingText, store.createParticleEffect,
  // store.deactivatePowerup, store.activatePowerup, store.triggerGameOver,
  // store.startStageCountdown, store.getSurfaceY, store.getSurfaceTilt,
  // store.getCurveX, store.getCurveSlope {
  const updateEntities = (delta, time) => {
    const obstacles = store.obstacles;
    const coins = store.coins;
    const powerups = store.powerups;
    const clouds = store.clouds;
    const trees = store.trees;
    const buildings = store.buildings;
    const medievalFlowers = store.medievalFlowers;
    const particles = store.particles;
    const floatingTexts = store.floatingTexts;
    const bossProjectiles = store.bossProjectiles;
    const player = store.player;
    const scene = store.scene;
    const camera = store.camera;
    const gameSpeed = store.gameSpeed;
    const gameDuration = store.gameDuration;
    const countdownLocked = store.countdownLocked;
    const gameStats = store.gameStats || { maxCombo: 0, totalCoins: 0, powerupsCollected: 0 };
    const scoreMultiplier = store.scoreMultiplier;
    const magnetRange = store.magnetRange;
    const activePowerup = store.activePowerup;
    const isInvincible = store.isInvincible;
    const isFlying = store.isFlying;
    const isSliding = store.isSliding;



    const stage = STAGES[store.currentStage];
    let boss = store.boss;

    // Obstacles loop
    const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);

    // Obstacles loop
    obstacles.forEach((obs, index) => {
      // 1. Basic Movement along Z
      obs.mesh.position.z += gameSpeed;

      // UFO: sin wave + lateral sweep across road
      if (obs.type === 'floating') {
        obs.mesh.position.y = 2.2 + Math.sin(time * 3 + obs.mesh.position.z * 0.1) * 0.5 + store.getSurfaceY(obs.mesh.position.z);
        if (!obs.mesh.userData.ufoSwayDir) {
          obs.mesh.userData.ufoSwayDir = Math.random() > 0.5 ? 1 : -1;
          obs.mesh.userData.ufoSwaySpeed = 0.04 + Math.random() * 0.02;
          obs.mesh.userData.ufoSwayDist = 0;
          obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
          obs.mesh.userData.driftX = 0;
        }
        obs.mesh.userData.driftX += obs.mesh.userData.ufoSwayDir * obs.mesh.userData.ufoSwaySpeed;
        obs.mesh.userData.ufoSwayDist += obs.mesh.userData.ufoSwaySpeed;
        if (obs.mesh.userData.ufoSwayDist >= obs.mesh.userData.ufoSwayMaxDist) {
          obs.mesh.userData.ufoSwayDir *= -1;
          obs.mesh.userData.ufoSwayDist = 0;
          obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
        }
        const maxDriftUFO = laneWidth * 1.5;
        if (obs.mesh.userData.driftX < -maxDriftUFO) obs.mesh.userData.ufoSwayDir = 1;
        else if (obs.mesh.userData.driftX > maxDriftUFO) obs.mesh.userData.ufoSwayDir = -1;
      }
      
      // Barrel: roll across street like a log on its side
      if (obs.obstacleType === 'barrel' && obs.mesh.userData.driftDir) {
        obs.mesh.userData.driftX = (obs.mesh.userData.driftX || 0) + obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed;
        const maxDriftBarrel = laneWidth * 1.2;
        if (obs.mesh.userData.driftX < -maxDriftBarrel || obs.mesh.userData.driftX > maxDriftBarrel) {
          obs.mesh.userData.driftDir *= -1;
        }
        const barrelInner = obs.mesh.userData.barrelGroup || obs.mesh.children[0];
        if (barrelInner) {
          barrelInner.rotation.z -= obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed * 8;
        }
      }

      // Red car / bus / fireengine: move forward or backward at noticeable speed (slower than player)
      if (obs.obstacleType === 'car' || obs.obstacleType === 'bus' || obs.obstacleType === 'fireengine') {
        if (!obs.mesh.userData.lungeTimer) {
          obs.mesh.userData.lungeTimer = Math.random() * 3;
          obs.mesh.userData.lungeDir = Math.random() > 0.5 ? 1 : -1;
          obs.mesh.userData.lungeSpeed = 0.02 + Math.random() * 0.03;
        }
        obs.mesh.userData.lungeTimer -= delta;
        if (obs.mesh.userData.lungeTimer <= 0) {
          obs.mesh.userData.lungeDir *= -1;
          obs.mesh.userData.lungeTimer = 1.5 + Math.random() * 2;
        }
        obs.mesh.position.z += obs.mesh.userData.lungeDir * obs.mesh.userData.lungeSpeed;
      }
      
      // Police car: 90° across the road, slides left or right across lanes
      if (obs.obstacleType === 'police') {
        if (!obs.mesh.userData.policeDir) {
          obs.mesh.userData.policeDir = Math.random() > 0.5 ? 1 : -1;
          obs.mesh.userData.policeSpeed = 0.05 * difficultyMultiplier;
          obs.mesh.userData.driftX = 0;
        }
        obs.mesh.userData.driftX += obs.mesh.userData.policeDir * obs.mesh.userData.policeSpeed * delta * 60;
        const maxDrift = laneWidth * 2;
        if (obs.mesh.userData.driftX < -maxDrift) {
          obs.mesh.userData.policeDir = 1;
        } else if (obs.mesh.userData.driftX > maxDrift) {
          obs.mesh.userData.policeDir = -1;
        }

        const sirenR = obs.mesh.getObjectByName('siren-red');
        const sirenB = obs.mesh.getObjectByName('siren-blue');
        if (sirenR && sirenB) {
          const flash = Math.sin(time * 15) > 0;
          sirenR.material.color.setHex(flash ? 0xff0000 : 0x440000);
          sirenB.material.color.setHex(flash ? 0x000044 : 0x0000ff);
        }
      }

      // 2. Set Final Position
      const baseX = obs.mesh.userData.baseX !== undefined ? obs.mesh.userData.baseX : ((obs.lane - 1) * laneWidth);
      const laneX = baseX + store.getCurveX(obs.mesh.position.z);
      const driftOffset = obs.mesh.userData.driftX || 0;
      obs.mesh.position.x = laneX + driftOffset;
      if (obs.type !== 'floating') {
        obs.mesh.position.y = (obs.mesh.baseY || 0) + store.getSurfaceY(obs.mesh.position.z);
      }
      obs.mesh.rotation.x = store.getSurfaceTilt(obs.mesh.position.z);

      // 3. Align Rotations
      if (obs.mesh.userData.baseRotY === undefined) {
        obs.mesh.userData.baseRotY = obs.mesh.rotation.y;
      }
      const curveSlope = store.getCurveSlope(obs.mesh.position.z);
      
      if (obs.type === 'floating') {
        obs.mesh.rotation.y += 0.08;
      } else if (obs.obstacleType === 'fruit') {
        obs.mesh.rotation.y += 0.05;
      } else {
        obs.mesh.rotation.y = obs.mesh.userData.baseRotY + curveSlope;
      }

      if (store.gameOver || countdownLocked || store.stageTransitioning || (store.gameStartTime && Date.now() - store.gameStartTime < 2000)) return;
      const dx = player.position.x - obs.mesh.position.x;
      const dz = player.position.z - obs.mesh.position.z;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      const collisionDist = obs.hitWidth || 1.5;

      // Near miss detection
      if (!obs.nearMissTriggered && horizDist < collisionDist + 0.4 && horizDist >= collisionDist && Math.abs(dz) < 1.0) {
        obs.nearMissTriggered = true;
        store.nearMissCount++;
        store.score += 25;
        store.nearMissTextRef = 'CLOSE CALL! +25 🔥';
        store.nearMissTimer = 1.0;
        store.nearMissCountRef = store.nearMissCount;
      }

      const hitGroundObs = obs.type !== 'floating' && player.position.y < 1.0 && !isFlying;
      const hitFloatingObs = obs.type === 'floating' && !isSliding;
      
      if (horizDist < collisionDist && (hitGroundObs || hitFloatingObs)) {
        if (obs.obstacleType === 'slippery' && !store.isSlippery) {
          store.isSlippery = true;
          store.slipperyTimer = 1.5;
          store.slideVelocity = gameSpeed * 1.3;
          store.createFloatingText('SLIPPERY!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ffff00');
          store.playSound('slip');
          obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
          scene.remove(obs.mesh);
          obstacles.splice(index, 1);
          return;
        }
        
        if (isInvincible || store.godMode) {
          if (store.godMode) {
            obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
            scene.remove(obs.mesh);
            obstacles.splice(index, 1);
            return;
          }
          store.playSound('shield_hit');
          store.createParticleEffect(obs.mesh.position, 0x00bfff, 15);
          store.deactivatePowerup();
          obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
          scene.remove(obs.mesh);
          obstacles.splice(index, 1);
        } else {
          // Only Stage 2 medieval metalBeam gets the metal clang; everything else uses default crash
          if (store.currentStage === 1 && obs.obstacleType === 'metalBeam') {
            store.playSound('crash_metal');
          } else {
            store.playSound('crash');
          }
          store.triggerGameOver(0.5);
        }
      }

      if (obs.mesh.position.z > 15) {
        obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
        scene.remove(obs.mesh);
        obstacles.splice(index, 1);
      }
    });

    // Coins loop
    coins.forEach((coin, index) => {
      if (coin.collected) return;
      const dist = player.position.distanceTo(coin.mesh.position);
      
      if (magnetRange > 0 && activePowerup === 'magnet' && dist < magnetRange) {
        const direction = new THREE.Vector3().subVectors(player.position, coin.mesh.position).normalize();
        coin.mesh.position.add(direction.multiplyScalar(0.8));
      } else {
        coin.mesh.position.z += gameSpeed;
        coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + store.getCurveX(coin.mesh.position.z);
      }
      
      coin.mesh.position.y = (coin.mesh.baseY || 0.5) + store.getSurfaceY(coin.mesh.position.z);
      coin.mesh.rotation.x = store.getSurfaceTilt(coin.mesh.position.z);
      coin.mesh.rotation.y += 0.1;
      
      if (dist < 1.2) {
        coin.collected = true;
        store.comboCount++;
        if (store.comboCount > gameStats.maxCombo) gameStats.maxCombo = store.comboCount;
        const now = Date.now();
        const comboBonus = store.comboCount > 1 && (now - store.lastCoinTime) < 1000 ? store.comboCount * 10 : 0;
        store.score += (100 + comboBonus) * scoreMultiplier;
        store.lastCoinTime = now;
        gameStats.totalCoins++;
        
        store.createParticleEffect(coin.mesh.position, 0xffd700, 15);
        store.createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), coin.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        store.playSound('coin', 0.9 + Math.random() * 0.2);
        
        scene.remove(coin.mesh);
        coins.splice(index, 1);
      } else if (coin.mesh.position.z > 15) {
        scene.remove(coin.mesh);
        coins.splice(index, 1);
      }
    });

    // Bonus coins loop
    if (store.bonusCoins && store.bonusCoins.length > 0) {
      store.bonusCoins.forEach((bc, index) => {
        if (bc.collected) return;
        const dist = player.position.distanceTo(bc.mesh.position);
        
        bc.mesh.position.z += gameSpeed;
        bc.mesh.position.x = (bc.baseX || 0) + store.getCurveX(bc.mesh.position.z);
        bc.mesh.position.y = 0.5 + store.getSurfaceY(bc.mesh.position.z);
        bc.mesh.rotation.x = store.getSurfaceTilt(bc.mesh.position.z);
        bc.mesh.rotation.y += 0.1;
        
        if (dist < 1.2) {
          bc.collected = true;
          store.comboCount++;
          if (store.comboCount > gameStats.maxCombo) gameStats.maxCombo = store.comboCount;
          const now = Date.now();
          const comboBonus = store.comboCount > 1 && (now - store.lastCoinTime) < 1000 ? store.comboCount * 10 : 0;
          store.score += (100 + comboBonus) * scoreMultiplier;
          store.lastCoinTime = now;
          gameStats.totalCoins++;
          
          store.createParticleEffect(bc.mesh.position, 0xffd700, 15);
          store.createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), bc.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
          store.playSound('coin', 0.9 + Math.random() * 0.2);
          
          scene.remove(bc.mesh);
          store.bonusCoins.splice(index, 1);
        } else if (bc.mesh.position.z > 15) {
          scene.remove(bc.mesh);
          store.bonusCoins.splice(index, 1);
        }
      });
    }


    // Powerups loop
    powerups.forEach((pw, index) => {
      if (pw.collected) return;
      pw.mesh.position.z += gameSpeed;
      pw.mesh.position.x = ((pw.lane - 1) * laneWidth) + store.getCurveX(pw.mesh.position.z);
      pw.mesh.position.y = (pw.mesh.baseY || 1) + store.getSurfaceY(pw.mesh.position.z);
      pw.mesh.rotation.x = store.getSurfaceTilt(pw.mesh.position.z);
      pw.mesh.rotation.y += 0.15;

      const dist = player.position.distanceTo(pw.mesh.position);
      if (dist < 1.2) {
        pw.collected = true;
        gameStats.powerupsCollected++;
        store.activatePowerup(pw.type);
        if (store.currentStage === 2) store.playSound('assembly');
        else store.playSound('powerup', 0.9 + Math.random() * 0.2);
        
        store.createParticleEffect(pw.mesh.position, pw.type === 'shield' ? 0x00bfff : 0x9932cc, 20);
        store.createFloatingText(pw.type === 'shield' ? '🛡️ SHIELD' : (pw.type === 'coldDrink' ? '🥤 SLOW' : '🧲 MAGNET'), pw.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        
        scene.remove(pw.mesh);
        powerups.splice(index, 1);
      } else if (pw.mesh.position.z > 15) {
        scene.remove(pw.mesh);
        powerups.splice(index, 1);
      }
    });

    // Clouds drifting
    clouds.forEach((cloud) => {
      cloud.position.z += 0.02;
      if (cloud.position.z > 10) {
        cloud.position.z = -60 - Math.random() * 20;
        cloud.position.x = (Math.random() - 0.5) * 40;
      }
    });

    // Trees drifting
    trees.forEach((tree) => {
      tree.position.z += gameSpeed;
      tree.position.x = (tree.baseX || 0) + store.getCurveX(tree.position.z);
      tree.position.y = (tree.baseY || 0) + store.getSurfaceY(tree.position.z);
      if (tree.position.z > 10) {
        const side = (tree.baseX || 0) > 0 ? 1 : -1;
        tree.position.z = -Math.random() * 80;
        // Trees/Skyscrapers zone (7.5 to 11.0)
        tree.baseX = side * (7.5 + Math.random() * 3.5);
        tree.position.x = tree.baseX + store.getCurveX(tree.position.z);
        tree.position.y = (tree.baseY || 0) + store.getSurfaceY(tree.position.z);
      }
    });

    // Buildings drifting
    buildings.forEach((building) => {
      building.position.z += gameSpeed;
      building.position.x = (building.baseX || 0) + store.getCurveX(building.position.z);
      building.position.y = (building.baseY || 0) + store.getSurfaceY(building.position.z);
      building.rotation.x = store.getSurfaceTilt(building.position.z);
      if (building.position.z > 20) {
        const side = (building.baseX || 0) > 0 ? 1 : -1;
        building.position.z = -20 - Math.random() * 60;
        // Buildings zone (14.5 to 23.0)
        building.baseX = side * (14.5 + Math.random() * 8.5);
        building.position.x = building.baseX + store.getCurveX(building.position.z);
        building.position.y = (building.baseY || 0) + store.getSurfaceY(building.position.z);
      }
    });

    // Medieval flowers scrolling (Stage 2 only)
    if (store.currentStage === 1 && medievalFlowers) {
      medievalFlowers.forEach((flower) => {
        flower.position.z += gameSpeed;
        flower.position.x = flower.userData.baseX + store.getCurveX(flower.position.z);
        if (flower.position.z > 10) {
          flower.position.z = -Math.random() * 80;
          flower.userData.baseX = (flower.userData.baseX > 0 ? 1 : -1) * (4 + Math.random() * 2);
          flower.position.x = flower.userData.baseX + store.getCurveX(flower.position.z);
        }
      });
    }

    // Particles updates
    particles.forEach((p, idx) => {
      if (p.userData && p.userData.velocity) {
        p.position.add(p.userData.velocity);
        p.userData.life -= delta;
        if (p.userData.life <= 0) {
          scene.remove(p);
          particles.splice(idx, 1);
        }
      } else {
        scene.remove(p);
        particles.splice(idx, 1);
      }
    });

    // Floating texts updates
    floatingTexts.forEach((t, idx) => {
      if (t.userData && t.userData.velocity) {
        t.position.add(t.userData.velocity);
        t.userData.life -= delta;
        if (t.userData.life <= 0) {
          scene.remove(t);
          floatingTexts.splice(idx, 1);
        }
      } else {
        scene.remove(t);
        floatingTexts.splice(idx, 1);
      }
    });

    // Boss updates
    if (store.bossActive && boss && !store.bossDefeated) {
      const isMeatball = stage.id === 3;
      const isDragon = stage.id === 2;
      
      if (isMeatball) {
        boss.position.z = -60;
        boss.position.x = Math.sin(time * 2.0) * laneWidth;
        const tentacles = boss.userData.tentacles || [];
        tentacles.forEach(tentacle => {
          const offset = tentacle.userData.offset;
          tentacle.rotation.z = tentacle.userData.baseAngle + Math.sin(time * 5 + offset) * 0.25;
        });
      } else if (isDragon) {
        boss.position.z = -60;
        boss.position.x = Math.sin(time * 1.5) * laneWidth;
        boss.position.y = 4.0 + Math.sin(time * 2.5) * 1.2 + store.getSurfaceY(boss.position.z);
      } else {
        // Truck Boss (Stage 1) - Sudden physics-based ramping charge and immediate snap-back
        if (store.bossCharging) {
          store.bossState = 'charging';
          store.bossChargeTimer += delta;
          
          const difficultyMultiplier = 1 + (store.gameDuration / 120); // slower scaling so early charges are manageable
          const chargeSpeed = gameSpeed * 0.9 * difficultyMultiplier; // Controlled ramp — fast enough to be threatening, not instant
          boss.position.z += chargeSpeed;
          
          const startZ = boss.userData.chargeStartZ || -60;
          const startXX = boss.userData.chargeStartX || boss.position.x;
          const targetX = boss.userData.chargeTargetX || 0;
          const totalDist = Math.abs(0 - startZ);
          const traveled = Math.abs(boss.position.z - startZ);
          const progress = Math.min(traveled / totalDist, 1);
          
          boss.position.x = startXX + (targetX - startXX) * progress;
          boss.position.x = Math.max(-laneWidth * 1.5, Math.min(laneWidth * 1.5, boss.position.x));
          boss.position.y = store.getSurfaceY(boss.position.z);
          
          if (boss.position.z > 5 || store.bossChargeTimer > 4.0) {
            store.bossCharging = false;
            store.bossState = 'idle';
            store.bossChargeTimer = 0;
            boss.position.z = -60; // Snap back to unified idle Z
            store.createFloatingText('ARMORED!', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444');
          }
        } else {
          // Idle state
          boss.position.z = -60;
          boss.position.x = Math.sin(time * 1.0) * laneWidth;
          store.bossState = 'idle';
          boss.position.y = store.getSurfaceY(boss.position.z);
        }
      }
      
      store.bossAttackTimer += delta;
      if (store.bossAttackTimer >= store.bossNextAttack) {
        gameBoss.spawnBossProjectile(stage.id === 1 ? 'truck' : (stage.id === 3 ? 'giantMeatball' : 'dragon'));
        store.bossAttackTimer = 0;
        store.bossNextAttack = 2 + Math.random() * 2;
      }
      
      if (!countdownLocked && !store.stageTransitioning && !store.gameOver) {
        const bossDX = player.position.x - boss.position.x;
        const bossDZ = player.position.z - boss.position.z;
        const dist = Math.sqrt(bossDX * bossDX + bossDZ * bossDZ);
        if (dist < 1.8) { // Tighter hitbox — player must visually touch the boss to die
          const hasShield = (activePowerup === 'shield' || isInvincible || store.godMode);
          if (hasShield) {
            if (!store.bossDefeated && store.bossHealth > 0) {
              store.bossHealth -= 25;
              if (!store.godMode) {
                store.deactivatePowerup();
              }
              store.playSound('shield_hit');
              store.createParticleEffect(boss.position, 0xff0055, 30);
              store.createFloatingText('BOSS HIT! -25', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff0055');
              
              // Snap truck boss immediately back to Z = -60 on shield hits
              if (stage.id === 1) {
                store.bossCharging = false;
                store.bossState = 'idle';
                store.bossChargeTimer = 0;
                boss.position.z = -60;
              }
              
              if (store.bossHealth <= 0) {
                store.bossDefeated = true;
                store.playSound('victory');
                store.createFloatingText('BOSS DEFEATED!', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffd700');
                timer.setTimeout(() => {
                  scene.remove(boss);
                  store.boss = null;
                  store.bossActive = false;
                  
                  store.stageTime = 0;
                  store.currentStage = (store.currentStage + 1) % STAGES.length;
                  gameScene.applyStageVisuals(store.currentStage);
                  store.startStageCountdown();
                }, BOSS_DEFEAT_DELAY);
              }
            }
          } else {
            store.playSound('crash');
            store.triggerGameOver(0.8);
          }
        }
      }
    }

    // Boss projectiles loop
    bossProjectiles.forEach((proj, idx) => {
      const isBeam = proj.userData && proj.userData.isBeam;
      
      if (isBeam) {
        proj.position.z += gameSpeed * 1.2;
        proj.rotation.z += proj.userData.rotationSpeed || 0.1;
        
        // Precise drop within z in [-18, -10]
        const dropStart = -18;
        const dropEnd = -10;
        let t = 0;
        if (proj.position.z < dropStart) {
          t = 0;
        } else if (proj.position.z > dropEnd) {
          t = 1;
        } else {
          t = (proj.position.z - dropStart) / (dropEnd - dropStart);
        }
        proj.position.y = (8 * (1 - t) + 0.5 * t) + store.getSurfaceY(proj.position.z);
      } else {
        proj.position.z += gameSpeed * 1.5;
        proj.position.y = (proj.userData.targetY || 0.5) + store.getSurfaceY(proj.position.z);
      }
      
      const dx = player.position.x - proj.position.x;
      const dz = player.position.z - proj.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      const projHitRadius = isBeam ? 0.8 : 0.5;
      const verticalOverlap = isBeam
        ? (proj.position.y >= player.position.y - 1.2 && proj.position.y <= player.position.y + 1.5)
        : (proj.position.y >= player.position.y - 0.9 && proj.position.y <= player.position.y + 1.2);
      
      if (dist < projHitRadius && verticalOverlap && !countdownLocked && !store.stageTransitioning && !store.gameOver) {
        if (isInvincible || store.godMode) {
          if (!store.godMode) store.playSound('shield_hit');
          store.createParticleEffect(proj.position, 0x00bfff, 15);
          store.deactivatePowerup();
          scene.remove(proj);
          bossProjectiles.splice(idx, 1);
        } else {
          store.playSound('crash');
          store.triggerGameOver(0.8);
        }
      } else if (proj.position.z > 15) {
        scene.remove(proj);
        bossProjectiles.splice(idx, 1);
      }
    });

    // Portal drifting & collision
    if (store.bonusPortal && store.bonusPortal.mesh) {
      const portal = store.bonusPortal;
      portal.mesh.position.z += gameSpeed;
      portal.mesh.position.x = ((portal.lane - 1) * laneWidth) + store.getCurveX(portal.mesh.position.z);
      portal.mesh.position.y = 1.5 + store.getSurfaceY(portal.mesh.position.z);
      
      const ring = portal.mesh.getObjectByName('portal-ring');
      if (ring) ring.rotation.z += 0.05;
      const inner = portal.mesh.getObjectByName('portal-inner');
      if (inner) inner.rotation.z -= 0.03;
      
      if (!store.gameOver && !countdownLocked && !store.stageTransitioning) {
        const dx = player.position.x - portal.mesh.position.x;
        const dz = player.position.z - portal.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5 && !store.inBonusZone) {
          if (store.enterBonusZone) {
            store.enterBonusZone();
          }
          scene.remove(portal.mesh);
          store.bonusPortal = null;
        }
      }
      
      if (portal.mesh && portal.mesh.position.z > 15) {
        scene.remove(portal.mesh);
        store.bonusPortal = null;
      }
    }

    // Bonus Zone Timer ticking down
    if (store.inBonusZone) {
      store.bonusTimer -= delta;
      store.bonusTimerRef = Math.max(0, Math.ceil(store.bonusTimer));
      if (store.bonusTimer <= 0) {
        if (store.exitBonusZone) {
          store.exitBonusZone();
        }
      }
    }

    // Nyan Cat animation
    if (scene.userData.nyanCat) {
      scene.userData.nyanCatTime += delta * 8; // speed across sky
      const nyanX = -30 + scene.userData.nyanCatTime; // fly RIGHT
      scene.userData.nyanCat.position.x = nyanX;
      scene.userData.nyanCat.position.y = 10 + Math.sin(scene.userData.nyanCatTime * 2) * 0.5; // gentle bob
      // Loop: when off-screen right, restart from left
      if (nyanX > 30) {
        scene.userData.nyanCatTime = 0;
        scene.userData.nyanCat.position.x = -30;
      }
    }

    // Road and grass texture rolling visual effect
    const roadMesh = scene.getObjectByName('road') || store.roadMesh;
    if (roadMesh && roadMesh.material && roadMesh.material.map) {
      roadMesh.material.map.offset.y += (gameSpeed / 20.0);
      roadMesh.material.map.offset.y %= 1.0;
    }
    const grassMesh = store.grassMesh;
    if (grassMesh && grassMesh.material && grassMesh.material.map) {
      grassMesh.material.map.offset.y += (gameSpeed / 8.0);
      grassMesh.material.map.offset.y %= 1.0;
    }

    // Camera smoothing
    camera.position.x += (0 - camera.position.x) * 0.05;
    camera.position.y += (6 - camera.position.y) * 0.05;
    camera.position.z += (12 - camera.position.z) * 0.05;
  };

  return {
    updateEntities
  };
}
