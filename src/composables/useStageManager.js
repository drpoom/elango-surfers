/**
 * useStageManager.js — Stage visual transition management composable
 * 
 * Handles road texture transitions, building facade swaps, sky/grass color changes,
 * and BGM switching between stages (medieval vs highway).
 * Also handles bonus portal and environmental events.
 * 
 * Usage:
 *   const { applyStageVisuals, stageVisualState } = useStageManager()
 *   applyStageVisuals({ stageIndex, scene, roadMesh, grassMesh, buildings, STAGES, ... })
 */

import { STAGES } from '../data/stages.js'

// Stage visual state (persistent across calls)
let cobblestoneTexture = null
let originalGroundTexture = null
let originalGroundColor = null

/**
 * Apply stage-specific visuals to the scene
 * @param {Object} params - Parameters object
 * @param {number} params.stageIndex - The stage index to apply visuals for
 * @param {Object} params.scene - Three.js scene object
 * @param {Object} params.roadMesh - Three.js mesh for the road
 * @param {Object} params.grassMesh - Three.js mesh for grass
 * @param {Array} params.buildings - Array of building groups
 * @param {Array} params.STAGES - Stage configuration array
 * @param {Object} params.textureLoader - Three.js texture loader
 * @param {Object} params.THREE - Three.js namespace
 * @param {Object} params.fachwerkTexture - Medieval building texture (ref)
 * @param {Array} params.buildingTextures - Array of building facade textures
 * @param {Array} params.buildingDominantColors - Array of dominant colors for buildings
 * @param {Function} params.switchBGMTrack - Function to switch BGM track
 * @param {Function} params.loadFachwerk - Function to load fachwerk texture
 */
function applyStageVisuals({
  stageIndex,
  scene,
  roadMesh,
  grassMesh,
  buildings,
  STAGES,
  textureLoader,
  THREE,
  fachwerkTexture,
  buildingTextures,
  buildingDominantColors,
  switchBGMTrack,
  loadFachwerk
}) {
  const stage = STAGES[stageIndex]
  if (!roadMesh || !stage) return

  // Save originals on first call
  if (!originalGroundTexture) {
    originalGroundTexture = roadMesh.material.map
    originalGroundColor = roadMesh.material.color.getHex()
  }

  if (stage.roadTexture === 'cobblestone') {
    // Load cobblestone texture if not cached
    if (!cobblestoneTexture) {
      cobblestoneTexture = textureLoader.load('assets/road_cobblestone.webp')
      cobblestoneTexture.wrapS = THREE.RepeatWrapping
      cobblestoneTexture.wrapT = THREE.RepeatWrapping
      cobblestoneTexture.repeat.set(1, 10)
    }
    roadMesh.material.map = cobblestoneTexture
    roadMesh.material.color.set(0x888888)
    roadMesh.material.needsUpdate = true

    // Preload fachwerkhaus texture for medieval buildings
    loadFachwerk()

    // Tint grass darker for medieval
    if (grassMesh) {
      grassMesh.material.color.set(0x2d5a1e)
      grassMesh.material.needsUpdate = true
    }

    // Darker sky
    if (scene && scene.fog) {
      scene.fog.color.set(0x4a5568)
      scene.background = new THREE.Color(0x4a5568)
    }

    // Switch building facades to fachwerkhaus
    if (buildings.length && fachwerkTexture) {
      buildings.forEach(b => {
        const mesh = b.children.find(c => c.isMesh)
        if (mesh && mesh.material && Array.isArray(mesh.material)) {
          // Facade can be at index 0 (left building), 1 (right building), or 4 (front)
          for (const idx of [0, 1, 4]) {
            if (mesh.material[idx].map) { // only swap facade-textured faces
              mesh.material[idx].map = fachwerkTexture
              mesh.material[idx].color.set(0xd4c4a0)
              mesh.material[idx].needsUpdate = true
            }
          }
        }
      })
    }

    // Switch to medieval BGM
    switchBGMTrack('medieval')
  } else {
    // Highway: restore original
    roadMesh.material.map = originalGroundTexture
    roadMesh.material.color.set(originalGroundColor)
    roadMesh.material.needsUpdate = true

    if (grassMesh) {
      grassMesh.material.color.set(0x3a7d2c)
      grassMesh.material.needsUpdate = true
    }

    if (scene && scene.fog) {
      scene.fog.color.set(0x87ceeb)
      scene.background = new THREE.Color(0x87ceeb)
    }

    // Restore building facades to original textures
    if (buildings.length) {
      buildings.forEach((b, i) => {
        const mesh = b.children.find(c => c.isMesh)
        if (mesh && mesh.material && Array.isArray(mesh.material)) {
          const texIdx = i % buildingTextures.length
          // Facade can be at index 0, 1, or 4
          for (const idx of [0, 1, 4]) {
            if (mesh.material[idx].map) {
              mesh.material[idx].map = buildingTextures[texIdx]
              mesh.material[idx].color.set(buildingDominantColors[texIdx])
              mesh.material[idx].needsUpdate = true
            }
          }
        }
      })
    }

    // Switch to highway BGM
    switchBGMTrack('highway')
  }
}

