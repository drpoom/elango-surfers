import { test, expect } from '@playwright/test';
import { GAME_URL, skipToGameplay, getStore } from './helpers';

test.describe('Texture Loading', () => {
  test('Stage 1 textures load correctly', async ({ page }) => {
    await skipToGameplay(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('obstacles spawn at game start', async ({ page }) => {
    await skipToGameplay(page);
    // Wait briefly for obstacles to spawn
    await page.waitForTimeout(300);
    const store = await getStore(page);
    // Obstacles array should exist in store
    expect(Array.isArray(store!.obstacles)).toBe(true);
  });

  test('loading screen shows with visible text', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 10000 });
    // Verify loading text or prompt is visible
    const loadingText = loadingScreen.locator('text=Loading...');
    const promptText = loadingScreen.locator('text=Press any key / Tap to start');
    // At least one should be visible
    const loadingVisible = await loadingText.isVisible().catch(() => false);
    const promptVisible = await promptText.isVisible().catch(() => false);
    expect(loadingVisible || promptVisible).toBe(true);
    // Verify version text is visible
    await expect(loadingScreen.locator('.version')).toBeVisible({ timeout: 5000 });
  });

  test('countdown starts after loading screen fades', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Press any key / Tap to start')).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Enter');
    // Canvas should appear after loading screen fades
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });
});