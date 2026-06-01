// Use relative URL - Playwright config sets baseURL (local or CI)
const GAME_URL = '/';

async function dismissLoadingScreen(page) {
  // Wait for loading to complete and prompt to appear
  try {
    await page.locator('text=Press any key / Tap to start').waitFor({ timeout: 15000 });
    // Dismiss with Enter key
    await page.keyboard.press('Enter');
    // Wait for loading screen to fade out
    await page.waitForTimeout(500);
  } catch (e) {
    // Loading screen might have auto-dismissed or game started automatically
    console.log('Loading screen dismissal skipped:', e.message);
    await page.waitForTimeout(1000);
  }
  
  // Wait for canvas to appear
  try {
    await page.waitForSelector('canvas', { timeout: 10000 });
  } catch (e) {
    console.log('Canvas not found, game may have crashed');
  }

  // Wait for countdown to finish (3-2-1-GO!) so keyboard input is not blocked
  // countdownLocked blocks all keyboard input during countdown
  // The countdown is 3 seconds but setTimeout may be delayed under load
  // Use waitForFunction to poll the game store for the most reliable detection
  try {
    await page.waitForFunction(() => {
      // Check game store via test helpers
      const helpers = window.__ElangoSurfers;
      if (helpers && helpers.getStore) {
        const store = helpers.getStore();
        if (store) return !store.countdownLocked && !store.countdownActive;
      }
      // Fallback: check if #countdown element is gone from DOM
      return !document.getElementById('countdown');
    }, { timeout: 40000, polling: 200 });
    await page.waitForTimeout(300);
  } catch (e) {
    // Last resort: wait long enough for countdown to finish.
    // If the state check fails, we assume the test should proceed or fail naturally.
    console.log('Countdown wait skipped due to timeout/error:', e.message);
  }
}

async function navigateAndDismiss(page) {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  await dismissLoadingScreen(page);
}

// Focus the canvas before keyboard input to ensure events are captured
// Uses short timeout and ignores errors - focus is best-effort only
async function focusCanvas(page) {
  try {
    // The game div has tabindex="-1" and the THREE.js canvas is inside it
    // Try focusing the game-canvas div first, then the canvas element
    const gameDiv = page.locator('#game-canvas');
    if (await gameDiv.count() > 0) {
      await gameDiv.focus();
      await page.waitForTimeout(100);
    } else {
      await page.waitForSelector('canvas', { timeout: 2000, state: 'visible' });
      await page.focus('canvas');
      await page.waitForTimeout(100);
    }
  } catch (e) {
    // Canvas not found or not focusable - skip focus, continue test
    // Keyboard events are on window, so they should work regardless
    console.log('Canvas focus skipped (not found)');
  }
}

// Take screenshot with timeout to avoid hanging on font loading
async function screenshot(page, path) {
  try {
    await page.screenshot({ path, timeout: 5000 });
  } catch (e) {
    console.log(`Screenshot failed for ${path}: ${e.message}`);
    // Screenshot is non-critical - continue test
  }
}

/**
 * Get spawn counts from the game's debug helpers.
 * Supports both new namespaced (window.__ElangoSurfers) and legacy (window.__getSpawnCounts) access.
 */
async function getSpawnCounts(page) {
  return page.evaluate(() => {
    if (window.__ElangoSurfers) return window.__ElangoSurfers.getSpawnCounts();
    if (window.__getSpawnCounts) return window.__getSpawnCounts();
    return { obstacles: -1, coins: -1 };
  });
}

/**
 * Get full spawn debug state from the game's debug helpers.
 * Supports both new namespaced and legacy access.
 */
async function getSpawnDebug(page) {
  return page.evaluate(() => {
    if (window.__ElangoSurfers) return window.__ElangoSurfers.getSpawnDebug();
    if (window.__getSpawnDebug) return window.__getSpawnDebug();
    return null;
  });
}

/**
 * Get road mesh reference from the game's debug helpers.
 * Supports both new namespaced and legacy access.
 */
