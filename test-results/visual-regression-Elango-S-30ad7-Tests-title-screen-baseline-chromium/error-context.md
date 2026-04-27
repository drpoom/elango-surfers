# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-regression.spec.ts >> Elango Surfers - Visual Regression Tests >> title screen baseline
- Location: tests/visual-regression.spec.ts:18:3

# Error details

```
Test timeout of 60000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Test source

```ts
  1  | // Use relative URL - Playwright config sets baseURL (local or CI)
  2  | const GAME_URL = '/';
  3  | 
  4  | async function dismissLoadingScreen(page) {
  5  |   // Wait for loading to complete and prompt to appear
  6  |   try {
  7  |     await page.waitForSelector('text=Press any key', { timeout: 60000 });
  8  |     // Dismiss with Enter key
  9  |     await page.keyboard.press('Enter');
  10 |     // Wait for loading screen to fade out
  11 |     await page.waitForTimeout(500);
  12 |   } catch (e) {
  13 |     // Loading screen might have auto-dismissed or game started automatically
  14 |     console.log('Loading screen dismissal skipped:', e.message);
> 15 |     await page.waitForTimeout(1000);
     |                ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  16 |   }
  17 |   
  18 |   // Wait for canvas to appear
  19 |   try {
  20 |     await page.waitForSelector('canvas', { timeout: 10000 });
  21 |   } catch (e) {
  22 |     console.log('Canvas not found, game may have crashed');
  23 |   }
  24 | }
  25 | 
  26 | async function navigateAndDismiss(page) {
  27 |   await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  28 |   await dismissLoadingScreen(page);
  29 | }
  30 | 
  31 | // Focus the canvas before keyboard input to ensure events are captured
  32 | // Uses short timeout and ignores errors - focus is best-effort only
  33 | async function focusCanvas(page) {
  34 |   try {
  35 |     await page.waitForSelector('canvas', { timeout: 2000, state: 'visible' });
  36 |     await page.focus('canvas');
  37 |     await page.waitForTimeout(100);
  38 |   } catch (e) {
  39 |     // Canvas not found or not focusable - skip focus, continue test
  40 |     console.log('Canvas focus skipped (not found)');
  41 |   }
  42 | }
  43 | 
  44 | // Take screenshot with timeout to avoid hanging on font loading
  45 | async function screenshot(page, path) {
  46 |   try {
  47 |     await page.screenshot({ path, timeout: 5000 });
  48 |   } catch (e) {
  49 |     console.log(`Screenshot failed for ${path}: ${e.message}`);
  50 |     // Screenshot is non-critical - continue test
  51 |   }
  52 | }
  53 | 
  54 | export { GAME_URL, dismissLoadingScreen, navigateAndDismiss, focusCanvas, screenshot };
  55 | 
```