/**
 * Reset stage visual state (for game restart)
 */
function resetStageVisuals() {
  cobblestoneTexture = null
  originalGroundTexture = null
  originalGroundColor = null
}

/**
 * Get current cached textures
 */
function getStageVisualState() {
  return {
    cobblestoneTexture,
    originalGroundTexture,
    originalGroundColor
  }
}

export function useStageManager() {
  return {
    applyStageVisuals,
    resetStageVisuals,
    getStageVisualState
  }
}

export default useStageManager

/**
 * Spawn a bonus portal at a random lane
 * @param {Object} params - Parameters object
 * @param {Object} params.scene - Three.js scene
 * @param {Object} params.state - Bonus portal state object { bonusPortal, inBonusZone }
 * @param {number} params.laneWidth - Lane width from game constants
 * @returns {Object|null} The spawned bonus portal object or null if already exists
 */
export function spawnBonusPortal({ scene, state, laneWidth }) {
  if (state.bonusPortal || state.inBonusZone) return null
  
  const lane = Math.floor(Math.random() * 3)
  const laneX = (lane - 1) * laneWidth
  
  const portalGroup = new window.THREE.Group()
  
  // Golden ring
  const ringGeo = new window.THREE.TorusGeometry(1.5, 0.15, 16, 32)
  const ringMat = new window.THREE.MeshBasicMaterial({ color: 0xffd700 })
  const ring = new window.THREE.Mesh(ringGeo, ringMat)
  ring.name = 'portal-ring'
  portalGroup.add(ring)
  
  // Inner shimmer
  const innerGeo = new window.THREE.CircleGeometry(1.4, 32)
  const innerMat = new window.THREE.MeshBasicMaterial({ 
    color: 0xff00ff, 
    transparent: true, 
    opacity: 0.5, 
    side: window.THREE.DoubleSide 
  })
  const inner = new window.THREE.Mesh(innerGeo, innerMat)
  inner.name = 'portal-inner'
  portalGroup.add(inner)
  
  // Rainbow particles around portal
  const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x0000ff, 0x8800ff, 0xff00ff]
  for (let i = 0; i < 8; i++) {
    const sparkGeo = new window.THREE.SphereGeometry(0.1, 4, 4)
    const sparkMat = new window.THREE.MeshBasicMaterial({ color: colors[i] })
    const spark = new window.THREE.Mesh(sparkGeo, sparkMat)
    const angle = (i / 8) * Math.PI * 2
    spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0)
    spark.name = 'spark-' + i
    portalGroup.add(spark)
  }
  
  portalGroup.position.set(laneX, 1.5, -50)
  portalGroup.userData = { lane }
  scene.add(portalGroup)
  
  const portalObj = { mesh: portalGroup, lane }
  state.bonusPortal = portalObj
  return portalObj
}

