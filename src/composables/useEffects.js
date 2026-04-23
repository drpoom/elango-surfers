import * as THREE from 'three';

/**
 * Create a particle effect at the given position
 * @param {THREE.Vector3} position - Position to spawn particles
 * @param {number} color - Color of particles (hex)
 * @param {number} count - Number of particles to create
 * @param {THREE.Scene} scene - Scene to add particles to
 * @returns {THREE.Mesh[]} Array of created particle meshes
 */
export function createParticleEffect(position, color, count = 10, scene) {
  const particleGeo = new THREE.SphereGeometry(0.1, 4, 4);
  const particleMat = new THREE.MeshBasicMaterial({ color });
  const createdParticles = [];
  
  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3 + 0.2,
      (Math.random() - 0.5) * 0.3
    );
    particle.life = 1.0;
    scene.add(particle);
    createdParticles.push(particle);
  }
  
  return createdParticles;
}

/**
 * Create floating text at the given position
 * @param {string} text - Text to display
 * @param {THREE.Vector3} position - Position to display text
 * @param {string} color - Color of text
 * @param {THREE.Scene} scene - Scene to add sprite to
 * @returns {THREE.Sprite} Created sprite
 */
export function createFloatingText(text, position, color, scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = color || 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.textAlign = 'center';
  ctx.strokeText(text, 256, 80);
  ctx.fillText(text, 256, 80);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(4, 1, 1);
  sprite.userData = { life: 2.0, velocity: new THREE.Vector3(0, 0.5, 0) };
  scene.add(sprite);
  
  return sprite;
}

/**
 * Trigger game over state with cleanup, effects, and high score save
 * @param {Object} params - Game over parameters
 * @param {Ref<boolean>} params.gameOver - Game over ref to set
 * @param {number} params.cameraShakeIntensity - Intensity of camera shake
 * @param {THREE.Scene} params.scene - Three.js scene
 * @param {Object} params.player - Player object with position
 * @param {Object|null} params.boss - Boss object to remove
 * @param {Object|null} params.bonusPortal - Bonus portal object to remove
 * @param {Array} params.obstacles - Obstacles array to clean up
 * @param {Array} params.coins - Coins array to clean up
 * @param {Array} params.powerups - Powerups array to clean up
 * @param {Function} params.deactivatePowerup - Function to deactivate powerup
 * @param {Function} params.playSFX - Function to play sound effects
 * @param {Function} params.saveHighScore - Function to save high score
 * @param {Object} params.gameStats - Game stats object
 * @param {Ref<number>} params.score - Current score ref
 * @param {Function} params.saveProgress - Function to save progress
 * @param {Function} params.createParticleEffect - Particle effect creator
 * @param {Ref<boolean>} params.showNameEntry - Show name entry ref
 * @param {Ref<boolean>} params.isHighScore - Is high score ref
 * @param {THREE.Camera} params.camera - Camera for shake effect
 * @param {Object} params.sceneState - Scene state object with buildings, trees, etc.
 * @param {Object} params.bonusState - Bonus state object
 * @param {Object} params.cleanupCoinsFn - Function to cleanup coins
 * @param {Object} params.bossProjectiles - Boss projectiles array
 * @param {Object} params.particles - Particles array
 * @param {Object} params.floatingTexts - Floating texts array
 * @param {Ref<boolean>} params.bossDefeated - Boss defeated ref
 * @param {Object} params.bossDefeatTimeout1 - Boss defeat timeout ref
 */
