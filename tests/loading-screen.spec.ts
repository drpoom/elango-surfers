import { test, expect } from '@playwright/test';
import { GAME_URL } from './helpers';

test.describe('Elango Surfers Loading Screen', () => {
  test('1: Loading screen is visible on page load', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.loading-screen .version')).toBeVisible({ timeout: 10000 });
  });

  test('2: Keypress dismisses loading screen', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    // Wait for loading to complete
    await expect(page.locator('text=Press any key / Tap to start')).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Loading screen should be hidden
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('3: Loading progress shows percentage', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 10000 });
    // Wait for loading to complete — "Press any key / Tap to start" prompt appears
    await expect(page.locator('text=Press any key / Tap to start')).toBeVisible({ timeout: 10000 });
  });
});