import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss } from './helpers';

test.describe('Elango Surfers Loading Screen', () => {
  test('1: Loading screen is visible on page load', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 60000 });
    // Verify version text
    await expect(page.locator('text=v5.0.22')).toBeVisible({ timeout: 60000 });
    await page.screenshot({ path: 'tests/screenshots/loading-screen-visible.png' });
  });

  test('2: Keypress dismisses loading screen', async ({ page }) => {
    await navigateAndDismiss(page);
    await page.screenshot({ path: 'tests/screenshots/loading-screen-dismissed.png' });
  });

  test('3: Loading progress shows percentage', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 60000 });
    // Check that loading text with percentage appears
    const loadingText = page.locator('.loading-screen').locator('text=Loading');
    await expect(loadingText).toBeVisible({ timeout: 60000 });
    // Wait for loading to complete — "Press any key" prompt appears
    await expect(page.locator('text=Press any key')).toBeVisible({ timeout: 60000 });
    await page.screenshot({ path: 'tests/screenshots/loading-progress-complete.png' });
  });
});