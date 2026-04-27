# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: texture-loading.spec.ts >> Texture Loading >> loading screen shows with visible text
- Location: tests/texture-loading.spec.ts:39:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('.loading-screen')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for locator('.loading-screen')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GAME_URL, navigateAndDismiss, screenshot } from './helpers';
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
  18 |     await screenshot(page, 'tests/screenshots/stage1-textures-loaded.png');
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
  36 |     await screenshot(page, 'tests/screenshots/obstacles-spawn-at-start.png');
  37 |   });
  38 | 
  39 |   test('loading screen shows with visible text', async ({ page }) => {
  40 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  41 | 
  42 |     const loadingScreen = page.locator('.loading-screen');
> 43 |     await expect(loadingScreen).toBeVisible({ timeout: 60000 });
     |                                 ^ Error: expect(locator).toBeVisible() failed
  44 | 
  45 |     // Verify loading text is visible (text says "Loading...")
  46 |     // The loading text may disappear quickly if textures are cached, so check during initial load
  47 |     const loadingText = loadingScreen.locator('text=Loading...');
  48 |     await expect(loadingText).toBeVisible({ timeout: 5000 }).catch(() => {
  49 |       // If textures loaded too fast, the prompt text should be visible instead
  50 |       const prompt = loadingScreen.locator('text=Press any key');
  51 |       return expect(prompt).toBeVisible({ timeout: 5000 });
  52 |     });
  53 | 
  54 |     // Verify version text is visible
  55 |     await expect(loadingScreen.locator('.version')).toBeVisible({ timeout: 10000 });
  56 | 
  57 |     // Verify loading screen has black background
  58 |     const bgColor = await loadingScreen.evaluate(el => {
  59 |       return window.getComputedStyle(el).backgroundColor;
  60 |     });
  61 |     expect(bgColor).toMatch(/rgb\(0,\s*0,\s*0\)/);
  62 | 
  63 |     await screenshot(page, 'tests/screenshots/loading-screen-text-visible.png');
  64 |   });
  65 | 
  66 |   test('countdown starts after loading screen fades', async ({ page }) => {
  67 |     await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  68 | 
  69 |     // Wait for loading to complete
  70 |     await expect(page.locator('text=Press any key')).toBeVisible({ timeout: 60000 });
  71 | 
  72 |     // Dismiss loading screen
  73 |     await page.keyboard.press('Enter');
  74 | 
  75 |     // Wait for loading screen to fade out
  76 |     await page.locator('.loading-screen').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  77 | 
  78 |     // Verify canvas is active after loading screen fades
  79 |     const canvas = page.locator('canvas');
  80 |     await expect(canvas).toBeVisible({ timeout: 10000 });
  81 | 
  82 |     await screenshot(page, 'tests/screenshots/countdown-after-loading.png');
  83 |   });
  84 | });
```