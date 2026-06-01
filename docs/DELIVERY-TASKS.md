# Elango Delivery — Ultra-Atomic Task List

All tasks target `elango-surfers` project at `/home/poomk/.openclaw/workspace/elango-surfers/`.
Each task: exact file, exact function/class, max 20 lines, no exploration, <60s execution.

---

## Phase 1: NPCs (Chickens & Pedestrians)

### 1.1 — Chicken NPC Data Model
- **File:** `src/data/npcs.js` (NEW)
- **Function:** `export const CHICKEN_CONFIG`
- **Lines:** 8
- **Code:** Export config object: `{ modelType: 'chicken', speed: 0.02, wanderRadius: 2, spawnWeight: 0.15, colors: [0xffffff, 0x8B4513, 0x2F4F2F], hitRadius: 0.4, scoreBonus: 10 }`

### 1.2 — Pedestrian NPC Data Model
- **File:** `src/data/npcs.js` (APPEND)
- **Function:** `export const PEDESTRIAN_CONFIG`
- **Lines:** 8
- **Code:** Export config object: `{ modelType: 'pedestrian', speed: 0.015, wanderRadius: 1.5, spawnWeight: 0.10, colors: [0xff6b35, 0x4ecdc4, 0xffd93d], hitRadius: 0.5, scoreBonus: 5 }`

### 1.3 — NPC Composable: State & Spawning
- **File:** `src/composables/useNPCs.js` (NEW)
- **Function:** `export function useNPCs({ scene, getSurfaceY, gameSpeed })`
- **Lines:** 18
- **Code:** Create `npcs` array ref, `spawnNPC(type, laneX)` function that creates a THREE.Group, adds body geometry (SphereGeometry for chicken, CapsuleGeometry for pedestrian), sets `userData.npcType`, `userData.wanderAngle`, `userData.wanderSpeed`, pushes to `npcs`, returns group. Export `npcs`, `spawnNPC`, `updateNPCs`.

### 1.4 — NPC Composable: Wander AI
- **File:** `src/composables/useNPCs.js` (APPEND inside useNPCs)
- **Function:** `function updateNPCs(delta)`
- **Lines:** 15
- **Code:** Loop `npcs` array, increment `userData.wanderAngle += userData.wanderSpeed * delta`, set `npc.position.x = npc.userData.baseX + Math.sin(npc.userData.wanderAngle) * npc.userData.wanderRadius`, move `npc.position.z += gameSpeed * 0.6`, remove if `npc.position.z > 5`.

### 1.5 — NPC Composable: Collision & Score
- **File:** `src/composables/useNPCs.js` (APPEND inside useNPCs)
- **Function:** `function checkNPCCollision(playerPos)`
- **Lines:** 12
- **Code:** Loop `npcs`, compute distance to `playerPos`, if `< hitRadius + 0.5`, add `scoreBonus` to score, create floating text "BONUS!", remove NPC from scene and array, return `{ hit: true, bonus: npc.userData.scoreBonus }`.

### 1.6 — Integrate NPC Spawning into Animate Loop
- **File:** `src/App.vue`
- **Function:** `animate()` (line ~4109, after `spawnPowerup()`)
- **Lines:** 4
- **Code:** Add `if (Math.random() < 0.08) { const type = Math.random() < 0.6 ? 'chicken' : 'pedestrian'; npcSpawn(type); }` where `npcSpawn` is destructured from `useNPCs`.

### 1.7 — Integrate NPC Update & Collision in Animate Loop
- **File:** `src/App.vue`
- **Function:** `animate()` (line ~4150, inside obstacle update loop)
- **Lines:** 4
- **Code:** Add `updateNPCs(delta)` call and `const npcHit = checkNPCCollision(player.position)` check; if `npcHit.hit`, increment `score.value += npcHit.bonus`.

### 1.8 — NPC Cleanup on Stage Reset
- **File:** `src/App.vue`
- **Function:** `resetStage()` (line ~5117)
- **Lines:** 4
- **Code:** Add `npcs.forEach(n => scene.remove(n)); npcs.length = 0;` after the existing obstacles/coins cleanup block.