/**
 * Update bonus portal animation, collection, and bonus zone timer
 * @param {Object} params - Parameters object
 * @param {number} params.delta - Time delta since last frame
 * @param {Object} params.scene - Three.js scene
 * @param {Object} params.player - Player mesh
 * @param {Object} params.state - Bonus portal state { bonusPortal, inBonusZone, bonusTimer, bonusNoSpawn, savedSubstageState }
 * @param {Object} params.refs - Refs for UI { bonusTimerRef, inBonusZoneRef, gameOverRef, countdownLockedRef }
 * @param {Array} params.bonusCoins - Array of bonus coin objects
 * @param {Object} params.obstacles - Obstacles array
 * @param {Object} params.coins - Coins array
 * @param {number} params.gameSpeed - Current game speed
 * @param {number} params.spawnInterval - Current spawn interval
 * @param {number} params.dayCycleTime - Day cycle time
 * @param {Array} params.buildings - Buildings array
 * @param {Array} params.trees - Trees array
 * @param {Object} params.clock - Three.js clock
 * @param {Object} params.textureLoader - Three.js texture loader
 * @param {Function} params.playSound - Sound playback function
 * @param {Function} params.createParticleEffect - Particle effect function
 * @param {number} params.laneWidth - Lane width
 * @param {Function} params.getCurveX - Curve X function from App.vue
 * @param {Function} params.getSurfaceY - Surface Y function from App.vue
 * @param {Function} params.getSurfaceTilt - Surface tilt function from App.vue
 * @returns {Object} Updated state including gameSpeed if changed
 */
