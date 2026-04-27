import { test, expect } from '@playwright/test';
import { GAME_URL, dismissLoadingScreen, focusCanvas } from './helpers';

test.describe('Spawn After Restart', () => {
  test.setTimeout(120000); // 2 minute timeout per test for coin spawn probability
  
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
    // Wait up to 60 seconds for obstacles AND coins to spawn (coins are probabilistic)
    // Obstacles spawn at 70% rate, coins at ~56% rate per cycle (~0.6-1.2s)
    await page.waitForFunction(() => {
      const counts = (window as any).__getSpawnCounts();
      return counts.obstacles > 0 && counts.coins > 0;
    }, { timeout: 60000 });
    
    const counts = await page.evaluate(() => (window as any).__getSpawnCounts());
    const debug = await page.evaluate(() => (window as any).__getSpawnDebug());
    console.log('Spawn debug:', JSON.stringify(debug, null, 2));
    expect(counts.obstacles, `No obstacles spawned. Debug: ${JSON.stringify(debug)}`).toBeGreaterThan(0);
    expect(counts.coins, `No coins spawned. Debug: ${JSON.stringify(debug)}`).toBeGreaterThan(0);
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
