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

---

# Stage 3: The Infinite IKEA-pocalypse — Implementation Plan

*Created: 2026-04-21 by Archie*
*Dependency order: Art → Code → Audio → QA*

---

## Phase 1: Art Assets (Sashay)

### T3-01: Conveyor Belt Road Texture
- **Owner:** Sashay
- **File:** `public/textures/stage3/conveyor_belt.png` (512×512, tileable)
- **Spec:** Yellow/blue colorway, white floor markings, animated scroll arrows. Must tile seamlessly on X axis.
- **Lines:** ~1 new file

### T3-02: Swedish Flag Sprite
- **Owner:** Sashay
- **File:** `public/textures/stage3/flag_sweden.png` (128×128, transparent BG)
- **Spec:** Yellow cross on blue, slight wave distortion for parallax layer.

### T3-03: Fluorescent Ceiling Panel Texture
- **Owner:** Sashay
- **File:** `public/textures/stage3/ceiling_panel.png` (256×256, tileable)
- **Spec:** Off-white grid of recessed lights, subtle flicker variant.

### T3-04: Rogue Meatball Obstacle Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/meatball.png` (128×128, 4-frame bounce animation → `meatball_spritesheet.png` 128×512)
- **Spec:** Brown meatball with gravy drip, squash-and-stretch bounce frames.

### T3-05: Assembly Required Pile Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/assembly_pile.png` (256×256)
- **Spec:** Wooden planks + screws + allen keys scattered, looks climbable.

### T3-06: Slippery Floor Sign Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/wet_floor_sign.png` (64×128)
- **Spec:** Yellow A-frame sign, IKEA-style minimalist icon.

### T3-07: Confused Shopper + Cart Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/shopper_cart.png` (128×256, 2-frame wobble)
- **Spec:** Dazed customer pushing oversized blue bag cart.

### T3-08: Floating Allen Key Hazard Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/allen_key.png` (64×64, rotation frames → `allen_key_spritesheet.png` 64×384, 6 frames)
- **Spec:** Silver L-shaped key, spinning like a buzzsaw.

### T3-09: Wardrobe Portal Model
- **Owner:** Sashay
- **File:** `public/sprites/stage3/wardrobe_portal.png` (128×256, open/closed variants)
- **Spec:** PAX-style white wardrobe, glowing interior when open.

### T3-10: Bookshelf Tower Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/bookshelf_tower.png` (128×256, 3-frame wobble → `bookshelf_spritesheet.png` 128×768)
- **Spec:** KALLAX-style shelf stack, wobble → collapse frames.

### T3-11: Price Tag Banner Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/price_tag_banner.png` (256×64)
- **Spec:** Hanging yellow tag with "ÄLG" placeholder text.

### T3-12: Flat-Pack Box Obstacle Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/flatpack_box.png` (64×64 collapsed, 128×128 expanded → `flatpack_spritesheet.png` 128×192, 2 frames)
- **Spec:** Collapsed box that pops open when player is near.

### T3-13: Flat-Pack Behemoth Boss Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/boss_behemoth.png` (256×512, multi-state spritesheet)
- **Spec:** 4 states: assembled, reassembling, instruction-phase (vulnerable), defeated. Each state 256×512 → `boss_behemoth_spritesheet.png` 256×2048.

### T3-14: Instruction Manual Projectile Sprite
- **Owner:** Sashay
- **File:** `public/sprites/stage3/instruction_manual.png` (64×64, spin animation 4 frames → `manual_spritesheet.png` 64×256)
- **Spec:** BILLY booklet, no-words diagram style, spinning in flight.

### T3-15: Showroom Interior Backdrop
- **Owner:** Sashay
- **File:** `public/textures/stage3/showroom_bg.png` (512×512)
- **Spec:** Cozy mock-living-room interior for bonus room entry.

---

## Phase 2: Code Features (Byte)

### T3-20: Stage 3 Config & Registration
- **Owner:** Byte
- **File:** `src/stages/stage3.ts` (new)
- **Spec:** Export `stage3Config` with: `id: 3, name: 'The Infinite IKEA-pocalypse', difficultyMultiplier: 1.8, bgColor: '#006AA7', roadTexture: 'conveyor_belt', obstacles: [...], boss: 'behemoth'`. Register in `src/stages/index.ts`.
- **Lines:** ~80

### T3-21: Conveyor Belt Speed Variation
- **Owner:** Byte
- **File:** `src/App.vue` — modify `updateRoad()` / road scroll logic
- **Spec:** Add `conveyorSpeed` reactive var. Every 5-8s, randomly set speed to 0.6x–1.4x base. Add 10% chance of 2s "reverse" section (negative scroll). Smooth lerp between speeds over 0.5s. Store state in `conveyorState = { speed: number, targetSpeed: number, reverseTimer: number }`.
- **Lines:** ~60

