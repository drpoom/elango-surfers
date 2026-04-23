/**
 * useSpawning - Manages spawn timing for coins, obstacles, and powerups
 * Extracted from App.vue animate() loop
 */

export function useSpawning() {
  /**
   * Handles spawning logic for game objects
   * @param {Object} params - Spawning parameters
   * @param {number} params.time - Current game time
   * @param {number} params.lastSpawnTime - Last spawn timestamp
   * @param {number} params.spawnInterval - Interval between spawns
   * @param {boolean} params.bossActive - Whether boss is active
   * @param {boolean} params.bonusNoSpawn - Whether spawning is disabled (bonus zone)
   * @param {boolean} params.stageTransitioning - Whether stage is transitioning
   * @param {number} params.gameDuration - How long game has been running
   * @param {Function} params.spawnObstacle - Function to spawn regular obstacle
   * @param {Function} params.spawnFloatingObstacle - Function to spawn floating obstacle
   * @param {Function} params.spawnCoin - Function to spawn coin
   * @param {Function} params.spawnPowerup - Function to spawn powerup
   * @returns {Object} - { shouldSpawn: boolean, newLastSpawnTime: number }
   */
  function handleSpawning({
    time,
    lastSpawnTime,
    spawnInterval,
    bossActive,
    bonusNoSpawn,
    stageTransitioning,
    gameDuration,
    spawnObstacle,
    spawnFloatingObstacle,
    spawnCoin,
    spawnPowerup,
  }) {
    // Grace period: don't spawn obstacles for the first 1.5 seconds
    const spawnGraceActive = gameDuration < 1.5;
    
    // Check if spawning should occur
    const shouldSpawn = !spawnGraceActive && 
                        time - lastSpawnTime > spawnInterval && 
                        !bonusNoSpawn && 
                        !bossActive && 
                        !stageTransitioning;
    
    if (!shouldSpawn) {
      // Log why we CAN'T spawn (throttled to ~2/sec)
      if (!window._lastSpawnLog || Date.now() - window._lastSpawnLog > 500) {
        console.log('[SPAWN-BLOCKED]', { 
          grace: spawnGraceActive, 
          timeDiff: (time - lastSpawnTime).toFixed(2), 
          interval: spawnInterval.toFixed(2), 
          bonusNoSpawn, 
          bossActive, 
          gameDuration: gameDuration.toFixed(1) 
        });
        window._lastSpawnLog = Date.now();
      }
      return { shouldSpawn: false, newLastSpawnTime: lastSpawnTime };
    }
    
    // Spawn obstacles (70% chance)
    if (Math.random() < 0.7) {
      if (Math.random() < 0.3) {
        spawnFloatingObstacle();
      } else {
        spawnObstacle();
      }
    }
    
    // Spawn coins (50% base chance, increases with game duration)
    if (Math.random() < 0.5 + (gameDuration / 120)) {
      spawnCoin();
    }
    
    // Spawn powerups (5% chance)
    if (Math.random() < 0.05) {
      spawnPowerup();
    }
    
    console.log('[SPAWNED] obstacles/coins/powerups');
    
    return { shouldSpawn: true, newLastSpawnTime: time };
  }
  
  return {
    handleSpawning,
  };
}
