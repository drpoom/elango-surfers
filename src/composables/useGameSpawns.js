import * as THREE from 'three';
import { STAGES } from '../data/stages.js';

export function useGameSpawns({
  getCtx,
  getSurfaceY,
  currentStage,
  laneWidth,
  stage3Textures
}) {
  let textureLoader = new THREE.TextureLoader();
  
  // Cache variables for performance
  let sharedCoinGeo = null;
  let sharedCoinMat = null;

  const checkOverlap = (x, z, objectType) => {
    const ctx = getCtx();
    const obstacles = ctx.obstacles || [];
    const coins = ctx.coins || [];
    
    const OBSTACLE_OVERLAP_RADIUS = 2.5;
    const COIN_OBSTACLE_OVERLAP_RADIUS = 1.8;

    if (objectType === 'obstacle') {
      for (const obs of obstacles) {
        if (obs.mesh && obs.mesh.position) {
          const dx = x - obs.mesh.position.x;
          const dz = z - obs.mesh.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < OBSTACLE_OVERLAP_RADIUS) return true;
        }
      }
      for (const coin of coins) {
        if (coin.mesh && coin.mesh.position) {
          const dx = x - coin.mesh.position.x;
          const dz = z - coin.mesh.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < COIN_OBSTACLE_OVERLAP_RADIUS) return true;
        }
      }
    } else if (objectType === 'coin') {
      for (const obs of obstacles) {
        if (obs.mesh && obs.mesh.position) {
          const dx = x - obs.mesh.position.x;
          const dz = z - obs.mesh.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < COIN_OBSTACLE_OVERLAP_RADIUS) return true;
        }
      }
    }
    return false;
  };

  const findSafeZ = (lane, baseZ = -50, minDistance = 6) => {
    const ctx = getCtx();
    let currentZ = baseZ;
    let conflict = true;
    let attempts = 0;
    while (conflict && attempts < 20) {
      conflict = false;
      
      // Check obstacles
      if (ctx.obstacles) {
        for (const obs of ctx.obstacles) {
          if (obs.mesh) {
            const isWall = obs.obstacleType === 'wall';
            // Walls block every lane EXCEPT the gap lane (obs.lane).
            // So for walls: conflict if spawning lane != obs.lane (the gap).
            // For regular obstacles: conflict if same lane.
            const laneConflict = isWall ? (lane !== obs.lane) : (obs.lane === lane);
            if (laneConflict) {
              const zDist = Math.abs(currentZ - obs.mesh.position.z);
              if (zDist < minDistance) {
                currentZ = obs.mesh.position.z - minDistance;
                conflict = true;
                break;
              }
            }
          }
        }
      }
      
      // Check coins
      if (ctx.coins) {
        for (const coin of ctx.coins) {
          if (coin.mesh && coin.lane === lane) {
            const zDist = Math.abs(currentZ - coin.mesh.position.z);
            if (zDist < minDistance) {
              currentZ = coin.mesh.position.z - minDistance;
              conflict = true;
              break;
            }
          }
        }
      }
      
      // Check powerups
      if (ctx.powerups) {
        for (const pup of ctx.powerups) {
          if (pup.mesh && pup.lane === lane && !pup.collected) {
            const zDist = Math.abs(currentZ - pup.mesh.position.z);
            if (zDist < minDistance) {
              currentZ = pup.mesh.position.z - minDistance;
              conflict = true;
              break;
            }
          }
        }
      }
      
      // Check bonus portal
      if (ctx.bonusPortal && ctx.bonusPortal.mesh && ctx.bonusPortal.lane === lane) {
        const zDist = Math.abs(currentZ - ctx.bonusPortal.mesh.position.z);
        if (zDist < minDistance) {
          currentZ = ctx.bonusPortal.mesh.position.z - minDistance;
          conflict = true;
          break;
        }
      }
      
      attempts++;
    }
    return currentZ;
  };

  const spawnObstacle = (gameDuration) => {
    const ctx = getCtx();
    if (ctx.bossWarning || ctx.bossActive) return;
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * laneWidth;
    const targetZ = findSafeZ(lane, -50, 6.0);
    
    const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
    const stage = STAGES[currentStage.value];
    const isMedieval = stage.id === 2;
    const isStage3 = stage.id === 3;
    
    let types = [];
    
    if (isStage3) {
      types = ['trafficCone', 'metalBeam', 'dumpster', 'scaffoldTower', 'concreteBarrier', 'billboard'];
      if (difficultyMultiplier > 2.2) types.push('slippery');
    } else if (isMedieval) {
      types = ['brickBox', 'brickBox', 'barrel', 'stone'];
      if (difficultyMultiplier > 1.3) types.push('stone', 'barrier');
      if (difficultyMultiplier > 1.8) types.push('wall', 'barrel');
      if (difficultyMultiplier > 2.2) types.push('barrier', 'stone');
      if (difficultyMultiplier > 2.8) types.push('wall', 'barrel');
    } else {
      types = ['brickBox', 'brickBox', 'car'];
      if (difficultyMultiplier > 1.3) types.push('stone', 'barrier');
      if (difficultyMultiplier > 1.8) types.push('police', 'bus');
      if (difficultyMultiplier > 2.2) types.push('fireengine', 'wall');
      if (difficultyMultiplier > 2.8) types.push('wall', 'barrel');
    }
    
    const obsType = types[Math.floor(Math.random() * types.length)];
    let group;
    let obsLane = lane;
    let hitWidth = 1.5;
    
    switch (obsType) {
      case 'brickBox': {
        group = new THREE.Group();
        const brickGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
        const brickMat = new THREE.MeshToonMaterial({ 
          map: textureLoader.load('assets/stage2/brick-wall-layered.png'),
          color: 0x8B4513 
        });
        const brick = new THREE.Mesh(brickGeo, brickMat);
        brick.castShadow = false;
        group.add(brick);
        group.position.set(laneX, 0.9, -50);
        break;
      }
      
      case 'car': {
        group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.0);
        const carColors = [0xff3333, 0x3366ff, 0xffcc00, 0x33cc33, 0xff6600, 0xcc33ff];
        const carMat = new THREE.MeshToonMaterial({ color: carColors[Math.floor(Math.random() * carColors.length)] });
        const body = new THREE.Mesh(bodyGeo, carMat);
        body.position.y = 0.6;
        body.castShadow = false;
        group.add(body);
        
        const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 1.5);
        const roofMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 1.2, -0.3);
        group.add(roof);
        
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
        const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
        for (const [wx, wz] of [[-0.9, 1.0], [0.9, 1.0], [-0.9, -1.0], [0.9, -1.0]]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.3, wz);
          group.add(wheel);
        }
        
        const hlGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        for (const hx of [-0.6, 0.6]) {
          const hl = new THREE.Mesh(hlGeo, hlMat);
          hl.position.set(hx, 0.6, 1.51);
          group.add(hl);
        }
        group.position.set(laneX, 0, -50);
        break;
      }
      
      case 'police': {
        group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.2);
        const bodyMat = new THREE.MeshToonMaterial({ color: 0x111133 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = false;
        group.add(body);
        
        const stripeGeo = new THREE.BoxGeometry(1.82, 0.2, 2.0);
        const stripeMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, 0.7, 0);
        group.add(stripe);
        
        const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 1.5);
        const roofMat = new THREE.MeshToonMaterial({ color: 0x111133 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 1.2, -0.3);
        group.add(roof);
        
        const sirenGeo = new THREE.BoxGeometry(0.4, 0.15, 0.3);
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const blueMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const sirenL = new THREE.Mesh(sirenGeo, redMat);
        sirenL.position.set(-0.3, 1.55, -0.3);
        sirenL.name = 'siren-red';
        group.add(sirenL);
        const sirenR = new THREE.Mesh(sirenGeo, blueMat);
        sirenR.position.set(0.3, 1.55, -0.3);
        sirenR.name = 'siren-blue';
        group.add(sirenR);
        
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
        const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
        for (const [wx, wz] of [[-0.9, 1.1], [0.9, 1.1], [-0.9, -1.1], [0.9, -1.1]]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.3, wz);
          group.add(wheel);
        }
        group.position.set(laneX, 0, -50);
        group.rotation.y = Math.PI / 2;
        break;
      }
      
      case 'fireengine': {
        group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(1.8, 1.2, 5.0);
        const bodyMat = new THREE.MeshToonMaterial({ color: 0xcc0000 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = false;
        group.add(body);
        
        const cabGeo = new THREE.BoxGeometry(1.6, 1.0, 1.5);
        const cabMat = new THREE.MeshToonMaterial({ color: 0xcc0000 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(0, 1.8, 1.5);
        group.add(cab);
        
        const wsGeo = new THREE.BoxGeometry(1.2, 0.6, 0.05);
        const wsMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        const ws = new THREE.Mesh(wsGeo, wsMat);
        ws.position.set(0, 1.9, 2.26);
        group.add(ws);
        
        const ladderGeo = new THREE.BoxGeometry(0.15, 0.1, 3.5);
        const ladderMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
        for (const lx of [-0.4, 0.4]) {
          const rail = new THREE.Mesh(ladderGeo, ladderMat);
          rail.position.set(lx, 2.5, -0.5);
          group.add(rail);
        }
        
        const rungGeo = new THREE.BoxGeometry(0.8, 0.06, 0.06);
        for (let rz = -2.0; rz <= 1.0; rz += 0.4) {
          const rung = new THREE.Mesh(rungGeo, ladderMat);
          rung.position.set(0, 2.5, rz);
          group.add(rung);
        }
        
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
        for (const wz of [1.8, 0.0, -1.8]) {
          for (const wx of [-0.95, 0.95]) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, 0.35, wz);
            group.add(wheel);
          }
        }
        group.position.set(laneX, 0, -50);
        break;
      }
      
      case 'bus': {
        group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(2.0, 1.5, 5.5);
        const busMat = new THREE.MeshToonMaterial({ color: 0xffaa00 });
        const body = new THREE.Mesh(bodyGeo, busMat);
        body.position.y = 1.1;
        body.castShadow = false;
        group.add(body);
        
        const winGeo = new THREE.BoxGeometry(0.5, 0.4, 0.05);
        const winMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        for (let wz = -2.0; wz <= 2.0; wz += 0.8) {
          for (const wx of [-1.0, 1.0]) {
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(wx * (1.01), 1.3, wz);
            win.rotation.y = wx > 0 ? 0 : Math.PI;
            group.add(win);
          }
        }
        
        const fwsGeo = new THREE.BoxGeometry(1.6, 0.6, 0.05);
        const fws = new THREE.Mesh(fwsGeo, winMat);
        fws.position.set(0, 1.3, 2.76);
        group.add(fws);
        
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
        for (const wz of [2.0, -2.0]) {
          for (const wx of [-1.0, 1.0]) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, 0.35, wz);
            group.add(wheel);
          }
        }
        group.position.set(laneX, 0, -50);
        break;
      }
      
      case 'stone': {
        group = new THREE.Group();
        const stoneGeo = new THREE.DodecahedronGeometry(1.0, 1);
        const stoneMat = new THREE.MeshToonMaterial({ color: 0x888888 });
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.y = 0.7;
        stone.castShadow = false;
        stone.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
        group.add(stone);
        
        const mossGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const mossMat = new THREE.MeshToonMaterial({ color: 0x447744 });
        for (let m = 0; m < 3; m++) {
          const moss = new THREE.Mesh(mossGeo, mossMat);
          moss.position.set((Math.random()-0.5)*0.8, 1.0+Math.random()*0.3, (Math.random()-0.5)*0.8);
          moss.scale.set(1, 0.3, 1);
          group.add(moss);
        }
        group.position.set(laneX, 0, -50);
        break;
      }
      
      case 'barrier': {
        group = new THREE.Group();
        const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8);
        const barMat = new THREE.MeshToonMaterial({ color: 0xff6600 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.y = 0.8;
        group.add(bar);
        
        const coneGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
        for (const cx of [-0.8, 0.0, 0.8]) {
          const coneMat = new THREE.MeshToonMaterial({ color: cx === 0 ? 0xff6600 : 0xffaa00 });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.set(cx, 0.3, 0);
          group.add(cone);
        }
        
        const stripGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.15, 8);
        const stripMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        for (const sx of [-0.6, -0.2, 0.2, 0.6]) {
          const strip = new THREE.Mesh(stripGeo, stripMat);
          strip.rotation.z = Math.PI / 2;
          strip.position.set(sx, 0.8, 0);
          group.add(strip);
        }
        group.position.set(laneX, 0, -50);
        break;
      }
      
      case 'wall': {
        group = new THREE.Group();
        const gapLane = lane;
        const blockedLanes = [0, 1, 2].filter(l => l !== gapLane);
        const wallX = ((blockedLanes[0] + blockedLanes[1] - 2) / 2) * laneWidth;
        
        const wallGeo = new THREE.BoxGeometry(4.0, 2.0, 0.5);
        const wallMat = new THREE.MeshToonMaterial({ color: 0xcc6633 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.y = 1.0;
        wall.castShadow = false;
        group.add(wall);
        
        const lineGeo = new THREE.BoxGeometry(4.02, 0.04, 0.52);
        const lineMat = new THREE.MeshToonMaterial({ color: 0x993311 });
        for (let ly = 0.2; ly < 2.0; ly += 0.3) {
          const brickLine = new THREE.Mesh(lineGeo, lineMat);
          brickLine.position.y = ly;
          group.add(brickLine);
        }
        
        const vlineGeo = new THREE.BoxGeometry(0.04, 0.25, 0.52);
        for (let ly = 0.2; ly < 2.0; ly += 0.3) {
          const offset = (Math.floor(ly / 0.3) % 2) * 0.4;
          for (let lx = -1.8 + offset; lx < 2.0; lx += 0.8) {
            const vline = new THREE.Mesh(vlineGeo, lineMat);
            vline.position.set(lx, ly + 0.15, 0);
            group.add(vline);
          }
        }
        group.position.set(wallX, 0, -50);
        obsLane = gapLane;
        hitWidth = 2.5;
        group.userData.baseX = wallX;
        break;
      }
      
      case 'barrel': {
        group = new THREE.Group();
        const barrelGroup = new THREE.Group();
        const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 12);
        const barrelMat = new THREE.MeshToonMaterial({ color: 0x336699 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrelGroup.add(barrel);
        
        const stripeGeo2 = new THREE.CylinderGeometry(0.52, 0.52, 0.1, 12);
        const stripeMat2 = new THREE.MeshToonMaterial({ color: 0xffcc00 });
        const stripe1 = new THREE.Mesh(stripeGeo2, stripeMat2);
        stripe1.rotation.x = Math.PI / 2;
        stripe1.position.z = 0.3;
        barrelGroup.add(stripe1);
        const stripe2 = new THREE.Mesh(stripeGeo2, stripeMat2);
        stripe2.rotation.x = Math.PI / 2;
        stripe2.position.z = -0.3;
        barrelGroup.add(stripe2);
        
        const lidGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 12);
        const lidMat = new THREE.MeshToonMaterial({ color: 0x224466 });
        const lid1 = new THREE.Mesh(lidGeo, lidMat);
        lid1.rotation.x = Math.PI / 2;
        lid1.position.z = 0.5;
        barrelGroup.add(lid1);
        const lid2 = new THREE.Mesh(lidGeo, lidMat);
        lid2.rotation.x = Math.PI / 2;
        lid2.position.z = -0.5;
        barrelGroup.add(lid2);
        
        barrelGroup.position.y = 0.5;
        group.add(barrelGroup);
        group.position.set(laneX, 0, -50);
        group.userData = { driftDir: Math.random() > 0.5 ? 1 : -1, driftSpeed: 0.015 + Math.random() * 0.02, barrelGroup };
        break;
      }
      
      case 'slippery': {
        group = new THREE.Group();
        const signGeo = new THREE.BoxGeometry(0.8, 0.6, 0.05);
        const signMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.y = 0.8;
        group.add(sign);
        
        const symbolGeo = new THREE.BoxGeometry(0.1, 0.3, 0.06);
        const symbolMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const symbol = new THREE.Mesh(symbolGeo, symbolMat);
        symbol.position.set(0, 0.8, 0.03);
        group.add(symbol);
        
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const poleMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 0.4;
        group.add(pole);
        
        const baseGeo = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.05;
        group.add(base);
        
        const floorGeo = new THREE.PlaneGeometry(2.5, 4);
        const floorMat = new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.01;
        floor.name = 'slippery-zone';
        group.add(floor);
        group.position.set(laneX, 0, -50);
        break;
      }
      
      // Stage 3 specific obstacles
      case 'trafficCone': {
        group = new THREE.Group();
        const coneGeo = new THREE.ConeGeometry(0.4, 0.9, 16);
        const coneMat = new THREE.MeshToonMaterial({ 
          map: stage3Textures.trafficCone,
          color: 0xff6600
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.castShadow = false;
        cone.position.y = 0.45;
        group.add(cone);
        group.position.set(laneX, 0, -50);
        hitWidth = 0.8;
        break;
      }
      
      case 'metalBeam': {
        group = new THREE.Group();
        const beamLength = 3.0;
        const beamHeight = 0.4;
        const beamWidth = 0.3;
        const flangeThick = 0.06;
        const webThick = 0.05;
        
        const topFlangeGeo = new THREE.BoxGeometry(beamLength, flangeThick, beamWidth);
        const beamMat = new THREE.MeshStandardMaterial({ map: stage3Textures.metalBeam, color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 });
        const topFlange = new THREE.Mesh(topFlangeGeo, beamMat);
        topFlange.position.y = beamHeight / 2 - flangeThick / 2;
        group.add(topFlange);
        
        const bottomFlange = new THREE.Mesh(topFlangeGeo, beamMat);
        bottomFlange.position.y = -(beamHeight / 2 - flangeThick / 2);
        group.add(bottomFlange);
        
        const webGeo = new THREE.BoxGeometry(beamLength, beamHeight - flangeThick * 2, webThick);
        const web = new THREE.Mesh(webGeo, beamMat);
        group.add(web);
        
        group.rotation.z = Math.PI / 2;
        group.position.set(laneX, beamHeight / 2 + 0.05, -50);
        hitWidth = 2.5;
        break;
      }

      case 'dumpster': {
        group = new THREE.Group();
        const dumpsterGeo = new THREE.BoxGeometry(1.5, 1.2, 2.0);
        const dumpsterMat = new THREE.MeshToonMaterial({ 
          map: stage3Textures.dumpster,
          color: 0x228822
        });
        const dumpster = new THREE.Mesh(dumpsterGeo, dumpsterMat);
        dumpster.castShadow = false;
        dumpster.position.y = 0.6;
        group.add(dumpster);
        group.position.set(laneX, 0, -50);
        hitWidth = 1.5;
        break;
      }
      
      case 'scaffoldTower': {
        group = new THREE.Group();
        const scaffoldGeo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
        const scaffoldMat = new THREE.MeshToonMaterial({ 
          map: stage3Textures.scaffoldTower,
          color: 0x888888
        });
        const scaffold = new THREE.Mesh(scaffoldGeo, scaffoldMat);
        scaffold.castShadow = false;
        scaffold.position.y = 1.25;
        group.add(scaffold);
        group.position.set(laneX, 0, -50);
        hitWidth = 1.3;
        break;
      }
      
      case 'concreteBarrier': {
        group = new THREE.Group();
        const barrierGeo = new THREE.BoxGeometry(2.0, 0.8, 0.5);
        const barrierMat = new THREE.MeshToonMaterial({ 
          map: stage3Textures.concreteBarrier,
          color: 0xaaaaaa
        });
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.castShadow = false;
        barrier.position.y = 0.4;
        group.add(barrier);
        group.position.set(laneX, 0, -50);
        hitWidth = 1.8;
        break;
      }
      
      case 'billboard': {
        group = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.0, 8);
        const poleMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1.5;
        group.add(pole);
        
        const signGeo = new THREE.PlaneGeometry(2.5, 1.5);
        const signMat = new THREE.MeshBasicMaterial({ 
          map: stage3Textures.billboard,
          side: THREE.DoubleSide
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 2.8, 0.1);
        group.add(sign);
        group.position.set(laneX, 0, -50);
        hitWidth = 1.5;
        break;
      }
    }
    
    if (group) {
      group.position.z = targetZ;
      ctx.scene.add(group);
      group.position.y += getSurfaceY(targetZ);
      group.baseY = group.position.y - getSurfaceY(targetZ);
      ctx.obstacles.push({ mesh: group, lane: obsLane, type: 'ground', obstacleType: obsType, hitWidth });
    }
  };

  const spawnFloatingObstacle = () => {
    const ctx = getCtx();
    if (ctx.bossWarning || ctx.bossActive) return;
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * laneWidth;
    const targetZ = findSafeZ(lane, -50, 6.0);
    
    const ufoGroup = new THREE.Group();
    
    const domeGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshToonMaterial({ color: 0x88ff88, emissive: 0x22aa22, emissiveIntensity: 0.3 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.1;
    dome.castShadow = false;
    ufoGroup.add(dome);
    
    const saucerGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 24);
    const saucerMat = new THREE.MeshToonMaterial({ color: 0xcccccc, emissive: 0x444444, emissiveIntensity: 0.2 });
    const saucer = new THREE.Mesh(saucerGeo, saucerMat);
    saucer.castShadow = false;
    ufoGroup.add(saucer);
    
    const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.15;
    ring.name = 'ufo-ring';
    ufoGroup.add(ring);
    
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
    
    const beamGeo = new THREE.ConeGeometry(1.2, 1.5, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -1.0;
    beam.rotation.x = Math.PI;
    ufoGroup.add(beam);
    
    ufoGroup.position.set(laneX, 2.2, targetZ);
    ctx.scene.add(ufoGroup);
    ufoGroup.position.y += getSurfaceY(targetZ);
    ufoGroup.baseY = ufoGroup.position.y - getSurfaceY(targetZ);
    ctx.obstacles.push({ mesh: ufoGroup, lane, type: 'floating' });
  };

  const spawnCoin = () => {
    const ctx = getCtx();
    if (ctx.bossWarning || ctx.bossActive) return;
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * laneWidth;
    const targetZ = findSafeZ(lane, -50, 6.0);
    
    if (!sharedCoinGeo) {
      sharedCoinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
      sharedCoinMat = new THREE.MeshToonMaterial({ 
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
      });
    }
    
    const coinObj = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
    coinObj.castShadow = false;
    coinObj.position.set(laneX, 1, targetZ);
    
    ctx.scene.add(coinObj);
    const spawnX = coinObj.position.x;
    const spawnZ = coinObj.position.z;
    
    let hasOverlap = false;
    for (const obs of ctx.obstacles) {
      if (obs.mesh && obs.mesh.position) {
        const dx = spawnX - obs.mesh.position.x;
        const dz = spawnZ - obs.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < 1.8) {
          hasOverlap = true;
          break;
        }
      }
    }
    
    if (hasOverlap) {
      ctx.scene.remove(coinObj);
      return;
    }
    
    coinObj.position.y += getSurfaceY(targetZ);
    coinObj.baseY = coinObj.position.y - getSurfaceY(targetZ);
    ctx.coins.push({ mesh: coinObj, lane, collected: false });
  };

  const spawnPowerup = () => {
    const ctx = getCtx();
    if (ctx.bossWarning || ctx.bossActive) return;
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * laneWidth;
    const targetZ = findSafeZ(lane, -50, 6.0);
    const type = Math.random() < 0.33 ? 'shield' : (Math.random() < 0.5 ? 'coldDrink' : 'magnet');
    
    const powerupGroup = new THREE.Group();
    
    if (type === 'shield') {
      const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const orbMat = new THREE.MeshToonMaterial({ 
        color: 0x00bfff, 
        emissive: 0x00bfff, 
        emissiveIntensity: 0.5,
        transparent: true, 
        opacity: 0.8 
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      powerupGroup.add(orb);
      
      const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00bfff, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      powerupGroup.add(ring);
    } else if (type === 'coldDrink') {
      const canGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
      const canMat = new THREE.MeshToonMaterial({ 
        color: 0xff4444, 
        emissive: 0xff4444, 
        emissiveIntensity: 0.3 
      });
      const can = new THREE.Mesh(canGeo, canMat);
      
      const labelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 16);
      const labelMat = new THREE.MeshToonMaterial({ color: 0xffffff });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.y = 0.1;
      can.add(label);
      
      const topGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
      const topMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.45;
      can.add(top);
      can.rotation.x = Math.PI / 2;
      powerupGroup.add(can);
    } else if (type === 'magnet') {
      const magnetGroup = new THREE.Group();
      
      const horseshoeGeo = new THREE.TorusGeometry(0.5, 0.12, 8, 24, Math.PI);
      const horseshoeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
      const horseshoe = new THREE.Mesh(horseshoeGeo, horseshoeMat);
      horseshoe.rotation.z = -Math.PI / 2;
      magnetGroup.add(horseshoe);
      
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
      const redMat = new THREE.MeshToonMaterial({ color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 0.4 });
      const redPole = new THREE.Mesh(poleGeo, redMat);
      redPole.position.set(-0.5, 0, 0);
      redPole.rotation.x = Math.PI / 2;
      magnetGroup.add(redPole);
      
      const bluePole = new THREE.Mesh(poleGeo, new THREE.MeshToonMaterial({ color: 0x3333ff, emissive: 0x3333ff, emissiveIntensity: 0.4 }));
      bluePole.position.set(0.5, 0, 0);
      bluePole.rotation.x = Math.PI / 2;
      magnetGroup.add(bluePole);
      
      powerupGroup.add(magnetGroup);
    }
    
    powerupGroup.position.set(laneX, 1 + getSurfaceY(targetZ), targetZ);
    powerupGroup.userData = { type };
    powerupGroup.baseY = 1;
    ctx.scene.add(powerupGroup);
    ctx.powerups.push({ mesh: powerupGroup, lane, type, collected: false });
  };

  const spawnBonusPortal = (portalType) => {
    const ctx = getCtx();
    if (ctx.bossWarning || ctx.bossActive) return;
    if (ctx.bonusPortalSpawned) return;
    ctx.bonusPortalSpawned = true;
    
    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * laneWidth;
    const targetZ = findSafeZ(lane, -50, 6.0);
    
    const portalGroup = new THREE.Group();
    
    const ringGeo = new THREE.TorusGeometry(1.5, 0.15, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'portal-ring';
    portalGroup.add(ring);
    
    const innerGeo = new THREE.CircleGeometry(1.4, 32);
    const innerColor = portalType === 'showroom' ? 0xff69b4 : 0xff00ff;
    const innerMat = new THREE.MeshBasicMaterial({ color: innerColor, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.name = 'portal-inner';
    portalGroup.add(inner);
    
    for (let i = 0; i < 8; i++) {
      const sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);
      const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x0000ff, 0x8800ff, 0xff00ff];
      const sparkMat = new THREE.MeshBasicMaterial({ color: colors[i] });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      const angle = (i / 8) * Math.PI * 2;
      spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
      spark.name = 'spark-' + i;
      portalGroup.add(spark);
    }
    
    portalGroup.position.set(laneX, 1.5, targetZ);
    portalGroup.userData = { lane };
    ctx.scene.add(portalGroup);
    ctx.bonusPortal = { mesh: portalGroup, lane };
  };

  const createParticleEffect = (position, color, count = 10) => {
    const ctx = getCtx();
    const particleGeo = new THREE.SphereGeometry(0.1, 4, 4);
    const particleMat = new THREE.MeshBasicMaterial({ color });
    
    for (let i = 0; i < count; i++) {
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(position);
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3 + 0.2,
        (Math.random() - 0.5) * 0.3
      );
      particle.life = 1.0;
      ctx.scene.add(particle);
      ctx.particles.push(particle);
    }
  };

  const createFloatingText = (text, position, color) => {
    const ctx = getCtx();
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.font = 'bold 64px Arial';
    canvasCtx.fillStyle = color || 'white';
    canvasCtx.strokeStyle = 'black';
    canvasCtx.lineWidth = 4;
    canvasCtx.textAlign = 'center';
    canvasCtx.strokeText(text, 256, 80);
    canvasCtx.fillText(text, 256, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(4, 1, 1);
    sprite.userData = { life: 2.0, velocity: new THREE.Vector3(0, 0.5, 0) };
    ctx.scene.add(sprite);
    ctx.floatingTexts.push(sprite);
  };

  return {
    spawnObstacle,
    spawnFloatingObstacle,
    spawnCoin,
    spawnPowerup,
    spawnBonusPortal,
    createParticleEffect,
    createFloatingText,
    checkOverlap
  };
}
