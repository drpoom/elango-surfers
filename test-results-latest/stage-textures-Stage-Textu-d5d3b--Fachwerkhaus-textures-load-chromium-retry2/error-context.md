# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage-textures.spec.ts >> Stage Texture Verification >> Stage 2: Cobblestone + Fachwerkhaus textures load
- Location: tests/stage-textures.spec.ts:47:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 8947848
Received: 5592405
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.1
    - generic: "Score: 587"
    - generic: "High Score: 0"
    - generic: "STAGE 2: The Medieval Path"
    - generic: 🐛
    - generic: GOD MODE
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
  2   | import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';
  3   | 
  4   | test.describe('Stage Texture Verification', () => {
  5   |   
  6   |   test('Stage 1: Modern highway textures load', async ({ page }) => {
  7   |     test.setTimeout(60000);
  8   |     
  9   |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  10  |     await page.waitForLoadState('networkidle');
  11  |     await navigateAndDismiss(page);
  12  |     await page.waitForTimeout(2000);
  13  |     
  14  |     // Wait for road material to be set (Stage 1 default)
  15  |     await page.waitForFunction(() => {
  16  |       const mesh = window.__getRoadMesh();
  17  |       if (!mesh || !mesh.material) return false;
  18  |       // Stage 1 should have default texture (not cobblestone gray 0x888888)
  19  |       const color = mesh.material.color.getHex();
  20  |       return color !== 0x888888; // Not cobblestone
  21  |     }, { timeout: 10000 });
  22  |     
  23  |     await page.waitForTimeout(2000);
  24  |     await screenshot(page, 'test-results/stage1-highway-texture.png');
  25  |     
  26  |     // Verify Stage 1 indicator
  27  |     const stageIndicator = page.locator('#stage-indicator');
  28  |     const stageText = await stageIndicator.textContent();
  29  |     expect(stageText).toContain('STAGE 1');
  30  |     expect(stageText).toContain('Modern');
  31  |     
  32  |     // Verify road material
  33  |     const roadMaterial = await page.evaluate(() => {
  34  |       const mesh = window.__getRoadMesh();
  35  |       if (!mesh || !mesh.material) return null;
  36  |       return {
  37  |         color: mesh.material.color.getHex(),
  38  |         hasMap: !!mesh.material.map
  39  |       };
  40  |     });
  41  |     
  42  |     expect(roadMaterial).not.toBeNull();
  43  |     expect(roadMaterial.hasMap).toBe(true); // Should have highway texture
  44  |     expect(roadMaterial.color).not.toBe(0x888888); // Not cobblestone gray
  45  |   });
  46  | 
  47  |   test('Stage 2: Cobblestone + Fachwerkhaus textures load', async ({ page }) => {
  48  |     test.setTimeout(90000);
  49  |     
  50  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  51  |     await page.waitForLoadState('networkidle');
  52  |     await navigateAndDismiss(page);
  53  |     await page.waitForTimeout(2000);
  54  |     await focusCanvas(page);
  55  |     
  56  |     // Enter debug mode via keyboard (d-e-b-u-g)
  57  |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  58  |       await page.keyboard.press(key);
  59  |       await page.waitForTimeout(50);
  60  |     }
  61  |     await page.waitForTimeout(1000); // Wait for debug mode to activate
  62  |     
  63  |     // Verify debug mode is active (check for debug indicator in body)
  64  |     await page.waitForFunction(() => {
  65  |       const body = document.querySelector('body');
  66  |       return body && body.textContent?.includes('🐛');
  67  |     }, { timeout: 5000 });
  68  |     
  69  |     await focusCanvas(page);
  70  |     
  71  |     // Select Stage 2 via keyboard
  72  |     await page.keyboard.press('2');
  73  |     await page.waitForTimeout(1500); // Let resetStage() process
  74  |     
  75  |     // Wait for stage indicator
  76  |     const stageIndicator = page.locator('#stage-indicator');
  77  |     const stageText = await stageIndicator.textContent();
  78  |     console.log('Stage indicator:', stageText);
  79  |     expect(stageText).toContain('STAGE 2');
  80  |     expect(stageText).toContain('Medieval');
  81  |     
  82  |     // Wait for applyStageVisuals() to set color (immediate, not texture load)
  83  |     await page.waitForTimeout(2000);
  84  |     
  85  |     // Get road material info
  86  |     const debugInfo = await page.evaluate(() => {
  87  |       const mesh = window.__getRoadMesh();
  88  |       if (!mesh || !mesh.material) return null;
  89  |       return {
  90  |         color: mesh.material.color.getHex(),
  91  |         hasMap: !!mesh.material.map
  92  |       };
  93  |     });
  94  |     
  95  |     console.log('Stage 2 road material:', debugInfo);
  96  |     await screenshot(page, 'test-results/stage2-cobblestone-texture.png');
  97  |     
  98  |     expect(debugInfo).not.toBeNull();
> 99  |     expect(debugInfo.color).toBe(0x888888); // Cobblestone gray
      |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  100 |     expect(debugInfo.hasMap).toBe(true);
  101 |   });
  102 | 
  103 |   test('Stage 3: Concrete jungle textures load', async ({ page }) => {
  104 |     test.setTimeout(90000);
  105 |     
  106 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  107 |     await page.waitForLoadState('networkidle');
  108 |     await navigateAndDismiss(page);
  109 |     await page.waitForTimeout(2000);
  110 |     await focusCanvas(page);
  111 |     
  112 |     // Enter debug mode via keyboard (d-e-b-u-g)
  113 |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  114 |       await page.keyboard.press(key);
  115 |       await page.waitForTimeout(50);
  116 |     }
  117 |     await page.waitForTimeout(1000);
  118 |     
  119 |     // Verify debug mode is active
  120 |     await page.waitForFunction(() => {
  121 |       const body = document.querySelector('body');
  122 |       return body && body.textContent?.includes('🐛');
  123 |     }, { timeout: 5000 });
  124 |     
  125 |     await focusCanvas(page);
  126 |     
  127 |     // Select Stage 3 via keyboard
  128 |     await page.keyboard.press('3');
  129 |     await page.waitForTimeout(1500);
  130 |     
  131 |     // Wait for stage indicator
  132 |     const stageIndicator = page.locator('#stage-indicator');
  133 |     const stageText = await stageIndicator.textContent();
  134 |     console.log('Stage indicator:', stageText);
  135 |     expect(stageText).toContain('STAGE 3');
  136 |     expect(stageText).toContain('Cyber');
  137 |     
  138 |     // Wait for applyStageVisuals() to set color (immediate)
  139 |     await page.waitForTimeout(2000);
  140 |     
  141 |     // Get road material info
  142 |     const debugInfo = await page.evaluate(() => {
  143 |       const mesh = window.__getRoadMesh();
  144 |       if (!mesh || !mesh.material) return null;
  145 |       return {
  146 |         color: mesh.material.color.getHex(),
  147 |         hasMap: !!mesh.material.map
  148 |       };
  149 |     });
  150 |     
  151 |     console.log('Stage 3 road material:', debugInfo);
  152 |     await screenshot(page, 'test-results/stage3-concrete-texture.png');
  153 |     
  154 |     expect(debugInfo).not.toBeNull();
  155 |     expect(debugInfo.color).toBe(0xffffff); // Concrete white
  156 |     expect(debugInfo.hasMap).toBe(true);
  157 |   });
  158 | });
  159 | 
```