# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: loading-screen.spec.ts >> Elango Surfers Loading Screen >> 1: Loading screen is visible on page load
- Location: tests/loading-screen.spec.ts:5:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('.loading-screen')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for locator('.loading-screen')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, navigateAndDismiss } from './helpers';
  3  | 
  4  | test.describe('Elango Surfers Loading Screen', () => {
  5  |   test('1: Loading screen is visible on page load', async ({ page }) => {
  6  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  7  |     const loadingScreen = page.locator('.loading-screen');
> 8  |     await expect(loadingScreen).toBeVisible({ timeout: 60000 });
     |                                 ^ Error: expect(locator).toBeVisible() failed
  9  |     // Verify version text
  10 |     await expect(page.locator('.loading-screen .version')).toBeVisible({ timeout: 60000 });
  11 |     await page.screenshot({ path: 'tests/screenshots/loading-screen-visible.png' });
  12 |   });
  13 | 
  14 |   test('2: Keypress dismisses loading screen', async ({ page }) => {
  15 |     await navigateAndDismiss(page);
  16 |     await page.screenshot({ path: 'tests/screenshots/loading-screen-dismissed.png' });
  17 |   });
  18 | 
  19 |   test('3: Loading progress shows percentage', async ({ page }) => {
  20 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  21 |     const loadingScreen = page.locator('.loading-screen');
  22 |     await expect(loadingScreen).toBeVisible({ timeout: 60000 });
  23 |     // Wait for loading to complete — "Press any key" prompt appears
  24 |     await expect(page.locator('text=Press any key')).toBeVisible({ timeout: 60000 });
  25 |     await page.screenshot({ path: 'tests/screenshots/loading-progress-complete.png' });
  26 |   });
  27 | });
```