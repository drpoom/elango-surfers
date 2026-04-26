# TASKS — Spawning Bug Fix

## Bug
After game restart (`startCountdown`), obstacles/coins/items never spawn.

## Root Cause
`startCountdown()` (~line 5157) does NOT set `gameDuration=1.5` or `lastSpawnTime=clock.getElapsedTime()-spawnInterval` when countdown ends. Compare `startStageCountdown()` (lines 2888-2889) which sets both. Without these, `gameDuration` stays 0, so `spawnGraceActive` (`gameDuration < 1.5`) is always `true`, and the spawn check in the game loop never fires.

`stageTransitioning.value` is properly cleared — `resetStage()` sets it `false` at line 5014, and `restartGame()` calls `resetStage()`.

---

### T1: Fix startCountdown() spawn initialization

**File:** `src/App.vue`  
**Lines:** ~5157 (inside the `count === 0` / "GO!" branch of `startCountdown`)

**Change:** In the `setTimeout` callback after "GO!" (where `countdownActive.value = false` and `countdownLocked = false` are set), add two lines mirroring `startStageCountdown`:

```js
gameDuration = 1.5;
lastSpawnTime = clock.getElapsedTime() - spawnInterval;
```

Place them right after `countdownLocked = false;` (before the invincibility shield block), matching the order in `startStageCountdown`.

**Lines changed:** ~2 (additive only, no deletions)

---

### T2: Add Playwright test — obstacles+coins spawn after game start

**File:** `tests/spawn-after-restart.spec.ts` (new)

**What it tests:**
1. Start the game (click past menu/start)
2. Wait up to 5 seconds
3. Assert that at least 1 obstacle and 1 coin exist in the scene
4. Repeat for all 3 stages (restart after each stage completion)

**Approach:**
- Use Playwright + `page.evaluate` to read Three.js scene children
- Expose a test helper on `window.__testScene` during test mode that returns `{obstacles, coins}` counts
- Keep under 100 lines total

**Lines changed:** ~80 (new file)