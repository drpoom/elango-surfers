# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-journey.spec.ts >> Elango Surfers User Journey >> 4: Settings panel opens/closes
- Location: tests/user-journey.spec.ts:40:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.screenshot: Test timeout of 60000ms exceeded.
Call log:
  - taking page screenshot
  - waiting for fonts to load...

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.0.25
    - generic: "Score: 3527"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic:
    - generic: 🌫️ FOG!
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]: 🎤🔴
    - generic [ref=e6] [cursor=pointer]: 📱
    - generic [ref=e7] [cursor=pointer]: 🔊
    - generic [ref=e8] [cursor=pointer]: ⚙️
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, navigateAndDismiss } from './helpers';
  3  | 
  4  | test.describe('Elango Surfers User Journey', () => {
  5  |   test('1: Game loads, canvas renders, countdown shows', async ({ page }) => {
  6  |     await navigateAndDismiss(page);
  7  |     const canvas = page.locator('canvas');
  8  |     await expect(canvas).toBeVisible({ timeout: 15000 });
  9  |     await page.screenshot({ path: 'tests/screenshots/01-game-loaded.png' });
  10 |   });
  11 | 
  12 |   test('2: Arrow keys move character (left/right lane changes)', async ({ page }) => {
  13 |     await navigateAndDismiss(page);
  14 |     const canvas = page.locator('canvas');
  15 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  16 |     // Press arrow keys to move character
  17 |     await page.keyboard.press('ArrowLeft');
  18 |     await page.waitForTimeout(300);
  19 |     await page.keyboard.press('ArrowRight');
  20 |     await page.waitForTimeout(300);
  21 |     await page.keyboard.press('ArrowUp');
  22 |     await page.waitForTimeout(300);
  23 |     await page.screenshot({ path: 'tests/screenshots/02-arrow-keys.png' });
  24 |   });
  25 | 
  26 |   test('3: P key pauses, click resumes', async ({ page }) => {
  27 |     await navigateAndDismiss(page);
  28 |     const canvas = page.locator('canvas');
  29 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  30 |     // Pause with P
  31 |     await page.keyboard.press('p');
  32 |     await page.waitForTimeout(500);
  33 |     await page.screenshot({ path: 'tests/screenshots/03a-paused.png' });
  34 |     // Resume by pressing P again
  35 |     await page.keyboard.press('p');
  36 |     await page.waitForTimeout(500);
  37 |     await page.screenshot({ path: 'tests/screenshots/03b-resumed.png' });
  38 |   });
  39 | 
  40 |   test('4: Settings panel opens/closes', async ({ page }) => {
  41 |     await navigateAndDismiss(page);
  42 |     const canvas = page.locator('canvas');
  43 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  44 |     // Try S key or settings button
  45 |     await page.keyboard.press('s');
  46 |     await page.waitForTimeout(500);
  47 |     await page.screenshot({ path: 'tests/screenshots/04a-settings-open.png' });
  48 |     await page.keyboard.press('Escape');
  49 |     await page.waitForTimeout(500);
> 50 |     await page.screenshot({ path: 'tests/screenshots/04b-settings-closed.png' });
     |                ^ Error: page.screenshot: Test timeout of 60000ms exceeded.
  51 |   });
  52 | 
  53 |   test('5: Debug overlay toggles on/off', async ({ page }) => {
  54 |     await navigateAndDismiss(page);
  55 |     const canvas = page.locator('canvas');
  56 |     await expect(canvas).toBeVisible({ timeout: 15000 });
  57 |     // Toggle debug with D key
  58 |     await page.keyboard.press('d');
  59 |     await page.waitForTimeout(500);
  60 |     await page.screenshot({ path: 'tests/screenshots/05a-debug-on.png' });
  61 |     await page.keyboard.press('d');
  62 |     await page.waitForTimeout(500);
  63 |     await page.screenshot({ path: 'tests/screenshots/05b-debug-off.png' });
  64 |   });
  65 | });
```