---

## Phase 2: Interactive Objects (Barrels & Traffic Lights)

### 2.1 — Interactive Barrel: Breakable Flag
- **File:** `src/App.vue`
- **Function:** `spawnObstacle()` case `'barrel'` (line ~2411)
- **Lines:** 3
- **Code:** Add `group.userData.breakable = true` and `group.userData.health = 1` after `group.userData = { driftDir... }`. Set `hitWidth = 1.0` (smaller, since breakable).

### 2.2 — Interactive Barrel: Break Animation
- **File:** `src/App.vue`
- **Function:** Collision block inside `animate()` (line ~4200, after `hitGroundObs` check)
- **Lines:** 12
- **Code:** Before `triggerGameOver()`, add: `if (obs.mesh.userData.breakable && obs.mesh.userData.health > 0) { obs.mesh.userData.health--; if (obs.mesh.userData.health <= 0) { createParticleEffect(obs.mesh.position, 0x336699, 8); scene.remove(obs.mesh); obstacles.splice(index, 1); score.value += 15; createFloatingText('SMASH! +15', obs.mesh.position.clone(), '#ff6b35'); continue; } }`

### 2.3 — Traffic Light Data Model
- **File:** `src/data/interactiveObjects.js` (NEW)
- **Function:** `export const TRAFFIC_LIGHT_CONFIG`
- **Lines:** 6
- **Code:** Export `{ modelType: 'trafficLight', poleHeight: 4, lightRadius: 0.15, redDuration: 3, greenDuration: 3, yellowDuration: 1, spawnWeight: 0.05 }`

### 2.4 — Traffic Light 3D Model in spawnObstacle
- **File:** `src/App.vue`
- **Function:** `spawnObstacle()` (add new case after `case 'billboard'`)
- **Lines:** 18
- **Code:** `case 'trafficLight': { group = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 8), new THREE.MeshToonMaterial({color:0x333333})); pole.position.y = 2; group.add(pole); const housing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.3), new THREE.MeshToonMaterial({color:0x222222})); housing.position.y = 4.2; group.add(housing); const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8), new THREE.MeshBasicMaterial({color:0xff0000})); redLight.position.set(0,4.55,0.16); redLight.name='red-light'; group.add(redLight); const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8), new THREE.MeshBasicMaterial({color:0x00ff00})); greenLight.position.set(0,3.85,0.16); greenLight.name='green-light'; group.add(greenLight); group.position.set(laneX,0,-50); group.userData={isTrafficLight:true, phase:'red', timer:0}; break; }`

### 2.5 — Traffic Light Phase Animation
- **File:** `src/App.vue`
- **Function:** `animate()` obstacle update loop (line ~4150)
- **Lines:** 14
- **Code:** Add inside the loop: `if (obs.mesh.userData.isTrafficLight) { obs.mesh.userData.timer += delta; const cfg = TRAFFIC_LIGHT_CONFIG; if (obs.mesh.userData.phase === 'red' && obs.mesh.userData.timer > cfg.redDuration) { obs.mesh.userData.phase = 'green'; obs.mesh.userData.timer = 0; } else if (obs.mesh.userData.phase === 'green' && obs.mesh.userData.timer > cfg.greenDuration) { obs.mesh.userData.phase = 'yellow'; obs.mesh.userData.timer = 0; } else if (obs.mesh.userData.phase === 'yellow' && obs.mesh.userData.timer > cfg.yellowDuration) { obs.mesh.userData.phase = 'red'; obs.mesh.userData.timer = 0; } const rl = obs.mesh.getObjectByName('red-light'); const gl = obs.mesh.getObjectByName('green-light'); if (rl) rl.material.color.setHex(obs.mesh.userData.phase==='red'?0xff0000:0x330000); if (gl) gl.material.color.setHex(obs.mesh.userData.phase==='green'?0x00ff00:0x003300); }`

