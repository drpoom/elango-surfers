# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: boss-fight.spec.ts >> Boss Fights >> God mode survives boss
- Location: tests/boss-fight.spec.ts:53:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('canvas') to be visible
    - locator resolved to visible <canvas width="1280" height="720" data-engine="three.js r183"></canvas>

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.0.25
    - generic: "Score: 3079"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic:
    - generic: 🌫️ FOG!
  - generic: ⬅️
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]: 🎤🔴
    - generic [ref=e6] [cursor=pointer]: 📱
    - generic [ref=e7] [cursor=pointer]: 🔊
    - generic [ref=e8] [cursor=pointer]: ⚙️
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, dismissLoadingScreen } from './helpers';
  3  | 
  4  | test.describe('Boss Fights', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     test.setTimeout(120000);
  7  |     await page.goto(GAME_URL);
  8  |     await dismissLoadingScreen(page);
> 9  |     await page.waitForSelector('canvas', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  10 |     await page.waitForTimeout(3000);
  11 |   });
  12 | 
  13 |   async function enterDebugCode(page) {
  14 |     await page.keyboard.press('d');
  15 |     await page.waitForTimeout(100);
  16 |     await page.keyboard.press('e');
  17 |     await page.waitForTimeout(100);
  18 |     await page.keyboard.press('b');
  19 |     await page.waitForTimeout(100);
  20 |     await page.keyboard.press('u');
  21 |     await page.waitForTimeout(100);
  22 |     await page.keyboard.press('g');
  23 |     await page.waitForTimeout(500);
  24 |   }
  25 | 
  26 |   test('Stage 1 Boss', async ({ page }) => {
  27 |     await enterDebugCode(page);
  28 |     await page.keyboard.press('1');
  29 |     await page.waitForTimeout(2000);
  30 |     await page.keyboard.press('b');
  31 |     await page.waitForTimeout(3000);
  32 |     await page.screenshot({ path: 'tests/screenshots/stage1-boss.png' });
  33 |   });
  34 | 
  35 |   test('Stage 2 Boss', async ({ page }) => {
  36 |     await enterDebugCode(page);
  37 |     await page.keyboard.press('2');
  38 |     await page.waitForTimeout(2000);
  39 |     await page.keyboard.press('b');
  40 |     await page.waitForTimeout(3000);
  41 |     await page.screenshot({ path: 'tests/screenshots/stage2-boss.png' });
  42 |   });
  43 | 
  44 |   test('Stage 3 Boss', async ({ page }) => {
  45 |     await enterDebugCode(page);
  46 |     await page.keyboard.press('3');
  47 |     await page.waitForTimeout(2000);
  48 |     await page.keyboard.press('b');
  49 |     await page.waitForTimeout(3000);
  50 |     await page.screenshot({ path: 'tests/screenshots/stage3-boss.png' });
  51 |   });
  52 | 
  53 |   test('God mode survives boss', async ({ page }) => {
  54 |     await enterDebugCode(page);
  55 |     await page.keyboard.press('g');
  56 |     await page.waitForTimeout(500);
  57 |     await page.keyboard.press('1');
  58 |     await page.waitForTimeout(2000);
  59 |     await page.keyboard.press('b');
  60 |     await page.waitForTimeout(5000);
  61 |     // Verify no game over screen
  62 |     const gameOverVisible = await page.locator('text=Game Over').isVisible().catch(() => false);
  63 |     expect(gameOverVisible).toBe(false);
  64 |     await page.screenshot({ path: 'tests/screenshots/god-mode-boss.png' });
  65 |   });
  66 | 
  67 |   test('Player death by boss', async ({ page }) => {
  68 |     test.setTimeout(90000);
  69 |     await enterDebugCode(page);
  70 |     await page.keyboard.press('1');
  71 |     await page.waitForTimeout(2000);
  72 |     await page.keyboard.press('b');
  73 |     // Wait up to 10s for game over
  74 |     await page.waitForTimeout(10000);
  75 |     await page.screenshot({ path: 'tests/screenshots/player-death-boss.png' });
  76 |   });
  77 | });
```