# Elango Surfers — Source Code Bug Analysis

**Date:** 2026-05-19  
**Scope:** `src/` directory only (not `assets/` or `dist/`)  
**Files analyzed:** `App.vue`, `main.js`, `gameConstants.js`, `data/stages.js`, `LoadingScreen.vue`, and all composables (`useAudio.js`, `useCurve.js`, `useMic.js`, `useStage.js`, `useAchievements.js`, `useConveyor.js`, `useGameSettings.js`, `useScreenEffects.js`, `useLeaderboard.js`, `useLoadingProgress.js`)

---

## Bug Summary Table

| Severity | File | Line/Area | Bug Description |
|----------|------|-----------|-----------------|
| 🔴 Critical | App.vue | `onUnmounted` | **WebGL context leak**: `renderer` is never disposed. `renderer.dispose()` is missing from `onUnmounted()`. The WebGL context, GPU buffers, and all associated resources remain allocated after component unmount. |
| 🔴 Critical | App.vue | `onUnmounted` | **Animation frame never cancelled**: `requestAnimationFrame(animate)` loop has no `cancelAnimationFrame()` call. On hot-reload or component remount, multiple animation loops run simultaneously, causing double-rendering and memory leaks. |
| 🔴 Critical | App.vue | `onUnmounted` | **Event listeners not fully removed**: `handleTouchMove` listener removal uses wrong reference — `removeEventListener('touchmove', handleTouchEnd, { capture: true })` should be `handleTouchMove` (the anonymous arrow function), not `handleTouchEnd`. Since the listener is an anonymous arrow, it can never be removed. |
| 🔴 Critical | App.vue | `animate()` | **Race condition in game-over collision**: `obstacles.forEach` uses `splice(index, 1)` inside the loop body (multiple locations). When `return` is used after `splice`, subsequent iterations may skip elements or access wrong indices. Should iterate in reverse or use `for (let i = obstacles.length - 1; ...)`. |
| 🟠 High | App.vue | `spawnObstacle()` | **Geometry/material leak on obstacles**: Each obstacle type creates new `THREE.Geometry` and `THREE.Material` instances every spawn (e.g., `new THREE.BoxGeometry(...)`, `new THREE.MeshToonMaterial(...)`). These are never pooled or cached, causing GPU memory growth. Only some are disposed on removal. |
| 🟠 High | App.vue | `createParticleEffect()` | **Particle geometry/material leak**: Every particle creates a new `SphereGeometry(0.1, 4, 4)` and `MeshBasicMaterial`. These are never disposed when particles are removed — only `scene.remove()` is called. |
| 🟠 High | App.vue | `createFloatingText()` | **Canvas/texture leak**: Each floating text creates a new `CanvasTexture` and `SpriteMaterial`. Neither the texture nor the material is disposed when the sprite is removed from the scene. |
| 🟠 High | App.vue | `createStars()` | **Stars never cleaned up between day/night cycles**: Stars group is removed via `scene.remove(stars)` but geometries/materials of individual star meshes are not disposed. Over many day/night cycles, this accumulates GPU memory. |
| 🟠 High | App.vue | `applyStageVisuals()` | **Stage 3 skyscraper leak**: When transitioning to Stage 3, tree sprites are removed and replaced with 3D skyscraper meshes. The sprite material is disposed, but the new `BoxGeometry` and `MeshPhysicalMaterial` per skyscraper are never pooled. On stage transition back, skyscraper geometry/material is disposed, but the replacement tree sprites create new `SpriteMaterial` + `Sprite` each time. |
| 🟠 High | App.vue | `animate()` — obstacle loop | **`forEach` with `splice` + `return`**: The `obstacles.forEach((obs, index) => { ... })` loop calls `obstacles.splice(index, 1)` and then `return` in multiple branches (slippery hit, invincible hit, game over, cleanup). Since `forEach` doesn't support `continue`, `return` acts as `continue` but the array has already been modified, causing index misalignment for subsequent iterations. |
| 🟠 High | App.vue | `animate()` — coins loop | **Same `splice` in `forEach` issue**: `coins.forEach((coin, index) => { ... coins.splice(index, 1); })` — same index corruption bug as obstacles. |
| 🟠 High | App.vue | `animate()` — powerups loop | **Same `splice` in `forEach` issue**: `powerups.forEach((pw, index) => { ... powerups.splice(index, 1); })` |
| 🟠 High | App.vue | `animate()` — bonusCoins loop | **Same `splice` in `forEach` issue**: `bonusCoins.forEach((bc, index) => { ... bonusCoins.splice(index, 1); })` |
| 🟠 High | useAudio.js | `startBGM()` | **Double `createMediaElementSource`**: If `startBGM()` is called multiple times (e.g., after mute/unmute), `bgmSource = audioCtx.createMediaElementSource(bgmAudio)` will throw `InvalidStateError` because a media element can only have one `MediaElementAudioSourceNode`. The `if (!bgmSource)` guard helps, but if `stopBGM()` sets `bgmSource = null` and then `startBGM()` is called again, it tries to create a new source from the same element, which fails. |
| 🟠 High | useAudio.js | `startBGM()` | **No cleanup of `bgmSource`/`bgmMedievalSource` on `stopBGM()`**: `stopBGM()` disconnects gain nodes but doesn't disconnect or nullify `bgmSource`/`bgmMedievalSource`. On restart, the guard `if (!bgmSource)` passes (it's still connected), but the old connections may leak. |
| 🟡 Medium | App.vue | `useStage.js` | **Duplicate `currentStage` ref**: `useStage.js` creates its own `currentStage = ref(0)` and `stageTime = ref(0)`, but `App.vue` also declares `const currentStage = ref(0)` and `const stageTime = ref(0)` independently. The composable's refs are never used — `App.vue` uses its own local refs. This means `useStage`'s `advanceStage()`, `resetStage()`, etc. modify different refs than the ones the template renders. |
| 🟡 Medium | App.vue | `useConveyor.js` | **Same duplicate ref issue**: `useConveyor.js` is imported inside `useStage.js`, creating `conveyorSpeed`, `conveyorDirection`, etc. as module-level refs. But `App.vue` never uses these — the conveyor system is effectively dead code. The `updateConveyor()` function is never called in the animate loop. |
| 🟡 Medium | App.vue | `resetStage()` | **`buildings`/`trees` reset uses `initZ`/`initX` but `createBackgroundElements` stores them as `userData.initX`/`userData.initZ`**: The reset code checks `b.userData.initZ !== undefined` which is correct, but `b.userData.initX` is set to `buildingGroup.position.x` (which includes curve offset at spawn time), not the original base X. On reset, buildings may be offset. |
| 🟡 Medium | App.vue | `animate()` | **`gameDuration` incremented even during pause**: The `isPaused` check returns early from `animate()` but `clock.getDelta()` is consumed. However, `gameDuration += delta` happens after the pause check, so it's correctly skipped. BUT — `dayCycleTime += delta` also happens after the pause check, so day/night cycle is correctly paused. No bug here on closer inspection. |
| 🟡 Medium | App.vue | `handleKeyDown` | **Multiple keydown listeners registered**: `onMounted` registers `window.addEventListener('keydown', handleKeyDown)` AND a separate anonymous `window.addEventListener('keydown', (e) => { if (isPaused.value) resumeGame(); ... })`. The anonymous listener is never removed in `onUnmounted`, causing a leak on hot-reload. |
| 🟡 Medium | App.vue | `handleKeyDown` | **Another anonymous keydown listener** for 'P' key is registered and never removed. |
| 🟡 Medium | App.vue | `handleTouchStart` | **Anonymous touchstart listener** registered in `onMounted` for tilt permission is never removed. |
| 🟡 Medium | App.vue | `onMounted` — click handler | **Anonymous click listener** registered and never removed in `onUnmounted`. |
| 🟡 Medium | App.vue | `onMounted` — resize handler | **Anonymous resize listener** registered and never removed. |
| 🟡 Medium | App.vue | `onMounted` — visibilitychange | **Anonymous visibilitychange listener** registered but never removed in `onUnmounted`. |
| 🟡 Medium | App.vue | `LoadingScreen.vue` | **Event listener leak**: `onMounted` adds `keydown`, `click`, `touchstart` listeners with `{ capture: true }` and `{ passive: false }`. `onUnmounted` removes them correctly. ✅ No bug here. |
| 🟡 Medium | App.vue | `spawnBoss()` — dragon | **Wing geometry uses `BufferGeometry` with raw `Float32Array`**: The dragon wing creates `new THREE.BufferGeometry()` and sets `setAttribute('position', ...)` with 9-float arrays (3 vertices per triangle). `computeVertexNormals()` is called but may produce incorrect normals for such small geometries. Not a crash bug, but visual artifacts possible. |
| 🟡 Medium | App.vue | `triggerGameOver()` | **`gameOverShakeInterval` uses `setInterval`**: The screen shake uses `setInterval` with manual time tracking and `clearInterval`. If `triggerGameOver` is called twice rapidly (despite the `if (gameOver.value) return` guard), the interval reference could be overwritten. The guard prevents this in practice. |
| 🟡 Medium | App.vue | `animate()` — spawn debug | **`window._spawnStateInterval` is set in animate loop**: This `setInterval` is created inside `animate()` which runs every frame. The `if (!window._spawnStateInterval)` guard prevents duplicates, but it's never cleared on game reset or unmount. |
| 🟡 Medium | App.vue | `useMic.js` | **AudioContext leak**: `initMic()` creates a new `AudioContext` every time it's called if `micStream` is null. But if mic is toggled off and on, `micStream` is set to null in `toggleMic`, so a new `AudioContext` is created each time. The old `AudioContext` is never closed, leaking audio resources. |
| 🟡 Medium | App.vue | `useLeaderboard.js` | **Exposed Supabase anon key**: `SUPABASE_ANON_KEY` is hardcoded in client-side code. While anon keys are designed for client use, this one appears to be a service role key pattern (`sb_publishable_...`), which may have more permissions than intended. |
| 🟢 Low | App.vue | `createGround()` | **`grassTileTex` scroll direction**: `grassTileTex.offset.y += gameSpeed * 0.15` increments, while `groundTexture.offset.y -= gameSpeed * 0.15` decrements. This means grass scrolls in the opposite direction from the road, which is likely intentional (parallax) but could be a visual bug if not. |
| 🟢 Low | App.vue | `animate()` | **`window.__getSpawnCounts` and `window.__getSpawnDebug`** are set on the global `window` object for testing. These are never cleaned up and could conflict with other code. |
| 🟢 Low | App.vue | `animate()` — `debugKeyTimer` | **Timer leak on rapid debug code entry**: If the user types "DEBU" and then waits >2s, the timer clears the buffer. But if they type "D" again before the timer fires, a new timer is set without clearing the old one. The old timer reference is overwritten, so the old timer still fires and clears the buffer prematurely. |
| 🟢 Low | App.vue | `useAchievements.js` | **`THREE` is used but not imported**: `createFloatingText` callback uses `new THREE.Vector3(0, 2, 0)`, but `useAchievements.js` doesn't import THREE. This works because THREE is a global in the bundle, but it's a fragile dependency. |
| 🟢 Low | App.vue | `useConveyor.js` | **`applyConveyorToPlayer` never called**: The conveyor physics function exists but is never integrated into the animate loop. Stage 3 conveyor mechanics are completely non-functional. |
| 🟢 Low | App.vue | `stages.js` | **Stage 3 `roadType` is `'concrete'` but `useStage.js` checks for `'conveyor'`**: The `advanceStage()` and `setStage()` functions check `stage.roadType === 'conveyor'` to initialize the conveyor, but Stage 3's `roadType` is `'concrete'`. The conveyor system will never activate. |
| 🟢 Low | App.vue | `animate()` | **`comboCount` never resets on game over**: `comboCount` is set to 0 in `triggerGameOver()`, but if the player dies mid-combo, the combo counter display (`comboCount > 1`) may flash briefly before the game-over overlay appears. |
| 🟢 Low | App.vue | `spawnObstacle()` | **Stage 3 obstacle types reference undefined textures**: `stage3Textures.meatball`, `stage3Textures.allenKey`, `stage3Textures.shoppingCart`, `stage3Textures.bookshelfTower`, `stage3Textures.flatpackStack`, `stage3Textures.priceTagBanner`, `stage3Textures.wardrobePortal` are used in `spawnObstacle()` but never loaded in `loadStage3Textures()`. These will be `undefined`, causing `MeshBasicMaterial({ map: undefined })` which renders as a solid color — not a crash but visually broken. |

