# Stage 2 Cobblestone Texture Bug Report

## Status: ROOT CAUSE IDENTIFIED

## Summary
The Stage 2 cobblestone texture loads and displays correctly **during Stage 2**, but the **material type swap is never reverted** when transitioning back to Stage 1 (or forward to Stage 3), causing visual artifacts.

## Investigation Results

### ✅ Texture File Exists
- `public/assets/road_cobblestone.webp` — 56,838 bytes, present ✅
- `dist/assets/road_cobblestone.webp` — 56,838 bytes, present after build ✅

### ✅ Texture Path is Correct
- Path `'assets/road_cobblestone.webp'` resolves correctly from `public/` directory ✅

### ✅ roadMesh Exists When applyStageVisuals is Called
- `roadMesh` is assigned at line 928 during scene creation
- `applyStageVisuals` is called at line 4192 (reset) and 4387 (init), both after scene creation ✅

### ✅ Texture Offset Animation is Correct
- Line 2635-2636: `cobblestoneTexture.offset.y += gameSpeed * 0.05` only runs when `currentStage.value > 0` ✅
- Line 3795: `groundTexture.offset.y -= gameSpeed * 0.15` still runs but `groundTexture` is no longer on the mesh during Stage 2, so this is harmless ✅

### 🔴 ROOT CAUSE: Material Type Not Restored on Stage Transition

**The critical bug is in `applyStageVisuals()` at lines 254-275 vs 316-319.**

**Stage 2 (cobblestone) — line 265:**
```js
roadMesh.material = new THREE.MeshStandardMaterial({
  map: cobblestoneTexture,
  color: 0xffffff,
  roughness: 0.8,
  metalness: 0.1
});
```
This **replaces** the original `MeshToonMaterial` with a `MeshStandardMaterial`.

**Stage 1 restore (else branch) — line 319:**
```js
roadMesh.material.map = originalGroundTexture;
roadMesh.material.color.set(originalGroundColor);
roadMesh.material.needsUpdate = true;
```
This only changes properties on the **current** material (which is now `MeshStandardMaterial`), but **never restores the original `MeshToonMaterial`**.

**Stage 3 (conveyor) — line 296:**
```js
roadMesh.material.map = stage3Textures.conveyor;
roadMesh.material.color.set(0xffffff);
roadMesh.material.needsUpdate = true;
```
Same problem — sets map on whatever material is currently on the mesh.

### Consequences
1. **Stage 2 → Stage 1 transition**: Road uses `MeshStandardMaterial` instead of `MeshToonMaterial`, losing the toon/cel-shaded look. The road appears differently lit (MeshStandardMaterial responds to lights differently than MeshToonMaterial).
2. **Stage 2 → Stage 3 transition**: Stage 3 sets conveyor texture on `MeshStandardMaterial` instead of `MeshToonMaterial`, causing incorrect lighting/shading.
3. **Stage 2 → Stage 1 → Stage 2 cycle**: Second time entering Stage 2, the `else` branch in `applyStageVisuals` sets `originalGroundTexture` on the `MeshStandardMaterial`, then Stage 2 creates yet another new `MeshStandardMaterial` — material leak.

### Secondary Issue: MeshStandardMaterial May Appear Too Dark
The scene uses `AmbientLight(0xffffff, 0.7)`, `DirectionalLight(0xffd700, 1.0)`, and `HemisphereLight(0x87ceeb, 0x8bc34a, 0.4)`. `MeshStandardMaterial` is PBR-based and responds to lighting differently than `MeshToonMaterial`. With `roughness: 0.8` and `metalness: 0.1`, the cobblestone may appear darker than expected, especially since the directional light has a warm gold tint (`0xffd700`) and the road doesn't receive shadows (`receiveShadow = false`).

## Fix Recommendation

### Option A: Save and Restore Original Material (Recommended)
```js
// At top level, save the original material:
let originalRoadMaterial = null;

// In applyStageVisuals, before any changes:
if (!originalRoadMaterial) {
  originalRoadMaterial = roadMesh.material; // MeshToonMaterial
}

// Stage 2 (cobblestone):
roadMesh.material = new THREE.MeshStandardMaterial({ ... });

// Stage 3 (conveyor):
roadMesh.material = originalRoadMaterial.clone(); // or reuse toon material
roadMesh.material.map = stage3Textures.conveyor;
roadMesh.material.color.set(0xffffff);
roadMesh.material.needsUpdate = true;

// Stage 1 restore (else branch):
roadMesh.material = originalRoadMaterial;
// No need to set map/color since originalRoadMaterial already has them
```

### Option B: Keep MeshToonMaterial for All Stages
Replace the `MeshStandardMaterial` in Stage 2 with `MeshToonMaterial`:
```js
roadMesh.material = new THREE.MeshToonMaterial({
  map: cobblestoneTexture,
  color: 0xffffff,
});
```
This maintains visual consistency but loses the PBR roughness/metalness look for cobblestone.

### Option C: Clone and Swap Materials Properly
Save original material reference and always swap the full material object (not just properties), restoring the original on Stage 1.

## Priority
**High** — Affects visual quality on every stage transition after Stage 2.