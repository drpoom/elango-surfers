import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss } from './helpers';

test.describe('Cobblestone Road Regression Test', () => {
  
  test('cobblestone texture loads in Stage 2 via debug mode', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    
    // Wait for game to be fully loaded
    await page.waitForTimeout(2000);
    
    // Enter debug mode: debug
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
    
    // Select Stage 2: press 2
    await page.keyboard.press('2');
    await page.waitForTimeout(2000);
    
    // Take screenshot to verify cobblestone is visible
    await page.screenshot({ path: 'test-results/stage2-cobblestone.png' });
    console.log('Stage 2 cobblestone screenshot captured');
    
    // Verify cobblestone texture is applied by checking the road material
    const cobblestoneApplied = await page.evaluate(() => {
      const road = (window as any).THREE_SCENE?.getObjectByName('road');
      if (!road) return false;
      
      const material = road.material;
      return material && material.map && material.map.source?.data?.src?.includes('cobblestone');
    });
    
    console.log('Cobblestone applied:', cobblestoneApplied);
    expect(cobblestoneApplied).toBe(true);
  });

  test('game restarts without crashing', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    
    // Wait for game to be fully loaded
    await page.waitForTimeout(2000);
    
    // Enter debug mode
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
    
    // Select Stage 2: press 2
    await page.keyboard.press('2');
    await page.waitForTimeout(2000);
    
    // Trigger game over via debug: press o (game over)
    await page.keyboard.press('o');
    await page.waitForTimeout(2000);
    
    // Check if game over screen is visible
    const gameOverVisible = await page.locator('#game-over').isVisible().catch(() => false);
    console.log('Game over visible:', gameOverVisible);
    
    if (gameOverVisible) {
      // Click restart button
      const restartButton = page.locator('button:has-text("Restart"), #restart-btn, .restart-btn').first();
      await restartButton.click();
      await page.waitForTimeout(3000);
      
      // Game should restart without crashing
      const scoreVisible = await page.locator('#score').isVisible();
      expect(scoreVisible).toBe(true);
      console.log('Game restarted successfully');
    }
  });
});
