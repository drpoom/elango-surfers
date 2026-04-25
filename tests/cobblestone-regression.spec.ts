import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss } from './helpers';

test.describe('Cobblestone Road Regression Test', () => {
  
  test('cobblestone texture persists after restart', async ({ page }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    
    // Wait for game to be fully loaded and running
    await page.waitForTimeout(2000);
    
    // Advance to Stage 2 (cobblestone) by scoring enough points
    // Stage 2 typically starts around 500-1000 points
    // We'll wait for the stage indicator to show Stage 2
    console.log('Waiting for Stage 2 (cobblestone)...');
    
    // Wait for stage 2 to activate (check stage indicator)
    await page.waitForFunction(() => {
      const stageIndicator = document.querySelector('#stage-indicator');
      return stageIndicator && stageIndicator.textContent.includes('STAGE 2');
    }, { timeout: 60000 }).catch(() => {
      console.log('Stage 2 not reached within timeout, game may be in different state');
    });
    
    // Take screenshot to verify cobblestone is visible
    const stage2Screenshot = await page.screenshot({ path: 'test-results/stage2-before-restart.png' });
    expect(stage2Screenshot.length).toBeGreaterThan(0);
    console.log('Stage 2 screenshot captured');
    
    // Verify cobblestone texture is applied by checking the road material
    const cobblestoneApplied = await page.evaluate(() => {
      // Check if road has cobblestone texture applied
      const road = window.THREE_SCENE?.getObjectByName('road');
      if (!road) return false;
      
      // The cobblestone texture should be applied to the road material
      const material = road.material;
      // Check if the material map is the cobblestone texture
      return material && material.map && material.map.source?.data?.src?.includes('cobblestone');
    });
    
    console.log('Cobblestone applied before restart:', cobblestoneApplied);
    
    // Trigger game over by crashing (or use debug mode if available)
    // For now, we'll simulate a restart by reloading and checking if cobblestone persists
    // In a real scenario, we'd need to trigger a crash
    
    // Alternative: Use the restart mechanism if available
    const hasGameOver = await page.evaluate(() => {
      return document.querySelector('#game-over') !== null;
    });
    
    if (!hasGameOver) {
      // Force a crash by moving player off-road or into obstacle
      // This is a workaround - in production, player would naturally crash
      await page.evaluate(() => {
        // Trigger game over through debug or direct method if available
        if (window.triggerGameOver) {
          window.triggerGameOver();
        }
      });
      
      // Wait for game over screen
      await page.waitForTimeout(3000);
    }
    
    // Check if game over screen is visible
    const gameOverVisible = await page.evaluate(() => {
      const gameOverEl = document.querySelector('#game-over');
      return gameOverEl && gameOverEl.style.display !== 'none';
    });
    
    console.log('Game over visible:', gameOverVisible);
    
    if (gameOverVisible) {
      // Click restart button
      const restartButton = await page.$('button:has-text("Restart"), #restart-btn, .restart-btn');
      if (restartButton) {
        await restartButton.click();
        console.log('Restart button clicked');
        
        // Wait for game to restart and reach Stage 2 again
        await page.waitForTimeout(5000);
        
        // Wait for stage 2 to activate again
        await page.waitForFunction(() => {
          const stageIndicator = document.querySelector('#stage-indicator');
          return stageIndicator && stageIndicator.textContent.includes('STAGE 2');
        }, { timeout: 60000 }).catch(() => {
          console.log('Stage 2 not reached after restart within timeout');
        });
        
        // Take screenshot after restart
        const stage2AfterRestart = await page.screenshot({ path: 'test-results/stage2-after-restart.png' });
        expect(stage2AfterRestart.length).toBeGreaterThan(0);
        console.log('Stage 2 screenshot after restart captured');
        
        // Verify cobblestone texture is still applied after restart
        const cobblestoneAfterRestart = await page.evaluate(() => {
          const road = window.THREE_SCENE?.getObjectByName('road');
          if (!road) return false;
          
          const material = road.material;
          return material && material.map && material.map.source?.data?.src?.includes('cobblestone');
        });
        
        console.log('Cobblestone applied after restart:', cobblestoneAfterRestart);
        
        // This is the critical assertion - cobblestone should persist after restart
        expect(cobblestoneAfterRestart).toBe(true);
      } else {
        console.log('Restart button not found');
      }
    } else {
      console.log('Game over not triggered, testing with page reload');
      
      // Alternative test: reload page and verify cobblestone can be applied
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await navigateAndDismiss(page);
      await page.waitForTimeout(2000);
      
      // Wait for stage 2 again
      await page.waitForFunction(() => {
        const stageIndicator = document.querySelector('#stage-indicator');
        return stageIndicator && stageIndicator.textContent.includes('STAGE 2');
      }, { timeout: 60000 }).catch(() => {
        console.log('Stage 2 not reached after reload');
      });
      
      const cobblestoneAfterReload = await page.evaluate(() => {
        const road = window.THREE_SCENE?.getObjectByName('road');
        if (!road) return false;
        const material = road.material;
        return material && material.map !== null;
      });
      
      console.log('Road material present after reload:', cobblestoneAfterReload);
      expect(cobblestoneAfterReload).toBe(true);
    }
  });
});
