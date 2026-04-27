# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage-textures.spec.ts >> Stage Texture Verification >> Stage 2: Cobblestone + Fachwerkhaus textures load
- Location: tests/stage-textures.spec.ts:47:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('button:has-text("⚙️")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.1
    - generic: "Score: 3491"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic: ⬅️
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
  53  |     await page.waitForTimeout(3000);
  54  |     
  55  |     // Open settings and enable debug mode via UI
> 56  |     await page.locator('button:has-text("⚙️")').click();
      |                                                 ^ Error: locator.click: Test timeout of 90000ms exceeded.
  57  |     await page.waitForTimeout(500);
  58  |     await page.locator('button:has-text("🐛 Debug")').click();
  59  |     await page.waitForTimeout(500);
  60  |     
  61  |     // Use debug stage selector UI instead of keyboard
  62  |     await page.locator('button:has-text("2. Medieval")').click();
  63  |     await page.waitForTimeout(500);
  64  |     
  65  |     // Close settings
  66  |     await page.locator('button:has-text("✖")').first().click();
  67  |     await page.waitForTimeout(1500);
  68  |     
  69  |     // Wait for stage indicator
  70  |     const stageIndicator = page.locator('#stage-indicator');
  71  |     const stageText = await stageIndicator.textContent();
  72  |     console.log('Stage indicator:', stageText);
  73  |     expect(stageText).toContain('STAGE 2');
  74  |     
  75  |     await page.waitForTimeout(2000); // Let textures load
  76  |     
  77  |     // Get road material info
  78  |     const debugInfo = await page.evaluate(() => {
  79  |       const mesh = window.__getRoadMesh();
  80  |       if (!mesh || !mesh.material) return null;
  81  |       return {
  82  |         color: mesh.material.color.getHex(),
  83  |         hasMap: !!mesh.material.map
  84  |       };
  85  |     });
  86  |     
  87  |     console.log('Stage 2 road material:', debugInfo);
  88  |     await screenshot(page, 'test-results/stage2-cobblestone-texture.png');
  89  |     
  90  |     expect(debugInfo).not.toBeNull();
  91  |     expect(debugInfo.color).toBe(0x888888); // Cobblestone gray
  92  |     expect(debugInfo.hasMap).toBe(true);
  93  |   });
  94  | 
  95  |   test('Stage 3: Concrete jungle textures load', async ({ page }) => {
  96  |     test.setTimeout(60000);
  97  |     
  98  |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  99  |     await page.waitForLoadState('networkidle');
  100 |     await navigateAndDismiss(page);
  101 |     await page.waitForTimeout(2000);
  102 |     await focusCanvas(page);
  103 |     
  104 |     // Enter debug mode
  105 |     await page.keyboard.press('d');
  106 |     await page.waitForTimeout(100);
  107 |     await page.keyboard.press('e');
  108 |     await page.waitForTimeout(100);
  109 |     await page.keyboard.press('b');
  110 |     await page.waitForTimeout(100);
  111 |     await page.keyboard.press('u');
  112 |     await page.waitForTimeout(100);
  113 |     await page.keyboard.press('g');
  114 |     await page.waitForTimeout(500);
  115 |     await focusCanvas(page);
  116 |     
  117 |     // Select Stage 3
  118 |     await page.keyboard.press('3');
  119 |     
  120 |     // Wait for concrete texture to load (Stage 3 has white concrete)
  121 |     await page.waitForFunction(() => {
  122 |       const mesh = window.__getRoadMesh();
  123 |       if (!mesh || !mesh.material) return false;
  124 |       const color = mesh.material.color.getHex();
  125 |       // Stage 3 concrete should be white/light (0xffffff)
  126 |       return color === 0xffffff;
  127 |     }, { timeout: 10000 });
  128 |     
  129 |     await page.waitForTimeout(2000);
  130 |     await screenshot(page, 'test-results/stage3-concrete-texture.png');
  131 |     
  132 |     // Verify Stage 3 indicator
  133 |     const stageIndicator = page.locator('#stage-indicator');
  134 |     const stageText = await stageIndicator.textContent();
  135 |     expect(stageText).toContain('STAGE 3');
  136 |     expect(stageText).toContain('Cyber');
  137 |     
  138 |     // Verify concrete texture
  139 |     const roadMaterial = await page.evaluate(() => {
  140 |       const mesh = window.__getRoadMesh();
  141 |       if (!mesh || !mesh.material) return null;
  142 |       return {
  143 |         color: mesh.material.color.getHex(),
  144 |         hasMap: !!mesh.material.map
  145 |       };
  146 |     });
  147 |     
  148 |     expect(roadMaterial).not.toBeNull();
  149 |     expect(roadMaterial.hasMap).toBe(true);
  150 |     expect(roadMaterial.color).toBe(0xffffff); // Concrete white
  151 |   });
  152 | });
  153 | 
```