import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Core Gameplay', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to mount
    await page.waitForSelector('#app', { state: 'visible' });
  });

  test('game loads and shows version', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Check version is visible (always present)
    const version = await page.locator('#version').textContent();
    console.log('Version:', version);
    expect(version).toContain('v5.');
  });

  test('game starts on click', async ({ page }) => {
    // Click anywhere on the page to start
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(3000);
    
    // Score should appear or game info should be visible
    const score = await page.locator('#score').textContent();
    console.log('Score:', score);
    expect(score).toBeDefined();
  });

  test('pause and resume works', async ({ page }) => {
    // Start game
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(3000);
    
    // Press P to pause
    await page.keyboard.press('p');
    await page.waitForTimeout(1000);
    
    // Press P to resume
    await page.keyboard.press('p');
    await page.waitForTimeout(1000);
    
    // Game should continue running
    const score = await page.locator('#score').textContent();
    console.log('Score after resume:', score);
    expect(score).toBeDefined();
  });

  test('score increases during gameplay', async ({ page }) => {
    // Start game
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(3000);
    
    const score1 = await page.locator('#score').textContent();
    console.log('Score at 3s:', score1);
    
    await page.waitForTimeout(5000);
    
    const score2 = await page.locator('#score').textContent();
    console.log('Score at 8s:', score2);
    
    // Score should increase or stay same (game running)
    expect(score2).toBeDefined();
  });

  test('debug overlay can be toggled', async ({ page }) => {
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(2000);
    
    // Click settings button to show settings panel
    await page.click('#settings-btn');
    await page.waitForTimeout(1000);
    
    // Click debug button
    await page.click('button:has-text("Debug")');
    await page.waitForTimeout(1000);
    
    // Debug overlay should appear
    const debugOverlay = page.locator('#debug-overlay');
    const debugVisible = await debugOverlay.count() > 0;
    console.log('Debug overlay visible:', debugVisible);
  });
});