### T3-22: Screen Transform Effects System
- **Owner:** Byte
- **File:** `src/effects/screenEffects.ts` (new)
- **Spec:** Export class `ScreenEffectManager` with methods:
  - `applyFlip()` — CSS `transform: scaleY(-1)` on `#game-container`
  - `applyRotate(deg: 90|180|270)` — CSS `rotate`
  - `applyInvert()` — CSS `filter: invert(1)`
  - `applyMirror()` — CSS `transform: scaleX(-1)`
  - `clearAll()` — remove all transforms
  - Timer: auto-clear after 3s. Triggered every 30s by `InstructionManualGlitch` interval.
- **Lines:** ~90

### T3-23: Instruction Manual Glitch Timer
- **Owner:** Byte
- **File:** `src/App.vue` — in game loop
- **Spec:** Add `glitchTimer` that fires every 30s during Stage 3. Picks random effect from `['flip','rotate','invert','mirror']`. Calls `screenEffects.applyRandom()`. 2s warning flash before effect (screen tint yellow). Store: `glitchState = { lastGlitchTime: number, nextEffect: string, warningActive: boolean }`.
- **Lines:** ~50

### T3-24: Wardrobe Portal Teleportation
- **Owner:** Byte
- **File:** `src/obstacles/wardrobePortal.ts` (new)
- **Spec:** Export `WardrobePortal` class. When player overlaps portal A, teleport to portal B (random offset ±2 lanes). Track portal pairs in `portalPairs: [{a: Vector3, b: Vector3}]`. On teleport: 0.3s fade-to-black, reposition player, 0.3s fade-in. Cooldown 2s per portal.
- **Lines:** ~80

### T3-25: Flat-Pack Box Expand Trigger
- **Owner:** Byte
- **File:** `src/obstacles/flatPackBox.ts` (new)
- **Spec:** Export `FlatPackBox` class. State: `collapsed | expanding | expanded`. When player distance < 2.5 units, trigger expand animation (0.3s scale tween). Expanded state blocks lane. Despawn after 8s.
- **Lines:** ~50

### T3-26: Slippery Floor Physics
- **Owner:** Byte
- **File:** `src/obstacles/slidingSign.ts` (new)
- **Spec:** Export `SlidingSign` class. On contact: set `player.sliding = true` for 1.5s. During slide: player lateral movement speed ×3, no lane-snap, reduced friction. Override lane-change logic in player controller.
- **Lines:** ~60

### T3-27: Return Counter Backward Push
- **Owner:** Byte
- **File:** `src/obstacles/returnCounter.ts` (new)
- **Spec:** Export `ReturnCounter` class. On contact: push player backward 3 units over 0.5s (lerp z-position). Visual: red "RETURN" flash. Can stack with conveyor reverse.
- **Lines:** ~40

### T3-28: Boss — Flat-Pack Behemoth State Machine
- **Owner:** Byte
- **File:** `src/bosses/behemoth.ts` (new)
- **Spec:** Export `BehemothBoss` class extending base boss. States:
  - `ASSEMBLED` — throws instruction manuals (projectile), drops furniture from above (3s interval)
  - `REASSEMBLING` — 2s transition, changes attack pattern, invulnerable
  - `INSTRUCTION_PHASE` — 4s vulnerable window, reduced attacks, takes 3x damage
  - `DEFEATED` — collapse animation, stage clear
  - State cycle: ASSEMBLED(12s) → REASSEMBLING(2s) → INSTRUCTION_PHASE(4s) → repeat. HP: baseHP × 1.8.
- **Data:** `state: enum, stateTimer: number, attackCooldown: number, projectilePool: InstructionManual[]`
- **Lines:** ~100

### T3-29: Boss — Drawer Sock Projectile
- **Owner:** Byte
- **File:** `src/bosses/behemoth.ts` — add to existing class
- **Spec:** During ASSEMBLED state, every 4s open a drawer that shoots 3 socks in a spread pattern. Socks: small projectile, arc trajectory, damage on hit. Reuse existing projectile system.
- **Lines:** ~40

### T3-30: Boss — Furniture Drop Attack
- **Owner:** Byte
- **File:** `src/bosses/behemoth.ts` — add to existing class
- **Spec:** Every 5s during ASSEMBLED, drop a random furniture piece (bookshelf/sofa/lamp) from above. Shadow warning on ground 1s before impact. Damage radius 1.5 lanes.
- **Lines:** ~50

### T3-31: Showroom Shortcut Bonus Rooms
- **Owner:** Byte
- **File:** `src/bonuses/showroomShortcut.ts` (new)
- **Spec:** Wardrobe-like entry triggers 3s bonus room: player auto-collects coins, 30% chance of hidden obstacle (meatball). Room is a flat overlay with `showroom_bg.png`. Exit returns player to same lane.
- **Lines:** ~60

### T3-32: Stage 3 Obstacle Spawner Config
- **Owner:** Byte
- **File:** `src/stages/stage3.ts` — add to existing config
- **Spec:** Define spawn weights: meatball(20%), assembly_pile(15%), wet_sign(10%), shopper(10%), allen_key(10%), wardrobe(8%), bookshelf(8%), price_tag(7%), return_counter(5%), flatpack(7%). Map each to sprite path and class.
- **Lines:** ~50

