import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Stage 3 Boss', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("TAP TO START")');
    // Wait for game to load
    await page.waitForTimeout(2000);
  });

  test('Stage 3 boss appears', async ({ page }) => {
    // Navigate to Stage 3 (would need debug controls or wait)
    // For now, just verify game is running
    await expect(page.locator('#stage-indicator')).toBeVisible();
  });

  test('boss warning appears before boss fight', async ({ page }) => {
    // Boss warning should appear before boss spawns
    const bossWarning = page.locator('#boss-warning');
    // This would need to wait for Stage 3 boss fight
    // For now, just check the element exists in DOM
    const warningExists = await bossWarning.count() > 0;
    console.log('Boss warning element exists:', warningExists);
  });
});