### 2.6 — Traffic Light: Red Phase Blocks Lane
- **File:** `src/App.vue`
- **Function:** Collision block inside `animate()` (line ~4200)
- **Lines:** 8
- **Code:** Add before `triggerGameOver()`: `if (obs.mesh.userData.isTrafficLight && obs.mesh.userData.phase === 'green') { continue; }` — traffic lights only kill on red/yellow phase. On green, player passes through safely.

### 2.7 — Add trafficLight to Stage 3 Spawn Types
- **File:** `src/App.vue`
- **Function:** `spawnObstacle()` Stage 3 types array (line ~2118)
- **Lines:** 1
- **Code:** Add `'trafficLight'` to the `types` array for Stage 3.

---

## Phase 3: Delivery Missions

### 3.1 — Delivery Mission Data Model
- **File:** `src/data/missions.js` (NEW)
- **Function:** `export const MISSION_TYPES`
- **Lines:** 10
- **Code:** Export array: `[{ id: 'express', name: 'Express Delivery', timeLimit: 15, coinReward: 50, spawnWeight: 0.4 }, { id: 'fragile', name: 'Fragile Cargo', timeLimit: 20, coinReward: 80, spawnWeight: 0.3, noJump: true }, { id: 'bulk', name: 'Bulk Shipment', timeLimit: 25, coinReward: 100, spawnWeight: 0.3 }]`

### 3.2 — Delivery Package 3D Model
- **File:** `src/App.vue`
- **Function:** `spawnPowerup()` (add new type case, line ~2854)
- **Lines:** 12
- **Code:** Add `case 'delivery': { const pkg = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6), new THREE.MeshToonMaterial({color:0xD2691E})); pkg.add(box); const tape = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.1,0.62), new THREE.MeshToonMaterial({color:0xFFD700})); tape.position.y=0.1; pkg.add(tape); pkg.position.set(laneX, 1.0, -50); pkg.userData.isDelivery=true; return { group: pkg, lane, extraData: { type: 'delivery' } }; }`

### 3.3 — Delivery Mission Composable
- **File:** `src/composables/useDelivery.js` (NEW)
- **Function:** `export function useDelivery({ score, createFloatingText, playSound })`
- **Lines:** 18
- **Code:** Create `activeMission` ref (null), `missionTimer` ref (0), `startMission(missionType)` that sets `activeMission` to mission object with `startTime = Date.now()`, `timeLimit`, `coinReward`. Export `activeMission`, `missionTimer`, `startMission`, `updateMission(delta)` that decrements timer and checks expiry, `completeMission()` that adds reward to score and shows floating text.

### 3.4 — Delivery Package Pickup Logic
- **File:** `src/App.vue`
- **Function:** Coin/powerup collision block in `animate()` (line ~4300)
- **Lines:** 8
- **Code:** After coin collection, add: `if (coin.mesh.userData.isDelivery && !activeMission.value) { const mType = MISSION_TYPES[Math.floor(Math.random() * MISSION_TYPES.length)]; startMission(mType); createFloatingText('📦 ' + mType.name + '!', coin.mesh.position.clone(), '#FFD700'); }` — picking up a package starts a delivery mission.

### 3.5 — Delivery Mission Timer HUD
- **File:** `src/App.vue`
- **Function:** Template `#game-info` div (line ~10)
- **Lines:** 3
- **Code:** Add `<div id="delivery-mission" v-if="activeMission">📦 {{ activeMission.name }} ⏱ {{ Math.ceil(missionTimer) }}s</div>` after the `#stage-indicator` div.

### 3.6 — Delivery Mission Timer CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 5
- **Code:** Add `#delivery-mission { font-size: 0.9rem; color: #FFD700; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); animation: pulse 1s ease-in-out infinite; }`

### 3.7 — Delivery Mission Update in Animate Loop
- **File:** `src/App.vue`
- **Function:** `animate()` (after powerup update, line ~4100)
- **Lines:** 5
- **Code:** Add `if (activeMission.value) { const result = updateMission(delta); if (result === 'expired') { createFloatingText('❌ DELIVERY FAILED!', player.position.clone(), '#ff4444'); } else if (result === 'complete') { completeMission(); } }`