async function getRoadMesh(page) {
  return page.evaluate(() => {
    if (window.__ElangoSurfers) return window.__ElangoSurfers.getRoadMesh();
    if (window.__getRoadMesh) return window.__getRoadMesh();
    return null;
  });
}

/**
 * Get the game store via test helpers (dev mode only).
 */
async function getStore(page) {
  // Wait for store to be available (handles race with page load)
  await page.waitForFunction(() => window.__ElangoSurfers && window.__ElangoSurfers.getStore(), { timeout: 10000 });
  return page.evaluate(() => window.__ElangoSurfers.getStore());
}

/**
 * Skip directly to active gameplay (past loading + countdown).
 * Uses store manipulation to bypass all waits — no keyboard input needed.
 * Total time: ~2-3s instead of 25-40s.
 */
async function skipToGameplay(page) {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  // Wait for the game to initialize (store + canvas must exist)
  await page.waitForFunction(() => {
    return window.__ElangoSurfers?.getStore() != null;
  }, { timeout: 15000, polling: 200 });
  // Atomically: start countdown then immediately unlock — all in one evaluate
  // This avoids the race where startCountdown sets countdownLocked=true
  // and the game loop hasn't processed our unlock yet
  await page.evaluate(() => {
    const store = window.__ElangoSurfers.getStore();
    // Call startCountdown to properly initialize game state (resetStage, etc.)
    if (store.startCountdown) store.startCountdown();
    // Immediately unlock keyboard — skip the 3-2-1-GO countdown
    store.countdownActive = false;
    store.countdownLocked = false;
    store.countdownText = '';
    store.stageTransitioning = false;
    // Ensure game is running
    store.gameStartTime = Date.now();
    store.isInvincible = true;
    store.gameDuration = 0;
  });
  // Brief settle for the game loop to pick up state changes
  await page.waitForTimeout(200);
}

/**
 * Skip to boss fight state. Uses store manipulation instead of keyboard shortcuts.
 * Must be called after skipToGameplay.
 */
async function skipToBoss(page) {
  await page.evaluate(() => {
    const store = window.__ElangoSurfers.getStore();
    // Skip stage time to trigger stage end
    const STAGES = window.__ElangoSurfers?.STAGES;
    const stage = STAGES ? STAGES[store.currentStage] : null;
    store.stageTime = stage?.stageDuration || 30;
    // Trigger boss immediately
    store.bossWarning = false;
  });
  await page.waitForTimeout(300);
}

/**
 * Skip to game over state. Uses store.triggerGameOver() directly.
 * Must be called after skipToGameplay or navigateAndDismiss.
 */
async function skipToGameOver(page) {
  await page.evaluate(() => {
    const store = window.__ElangoSurfers.getStore();
    if (store && store.triggerGameOver) {
      store.triggerGameOver();
    }
  });
  await page.waitForTimeout(300);
}

/**
 * Directly set store properties via page.evaluate — avoids keyboard input entirely.
 * Example: await setStoreState(page, { godMode: true, currentLane: 0 });
 */
async function setStoreState(page, updates) {
  await page.evaluate((u) => {
    const store = window.__ElangoSurfers?.getStore();
    if (!store) return;
    Object.assign(store, u);
  }, updates);
}

/**
 * Wait for a specific store condition. Polls the game store at intervals.
 * Much faster than waitForTimeout for state-dependent checks.
 */
async function waitForStoreCondition(page, conditionFn, timeout = 5000) {
  return page.waitForFunction(
    (fnStr) => {
      const store = window.__ElangoSurfers?.getStore();
      if (!store) return false;
      const fn = new Function('store', 'return ' + fnStr);
      return fn(store);
    },
    conditionFn,
    { timeout, polling: 100 }
  );
}

export { GAME_URL, dismissLoadingScreen, navigateAndDismiss, focusCanvas, screenshot, getSpawnCounts, getSpawnDebug, getRoadMesh, getStore, skipToGameplay, skipToBoss, skipToGameOver, waitForStoreCondition, setStoreState };
