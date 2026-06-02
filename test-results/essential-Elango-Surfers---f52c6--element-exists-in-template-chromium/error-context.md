# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: essential.spec.ts >> Elango Surfers - Essential Tests >> error overlay element exists in template
- Location: tests/essential.spec.ts:36:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4] [cursor=pointer]:
    - img "Elango Surfers" [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: Elango Surfers v5.2.27
      - generic [ref=e8]: Press any key / Tap to start
  - generic:
    - generic: v5.2.27
    - generic: "Score: 0"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic [ref=e9]:
    - generic [ref=e10] [cursor=pointer]: 🎤🔴
    - generic [ref=e11] [cursor=pointer]: 📱🔴
    - generic [ref=e12] [cursor=pointer]: 🔊
    - generic [ref=e13] [cursor=pointer]: ⚙️
  - generic:
    - text: A/D ←/→ Move | W/↑ Jump | S/↓ Slide
    - text: 📱 Swipe | Tilt | 🎤 Blow to fly!
```

# Test source

```ts
  38  |       return !document.getElementById('countdown');
  39  |     }, { timeout: 40000, polling: 200 });
  40  |     await page.waitForTimeout(300);
  41  |   } catch (e) {
  42  |     // Last resort: wait long enough for countdown to finish.
  43  |     // If the state check fails, we assume the test should proceed or fail naturally.
  44  |     console.log('Countdown wait skipped due to timeout/error:', e.message);
  45  |   }
  46  | }
  47  | 
  48  | async function navigateAndDismiss(page) {
  49  |   await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  50  |   await dismissLoadingScreen(page);
  51  | }
  52  | 
  53  | // Focus the canvas before keyboard input to ensure events are captured
  54  | // Uses short timeout and ignores errors - focus is best-effort only
  55  | async function focusCanvas(page) {
  56  |   try {
  57  |     // The game div has tabindex="-1" and the THREE.js canvas is inside it
  58  |     // Try focusing the game-canvas div first, then the canvas element
  59  |     const gameDiv = page.locator('#game-canvas');
  60  |     if (await gameDiv.count() > 0) {
  61  |       await gameDiv.focus();
  62  |       await page.waitForTimeout(100);
  63  |     } else {
  64  |       await page.waitForSelector('canvas', { timeout: 2000, state: 'visible' });
  65  |       await page.focus('canvas');
  66  |       await page.waitForTimeout(100);
  67  |     }
  68  |   } catch (e) {
  69  |     // Canvas not found or not focusable - skip focus, continue test
  70  |     // Keyboard events are on window, so they should work regardless
  71  |     console.log('Canvas focus skipped (not found)');
  72  |   }
  73  | }
  74  | 
  75  | // Take screenshot with timeout to avoid hanging on font loading
  76  | async function screenshot(page, path) {
  77  |   try {
  78  |     await page.screenshot({ path, timeout: 5000 });
  79  |   } catch (e) {
  80  |     console.log(`Screenshot failed for ${path}: ${e.message}`);
  81  |     // Screenshot is non-critical - continue test
  82  |   }
  83  | }
  84  | 
  85  | /**
  86  |  * Get spawn counts from the game's debug helpers.
  87  |  * Supports both new namespaced (window.__ElangoSurfers) and legacy (window.__getSpawnCounts) access.
  88  |  */
  89  | async function getSpawnCounts(page) {
  90  |   return page.evaluate(() => {
  91  |     if (window.__ElangoSurfers) return window.__ElangoSurfers.getSpawnCounts();
  92  |     if (window.__getSpawnCounts) return window.__getSpawnCounts();
  93  |     return { obstacles: -1, coins: -1 };
  94  |   });
  95  | }
  96  | 
  97  | /**
  98  |  * Get full spawn debug state from the game's debug helpers.
  99  |  * Supports both new namespaced and legacy access.
  100 |  */
  101 | async function getSpawnDebug(page) {
  102 |   return page.evaluate(() => {
  103 |     if (window.__ElangoSurfers) return window.__ElangoSurfers.getSpawnDebug();
  104 |     if (window.__getSpawnDebug) return window.__getSpawnDebug();
  105 |     return null;
  106 |   });
  107 | }
  108 | 
  109 | /**
  110 |  * Get road mesh reference from the game's debug helpers.
  111 |  * Supports both new namespaced and legacy access.
  112 |  */
  113 | async function getRoadMesh(page) {
  114 |   return page.evaluate(() => {
  115 |     if (window.__ElangoSurfers) return window.__ElangoSurfers.getRoadMesh();
  116 |     if (window.__getRoadMesh) return window.__getRoadMesh();
  117 |     return null;
  118 |   });
  119 | }
  120 | 
  121 | /**
  122 |  * Get the game store via test helpers (dev mode only).
  123 |  */
  124 | async function getStore(page) {
  125 |   // Wait for store to be available (handles race with page load)
  126 |   await page.waitForFunction(() => window.__ElangoSurfers && window.__ElangoSurfers.getStore(), { timeout: 10000 });
  127 |   return page.evaluate(() => window.__ElangoSurfers.getStore());
  128 | }
  129 | 
  130 | /**
  131 |  * Skip directly to active gameplay (past loading + countdown).
  132 |  * Uses store manipulation to bypass all waits — no keyboard input needed.
  133 |  * Total time: ~2-3s instead of 25-40s.
  134 |  */
  135 | async function skipToGameplay(page) {
  136 |   await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  137 |   // Wait for the game to initialize (store + canvas must exist)
> 138 |   await page.waitForFunction(() => {
      |              ^ Error: page.waitForFunction: Test timeout of 30000ms exceeded.
  139 |     return window.__ElangoSurfers?.getStore() != null;
  140 |   }, { timeout: 15000, polling: 200 });
  141 |   // Atomically: start countdown then immediately unlock — all in one evaluate
  142 |   // This avoids the race where startCountdown sets countdownLocked=true
  143 |   // and the game loop hasn't processed our unlock yet
  144 |   await page.evaluate(() => {
  145 |     const store = window.__ElangoSurfers.getStore();
  146 |     // Call startCountdown to properly initialize game state (resetStage, etc.)
  147 |     if (store.startCountdown) store.startCountdown();
  148 |     // Immediately unlock keyboard — skip the 3-2-1-GO countdown
  149 |     store.countdownActive = false;
  150 |     store.countdownLocked = false;
  151 |     store.countdownText = '';
  152 |     store.stageTransitioning = false;
  153 |     // Ensure game is running
  154 |     store.gameStartTime = Date.now();
  155 |     store.isInvincible = true;
  156 |     store.gameDuration = 0;
  157 |   });
  158 |   // Brief settle for the game loop to pick up state changes
  159 |   await page.waitForTimeout(200);
  160 | }
  161 | 
  162 | /**
  163 |  * Skip to boss fight state. Uses store manipulation instead of keyboard shortcuts.
  164 |  * Must be called after skipToGameplay.
  165 |  */
  166 | async function skipToBoss(page) {
  167 |   await page.evaluate(() => {
  168 |     const store = window.__ElangoSurfers.getStore();
  169 |     // Skip stage time to trigger stage end
  170 |     const STAGES = window.__ElangoSurfers?.STAGES;
  171 |     const stage = STAGES ? STAGES[store.currentStage] : null;
  172 |     store.stageTime = stage?.stageDuration || 30;
  173 |     // Trigger boss immediately
  174 |     store.bossWarning = false;
  175 |   });
  176 |   await page.waitForTimeout(300);
  177 | }
  178 | 
  179 | /**
  180 |  * Skip to game over state. Uses store.triggerGameOver() directly.
  181 |  * Must be called after skipToGameplay or navigateAndDismiss.
  182 |  */
  183 | async function skipToGameOver(page) {
  184 |   await page.evaluate(() => {
  185 |     const store = window.__ElangoSurfers.getStore();
  186 |     if (store && store.triggerGameOver) {
  187 |       store.triggerGameOver();
  188 |     }
  189 |   });
  190 |   await page.waitForTimeout(300);
  191 | }
  192 | 
  193 | /**
  194 |  * Directly set store properties via page.evaluate — avoids keyboard input entirely.
  195 |  * Example: await setStoreState(page, { godMode: true, currentLane: 0 });
  196 |  */
  197 | async function setStoreState(page, updates) {
  198 |   await page.evaluate((u) => {
  199 |     const store = window.__ElangoSurfers?.getStore();
  200 |     if (!store) return;
  201 |     Object.assign(store, u);
  202 |   }, updates);
  203 | }
  204 | 
  205 | /**
  206 |  * Wait for a specific store condition. Polls the game store at intervals.
  207 |  * Much faster than waitForTimeout for state-dependent checks.
  208 |  */
  209 | async function waitForStoreCondition(page, conditionFn, timeout = 5000) {
  210 |   return page.waitForFunction(
  211 |     (fnStr) => {
  212 |       const store = window.__ElangoSurfers?.getStore();
  213 |       if (!store) return false;
  214 |       const fn = new Function('store', 'return ' + fnStr);
  215 |       return fn(store);
  216 |     },
  217 |     conditionFn,
  218 |     { timeout, polling: 100 }
  219 |   );
  220 | }
  221 | 
  222 | export { GAME_URL, dismissLoadingScreen, navigateAndDismiss, focusCanvas, screenshot, getSpawnCounts, getSpawnDebug, getRoadMesh, getStore, skipToGameplay, skipToBoss, skipToGameOver, waitForStoreCondition, setStoreState };
  223 | 
```