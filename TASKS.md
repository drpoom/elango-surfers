# TASKS.md — Stage 3 Deployment Fix Plan

## Priority 1: Regressions

### TASK-1: Fix Stage 2 boss regression — property name mismatch
- **Issue:** #2 (Stage 2 boss doesn't function as released)
- **Root cause:** `applyStageVisuals()` (line 232) checks `stage.roadTexture === 'cobblestone'` but `stages.js` defines `roadType: 'cobblestone'` (not `roadTexture`). Stage 2 visuals never apply → boss fight environment broken.
- **Assignee:** Byte (code)
- **File:** `src/App.vue` line 232
- **Fix:** Change `stage.roadTexture` → `stage.roadType` in `applyStageVisuals()`
- **Est:** 30s
- **Lines changed:** ~1

### TASK-2: Fix obstacle spawn failure after boss-fight death
- **Issue:** #3 (dying in boss fight → obstacles not spawned)
- **Root cause:** When player dies during boss, `restartGame()` calls `resetStage(false)` which resets `currentStage` to 0. `applyStageVisuals(0)` runs but if Stage 2 cobblestone texture was loaded, the `roadMesh.material.map` may be in bad state. Also, `stage3Textures` are never cleared on restart, and obstacle creation for Stage 3 references `stage3Textures.*` which may be null if textures failed to load asynchronously.
- **Assignee:** Byte (code)
- **Files:** `src/App.vue` lines 4280-4290 (restartGame), lines 498-521 (loadStage3Textures)
- **Fix:** In `restartGame()`, after `resetStage()`, explicitly call `applyStageVisuals(0)` and ensure `roadMesh.material.map = originalGroundTexture`. Add null guards in obstacle creation that uses `stage3Textures`.
- **Est:** 120s
- **Lines changed:** ~15

## Priority 2: Blockers

### TASK-3: Fix Stage 2 texture loading (cobblestone + fachwerk)
- **Issue:** #1 (Stage 2 textures not loading correctly)
- **Root cause:** Same as TASK-1 — `stage.roadTexture` vs `stage.roadType` mismatch. Once TASK-1 is fixed, cobblestone road + fachwerkhaus building textures should load. Additionally verify `loadFachwerk()` (line 487) is called before buildings are iterated (line 250).
- **Assignee:** Byte (code)
- **Depends on:** TASK-1
- **File:** `src/App.vue` lines 232, 487-494
- **Fix:** After fixing property name, add `await` or callback to ensure `fachwerkTexture` is loaded before swapping building facades. Currently `loadFachwerk()` is synchronous `textureLoader.load()` which is async — texture may not be ready when buildings are iterated.
- **Est:** 120s
- **Lines changed:** ~20

### TASK-4: Fix Stage 3 building textures (IKEA-style missing)
- **Issue:** #4 (Stage 3 building textures not loaded correctly)
- **Root cause:** `applyStageVisuals` for Stage 3 (line 267-296) restores buildings to `buildingTextures` (pink/blue/green modern). No IKEA-specific building textures exist in `public/assets/stage3/`. Buildings should show IKEA store facades (blue/yellow).
- **Assignee:** Sashay (art) + Byte (code)
- **Files:** Create `public/assets/stage3/building_ikea_blue.webp`, `public/assets/stage3/building_ikea_yellow.webp`. Update `src/App.vue` lines 276-296 to load and apply Stage 3 building textures instead of restoring modern ones.
- **Est:** 180s (art) + 60s (code)
- **Lines changed:** ~25 (code)

### TASK-5: Fix Stage 3 boss — giantMeatball falls into dragon else-branch
- **Issue:** #7 (Stage 3 boss looks like Stage 2 dragon)
- **Root cause:** `spawnBoss()` (line 2273) only has `if (bossType === 'truck')` and `else` (dragon). `bossType: 'giantMeatball'` from stages.js hits the `else` → dragon mesh created. All boss behavior code (lines 2549-2810) also only checks `truck` vs `else` (dragon).
- **Assignee:** Byte (code) + Sashay (art)
- **Files:** `src/App.vue` lines 2273-2420 (spawnBoss), lines 2549-2810 (boss AI)
- **Fix:** Add `else if (bossType === 'giantMeatball')` branch in `spawnBoss()` with a giant meatball mesh (sphere with texture `stage3Textures.meatball`). Update boss AI to handle meatball behavior (rolling charge instead of flying). Update all `bossType === 'truck' ? ... : ...` ternaries to include meatball case.
- **Est:** 240s (code) + 120s (art for boss sprite if needed)
- **Lines changed:** ~80

## Priority 3: Polish

### TASK-6: Bump version to 5.0.0
- **Issue:** #5 (version not auto-bumped)
- **Root cause:** `VERSION` hardcoded as `'v4.5.13'` at line 150. `package.json` version is `"0.0.0"`. No CI/deploy workflow auto-bumps.
- **Assignee:** Byte (code)
- **Files:** `src/App.vue` line 150, `package.json` line 4
- **Fix:** Set `package.json` version to `"5.0.0"`, update `src/App.vue` line 150 to `const VERSION = 'v5.0.0'`. Optionally import version from package.json via Vite `define`.
- **Est:** 30s
- **Lines changed:** ~2

### TASK-7: Improve Stage 3 texture quality
- **Issue:** #6 (Stage 3 textures underwhelming)
- **Root cause:** Stage 3 obstacle textures in `public/assets/stage3/` may be low-res or placeholder. No Stage 3 sky/environment textures (uses flat `#E8E8E8`). No IKEA-specific road texture (reuses asphalt).
- **Assignee:** Sashay (art)
- **Files:** All `public/assets/stage3/*.webp`, new `public/assets/stage3/road_conveyor.webp`, `public/assets/sky_fluorescent.webp`
- **Fix:** Create higher-quality obstacle textures (meatball, allen key, shopping cart, bookshelf, flatpack, price tag, wardrobe). Add conveyor belt road texture. Add fluorescent ceiling sky texture. Byte updates `applyStageVisuals` to load new road/sky textures.
- **Est:** 300s (art)
- **Lines changed:** ~15 (code)

---

## Dependency Graph
```
TASK-1 ──→ TASK-3
TASK-2 (independent)
TASK-4 (independent, needs art assets)
TASK-5 (independent, needs art assets)
TASK-6 (independent)
TASK-7 (independent, needs art assets)
```

## Execution Order
1. TASK-1 + TASK-2 + TASK-6 (parallel, code-only, fast)
2. TASK-3 (depends on TASK-1)
3. TASK-4 + TASK-5 (need art from Sashay)
4. TASK-7 (polish, last)