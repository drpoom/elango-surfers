# Project Tasks: Elango Surfers

## Bug Fix: Obstacle Spawn After Stage Transition (INVESTIGATION NEEDED)

### Root Cause Analysis (by Mickey)
The spawn logic appears correct on paper, but obstacles are NOT spawning after stage transitions. The `willSpawn` condition at line 2720 requires ALL of these to be true:
- `!spawnGraceActive` (gameDuration >= 1.5)
- `(time - lastSpawnTime) > spawnInterval`
- `!bonusNoSpawn`
- `!bossActive.value`
- `!stageTransitioning.value`

**Hypothesis:** The `setTimeout` callback at line 2276-2295 (which sets `gameDuration = 1.5` and `stageTransitioning.value = false`) is **not firing** or is being blocked. This would leave:
- `gameDuration = 0` (from resetStage)
- `spawnGraceActive = true` (because 0 < 1.5)
- **Result:** Spawns blocked FOREVER

**Alternative:** One of the state flags (`bossActive.value`, `stageTransitioning.value`, `bonusNoSpawn`) is stuck `true` after the transition.

### Fix Plan
- [ ] **[Byte] Add Critical Debug Logging**: Add console logs to confirm the setTimeout callback executes:
  - Line 2278 (inside setTimeout): `console.log('[TIMEOUT-FIRED] Setting gameDuration=1.5, stageTransitioning=false')`
  - Line 2281: Log the actual values being set
  - This will confirm if the callback runs or is blocked
- [ ] **[Byte] Add State Flag Logging**: Add a 1-second interval log that prints all `willSpawn` conditions to identify which one is stuck
- [ ] **[Byte] Implement Fix]: Once root cause confirmed, fix the blocking condition
- [ ] **[Scout] Verify Fix]: Play through boss fight, defeat boss, confirm obstacles spawn within 1 second of "GO!"

---

## Bug: Obstacles don't spawn after boss defeat (PREVIOUS FIX ATTEMPT - v4.5.6 - DID NOT WORK)
- [ ] **[Byte] Implement Spawn Fix**: In `src/App.vue`, move the initialization of `gameDuration = 1.5` and `lastSpawnTime = clock.getElapsedTime() - spawnInterval` from the delayed `setTimeout` callback (approx line 2282) to the immediate block where `stageTransitioning.value = false` is set (approx line 2276). This ensures the spawn grace period is bypassed exactly when the game loop resumes.
- [ ] **[Scout] Verify Boss Spawn Fix**: Play through to a boss fight, defeat the boss, and confirm that obstacles spawn immediately after the "GO!" countdown ends.

## Elango Surfers

### Analysis
- [x] **Identify root cause**: The spawn trigger at lines 2283-2284 fails because `lastSpawnTime` is reset to `-2` by `resetStage()` at line 3600, but the re-initialization to trigger immediate spawn happens inside a nested setTimeout (3.5s delay after boss defeat). This creates a timing gap where spawn logic is out of sync.
- [x] **Trace execution flow**: 
  1. Boss defeat triggers `resetStage(true, nextStage)` at line 2257
  2. `resetStage()` resets `lastSpawnTime = -2` at line 3600
  3. 3-2-1-GO countdown starts (3 seconds)
  4. After "GO!" + 500ms delay, `lastSpawnTime` is finally set to `clock.getElapsedTime() - spawnInterval`
  5. During the 3.5s gap, spawn timing is inconsistent

### Implementation
- [ ] **Move spawn initialization**: In `src/App.vue` around line 2276, immediately after setting `stageTransitioning.value = false`, add:
  - `gameDuration = 1.5`
  - `lastSpawnTime = clock.getElapsedTime() - spawnInterval`
- [ ] **Remove duplicate from delayed callback**: Remove or comment out the same lines from the setTimeout callback at lines 2282-2283 to avoid redundancy
- [ ] **Verify invincibility timing**: Ensure the 2-second invincibility shield still applies correctly after the move

### QA
- [ ] **Test spawn timing**: Defeat a boss and verify obstacles spawn immediately after "GO!" countdown ends
- [ ] **Test multiple stages**: Play through 2-3 stage transitions to ensure consistency
- [ ] **Test edge cases**: 
  - Defeat boss with full combo active
  - Defeat boss while powerup is active
  - Quick restart during countdown
- [ ] **Regression test**: Verify normal gameplay spawning still works correctly
- [ ] **Performance check**: Ensure no frame drops during stage transition