### 3.8 — Delivery Mission: Complete on Distance
- **File:** `src/composables/useDelivery.js` (APPEND inside useDelivery)
- **Function:** `function updateMission(delta)`
- **Lines:** 8
- **Code:** Decrement `missionTimer.value -= delta`. If `missionTimer <= 0`, set `activeMission.value = null`, return `'expired'`. If player collects 5 coins during mission (track via `coinsCollected` counter), return `'complete'`.

### 3.9 — Delivery Package Spawn in Animate Loop
- **File:** `src/App.vue`
- **Function:** `animate()` spawn block (line ~4110)
- **Lines:** 2
- **Code:** Add `if (Math.random() < 0.02 && !activeMission) spawnDeliveryPackage();` where `spawnDeliveryPackage` calls `spawnWithOverlapCheck` with type `'delivery'`.

### 3.10 — Reset Mission on Game Over
- **File:** `src/App.vue`
- **Function:** `triggerGameOver()` (line ~3053)
- **Lines:** 2
- **Code:** Add `activeMission.value = null; missionTimer.value = 0;` at the start of `triggerGameOver`.

---

## Phase 4: Full HUD

### 4.1 — HUD: Speed Indicator
- **File:** `src/App.vue`
- **Function:** Template `#game-info` div (line ~10)
- **Lines:** 2
- **Code:** Add `<div id="speed-indicator">⚡ {{ Math.round(gameSpeed * 100) }}%</div>` after `#highscore` div.

### 4.2 — HUD: Speed Indicator CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 4
- **Code:** Add `#speed-indicator { font-size: 0.75rem; color: #00bfff; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }`

### 4.3 — HUD: Coin Counter with Icon
- **File:** `src/App.vue`
- **Function:** Template `#game-info` div (line ~10)
- **Lines:** 2
- **Code:** Add `<div id="coin-count">🪙 {{ coinCount }}</div>` — add `const coinCount = ref(0)` in script, increment in coin collection block.

### 4.4 — HUD: Coin Counter CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 4
- **Code:** Add `#coin-count { font-size: 0.85rem; color: #FFD700; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }`

### 4.5 — HUD: Distance Traveled
- **File:** `src/App.vue`
- **Function:** Template `#game-info` div (line ~10)
- **Lines:** 2
- **Code:** Add `<div id="distance">📏 {{ Math.floor(distanceTraveled) }}m</div>` — add `let distanceTraveled = 0` in script, increment `distanceTraveled += gameSpeed * delta * 10` in animate loop.

### 4.6 — HUD: Distance CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 4
- **Code:** Add `#distance { font-size: 0.75rem; color: #aaa; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }`

### 4.7 — HUD: Mission Progress Bar
- **File:** `src/App.vue`
- **Function:** Template `#game-info` div (after delivery-mission div)
- **Lines:** 3
- **Code:** Add `<div id="mission-progress" v-if="activeMission"><div class="progress-track"><div class="progress-fill" :style="{ width: (missionTimer / activeMission.timeLimit * 100) + '%' }"></div></div></div>`

### 4.8 — HUD: Mission Progress Bar CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 6
- **Code:** Add `.progress-track { width: 100%; height: 4px; background: #333; border-radius: 2px; margin-top: 2px; } .progress-fill { height: 100%; background: linear-gradient(90deg, #FFD700, #ff6b35); border-radius: 2px; transition: width 0.3s; }`

### 4.9 — HUD: NPC Counter
- **File:** `src/App.vue`
- **Function:** Template `#game-info` div (line ~10)
- **Lines:** 2
- **Code:** Add `<div id="npc-counter" v-if="npcs.length > 0">🐔 {{ npcs.length }}</div>` — shows active NPC count.

### 4.10 — HUD: NPC Counter CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 4
- **Code:** Add `#npc-counter { font-size: 0.7rem; color: #a8e6cf; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }`

