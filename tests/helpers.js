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
}

async function navigateAndDismiss(page) {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  await dismissLoadingScreen(page);
}

// Focus the canvas before keyboard input to ensure events are captured
// Uses short timeout and ignores errors - focus is best-effort only
async function focusCanvas(page) {
  try {
    await page.waitForSelector('canvas', { timeout: 2000, state: 'visible' });
    await page.focus('canvas');
    await page.waitForTimeout(100);
  } catch (e) {
    // Canvas not found or not focusable - skip focus, continue test
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

export { GAME_URL, dismissLoadingScreen, navigateAndDismiss, focusCanvas, screenshot };
