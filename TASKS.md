# elango-surfers — v5.0.21 Task Plan

## Overview
Two items to address: **Bug fix** (loading screen keypress) and **Feature** (loading progress bar). Target version: **v5.0.21**.

---

## Bug: Loading screen doesn't respond to keypress

**Symptom:** LoadingScreen shows v5.0.20 on black background with "Press any key / Tap to start", but pressing any key does NOT dismiss it. BGM doesn't start either.

**Root cause analysis:**
- `LoadingScreen.vue` registers `window.addEventListener('keydown', handleKeyDown)` in `onMounted` and emits `@start`
- `App.vue` wires `@start="onLoadingStart"` which calls `initAudio()`, `startBGM()`, then hides after 400ms
- **Likely cause:** The Three.js canvas (`renderer.domElement`) is appended to `#game-canvas` during `initGame()`, which runs inside `onMounted` in App.vue. If `initGame()` runs before the loading screen's `onMounted`, the canvas may capture/focus keyboard events before the loading screen registers its listener. Alternatively, the canvas may have `tabindex` or focus that steals keydown events.
- **Another possibility:** `initGame()` is called somewhere that blocks the event loop, preventing the loading screen's `onMounted` from running until after the canvas is focused.

**Fix approach:**
1. Ensure loading screen event listener is registered before `initGame()` creates the canvas
2. Add `tabindex="-1"` to the game canvas container to prevent it from stealing focus
3. Consider using `document.addEventListener` with `capture: true` on the loading screen to guarantee event reception
4. Add a fallback: also listen for `pointerdown`/`touchstart` on the document level

---

## Feature: Loading progress bar

**Requirement:** Show texture loading progress on the loading screen.

**Current state:** Textures load asynchronously via `THREE.TextureLoader.load()` with no progress tracking. The loading screen has no concept of loading state.

**Implementation plan:**
1. Create a texture loading manager (or use `THREE.LoadingManager`) that tracks total vs. loaded texture count
2. Wrap all `textureLoader.load()` calls to go through the manager
3. Expose progress as a reactive ref (0–100%)
4. Pass progress to `LoadingScreen` as a prop
5. In `LoadingScreen.vue`:
   - Show "Loading... XX%" while progress < 100
   - Only show "Press any key / Tap to start" when progress === 100
   - Keep black background, version display, video placeholder

---

## Tasks

### 1. Scout 🔍 — Create loading screen test case
- Write a Playwright test that:
  - Verifies the loading screen is visible on page load
  - Verifies pressing a key dismisses the loading screen
  - Verifies BGM starts after dismissal (check audio context state or play event)
- File: `tests/loading-screen.spec.js`

### 2. Byte ⚡ — Fix the loading screen keypress bug
- Root cause: investigate event listener registration order vs. canvas creation
- Fix: ensure `keydown` listener on `window`/`document` fires before canvas can intercept
- Options:
  - Use `document.addEventListener('keydown', ..., { capture: true })` in LoadingScreen
  - Prevent canvas from auto-focusing (set `tabindex="-1"` on `#game-canvas`)
  - Defer `initGame()` until after loading screen is mounted
- Verify fix with the test from Task 1

### 3. Byte ⚡ — Implement loading progress tracking
- Create `src/composables/useLoadingProgress.js`:
  - Uses `THREE.LoadingManager` to track texture loads
  - Exposes `loadingProgress` ref (0–100) and `isLoaded` computed
- Modify `App.vue`:
  - Instantiate loading manager, pass to texture loader
  - Pass `loadingProgress` and `isLoaded` as props to `LoadingScreen`
- Modify `LoadingScreen.vue`:
  - Accept `progress` and `loaded` props
  - Show "Loading... XX%" when `!loaded`
  - Show "Press any key / Tap to start" only when `loaded`
  - Add progress bar visual (thin bar or percentage text)

### 4. Byte ⚡ — Version bump to v5.0.21, build, deploy
- Update `VERSION` in `App.vue` from `'v5.0.20'` → `'v5.0.21'`
- Update `version` in `package.json` from `'5.0.20'` → `'5.0.21'`
- Run `npm run build`
- Deploy dist/ to hosting

### 5. Scout 🔍 — Run regression tests
- Run full Playwright test suite against deployed v5.0.21
- Specifically verify the new loading screen test passes
- Check that game starts correctly after loading completes
- Verify BGM starts on first keypress/tap after load