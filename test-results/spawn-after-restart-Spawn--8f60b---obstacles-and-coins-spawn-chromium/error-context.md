# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: spawn-after-restart.spec.ts >> Spawn After Restart >> Stage 1 - obstacles and coins spawn
- Location: tests/spawn-after-restart.spec.ts:38:3

# Error details

```
Error: page.goto: Page crashed
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

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
> 8  |     await page.goto(GAME_URL);
     |                ^ Error: page.goto: Page crashed
  9  |     await dismissLoadingScreen(page);
  10 |     // Give game time to initialize
  11 |     await page.waitForTimeout(2000);
  12 |   });
  13 | 
  14 |   async function enterDebugCode(page) {
  15 |     await focusCanvas(page);
  16 |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  17 |       await page.keyboard.press(key);
  18 |       await page.waitForTimeout(50);
  19 |     }
  20 |     await page.waitForTimeout(300);
  21 |   }
  22 | 
  23 |   async function assertSpawns(page, stageNum: number) {
  24 |     // Wait up to 60 seconds for obstacles AND coins to spawn (coins are probabilistic)
  25 |     // Obstacles spawn at 70% rate, coins at ~56% rate per cycle (~0.6-1.2s)
  26 |     await page.waitForFunction(() => {
  27 |       const counts = (window as any).__getSpawnCounts();
  28 |       return counts.obstacles > 0 && counts.coins > 0;
  29 |     }, { timeout: 60000 });
  30 |     
  31 |     const counts = await page.evaluate(() => (window as any).__getSpawnCounts());
  32 |     const debug = await page.evaluate(() => (window as any).__getSpawnDebug());
  33 |     console.log('Spawn debug:', JSON.stringify(debug, null, 2));
  34 |     expect(counts.obstacles, `No obstacles spawned. Debug: ${JSON.stringify(debug)}`).toBeGreaterThan(0);
  35 |     expect(counts.coins, `No coins spawned. Debug: ${JSON.stringify(debug)}`).toBeGreaterThan(0);
  36 |   }
  37 | 
  38 |   test('Stage 1 - obstacles and coins spawn', async ({ page }) => {
  39 |     await enterDebugCode(page);
  40 |     await focusCanvas(page);
  41 |     await page.keyboard.press('1');
  42 |     await page.waitForTimeout(1000);
  43 |     await assertSpawns(page, 1);
  44 |   });
  45 | 
  46 |   test('Stage 2 - obstacles and coins spawn', async ({ page }) => {
  47 |     await enterDebugCode(page);
  48 |     await focusCanvas(page);
  49 |     await page.keyboard.press('2');
  50 |     await page.waitForTimeout(1000);
  51 |     await assertSpawns(page, 2);
  52 |   });
  53 | 
  54 |   test('Stage 3 - obstacles and coins spawn', async ({ page }) => {
  55 |     await enterDebugCode(page);
  56 |     await focusCanvas(page);
  57 |     await page.keyboard.press('3');
  58 |     await page.waitForTimeout(1000);
  59 |     await assertSpawns(page, 3);
  60 |   });
  61 | });
  62 | 
```