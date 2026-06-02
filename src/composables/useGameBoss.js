import * as THREE from 'three';

/**
 * Game boss composable — handles boss spawning, attacks, and defeat.
 * 
 * @param {Object} deps
 * @param {Object} deps.store - Shared reactive game store
 * @param {number} deps.laneWidth - Lane width constant
 */
export function useGameBoss({
  store,
  laneWidth
}) {
  // Functions accessed via store (wired in App.vue after init):
  // store.playSFX, store.createFloatingText, store.playSound, store.switchBGMTrack
  // store.currentStage, store.currentLane accessed directly {
  let textureLoader = new THREE.TextureLoader();

  const spawnBoss = (bossType) => {
    if (store.boss) {
      store.scene.remove(store.boss);
      store.boss = null;
    }
    store.bossProjectiles = [];
    store.bossAttackTimer = 0;
    store.bossNextAttack = 1.5 + Math.random() * 1.5;
    store.bossCharging = false;
    store.bossChargeTimer = 0;
    store.bossState = 'idle';
    store.bossStateTimer = 0;
    store.bossVulnerableOrbs = [];
    
    const group = new THREE.Group();
    group.name = 'boss';
    
    if (bossType === 'truck') {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2.5, 5),
        new THREE.MeshPhongMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.2 })
      );
      body.position.y = 1.5;
      group.add(body);
      
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 2),
        new THREE.MeshPhongMaterial({ color: 0xcc1111 })
      );
      cab.position.set(0, 3, 1);
      group.add(cab);
      
      const lightGeo = new THREE.SphereGeometry(0.2, 6, 6);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
      const hl = new THREE.Mesh(lightGeo, lightMat);
      hl.position.set(-0.8, 1.5, 2.5);
      group.add(hl);
      const hr = new THREE.Mesh(lightGeo, lightMat);
      hr.position.set(0.8, 1.5, 2.5);
      group.add(hr);
      
      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
      const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      for (const [x, z] of [[-1.6, 1.5], [1.6, 1.5], [-1.6, -1.5], [1.6, -1.5]]) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.4, z);
        group.add(w);
      }
    } else if (bossType === 'giantMeatball') {
      // 3D Beholder Core Sphere
      const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
      const texturePath = 'assets/stage3/boss_meatball_core.png';
      const sphereMat = new THREE.MeshPhongMaterial({ 
        map: textureLoader.load(texturePath),
        shininess: 30
      });
      const coreMesh = new THREE.Mesh(sphereGeo, sphereMat);
      coreMesh.name = 'beholder-core';
      coreMesh.position.set(0, 2.5, 0);
      group.add(coreMesh);
      
      // Giant central eyeball at the front (z = 1.3)
      const eyeWhiteGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const eyeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 50 });
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eyeWhite.position.set(0, 0, 1.25);
      coreMesh.add(eyeWhite);
      
      const pupilGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x990000 }); // Evil red pupil
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.4);
      eyeWhite.add(pupil);
      
      const glowLight = new THREE.PointLight(0xff00ff, 2, 10);
      glowLight.position.set(0, 2.5, 0);
      group.add(glowLight);
      
      // 12 Radial Tentacles with nested pivot groups
      const tentacleCount = 12;
      const tentacles = [];
      for (let i = 0; i < tentacleCount; i++) {
        // Create nested pivot group centered at (0, 2.5, 0)
        const pivot = new THREE.Group();
        pivot.position.set(0, 2.5, 0);
        
        const tentacleGeo = new THREE.CylinderGeometry(0.18, 0.08, 2.2, 8);
        const tentacleMat = new THREE.MeshPhongMaterial({ 
          color: new THREE.Color().setHSL((i / tentacleCount) % 1, 0.7, 0.4),
          emissive: new THREE.Color().setHSL((i / tentacleCount) % 1, 0.5, 0.2),
          emissiveIntensity: 0.2
        });
        const tentacleMesh = new THREE.Mesh(tentacleGeo, tentacleMat);
        
        // Place cylinder extending local Y
        tentacleMesh.position.set(0, 2.4, 0);
        
        pivot.add(tentacleMesh);
        
        const angle = (i / tentacleCount) * Math.PI * 2;
        pivot.rotation.z = angle;
        pivot.userData = { baseAngle: angle, offset: i };
        
        group.add(pivot);
        tentacles.push(pivot);
      }
      group.userData.tentacles = tentacles;
    } else {
      const isStage2Dragon = (store.currentStage === 1);
      const dragonColor = isStage2Dragon ? 0xff3300 : 0x9933ff;
      const dragonEmissive = isStage2Dragon ? 0xaa2200 : 0x4400aa;
      const dragonColorDark = isStage2Dragon ? 0xaa2200 : 0x6622aa;
      const dragonEmissiveDark = isStage2Dragon ? 0x661100 : 0x330066;
      const dragonColorBelly = isStage2Dragon ? 0xff6644 : 0xcc88ff;
      const dragonEmissiveBelly = isStage2Dragon ? 0xcc4400 : 0x8844cc;
      const dragonWingColor = isStage2Dragon ? 0xcc4400 : 0x7722cc;
      
      const dMat = new THREE.MeshPhongMaterial({ color: dragonColor, emissive: dragonEmissive, emissiveIntensity: 0.25 });
      const dMatDark = new THREE.MeshPhongMaterial({ color: dragonColorDark, emissive: dragonEmissiveDark, emissiveIntensity: 0.2 });
      const dMatBelly = new THREE.MeshPhongMaterial({ color: dragonColorBelly, emissive: dragonEmissiveBelly, emissiveIntensity: 0.15 });
      
      const bodyGeo = new THREE.SphereGeometry(1, 8, 6);
      bodyGeo.scale(1.2, 0.8, 2.0);
      const body = new THREE.Mesh(bodyGeo, dMat);
      body.position.y = 0;
      group.add(body);
      
      const bellyGeo = new THREE.SphereGeometry(0.7, 6, 4);
      bellyGeo.scale(0.9, 0.6, 1.8);
      const belly = new THREE.Mesh(bellyGeo, dMatBelly);
      belly.position.set(0, -0.3, 0.1);
      group.add(belly);
      
      const headGeo = new THREE.SphereGeometry(0.6, 8, 6);
      const head = new THREE.Mesh(headGeo, dMat);
      head.position.set(0, 0.5, 2.2);
      group.add(head);
      
      const snoutGeo = new THREE.ConeGeometry(0.35, 1.0, 6);
      const snout = new THREE.Mesh(snoutGeo, dMat);
      snout.rotation.x = -Math.PI / 2;
      snout.position.set(0, 0.3, 3.0);
      group.add(snout);
      
      const eyeGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
      const le = new THREE.Mesh(eyeGeo, eyeMat);
      le.position.set(-0.25, 0.7, 2.7);
      group.add(le);
      const re = new THREE.Mesh(eyeGeo, eyeMat);
      re.position.set(0.25, 0.7, 2.7);
      group.add(re);
      
      const hornGeo = new THREE.ConeGeometry(0.1, 0.8, 5);
      const hornMat = new THREE.MeshPhongMaterial({ color: 0xddcc88 });
      const lh = new THREE.Mesh(hornGeo, hornMat);
      lh.position.set(-0.3, 1.0, 2.1);
      lh.rotation.z = 0.4;
      group.add(lh);
      const rh = new THREE.Mesh(hornGeo, hornMat);
      rh.position.set(0.3, 1.0, 2.1);
      rh.rotation.z = -0.4;
      group.add(rh);
      
      const wingMat = new THREE.MeshPhongMaterial({ color: dragonWingColor, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      for (let s = 0; s < 3; s++) {
        const wGeo = new THREE.BufferGeometry();
        const len = 2.5 - s * 0.5;
        const wVerts = new Float32Array([0,0,0, -len, 0.8+s*0.3, -0.3+s*0.2, -len*0.6, -0.2, 0.2+s*0.1]);
        wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3));
        wGeo.computeVertexNormals();
        const wMesh = new THREE.Mesh(wGeo, wingMat);
        wMesh.position.set(-0.8, 0.3, -0.5);
        group.add(wMesh);
      }
      
      for (let s = 0; s < 3; s++) {
        const wGeo = new THREE.BufferGeometry();
        const len = 2.5 - s * 0.5;
        const wVerts = new Float32Array([0,0,0, len, 0.8+s*0.3, -0.3+s*0.2, len*0.6, -0.2, 0.2+s*0.1]);
        wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3));
        wGeo.computeVertexNormals();
        const wMesh = new THREE.Mesh(wGeo, wingMat);
        wMesh.position.set(0.8, 0.3, -0.5);
        group.add(wMesh);
      }
      
      for (let t = 0; t < 5; t++) {
        const tGeo = new THREE.SphereGeometry(0.3 - t * 0.04, 6, 4);
        const tMesh = new THREE.Mesh(tGeo, dMatDark);
        tMesh.position.set(0, -0.1 + Math.sin(t*0.5)*0.2, -1.2 - t * 0.6);
        group.add(tMesh);
      }
      
      const tipGeo = new THREE.ConeGeometry(0.15, 0.5, 4);
      const tip = new THREE.Mesh(tipGeo, hornMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, -0.1, -4.4);
      group.add(tip);
      
      const legGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 5);
      for (const [x, z] of [[-0.6, 0.8], [0.6, 0.8], [-0.5, -0.5], [0.5, -0.5]]) {
        const leg = new THREE.Mesh(legGeo, dMatDark);
        leg.position.set(x, -0.7, z);
        group.add(leg);
      }
    }
    
    // Place boss at its stage-appropriate far idle position so it doesn't pop in
    let initialZ = -60; // All bosses idle at -60
    group.position.set(0, bossType === 'truck' ? 0 : 5, initialZ);
    store.scene.add(group);
    store.boss = group;
  };

  const spawnBossProjectile = (type) => {
    if (type === 'truck') {
      store.bossCharging = true;
      store.bossChargeTimer = 0;
      store.bossChargeTarget = -5;
      store.playSFX('truck_rev');
      if (store.boss) {
        store.boss.userData = store.boss.userData || {};
        store.boss.userData.chargeTargetX = store.player.position.x;
        store.boss.userData.chargeStartX = store.boss.position.x;
        store.boss.userData.chargeStartZ = store.boss.position.z;
        store.boss.userData.chargeMissTriggered = false;
      }
    } else if (type === 'giantMeatball') {
      const numBeams = 4 + Math.floor(Math.random() * 3);
      const lanes = [0, 1, 2];
      const attackLanes = lanes.sort(() => Math.random() - 0.5).slice(0, Math.min(numBeams, 3));
      
      attackLanes.forEach((lane, idx) => {
        const targetX = (lane - 1) * laneWidth;
        const beamSpriteMat = new THREE.SpriteMaterial({
          map: textureLoader.load('assets/stage3/obstacle-metal-beam.png'),
          transparent: true
        });
        const beam = new THREE.Sprite(beamSpriteMat);
        beam.scale.set(1.2, 1.5, 6.0);
        
        // Spawn high in the air at y = 8, z = -25
        beam.position.set(targetX, 8, -25);
        beam.userData = { 
          targetX, 
          targetY: 0.5, 
          speed: 0.6 + Math.random() * 0.3, 
          lane, 
          rotationSpeed: 0.15 + Math.random() * 0.2,
          isBeam: true
        };
        store.scene.add(beam);
        store.bossProjectiles.push(beam);
      });
      store.createFloatingText('⚠️', new THREE.Vector3(0, 10, -20), '#aaaaaa');
      store.playSFX('crash_metal', 0.5);
    } else {
      // Dragon (Stage 2) - fireballs at random lanes, random heights, randomized Z-axis, with no overlap
      const allLanes = [0, 1, 2].sort(() => Math.random() - 0.5);
      // Pick 1 or 2 lanes at random (not player-tracking)
      const numFireballs = Math.random() > 0.4 ? 2 : 1;
      const attackLanes = allLanes.slice(0, numFireballs);

      const spawnedPositions = [];

      attackLanes.forEach((lane, idx) => {
        const targetX = (lane - 1) * laneWidth;
        let fbY = 0.5;
        let spawnZ = store.boss.position.z + 2;

        // Try up to 50 times to find a non-overlapping height and Z-depth
        let found = false;
        for (let attempt = 0; attempt < 50; attempt++) {
          fbY = 0.5 + Math.random() * 3.5;
          // Spawn staggered along Z in front of the boss (e.g. up to 18 units ahead)
          spawnZ = store.boss.position.z + 2 + Math.random() * 18.0;

          let overlap = false;
          // 1. Check against other fireballs generated in this wave
          for (const pos of spawnedPositions) {
            const dx = targetX - pos.x;
            const dy = fbY - pos.y;
            const dz = spawnZ - pos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 2.5) {
              overlap = true;
              break;
            }
          }

          // 2. Check against already existing active projectiles in scene
          if (!overlap) {
            for (const proj of store.bossProjectiles) {
              const dx = targetX - proj.position.x;
              const dy = fbY - proj.position.y;
              const dz = spawnZ - proj.position.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist < 2.5) {
                overlap = true;
                break;
              }
            }
          }

          if (!overlap) {
            found = true;
            break;
          }
        }

        spawnedPositions.push({ x: targetX, y: fbY, z: spawnZ });

        const fbRadius = 0.5;
        const glowRadius = 0.8;
        const fbGeo = new THREE.SphereGeometry(fbRadius, 10, 10);
        const fbMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const fb = new THREE.Mesh(fbGeo, fbMat);

        // Glow halo — purely visual, slightly larger
        const glowGeo = new THREE.SphereGeometry(glowRadius, 10, 10);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.35 });
        fb.add(new THREE.Mesh(glowGeo, glowMat));

        fb.position.set(targetX, fbY, spawnZ);
        // Store the chosen lane X as final target and Y for update loop
        fb.userData = {
          targetX,
          targetLane: lane,
          targetY: fbY,
          speed: 0.35 + Math.random() * 0.25,
          delay: idx * 0.1,
          isFireball: true
        };
        store.scene.add(fb);
        store.bossProjectiles.push(fb);
      });
      store.createFloatingText('🔥', new THREE.Vector3((attackLanes[0] - 1) * laneWidth, 2, -5), '#ff6600');
      store.playSFX('fire_shoot', 0.5);
    }
  };

  return {
    spawnBoss,
    spawnBossProjectile
  };
}
