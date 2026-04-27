# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage-textures.spec.ts >> Stage Texture Verification >> Stage 2: Cobblestone + Fachwerkhaus textures load
- Location: tests/stage-textures.spec.ts:44:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.13
    - generic: "Score: 1199"
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
  1   | import { test, expect } from '@playwright/test';
  2   | import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';
  3   | 
  4   | test.describe('Stage Texture Verification', () => {
  5   |   
  6   |   test('Stage 1: Modern highway textures load', async ({ page }) => {
  7   |     test.setTimeout(60000);
  8   |     
  9   |     await navigateAndDismiss(page);
  10  |     await page.waitForTimeout(2000);
  11  |     
  12  |     // Wait for road material to be set (Stage 1 default)
  13  |     await page.waitForFunction(() => {
  14  |       const mesh = window.__getRoadMesh();
  15  |       if (!mesh || !mesh.material) return false;
  16  |       // Stage 1 should have default texture (not cobblestone gray 0x888888)
  17  |       const color = mesh.material.color.getHex();
  18  |       return color !== 0x888888; // Not cobblestone
  19  |     }, { timeout: 10000 });
  20  |     
  21  |     await page.waitForTimeout(2000);
  22  |     await screenshot(page, 'test-results/stage1-highway-texture.png');
  23  |     
  24  |     // Verify Stage 1 indicator
  25  |     const stageIndicator = page.locator('#stage-indicator');
  26  |     const stageText = await stageIndicator.textContent();
  27  |     expect(stageText).toContain('STAGE 1');
  28  |     expect(stageText).toContain('Modern');
  29  |     
  30  |     // Verify road material
  31  |     const roadMaterial = await page.evaluate(() => {
  32  |       const mesh = window.__getRoadMesh();
  33  |       if (!mesh || !mesh.material) return null;
  34  |       return {
  35  |         color: mesh.material.color.getHex(),
  36  |         hasMap: !!mesh.material.map
  37  |       };
  38  |     });
  39  |     
  40  |     expect(roadMaterial).not.toBeNull();
  41  |     expect(roadMaterial.hasMap).toBe(true); // Should have highway texture
  42  |     expect(roadMaterial.color).not.toBe(0x888888); // Not cobblestone gray
  43  |   });
  44  |   test('Stage 2: Cobblestone + Fachwerkhaus textures load', async ({ page }) => {
  45  |     test.setTimeout(90000);
  46  |     
  47  |     await navigateAndDismiss(page);
  48  |     await page.waitForTimeout(2000);
  49  |     await focusCanvas(page);
  50  |     
  51  |     // Enter debug mode via keyboard (d-e-b-u-g)
  52  |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  53  |       await page.keyboard.press(key);
  54  |       await page.waitForTimeout(50);
  55  |     }
  56  |     await page.waitForTimeout(1000); // Wait for debug mode to activate
  57  |     
  58  |     // Verify debug mode is active (check for debug indicator in body)
  59  |     await page.waitForFunction(() => {
  60  |       const body = document.querySelector('body');
  61  |       return body && body.textContent?.includes('🐛');
  62  |     }, { timeout: 5000 });
  63  |     
  64  |     await focusCanvas(page);
  65  |     
  66  |     // Select Stage 2 via keyboard
  67  |     await page.keyboard.press('2');
  68  |     await page.waitForTimeout(2000); // Let resetStage() process
  69  |     
  70  |     // Wait for stage indicator
  71  |     const stageIndicator = page.locator('#stage-indicator');
  72  |     const stageText = await stageIndicator.textContent();
  73  |     console.log('Stage indicator:', stageText);
  74  |     expect(stageText).toContain('STAGE 2');
  75  |     expect(stageText).toContain('Medieval');
  76  |     
  77  |     // Wait for applyStageVisuals() to set color (should be immediate)
  78  |     // Use waitForFunction to wait for color change instead of fixed timeout
> 79  |     await page.waitForFunction(() => {
      |                ^ Error: page.waitForFunction: Test timeout of 90000ms exceeded.
  80  |       const mesh = window.__getRoadMesh();
  81  |       if (!mesh || !mesh.material) return false;
  82  |       const color = mesh.material.color.getHex();
  83  |       return color === 0x888888; // Wait for cobblestone gray
  84  |     }, { timeout: 10000 });
  85  |     
  86  |     // Get road material info
  87  |     const debugInfo = await page.evaluate(() => {
  88  |       const mesh = window.__getRoadMesh();
  89  |       if (!mesh || !mesh.material) return null;
  90  |       return {
  91  |         color: mesh.material.color.getHex(),
  92  |         colorHex: mesh.material.color.getHexString(),
  93  |         hasMap: !!mesh.material.map,
  94  |         mapName: mesh.material.map?.source?.data?.currentSrc || 'no-map'
  95  |       };
  96  |     });
  97  |     
  98  |     console.log('Stage 2 road material:', debugInfo);
  99  |     await screenshot(page, 'test-results/stage2-cobblestone-texture.png');
  100 |     
  101 |     expect(debugInfo).not.toBeNull();
  102 |     expect(debugInfo.color).toBe(0x888888); // Cobblestone gray
  103 |     expect(debugInfo.hasMap).toBe(true);
  104 |   });
  105 | 
  106 |   test('Stage 3: Concrete jungle textures load', async ({ page }) => {
  107 |     test.setTimeout(90000);
  108 |     
  109 |     await navigateAndDismiss(page);
  110 |     await page.waitForTimeout(2000);
  111 |     await focusCanvas(page);
  112 |     
  113 |     // Enter debug mode via keyboard (d-e-b-u-g)
  114 |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  115 |       await page.keyboard.press(key);
  116 |       await page.waitForTimeout(50);
  117 |     }
  118 |     await page.waitForTimeout(1000);
  119 |     
  120 |     // Verify debug mode is active
  121 |     await page.waitForFunction(() => {
  122 |       const body = document.querySelector('body');
  123 |       return body && body.textContent?.includes('🐛');
  124 |     }, { timeout: 5000 });
  125 |     
  126 |     await focusCanvas(page);
  127 |     
  128 |     // Select Stage 3 via keyboard
  129 |     await page.keyboard.press('3');
  130 |     await page.waitForTimeout(1500);
  131 |     
  132 |     // Wait for stage indicator
  133 |     const stageIndicator = page.locator('#stage-indicator');
  134 |     const stageText = await stageIndicator.textContent();
  135 |     console.log('Stage indicator:', stageText);
  136 |     expect(stageText).toContain('STAGE 3');
  137 |     expect(stageText).toContain('Concrete');
  138 |     
  139 |     // Wait for applyStageVisuals() to set color (immediate)
  140 |     await page.waitForTimeout(2000);
  141 |     
  142 |     // Get road material info
  143 |     const debugInfo = await page.evaluate(() => {
  144 |       const mesh = window.__getRoadMesh();
  145 |       if (!mesh || !mesh.material) return null;
  146 |       return {
  147 |         color: mesh.material.color.getHex(),
  148 |         hasMap: !!mesh.material.map
  149 |       };
  150 |     });
  151 |     
  152 |     console.log('Stage 3 road material:', debugInfo);
  153 |     await screenshot(page, 'test-results/stage3-concrete-texture.png');
  154 |     
  155 |     expect(debugInfo).not.toBeNull();
  156 |     expect(debugInfo.color).toBe(0xffffff); // Concrete white
  157 |     expect(debugInfo.hasMap).toBe(true);
  158 |   });
  159 | });
  160 | 
```