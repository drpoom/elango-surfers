import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';

test.describe('Elango Surfers - Gameplay Mechanics & Debug Shortcuts', () => {
  test('should toggle God Mode using Shift+G', async ({ page }) => {
    await navigateAndDismiss(page);
    await focusCanvas(page);

    // Toggle God Mode on
    await page.keyboard.press('Shift+G');
    await page.waitForTimeout(300);
    await screenshot(page, 'tests/screenshots/mechanics-godmode-on.png');

    // Toggle God Mode off
    await page.keyboard.press('Shift+G');
    await page.waitForTimeout(300);
    await screenshot(page, 'tests/screenshots/mechanics-godmode-off.png');
  });

  test('should spawn portal and shield using Shift+O and Shift+P', async ({ page }) => {
    await navigateAndDismiss(page);
    await focusCanvas(page);

    // Spawn bonus portal
    await page.keyboard.press('Shift+O');
    await page.waitForTimeout(300);
    await screenshot(page, 'tests/screenshots/mechanics-spawn-portal.png');

    // Spawn shield powerup
    await page.keyboard.press('Shift+P');
    await page.waitForTimeout(300);
    await screenshot(page, 'tests/screenshots/mechanics-spawn-shield.png');
  });

  test('should skip stage and trigger boss using Shift+S and Shift+B', async ({ page }) => {
    await navigateAndDismiss(page);
    await focusCanvas(page);

    // Skip stage (sets stageTime to currentStageDuration)
    await page.keyboard.press('Shift+S');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/mechanics-skip-stage.png');

    // Trigger boss fight immediately
    await page.keyboard.press('Shift+B');
    await page.waitForTimeout(500);
    await screenshot(page, 'tests/screenshots/mechanics-boss-fight.png');
  });
});
