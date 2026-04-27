# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: essential.spec.ts >> Elango Surfers - Essential Tests >> game loads at correct URL
- Location: tests/essential.spec.ts:6:3

# Error details

```
Error: page.waitForLoadState: Navigation failed because page crashed!
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, navigateAndDismiss } from './helpers';
  3  | 
  4  | test.describe('Elango Surfers - Essential Tests', () => {
  5  |   
  6  |   test('game loads at correct URL', async ({ page }) => {
  7  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
> 8  |     await page.waitForLoadState('networkidle');
     |                ^ Error: page.waitForLoadState: Navigation failed because page crashed!
  9  |     
  10 |     const url = page.url();
  11 |     console.log('Loaded URL:', url);
  12 |     // Local testing: localhost, CI: localhost, Production: elango-surfers
  13 |     expect(url).toMatch(/localhost|elango-surfers/);
  14 |   });
  15 | 
  16 |   test('page title contains Elango', async ({ page }) => {
  17 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  18 |     await page.waitForTimeout(2000);
  19 |     
  20 |     const title = await page.title();
  21 |     console.log('Page title:', title);
  22 |     expect(title.toLowerCase()).toContain('elango');
  23 |   });
  24 | 
  25 |   test('game canvas renders', async ({ page }) => {
  26 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  27 |     await page.waitForTimeout(3000);
  28 |     
  29 |     // Take screenshot to verify visually
  30 |     const screenshot = await page.screenshot();
  31 |     expect(screenshot.length).toBeGreaterThan(0);
  32 |   });
  33 | });
  34 | 
```