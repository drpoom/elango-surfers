import * as THREE from 'three';

/**
 * Spawn a boss mesh (truck or dragon) based on bossType
 * @param {Object} params - Parameters object
 * @param {THREE.Scene} params.scene - Scene to add boss to
 * @param {string} params.bossType - Type of boss ('truck' or 'dragon')
 * @param {THREE.Group|null} params.currentBoss - Current boss reference (to remove if exists)
 * @returns {THREE.Group} The created boss group
 */
export function spawnBoss({ scene, bossType, currentBoss }) {
  // Remove existing boss if present
  if (currentBoss) {
    scene.remove(currentBoss);
  }
  
  const group = new THREE.Group()
  group.name = 'boss'
  
  if (bossType === 'truck') {
    // Truck boss — big red box with headlights
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 5),
      new THREE.MeshPhongMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.2 })
    )
    body.position.y = 1.5
    group.add(body)
    // Cab
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshPhongMaterial({ color: 0xcc1111 })
    )
    cab.position.set(0, 3, 1)
    group.add(cab)
    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.2, 6, 6)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff88 })
    const hl = new THREE.Mesh(lightGeo, lightMat)
    hl.position.set(-0.8, 1.5, 2.5)
    group.add(hl)
    const hr = new THREE.Mesh(lightGeo, lightMat)
    hr.position.set(0.8, 1.5, 2.5)
    group.add(hr)
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8)
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
    for (const [x, z] of [[-1.6, 1.5], [1.6, 1.5], [-1.6, -1.5], [1.6, -1.5]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat)
      w.rotation.z = Math.PI / 2
      w.position.set(x, 0.4, z)
      group.add(w)
    }
  } else {
    // Dragon boss — detailed polygon dragon
    const dMat = new THREE.MeshPhongMaterial({ color: 0x9933ff, emissive: 0x4400aa, emissiveIntensity: 0.25 })
    const dMatDark = new THREE.MeshPhongMaterial({ color: 0x6622aa, emissive: 0x330066, emissiveIntensity: 0.2 })
    const dMatBelly = new THREE.MeshPhongMaterial({ color: 0xcc88ff, emissive: 0x8844cc, emissiveIntensity: 0.15 })
    // Body — elongated ellipsoid
    const bodyGeo = new THREE.SphereGeometry(1, 8, 6)
    bodyGeo.scale(1.2, 0.8, 2.0)
    const body = new THREE.Mesh(bodyGeo, dMat)
    body.position.y = 0
    group.add(body)
    // Belly — slightly protruding underside
    const bellyGeo = new THREE.SphereGeometry(0.7, 6, 4)
    bellyGeo.scale(0.9, 0.6, 1.8)
    const belly = new THREE.Mesh(bellyGeo, dMatBelly)
    belly.position.set(0, -0.3, 0.1)
    group.add(belly)
    // Head — sphere + snout
    const headGeo = new THREE.SphereGeometry(0.6, 8, 6)
    const head = new THREE.Mesh(headGeo, dMat)
    head.position.set(0, 0.5, 2.2)
    group.add(head)
    // Snout
    const snoutGeo = new THREE.ConeGeometry(0.35, 1.0, 6)
    const snout = new THREE.Mesh(snoutGeo, dMat)
    snout.rotation.x = -Math.PI / 2
    snout.position.set(0, 0.3, 3.0)
    group.add(snout)
    // Eyes — glowing
    const eyeGeo = new THREE.SphereGeometry(0.12, 6, 6)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
    const le = new THREE.Mesh(eyeGeo, eyeMat)
    le.position.set(-0.25, 0.7, 2.7)
    group.add(le)
    const re = new THREE.Mesh(eyeGeo, eyeMat)
    re.position.set(0.25, 0.7, 2.7)
    group.add(re)
    // Horns
    const hornGeo = new THREE.ConeGeometry(0.1, 0.8, 5)
    const hornMat = new THREE.MeshPhongMaterial({ color: 0xddcc88 })
    const lh = new THREE.Mesh(hornGeo, hornMat)
    lh.position.set(-0.3, 1.0, 2.1)
    lh.rotation.z = 0.4
    group.add(lh)
    const rh = new THREE.Mesh(hornGeo, hornMat)
    rh.position.set(0.3, 1.0, 2.1)
    rh.rotation.z = -0.4
    group.add(rh)
    // Wings — large bat-like (3 segments each)
    const wingMat = new THREE.MeshPhongMaterial({ color: 0x7722cc, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    // Left wing — 3 triangular flaps
    for (let s = 0; s < 3; s++) {
      const wGeo = new THREE.BufferGeometry()
      const angle = -0.3 - s * 0.3
      const len = 2.5 - s * 0.5
      const wVerts = new Float32Array([0,0,0, -len, 0.8+s*0.3, -0.3+s*0.2, -len*0.6, -0.2, 0.2+s*0.1])
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3))
      wGeo.computeVertexNormals()
      const wMesh = new THREE.Mesh(wGeo, wingMat)
      wMesh.position.set(-0.8, 0.3, -0.5)
      group.add(wMesh)
    }
    // Right wing
    for (let s = 0; s < 3; s++) {
      const wGeo = new THREE.BufferGeometry()
      const len = 2.5 - s * 0.5
      const wVerts = new Float32Array([0,0,0, len, 0.8+s*0.3, -0.3+s*0.2, len*0.6, -0.2, 0.2+s*0.1])
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3))
      wGeo.computeVertexNormals()
      const wMesh = new THREE.Mesh(wGeo, wingMat)
      wMesh.position.set(0.8, 0.3, -0.5)
      group.add(wMesh)
    }
    // Tail — chain of 5 spheres
    for (let t = 0; t < 5; t++) {
      const tGeo = new THREE.SphereGeometry(0.3 - t * 0.04, 6, 4)
      const tMesh = new THREE.Mesh(tGeo, dMatDark)
      tMesh.position.set(0, -0.1 + Math.sin(t*0.5)*0.2, -1.2 - t * 0.6)
      group.add(tMesh)
    }
    // Tail tip — spike
    const tipGeo = new THREE.ConeGeometry(0.15, 0.5, 4)
    const tip = new THREE.Mesh(tipGeo, hornMat)
    tip.rotation.x = Math.PI / 2
    tip.position.set(0, -0.1, -4.4)
    group.add(tip)
    // Legs — 4 stubby
    const legGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 5)
    for (const [x, z] of [[-0.6, 0.8], [0.6, 0.8], [-0.5, -0.5], [0.5, -0.5]]) {
      const leg = new THREE.Mesh(legGeo, dMatDark)
      leg.position.set(x, -0.7, z)
      group.add(leg)
    }
  }
  
  group.position.set(0, bossType === 'truck' ? 0 : 5, -36)
  scene.add(group)
  return group
}

