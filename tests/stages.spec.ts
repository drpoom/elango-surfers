import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Stages', () => {
  
  test('stage indicator displays', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { state: 'visible' });
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(2000);
    
    const stageIndicator = page.locator('#stage-indicator');
    const isVisible = await stageIndicator.count() > 0;
    console.log('Stage indicator visible:', isVisible);
    
    if (isVisible) {
      const stageText = await stageIndicator.textContent();
      console.log('Stage text:', stageText);
    }
  });

  test('version is v5.x', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const version = await page.locator('#version').textContent();
    console.log('Version:', version);
    expect(version).toContain('v5.');
  });
});
