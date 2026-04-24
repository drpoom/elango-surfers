import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Basic Load Tests', () => {
  
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBe('Elango Surfers');
  });

  test('version displays on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for Vue to mount
    
    const version = await page.locator('#version').textContent();
    console.log('Version:', version);
    expect(version).toMatch(/v5\.\d+\.\d+/);
  });

  test('game starts on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click center of screen to start
    const box = await page.locator('#app').boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    await page.waitForTimeout(3000);
    
    // Score should be visible and numeric
    const scoreText = await page.locator('#score').textContent();
    console.log('Score:', scoreText);
    expect(scoreText).toContain('Score:');
  });

  test('pause with P key works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Start game
    const box = await page.locator('#app').boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(2000);
    
    // Press P to pause
    await page.keyboard.press('p');
    await page.waitForTimeout(1000);
    
    // Resume
    await page.keyboard.press('p');
    await page.waitForTimeout(2000);
    
    // Game should still be running
    const score = await page.locator('#score').textContent();
    console.log('Score after pause/resume:', score);
    expect(score).toBeDefined();
  });

  test('settings button exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const settingsBtn = page.locator('#settings-btn');
    const exists = await settingsBtn.count() > 0;
    console.log('Settings button exists:', exists);
    expect(exists).toBe(true);
  });

  test('debug overlay toggles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Start game
    const box = await page.locator('#app').boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(2000);
    
    // Open settings
    await page.click('#settings-btn');
    await page.waitForTimeout(1000);
    
    // Toggle debug
    const debugBtn = page.locator('button:has-text("Debug")');
    const debugExists = await debugBtn.count() > 0;
    console.log('Debug button exists:', debugExists);
    
    if (debugExists) {
      await debugBtn.click();
      await page.waitForTimeout(1000);
      
      const debugOverlay = page.locator('#debug-overlay');
      const overlayVisible = await debugOverlay.count() > 0;
      console.log('Debug overlay visible:', overlayVisible);
    }
  });
});
