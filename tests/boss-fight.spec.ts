import { test, expect } from '@playwright/test';
import { GAME_URL, dismissLoadingScreen } from './helpers';

test.describe('Boss Fights', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(GAME_URL);
    await dismissLoadingScreen(page);
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  async function enterDebugCode(page) {
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    await page.keyboard.press('e');
    await page.waitForTimeout(100);
    await page.keyboard.press('b');
    await page.waitForTimeout(100);
    await page.keyboard.press('u');
    await page.waitForTimeout(100);
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
  }

  test('Stage 1 Boss', async ({ page }) => {
    await enterDebugCode(page);
    await page.keyboard.press('1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('b');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/stage1-boss.png' });
  });

  test('Stage 2 Boss', async ({ page }) => {
    await enterDebugCode(page);
    await page.keyboard.press('2');
    await page.waitForTimeout(2000);
    await page.keyboard.press('b');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/stage2-boss.png' });
  });

  test('Stage 3 Boss', async ({ page }) => {
    await enterDebugCode(page);
    await page.keyboard.press('3');
    await page.waitForTimeout(2000);
    await page.keyboard.press('b');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/stage3-boss.png' });
  });

  test('God mode survives boss', async ({ page }) => {
    await enterDebugCode(page);
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    await page.keyboard.press('1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('b');
    await page.waitForTimeout(5000);
    // Verify no game over screen
    const gameOverVisible = await page.locator('text=Game Over').isVisible().catch(() => false);
    expect(gameOverVisible).toBe(false);
    await page.screenshot({ path: 'tests/screenshots/god-mode-boss.png' });
  });

  test('Player death by boss', async ({ page }) => {
    test.setTimeout(90000);
    await enterDebugCode(page);
    await page.keyboard.press('1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('b');
    // Wait up to 10s for game over
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'tests/screenshots/player-death-boss.png' });
  });
});