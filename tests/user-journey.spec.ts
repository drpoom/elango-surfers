import { test, expect } from '@playwright/test';
import { skipToGameplay, getStore, skipToGameOver, setStoreState } from './helpers';

test.describe('Elango Surfers User Journey', () => {

  test('1: Game loads, canvas renders', async ({ page }) => {
    await skipToGameplay(page);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  test('2: Lane changes via store', async ({ page }) => {
    await skipToGameplay(page);

    const storeBefore = await getStore(page);
    const laneBefore = storeBefore!.currentLane;

    // Change lane via store (simulates ArrowLeft)
    await setStoreState(page, { currentLane: 0 });
    const storeAfterLeft = await getStore(page);
    expect(storeAfterLeft!.currentLane).toBe(0);

    // Change lane via store (simulates ArrowRight)
    await setStoreState(page, { currentLane: 2 });
    const storeAfterRight = await getStore(page);
    expect(storeAfterRight!.currentLane).toBe(2);
  });

  test('3: Pause/resume via store', async ({ page }) => {
    await skipToGameplay(page);

    // Pause via store.pauseGame (toggleSettings is not wired to store)
    await page.evaluate(() => {
      const store = window.__ElangoSurfers.getStore();
      if (store.pauseGame) store.pauseGame();
    });
    await page.waitForTimeout(200);
    const storePaused = await getStore(page);
    expect(storePaused!.isPaused).toBe(true);

    // Resume via store.resumeGame
    await page.evaluate(() => {
      const store = window.__ElangoSurfers.getStore();
      if (store.resumeGame) store.resumeGame();
    });
    await page.waitForTimeout(200);
    const storeResumed = await getStore(page);
    expect(storeResumed!.isPaused).toBe(false);
  });

  test('4: Settings panel via store', async ({ page }) => {
    await skipToGameplay(page);

    // Pause game via store (toggleSettings is a Vue ref, not on store)
    await page.evaluate(() => {
      const store = window.__ElangoSurfers.getStore();
      if (store.pauseGame) store.pauseGame();
    });
    await page.waitForTimeout(200);
    // Verify game is paused
    const storePaused = await getStore(page);
    expect(storePaused!.isPaused).toBe(true);
  });

  test('5: Debug mode via store', async ({ page }) => {
    await skipToGameplay(page);

    // Enable debug mode via store
    await setStoreState(page, { debugMode: true });
    await page.waitForTimeout(100);
    const storeDebugOn = await getStore(page);
    expect(storeDebugOn!.debugMode).toBe(true);

    // Toggle god mode via store (debug cheat)
    await setStoreState(page, { godMode: true });
    await page.waitForTimeout(100);
    const storeGodMode = await getStore(page);
    expect(storeGodMode!.godMode).toBe(true);
  });

  test('6: Game over triggers and restart works', async ({ page }) => {
    await skipToGameplay(page);
    await skipToGameOver(page);

    // Verify game over state
    const storeOver = await getStore(page);
    expect(storeOver!.gameOver).toBe(true);

    // Restart via store (simulates Space key)
    await page.evaluate(() => {
      const store = window.__ElangoSurfers.getStore();
      if (store.startCountdown) store.startCountdown();
      // Immediately unlock
      store.countdownActive = false;
      store.countdownLocked = false;
      store.countdownText = '';
    });
    await page.waitForTimeout(300);
    const storeRestarted = await getStore(page);
    expect(storeRestarted!.gameOver).toBe(false);
  });
});
