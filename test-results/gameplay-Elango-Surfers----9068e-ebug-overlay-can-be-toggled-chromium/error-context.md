# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Elango Surfers - Gameplay Tests >> debug overlay can be toggled
- Location: tests/gameplay.spec.ts:80:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button:has-text("Debug")')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button:has-text("Debug")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.0.25
    - generic: "Score: 1880"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic: ⬅️
  - generic:
    - text: ⏸️ PAUSED
    - text: Click/Tap/Press any key to resume
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]: 🎤🔴
    - generic [ref=e6] [cursor=pointer]: 📱
    - generic [ref=e7] [cursor=pointer]: 🔊
    - generic [ref=e8] [cursor=pointer]: ⚙️
  - generic [ref=e11]:
    - heading "⚙️ Settings" [level=2] [ref=e12]
    - button "Close" [ref=e13] [cursor=pointer]
    - generic [ref=e14]:
      - heading "🎮 Game Settings" [level=3] [ref=e15]
      - generic [ref=e16] [cursor=pointer]:
        - checkbox "Road Curves" [checked] [ref=e17]
        - text: Road Curves
      - generic [ref=e18] [cursor=pointer]:
        - checkbox "Reduce Motion" [ref=e19]
        - text: Reduce Motion
    - generic [ref=e20]:
      - 'heading "🗺️ Debug: Start Stage" [level=3] [ref=e21]'
      - generic [ref=e22]:
        - button "Normal" [ref=e23] [cursor=pointer]
        - button "1. The Modern Highway" [ref=e24] [cursor=pointer]
        - button "2. The Medieval Path" [ref=e25] [cursor=pointer]
        - button "3. The Concrete Jungle" [ref=e26] [cursor=pointer]
      - generic [ref=e27]: Next game starts at this stage
    - generic [ref=e28]:
      - heading "🎨 Skins" [level=3] [ref=e29]
      - generic [ref=e30]:
        - button "🎨" [ref=e31] [cursor=pointer]
        - button "🔒" [disabled] [ref=e32] [cursor=pointer]
        - button "🔒" [disabled] [ref=e33] [cursor=pointer]
        - button "🔒" [disabled] [ref=e34] [cursor=pointer]
        - button "🔒" [disabled] [ref=e35] [cursor=pointer]
    - generic [ref=e36]:
      - heading "🎩 Hats" [level=3] [ref=e37]
      - generic [ref=e38]:
        - button "None" [ref=e39] [cursor=pointer]
        - button "🔒 cap" [disabled] [ref=e40]
        - button "🔒 crown" [disabled] [ref=e41]
        - button "🔒 helmet" [disabled] [ref=e42]
    - generic [ref=e43]:
      - heading "🏆 Achievements (0/12)" [level=3] [ref=e44]
      - list [ref=e45]:
        - listitem [ref=e46]: 🔒 First Coin!
        - listitem [ref=e47]: 🔒 Coin Collector
        - listitem [ref=e48]: 🔒 Survivor
        - listitem [ref=e49]: 🔒 Combo Master
        - listitem [ref=e50]: 🔒 High Flyer
        - listitem [ref=e51]: 🔒 Powered Up
        - listitem [ref=e52]: 🔒 Power User
        - listitem [ref=e53]: 🔒 Night Runner
        - listitem [ref=e54]: 🔒 Fashion Forward
        - listitem [ref=e55]: 🔒 Hat Collector
        - listitem [ref=e56]: 🔒 Untouchable
        - listitem [ref=e57]: 🔒 Magnet Master
    - button "🐛 Debug OFF" [ref=e58] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { GAME_URL, navigateAndDismiss } from './helpers';
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
  51  |     // Press P to pause
  52  |     await page.keyboard.press('p');
  53  |     await page.waitForTimeout(1000);
  54  |     
  55  |     // Press P to resume
  56  |     await page.keyboard.press('p');
  57  |     await page.waitForTimeout(2000);
  58  |     
  59  |     // Game should still be running
  60  |     const scoreAfter = await page.locator('#score').textContent();
  61  |     console.log('Score after resume:', scoreAfter);
  62  |     expect(scoreAfter).toBeDefined();
  63  |   });
  64  | 
  65  |   test('settings button opens settings panel', async ({ page }) => {
  66  |     // Start game
  67  |     await page.mouse.click(400, 300);
  68  |     await page.waitForTimeout(2000);
  69  |     
  70  |     // Click settings button
  71  |     const settingsBtn = page.locator('#settings-btn');
  72  |     await settingsBtn.click();
  73  |     await page.waitForTimeout(1000);
  74  |     
  75  |     // Settings panel should be visible (check for any settings-related text)
  76  |     const pageContent = await page.content();
  77  |     expect(pageContent).toContain('Settings');
  78  |   });
  79  | 
  80  |   test('debug overlay can be toggled', async ({ page }) => {
  81  |     // Start game
  82  |     await page.mouse.click(400, 300);
  83  |     await page.waitForTimeout(2000);
  84  |     
  85  |     // Open settings
  86  |     await page.click('#settings-btn');
  87  |     await page.waitForTimeout(1000);
  88  |     
  89  |     // Find debug button (could be "Debug" or "Debug OFF")
  90  |     const debugBtn = page.locator('button:has-text("Debug")');
  91  |     const debugExists = await debugBtn.count() > 0;
  92  |     
  93  |     console.log('Debug button exists:', debugExists);
  94  |     
  95  |     if (debugExists) {
  96  |       // Just verify button exists and is clickable
> 97  |       await expect(debugBtn).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  98  |       await expect(debugBtn).toBeEnabled();
  99  |     }
  100 |     
  101 |     expect(debugExists).toBe(true);
  102 |   });
  103 | 
  104 |   test('high score displays on load', async ({ page }) => {
  105 |     await page.waitForTimeout(2000);
  106 |     
  107 |     const highScore = await page.locator('#highscore').textContent();
  108 |     console.log('High score:', highScore);
  109 |     expect(highScore).toContain('High Score:');
  110 |   });
  111 | 
  112 |   test('stage indicator visible during gameplay', async ({ page }) => {
  113 |     // Start game
  114 |     await page.mouse.click(400, 300);
  115 |     await page.waitForTimeout(2000);
  116 |     
  117 |     const stageIndicator = page.locator('#stage-indicator');
  118 |     const isVisible = await stageIndicator.count() > 0;
  119 |     console.log('Stage indicator visible:', isVisible);
  120 |     
  121 |     if (isVisible) {
  122 |       const stageText = await stageIndicator.textContent();
  123 |       console.log('Stage text:', stageText);
  124 |       expect(stageText).toContain('STAGE');
  125 |     }
  126 |   });
  127 | 
  128 |   test('game runs for 20 seconds without crashing', async ({ page }) => {
  129 |     // Start game
  130 |     await page.mouse.click(400, 300);
  131 |     
  132 |     // Wait 20 seconds
  133 |     await page.waitForTimeout(20000);
  134 |     
  135 |     // Game should still be running
  136 |     const title = await page.title();
  137 |     expect(title).toBe('Elango Surfers');
  138 |     
  139 |     const score = await page.locator('#score').textContent();
  140 |     console.log('Score after 20s:', score);
  141 |     expect(score).toBeDefined();
  142 |   });
  143 | });
  144 | 
```