# Elango Surfers — Refactoring Plan

## Current State

| File | Lines | Status |
|------|-------|--------|
| `src/App.vue` | 3941 | 🔴 WAY over limit |
| `src/game.css` | 302 | ✅ |
| `src/style.css` | 296 | ✅ |
| `src/composables/useAudio.js` | 281 | ✅ |
| `src/composables/useLeaderboard.js` | 224 | ✅ |
| `src/composables/useAchievements.js` | 109 | ✅ |
| `src/composables/useMic.js` | 78 | ✅ |
| `src/composables/useCurve.js` | 49 | ✅ |
| `src/gameConstants.js` | 42 | ✅ |
| `src/main.js` | 5 | ✅ |

**Problem:** App.vue is a 3941-line monolith containing: template, all game state, Three.js scene setup, player model, obstacle/coin/powerup spawning, boss logic, the 1200-line `animate()` loop, input handling, stage management, and UI logic.

## Refactoring Strategy

Extract App.vue into ~10 focused composables + smaller Vue components. Each task extracts one composable/component, leaving App.vue as a thin orchestrator (~400 lines).

### Dependency Order
Tasks are ordered so each can be done independently without breaking the game. Each task:
1. Extracts code into a new file
2. Imports it in App.vue
3. Verifies game still works

---

## Tasks

### Task 1: Extract `usePlayer.js` composable
**What:** Extract player model creation (lines ~561-700) and player state (position, lane, jumping, sliding, flying, skin).
**Exports:** `createPlayer(scene)`, `updatePlayerAnimation(delta, time)`, player state refs.
**Size:** ~200 lines
**Test:** Unit test that createPlayer returns a THREE.Group with expected children; animation updates don't throw.

### Task 2: Extract `useObstacles.js` composable
**What:** Extract `spawnObstacle()`, `spawnFloatingObstacle()`, obstacle pool management, obstacle update logic from animate().
**Exports:** `spawnObstacle(type, lane, z)`, `updateObstacles(delta, speed)`, `getCollidables()`, `cleanupObstacles()`.
**Size:** ~400 lines
**Test:** Unit test spawning obstacles returns meshes at correct positions; update moves them; collision shapes exist.

### Task 3: Extract `useCoins.js` composable
**What:** Extract `spawnCoin()`, coin pool, coin animation/collection logic from animate().
**Exports:** `spawnCoin(lane, z)`, `updateCoins(delta, speed, playerPos)`, `collectCoin(coin)`, `cleanupCoins()`.
**Size:** ~150 lines
**Test:** Spawn creates mesh; collect triggers score callback; update animates rotation.

### Task 4: Extract `usePowerups.js` composable
**What:** Extract `spawnPowerup()`, `activatePowerup()`, `deactivatePowerup()`, powerup state and timer logic.
**Exports:** `spawnPowerup(lane, z)`, `activatePowerup(type)`, `deactivatePowerup()`, powerup state refs.
**Size:** ~200 lines
**Test:** Activate sets correct state; deactivate resets; timer counts down.

### Task 5: Extract `useBoss.js` composable
**What:** Extract `spawnBoss()`, `spawnBossProjectile()`, boss health, boss AI update from animate().
**Exports:** `spawnBoss(type)`, `updateBoss(delta)`, `damageBoss(amount)`, boss state refs.
**Size:** ~350 lines
**Test:** Spawn creates boss mesh; damage reduces health; projectiles spawn and move.

### Task 6: Extract `useScene.js` composable
**What:** Extract Three.js scene/camera/renderer/composer setup, lighting, `createGround()`, `createLaneMarkers()`, `createBackgroundElements()`, `createStars()`, `createClouds()`, `updateDayNightCycle()`.
**Exports:** `initScene(container)`, `getScene()`, `getCamera()`, `getComposer()`, `updateDayNight(delta, stageProgress)`, scene refs.
**Size:** ~500 lines
**Test:** initScene returns valid scene/camera/composer; day-night updates change light values.

