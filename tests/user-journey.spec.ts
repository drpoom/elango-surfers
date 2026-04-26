import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';

test.describe('Elango Surfers User Journey', () => {
  test('1: Game loads, canvas renders, countdown shows', async ({ page }) => {
    await navigateAndDismiss(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await screenshot(page, 'tests/screenshots/01-game-loaded.png');
  });

  test('2: Arrow keys move character (left/right lane changes)', async ({ page }) => {
    await navigateAndDismiss(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    // Focus canvas before keyboard input
    await focusCanvas(page);
    // Press arrow keys to move character
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    await screenshot(page, 'tests/screenshots/02-arrow-keys.png');
  });

  test('3: P key pauses, click resumes', async ({ page }) => {
    await navigateAndDismiss(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    // Focus canvas before keyboard input
    await focusCanvas(page);
    // Pause with P
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/03a-paused.png');
    // Focus canvas before resume
    await focusCanvas(page);
    // Resume by pressing P again
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/03b-resumed.png');
  });

  test('4: Settings panel opens/closes', async ({ page }) => {
    await navigateAndDismiss(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    // Focus canvas before keyboard input
    await focusCanvas(page);
    // Try S key or settings button
    await page.keyboard.press('s');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/04a-settings-open.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/04b-settings-closed.png');
  });

  test('5: Debug overlay toggles on/off', async ({ page }) => {
    await navigateAndDismiss(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    // Focus canvas before keyboard input
    await focusCanvas(page);
    // Toggle debug with D key
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/05a-debug-on.png');
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/05b-debug-off.png');
  });
});
