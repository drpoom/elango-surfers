import * as THREE from 'three';
import { laneWidth } from '../gameConstants.js';

export function useGameUpdates({
  getCtx,
  getSurfaceY,
  getSurfaceTilt,
  getCurveX,
  getCurveSlope,
  playSound,
  createFloatingText,
  createParticleEffect,
  deactivatePowerup,
  activatePowerup,
  triggerGameOver,
  startStageCountdown,
  gameScene,
  gameBoss,
  STAGES
}) {
  const updateEntities = (delta, time) => {
    const ctx = getCtx();
    const obstacles = ctx.obstacles;
    const coins = ctx.coins;
    const powerups = ctx.powerups;
    const clouds = ctx.clouds;
    const trees = ctx.trees;
    const buildings = ctx.buildings;
    const medievalFlowers = ctx.medievalFlowers;
    const particles = ctx.particles;
    const floatingTexts = ctx.floatingTexts;
    const bossProjectiles = ctx.bossProjectiles;
    const player = ctx.player;
    const scene = ctx.scene;
    const camera = ctx.camera;
    const gameSpeed = ctx.gameSpeed;
    const gameDuration = ctx.gameDuration;
    const gameOver = {
      get value() { return ctx.gameOver; },
      set value(v) { ctx.gameOver = v; }
    };
    const countdownLocked = ctx.countdownLocked;
    const stageTransitioning = {
      get value() { return ctx.stageTransitioning; },
      set value(v) { ctx.stageTransitioning = v; }
    };
    const gameStats = ctx.gameStats || { maxCombo: 0, totalCoins: 0, powerupsCollected: 0 };
    const comboCount = {
      get value() { return ctx.comboCount; },
      set value(v) { ctx.comboCount = v; }
    };
    const score = {
      get value() { return ctx.score; },
      set value(v) { ctx.score = v; }
    };
    const scoreMultiplier = ctx.scoreMultiplier;
    const lastCoinTime = {
      get value() { return ctx.lastCoinTime; },
      set value(v) { ctx.lastCoinTime = v; }
    };
    const magnetRange = ctx.magnetRange;
    const activePowerup = ctx.activePowerup;
    const isSlippery = {
      get value() { return ctx.isSlippery; },
      set value(v) { ctx.isSlippery = v; }
    };
    const slipperyTimer = {
      get value() { return ctx.slipperyTimer; },
      set value(v) { ctx.slipperyTimer = v; }
    };
    const slideVelocity = {
      get value() { return ctx.slideVelocity; },
      set value(v) { ctx.slideVelocity = v; }
    };
    const isInvincible = ctx.isInvincible;
    const godMode = {
      get value() { return ctx.godMode; }
    };
    const currentStage = {
      get value() { return ctx.currentStage; },
      set value(v) { ctx.currentStage = v; }
    };
    const isFlying = ctx.isFlying;
    const isSliding = ctx.isSliding;

    const nearMissCount = {
      get value() { return ctx.nearMissCount; },
      set value(v) { ctx.nearMissCount = v; }
    };
    const nearMissTimer = {
      get value() { return ctx.nearMissTimer; },
      set value(v) { ctx.nearMissTimer = v; }
    };
    const nearMissTextRef = {
      get value() { return ctx.nearMissTextRef; },
      set value(v) { ctx.nearMissTextRef = v; }
    };
    const nearMissCountRef = {
      get value() { return ctx.nearMissCountRef; },
      set value(v) { ctx.nearMissCountRef = v; }
    };

    const bossActive = {
      get value() { return ctx.bossActive; },
      set value(v) { ctx.bossActive = v; }
    };
    const bossDefeated = {
      get value() { return ctx.bossDefeated; },
      set value(v) { ctx.bossDefeated = v; }
    };
    const bossHealth = {
      get value() { return ctx.bossHealth; },
      set value(v) { ctx.bossHealth = v; }
    };
    const bossAttackTimer = {
      get value() { return ctx.bossAttackTimer; },
      set value(v) { ctx.bossAttackTimer = v; }
    };
    const bossNextAttack = {
      get value() { return ctx.bossNextAttack; },
      set value(v) { ctx.bossNextAttack = v; }
    };
    const bossDefeatTimeout1 = {
      get value() { return ctx.bossDefeatTimeout1; },
      set value(v) { ctx.bossDefeatTimeout1 = v; }
    };
    const stageTime = {
      get value() { return ctx.stageTime; },
      set value(v) { ctx.stageTime = v; }
    };

    const stage = STAGES[currentStage.value];
    let boss = ctx.boss;

    // Obstacles loop
    const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);

    // Obstacles loop
    obstacles.forEach((obs, index) => {
      // 1. Basic Movement along Z
      obs.mesh.position.z += gameSpeed;

      // UFO: sin wave + lateral sweep across road
      if (obs.type === 'floating') {
        obs.mesh.position.y = 2.2 + Math.sin(time * 3 + obs.mesh.position.z * 0.1) * 0.5 + getSurfaceY(obs.mesh.position.z);
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
      const laneX = baseX + getCurveX(obs.mesh.position.z);
      const driftOffset = obs.mesh.userData.driftX || 0;
      obs.mesh.position.x = laneX + driftOffset;
      if (obs.type !== 'floating') {
        obs.mesh.position.y = (obs.mesh.baseY || 0) + getSurfaceY(obs.mesh.position.z);
      }
      obs.mesh.rotation.x = getSurfaceTilt(obs.mesh.position.z);

      // 3. Align Rotations
      if (obs.mesh.userData.baseRotY === undefined) {
        obs.mesh.userData.baseRotY = obs.mesh.rotation.y;
      }
      const curveSlope = getCurveSlope(obs.mesh.position.z);
      
      if (obs.type === 'floating') {
        obs.mesh.rotation.y += 0.08;
      } else if (obs.obstacleType === 'fruit') {
        obs.mesh.rotation.y += 0.05;
      } else {
        obs.mesh.rotation.y = obs.mesh.userData.baseRotY + curveSlope;
      }

      if (gameOver.value || countdownLocked || stageTransitioning.value || (ctx.gameStartTime && Date.now() - ctx.gameStartTime < 2000)) return;
      const dx = player.position.x - obs.mesh.position.x;
      const dz = player.position.z - obs.mesh.position.z;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      const collisionDist = obs.hitWidth || 1.5;

      // Near miss detection
      if (!obs.nearMissTriggered && horizDist < collisionDist + 0.4 && horizDist >= collisionDist && Math.abs(dz) < 1.0) {
        obs.nearMissTriggered = true;
        nearMissCount.value++;
        score.value += 25;
        nearMissTextRef.value = 'CLOSE CALL! +25 🔥';
        nearMissTimer.value = 1.0;
        nearMissCountRef.value = nearMissCount.value;
      }

      const hitGroundObs = obs.type !== 'floating' && player.position.y < 1.0 && !isFlying;
      const hitFloatingObs = obs.type === 'floating' && !isSliding;
      
      if (horizDist < collisionDist && (hitGroundObs || hitFloatingObs)) {
        if (obs.obstacleType === 'slippery' && !isSlippery.value) {
          isSlippery.value = true;
          slipperyTimer.value = 1.5;
          slideVelocity.value = gameSpeed * 1.3;
          createFloatingText('SLIPPERY!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ffff00');
          playSound('slip');
          obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
          scene.remove(obs.mesh);
          obstacles.splice(index, 1);
          return;
        }
        
        if (isInvincible || godMode.value) {
          if (godMode.value) {
            obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
            scene.remove(obs.mesh);
            obstacles.splice(index, 1);
            return;
          }
          playSound('shield_hit');
          createParticleEffect(obs.mesh.position, 0x00bfff, 15);
          deactivatePowerup();
          obs.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
          scene.remove(obs.mesh);
          obstacles.splice(index, 1);
        } else {
          // Only Stage 2 medieval metalBeam gets the metal clang; everything else uses default crash
          if (currentStage.value === 1 && obs.obstacleType === 'metalBeam') {
            playSound('crash_metal');
          } else {
            playSound('crash');
          }
          triggerGameOver(0.5);
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
        coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
      }
      
      coin.mesh.position.y = (coin.mesh.baseY || 0.5) + getSurfaceY(coin.mesh.position.z);
      coin.mesh.rotation.x = getSurfaceTilt(coin.mesh.position.z);
      coin.mesh.rotation.y += 0.1;
      
      if (dist < 1.2) {
        coin.collected = true;
        comboCount.value++;
        if (comboCount.value > gameStats.maxCombo) gameStats.maxCombo = comboCount.value;
        const now = Date.now();
        const comboBonus = comboCount.value > 1 && (now - lastCoinTime.value) < 1000 ? comboCount.value * 10 : 0;
        score.value += (100 + comboBonus) * scoreMultiplier;
        lastCoinTime.value = now;
        gameStats.totalCoins++;
        
        createParticleEffect(coin.mesh.position, 0xffd700, 15);
        createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), coin.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        playSound('coin', 0.9 + Math.random() * 0.2);
        
        scene.remove(coin.mesh);
        coins.splice(index, 1);
      } else if (coin.mesh.position.z > 15) {
        scene.remove(coin.mesh);
        coins.splice(index, 1);
      }
    });

    // Bonus coins loop
    if (ctx.bonusCoins && ctx.bonusCoins.length > 0) {
      ctx.bonusCoins.forEach((bc, index) => {
        if (bc.collected) return;
        const dist = player.position.distanceTo(bc.mesh.position);
        
        bc.mesh.position.z += gameSpeed;
        bc.mesh.position.x = (bc.baseX || 0) + getCurveX(bc.mesh.position.z);
        bc.mesh.position.y = 0.5 + getSurfaceY(bc.mesh.position.z);
        bc.mesh.rotation.x = getSurfaceTilt(bc.mesh.position.z);
        bc.mesh.rotation.y += 0.1;
        
        if (dist < 1.2) {
          bc.collected = true;
          comboCount.value++;
          if (comboCount.value > gameStats.maxCombo) gameStats.maxCombo = comboCount.value;
          const now = Date.now();
          const comboBonus = comboCount.value > 1 && (now - lastCoinTime.value) < 1000 ? comboCount.value * 10 : 0;
          score.value += (100 + comboBonus) * scoreMultiplier;
          lastCoinTime.value = now;
          gameStats.totalCoins++;
          
          createParticleEffect(bc.mesh.position, 0xffd700, 15);
          createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), bc.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
          playSound('coin', 0.9 + Math.random() * 0.2);
          
          scene.remove(bc.mesh);
          ctx.bonusCoins.splice(index, 1);
        } else if (bc.mesh.position.z > 15) {
          scene.remove(bc.mesh);
          ctx.bonusCoins.splice(index, 1);
        }
      });
    }


    // Powerups loop
    powerups.forEach((pw, index) => {
      if (pw.collected) return;
      pw.mesh.position.z += gameSpeed;
      pw.mesh.position.x = ((pw.lane - 1) * laneWidth) + getCurveX(pw.mesh.position.z);
      pw.mesh.position.y = (pw.mesh.baseY || 1) + getSurfaceY(pw.mesh.position.z);
      pw.mesh.rotation.x = getSurfaceTilt(pw.mesh.position.z);
      pw.mesh.rotation.y += 0.15;

      const dist = player.position.distanceTo(pw.mesh.position);
      if (dist < 1.2) {
        pw.collected = true;
        gameStats.powerupsCollected++;
        activatePowerup(pw.type);
        if (currentStage.value === 2) playSound('assembly');
        else playSound('powerup', 0.9 + Math.random() * 0.2);
        
        createParticleEffect(pw.mesh.position, pw.type === 'shield' ? 0x00bfff : 0x9932cc, 20);
        createFloatingText(pw.type === 'shield' ? '🛡️ SHIELD' : (pw.type === 'coldDrink' ? '🥤 SLOW' : '🧲 MAGNET'), pw.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        
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
      tree.position.x = (tree.baseX || 0) + getCurveX(tree.position.z);
      tree.position.y = (tree.baseY || 0) + getSurfaceY(tree.position.z);
      if (tree.position.z > 10) {
        const side = (tree.baseX || 0) > 0 ? 1 : -1;
        tree.position.z = -Math.random() * 80;
        // Trees/Skyscrapers zone (7.5 to 11.0)
        tree.baseX = side * (7.5 + Math.random() * 3.5);
        tree.position.x = tree.baseX + getCurveX(tree.position.z);
        tree.position.y = (tree.baseY || 0) + getSurfaceY(tree.position.z);
      }
    });

    // Buildings drifting
    buildings.forEach((building) => {
      building.position.z += gameSpeed;
      building.position.x = (building.baseX || 0) + getCurveX(building.position.z);
      building.position.y = (building.baseY || 0) + getSurfaceY(building.position.z);
      building.rotation.x = getSurfaceTilt(building.position.z);
      if (building.position.z > 20) {
        const side = (building.baseX || 0) > 0 ? 1 : -1;
        building.position.z = -20 - Math.random() * 60;
        // Buildings zone (14.5 to 23.0)
        building.baseX = side * (14.5 + Math.random() * 8.5);
        building.position.x = building.baseX + getCurveX(building.position.z);
        building.position.y = (building.baseY || 0) + getSurfaceY(building.position.z);
      }
    });

    // Medieval flowers scrolling (Stage 2 only)
    if (currentStage.value === 1 && medievalFlowers) {
      medievalFlowers.forEach((flower) => {
        flower.position.z += gameSpeed;
        flower.position.x = flower.userData.baseX + getCurveX(flower.position.z);
        if (flower.position.z > 10) {
          flower.position.z = -Math.random() * 80;
          flower.userData.baseX = (flower.userData.baseX > 0 ? 1 : -1) * (4 + Math.random() * 2);
          flower.position.x = flower.userData.baseX + getCurveX(flower.position.z);
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
    if (bossActive.value && boss && !bossDefeated.value) {
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
        boss.position.y = 4.0 + Math.sin(time * 2.5) * 1.2 + getSurfaceY(boss.position.z);
      } else {
        // Truck Boss (Stage 1) - Sudden physics-based ramping charge and immediate snap-back
        if (ctx.bossCharging) {
          ctx.bossState = 'charging';
          ctx.bossChargeTimer += delta;
          
          const difficultyMultiplier = 1 + (ctx.gameDuration / 120); // slower scaling so early charges are manageable
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
          boss.position.y = getSurfaceY(boss.position.z);
          
          if (boss.position.z > 5 || ctx.bossChargeTimer > 4.0) {
            ctx.bossCharging = false;
            ctx.bossState = 'idle';
            ctx.bossChargeTimer = 0;
            boss.position.z = -60; // Snap back to unified idle Z
            createFloatingText('ARMORED!', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444');
          }
        } else {
          // Idle state
          boss.position.z = -60;
          boss.position.x = Math.sin(time * 1.0) * laneWidth;
          ctx.bossState = 'idle';
          boss.position.y = getSurfaceY(boss.position.z);
        }
      }
      
      bossAttackTimer.value += delta;
      if (bossAttackTimer.value >= bossNextAttack.value) {
        gameBoss.spawnBossProjectile(stage.id === 1 ? 'truck' : (stage.id === 3 ? 'giantMeatball' : 'dragon'));
        bossAttackTimer.value = 0;
        bossNextAttack.value = 2 + Math.random() * 2;
      }
      
      if (!countdownLocked && !stageTransitioning.value && !gameOver.value) {
        const bossDX = player.position.x - boss.position.x;
        const bossDZ = player.position.z - boss.position.z;
        const dist = Math.sqrt(bossDX * bossDX + bossDZ * bossDZ);
        if (dist < 1.8) { // Tighter hitbox — player must visually touch the boss to die
          const hasShield = (activePowerup === 'shield' || isInvincible || godMode.value);
          if (hasShield) {
            if (!bossDefeated.value && bossHealth.value > 0) {
              bossHealth.value -= 25;
              if (!godMode.value) {
                deactivatePowerup();
              }
              playSound('shield_hit');
              createParticleEffect(boss.position, 0xff0055, 30);
              createFloatingText('BOSS HIT! -25', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff0055');
              
              // Snap truck boss immediately back to Z = -60 on shield hits
              if (stage.id === 1) {
                ctx.bossCharging = false;
                ctx.bossState = 'idle';
                ctx.bossChargeTimer = 0;
                boss.position.z = -60;
              }
              
              if (bossHealth.value <= 0) {
                bossDefeated.value = true;
                playSound('victory');
                createFloatingText('BOSS DEFEATED!', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffd700');
                bossDefeatTimeout1.value = setTimeout(() => {
                  scene.remove(boss);
                  ctx.boss = null;
                  bossActive.value = false;
                  
                  stageTime.value = 0;
                  currentStage.value = (currentStage.value + 1) % STAGES.length;
                  gameScene.applyStageVisuals(currentStage.value);
                  startStageCountdown();
                }, 1500);
              }
            }
          } else {
            playSound('crash');
            triggerGameOver(0.8);
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
        proj.position.y = (8 * (1 - t) + 0.5 * t) + getSurfaceY(proj.position.z);
      } else {
        proj.position.z += gameSpeed * 1.5;
        proj.position.y = (proj.userData.targetY || 0.5) + getSurfaceY(proj.position.z);
      }
      
      const dx = player.position.x - proj.position.x;
      const dz = player.position.z - proj.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      const projHitRadius = isBeam ? 0.8 : 0.5;
      const verticalOverlap = isBeam
        ? (proj.position.y >= player.position.y - 1.2 && proj.position.y <= player.position.y + 1.5)
        : (proj.position.y >= player.position.y - 0.9 && proj.position.y <= player.position.y + 1.2);
      
      if (dist < projHitRadius && verticalOverlap && !countdownLocked && !stageTransitioning.value && !gameOver.value) {
        if (isInvincible || godMode.value) {
          if (!godMode.value) playSound('shield_hit');
          createParticleEffect(proj.position, 0x00bfff, 15);
          deactivatePowerup();
          scene.remove(proj);
          bossProjectiles.splice(idx, 1);
        } else {
          playSound('crash');
          triggerGameOver(0.8);
        }
      } else if (proj.position.z > 15) {
        scene.remove(proj);
        bossProjectiles.splice(idx, 1);
      }
    });

    // Portal drifting & collision
    if (ctx.bonusPortal && ctx.bonusPortal.mesh) {
      const portal = ctx.bonusPortal;
      portal.mesh.position.z += gameSpeed;
      portal.mesh.position.x = ((portal.lane - 1) * laneWidth) + getCurveX(portal.mesh.position.z);
      portal.mesh.position.y = 1.5 + getSurfaceY(portal.mesh.position.z);
      
      const ring = portal.mesh.getObjectByName('portal-ring');
      if (ring) ring.rotation.z += 0.05;
      const inner = portal.mesh.getObjectByName('portal-inner');
      if (inner) inner.rotation.z -= 0.03;
      
      if (!gameOver.value && !countdownLocked && !stageTransitioning.value) {
        const dx = player.position.x - portal.mesh.position.x;
        const dz = player.position.z - portal.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5 && !ctx.inBonusZone) {
          if (ctx.enterBonusZone) {
            ctx.enterBonusZone();
          }
          scene.remove(portal.mesh);
          ctx.bonusPortal = null;
        }
      }
      
      if (portal.mesh && portal.mesh.position.z > 15) {
        scene.remove(portal.mesh);
        ctx.bonusPortal = null;
      }
    }

    // Bonus Zone Timer ticking down
    if (ctx.inBonusZone) {
      ctx.bonusTimer -= delta;
      ctx.bonusTimerRef = Math.max(0, Math.ceil(ctx.bonusTimer));
      if (ctx.bonusTimer <= 0) {
        if (ctx.exitBonusZone) {
          ctx.exitBonusZone();
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
    const roadMesh = scene.getObjectByName('road') || ctx.roadMesh;
    if (roadMesh && roadMesh.material && roadMesh.material.map) {
      roadMesh.material.map.offset.y -= (gameSpeed / 20.0);
      roadMesh.material.map.offset.y %= 1.0;
    }
    const grassMesh = ctx.grassMesh;
    if (grassMesh && grassMesh.material && grassMesh.material.map) {
      grassMesh.material.map.offset.y -= (gameSpeed / 8.0);
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
