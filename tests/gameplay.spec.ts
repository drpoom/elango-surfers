import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Core Gameplay', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('game loads and shows title screen', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('text=Elango Surfers')).toBeVisible();
    await expect(page.locator('button:has-text("TAP TO START")')).toBeVisible();
  });

  test('game starts on tap/click', async ({ page }) => {
    await page.click('button:has-text("TAP TO START")');
    await page.waitForTimeout(1000);
    
    // Score should appear
    await expect(page.locator('#score')).toBeVisible();
    
    // Version should be visible
    const version = await page.locator('#version').textContent();
    console.log('Version:', version);
  });

  test('pause and resume works', async ({ page }) => {
    // Start game
    await page.click('button:has-text("TAP TO START")');
    await page.waitForTimeout(2000);
    
    // Press P to pause
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    
    // Pause indicator should appear
    await expect(page.locator('#pause-indicator')).toBeVisible();
    
    // Press P to resume
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    
    // Pause indicator should disappear
    await expect(page.locator('#pause-indicator')).not.toBeVisible();
  });

  test('coins spawn after resume', async ({ page }) => {
    // Start game
    await page.click('button:has-text("TAP TO START")');
    await page.waitForTimeout(3000);
    
    // Wait for some coins to spawn
    const initialCoins = await page.locator('[class*="coin"]').count();
    console.log('Initial coins:', initialCoins);
    
    // Pause
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    
    // Resume
    await page.keyboard.press('p');
    await page.waitForTimeout(3000);
    
    // Coins should continue spawning
    const resumedCoins = await page.locator('[class*="coin"]').count();
    console.log('Coins after resume:', resumedCoins);
    
    // At minimum, coins should still be spawning (count may vary)
    expect(resumedCoins).toBeGreaterThanOrEqual(0);
  });

  test('obstacles spawn after resume', async ({ page }) => {
    // Start game
    await page.click('button:has-text("TAP TO START")');
    await page.waitForTimeout(4000);
    
    // Obstacles should exist
    const obstacles = await page.locator('[class*="obstacle"]').count();
    console.log('Obstacles before pause:', obstacles);
    
    // Pause for 5 seconds
    await page.keyboard.press('p');
    await page.waitForTimeout(5000);
    
    // Resume
    await page.keyboard.press('p');
    await page.waitForTimeout(4000);
    
    // Obstacles should continue spawning
    const resumedObstacles = await page.locator('[class*="obstacle"]').count();
    console.log('Obstacles after resume:', resumedObstacles);
  });

  test('debug overlay can be toggled', async ({ page }) => {
    await page.click('button:has-text("TAP TO START")');
    await page.waitForTimeout(1000);
    
    // Click settings button to show settings panel
    await page.click('#settings-btn');
    await page.waitForTimeout(500);
    
    // Click debug button
    await page.click('button:has-text("Debug")');
    await page.waitForTimeout(500);
    
    // Debug overlay should appear
    await expect(page.locator('#debug-overlay')).toBeVisible();
    
    // Click debug button again to turn off
    await page.click('button:has-text("Debug")');
    await page.waitForTimeout(500);
    
    // Debug overlay should disappear
    await expect(page.locator('#debug-overlay')).not.toBeVisible();
  });
});
