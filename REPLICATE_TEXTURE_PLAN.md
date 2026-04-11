# Replicate AI Texture Generation Plan

## What Replicate Can Do For Us

Replicate (Flux Schnell/Pro) can generate images from text prompts. For game assets, it can produce:

### ✅ What Works Well
- **Sky/environment panoramas** — wide landscape backgrounds (already doing this)
- **Texture maps** — tileable patterns for ground, walls, surfaces
- **UI elements** — game over screens, title cards, icons
- **Concept art** — reference images for manual recreation

### ⚠️ What's Tricky
- **Sprite sheets** — AI struggles with exact pose consistency across frames
- **Transparent backgrounds** — need post-processing (flood-fill removal)
- **Seamless tiling** — AI doesn't natively tile; needs prompt engineering + manual fix
- **Consistent style** — multiple generations may vary in style
- **Exact geometry matching** — AI won't match capsule/box UV maps perfectly

### ❌ What Doesn't Work
- **Character animation frames** — inconsistent proportions between poses
- **Pixel-perfect UV unwraps** — AI can't target specific mesh UV layouts
- **Small sprite icons** — too much detail loss at small sizes

---

## Asset Categories & Strategy

### Tier 1: Environment (HIGH SUCCESS RATE)
| Asset | Prompt Strategy | Post-Processing | Cost Est. |
|-------|----------------|-----------------|-----------|
| Sky panorama | "colorful cartoon sky, sunny day, no clouds near edges" | Direct use as Three.js background | $0.003 |
| Mountain layer | "cartoon mountain range silhouette, simple, no sky" | Flood-fill white bg removal | $0.003 |
| Ground texture | "seamless cartoon grass texture, bright green, tileable" | May need manual tile fix | $0.003 |
| Road texture | "cartoon road texture, asphalt with lane markings, seamless" | Direct use as texture map | $0.003 |

### Tier 2: Character & Items (MEDIUM SUCCESS RATE)
| Asset | Prompt Strategy | Post-Processing | Cost Est. |
|-------|----------------|-----------------|-----------|
| Character outfit texture | "seamless cartoon jacket texture, orange with yellow stripes, flat design, game texture map" | Apply to torso mesh UV | $0.003 |
| Shield icon | "cartoon shield icon, blue glow, game UI, isolated on transparent" | Flood-fill bg removal | $0.003 |
| Magnet icon | "cartoon magnet icon, purple glow, game UI, isolated on transparent" | Flood-fill bg removal | $0.003 |
| Coin icon | "cartoon gold coin, spinning, game asset, transparent background" | Flood-fill bg removal | $0.003 |

### Tier 3: Effects & UI (MEDIUM-HIGH SUCCESS RATE)
| Asset | Prompt Strategy | Post-Processing | Cost Est. |
|-------|----------------|-----------------|-----------|
| Game over screen | "cartoon game over explosion, dramatic, dark background" | Direct use as overlay | $0.003 |
| Speed lines overlay | "cartoon speed lines, motion blur effect, transparent" | Flood-fill bg removal | $0.003 |
| Particle sprites | "cartoon sparkle burst, 4 frames, white, transparent" | Slice into frames | $0.003 |
| Title screen | "Elango Surfers, cartoon game title, surf theme" | Direct use as menu bg | $0.003 |

### Tier 4: Advanced (LOW SUCCESS RATE — Needs Iteration)
| Asset | Prompt Strategy | Post-Processing | Cost Est. |
|-------|----------------|-----------------|-----------|
| Character run cycle | "cartoon character running, 4-frame sprite sheet, consistent" | Manual frame alignment | $0.01+ |
| Tree billboard | "cartoon tree, side view, game asset, transparent background" | Flood-fill bg removal | $0.003 |
| UFO sprite | "cartoon flying saucer, top-down, game asset, transparent" | Flood-fill bg removal | $0.003 |
| Building texture | "cartoon building facade, colorful, seamless texture" | Apply as building material | $0.003 |

---

## Verification Plan

Every generated asset must pass these checks before integration:

### 1. Visual Quality Check
- [ ] **Resolution**: ≥ 512×512 for textures, ≥ 1024×1024 for panoramas
- [ ] **Style match**: Consistent with existing cartoon aesthetic
- [ ] **No artifacts**: No extra characters, text, or unwanted elements
- [ ] **Color accuracy**: Matches intended palette (orange/yellow/blue theme)

### 2. Technical Check
- [ ] **Transparency**: Background properly removed (flood-fill + edge check)
- [ ] **File size**: < 500KB for PNG (optimize if larger)
- [ ] **Format**: PNG with alpha channel for sprites, JPG for backgrounds
- [ ] **No white borders**: Check 10px edge sample for leftover background pixels

### 3. Integration Check
- [ ] **Load test**: Asset loads without freezing the game
- [ ] **Render test**: Displays correctly on the mesh/sprite
- [ ] **Performance**: No noticeable FPS drop with asset loaded
- [ ] **Fallback**: Procedural version still works if asset fails

### 4. Automated Verification Script
```bash
# Run after generating each asset
python3 verify_asset.py <asset_path> --type <sprite|texture|panorama>
```

Checks:
- Pixel transparency ratio (sprites should have > 30% transparent)
- Edge white pixel count (should be < 1% after bg removal)
- Color variance (should have > 50 unique colors for non-trivial assets)
- Dimensions match expected size

### 5. A/B Comparison
For each asset, keep procedural version as fallback:
```javascript
if (loadedTexture) {
  material.map = loadedTexture;
} else {
  material.color = fallbackColor; // original procedural
}
```

---

## Recommended Next Steps

1. **Generate building facade textures** — high success rate, buildings are flat rectangles perfect for texture mapping
2. **Generate tree billboards** — medium success rate, but simple side-view trees work well
3. **Generate ground/grass textures** — tileable textures for more visual richness
4. **Iterate on character outfit** — try multiple prompts for torso texture wrap

## Cost Estimate
- Per image: ~$0.003 (Flux Schnell)
- Batch of 10 assets: ~$0.03
- Full tier 1-3 with rejections: ~$0.10-0.20
- Monthly updates: ~$0.50 max

## Lessons Learned (v2.5.0-2.5.7)
- ❌ Character sprites (flat 2D) don't work for animated 3D characters
- ❌ Coin/powerup sprites lost the 3D spinning effect
- ❌ Tree sprites didn't show up (async loading + depth issues)
- ✅ Sky panoramas work perfectly as scene backgrounds
- ✅ Mountain parallax layers work great with transparency
- ✅ Texture maps on 3D meshes can work but need proper UV consideration
- ⚠️ Too many concurrent texture loads cause rendering freezes