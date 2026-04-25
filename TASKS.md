# TASKS.md — elango-surfers v5.0.25 Fix Plan

## Bug 1: Cobblestone road lost on restart

**Root Cause:** `originalRoadMaterial` is set to `null` in `initGame()` (line ~1153), which runs BEFORE `applyStageVisuals()`. On first play, `applyStageVisuals()` saves the road material into `originalRoadMaterial` and then applies cobblestone. On restart, `initGame()` nulls `originalRoadMaterial`, then `applyStageVisuals()` tries to save it again — but by that point `roadMesh.material` is already the cobblestone material (restored from the restart cleanup at line 2613-2616, which sets `roadMesh.material = originalRoadMaterial` then nulls it). The race is: restart cleanup restores + nulls → initGame nulls again (redundant) → applyStageVisuals saves the now-restored material → applies cobblestone. This *should* work, BUT the issue is that `cobblestoneTexture` is a module-level variable that persists across restarts, and its `.image` may be stale or the texture callback may not re-fire since it's already loaded.

**Actually:** The real problem is likely that `cobblestoneTexture` is cached (line 292: `if (!cobblestoneTexture)`), so on restart the texture already exists and `image` is ready, BUT `originalRoadMaterial` gets saved as the cobblestone-modified material (not the original) because the restart cleanup at line 2613 restores the original, then line 1153 nulls it, then `applyStageVisuals` re-saves whatever `roadMesh.material` is at that moment. If the road mesh material was already swapped to cobblestone before restart cleanup runs, the restore works. But if `originalRoadMaterial` was null when cleanup ran (line 2613: `if (roadGO && originalRoadMaterial)`), the restore is skipped and the road stays on cobblestone material — then `initGame` nulls it, then `applyStageVisuals` saves the cobblestone material as "original", losing the true original forever.

**Fix:**
1. Move `originalRoadMaterial = null` OUT of `initGame()` — it should only be nulled after successful restoration in the restart cleanup (line 2616 already does this).
2. In `applyStageVisuals()`, save `originalRoadMaterial` BEFORE any texture swap, and guard with a check that the current material is NOT already the cobblestone-modified one.
3. Add a `cobblestoneApplied` flag to prevent double-saving.

**Test case** (add to `tests/essential.spec.ts`):
```js
test('cobblestone road persists after restart', async () => {
  // Start game, advance to stage 2, verify cobblestone
  // Trigger game over + restart
  // Verify cobblestone texture is still applied on road mesh
});
```

**Lines to change:** ~1153, ~314-317, ~2613-2616

---

## Bug 2: Boss tentacles need Z-plane halo + wiggling animation

**Root Cause:** Tentacles are positioned in a flat ring around the meatball center (line 2752: all at `baseY = 2.5`, spread via `cos/sin` in XZ). They form a horizontal halo, not a Z-plane halo. The animation (line 3111-3121) does `rotation.z += 0.05` (spin) and `rotation.x = PI/4 + sin(...)` (tilt wave), but there's no Z-plane (vertical plane) halo ring and no sinusoidal wiggle that looks like Beholder tentacles.

**Fix:**
1. **Z-plane halo:** Position tentacles in a VERTICAL ring (like a halo/aurora) around the meatball. Change positioning so tentacles spread in the YZ plane (or XY plane) instead of XZ:
   ```js
   // Vertical halo: spread around Y axis in the XY plane
   const angle = (i / tentacleCount) * Math.PI * 2;
   const radius = 2.5;
   tentacle.position.set(
     Math.cos(angle) * radius,  // X spread
     baseY + Math.sin(angle) * radius,  // Y spread (vertical)
     0  // Z = center
   );
   // Tilt tentacles to point outward from center
   tentacle.rotation.z = angle;
   ```
2. **Sinusoidal wiggle:** Replace the simple `rotation.z += 0.05` spin with per-tentacle sinusoidal motion:
   ```js
   boss.userData.tentacles.forEach((tentacle, i) => {
     const t = Date.now() * 0.003;
     const baseAngle = tentacle.userData.baseAngle;
     // Wiggle: oscillate tilt angle
     tentacle.rotation.x = Math.sin(t + i * 0.5) * 0.4;
     tentacle.rotation.z = baseAngle + Math.sin(t * 1.5 + i * 0.7) * 0.3;
     // Keep color cycling
     const hue = (Date.now() * 0.0001 + i * 0.125) % 1;
     tentacle.material.color.setHSL(hue, 1, 0.5);
     tentacle.material.emissive.setHSL(hue, 1, 0.3);
   });
   ```
3. **Glow effect:** Add a `PointLight` or emissive ring mesh at the halo plane for the Z-plane glow.

**Lines to change:** ~2748-2758 (positioning), ~3111-3121 (animation)

---

## Bug 3: Skyscrapers appear floated

