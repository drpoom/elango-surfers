import { ref } from 'vue';
import * as THREE from 'three';

// Shared geometry/material cache (avoid re-creating per spawn)
let sharedCoinGeo, sharedCoinMat;

/**
 * Composable for managing coin game logic
 * @param {Object} deps - Dependencies injected from App.vue
 */
export function useCoins(deps) {
  const coins = ref([]);

  /**
   * Spawn a coin at a random lane
   */
  function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * deps.laneWidth;
    
    if (!sharedCoinGeo) {
      sharedCoinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
      sharedCoinMat = new THREE.MeshToonMaterial({ 
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
      });
    }
    
    const coinObj = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
    coinObj.castShadow = false;
    coinObj.position.set(laneX, 1, -50);
    
    deps.scene.add(coinObj);
    coinObj.position.y += deps.getSurfaceY(-50);
    coinObj.baseY = coinObj.position.y - deps.getSurfaceY(-50);
    
    coins.value.push({ mesh: coinObj, lane, collected: false });
  }

  /**
   * Update coin positions and handle collection
   * @param {Object} params - All required parameters
   */
  function updateCoins(params) {
    const { 
      coins, player, getSurfaceY, getCurveX, getSurfaceTilt, 
      createParticleEffect, createFloatingText, playSound,
      gameSpeed, obstacles, activePowerup, magnetRange,
      gameStats, score, scoreMultiplier, scene, laneWidth,
      calculateCoinScore, comboCountRef, lastCoinTimeRef
    } = params;

    coins.forEach((coin, index) => {
      if (coin.collected) return;
      
      const dist = player.position.distanceTo(coin.mesh.position);
      
      // Magnet effect - strong pull to player position
      if (magnetRange.value > 0 && activePowerup.value === 'magnet' && dist < magnetRange.value) {
        // Check if there's an obstacle blocking the path
        const hasObstacle = obstacles.value.some(obs => {
          const inSameLane = Math.abs(obs.mesh.position.x - coin.mesh.position.x) < 2;
          const betweenCoinAndPlayer = (
            (obs.mesh.position.z > coin.mesh.position.z && obs.mesh.position.z < player.position.z) ||
            (obs.mesh.position.z < coin.mesh.position.z && obs.mesh.position.z > player.position.z)
          );
          const closeToLine = obs.mesh.position.distanceTo(
            new THREE.Vector3(coin.mesh.position.x, 0, coin.mesh.position.z).lerp(
              new THREE.Vector3(player.position.x, 0, player.position.z),
              0.5
            )
          ) < 1.5;
          return inSameLane && betweenCoinAndPlayer && closeToLine;
        });
        
        if (!hasObstacle) {
          // Strong magnet - coins fly directly to player
          const direction = new THREE.Vector3().subVectors(player.position, coin.mesh.position).normalize();
          const pullSpeed = 0.8;
          coin.mesh.position.add(direction.multiplyScalar(pullSpeed));
          coin.mesh.rotation.y += 0.2;
        } else {
          // Blocked by obstacle - continue normal movement
          coin.mesh.position.z += gameSpeed.value;
          coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
          coin.mesh.rotation.y += 0.1;
        }
      } else {
        // No magnet - normal movement
        coin.mesh.position.z += gameSpeed.value;
        coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
        coin.mesh.rotation.y += 0.1;
      }
      
      coin.mesh.position.y = (coin.mesh.baseY || 0.5) + getSurfaceY(coin.mesh.position.z);
      coin.mesh.rotation.x = getSurfaceTilt(coin.mesh.position.z);
      
      if (dist < 1.2) {
        coin.collected = true;
        comboCountRef.value++;
        if (comboCountRef.value > gameStats.maxCombo) gameStats.maxCombo = comboCountRef.value;
        const { scoreDelta, lastCoinTime: newLastCoinTime } = calculateCoinScore({
          comboCount: comboCountRef.value,
          lastCoinTime: lastCoinTimeRef.value,
          scoreMultiplier: scoreMultiplier.value,
          isInvincible: false,
          gameStats
        });
        lastCoinTimeRef.value = newLastCoinTime;
        score.value += scoreDelta;
        gameStats.totalCoins++;
        
        if (magnetRange.value > 0) gameStats.magnetCoins++;
        
        createParticleEffect(coin.mesh.position, 0xffd700, 15);
        createFloatingText('+' + Math.floor(scoreDelta), coin.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        playSound('coin', 0.9 + Math.random() * 0.2);
        
        scene.remove(coin.mesh);
        coins.splice(index, 1);
      } else if (coin.mesh.position.z > 15) {
        scene.remove(coin.mesh);
        coins.splice(index, 1);
      }
    });
  }

  /**
   * Update bonus coin positions and handle collection
   * @param {Object} params - All required parameters
   */
  function updateBonusCoins(params) {
    const { 
      bonusCoins, player, getSurfaceY, getCurveX, getSurfaceTilt, 
      createParticleEffect, createFloatingText, playSound,
      gameSpeed, gameStats, score, scoreMultiplier, scene,
      calculateCoinScore, comboCountRef, lastCoinTimeRef
    } = params;

    bonusCoins.forEach((bc, index) => {
      if (bc.collected) return;
      
      bc.mesh.position.z += gameSpeed.value;
      bc.mesh.position.x = (bc.baseX || 0) + getCurveX(bc.mesh.position.z);
      bc.mesh.rotation.y += 0.1;
      bc.mesh.position.y = 0.5 + getSurfaceY(bc.mesh.position.z);
      bc.mesh.rotation.x = getSurfaceTilt(bc.mesh.position.z);
      
      const dist = player.position.distanceTo(bc.mesh.position);
      
      if (dist < 1.2) {
        bc.collected = true;
        comboCountRef.value++;
        if (comboCountRef.value > gameStats.maxCombo) gameStats.maxCombo = comboCountRef.value;
        const { scoreDelta, lastCoinTime: newLastCoinTime } = calculateCoinScore({
          comboCount: comboCountRef.value,
          lastCoinTime: lastCoinTimeRef.value,
          scoreMultiplier: scoreMultiplier.value,
          isInvincible: false,
          gameStats
        });
        lastCoinTimeRef.value = newLastCoinTime;
        score.value += scoreDelta;
        gameStats.totalCoins++;
        
        createParticleEffect(bc.mesh.position, 0xffd700, 15);
        createFloatingText('+' + Math.floor(scoreDelta), bc.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        playSound('coin', 0.9 + Math.random() * 0.2);
        
        scene.remove(bc.mesh);
        bonusCoins.splice(index, 1);
      } else if (bc.mesh.position.z > 15) {
        scene.remove(bc.mesh);
        bonusCoins.splice(index, 1);
      }
    });
  }

  /**
   * Remove all coins from scene and clear array
   */
  function cleanupCoins() {
    coins.value.forEach(coin => {
      deps.scene.remove(coin.mesh);
    });
    coins.value = [];
  }

  return {
    coins,
    spawnCoin,
    updateCoins,
    updateBonusCoins,
    cleanupCoins
  };
}
