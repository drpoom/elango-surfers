# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage-textures.spec.ts >> Stage Texture Verification >> Stage 2: Cobblestone + Fachwerkhaus textures load
- Location: tests/stage-textures.spec.ts:46:3

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
    - generic: "Score: 3018"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
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
  46  |   test('Stage 2: Cobblestone + Fachwerkhaus textures load', async ({ page }) => {
  47  |     test.setTimeout(90000);
  48  |     
  49  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  50  |     await page.waitForLoadState('networkidle');
  51  |     await navigateAndDismiss(page);
  52  |     await page.waitForTimeout(2000);
  53  |     await focusCanvas(page);
  54  |     
  55  |     // Enter debug mode via keyboard (d-e-b-u-g)
  56  |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  57  |       await page.keyboard.press(key);
  58  |       await page.waitForTimeout(50);
  59  |     }
  60  |     await page.waitForTimeout(1000); // Wait for debug mode to activate
  61  |     
  62  |     // Verify debug mode is active (check for debug indicator in body)
> 63  |     await page.waitForFunction(() => {
      |                ^ Error: page.waitForFunction: Test timeout of 90000ms exceeded.
  64  |       const body = document.querySelector('body');
  65  |       return body && body.textContent?.includes('🐛');
  66  |     }, { timeout: 5000 });
  67  |     
  68  |     await focusCanvas(page);
  69  |     
  70  |     // Select Stage 2 via keyboard
  71  |     await page.keyboard.press('2');
  72  |     await page.waitForTimeout(2000); // Let resetStage() process
  73  |     
  74  |     // Wait for stage indicator
  75  |     const stageIndicator = page.locator('#stage-indicator');
  76  |     const stageText = await stageIndicator.textContent();
  77  |     console.log('Stage indicator:', stageText);
  78  |     expect(stageText).toContain('STAGE 2');
  79  |     expect(stageText).toContain('Medieval');
  80  |     
  81  |     // Wait for applyStageVisuals() to set color (should be immediate)
  82  |     // Use waitForFunction to wait for color change instead of fixed timeout
  83  |     await page.waitForFunction(() => {
  84  |       const mesh = window.__getRoadMesh();
  85  |       if (!mesh || !mesh.material) return false;
  86  |       const color = mesh.material.color.getHex();
  87  |       return color === 0x888888; // Wait for cobblestone gray
  88  |     }, { timeout: 10000 });
  89  |     
  90  |     // Get road material info
  91  |     const debugInfo = await page.evaluate(() => {
  92  |       const mesh = window.__getRoadMesh();
  93  |       if (!mesh || !mesh.material) return null;
  94  |       return {
  95  |         color: mesh.material.color.getHex(),
  96  |         colorHex: mesh.material.color.getHexString(),
  97  |         hasMap: !!mesh.material.map,
  98  |         mapName: mesh.material.map?.source?.data?.currentSrc || 'no-map'
  99  |       };
  100 |     });
  101 |     
  102 |     console.log('Stage 2 road material:', debugInfo);
  103 |     await screenshot(page, 'test-results/stage2-cobblestone-texture.png');
  104 |     
  105 |     expect(debugInfo).not.toBeNull();
  106 |     expect(debugInfo.color).toBe(0x888888); // Cobblestone gray
  107 |     expect(debugInfo.hasMap).toBe(true);
  108 |   });
  109 | 
  110 |   test('Stage 3: Concrete jungle textures load', async ({ page }) => {
  111 |     test.setTimeout(90000);
  112 |     
  113 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  114 |     await page.waitForLoadState('networkidle');
  115 |     await navigateAndDismiss(page);
  116 |     await page.waitForTimeout(2000);
  117 |     await focusCanvas(page);
  118 |     
  119 |     // Enter debug mode via keyboard (d-e-b-u-g)
  120 |     for (const key of ['d', 'e', 'b', 'u', 'g']) {
  121 |       await page.keyboard.press(key);
  122 |       await page.waitForTimeout(50);
  123 |     }
  124 |     await page.waitForTimeout(1000);
  125 |     
  126 |     // Verify debug mode is active
  127 |     await page.waitForFunction(() => {
  128 |       const body = document.querySelector('body');
  129 |       return body && body.textContent?.includes('🐛');
  130 |     }, { timeout: 5000 });
  131 |     
  132 |     await focusCanvas(page);
  133 |     
  134 |     // Select Stage 3 via keyboard
  135 |     await page.keyboard.press('3');
  136 |     await page.waitForTimeout(1500);
  137 |     
  138 |     // Wait for stage indicator
  139 |     const stageIndicator = page.locator('#stage-indicator');
  140 |     const stageText = await stageIndicator.textContent();
  141 |     console.log('Stage indicator:', stageText);
  142 |     expect(stageText).toContain('STAGE 3');
  143 |     expect(stageText).toContain('Concrete');
  144 |     
  145 |     // Wait for applyStageVisuals() to set color (immediate)
  146 |     await page.waitForTimeout(2000);
  147 |     
  148 |     // Get road material info
  149 |     const debugInfo = await page.evaluate(() => {
  150 |       const mesh = window.__getRoadMesh();
  151 |       if (!mesh || !mesh.material) return null;
  152 |       return {
  153 |         color: mesh.material.color.getHex(),
  154 |         hasMap: !!mesh.material.map
  155 |       };
  156 |     });
  157 |     
  158 |     console.log('Stage 3 road material:', debugInfo);
  159 |     await screenshot(page, 'test-results/stage3-concrete-texture.png');
  160 |     
  161 |     expect(debugInfo).not.toBeNull();
  162 |     expect(debugInfo.color).toBe(0xffffff); // Concrete white
  163 |     expect(debugInfo.hasMap).toBe(true);
```