export function triggerGameOver({
  gameOver,
  cameraShakeIntensity = 0.5,
  scene,
  player,
  boss,
  bonusPortal,
  obstacles,
  coins,
  powerups,
  deactivatePowerup,
  playSFX,
  saveHighScore,
  gameStats,
  score,
  saveProgress,
  createParticleEffect,
  showNameEntry,
  isHighScore,
  camera,
  sceneState,
  bonusState,
  cleanupCoinsFn,
  bossProjectiles,
  particles,
  floatingTexts,
  bossDefeated,
  bossDefeatTimeout1
}) {
  if (gameOver.value) return; // already dead, don't double-fire
  gameOver.value = true;
  const gameOverTime = Date.now(); // block restart for 1 second
  
  // Clean up bonus zone
  if (bonusPortal) { scene.remove(bonusPortal.mesh); bonusPortal = null; }
  bonusState.inBonusZone = false;
  bonusState.inBonusZoneRef.value = false;
  bonusState.bonusTimer = 0;
  bonusState.bonusTimerRef.value = 0;
  bonusState.bonusNoSpawn = false;
  bonusState.bonusCoins.forEach(bc => scene.remove(bc.mesh));
  bonusState.bonusCoins = [];
  scene.userData.bonusEnvActive = false;
  if (scene.userData.nyanCat) {
    scene.remove(scene.userData.nyanCat);
    scene.userData.nyanCat = null;
    scene.userData.nyanCatTime = 0;
  }
  
  // Restore road material if in rainbow mode
  const roadGO = scene.getObjectByName('road');
  if (roadGO && sceneState.originalRoadMaterial) {
    roadGO.material.dispose();
    roadGO.material = sceneState.originalRoadMaterial;
    sceneState.originalRoadMaterial = null;
  }
  
  // Discard saved substage state (we're starting fresh)
  if (sceneState.savedSubstageState) {
    sceneState.savedSubstageState.obstacles.forEach(obs => scene.remove(obs.mesh));
    sceneState.savedSubstageState.coins.forEach(coin => scene.remove(coin.mesh));
    sceneState.savedSubstageState = null;
  }
  
  // Restore building/tree visibility
  sceneState.buildings.forEach(b => { b.visible = true; });
  sceneState.trees.forEach(t => { t.visible = true; });
  
  // Immediately remove all game objects from scene so they can't interfere on restart
  obstacles.forEach(obs => {
    obs.mesh.traverse(c => {
      if (c.geometry && c.geometry !== sceneState.sharedCoinGeo) c.geometry.dispose();
    });
    scene.remove(obs.mesh);
  });
  obstacles = [];
  cleanupCoinsFn();
  powerups.forEach(pw => scene.remove(pw.mesh));
  powerups = [];
  bossProjectiles.forEach(fb => scene.remove(fb));
  bossProjectiles = [];
  particles.forEach(p => scene.remove(p));
  particles = [];
  floatingTexts.forEach(t => scene.remove(t));
  floatingTexts = [];
  if (boss) { scene.remove(boss); boss = null; }
  
  // Cancel any pending boss/stage timeouts
  if (bossDefeatTimeout1.value) {
    clearTimeout(bossDefeatTimeout1.value);
    bossDefeatTimeout1.value = null;
  }
  bossDefeated.value = false;
  bonusState.bossCharging = false;
  
  // Save score + stats
  saveHighScore();
  if (score.value > gameStats.maxScore) gameStats.maxScore = score.value;
  if (gameStats.gameDuration > gameStats.maxTime) gameStats.maxTime = gameStats.gameDuration;
  if (score.value > gameStats.bestRun) gameStats.bestRun = score.value;
  saveProgress();
  
  // Effects
  playSFX('crash');
  createParticleEffect(player.position, 0xff0000, 30, scene);
  bonusState.comboCount = 0;
  
  // Screen shake
  const originalPos = camera.position.clone();
  let shakeTime = 0;
  bonusState.gameOverShakeInterval = setInterval(() => {
    shakeTime += 0.05;
    if (shakeTime > 0.5) {
      camera.position.copy(originalPos);
      clearInterval(bonusState.gameOverShakeInterval);
      bonusState.gameOverShakeInterval = null;
      return;
    }
    camera.position.x = originalPos.x + (Math.random() - 0.5) * cameraShakeIntensity * (1 - shakeTime * 2);
    camera.position.y = originalPos.y + (Math.random() - 0.5) * cameraShakeIntensity * (1 - shakeTime * 2);
  }, 30);
  
  // Show name entry if high score
  showNameEntry.value = isHighScore.value;
  
  return { gameOverTime };
}
