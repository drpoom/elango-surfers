import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Boss UI', () => {
  
  test('boss warning element exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { state: 'visible' });
    
    // Check if boss warning element exists in DOM
    const bossWarning = page.locator('#boss-warning');
    const exists = await bossWarning.count() > 0;
    console.log('Boss warning element exists:', exists);
    
    // Element should exist (may be hidden)
    expect(exists).toBe(true);
  });

  test('boss bar element exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { state: 'visible' });
    
    const bossBar = page.locator('#boss-bar');
    const exists = await bossBar.count() > 0;
    console.log('Boss bar element exists:', exists);
    
    expect(exists).toBe(true);
  });
});
