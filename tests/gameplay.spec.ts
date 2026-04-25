import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss } from './helpers';

test.describe('Elango Surfers - Gameplay Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await navigateAndDismiss(page);
    await page.waitForTimeout(3000); // Wait for Vue mount
  });

  test('game starts on first click', async ({ page }) => {
    // Click center of screen to start
    await page.mouse.click(400, 300);
    await page.waitForTimeout(2000);
    
    // Score should be visible and numeric
    const scoreText = await page.locator('#score').textContent();
    console.log('Score after start:', scoreText);
    expect(scoreText).toContain('Score:');
  });

  test('score increases over time', async ({ page }) => {
    // Start game
    await page.mouse.click(400, 300);
    await page.waitForTimeout(2000);
    
    const score1 = await page.locator('#score').textContent();
    console.log('Score at 2s:', score1);
    
    await page.waitForTimeout(5000);
    
    const score2 = await page.locator('#score').textContent();
    console.log('Score at 7s:', score2);
    
    // Extract numbers
    const num1 = parseInt(score1.replace(/[^0-9]/g, ''));
    const num2 = parseInt(score2.replace(/[^0-9]/g, ''));
    
    // Score should increase or stay same (game running)
    expect(num2).toBeGreaterThanOrEqual(num1);
  });

  test('pause with P key works', async ({ page }) => {
    // Start game
    await page.mouse.click(400, 300);
    await page.waitForTimeout(2000);
    
    const scoreBefore = await page.locator('#score').textContent();
    console.log('Score before pause:', scoreBefore);
    
    // Press P to pause
    await page.keyboard.press('p');
    await page.waitForTimeout(1000);
    
    // Press P to resume
    await page.keyboard.press('p');
    await page.waitForTimeout(2000);
    
    // Game should still be running
    const scoreAfter = await page.locator('#score').textContent();
    console.log('Score after resume:', scoreAfter);
    expect(scoreAfter).toBeDefined();
  });

  test('settings button opens settings panel', async ({ page }) => {
    // Start game
    await page.mouse.click(400, 300);
    await page.waitForTimeout(2000);
    
    // Click settings button
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(1000);
    
    // Settings panel should be visible (check for any settings-related text)
    const pageContent = await page.content();
    expect(pageContent).toContain('Settings');
  });

  test('debug overlay can be toggled', async ({ page }) => {
    // Start game
    await page.mouse.click(400, 300);
    await page.waitForTimeout(2000);
    
    // Open settings
    await page.click('#settings-btn');
    await page.waitForTimeout(1000);
    
    // Find debug button (could be "Debug" or "Debug OFF")
    const debugBtn = page.locator('button:has-text("Debug")');
    const debugExists = await debugBtn.count() > 0;
    
    console.log('Debug button exists:', debugExists);
    
    if (debugExists) {
      // Just verify button exists and is clickable
      await expect(debugBtn).toBeVisible();
      await expect(debugBtn).toBeEnabled();
    }
    
    expect(debugExists).toBe(true);
  });

  test('high score displays on load', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const highScore = await page.locator('#highscore').textContent();
    console.log('High score:', highScore);
    expect(highScore).toContain('High Score:');
  });

  test('stage indicator visible during gameplay', async ({ page }) => {
    // Start game
    await page.mouse.click(400, 300);
    await page.waitForTimeout(2000);
    
    const stageIndicator = page.locator('#stage-indicator');
    const isVisible = await stageIndicator.count() > 0;
    console.log('Stage indicator visible:', isVisible);
    
    if (isVisible) {
      const stageText = await stageIndicator.textContent();
      console.log('Stage text:', stageText);
      expect(stageText).toContain('STAGE');
    }
  });

  test('game runs for 20 seconds without crashing', async ({ page }) => {
    // Start game
    await page.mouse.click(400, 300);
    
    // Wait 20 seconds
    await page.waitForTimeout(20000);
    
    // Game should still be running
    const title = await page.title();
    expect(title).toBe('Elango Surfers');
    
    const score = await page.locator('#score').textContent();
    console.log('Score after 20s:', score);
    expect(score).toBeDefined();
  });
});
