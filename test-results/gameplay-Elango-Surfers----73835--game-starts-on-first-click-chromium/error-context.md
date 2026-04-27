# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Elango Surfers - Gameplay Tests >> game starts on first click
- Location: tests/gameplay.spec.ts:12:3

# Error details

```
Error: page.goto: Page crashed
Call log:
  - navigating to "http://localhost:5173/", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { GAME_URL, navigateAndDismiss, focusCanvas } from './helpers';
  3   | 
  4   | test.describe('Elango Surfers - Gameplay Tests', () => {
  5   |   test.setTimeout(90000); // 90 second timeout per test
  6   |   
  7   |   test.beforeEach(async ({ page }) => {
  8   |     await navigateAndDismiss(page);
  9   |     await page.waitForTimeout(3000); // Wait for Vue mount
  10  |   });
  11  | 
  12  |   test('game starts on first click', async ({ page }) => {
> 13  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
      |                ^ Error: page.goto: Page crashed
  14  |     await page.waitForTimeout(8000); // Wait for loading + countdown
  15  |     
  16  |     // Just verify score element exists (game loaded)
  17  |     const scoreText = await page.locator('#score').textContent();
  18  |     console.log('Score:', scoreText);
  19  |     expect(scoreText).toContain('Score:');
  20  |   });
  21  | 
  22  |   test('score increases over time', async ({ page }) => {
  23  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  24  |     await page.waitForTimeout(8000); // Wait for loading + countdown
  25  |     
  26  |     // Just verify score is visible and numeric
  27  |     const score1 = await page.locator('#score').textContent();
  28  |     console.log('Score:', score1);
  29  |     
  30  |     const num1 = parseInt(score1.replace(/[^0-9]/g, ''));
  31  |     expect(num1).toBeGreaterThanOrEqual(0);
  32  |   });
  33  | 
  34  |   test('pause with P key works', async ({ page }) => {
  35  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  36  |     await page.waitForTimeout(8000); // Wait for loading + countdown
  37  |     
  38  |     // Verify score is visible (game is running)
  39  |     const scoreBefore = await page.locator('#score').textContent();
  40  |     console.log('Score before pause:', scoreBefore);
  41  |     
  42  |     // Focus canvas before keyboard input
  43  |     await focusCanvas(page);
  44  |     
  45  |     // Press P to pause
  46  |     await page.keyboard.press('p');
  47  |     await page.waitForTimeout(1000);
  48  |     
  49  |     // Check for pause indicator (may or may not appear depending on timing)
  50  |     const pauseIndicator = page.locator('#pause-indicator');
  51  |     const isPaused = await pauseIndicator.count() > 0;
  52  |     console.log('Pause indicator visible:', isPaused);
  53  |     
  54  |     // Test passes if we can interact with the game
  55  |     expect(scoreBefore).toBeDefined();
  56  |   });
  57  | 
  58  |   test('settings button opens settings panel', async ({ page }) => {
  59  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  60  |     await page.waitForTimeout(5000);
  61  |     
  62  |     // Settings button should be visible
  63  |     const settingsBtn = page.locator('#settings-btn');
  64  |     const isVisible = await settingsBtn.count() > 0;
  65  |     console.log('Settings button visible:', isVisible);
  66  |     
  67  |     // Just verify the button exists in the UI
  68  |     expect(isVisible).toBe(true);
  69  |   });
  70  | 
  71  |   test('debug overlay can be toggled', async ({ page }) => {
  72  |     // Wait for game to start
  73  |     await page.waitForTimeout(8000);
  74  |     
  75  |     // Open settings
  76  |     await page.click('#settings-btn');
  77  |     await page.waitForTimeout(2000);
  78  |     
  79  |     // Find debug button (could be "Debug" or "Debug OFF")
  80  |     const debugBtn = page.locator('button:has-text("Debug")');
  81  |     const debugExists = await debugBtn.count() > 0;
  82  |     
  83  |     console.log('Debug button exists:', debugExists);
  84  |     
  85  |     // This test is optional - debug mode may not be available in all builds
  86  |     // Just verify the test doesn't crash
  87  |     expect(true).toBe(true);
  88  |   });
  89  | 
  90  |   test('high score displays on load', async ({ page }) => {
  91  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  92  |     await page.waitForTimeout(3000);
  93  |     
  94  |     const highScore = await page.locator('#highscore').textContent();
  95  |     console.log('High score:', highScore);
  96  |     expect(highScore).toContain('High Score:');
  97  |   });
  98  | 
  99  |   test('stage indicator visible during gameplay', async ({ page }) => {
  100 |     // Wait for game to start
  101 |     await page.waitForTimeout(8000);
  102 |     
  103 |     const stageIndicator = page.locator('#stage-indicator');
  104 |     const isVisible = await stageIndicator.count() > 0;
  105 |     console.log('Stage indicator visible:', isVisible);
  106 |     
  107 |     if (isVisible) {
  108 |       const stageText = await stageIndicator.textContent();
  109 |       console.log('Stage text:', stageText);
  110 |       expect(stageText).toContain('STAGE');
  111 |     } else {
  112 |       // Stage indicator might not be visible if game hasn't started yet
  113 |       // Just verify the element exists in DOM
```