---

## Phase 5: Mobile Controls

### 5.1 — Virtual D-Pad Container
- **File:** `src/App.vue`
- **Function:** Template (add after `#instructions` div, line ~95)
- **Lines:** 6
- **Code:** Add `<div id="dpad" v-if="isMobile && !gameOver"><button class="dpad-btn dpad-up" @touchstart.prevent="handleJump">↑</button><button class="dpad-btn dpad-left" @touchstart.prevent="currentLane = Math.max(0, currentLane - 1)">←</button><button class="dpad-btn dpad-right" @touchstart.prevent="currentLane = Math.min(2, currentLane + 1)">→</button><button class="dpad-btn dpad-down" @touchstart.prevent="handleSlide">↓</button></div>`

### 5.2 — D-Pad CSS
- **File:** `src/game.css`
- **Function:** (append)
- **Lines:** 18
- **Code:** Add `#dpad { position: absolute; bottom: 20px; right: 20px; display: grid; grid-template-areas: '. up .' 'left . right' '. down .'; grid-template-columns: 50px 50px 50px; grid-template-rows: 50px 50px 50px; gap: 4px; z-index: 15; } .dpad-btn { width: 50px; height: 50px; border-radius: 12px; background: rgba(255,255,255,0.25); border: 2px solid rgba(255,255,255,0.4); color: white; font-size: 20px; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; } .dpad-up { grid-area: up; } .dpad-left { grid-area: left; } .dpad-right { grid-area: right; } .dpad-down { grid-area: down; }`

### 5.3 — Mobile: Larger Touch Targets for Top Buttons
- **File:** `src/game.css`
- **Function:** `#settings-btn, #mute-btn, #tilt-btn, #mic-btn` selector
- **Lines:** 2
- **Code:** Add `@media (max-width: 768px) { #settings-btn, #mute-btn, #tilt-btn, #mic-btn { width: 48px; height: 48px; font-size: 1.4rem; } }`

### 5.4 — Mobile: Swipe Sensitivity Tuning
- **File:** `src/App.vue`
- **Function:** `handleTouchEnd()` (line ~4810)
- **Lines:** 3
- **Code:** Change `minSwipeDistance` usage to `const swipeThreshold = isMobile ? 35 : minSwipeDistance;` and use `swipeThreshold` in the distance comparison.

### 5.5 — Mobile: Prevent Double-Tap Zoom
- **File:** `src/App.vue`
- **Function:** Template `#game-container` div (line ~2)
- **Lines:** 1
- **Code:** Add `@touchstart.prevent` attribute to `#game-container` div element (already has `touch-action: none` in CSS, this adds JS-level prevention).

### 5.6 — Mobile: Safe Area Insets
- **File:** `src/game.css`
- **Function:** `#game-container` selector
- **Lines:** 3
- **Code:** Add `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);` to `#game-container`.

### 5.7 — Mobile: D-Pad Haptic Feedback
- **File:** `src/App.vue`
- **Function:** D-pad button handlers (from task 5.1)
- **Lines:** 4
- **Code:** Wrap each dpad handler: add `if (navigator.vibrate) navigator.vibrate(10);` before the action in each `@touchstart` handler.

---

## Phase 6: Playwright Tests

### 6.1 — Test: NPC Chickens Spawn
- **File:** `tests/npc.spec.ts` (NEW)
- **Function:** `test('chickens spawn during gameplay')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, wait 5s, evaluate `window.__getSpawnCounts()` or check DOM for `#npc-counter`, assert NPC count > 0 after sufficient gameplay time.

### 6.2 — Test: NPC Pedestrians Spawn
- **File:** `tests/npc.spec.ts` (APPEND)
- **Function:** `test('pedestrians appear on road')`
- **Lines:** 12
- **Code:** Navigate, dismiss loading, wait 8s, evaluate page to check for pedestrian-type NPCs in the scene, assert at least one exists.

