import * as THREE from 'three';

/**
 * Spawn a floating UFO obstacle
 * @param {Object} params - Parameters
 * @param {THREE.Scene} params.scene - The scene to add the obstacle to
 * @param {number} params.laneWidth - Width of each lane
 * @param {Function} params.getSurfaceY - Function to get surface Y at a given Z
 * @param {Array} params.obstacles - Array to push the obstacle into
 * @returns {THREE.Group} The created UFO group
 */
export const spawnFloatingObstacle = ({ scene, laneWidth, getSurfaceY, obstacles }) => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const ufoGroup = new THREE.Group();
  
  // UFO dome (top)
  const domeGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshToonMaterial({ color: 0x88ff88, emissive: 0x22aa22, emissiveIntensity: 0.3 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0.1;
  dome.castShadow = false;
  ufoGroup.add(dome);
  
  // UFO saucer body (flattened disc)
  const saucerGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 24);
  const saucerMat = new THREE.MeshToonMaterial({ color: 0xcccccc, emissive: 0x444444, emissiveIntensity: 0.2 });
  const saucer = new THREE.Mesh(saucerGeo, saucerMat);
  saucer.castShadow = false;
  ufoGroup.add(saucer);
  
  // UFO bottom ring (glowing)
  const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.15;
  ring.name = 'ufo-ring';
  ufoGroup.add(ring);
  
  // UFO lights around the rim
  const lightGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const lightColors = [0xff0000, 0xffff00, 0x00ff00, 0x0088ff, 0xff00ff];
  for (let i = 0; i < 5; i++) {
    const lightMat = new THREE.MeshBasicMaterial({ color: lightColors[i] });
    const ufoLight = new THREE.Mesh(lightGeo, lightMat);
    const angle = (i / 5) * Math.PI * 2;
    ufoLight.position.set(Math.cos(angle) * 1.1, -0.05, Math.sin(angle) * 1.1);
    ufoLight.name = 'ufo-light-' + i;
    ufoGroup.add(ufoLight);
  }
  
  // Tractor beam (cone below)
  const beamGeo = new THREE.ConeGeometry(1.2, 1.5, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -1.0;
  beam.rotation.x = Math.PI; // Point downward
  ufoGroup.add(beam);
  
  ufoGroup.position.set(laneX, 2.2, -50);
  scene.add(ufoGroup);
  ufoGroup.position.y += getSurfaceY(-50); // apply curve at spawn
  ufoGroup.baseY = ufoGroup.position.y - getSurfaceY(-50); // store flat Y
  obstacles.push({ mesh: ufoGroup, lane, type: 'floating' });
  
  return ufoGroup;
};

/**
 * Update obstacle positions, animations, and handle removal
 * @param {Object} params - Parameters
 * @param {Array} params.obstacles - Array of obstacle objects
 * @param {number} params.gameSpeed - Current game speed
 * @param {number} params.laneWidth - Width of each lane
 * @param {Function} params.getCurveX - Function to get curve X offset at given Z
 * @param {Function} params.getSurfaceY - Function to get surface Y at given Z
 * @param {Function} params.getSurfaceTilt - Function to get surface tilt at given Z
 * @param {number} params.time - Current time in seconds
 * @param {number} params.delta - Delta time since last frame
 * @param {number} params.difficultyMultiplier - Difficulty multiplier for speed
 * @param {THREE.Scene} params.scene - The scene to remove obstacles from
 * @param {THREE.BufferGeometry} params.sharedCoinGeo - Shared coin geometry to preserve
 * @returns {void}
 */
export const updateObstacles = ({
  obstacles,
  gameSpeed,
  laneWidth,
  getCurveX,
  getSurfaceY,
  getSurfaceTilt,
  time,
  delta,
  difficultyMultiplier,
  scene,
  sharedCoinGeo
}) => {
  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += gameSpeed;
    // Road curvature: shift obstacles laterally based on depth
    const baseX = obs.mesh.userData.baseX !== undefined ? obs.mesh.userData.baseX : ((obs.lane - 1) * laneWidth);
    const laneX = baseX + getCurveX(obs.mesh.position.z);
    // For police/UFO: add accumulated drift offset
    const driftOffset = obs.mesh.userData.driftX || 0;
    obs.mesh.position.x = laneX + driftOffset;
    obs.mesh.position.y = (obs.mesh.baseY || 0) + getSurfaceY(obs.mesh.position.z);
    obs.mesh.rotation.x = getSurfaceTilt(obs.mesh.position.z);
    // Spin UFOs, ground obstacles gentle spin
    obs.mesh.rotation.y += obs.type === 'floating' ? 0.08 : (obs.obstacleType === 'fruit' ? 0.05 : 0);
    
    // UFO: sin wave + lateral sweep across road
    if (obs.type === 'floating') {
      obs.mesh.position.y = 2.2 + Math.sin(time * 3 + obs.mesh.position.z * 0.1) * 0.5 + getSurfaceY(obs.mesh.position.z);
      // Lateral sweep — random fixed distance movement
      if (!obs.mesh.userData.ufoSwayDir) {
        obs.mesh.userData.ufoSwayDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.ufoSwaySpeed = 0.04 + Math.random() * 0.02;
        obs.mesh.userData.ufoSwayDist = 0;
        obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
        obs.mesh.userData.driftX = 0;
      }
      obs.mesh.userData.driftX += obs.mesh.userData.ufoSwayDir * obs.mesh.userData.ufoSwaySpeed;
      obs.mesh.userData.ufoSwayDist += obs.mesh.userData.ufoSwaySpeed;
      if (obs.mesh.userData.ufoSwayDist >= obs.mesh.userData.ufoSwayMaxDist) {
        obs.mesh.userData.ufoSwayDir *= -1;
        obs.mesh.userData.ufoSwayDist = 0;
        obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
      }
      // Keep within road boundaries
      const maxDriftUFO = laneWidth * 1.5;
      if (obs.mesh.userData.driftX < -maxDriftUFO) obs.mesh.userData.ufoSwayDir = 1;
      else if (obs.mesh.userData.driftX > maxDriftUFO) obs.mesh.userData.ufoSwayDir = -1;
    }
    
    // Barrel: roll across street like a log on its side
    if (obs.obstacleType === 'barrel' && obs.mesh.userData.driftDir) {
      obs.mesh.userData.driftX = (obs.mesh.userData.driftX || 0) + obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed;
      const maxDriftBarrel = laneWidth * 1.2;
      if (obs.mesh.userData.driftX < -maxDriftBarrel || obs.mesh.userData.driftX > maxDriftBarrel) {
        obs.mesh.userData.driftDir *= -1;
      }
      // Roll the inner barrel group around its local Z axis (perpendicular to barrel length)
      // This makes the cylinder spin like a rolling log
      const barrelInner = obs.mesh.userData.barrelGroup || obs.mesh.children[0];
      if (barrelInner) {
        barrelInner.rotation.z += obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed * 8;
      }
    }
    
    // Red car / bus / fireengine: move forward or backward at noticeable speed (slower than player)
    if (obs.obstacleType === 'car' || obs.obstacleType === 'bus' || obs.obstacleType === 'fireengine') {
      if (!obs.mesh.userData.lungeTimer) {
        obs.mesh.userData.lungeTimer = Math.random() * 3;
        obs.mesh.userData.lungeDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.lungeSpeed = 0.02 + Math.random() * 0.03; // noticeable but slower than player
      }
      obs.mesh.userData.lungeTimer -= delta;
      if (obs.mesh.userData.lungeTimer <= 0) {
        obs.mesh.userData.lungeDir *= -1;
        obs.mesh.userData.lungeTimer = 1.5 + Math.random() * 2;
      }
      obs.mesh.position.z += obs.mesh.userData.lungeDir * obs.mesh.userData.lungeSpeed;
    }
    
    // Police car: 90° across the road, slides left or right across lanes
    if (obs.obstacleType === 'police') {
      if (!obs.mesh.userData.policeDir) {
        obs.mesh.userData.policeDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.policeSpeed = 0.05 * difficultyMultiplier;
        obs.mesh.userData.driftX = 0;
      }
      obs.mesh.userData.driftX += obs.mesh.userData.policeDir * obs.mesh.userData.policeSpeed * delta * 60;
      // Bounce between road edges — full road width
      const maxDrift = laneWidth * 2; // can cross all 3 lanes
      if (obs.mesh.userData.driftX < -maxDrift) {
        obs.mesh.userData.policeDir = 1;
      } else if (obs.mesh.userData.driftX > maxDrift) {
        obs.mesh.userData.policeDir = -1;
      }
    }
    
    // Police siren flash
    if (obs.obstacleType === 'police') {
      const sirenR = obs.mesh.getObjectByName('siren-red');
      const sirenB = obs.mesh.getObjectByName('siren-blue');
      if (sirenR && sirenB) {
        const flash = Math.sin(time * 15) > 0;
        sirenR.material.color.setHex(flash ? 0xff0000 : 0x440000);
        sirenB.material.color.setHex(flash ? 0x000044 : 0x0000ff);
      }
    }

    // Remove obstacles that have passed the camera
    if (obs.mesh.position.z > 15) {
      obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
      scene.remove(obs.mesh);
      obstacles.splice(index, 1);
    }
  });
};
