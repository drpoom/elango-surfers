# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cobblestone-regression.spec.ts >> Cobblestone Road Regression Test >> cobblestone texture loads in Stage 2 via debug mode
- Location: tests/cobblestone-regression.spec.ts:6:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.0.25
    - generic: "Score: 364"
    - generic: "High Score: 0"
    - generic: "STAGE 2: The Medieval Path"
    - generic: 🐛
    - generic: GOD MODE
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
  4  | test.describe('Cobblestone Road Regression Test', () => {
  5  |   
  6  |   test('cobblestone texture loads in Stage 2 via debug mode', async ({ page }) => {
  7  |     test.setTimeout(60000);
  8  |     
  9  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  10 |     await page.waitForLoadState('networkidle');
  11 |     await navigateAndDismiss(page);
  12 |     
  13 |     // Wait for game to be fully loaded
  14 |     await page.waitForTimeout(2000);
  15 |     
  16 |     // Enter debug mode: debug
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
  27 |     
  28 |     // Select Stage 2: press 2
  29 |     await page.keyboard.press('2');
  30 |     await page.waitForTimeout(2000);
  31 |     
  32 |     // Take screenshot to verify cobblestone is visible
  33 |     await page.screenshot({ path: 'test-results/stage2-cobblestone.png' });
  34 |     console.log('Stage 2 cobblestone screenshot captured');
  35 |     
  36 |     // Verify cobblestone texture is applied by checking the road material
  37 |     const cobblestoneApplied = await page.evaluate(() => {
  38 |       const road = (window as any).THREE_SCENE?.getObjectByName('road');
  39 |       if (!road) return false;
  40 |       
  41 |       const material = road.material;
  42 |       return material && material.map && material.map.source?.data?.src?.includes('cobblestone');
  43 |     });
  44 |     
  45 |     console.log('Cobblestone applied:', cobblestoneApplied);
> 46 |     expect(cobblestoneApplied).toBe(true);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  47 |   });
  48 | 
  49 |   test('game restarts without crashing', async ({ page }) => {
  50 |     test.setTimeout(60000);
  51 |     
  52 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  53 |     await page.waitForLoadState('networkidle');
  54 |     await navigateAndDismiss(page);
  55 |     
  56 |     // Wait for game to be fully loaded
  57 |     await page.waitForTimeout(2000);
  58 |     
  59 |     // Enter debug mode
  60 |     await page.keyboard.press('d');
  61 |     await page.waitForTimeout(100);
  62 |     await page.keyboard.press('e');
  63 |     await page.waitForTimeout(100);
  64 |     await page.keyboard.press('b');
  65 |     await page.waitForTimeout(100);
  66 |     await page.keyboard.press('u');
  67 |     await page.waitForTimeout(100);
  68 |     await page.keyboard.press('g');
  69 |     await page.waitForTimeout(500);
  70 |     
  71 |     // Select Stage 2: press 2
  72 |     await page.keyboard.press('2');
  73 |     await page.waitForTimeout(2000);
  74 |     
  75 |     // Trigger game over via debug: press o (game over)
  76 |     await page.keyboard.press('o');
  77 |     await page.waitForTimeout(2000);
  78 |     
  79 |     // Check if game over screen is visible
  80 |     const gameOverVisible = await page.locator('#game-over').isVisible().catch(() => false);
  81 |     console.log('Game over visible:', gameOverVisible);
  82 |     
  83 |     if (gameOverVisible) {
  84 |       // Click restart button
  85 |       const restartButton = page.locator('button:has-text("Restart"), #restart-btn, .restart-btn').first();
  86 |       await restartButton.click();
  87 |       await page.waitForTimeout(3000);
  88 |       
  89 |       // Game should restart without crashing
  90 |       const scoreVisible = await page.locator('#score').isVisible();
  91 |       expect(scoreVisible).toBe(true);
  92 |       console.log('Game restarted successfully');
  93 |     }
  94 |   });
  95 | });
  96 | 
```