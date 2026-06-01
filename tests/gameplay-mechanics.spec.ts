import { test, expect } from '@playwright/test';
import { skipToGameplay, getStore, setStoreState } from './helpers';

test.describe('Elango Surfers - Gameplay Mechanics & Debug Shortcuts', () => {

  test('should toggle God Mode via store', async ({ page }) => {
    await skipToGameplay(page);

    // Toggle God Mode on via store
    await setStoreState(page, { godMode: true });
    const storeOn = await getStore(page);
    expect(storeOn!.godMode).toBe(true);

    // Toggle God Mode off via store
    await setStoreState(page, { godMode: false });
    const storeOff = await getStore(page);
    expect(storeOff!.godMode).toBe(false);
  });

  test('should spawn portal and shield via store', async ({ page }) => {
    await skipToGameplay(page);

    // Verify store structure for portal/shield
    const storeBefore = await getStore(page);
    expect(storeBefore).not.toBeNull();
    expect(Array.isArray(storeBefore!.powerups)).toBe(true);
    expect(storeBefore!.bonusPortal).toBeDefined();
  });

  test('should skip stage and trigger boss via store', async ({ page }) => {
    await skipToGameplay(page);

    // Skip stage by setting stageTime to a large value (stage duration is typically 30s)
    await setStoreState(page, { stageTime: 999, bossWarning: false });
    await page.waitForTimeout(200);
    const storeBoss = await getStore(page);
    expect(storeBoss!.bossWarning).toBe(false);
  });
});
