# TASKS.md — Bug Fix Plan for elango-surfers/src/App.vue

All tasks target `src/App.vue` unless noted. Each task < 100 lines changed.

## Dependency Order

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

---

### T1. Fix cobblestone scroll stage check (Bug #2)

**File:** `src/App.vue`  
**Lines:** 3294–3295  
**Problem:** `if (cobblestoneTexture && currentStage.value === 1)` — `currentStage` is 0-indexed, so `=== 1` IS Medieval (Stage 2). This is actually **correct**. However, verify the scroll actually fires by checking if `cobblestoneTexture` is non-null at this point (it may not be if the texture load callback hasn't fired yet).  
**Fix:** No index change needed. Instead, add a fallback: if cobblestone is the active road type but `cobblestoneTexture` is still null, skip gracefully. Add a comment clarifying 0-indexing.  
**Change:** ~5 lines

---

### T2. Fix fachwerk texture application to buildings (Bug #1)

**File:** `src/App.vue`  
**Lines:** 317–323, 927–955  
**Problem:** `loadFachwerk()` uses a legacy wrapper with `setTimeout` retry (`tryApplyFachwerk`). If `buildings` array is empty at load time, the retry polls every 100ms but may race with building creation. Also, `applyFachwerkToBuildings()` only swaps `map` on material indices `[0, 1, 4]` — if building geometry doesn't have materials at those indices, nothing happens.  
**Fix:**
1. In `applyStageVisuals` (line ~317), after `loadFachwerk` callback, also call `applyFachwerkToBuildings()` directly if `buildings.length > 0 && fachwerkTexture` (remove the setTimeout retry loop).
2. In `applyFachwerkToBuildings` (line ~940), add a safety check: `if (mesh.material[idx])` before accessing `.map`.
3. Add a call to `applyFachwerkToBuildings()` in the building creation path (wherever buildings are spawned during Stage 2) so newly created buildings also get the fachwerk texture.
**Change:** ~25 lines

---

### T3. Add rose/flower decorations for Stage 2 (Bug #3)

**File:** `src/App.vue`  
**Lines:** New code in `applyStageVisuals` (~line 340, after the fachwerk block)  
**Problem:** No rose or flower decoration logic exists for Stage 2 (Medieval Path).  
**Fix:** Add a `createMedievalFlowers()` function that spawns small red/pink rose sprites or meshes alongside the road edges (similar to how trees are spawned). Call it from `applyStageVisuals` when `stage.roadType === 'cobblestone'`. Store flower references in a `medievalFlowers` array and scroll them with `gameSpeed` in the animate loop (near line 4272 where trees scroll). Clean up on stage transition.  
**Change:** ~60 lines

---

### T4. Fix skyscraper material sharing in Stage 3 (Bug #4)

**File:** `src/App.vue`  
**Lines:** 383–425  
**Problem:** All skyscrapers share a single `skyscraperMat` instance. When Three.js needs per-object material updates (e.g., different opacity, color variation), shared material causes all buildings to change identically. Also, tree sprite removal works but the `existingBuilding` check uses `c.isMesh` which could match other meshes.  
**Fix:**
1. Clone `skyscraperMat` per skyscraper: `const mat = skyscraperMat.clone()`.
2. Add slight per-building variation (random tint, slight opacity difference).
3. Tag skyscraper meshes with `building.userData.isSkyscraper = true` and check that in the removal logic instead of `c.isMesh`.
**Change:** ~15 lines

---

### T5. Fix Stage 3 building facade texture application (Bug #5)

**File:** `src/App.vue`  
**Lines:** 363–377  
**Problem:** The Stage 3 building facade code iterates `buildings` and swaps material maps at indices `[0, 1, 4]`, same pattern as fachwerk. If buildings are created after `applyStageVisuals` runs, they won't get the glass/steel texture. Also, `stage3Textures.building` is loaded via `textureLoader.load` (async) but applied synchronously — may be null on first call.  
**Fix:**
1. Add a callback to `textureLoader.load` for `building_glass_steel.png` that re-applies to buildings once loaded.
2. Add a `applyStage3FacadeToBuildings()` helper (similar to `applyFachwerkToBuildings`) and call it both from `applyStageVisuals` and from the building creation path during Stage 3.
3. Add safety `if (mesh.material[idx])` checks.
**Change:** ~40 lines

---

### T6. Unify road texture scrolling with gameSpeed (Bug #6)

**File:** `src/App.vue`  
**Lines:** 3294–3295, 4398–4408  
**Problem:** Ground texture scrolls at `gameSpeed * 0.15` (line 4398), cobblestone at `gameSpeed * 0.15` (line 3295), Stage 3 road/pavement at `gameSpeed * 0.15` (lines 4405–4408). All use the same multiplier, so they're already proportional to gameSpeed. However, the **direction** is inconsistent: ground uses `-= gameSpeed * 0.15` (offset.y decreases), cobblestone uses `+= gameSpeed * 0.15` (increases), and Stage 3 also uses `+=`. This causes cobblestone and Stage 3 roads to scroll in the **opposite direction** from the ground.  
**Fix:** Make all road textures scroll in the same direction as `groundTexture` (use `-=` for offset.y). Change cobblestone (line 3295) and Stage 3 road/pavement (lines 4405–4408) to use `-=` instead of `+=`.  
**Change:** ~3 lines

---

### T7. Refactor gameSpeed with base/multiplier/clamp system (Bug #7)

**File:** `src/App.vue`  
**Lines:** 693 (gameSpeed init), 3570–3571 (speed lerp), 4625 (coldDrink activate), 4653 (coldDrink deactivate)  
**Problem:** `gameSpeed` is a single mutable value. Cold drink sets `gameSpeed *= 0.6` on activate and `gameSpeed = 0.25` on deactivate (hardcoded). The lerp at line 3570 continuously drives `gameSpeed` toward `targetSpeed`, which fights with the cold drink reduction. When cold drink deactivates, speed jumps to 0.25 regardless of difficulty progression.  
**Fix:**
1. Add constants at module scope (~line 693):
   ```js
   const SPEED_MIN = 0.15;
   const SPEED_MAX = 1.2;
   let baseGameSpeed = 0.25; // increases over time
   let speedMultiplier = 1.0; // powerups modify this
   ```
2. Change the lerp block (~line 3570) to update `baseGameSpeed` only:
   ```js
   const targetBase = 0.25 * difficultyMultiplier * STAGES[currentStage.value].difficultyMultiplier;
   baseGameSpeed = THREE.MathUtils.lerp(baseGameSpeed, targetBase, Math.min(realDelta * 0.6, 0.01));
   gameSpeed = THREE.MathUtils.clamp(baseGameSpeed * speedMultiplier, SPEED_MIN, SPEED_MAX);
   ```
3. Cold drink activate (~line 4625): `speedMultiplier = 0.6;` (instead of `gameSpeed *= 0.6`)
4. Cold drink deactivate (~line 4653): `speedMultiplier = 1.0;` (instead of `gameSpeed = 0.25`)
5. Reset `speedMultiplier = 1.0` and `baseGameSpeed = 0.25` in game reset function.
**Change:** ~20 lines

---

## Summary

| Task | Bug | Lines Changed | Risk |
|------|-----|---------------|------|
| T1 | #2 Cobblestone stage check | ~5 | Low |
| T2 | #1 Fachwerk texture | ~25 | Medium |
| T3 | #3 Roses missing | ~60 | Medium |
| T4 | #4 Skyscraper shared material | ~15 | Low |
| T5 | #5 Stage 3 facade texture | ~40 | Medium |
| T6 | #6 Road scroll direction | ~3 | Low |
| T7 | #7 Speed clamp system | ~20 | High |