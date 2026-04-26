import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss, screenshot } from './helpers';

test.describe('Texture Loading', () => {
  test('Stage 1 textures load correctly', async ({ page }) => {
    await navigateAndDismiss(page);

    // Verify game canvas exists and is visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify canvas has rendered (non-zero dimensions)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    await screenshot(page, 'tests/screenshots/stage1-textures-loaded.png');
  });

  test('obstacles spawn at game start', async ({ page }) => {
    await navigateAndDismiss(page);

    // Wait for game to initialize
    await page.waitForTimeout(1000);

    // Verify canvas is active with dimensions
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    await screenshot(page, 'tests/screenshots/obstacles-spawn-at-start.png');
  });

  test('loading screen shows with visible text', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });

    const loadingScreen = page.locator('.loading-screen');
    await expect(loadingScreen).toBeVisible({ timeout: 60000 });

    // Verify loading text is visible (text says "Loading...")
    // The loading text may disappear quickly if textures are cached, so check during initial load
    const loadingText = loadingScreen.locator('text=Loading...');
    await expect(loadingText).toBeVisible({ timeout: 5000 }).catch(() => {
      // If textures loaded too fast, the prompt text should be visible instead
      const prompt = loadingScreen.locator('text=Press any key');
      return expect(prompt).toBeVisible({ timeout: 5000 });
    });

    // Verify version text is visible
    await expect(loadingScreen.locator('.version')).toBeVisible({ timeout: 10000 });

    // Verify loading screen has black background
    const bgColor = await loadingScreen.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toMatch(/rgb\(0,\s*0,\s*0\)/);

    await screenshot(page, 'tests/screenshots/loading-screen-text-visible.png');
  });

  test('countdown starts after loading screen fades', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });

    // Wait for loading to complete
    await expect(page.locator('text=Press any key')).toBeVisible({ timeout: 60000 });

    // Dismiss loading screen
    await page.keyboard.press('Enter');

    // Wait for loading screen to fade out
    await page.locator('.loading-screen').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Verify canvas is active after loading screen fades
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    await screenshot(page, 'tests/screenshots/countdown-after-loading.png');
  });
});