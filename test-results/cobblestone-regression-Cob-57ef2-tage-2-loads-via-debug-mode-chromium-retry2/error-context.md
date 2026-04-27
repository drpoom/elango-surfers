# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cobblestone-regression.spec.ts >> Cobblestone Road Regression Test >> Stage 2 loads via debug mode
- Location: tests/cobblestone-regression.spec.ts:6:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.1
    - generic: "Score: 1150"
    - generic: "High Score: 0"
    - generic: "STAGE 2: The Medieval Path"
    - generic: 🐛
    - generic: GOD MODE
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]: 🎤🔴
    - generic [ref=e6] [cursor=pointer]: 📱
    - generic [ref=e7] [cursor=pointer]: 🔊
    - generic [ref=e8] [cursor=pointer]: ⚙️
  - generic: GO!
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';
  3   | 
  4   | test.describe('Cobblestone Road Regression Test', () => {
  5   |   
  6   |   test('Stage 2 loads via debug mode', async ({ page }) => {
  7   |     test.setTimeout(60000);
  8   |     
  9   |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  10  |     await page.waitForLoadState('networkidle');
  11  |     await navigateAndDismiss(page);
  12  |     
  13  |     // Wait for game to be fully loaded
  14  |     await page.waitForTimeout(2000);
  15  |     
  16  |     // Focus canvas before keyboard input
  17  |     await focusCanvas(page);
  18  |     
  19  |     // Enter debug mode: debug
  20  |     await page.keyboard.press('d');
  21  |     await page.waitForTimeout(100);
  22  |     await page.keyboard.press('e');
  23  |     await page.waitForTimeout(100);
  24  |     await page.keyboard.press('b');
  25  |     await page.waitForTimeout(100);
  26  |     await page.keyboard.press('u');
  27  |     await page.waitForTimeout(100);
  28  |     await page.keyboard.press('g');
  29  |     await page.waitForTimeout(500);
  30  |     
  31  |     // Focus canvas before stage jump
  32  |     await focusCanvas(page);
  33  |     
  34  |     // Select Stage 2: press 2
  35  |     await page.keyboard.press('2');
  36  |     
  37  |     // Wait for cobblestone texture to load (check via road material color)
> 38  |     await page.waitForFunction(() => {
      |                ^ Error: page.waitForFunction: Test timeout of 60000ms exceeded.
  39  |       const mesh = window.__getRoadMesh();
  40  |       if (!mesh || !mesh.material) return false;
  41  |       // Cobblestone should have gray color (0x888888)
  42  |       return mesh.material.color.getHex() === 0x888888;
  43  |     }, { timeout: 10000 });
  44  |     
  45  |     await page.waitForTimeout(2000); // Allow render after texture load
  46  |     
  47  |     // Take screenshot to verify Stage 2 is loaded
  48  |     await screenshot(page, 'test-results/stage2-cobblestone.png');
  49  |     console.log('Stage 2 cobblestone screenshot captured');
  50  |     
  51  |     // Verify Stage 2 is active by checking the stage indicator
  52  |     const stageIndicator = page.locator('#stage-indicator');
  53  |     const stageText = await stageIndicator.textContent();
  54  |     console.log('Stage indicator:', stageText);
  55  |     
  56  |     expect(stageText).toContain('STAGE 2');
  57  |     expect(stageText).toContain('Medieval'); // Stage 2 subtitle (cobblestone)
  58  |     
  59  |     // Verify cobblestone texture is applied (road material should be gray, not default)
  60  |     const roadMaterial = await page.evaluate(() => {
  61  |       const mesh = window.__getRoadMesh();
  62  |       if (!mesh || !mesh.material) return null;
  63  |       return {
  64  |         color: mesh.material.color.getHex(),
  65  |         hasMap: !!mesh.material.map,
  66  |         mapName: mesh.material.map?.source?.data?.currentSrc || null
  67  |       };
  68  |     });
  69  |     console.log('Road material:', roadMaterial);
  70  |     expect(roadMaterial).not.toBeNull();
  71  |     expect(roadMaterial.hasMap).toBe(true); // Should have cobblestone texture
  72  |     expect(roadMaterial.color).toBe(0x888888); // Gray color for cobblestone
  73  |   });
  74  | 
  75  |   test('game restarts without crashing', async ({ page }) => {
  76  |     test.setTimeout(60000);
  77  |     
  78  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  79  |     await page.waitForLoadState('networkidle');
  80  |     await navigateAndDismiss(page);
  81  |     
  82  |     // Wait for game to be fully loaded
  83  |     await page.waitForTimeout(2000);
  84  |     
  85  |     // Focus canvas before keyboard input
  86  |     await focusCanvas(page);
  87  |     
  88  |     // Enter debug mode
  89  |     await page.keyboard.press('d');
  90  |     await page.waitForTimeout(100);
  91  |     await page.keyboard.press('e');
  92  |     await page.waitForTimeout(100);
  93  |     await page.keyboard.press('b');
  94  |     await page.waitForTimeout(100);
  95  |     await page.keyboard.press('u');
  96  |     await page.waitForTimeout(100);
  97  |     await page.keyboard.press('g');
  98  |     await page.waitForTimeout(500);
  99  |     
  100 |     // Focus canvas before stage jump
  101 |     await focusCanvas(page);
  102 |     
  103 |     // Select Stage 2: press 2
  104 |     await page.keyboard.press('2');
  105 |     await page.waitForTimeout(2000);
  106 |     
  107 |     // Trigger game over via debug: press o (game over)
  108 |     await page.keyboard.press('o');
  109 |     await page.waitForTimeout(2000);
  110 |     
  111 |     // Check if game over screen is visible
  112 |     const gameOverVisible = await page.locator('#game-over').isVisible().catch(() => false);
  113 |     console.log('Game over visible:', gameOverVisible);
  114 |     
  115 |     if (gameOverVisible) {
  116 |       // Click restart button
  117 |       const restartButton = page.locator('button:has-text("Restart"), #restart-btn, .restart-btn').first();
  118 |       await restartButton.click();
  119 |       await page.waitForTimeout(3000);
  120 |       
  121 |       // Game should restart without crashing
  122 |       const scoreVisible = await page.locator('#score').isVisible();
  123 |       expect(scoreVisible).toBe(true);
  124 |       console.log('Game restarted successfully');
  125 |     }
  126 |   });
  127 | });
  128 | 
```