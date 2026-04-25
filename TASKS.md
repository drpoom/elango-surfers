# TASKS.md — Elango Surfers Stage 2 & 3 Fixes

## Group A: Stage 3 Visuals & Textures

### A1. Fix Skyscraper Texture White Background
- **Assignee:** Sashay 🎨
- **Files:** `public/assets/stage3/building_glass_steel.png`
- **Spec:** Remove white background from `building_glass_steel.png`. Crop tightly to building edges. Export as PNG with transparency. Keep original resolution.
- **Acceptance:** No white halo/box around buildings when rendered in-game. Texture alpha channel is clean.

### A2. Fix Stage 3 Obstacle Brightness/Colors
- **Assignee:** Sashay 🎨
- **Files:** `public/assets/stage3/obstacle-*.webp`
- **Spec:** All Stage 3 obstacle sprites (`obstacle-allen-key.webp`, `obstacle-bookshelf-tower.webp`, `obstacle-flatpack-stack.webp`, `obstacle-meatball.webp`, `obstacle-metal-beam.webp`, `obstacle-price-tag-banner.webp`, `obstacle-shopping-cart.webp`, `obstacle-wardrobe-portal.webp`) appear overly bright/shiny white. Reduce brightness, desaturate highlights, match tone to Stage 1/2 obstacle textures. Keep recognizability but tone down the glow.
- **Acceptance:** Obstacles look natural (not blown-out white). Visual parity with other stages' obstacle brightness.

### A3. Fix Stage 3 Object Colors (Mesh Materials)
- **Assignee:** Byte ⚡
- **Files:** `src/App.vue` (search for stage3 obstacle material creation, ~line 740-770 area)
- **Spec:** If any obstacle meshes use overly bright `MeshPhongMaterial` with high emissive/light color values, reduce `emissiveIntensity` and adjust `color` to muted tones. Check `MeshPhongMaterial` instances created for stage 3 obstacles — ensure they don't have white/near-white diffuse or emissive values.
- **Acceptance:** In-game stage 3 objects render with normal colors, not shiny bright white.

---

## Group B: Stage 3 Audio

### B1. Replace Stage 3 Unique SFX with Common Crash Sounds
- **Assignee:** Byte ⚡
- **Files:** `src/App.vue` (~line 3686-3698), `src/composables/useAudio.js` (or equivalent audio module)
- **Spec:** Stage 3 currently uses unique IKEA-themed sounds (`crash_wood`, `crash_metal`, `crash_glass`, `portal_whoosh`). Replace the crash-sound mapping so Stage 3 uses the same `crash` sound as other stages (like Stage 1/2 which use `playSound('crash')` at line 2561). Remove or comment out the `crashSounds` lookup for stage 3. Keep `crash_metal` for the metal beam projectile impact if needed, but obstacle collisions should use the common `crash` sound.
- **Acceptance:** Hitting stage 3 obstacles plays the same crash SFX as other stages. No IKEA-specific sounds on collision.

---

## Group C: Stage 2 Road

### C1. Fix Stage 2 Cobblestone Road Texture
- **Assignee:** Byte ⚡
- **Files:** `src/App.vue` (~line 255-285, cobblestone texture loading), `src/data/stages.js` (line 38: `roadType: 'cobblestone'`)
- **Spec:** Stage 2 cobblestone texture isn't rendering correctly. The v4 reference used `assets/road_cobblestone.webp` which exists and looks good. Verify the texture is loading (line 273 already loads it). Check if `repeat` values (line 276: `repeat.set(1, 10)`) need adjustment. Check if the material is being applied correctly and not overridden. Compare with working Stage 1 asphalt texture flow.
- **Acceptance:** Stage 2 road shows clear cobblestone pattern matching v4 reference. No blank/missing texture.

---

## Group D: Stage 3 Boss

### D1. Rework Boss Tentacles to Beholder-Style Surround
- **Assignee:** Byte ⚡
- **Files:** `src/App.vue` (~line 2640-2675, tentacle creation)
- **Spec:** Current: 8 cylinder tentacles positioned radially at radius 1.5, rotated outward with `rotation.x = PI/4`. They look like sticks around the sprite. Desired: Tentacles should visually surround the meatball like a beholder — curving upward/outward from below the meatball, creating a "crown" or "halo" effect. Increase count to 10-12. Position them in a ring below the meatball (y < 2.5), angled upward and outward. Use `rotation` to make them curve away from center. Consider using `ConeGeometry` (wider base) or tapering cylinders for organic look. Keep the rainbow HSL coloring but reduce emissive intensity.
- **Acceptance:** Tentacles form a beholder-like crown around the meatball. Visible from the player's perspective (behind/below the boss). No floating stick appearance.

### D2. Make Boss Projectiles Dodgeable (Fall Away from Player)
- **Assignee:** Byte ⚡
- **Files:** `src/App.vue` (~line 2786-2820, giantMeatball projectile spawning)
- **Spec:** Current: Metal beams target specific lanes (`targetX = (lane - 1) * laneWidth`) making them too accurate. Desired: Beams should fall in a pattern the player can dodge. Changes:
  1. Always leave at least 1 lane clear (never target all 3 lanes in one volley)
  2. Add random X offset (`±1.5` to `±3`) from lane center so beams don't land exactly on lanes
  3. Increase `zSpread` range so beams scatter more along the road
  4. Add a shadow/warning indicator on the ground where beams will land (0.5s before impact)
- **Acceptance:** Player can consistently dodge beams by reading the pattern. At least 1 safe lane per volley. Beams feel like environmental hazards, not homing attacks.

---

## Execution Order

1. **A1, A2** (Sashay) — texture work, can run in parallel
2. **A3, B1, C1** (Byte) — code fixes, independent of each other
3. **D1, D2** (Byte) — boss rework, do D1 before D2 (tentacle refactor first, then projectile tuning)

## Notes
- A2 and A3 may overlap (both address brightness). Sashay fixes textures, Byte fixes material code. Coordinate: if Sashay's texture fix resolves brightness, A3 may be a no-op.
- C1 needs verification first — the cobblestone texture *is* loaded. Bug may be in material application or repeat values.