### Task 7: Extract `useInput.js` composable
**What:** Extract keyboard, touch, swipe, tilt handlers: `handleKeyDown()`, `handleSwipe()`, `handleTouchStart/End()`, `handleDeviceOrientation()`, tilt calibration.
**Exports:** `initInput({ onJump, onSlide, onLeft, onRight, onRestart })`, `cleanupInput()`, tilt/mic toggle refs.
**Size:** ~250 lines
**Test:** Key events trigger correct callbacks; swipe detection works; tilt calibration averages correctly.

### Task 8: Extract `useStageManager.js` composable
**What:** Extract stage progression, `applyStageVisuals()`, `resetStage()`, `updateRoadCurve()`, stage/boss state refs, `triggerRandomEvent()`, `updateEvent()`, `spawnBonusPortal()`.
**Exports:** `initStages(scene)`, `updateStage(delta, score)`, `resetStage()`, stage state refs.
**Size:** ~400 lines
**Test:** Stage transitions change visuals; road curve updates smoothly; events trigger correctly.

### Task 9: Extract `useEffects.js` composable
**What:** Extract `createParticleEffect()`, `createFloatingText()`, `triggerGameOver()` (visual shake part), vignette/glow logic.
**Exports:** `createParticleEffect(pos, color, count)`, `createFloatingText(text, pos, color)`, `triggerGameOverShake()`, `updateEffects(delta)`.
**Size:** ~150 lines
**Test:** Particle creation returns expected mesh count; floating text positions correctly.

### Task 10: Extract `useAnimate.js` composable (the big one)
**What:** Extract the `animate()` loop into a composable that orchestrates all the other composables' update functions. This is done LAST because it depends on all others.
**Exports:** `startGameLoop()`, `stopGameLoop()`.
**Size:** ~300 lines (down from 1200 — most logic lives in the other composables now)
**Test:** Game loop calls each sub-update in correct order; delta is passed correctly; game over stops loop.

### Task 11: Extract Vue UI components from template
**What:** Extract template sections into small Vue components:
- `GameHUD.vue` — score, highscore, combo, stage indicator, powerup indicator
- `GameOverScreen.vue` — game over overlay, leaderboard, name entry
- `SettingsPanel.vue` — settings panel with skins, debug stage, toggles
- `BossBar.vue` — boss health bar
**Size:** Each ~100-200 lines
**Test:** Each renders correctly with mock props; events emit correctly.

### Task 12: Split CSS into component-scoped styles
**What:** Move CSS from `game.css`/`style.css` into `<style scoped>` blocks of each Vue component. Keep shared/animation CSS in a minimal `global.css`.
**Size:** ~100 lines per component
**Test:** Visual regression check — game looks identical after refactor.

---

## Post-Refactoring Target Structure

```
src/
├── App.vue                  (~400 lines — thin orchestrator)
├── main.js
├── gameConstants.js
├── global.css               (shared animations/base)
├── composables/
│   ├── usePlayer.js         (~200)
│   ├── useObstacles.js      (~400)
│   ├── useCoins.js          (~150)
│   ├── usePowerups.js       (~200)
│   ├── useBoss.js           (~350)
│   ├── useScene.js          (~500)
│   ├── useInput.js          (~250)
│   ├── useStageManager.js   (~400)
│   ├── useEffects.js        (~150)
│   ├── useAnimate.js        (~300)
│   ├── useAudio.js          (existing)
│   ├── useLeaderboard.js    (existing)
│   ├── useAchievements.js   (existing)
│   ├── useMic.js            (existing)
│   └── useCurve.js          (existing)
└── components/
    ├── GameHUD.vue          (~150)
    ├── GameOverScreen.vue   (~200)
    ├── SettingsPanel.vue    (~200)
    └── BossBar.vue          (~100)
```

## Testing Strategy

1. **Per-task:** Write unit tests for the extracted composable before/during extraction
2. **After each task:** Manual smoke test — launch game, play 30s, verify no regression
3. **After all tasks:** Full integration test — play through all stages, bosses, powerups
4. **Tooling:** Use Vitest (already compatible with Vite) for unit tests

## Constraints Checklist
- [ ] Game works after each task
- [ ] No breaking changes to public APIs
- [ ] Each file < 1000 lines
- [ ] Each composable has single responsibility
- [ ] Each composable testable in isolation