---

## Phase 3: Audio (Sashay)

### T3-40: Swedish Polka-Pop BGM
- **Owner:** Sashay
- **File:** `public/audio/stage3/bgm_ikea.mp3` (loopable, 120 BPM)
- **Spec:** Accordion lead, upbeat but slightly unsettling. 16-bar loop with 4-bar bridge. Must loop seamlessly.

### T3-41: Intercom Announcement SFX (x3)
- **Owner:** Sashay
- **File:** `public/audio/stage3/sfx_intercom_1.mp3`, `_2.mp3`, `_3.mp3`
- **Spec:** Distorted PA voice: "Customer cleanup in aisle 5", "Special offer in showroom 7B", "The exit does not exist". 2-3s each.

### T3-42: Cash Register Percussion SFX
- **Owner:** Sashay
- **File:** `public/audio/stage3/sfx_cash_register.mp3`
- **Spec:** Short ka-ching, used as coin-collect alternate sound during Stage 3.

### T3-43: Furniture Crash & Assembly SFX
- **Owner:** Sashay
- **File:** `public/audio/stage3/sfx_furniture_crash.mp3`, `sfx_assemble.mp3`
- **Spec:** Crash: wood splinter + thud. Assemble: screw + click. 0.5-1s each.

### T3-44: Portal Whoosh SFX
- **Owner:** Sashay
- **File:** `public/audio/stage3/sfx_portal_whoosh.mp3`
- **Spec:** Swirly dimensional sound, 0.8s, for wardrobe teleport.

### T3-45: Conveyor Belt Hum SFX
- **Owner:** Sashay
- **File:** `public/audio/stage3/sfx_conveyor_hum.mp3` (loopable)
- **Spec:** Low mechanical hum, subtle, 4s seamless loop.

---

## Phase 4: Integration & QA (Byte + Sashay)

### T3-50: Integrate Stage 3 Assets into Build
- **Owner:** Byte
- **File:** `vite.config.ts` / asset pipeline
- **Spec:** Ensure all `public/textures/stage3/*`, `public/sprites/stage3/*`, `public/audio/stage3/*` are bundled and preloaded. Add to asset manifest.
- **Lines:** ~30

### T3-51: Wire Screen Effects to Game Loop
- **Owner:** Byte
- **File:** `src/App.vue`
- **Spec:** Import `ScreenEffectManager`, instantiate on Stage 3 load. Wire `glitchTimer` to `onUpdate()`. Clean up on stage exit.
- **Lines:** ~30

### T3-52: Wire Boss to Stage 3 Flow
- **Owner:** Byte
- **File:** `src/App.vue` — boss spawn logic
- **Spec:** When stage3 reaches boss distance, spawn `BehemothBoss`. Wire defeat to stage clear + transition to Stage 4.
- **Lines:** ~40

### T3-53: QA — Screen Effect Motion Sickness Test
- **Owner:** Sashay
- **Spec:** Play 5 min continuous. Rate discomfort 1-5. If ≥3, increase warning time to 3s and reduce effect duration to 2s.

### T3-54: QA — Portal Fairness Test
- **Owner:** Byte
- **Spec:** 20 portal entries, log destination lane offset. Ensure no teleport into obstacles (add 0.5s invincibility on exit). Verify cooldown works.

### T3-55: QA — Boss Difficulty Tuning
- **Owner:** Byte
- **Spec:** 5 playthroughs, log: time to defeat, deaths, HP remaining. Target: 45-60s fight, 1-2 deaths average. Adjust HP/damage/cooldowns as needed.

### T3-56: QA — Conveyor + Obstacle Interaction Test
- **Owner:** Byte
- **Spec:** Verify reverse conveyor + return counter don't stack into infinite backward push. Test slippery floor + reverse conveyor combo. Ensure player always regains control within 3s.

---

## Dependency Graph

```
T3-01..15 (Art) ──→ T3-20 (Stage Config) ──→ T3-32 (Spawner Config)
                                        ├──→ T3-50 (Asset Integration)
                                        ├──→ T3-51 (Effects Wiring)
                                        └──→ T3-52 (Boss Wiring)

T3-22 (Screen Effects) ──→ T3-23 (Glitch Timer) ──→ T3-51
T3-24 (Portals) ──→ T3-54
T3-25 (Flat-Pack) ──→ T3-32
T3-26 (Sliding) ──→ T3-56
T3-27 (Return Counter) ──→ T3-56
T3-28 (Boss State Machine) ──→ T3-29, T3-30 ──→ T3-52 ──→ T3-55
T3-31 (Showroom) ──→ T3-32

T3-40..45 (Audio) ──→ T3-50

T3-50..52 (Integration) ──→ T3-53..56 (QA)
```