**Root Cause:** In `applyStageVisuals()` (line 416), skyscraper mesh is positioned at `building.position.set(0, height / 2, 0)` — this puts the bottom edge at Y=0 relative to the parent tree group. But the parent tree group for Stage 3 is positioned at `getSurfaceY(treeZ)` (line 1692), which should be ~0 for flat ground. However, the tree group may have a `baseY` from the tree creation code that adds extra Y offset. Looking at line 1692: `tree.position.set(side * (6 + Math.random() * 6), getSurfaceY(treeZ), treeZ)` — no extra baseY for stage 3, unlike stage 1/2 which set `treeBaseY`. So the tree group Y = surfaceY ≈ 0, and the building bottom should be at Y=0. 

**But:** The `skyscraper-glass.png` texture likely has transparent padding at the bottom (common with sprite textures), making the visible building appear to start higher than the mesh bottom. Also, `transparent: true, opacity: 0.9` on the material means the bottom face is nearly invisible, creating a floating illusion.

**Fix:**
1. Crop transparent padding from `public/assets/stage3/skyscraper-glass.png` (or adjust UV mapping to skip bottom padding).
2. Alternatively, offset the building Y position downward: `building.position.set(0, height / 2 - PADDING_OFFSET, 0)` where PADDING_OFFSET ≈ 0.5-1.0.
3. Test with `getSurfaceY()` to ensure buildings sit flush on the ground plane.

**Lines to change:** ~416, and/or the texture file `public/assets/stage3/skyscraper-glass.png`

---

## Bug 4: Stage 3 has old IKEA relic objects

**Root Cause:** Stage 3 obstacle types (line 1772-1776) include `allenKey`, `shoppingCart`, `bookshelfTower`, `flatpackStack`, `priceTagBanner`, `wardrobePortal` — all IKEA-themed leftovers. The "bright white round objects" are likely `meatball` (Swedish meatball, IKEA theme), and "small rectangle objects" are `allenKey` or `flatpackStack`.

**Fix:**
1. Replace IKEA obstacle types with urban/city-appropriate obstacles:
   - `meatball` → `trafficCone` or `fireHydrant` (round, red/orange)
   - `allenKey` → `metalBeam` (already has texture: `obstacle-metal-beam.webp`)
   - `shoppingCart` → `dumpster` or `taxiCab`
   - `bookshelfTower` → `scaffoldTower`
   - `flatpackStack` → `concreteBarrier`
   - `priceTagBanner` → `billboard`
   - `wardrobePortal` → `elevatorDoor`
2. Update line 1772-1776 obstacle type arrays.
3. Add new obstacle mesh builders in the `switch(obsType)` block (after line 2168).
4. Load new textures in `loadStage3Textures()` (line ~810+).
5. Remove unused IKEA texture loads.

**Lines to change:** ~810-842, ~1772-1776, ~2168+ (new cases)

---

## Feature 5: Replace fruit with Mario-style brick box

**Root Cause:** Fruit obstacle (line 1797-1812) is a colored sphere with stem and leaf. It rotates (line 3650: `obs.obstacleType === 'fruit' ? 0.05 : 0`).

**Fix:**
1. Replace the `fruit` case in the obstacle switch block with a brick box:
   ```js
   case 'fruit': {
     group = new THREE.Group();
     // Brown brick box (Mario-style)
     const brickGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
     const brickMat = new THREE.MeshToonMaterial({ color: 0x8B4513 }); // saddle brown
     const brick = new THREE.Mesh(brickGeo, brickMat);
     brick.castShadow = false;
     group.add(brick);
     // Add mortar lines (lighter brown)
     const lineMat = new THREE.MeshToonMaterial({ color: 0xD2691E });
     // Horizontal mortar lines
     for (let ly = -0.6; ly <= 0.6; ly += 0.6) {
       const lineGeo = new THREE.BoxGeometry(1.82, 0.04, 1.82);
       const line = new THREE.Mesh(lineGeo, lineMat);
       line.position.y = ly;
       group.add(line);
     }
     // Question mark block variant (alternating)
     // ... optional: add "?" texture on one face
     group.position.set(laneX, 0.9, -50);
     break;
   }
   ```
2. Remove fruit rotation: change line 3650 to not rotate `fruit` type:
   ```js
   obs.mesh.rotation.y += obs.type === 'floating' ? 0.08 : 0;  // remove fruit rotation
   ```
3. Keep the `fruit` type name internally (or rename to `brickBox` and update all references in stage obstacle arrays).

**Lines to change:** ~1797-1812, ~3650

---

## Priority Order

1. **Bug 1** (cobblestone) — regression, affects core gameplay loop
2. **Bug 4** (IKEA relics) — visual inconsistency, easy fix
3. **Feature 5** (brick box) — simple replacement
4. **Bug 3** (floating skyscrapers) — visual, needs texture investigation
5. **Bug 2** (tentacle animation) — boss polish, most complex