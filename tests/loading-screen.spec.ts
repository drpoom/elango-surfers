import { test, expect } from '@playwright/test';

const GAME_URL = 'https://www.drpoom.com/elango-surfers/';

test.describe('Elango Surfers Loading Screen', () => {
  test('1: Loading screen is visible on page load', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 60000 });
    // Verify version text — use .first() because there are 2 version elements
    await expect(page.getByText('v5.0.21').first()).toBeVisible({ timeout: 60000 });
    await page.screenshot({ path: 'tests/screenshots/loading-screen-visible.png' });
  });

  test('2: Keypress dismisses loading screen', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 60000 });
    // Wait for "Press any key" prompt
    await expect(page.getByText('Press any key')).toBeVisible({ timeout: 60000 });
    // Press Enter to dismiss
    await page.keyboard.press('Enter');
    // Wait for loading screen to disappear
    await expect(loadingScreen).toBeHidden({ timeout: 60000 });
    // Verify game canvas is visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 60000 });
    await page.screenshot({ path: 'tests/screenshots/loading-screen-dismissed.png' });
  });

  test('3: Loading progress shows percentage or completes', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 60000 });
    
    // Check if loading text appears (may be fast if textures are cached)
    const loadingText = page.locator('.loading-screen').locator('text=Loading');
    const hasLoadingText = await loadingText.isVisible().catch(() => false);
    
    if (hasLoadingText) {
      // Loading text visible — wait for completion
      await expect(page.getByText('Press any key')).toBeVisible({ timeout: 60000 });
    } else {
      // Loading completed too fast — just verify prompt is visible
      await expect(page.getByText('Press any key')).toBeVisible({ timeout: 60000 });
    }
    
    await page.screenshot({ path: 'tests/screenshots/loading-progress-complete.png' });
  });
});
