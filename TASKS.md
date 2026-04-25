# TASKS.md — v5.0.24 Bug Fix Plan

## Bug 1: Settings panel behind pause overlay

**Root cause:** Pause indicator has inline `z-index: 9999` (App.vue line 43), settings panel has `z-index: 30` (game.css line 220). When both are visible, pause renders on top.

**Fix:** In `src/game.css` line 220, change:
```css
z-index: 30;
```
→
```css
z-index: 10001;
```

---

## Bug 2: Cobblestone texture lost on restart

**Root cause:** `originalRoadMaterial` is set to `null` in `resetStage()` (line 4700) **only if** `scene.getObjectByName('road')` is found. But `initGame()` (line 846) creates a brand new scene and road mesh. If `resetStage()` runs before the old scene is torn down, `originalRoadMaterial` gets set to null correctly. However, if `initGame()` is called and creates a new road without clearing `originalRoadMaterial`, the stale reference persists. When Stage 2 is re-entered, `applyStageVisuals(2)` checks `if (!originalRoadMaterial)` at line 314 — but it's not null (holds old reference), so it skips saving the new road's material. The cobblestone texture then gets applied to the new road, but on next reset, `originalRoadMaterial` points to a disposed material from the old scene.

**Fix:** In `initGame()` (around line 846), add after the new scene/road is created:
```js
originalRoadMaterial = null;
```
This ensures the next `applyStageVisuals(2)` call properly captures the new road mesh's material.

---

## Bug 3: Stage 3 skyscrapers should be 3D objects, not sprites

**Root cause:** Stage 3 trees use billboard `Sprite` with `tree_skyscraper.png` texture (App.vue lines 386-399). These are flat 2D sprites, not actual 3D buildings.

**Fix:** In `applyStageVisuals(3)` (around line 386), replace the sprite-swap logic with 3D box mesh creation:
```js
// Instead of swapping sprite texture, replace each tree with a 3D building
trees.forEach((t, i) => {
  const sprite = t.children.find(c => c.isSprite)
  if (sprite) {
    t.remove(sprite)
    sprite.material.dispose()
  }
  // Create 3D skyscraper box
  const height = 12 + Math.random() * 8  // 12-20
  const width = 2 + Math.random()        // 2-3
  const depth = 2 + Math.random()         // 2-3
  const geo = new THREE.BoxGeometry(width, height, depth)
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x88aacc,
    metalness: 0.8,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 1.5
  })
  const building = new THREE.Mesh(geo, mat)
  building.position.set(0, height / 2, 0)
  t.add(building)
})
```
Also update the tree-spawning code (around line 1627) for Stage 3 to spawn 3D buildings instead of sprites, and adjust collision radii (line 534-541) for the wider buildings.

---

## Bug 4: Stage 3 boss beams too close, wrong axis

**Root cause:** `spawnBossProjectile('giantMeatball')` (line 2854) spawns beams at `z = -20 + zSpread` where `zSpread` ranges from -10 to +10, placing beams at z=-30 to z=+10 (some behind, some ahead of player at z=0). Beams are scaled `(1.2, 4.0, 1)` — long on Y (vertical), not Z (forward). Players can't dodge sideways because beams are short on Z.

**Fix:** In `src/App.vue` around line 2870-2874, change:
```js
beam.scale.set(1.2, 4.0, 1) // long vertical beam
// ...
const zSpread = (Math.random() - 0.5) * 20
beam.position.set(targetX, 6 + idx * 1, -20 + zSpread)
```
→
```js
beam.scale.set(1.2, 1.5, 6.0) // long on Z axis for sideways dodging
// ...
const zSpread = -30 + (Math.random() - 0.5) * 10 // beams at z=-25 to z=-35
beam.position.set(targetX, 6 + idx * 1, zSpread)
```
Also rotate the sprite to face along Z axis if needed (sprites face camera by default; consider using a plane mesh rotated to lie flat on Z instead).