### 6.3 — Test: Breakable Barrel Interaction
- **File:** `tests/interactive-objects.spec.ts` (NEW)
- **Function:** `test('barrels break on collision instead of game over')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, use `page.evaluate` to set `window.__forceNextObstacle = 'barrel'`, wait for barrel spawn, move player to collide, verify game continues (no game-over screen), check score increased by 15.

### 6.4 — Test: Traffic Light Phase Changes
- **File:** `tests/interactive-objects.spec.ts` (APPEND)
- **Function:** `test('traffic lights cycle through red/green/yellow')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, use `page.evaluate` to find a traffic light in obstacles, check `userData.phase` is one of `['red','green','yellow']`, wait 4s, re-check phase has changed.

### 6.5 — Test: Traffic Light Red Kills, Green Safe
- **File:** `tests/interactive-objects.spec.ts` (APPEND)
- **Function:** `test('traffic light only kills on red phase')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, force spawn traffic light, set phase to 'green', collide player, assert no game over. Then set phase to 'red', collide, assert game over.

### 6.6 — Test: Delivery Mission Start
- **File:** `tests/delivery.spec.ts` (NEW)
- **Function:** `test('picking up delivery package starts mission')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, force spawn delivery package, move player to collect it, check `#delivery-mission` element appears in DOM, verify mission timer is displayed.

### 6.7 — Test: Delivery Mission Timer Expires
- **File:** `tests/delivery.spec.ts` (APPEND)
- **Function:** `test('delivery mission expires when timer runs out')`
- **Lines:** 12
- **Code:** Navigate, dismiss loading, start a mission with 3s time limit, wait 4s, check `#delivery-mission` element is gone, verify "DELIVERY FAILED" text appeared.

### 6.8 — Test: Delivery Mission Complete
- **File:** `tests/delivery.spec.ts` (APPEND)
- **Function:** `test('delivery mission completes on coin collection')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, start mission, collect 5 coins rapidly (force coin spawns near player), check mission completes, verify score increased by reward amount.

### 6.9 — Test: HUD Elements Visible
- **File:** `tests/hud.spec.ts` (NEW)
- **Function:** `test('all HUD elements are visible during gameplay')`
- **Lines:** 15
- **Code:** Navigate, dismiss loading, wait 3s, check `#score`, `#highscore`, `#speed-indicator`, `#coin-count`, `#distance`, `#stage-indicator` are all visible and have content.

### 6.10 — Test: Mobile D-Pad Visible on Mobile Viewport
- **File:** `tests/hud.spec.ts` (APPEND)
- **Function:** `test('d-pad controls appear on mobile viewport')`
- **Lines:** 12
- **Code:** Resize viewport to 375x812 (iPhone), navigate, dismiss loading, check `#dpad` element is visible, verify 4 buttons exist.

### 6.11 — Test: D-Pad Hidden on Desktop
- **File:** `tests/hud.spec.ts` (APPEND)
- **Function:** `test('d-pad controls hidden on desktop viewport')`
- **Lines:** 8
- **Code:** Resize viewport to 1280x800, navigate, dismiss loading, check `#dpad` element is not visible or not present.

### 6.12 — Test: NPC Collision Gives Bonus
- **File:** `tests/npc.spec.ts` (APPEND)
- **Function:** `test('running into chicken gives score bonus')`
- **Lines:** 12
- **Code:** Navigate, dismiss loading, force spawn chicken NPC at player lane, move player to collide, check score increased by 10, verify no game over.

---

## Summary

| Phase | Tasks | Est. Total |
|-------|-------|-------------|
| 1. NPCs | 8 | ~8 min |
| 2. Interactive Objects | 7 | ~7 min |
| 3. Delivery Missions | 10 | ~10 min |
| 4. Full HUD | 10 | ~10 min |
| 5. Mobile Controls | 7 | ~7 min |
| 6. Playwright Tests | 12 | ~12 min |
| **Total** | **54** | **~54 min** |

Each task is self-contained, specifies exact file + function, ≤20 lines of code, and executable in <60 seconds.