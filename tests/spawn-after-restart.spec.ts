import { test, expect } from '@playwright/test';
import { GAME_URL, dismissLoadingScreen, focusCanvas } from './helpers';

test.describe('Spawn After Restart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
    await dismissLoadingScreen(page);
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
  });

  async function enterDebugCode(page) {
    await focusCanvas(page);
    for (const key of ['d', 'e', 'b', 'u', 'g']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);
  }

  async function assertSpawns(page, stageNum: number) {
    await page.waitForTimeout(5000);
    const counts = await page.evaluate(() => window.__getSpawnCounts());
    expect(counts.obstacles).toBeGreaterThan(0);
    expect(counts.coins).toBeGreaterThan(0);
  }

  test('Stage 1 - obstacles and coins spawn', async ({ page }) => {
    await enterDebugCode(page);
    await focusCanvas(page);
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);
    await assertSpawns(page, 1);
  });

  test('Stage 2 - obstacles and coins spawn', async ({ page }) => {
    await enterDebugCode(page);
    await focusCanvas(page);
    await page.keyboard.press('2');
    await page.waitForTimeout(1000);
    await assertSpawns(page, 2);
  });

  test('Stage 3 - obstacles and coins spawn', async ({ page }) => {
    await enterDebugCode(page);
    await focusCanvas(page);
    await page.keyboard.press('3');
    await page.waitForTimeout(1000);
    await assertSpawns(page, 3);
  });
});
