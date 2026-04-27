# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Elango Surfers - Gameplay Tests >> debug overlay can be toggled
- Location: tests/gameplay.spec.ts:86:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#settings-btn')
    - locator resolved to <div id="settings-btn" data-v-2a6e51d3="">⚙️</div>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.1
    - generic: "Score: 2115"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic:
    - generic: 🌫️ FOG!
  - generic: ➡️
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]: 🎤🔴
    - generic [ref=e6] [cursor=pointer]: 📱
    - generic [ref=e7] [cursor=pointer]: 🔊
    - generic [ref=e8] [cursor=pointer]: ⚙️
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { GAME_URL, navigateAndDismiss, focusCanvas } from './helpers';
  3   | 
  4   | test.describe('Elango Surfers - Gameplay Tests', () => {
  5   |   
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await navigateAndDismiss(page);
  8   |     await page.waitForTimeout(3000); // Wait for Vue mount
  9   |   });
  10  | 
  11  |   test('game starts on first click', async ({ page }) => {
  12  |     // Click center of screen to start
  13  |     await page.mouse.click(400, 300);
  14  |     await page.waitForTimeout(2000);
  15  |     
  16  |     // Score should be visible and numeric
  17  |     const scoreText = await page.locator('#score').textContent();
  18  |     console.log('Score after start:', scoreText);
  19  |     expect(scoreText).toContain('Score:');
  20  |   });
  21  | 
  22  |   test('score increases over time', async ({ page }) => {
  23  |     // Start game
  24  |     await page.mouse.click(400, 300);
  25  |     await page.waitForTimeout(2000);
  26  |     
  27  |     const score1 = await page.locator('#score').textContent();
  28  |     console.log('Score at 2s:', score1);
  29  |     
  30  |     await page.waitForTimeout(5000);
  31  |     
  32  |     const score2 = await page.locator('#score').textContent();
  33  |     console.log('Score at 7s:', score2);
  34  |     
  35  |     // Extract numbers
  36  |     const num1 = parseInt(score1.replace(/[^0-9]/g, ''));
  37  |     const num2 = parseInt(score2.replace(/[^0-9]/g, ''));
  38  |     
  39  |     // Score should increase or stay same (game running)
  40  |     expect(num2).toBeGreaterThanOrEqual(num1);
  41  |   });
  42  | 
  43  |   test('pause with P key works', async ({ page }) => {
  44  |     // Start game
  45  |     await page.mouse.click(400, 300);
  46  |     await page.waitForTimeout(2000);
  47  |     
  48  |     const scoreBefore = await page.locator('#score').textContent();
  49  |     console.log('Score before pause:', scoreBefore);
  50  |     
  51  |     // Focus canvas before keyboard input
  52  |     await focusCanvas(page);
  53  |     
  54  |     // Press P to pause
  55  |     await page.keyboard.press('p');
  56  |     await page.waitForTimeout(1000);
  57  |     
  58  |     // Focus canvas before resume
  59  |     await focusCanvas(page);
  60  |     
  61  |     // Press P to resume
  62  |     await page.keyboard.press('p');
  63  |     await page.waitForTimeout(2000);
  64  |     
  65  |     // Game should still be running
  66  |     const scoreAfter = await page.locator('#score').textContent();
  67  |     console.log('Score after resume:', scoreAfter);
  68  |     expect(scoreAfter).toBeDefined();
  69  |   });
  70  | 
  71  |   test('settings button opens settings panel', async ({ page }) => {
  72  |     // Start game
  73  |     await page.mouse.click(400, 300);
  74  |     await page.waitForTimeout(2000);
  75  |     
  76  |     // Click settings button
  77  |     const settingsBtn = page.locator('#settings-btn');
  78  |     await settingsBtn.click();
  79  |     await page.waitForTimeout(1000);
  80  |     
  81  |     // Settings panel should be visible (check for any settings-related text)
  82  |     const pageContent = await page.content();
  83  |     expect(pageContent).toContain('Settings');
  84  |   });
  85  | 
  86  |   test('debug overlay can be toggled', async ({ page }) => {
  87  |     // Start game
  88  |     await page.mouse.click(400, 300);
  89  |     await page.waitForTimeout(2000);
  90  |     
  91  |     // Open settings
> 92  |     await page.click('#settings-btn');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  93  |     await page.waitForTimeout(1000);
  94  |     
  95  |     // Find debug button (could be "Debug" or "Debug OFF")
  96  |     const debugBtn = page.locator('button:has-text("Debug")');
  97  |     const debugExists = await debugBtn.count() > 0;
  98  |     
  99  |     console.log('Debug button exists:', debugExists);
  100 |     
  101 |     if (debugExists) {
  102 |       // Just verify button exists and is clickable
  103 |       await expect(debugBtn).toBeVisible();
  104 |       await expect(debugBtn).toBeEnabled();
  105 |     }
  106 |     
  107 |     expect(debugExists).toBe(true);
  108 |   });
  109 | 
  110 |   test('high score displays on load', async ({ page }) => {
  111 |     await page.waitForTimeout(2000);
  112 |     
  113 |     const highScore = await page.locator('#highscore').textContent();
  114 |     console.log('High score:', highScore);
  115 |     expect(highScore).toContain('High Score:');
  116 |   });
  117 | 
  118 |   test('stage indicator visible during gameplay', async ({ page }) => {
  119 |     // Start game
  120 |     await page.mouse.click(400, 300);
  121 |     await page.waitForTimeout(2000);
  122 |     
  123 |     const stageIndicator = page.locator('#stage-indicator');
  124 |     const isVisible = await stageIndicator.count() > 0;
  125 |     console.log('Stage indicator visible:', isVisible);
  126 |     
  127 |     if (isVisible) {
  128 |       const stageText = await stageIndicator.textContent();
  129 |       console.log('Stage text:', stageText);
  130 |       expect(stageText).toContain('STAGE');
  131 |     }
  132 |   });
  133 | 
  134 |   test('game runs for 20 seconds without crashing', async ({ page }) => {
  135 |     // Start game
  136 |     await page.mouse.click(400, 300);
  137 |     
  138 |     // Wait 20 seconds
  139 |     await page.waitForTimeout(20000);
  140 |     
  141 |     // Game should still be running
  142 |     const title = await page.title();
  143 |     expect(title).toBe('Elango Surfers');
  144 |     
  145 |     const score = await page.locator('#score').textContent();
  146 |     console.log('Score after 20s:', score);
  147 |     expect(score).toBeDefined();
  148 |   });
  149 | });
  150 | 
```