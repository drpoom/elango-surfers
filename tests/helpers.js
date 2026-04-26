const GAME_URL = 'https://www.drpoom.com/elango-surfers/';

async function dismissLoadingScreen(page) {
  // Wait for loading to complete and prompt to appear
  await page.waitForSelector('text=Press any key', { timeout: 60000 });
  // Dismiss with Enter key
  await page.keyboard.press('Enter');
  // Wait for loading screen to fade out
  await page.waitForTimeout(500);
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
