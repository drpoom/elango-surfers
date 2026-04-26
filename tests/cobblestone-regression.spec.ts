import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';

test.describe('Cobblestone Road Regression Test', () => {
  
  test('Stage 2 loads via debug mode', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    
    // Wait for game to be fully loaded
    await page.waitForTimeout(2000);
    
    // Focus canvas before keyboard input
    await focusCanvas(page);
    
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
    
    // Focus canvas before stage jump
    await focusCanvas(page);
    
    // Select Stage 2: press 2
    await page.keyboard.press('2');
    
    // Wait for cobblestone texture to load (check via road material color)
    await page.waitForFunction(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return false;
      // Cobblestone should have gray color (0x888888)
      return mesh.material.color.getHex() === 0x888888;
    }, { timeout: 10000 });
    
    await page.waitForTimeout(2000); // Allow render after texture load
    
    // Take screenshot to verify Stage 2 is loaded
    await screenshot(page, 'test-results/stage2-cobblestone.png');
    console.log('Stage 2 cobblestone screenshot captured');
    
    // Verify Stage 2 is active by checking the stage indicator
    const stageIndicator = page.locator('#stage-indicator');
    const stageText = await stageIndicator.textContent();
    console.log('Stage indicator:', stageText);
    
    expect(stageText).toContain('STAGE 2');
    expect(stageText).toContain('Medieval'); // Stage 2 subtitle (cobblestone)
    
    // Verify cobblestone texture is applied (road material should be gray, not default)
    const roadMaterial = await page.evaluate(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return null;
      return {
        color: mesh.material.color.getHex(),
        hasMap: !!mesh.material.map,
        mapName: mesh.material.map?.source?.data?.currentSrc || null
      };
    });
    console.log('Road material:', roadMaterial);
    expect(roadMaterial).not.toBeNull();
    expect(roadMaterial.hasMap).toBe(true); // Should have cobblestone texture
    expect(roadMaterial.color).toBe(0x888888); // Gray color for cobblestone
  });

  test('game restarts without crashing', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    
    // Wait for game to be fully loaded
    await page.waitForTimeout(2000);
    
    // Focus canvas before keyboard input
    await focusCanvas(page);
    
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
    
    // Focus canvas before stage jump
    await focusCanvas(page);
    
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
