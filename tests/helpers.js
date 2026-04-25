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

export { GAME_URL, dismissLoadingScreen, navigateAndDismiss };
