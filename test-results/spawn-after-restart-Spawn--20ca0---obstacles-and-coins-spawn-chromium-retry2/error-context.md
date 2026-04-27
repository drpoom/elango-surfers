# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: spawn-after-restart.spec.ts >> Spawn After Restart >> Stage 2 - obstacles and coins spawn
- Location: tests/spawn-after-restart.spec.ts:35:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.1
    - generic: "Score: 593"
    - generic: "High Score: 0"
    - generic: "STAGE 2: The Medieval Path"
    - generic: 🐛
    - generic: GOD MODE
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
  2  | import { GAME_URL, dismissLoadingScreen, focusCanvas } from './helpers';
  3  | 
  4  | test.describe('Spawn After Restart', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto(GAME_URL);
  7  |     await dismissLoadingScreen(page);
  8  |     await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
  9  |   });
  10 | 
  11 |   async function enterDebugCode(page) {
  12 |     await focusCanvas(page);
  13 |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  14 |       await page.keyboard.press(key);
  15 |       await page.waitForTimeout(50);
  16 |     }
  17 |     await page.waitForTimeout(300);
  18 |   }
  19 | 
  20 |   async function assertSpawns(page, stageNum: number) {
  21 |     await page.waitForTimeout(5000);
  22 |     const counts = await page.evaluate(() => window.__getSpawnCounts());
  23 |     expect(counts.obstacles).toBeGreaterThan(0);
> 24 |     expect(counts.coins).toBeGreaterThan(0);
     |                          ^ Error: expect(received).toBeGreaterThan(expected)
  25 |   }
  26 | 
  27 |   test('Stage 1 - obstacles and coins spawn', async ({ page }) => {
  28 |     await enterDebugCode(page);
  29 |     await focusCanvas(page);
  30 |     await page.keyboard.press('1');
  31 |     await page.waitForTimeout(1000);
  32 |     await assertSpawns(page, 1);
  33 |   });
  34 | 
  35 |   test('Stage 2 - obstacles and coins spawn', async ({ page }) => {
  36 |     await enterDebugCode(page);
  37 |     await focusCanvas(page);
  38 |     await page.keyboard.press('2');
  39 |     await page.waitForTimeout(1000);
  40 |     await assertSpawns(page, 2);
  41 |   });
  42 | 
  43 |   test('Stage 3 - obstacles and coins spawn', async ({ page }) => {
  44 |     await enterDebugCode(page);
  45 |     await focusCanvas(page);
  46 |     await page.keyboard.press('3');
  47 |     await page.waitForTimeout(1000);
  48 |     await assertSpawns(page, 3);
  49 |   });
  50 | });
  51 | 
```