/**
 * useScoring — Score calculation with multipliers and combo system
 * 
 * Extracted from App.vue for AI-friendly incremental refactoring.
 * Dependencies: None (pure functions)
 * 
 * Usage: 
 *   const { updateScore, calculateCoinScore } = useScoring()
 *   updateScore({ delta, gameDuration, score, isInvincible, gameStats })
 *   calculateCoinScore({ comboCount, lastCoinTime, scoreMultiplier, isInvincible })
 */

export function useScoring() {
  /**
   * Update score based on time survived
   * Called every frame in animate() loop
   * 
   * @param {Object} params
   * @param {number} params.delta - Time since last frame
   * @param {number} params.gameDuration - Total game time in seconds
   * @param {number} params.score - Current score (ref value)
   * @param {boolean} params.isInvincible - Whether player is invincible
   * @param {Object} params.gameStats - Game statistics object
   * @param {number} params.highScore - Current high score
   * @param {string} params.VERSION - Game version for logging
   * @returns {number} Updated score
   */
  const updateScore = ({ delta, gameDuration, score, isInvincible, gameStats, highScore, VERSION }) => {
    // Progressive difficulty scaling
    const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
    
    // Add score based on survival time
    score += Math.floor(delta * 50 * difficultyMultiplier);
    
    // Track max score for achievements
    if (!isInvincible && score > gameStats.maxScore) {
      gameStats.maxScore = score;
    }
    
    return score;
  };

  /**
   * Calculate score for coin collection with combo bonus
   * Called when a coin is collected
   * 
   * @param {Object} params
   * @param {number} params.comboCount - Current combo count
   * @param {number} params.lastCoinTime - Timestamp of last coin collection (ms)
   * @param {number} params.scoreMultiplier - Current score multiplier (from powerups)
   * @param {boolean} params.isInvincible - Whether player is invincible
   * @param {Object} params.gameStats - Game statistics object
   * @returns {Object} { scoreDelta, comboCount, gameStats }
   */
  const calculateCoinScore = ({ comboCount, lastCoinTime, scoreMultiplier, isInvincible, gameStats }) => {
    const now = Date.now();
    
    // Combo bonus: extra points for rapid consecutive collections
    const comboBonus = comboCount > 1 && (now - lastCoinTime) < 1000 ? comboCount * 10 : 0;
    
    // Base coin value is 100, plus combo bonus, times multiplier
    const scoreDelta = (100 + comboBonus) * scoreMultiplier;
    
    // Track max combo for achievements
    if (comboCount > gameStats.maxCombo) {
      gameStats.maxCombo = comboCount;
    }
    
    return { scoreDelta, comboCount, gameStats, lastCoinTime: now };
  };

  /**
   * Reset combo counter
   * Called when combo chain is broken
   * 
   * @returns {number} Reset combo count (0)
   */
  const resetCombo = () => {
    return 0;
  };

  return {
    updateScore,
    calculateCoinScore,
    resetCombo,
  };
}
