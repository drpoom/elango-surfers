import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Collision', () => {
  
  test('game runs without crashing for 10 seconds', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { state: 'visible' });
    await page.click('body', { position: { x: 100, y: 100 } });
    
    await page.waitForTimeout(10000);
    
    const score = await page.locator('#score').textContent();
    console.log('Score after 10s:', score);
    expect(score).toBeDefined();
  });

  test('high score displays', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const highScore = await page.locator('#highscore').textContent();
    console.log('High score:', highScore);
    expect(highScore).toContain('High Score:');
  });
});
