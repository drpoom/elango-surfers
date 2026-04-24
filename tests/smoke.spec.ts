import { test, expect } from '@playwright/test';

test.describe('Elango Surfers - Smoke Tests', () => {
  
  test('page loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Elango Surfers');
  });

  test('canvas element exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('app container exists', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('#app');
    await expect(app).toBeVisible();
  });

  test('version text appears in page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // Wait for Vue mount
    
    const pageContent = await page.content();
    expect(pageContent).toContain('v5.');
  });

  test('game does not crash for 15 seconds', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(15000);
    
    // If we get here, game didn't crash
    const title = await page.title();
    expect(title).toBe('Elango Surfers');
  });
});
