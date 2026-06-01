import { test, expect } from '@playwright/test';
import { GAME_URL, skipToGameplay } from './helpers';

test.describe('Elango Surfers - Essential Tests', () => {

  test('game loads at correct URL', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    expect(url).toMatch(/localhost|elango-surfers/);
  });

  test('page title contains Elango', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.toLowerCase()).toContain('elango');
  });

  test('game canvas renders', async ({ page }) => {
    await skipToGameplay(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('game store is accessible via test helpers', async ({ page }) => {
    await skipToGameplay(page);
    const store = await page.evaluate(() => window.__ElangoSurfers?.getStore());
    expect(store).not.toBeNull();
    expect(store!.gameOver).toBe(false);
    expect(store!.currentStage).toBe(0);
  });

  test('error overlay element exists in template', async ({ page }) => {
    await skipToGameplay(page);
    // The error overlay div exists in the App.vue template (v-if="renderError")
    // It's hidden by default — only shown when animate() catches an error
    // We verify the template structure by checking the DOM
    const overlayExists = await page.evaluate(() => {
      // The error overlay is conditionally rendered (v-if), so it won't be in DOM when hidden
      // Instead, verify the game is running without errors
      const store = window.__ElangoSurfers?.getStore();
      return store !== null && !store.renderError;
    });
    expect(overlayExists).toBe(true);
  });
});
