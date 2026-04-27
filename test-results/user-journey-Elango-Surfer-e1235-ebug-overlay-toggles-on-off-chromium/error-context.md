# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-journey.spec.ts >> Elango Surfers User Journey >> 5: Debug overlay toggles on/off
- Location: tests/user-journey.spec.ts:61:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: keyboard.press: Target crashed 
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';
  3  | 
  4  | test.describe('Elango Surfers User Journey', () => {
  5  |   test('1: Game loads, canvas renders, countdown shows', async ({ page }) => {
  6  |     await navigateAndDismiss(page);
  7  |     const canvas = page.locator('canvas');
  8  |     await expect(canvas).toBeVisible({ timeout: 15000 });
  9  |     await screenshot(page, 'tests/screenshots/01-game-loaded.png');
  10 |   });
  11 | 
  12 |   test('2: Arrow keys move character (left/right lane changes)', async ({ page }) => {
  13 |     await navigateAndDismiss(page);
  14 |     const canvas = page.locator('canvas');
  15 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  16 |     // Focus canvas before keyboard input
  17 |     await focusCanvas(page);
  18 |     // Press arrow keys to move character
  19 |     await page.keyboard.press('ArrowLeft');
  20 |     await page.waitForTimeout(300);
  21 |     await page.keyboard.press('ArrowRight');
  22 |     await page.waitForTimeout(300);
  23 |     await page.keyboard.press('ArrowUp');
  24 |     await page.waitForTimeout(300);
  25 |     await screenshot(page, 'tests/screenshots/02-arrow-keys.png');
  26 |   });
  27 | 
  28 |   test('3: P key pauses, click resumes', async ({ page }) => {
  29 |     await navigateAndDismiss(page);
  30 |     const canvas = page.locator('canvas');
  31 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  32 |     // Focus canvas before keyboard input
  33 |     await focusCanvas(page);
  34 |     // Pause with P
  35 |     await page.keyboard.press('p');
  36 |     await page.waitForTimeout(500);
  37 |     await screenshot(page, 'tests/screenshots/03a-paused.png');
  38 |     // Focus canvas before resume
  39 |     await focusCanvas(page);
  40 |     // Resume by pressing P again
  41 |     await page.keyboard.press('p');
  42 |     await page.waitForTimeout(500);
  43 |     await screenshot(page, 'tests/screenshots/03b-resumed.png');
  44 |   });
  45 | 
  46 |   test('4: Settings panel opens/closes', async ({ page }) => {
  47 |     await navigateAndDismiss(page);
  48 |     const canvas = page.locator('canvas');
  49 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  50 |     // Focus canvas before keyboard input
  51 |     await focusCanvas(page);
  52 |     // Try S key or settings button
  53 |     await page.keyboard.press('s');
  54 |     await page.waitForTimeout(500);
  55 |     await screenshot(page, 'tests/screenshots/04a-settings-open.png');
  56 |     await page.keyboard.press('Escape');
  57 |     await page.waitForTimeout(500);
  58 |     await screenshot(page, 'tests/screenshots/04b-settings-closed.png');
  59 |   });
  60 | 
  61 |   test('5: Debug overlay toggles on/off', async ({ page }) => {
  62 |     await navigateAndDismiss(page);
  63 |     const canvas = page.locator('canvas');
  64 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  65 |     // Focus canvas before keyboard input
  66 |     await focusCanvas(page);
  67 |     // Toggle debug with D key
> 68 |     await page.keyboard.press('d');
     |                         ^ Error: keyboard.press: Target crashed 
  69 |     await page.waitForTimeout(500);
  70 |     await screenshot(page, 'tests/screenshots/05a-debug-on.png');
  71 |     await page.keyboard.press('d');
  72 |     await page.waitForTimeout(500);
  73 |     await screenshot(page, 'tests/screenshots/05b-debug-off.png');
  74 |   });
  75 | });
  76 | 
```