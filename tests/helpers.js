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
// Waits up to 5s for canvas, skips focus if canvas not found (non-fatal)
async function focusCanvas(page) {
  const canvas = page.locator('canvas');
  const exists = await canvas.count() > 0;
  if (exists) {
    await canvas.focus();
    await page.waitForTimeout(100);
  }
}

export { GAME_URL, dismissLoadingScreen, navigateAndDismiss, focusCanvas };
