# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: boss-fight.spec.ts >> Boss Fights >> Stage 3 Boss
- Location: tests/boss-fight.spec.ts:51:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, dismissLoadingScreen, focusCanvas, screenshot } from './helpers';
  3  | 
  4  | test.describe('Boss Fights', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     test.setTimeout(120000);
> 7  |     await page.goto(GAME_URL);
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  8  |     await dismissLoadingScreen(page);
  9  |     // Canvas should already exist after dismissLoadingScreen
  10 |     // Just verify it's visible, don't wait for it to appear
  11 |     await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
  12 |     await page.waitForTimeout(2000);
  13 |   });
  14 | 
  15 |   async function enterDebugCode(page) {
  16 |     await focusCanvas(page);
  17 |     await page.keyboard.press('d');
  18 |     await page.waitForTimeout(100);
  19 |     await page.keyboard.press('e');
  20 |     await page.waitForTimeout(100);
  21 |     await page.keyboard.press('b');
  22 |     await page.waitForTimeout(100);
  23 |     await page.keyboard.press('u');
  24 |     await page.waitForTimeout(100);
  25 |     await page.keyboard.press('g');
  26 |     await page.waitForTimeout(500);
  27 |   }
  28 | 
  29 |   test('Stage 1 Boss', async ({ page }) => {
  30 |     await enterDebugCode(page);
  31 |     await focusCanvas(page);
  32 |     await page.keyboard.press('1');
  33 |     await page.waitForTimeout(2000);
  34 |     await focusCanvas(page);
  35 |     await page.keyboard.press('b');
  36 |     await page.waitForTimeout(3000);
  37 |     await screenshot(page, 'tests/screenshots/stage1-boss.png');
  38 |   });
  39 | 
  40 |   test('Stage 2 Boss', async ({ page }) => {
  41 |     await enterDebugCode(page);
  42 |     await focusCanvas(page);
  43 |     await page.keyboard.press('2');
  44 |     await page.waitForTimeout(2000);
  45 |     await focusCanvas(page);
  46 |     await page.keyboard.press('b');
  47 |     await page.waitForTimeout(3000);
  48 |     await screenshot(page, 'tests/screenshots/stage2-boss.png');
  49 |   });
  50 | 
  51 |   test('Stage 3 Boss', async ({ page }) => {
  52 |     await enterDebugCode(page);
  53 |     await focusCanvas(page);
  54 |     await page.keyboard.press('3');
  55 |     await page.waitForTimeout(2000);
  56 |     await focusCanvas(page);
  57 |     await page.keyboard.press('b');
  58 |     await page.waitForTimeout(3000);
  59 |     await screenshot(page, 'tests/screenshots/stage3-boss.png');
  60 |   });
  61 | 
  62 |   test('God mode survives boss', async ({ page }) => {
  63 |     await enterDebugCode(page);
  64 |     await focusCanvas(page);
  65 |     await page.keyboard.press('g');
  66 |     await page.waitForTimeout(500);
  67 |     await focusCanvas(page);
  68 |     await page.keyboard.press('1');
  69 |     await page.waitForTimeout(2000);
  70 |     await focusCanvas(page);
  71 |     await page.keyboard.press('b');
  72 |     await page.waitForTimeout(5000);
  73 |     // Verify no game over screen
  74 |     const gameOverVisible = await page.locator('text=Game Over').isVisible().catch(() => false);
  75 |     expect(gameOverVisible).toBe(false);
  76 |     await screenshot(page, 'tests/screenshots/god-mode-boss.png');
  77 |   });
  78 | 
  79 |   test('Player death by boss', async ({ page }) => {
  80 |     test.setTimeout(90000);
  81 |     await enterDebugCode(page);
  82 |     await focusCanvas(page);
  83 |     await page.keyboard.press('1');
  84 |     await page.waitForTimeout(2000);
  85 |     await focusCanvas(page);
  86 |     await page.keyboard.press('b');
  87 |     // Wait up to 10s for game over
  88 |     await page.waitForTimeout(10000);
  89 |     await screenshot(page, 'tests/screenshots/player-death-boss.png');
  90 |   });
  91 | });
  92 | 
```