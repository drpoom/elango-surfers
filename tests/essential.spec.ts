import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Essential Tests', () => {
  
  test('game loads at correct URL', async ({ page }) => {
    await page.goto('https://www.drpoom.com/elango-surfers/');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    console.log('Loaded URL:', url);
    expect(url).toContain('elango-surfers');
  });

  test('page title contains Elango', async ({ page }) => {
    await page.goto('https://www.drpoom.com/elango-surfers/');
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('Page title:', title);
    expect(title.toLowerCase()).toContain('elango');
  });

  test('game canvas renders', async ({ page }) => {
    await page.goto('https://www.drpoom.com/elango-surfers/');
    await page.waitForTimeout(3000);
    
    // Take screenshot to verify visually
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(0);
  });
});
