# Project Tasks: Elango Surfers

## Bug: Obstacles don't spawn after boss defeat
- [ ] **[Byte] Implement Spawn Fix**: In `src/App.vue`, move the initialization of `gameDuration = 1.5` and `lastSpawnTime = clock.getElapsedTime() - spawnInterval` from the delayed `setTimeout` callback (approx line 2282) to the immediate block where `stageTransitioning.value = false` is set (approx line 2276). This ensures the spawn grace period is bypassed exactly when the game loop resumes.
- [ ] **[Scout] Verify Boss Spawn Fix**: Play through to a boss fight, defeat the boss, and confirm that obstacles spawn immediately after the "GO!" countdown.

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