---

## Top Priority Fixes

### 1. Cancel Animation Frame on Unmount (Critical)
```javascript
let animationFrameId = null;

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  // ... rest of animate
};

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  // ... existing cleanup
});
```

### 2. Dispose WebGL Renderer on Unmount (Critical)
```javascript
onUnmounted(() => {
  // ... existing cleanup
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
  if (composer) composer.dispose();
});
```

### 3. Fix forEach+splice Pattern (Critical)
Replace all `forEach` with `splice` with reverse iteration:
```javascript
for (let i = obstacles.length - 1; i >= 0; i--) {
  const obs = obstacles[i];
  // ... collision logic
  if (shouldRemove) {
    scene.remove(obs.mesh);
    obstacles.splice(i, 1);
  }
}
```

### 4. Fix MediaElementSource Double-Creation (High)
In `useAudio.js`, track whether a source has been created for each audio element:
```javascript
if (!bgmSource) {
  bgmSource = audioCtx.createMediaElementSource(bgmAudio);
  bgmSource.connect(bgmGain);
}
// Don't nullify bgmSource in stopBGM()
```

### 5. Remove Anonymous Event Listeners / Add Cleanup (Medium)
Store references to all anonymous listeners and remove them in `onUnmounted()`.

### 6. Fix Missing Stage 3 Textures (Low)
Add missing texture loads to `loadStage3Textures()`:
```javascript
stage3Textures.meatball = textureLoader.load('assets/stage3/boss_spaghetti_meatball.png');
// ... etc for all referenced textures
```

### 7. Fix Duplicate Refs with useStage (Medium)
Either use `useStage()` composable's refs in `App.vue` or remove the composable import to avoid confusion.

---

*Analysis generated from source code review of `src/` directory only.*