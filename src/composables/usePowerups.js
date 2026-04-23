import { ref } from 'vue';
import * as THREE from 'three';

/**
 * Composable for managing powerup game logic
 * @param {Object} deps - Dependencies injected from App.vue
 */
export function usePowerups(deps) {
  const powerups = ref([]);

  /**
   * Spawn a powerup at a random lane with random type
   */
  function spawnPowerup() {
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * deps.laneWidth;
    const type = Math.random() < 0.33 ? 'shield' : (Math.random() < 0.5 ? 'speed' : 'magnet');
    
    const powerupGroup = new THREE.Group();
    
    if (type === 'shield') {
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
      
      const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00bfff, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      powerupGroup.add(ring);
    } else if (type === 'speed') {
      const boltGeo = new THREE.ConeGeometry(0.3, 1, 8);
      const boltMat = new THREE.MeshToonMaterial({ 
        color: 0xffd700, 
        emissive: 0xffd700, 
        emissiveIntensity: 0.6 
      });
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.rotation.x = Math.PI / 2;
      powerupGroup.add(bolt);
    } else if (type === 'magnet') {
      const waveGeo = new THREE.TorusGeometry(0.6, 0.1, 8, 16);
      const waveMat = new THREE.MeshToonMaterial({ 
        color: 0x9932cc, 
        emissive: 0x9932cc, 
        emissiveIntensity: 0.5,
        transparent: true, 
        opacity: 0.7 
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      powerupGroup.add(wave);
      
      const wave2 = wave.clone();
      wave2.scale.setScalar(1.3);
      wave2.material = waveMat.clone();
      wave2.material.opacity = 0.4;
      powerupGroup.add(wave2);
    }
    
    powerupGroup.position.set(laneX, 1 + deps.getSurfaceY(-50), -50);
    powerupGroup.userData = { type };
    powerupGroup.baseY = 1; // flat Y without curve
    deps.scene.add(powerupGroup);
    powerups.value.push({ mesh: powerupGroup, lane, type, collected: false });
  }

  /**
   * Update powerup positions and handle collection
   */
  function updatePowerups(player) {
    const { 
      getSurfaceY, getCurveX, getSurfaceTilt,
      createParticleEffect, createFloatingText, playSound,
      gameSpeed, activePowerup, powerupTimeLeft,
      gameStats, score
    } = deps;

    powerups.value.forEach((powerup, index) => {
      if (powerup.collected) return;
      
      const dist = player.position.distanceTo(powerup.mesh.position);
      
      // Move powerup toward player
      powerup.mesh.position.z += gameSpeed.value;
      powerup.mesh.position.x = ((powerup.lane - 1) * deps.laneWidth) + getCurveX(powerup.mesh.position.z);
      powerup.mesh.position.y = (powerup.mesh.baseY || 0) + getSurfaceY(powerup.mesh.position.z);
      powerup.mesh.rotation.y += 0.05;
      
      if (dist < 1.2) {
        powerup.collected = true;
        
        // Activate powerup
        if (!activePowerup.value || powerupTimeLeft.value <= 0) {
          activePowerup.value = powerup.type;
          powerupTimeLeft.value = 10; // 10 seconds duration
          
          if (powerup.type === 'magnet') {
            deps.magnetRange.value = 15;
          }
          
          createFloatingText(`${powerup.type.toUpperCase()}!`, player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0x00ff00);
          playSound('powerup');
        } else {
          // Extend duration if same type or add small bonus
          if (activePowerup.value === powerup.type) {
            powerupTimeLeft.value += 5;
            createFloatingText('+5s!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0x00ff00);
          } else {
            score.value += 50;
            createFloatingText('+50', player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xffd700);
          }
          playSound('coin');
        }
        
        createParticleEffect(powerup.mesh.position, 0x00ff00, 20);
        deps.scene.remove(powerup.mesh);
        powerups.value.splice(index, 1);
      } else if (powerup.mesh.position.z > 15) {
        deps.scene.remove(powerup.mesh);
        powerups.value.splice(index, 1);
      }
    });
  }

  /**
   * Remove all powerups from scene and clear array
   */
  function cleanupPowerups() {
    powerups.value.forEach(powerup => {
      deps.scene.remove(powerup.mesh);
    });
    powerups.value = [];
  }

  return {
    powerups,
    spawnPowerup,
    updatePowerups,
    cleanupPowerups
  };
}

/**
 * Powerup state management composable
 * Manages active powerup state, activation/deactivation, and effects
 * @param {Object} deps - Dependencies injected from App.vue
 * @param {Object} deps.player - Player mesh (ref getter function)
 * @param {Object} deps.scene - Three.js scene
 * @param {Function} deps.playSFX - Play sound effect function
 * @param {Function} deps.createFloatingText - Create floating text function
 */
export function usePowerupState({ getPlayer, scene, playSFX, createFloatingText }) {
  // Reactive state
  const activePowerup = ref(null);
  const powerupTimeLeft = ref(0);
  const powerupIcon = ref('');
  const powerupName = ref('');

  // Internal state (non-reactive)
  let powerupEndTime = 0;
  let isInvincible = false;
  let magnetRange = 0;
  let scoreMultiplier = 1;

  /**
   * Activate a powerup
   * @param {string} type - Powerup type: 'shield', 'speed', or 'magnet'
   */
  const activatePowerup = (type) => {
    // Deactivate any existing powerup first to prevent duplicates
    if (activePowerup.value) {
      deactivatePowerup();
    }

    activePowerup.value = type;
    const now = Date.now();

    if (type === 'shield') {
      powerupEndTime = now + 10000; // 10s
      powerupIcon.value = '🛡️';
      powerupName.value = 'Shield';
      isInvincible = true;

      // Add shield aura to player
      const player = getPlayer();
      const oldShield = player.getObjectByName('shield-aura');
      if (oldShield) player.remove(oldShield);
      const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const shieldMat = new THREE.MeshToonMaterial({
        color: 0x00bfff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.name = 'shield-aura';
      player.add(shield);

    } else if (type === 'speed') {
      powerupEndTime = now + 5000; // 5s
      powerupIcon.value = '⚡';
      powerupName.value = 'Speed';
      scoreMultiplier = 2;

    } else if (type === 'magnet') {
      powerupEndTime = now + 15000; // 15s
      powerupIcon.value = '🧲';
      powerupName.value = 'Magnet';
      magnetRange = 5;
    }
  };

  /**
   * Deactivate the current powerup
   */
  const deactivatePowerup = () => {
    const prevPowerup = activePowerup.value;

    if (activePowerup.value === 'shield') {
      isInvincible = false;
      const player = getPlayer();
      const shield = player.getObjectByName('shield-aura');
      if (shield) player.remove(shield);
    } else if (activePowerup.value === 'speed') {
      scoreMultiplier = 1;
    } else if (activePowerup.value === 'magnet') {
      magnetRange = 0;
    }

    activePowerup.value = null;
    powerupTimeLeft.value = 0;

    // Visual feedback that powerup expired
    if (prevPowerup) {
      const icon = prevPowerup === 'shield' ? '🛡️' : prevPowerup === 'speed' ? '⚡' : '🧲';
      const player = getPlayer();
      createFloatingText(icon + ' expired!', player.position.clone().add(new THREE.Vector3(0, 2, 0)));
    }
  };

  /**
   * Update powerup timer (call each frame)
   */
  const updatePowerup = () => {
    if (activePowerup.value) {
      powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
      if (powerupTimeLeft.value <= 0) {
        deactivatePowerup();
      }
    }
  };

  /**
   * Reset all powerup state
   */
  const resetPowerups = () => {
    activePowerup.value = null;
    powerupEndTime = 0;
    powerupIcon.value = '';
    powerupName.value = '';
    powerupTimeLeft.value = 0;
    isInvincible = false;
    magnetRange = 0;
    scoreMultiplier = 1;

    const player = getPlayer();
    const shieldAura = player.getObjectByName('shield-aura');
    if (shieldAura) player.remove(shieldAura);
  };

  /**
   * Check if player has shield active
   */
  const hasShield = () => isInvincible;

  /**
   * Get current magnet range
   */
  const getMagnetRange = () => magnetRange;

  /**
   * Get current score multiplier
   */
  const getScoreMultiplier = () => scoreMultiplier;

  return {
    // Reactive state
    activePowerup,
    powerupTimeLeft,
    powerupIcon,
    powerupName,

    // Functions
    activatePowerup,
    deactivatePowerup,
    updatePowerup,
    resetPowerups,
    hasShield,
    getMagnetRange,
    getScoreMultiplier
  };
}

/**
 * Update powerup positions, animations, and handle collection
 * @param {Object} params - Parameters
 * @param {Array} params.powerups - Array of powerup objects
 * @param {THREE.Object3D} params.player - Player mesh
 * @param {number} params.gameSpeed - Current game speed
 * @param {number} params.laneWidth - Width of each lane
 * @param {Function} params.getCurveX - Function to get curve X offset at given Z
 * @param {Function} params.getSurfaceY - Function to get surface Y at given Z
 * @param {Function} params.getSurfaceTilt - Function to get surface tilt at given Z
 * @param {number} params.time - Current time in seconds
 * @param {THREE.Scene} params.scene - The scene to remove powerups from
 * @param {Function} params.activatePowerup - Function to activate a powerup
 * @param {Function} params.playSound - Function to play sound effects
 * @param {Function} params.createParticleEffect - Function to create particle effects
 * @param {Function} params.createFloatingText - Function to create floating text
 * @param {Object} params.gameStats - Game stats object to update
 * @returns {void}
 */
export const updatePowerups = ({
  powerups,
  player,
  gameSpeed,
  laneWidth,
  getCurveX,
  getSurfaceY,
  getSurfaceTilt,
  time,
  scene,
  activatePowerup,
  playSound,
  createParticleEffect,
  createFloatingText,
  gameStats
}) => {
  powerups.forEach((pw, index) => {
    if (pw.collected) return;
    
    pw.mesh.position.z += gameSpeed;
    pw.mesh.position.x = ((pw.lane - 1) * laneWidth) + getCurveX(pw.mesh.position.z);
    pw.mesh.rotation.y += 0.15;
    // Curved earth
    pw.mesh.position.y = (pw.mesh.baseY || 1) + getSurfaceY(pw.mesh.position.z);
    pw.mesh.rotation.x = getSurfaceTilt(pw.mesh.position.z);
    
    // Animate rings
    if (pw.type === 'shield') {
      pw.mesh.children[1].rotation.z += 0.05;
    } else if (pw.type === 'magnet') {
      pw.mesh.children.forEach((c, i) => {
        c.scale.setScalar(1 + Math.sin(time * 5 + i) * 0.2);
      });
    }

    const dist = player.position.distanceTo(pw.mesh.position);
    if (dist < 1.2) {
      pw.collected = true;
      gameStats.powerupsCollected++;
      activatePowerup(pw.type);
      playSound('powerup', 0.9 + Math.random() * 0.2);
      createParticleEffect(pw.mesh.position, pw.type === 'shield' ? 0x00bfff : (pw.type === 'speed' ? 0xffd700 : 0x9932cc), 20);
      createFloatingText(pw.type === 'shield' ? '🛡️ SHIELD' : (pw.type === 'speed' ? '⚡ SPEED' : '🧲 MAGNET'), pw.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      
      scene.remove(pw.mesh);
      powerups.splice(index, 1);
    } else if (pw.mesh.position.z > 15) {
      scene.remove(pw.mesh);
      powerups.splice(index, 1);
    }
  });
};
