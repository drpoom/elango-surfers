# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: texture-loading.spec.ts >> Texture Loading >> loading screen shows with visible text
- Location: tests/texture-loading.spec.ts:39:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.loading-screen').locator('.loading-text')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('.loading-screen').locator('.loading-text')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4] [cursor=pointer]:
    - img "Elango Surfers" [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: Elango Surfers v5.2.1
      - generic [ref=e8]: Press any key / Tap to start
  - generic:
    - generic: v5.2.1
    - generic: "Score: 0"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic [ref=e9]:
    - generic [ref=e10] [cursor=pointer]: 🎤🔴
    - generic [ref=e11] [cursor=pointer]: 📱
    - generic [ref=e12] [cursor=pointer]: 🔊
    - generic [ref=e13] [cursor=pointer]: ⚙️
  - generic:
    - text: A/D ←/→ Move | W/↑ Jump | S/↓ Slide
    - text: 📱 Swipe | Tilt | 🎤 Blow to fly!
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, navigateAndDismiss } from './helpers';
  3  | 
  4  | test.describe('Texture Loading', () => {
  5  |   test('Stage 1 textures load correctly', async ({ page }) => {
  6  |     await navigateAndDismiss(page);
  7  | 
  8  |     // Verify game canvas exists and is visible
  9  |     const canvas = page.locator('canvas');
  10 |     await expect(canvas).toBeVisible({ timeout: 10000 });
  11 | 
  12 |     // Verify canvas has rendered (non-zero dimensions)
  13 |     const box = await canvas.boundingBox();
  14 |     expect(box).not.toBeNull();
  15 |     expect(box!.width).toBeGreaterThan(0);
  16 |     expect(box!.height).toBeGreaterThan(0);
  17 | 
  18 |     await page.screenshot({ path: 'tests/screenshots/stage1-textures-loaded.png' });
  19 |   });
  20 | 
  21 |   test('obstacles spawn at game start', async ({ page }) => {
  22 |     await navigateAndDismiss(page);
  23 | 
  24 |     // Wait for game to initialize
  25 |     await page.waitForTimeout(1000);
  26 | 
  27 |     // Verify canvas is active with dimensions
  28 |     const canvas = page.locator('canvas');
  29 |     await expect(canvas).toBeVisible({ timeout: 10000 });
  30 | 
  31 |     const box = await canvas.boundingBox();
  32 |     expect(box).not.toBeNull();
  33 |     expect(box!.width).toBeGreaterThan(0);
  34 |     expect(box!.height).toBeGreaterThan(0);
  35 | 
  36 |     await page.screenshot({ path: 'tests/screenshots/obstacles-spawn-at-start.png' });
  37 |   });
  38 | 
  39 |   test('loading screen shows with visible text', async ({ page }) => {
  40 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  41 | 
  42 |     const loadingScreen = page.locator('.loading-screen');
  43 |     await expect(loadingScreen).toBeVisible({ timeout: 60000 });
  44 | 
  45 |     // Verify loading text is visible (text says "Loading...")
  46 |     const loadingText = loadingScreen.locator('.loading-text');
> 47 |     await expect(loadingText).toBeVisible({ timeout: 10000 });
     |                               ^ Error: expect(locator).toBeVisible() failed
  48 | 
  49 |     // Verify version text is visible
  50 |     await expect(loadingScreen.locator('.version')).toBeVisible({ timeout: 10000 });
  51 | 
  52 |     // Verify loading screen has black background
  53 |     const bgColor = await loadingScreen.evaluate(el => {
  54 |       return window.getComputedStyle(el).backgroundColor;
  55 |     });
  56 |     expect(bgColor).toMatch(/rgb\(0,\s*0,\s*0\)/);
  57 | 
  58 |     // Verify text has black border (text-shadow with #000)
  59 |     const textShadow = await loadingText.evaluate(el => {
  60 |       return window.getComputedStyle(el).textShadow;
  61 |     });
  62 |     expect(textShadow).toContain('0'); // text-shadow includes offsets with #000
  63 | 
  64 |     await page.screenshot({ path: 'tests/screenshots/loading-screen-text-visible.png' });
  65 |   });
  66 | 
  67 |   test('countdown starts after loading screen fades', async ({ page }) => {
  68 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  69 | 
  70 |     // Wait for loading to complete
  71 |     await expect(page.locator('text=Press any key')).toBeVisible({ timeout: 60000 });
  72 | 
  73 |     // Dismiss loading screen
  74 |     await page.keyboard.press('Enter');
  75 | 
  76 |     // Wait for loading screen to fade out
  77 |     await page.locator('.loading-screen').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  78 | 
  79 |     // Verify canvas is active after loading screen fades
  80 |     const canvas = page.locator('canvas');
  81 |     await expect(canvas).toBeVisible({ timeout: 10000 });
  82 | 
  83 |     await page.screenshot({ path: 'tests/screenshots/countdown-after-loading.png' });
  84 |   });
  85 | });
```