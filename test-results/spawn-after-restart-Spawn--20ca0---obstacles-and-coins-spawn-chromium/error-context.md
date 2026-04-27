# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: spawn-after-restart.spec.ts >> Spawn After Restart >> Stage 2 - obstacles and coins spawn
- Location: tests/spawn-after-restart.spec.ts:45:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('canvas')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('canvas')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, dismissLoadingScreen, focusCanvas } from './helpers';
  3  | 
  4  | test.describe('Spawn After Restart', () => {
  5  |   test.setTimeout(120000); // 2 minute timeout per test for coin spawn probability
  6  |   
  7  |   test.beforeEach(async ({ page }) => {
  8  |     await page.goto(GAME_URL);
  9  |     await dismissLoadingScreen(page);
> 10 |     await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
     |                                          ^ Error: expect(locator).toBeVisible() failed
  11 |   });
  12 | 
  13 |   async function enterDebugCode(page) {
  14 |     await focusCanvas(page);
  15 |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  16 |       await page.keyboard.press(key);
  17 |       await page.waitForTimeout(50);
  18 |     }
  19 |     await page.waitForTimeout(300);
  20 |   }
  21 | 
  22 |   async function assertSpawns(page, stageNum: number) {
  23 |     // Wait up to 60 seconds for obstacles AND coins to spawn (coins are probabilistic)
  24 |     // Obstacles spawn at 70% rate, coins at ~56% rate per cycle (~0.6-1.2s)
  25 |     await page.waitForFunction(() => {
  26 |       const counts = (window as any).__getSpawnCounts();
  27 |       return counts.obstacles > 0 && counts.coins > 0;
  28 |     }, { timeout: 60000 });
  29 |     
  30 |     const counts = await page.evaluate(() => (window as any).__getSpawnCounts());
  31 |     const debug = await page.evaluate(() => (window as any).__getSpawnDebug());
  32 |     console.log('Spawn debug:', JSON.stringify(debug, null, 2));
  33 |     expect(counts.obstacles, `No obstacles spawned. Debug: ${JSON.stringify(debug)}`).toBeGreaterThan(0);
  34 |     expect(counts.coins, `No coins spawned. Debug: ${JSON.stringify(debug)}`).toBeGreaterThan(0);
  35 |   }
  36 | 
  37 |   test('Stage 1 - obstacles and coins spawn', async ({ page }) => {
  38 |     await enterDebugCode(page);
  39 |     await focusCanvas(page);
  40 |     await page.keyboard.press('1');
  41 |     await page.waitForTimeout(1000);
  42 |     await assertSpawns(page, 1);
  43 |   });
  44 | 
  45 |   test('Stage 2 - obstacles and coins spawn', async ({ page }) => {
  46 |     await enterDebugCode(page);
  47 |     await focusCanvas(page);
  48 |     await page.keyboard.press('2');
  49 |     await page.waitForTimeout(1000);
  50 |     await assertSpawns(page, 2);
  51 |   });
  52 | 
  53 |   test('Stage 3 - obstacles and coins spawn', async ({ page }) => {
  54 |     await enterDebugCode(page);
  55 |     await focusCanvas(page);
  56 |     await page.keyboard.press('3');
  57 |     await page.waitForTimeout(1000);
  58 |     await assertSpawns(page, 3);
  59 |   });
  60 | });
  61 | 
```