/**
 * Spawn boss projectile (truck charge or dragon fireballs)
 * @param {Object} params - Parameters object
 * @param {string} params.type - Type of projectile ('truck' or 'dragon')
 * @param {THREE.Group} params.boss - Boss group reference
 * @param {Object} params.state - Game state object (bossCharging, bossChargeTimer, etc.)
 * @param {Function} params.playSFX - Sound effect player function
 * @param {Function} params.createFloatingText - Floating text creator function
 * @param {THREE.Scene} params.scene - Scene to add projectiles to
 * @param {Array} params.bossProjectiles - Array to track projectiles
 * @param {number} params.laneWidth - Lane width for positioning
 * @param {number} params.currentLane - Current player lane
 * @param {Object} params.player - Player reference for targeting
 */
export function spawnBossProjectile({
  type,
  boss,
  state,
  playSFX,
  createFloatingText,
  scene,
  bossProjectiles,
  laneWidth,
  currentLane,
  player
}) {
  if (type === 'truck') {
    // Truck charges — aim for character, then ram straight without changing trajectory
    state.bossCharging = true
    state.bossChargeTimer = 0
    state.bossChargeTarget = -5
    playSFX('truck_rev')
    // Lock target: aim for character's current position, then straight line
    if (boss) {
      boss.userData = boss.userData || {}
      boss.userData.chargeTargetX = player.position.x // aim for character position
      boss.userData.chargeStartX = boss.position.x
      boss.userData.chargeStartZ = boss.position.z
      boss.userData.chargeMissTriggered = false
    }
  } else {
    // Dragon fires 2-3 fireballs at different lanes & heights
    const lanes = [0, 1, 2]
    const playerLane = currentLane
    const otherLanes = lanes.filter(l => l !== playerLane).sort(() => Math.random() - 0.5)
    const attackLanes = [playerLane]
    const extra = Math.random() > 0.3 ? 2 : 1
    for (let i = 0; i < Math.min(extra, otherLanes.length); i++) attackLanes.push(otherLanes[i])
    
    attackLanes.forEach((lane, idx) => {
      const targetX = (lane - 1) * laneWidth
      const fbY = 0.3 + Math.random() * 3.2 // random height between 0.3 and 3.5
      
      const fbGeo = new THREE.SphereGeometry(0.5, 8, 8)
      const fbMat = new THREE.MeshBasicMaterial({ color: 0xff6600 })
      const fb = new THREE.Mesh(fbGeo, fbMat)
      const glowGeo = new THREE.SphereGeometry(0.8, 8, 8)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.4 })
      fb.add(new THREE.Mesh(glowGeo, glowMat))
      
      fb.position.set(boss.position.x + (Math.random() - 0.5) * 3, fbY, boss.position.z + 2 + Math.random() * 2)
      fb.userData = { targetX, targetLane: lane, targetY: fbY, speed: 0.3 + Math.random() * 0.3, delay: idx * 0.15 }
      scene.add(fb)
      bossProjectiles.push(fb)
    })
    createFloatingText('\u{1f525}', new THREE.Vector3((attackLanes[0] - 1) * laneWidth, 2, -5), '#ff6600', scene)
    playSFX('fire_shoot', 0.5) // per volley, not per bullet
  }
}