export function updateBonusPortal({
  delta,
  scene,
  player,
  state,
  refs,
  bonusCoins,
  obstacles,
  coins,
  gameSpeed,
  spawnInterval,
  dayCycleTime,
  buildings,
  trees,
  clock,
  textureLoader,
  playSound,
  createParticleEffect,
  laneWidth,
  getCurveX,
  getSurfaceY,
  getSurfaceTilt
}) {
  const THREE = window.THREE
  let newGameSpeed = gameSpeed
  
  // Bonus portal animation & collection
  if (state.bonusPortal) {
    const bonusPortal = state.bonusPortal
    bonusPortal.mesh.position.z += gameSpeed
    // Road curve: absolute position based on lane + curve offset
    bonusPortal.mesh.position.x = ((bonusPortal.lane - 1) * laneWidth) + getCurveX(bonusPortal.mesh.position.z)
    // Curved earth
    bonusPortal.mesh.position.y = (bonusPortal.mesh.baseY || 1.5) + getSurfaceY(bonusPortal.mesh.position.z)
    bonusPortal.mesh.rotation.x = getSurfaceTilt(bonusPortal.mesh.position.z)
    
    // Spin and pulse portal
    const ring = bonusPortal.mesh.getObjectByName('portal-ring')
    if (ring) ring.rotation.z += 0.05
    const inner = bonusPortal.mesh.getObjectByName('portal-inner')
    if (inner) {
      inner.material.color.setHSL((clock.getElapsedTime() * 0.5) % 1, 1, 0.5)
    }
    // Sparkle animation
    for (let i = 0; i < 8; i++) {
      const spark = bonusPortal.mesh.getObjectByName('spark-' + i)
      if (spark) {
        const angle = (i / 8) * Math.PI * 2 + clock.getElapsedTime() * 2
        spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0)
      }
    }
    // Collision check (only during active gameplay)
    if (!refs.gameOverRef.value && !refs.countdownLockedRef.value) {
      const dist = player.position.distanceTo(bonusPortal.mesh.position)
      if (dist < 2.0) {
        // Enter bonus zone!
        state.inBonusZone = true
        state.bonusTimer = 5
        refs.inBonusZoneRef.value = true
        refs.bonusTimerRef.value = 5
        scene.remove(bonusPortal.mesh)
        state.bonusPortal = null
        playSound('powerup')
      }
    }
    // Clean up portal if it passed the player
    if (state.bonusPortal && state.bonusPortal.mesh.position.z > 15) {
      scene.remove(state.bonusPortal.mesh)
      state.bonusPortal = null
    }
  }
  
  // Bonus zone timer
  if (state.inBonusZone) {
    // Hide buildings and trees, change road to rainbow
    if (!scene.userData.bonusEnvActive) {
      // Save all current game state
      state.savedSubstageState = {
        obstacles: obstacles.slice(),
        coins: coins.slice(),
        gameSpeed,
        spawnInterval,
        dayCycleTime,
        buildingVis: buildings.map(b => b.visible),
        treeVis: trees.map(t => t.visible),
      }
      // Remove obstacle and coin meshes from scene, clear arrays
      obstacles.forEach(obs => scene.remove(obs.mesh))
      coins.forEach(coin => scene.remove(coin.mesh))
      obstacles.length = 0
      coins.length = 0
      state.bonusNoSpawn = true
      // Hide buildings and trees
      buildings.forEach(b => b.visible = false)
      trees.forEach(t => t.visible = false)
      
      // Rainbow road with left-to-right gradient
      const road = scene.getObjectByName('road')
      if (road) {
        state.originalRoadMaterial = road.material
        road.material = new THREE.ShaderMaterial({
          transparent: true,
          uniforms: {
            uTime: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              float hue = fract(vUv.x * 1.5 + uTime * 0.15 + vUv.y * 0.3);
              float h = hue * 6.0;
              float c = 0.75;
              float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
              vec3 col;
              if (h < 1.0) col = vec3(c, x, 0.0);
              else if (h < 2.0) col = vec3(x, c, 0.0);
              else if (h < 3.0) col = vec3(0.0, c, x);
              else if (h < 4.0) col = vec3(0.0, x, c);
              else if (h < 5.0) col = vec3(x, 0.0, c);
              else col = vec3(c, 0.0, x);
              col = mix(col, vec3(0.95, 0.95, 1.0), 0.25);
              gl_FragColor = vec4(col, 0.9);
            }
          `,
        })
      }
      // Set fixed bonus speed
      state.savedGameSpeed = gameSpeed
      newGameSpeed = 0.3
      
      // Spawn bonus coins at ground level
      bonusCoins.length = 0
      for (let i = 0; i < 40; i++) {
        const lane = Math.floor(Math.random() * 3) - 1
        const z = -i * 2.5 - 5
        const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16)
        const coinMat = new THREE.MeshToonMaterial({ 
          color: 0xffd700, 
          emissive: 0xffa500, 
          emissiveIntensity: 0.3 
        })
        const coinMesh = new THREE.Mesh(coinGeo, coinMat)
        coinMesh.position.set(lane * laneWidth, 0.5, z)
        coinMesh.rotation.x = Math.PI / 2
        scene.add(coinMesh)
        bonusCoins.push({ mesh: coinMesh, collected: false, baseX: lane * laneWidth })
      }
      scene.userData.bonusEnvActive = true
      
      // Nyan Cat flies across the sky!
      const nyanTex = textureLoader.load('assets/nyan_cat.png')
      const nyanSpriteMat = new THREE.SpriteMaterial({
        map: nyanTex,
        transparent: true,
        depthWrite: false
      })
      const nyanCat = new THREE.Sprite(nyanSpriteMat)
      nyanCat.scale.set(5, 5.5, 1)
      nyanCat.position.set(-30, 10, -20)
      scene.add(nyanCat)
      scene.userData.nyanCat = nyanCat
      scene.userData.nyanCatTime = 0
    }
    
    // Nyan Cat animation
    if (scene.userData.nyanCat) {
      scene.userData.nyanCatTime += delta * 8
      const nyanX = -30 + scene.userData.nyanCatTime
      scene.userData.nyanCat.position.x = nyanX
      scene.userData.nyanCat.position.y = 10 + Math.sin(scene.userData.nyanCatTime * 2) * 0.5
      // Loop: when off-screen right, restart from left
      if (nyanX > 30) {
        scene.userData.nyanCatTime = 0
        scene.userData.nyanCat.position.x = -30
      }
    }
    
    // Rainbow road animation
    const road = scene.getObjectByName('road')
    if (road && road.material && road.material.uniforms) {
      road.material.uniforms.uTime.value = clock.getElapsedTime()
    }
    
    state.bonusTimer -= delta
    refs.bonusTimerRef.value = Math.ceil(state.bonusTimer)
    if (state.bonusTimer <= 0) {
      state.inBonusZone = false
      refs.inBonusZoneRef.value = false
      refs.bonusTimerRef.value = 0
      // Clear bonus coins
      bonusCoins.forEach(bc => scene.remove(bc.mesh))
      bonusCoins.length = 0
      // Remove Nyan Cat
      if (scene.userData.nyanCat) {
        scene.remove(scene.userData.nyanCat)
        scene.userData.nyanCat = null
        scene.userData.nyanCatTime = 0
      }
      // Restore all saved state
      if (state.savedSubstageState) {
        // Restore obstacles
        obstacles.length = 0
        state.savedSubstageState.obstacles.forEach(obs => { 
          scene.add(obs.mesh)
          obstacles.push(obs)
        })
        // Restore coins
        coins.length = 0
        state.savedSubstageState.coins.forEach(coin => { 
          scene.add(coin.mesh)
          coins.push(coin)
        })
        // Restore speed and timing
        newGameSpeed = state.savedSubstageState.savedGameSpeed || state.savedSubstageState.gameSpeed
        // spawnInterval and dayCycleTime restoration happens in App.vue
        // Restore buildings/trees visibility
        buildings.forEach((b, i) => { 
          if (state.savedSubstageState.buildingVis[i] !== undefined) 
            b.visible = state.savedSubstageState.buildingVis[i]
        })
        trees.forEach((t, i) => { 
          if (state.savedSubstageState.treeVis[i] !== undefined) 
            t.visible = state.savedSubstageState.treeVis[i]
        })
        state.savedSubstageState = null
      }
      state.bonusNoSpawn = false
      // Restore road
      const road = scene.getObjectByName('road')
      if (road && state.originalRoadMaterial) {
        road.material.dispose()
        road.material = state.originalRoadMaterial
        state.originalRoadMaterial = null
      }
      scene.userData.bonusEnvActive = false
      // Particle burst ejection
      if (createParticleEffect) {
        createParticleEffect(player.position, 0xff00ff, 30)
        createParticleEffect(player.position, 0x00ffff, 30)
      }
      playSound('achievement')
    }
  }
  
  return { gameSpeed: newGameSpeed }
}

/**
 * Update environmental events (fog, etc.)
 * @param {Object} params - Parameters object
 * @param {number} params.delta - Time delta since last frame
 * @param {Object} params.scene - Three.js scene
 * @param {Object} params.state - Event state { eventTimer, activeEvent, eventDuration, fogDensity }
 * @param {Object} params.refs - Refs for UI { eventAlertTextRef }
 * @returns {void}
 */
export function updateEvents({
  delta,
  scene,
  state,
  refs
}) {
  const THREE = window.THREE
  
  // Event timer - spawn random events
  state.eventTimer += delta
  if (state.eventTimer > 30 + Math.random() * 15 && !state.activeEvent) {
    triggerRandomEvent(state, refs)
    state.eventTimer = 0
  }
  
  // Update active event
  updateEvent(delta, scene, state, refs, THREE)
  
  // Clear event alert text after a delay
  if (refs.eventAlertTextRef.value && !state.activeEvent) {
    if (!scene.userData.eventAlertTimer) scene.userData.eventAlertTimer = 0
    scene.userData.eventAlertTimer += delta
    if (scene.userData.eventAlertTimer > 1.5) {
      refs.eventAlertTextRef.value = ''
      scene.userData.eventAlertTimer = 0
    }
  } else {
    scene.userData.eventAlertTimer = 0
  }
}

/**
 * Trigger a random environmental event
 * @param {Object} state - Event state
 * @param {Object} refs - UI refs
 */
function triggerRandomEvent(state, refs) {
  if (state.activeEvent) return
  state.activeEvent = 'fog'
  state.eventDuration = 6
  state.fogDensity = 2
  refs.eventAlertTextRef.value = '\u{1F32B}\u{FE0F} FOG!'
}

/**
 * Update active event state
 * @param {number} delta - Time delta
 * @param {Object} scene - Three.js scene
 * @param {Object} state - Event state
 * @param {Object} refs - UI refs
 * @param {Object} THREE - Three.js namespace
 */
function updateEvent(delta, scene, state, refs, THREE) {
  // Fog decay
  if (state.activeEvent === 'fog') {
    state.eventDuration -= delta
    state.fogDensity = Math.max(0, state.fogDensity - delta * 0.3)
    if (state.eventDuration <= 0 || state.fogDensity <= 0) {
      state.fogDensity = 0
      state.activeEvent = null
      refs.eventAlertTextRef.value = ''
    }
  }
  
  // Fog effect on scene fog
  if (scene.fog) {
    const baseNear = 20
    const baseFar = 80
    if (state.fogDensity > 0) {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, baseNear * 0.5, delta * 2)
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar * 0.5, delta * 2)
    } else {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, baseNear, delta * 2)
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar, delta * 2)
    }
  }
}
