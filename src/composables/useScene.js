import * as THREE from 'three';

/**
 * Creates a group of star meshes and adds them to the scene
 * @param {THREE.Scene} scene - The scene to add stars to
 */
export function createStars(scene) {
  const starsGroup = new THREE.Group();
  starsGroup.name = 'stars';
  
  const starGeo = new THREE.SphereGeometry(0.1, 4, 4);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  for (let i = 0; i < 200; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(
      (Math.random() - 0.5) * 100,
      20 + Math.random() * 30,
      (Math.random() - 0.5) * 100 - 30
    );
    starsGroup.add(star);
  }
  
  scene.add(starsGroup);
}

/**
 * Creates cloud groups and adds them to the scene
 * @param {THREE.Scene} scene - The scene to add clouds to
 * @param {Array} clouds - Array to store cloud references
 */
export function createClouds(scene, clouds) {
  const cloudMat = new THREE.MeshToonMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.75 
  });
  const shadowMat = new THREE.MeshToonMaterial({ 
    color: 0xdddddd, 
    transparent: true, 
    opacity: 0.5 
  });
  
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();
    // Cumulus cloud: larger center puff, smaller side puffs, arranged horizontally
    const mainSize = 1.0 + Math.random() * 0.8;
    const puffCount = 4 + Math.floor(Math.random() * 4);
    
    // Main large center puff
    const mainGeo = new THREE.SphereGeometry(mainSize, 10, 8);
    const main = new THREE.Mesh(mainGeo, cloudMat);
    main.position.set(0, 0, 0);
    main.scale.set(1.4, 0.9, 1.0);
    cloud.add(main);
    
    // Bottom shadow puff
    const shadowGeo = new THREE.SphereGeometry(mainSize * 0.9, 8, 6);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, -mainSize * 0.3, 0);
    shadow.scale.set(1.5, 0.4, 1.1);
    cloud.add(shadow);
    
    // Side puffs arranged horizontally
    for (let j = 1; j < puffCount; j++) {
      const sideSize = mainSize * (0.4 + Math.random() * 0.5);
      const sideGeo = new THREE.SphereGeometry(sideSize, 8, 6);
      const side = new THREE.Mesh(sideGeo, cloudMat);
      const direction = j % 2 === 0 ? 1 : -1;
      const xOffset = direction * (mainSize * 0.6 + (j * 0.5) + Math.random() * 0.5);
      const yOffset = (Math.random() - 0.5) * mainSize * 0.4;
      const zOffset = (Math.random() - 0.5) * mainSize * 0.5;
      side.position.set(xOffset, yOffset, zOffset);
      side.scale.set(1.2, 0.8, 1.0);
      cloud.add(side);
    }
    
    // Top bumps for fluffy look
    for (let k = 0; k < 2; k++) {
      const bumpSize = mainSize * (0.3 + Math.random() * 0.3);
      const bumpGeo = new THREE.SphereGeometry(bumpSize, 8, 6);
      const bump = new THREE.Mesh(bumpGeo, cloudMat);
      bump.position.set(
        (Math.random() - 0.5) * mainSize,
        mainSize * 0.5 + Math.random() * mainSize * 0.3,
        (Math.random() - 0.5) * mainSize * 0.4
      );
      bump.scale.set(1.0, 0.8, 1.0);
      cloud.add(bump);
    }
    
    const scale = 1.0 + Math.random() * 1.5;
    cloud.scale.setScalar(scale);
    cloud.position.set(
      (Math.random() - 0.5) * 50,
      14 + Math.random() * 6,
      -Math.random() * 60
    );
    cloud.castShadow = false;
    scene.add(cloud);
    clouds.push(cloud);
  }
}

/**
 * Creates background elements (buildings and trees) and adds them to the scene
 * @param {Object} params - Parameters object
 * @param {THREE.Scene} params.scene - The scene to add elements to
 * @param {THREE.TextureLoader} params.textureLoader - Texture loader for loading assets
 * @param {Function} params.getSurfaceY - Function to get surface Y position at a given Z
 * @param {Array} params.buildings - Array to store building references
 * @param {Array} params.trees - Array to store tree references
 */
export function createBackgroundElements({ scene, textureLoader, getSurfaceY, buildings, trees }) {
  // Priority texture loading: most visible objects first
  // 1. Building facades (most visible, darkest when missing)
  const buildingTextures = [
    textureLoader.load('assets/building_pink.webp'),
    textureLoader.load('assets/building_blue.webp'),
    textureLoader.load('assets/building_green.webp'),
  ];
  // Medieval fachwerkhaus texture
  let fachwerkTexture = null;
  const loadFachwerk = () => {
    if (!fachwerkTexture) {
      fachwerkTexture = textureLoader.load('assets/building_fachwerk.webp');
      fachwerkTexture.wrapS = THREE.RepeatWrapping;
      fachwerkTexture.wrapT = THREE.RepeatWrapping;
      fachwerkTexture.colorSpace = THREE.SRGBColorSpace;
    }
    return fachwerkTexture;
  };
  // Set dominant colors as fallback so buildings don't appear dark before texture loads
  const buildingDominantColors = [0xffb6c1, 0x87ceeb, 0x98fb98]; // pink, blue, green
  buildingTextures.forEach((tex, idx) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
  });
  // 2. Trees (billboard sprites) — grass already loaded above
  const treeRoundTex = textureLoader.load('assets/tree_round_clean.webp');
  const treePineTex = textureLoader.load('assets/tree_pine_clean.webp');
  
  for (let i = 0; i < 20; i++) {
    const isPine = Math.random() > 0.5;
    const treeTex = isPine ? treePineTex : treeRoundTex;
    const treeH = isPine ? 5.6 : 4.8;
    const treeW = isPine ? 3.2 : 4.0;
    
    // Billboard tree sprite (always faces camera)
    const spriteMat = new THREE.SpriteMaterial({ 
      map: treeTex, 
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    // Offset sprite up so bottom of visible content aligns with ground
    // Tree textures have ~12% bottom padding — shift center up by half
    sprite.scale.set(treeW, treeH, 1);
    
    const tree = new THREE.Group();
    tree.add(sprite);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    const treeZ = -10 - Math.random() * 30;
    const treeScale = 0.7 + Math.random() * 0.3;
    tree.scale.setScalar(treeScale);
    const treeBaseY = (treeH / 2) * treeScale;
    tree.position.set(
      side * (8 + Math.random() * 10),
      treeBaseY + getSurfaceY(treeZ),
      treeZ
    );
    tree.baseY = treeBaseY;
    tree.baseX = tree.position.x; // store for road curve
    // Store initial position for restart
    tree.userData.initX = tree.position.x;
    tree.userData.initZ = treeZ;
    tree.userData.initBaseX = tree.baseX;
    scene.add(tree);
    trees.push(tree);
  }
  
  // buildingTextures and buildingDominantColors loaded above
  const buildingColors = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd, 0xffa07a, 0xadd8e6];
  
  for (let i = 0; i < 12; i++) {
    const height = 5 + Math.random() * 10;
    const width = 3 + Math.random() * 4;
    const buildingGroup = new THREE.Group();
    
    // Use AI texture on front face, color on sides/back
    const texIdx = Math.floor(Math.random() * buildingTextures.length);
    const facadeTex = buildingTextures[texIdx];
    const facadeDominant = buildingDominantColors[texIdx]; // fallback color before texture loads
    const buildingGeo = new THREE.BoxGeometry(width, height, width);
    // Determine side early so we can texture the camera-visible face
    const side = Math.random() > 0.5 ? 1 : -1;
    // Multi-material: +X right, -X left, +Y top, -Y bottom, +Z front, -Z back
    // Camera-visible side gets facade texture
    const sideMat = new THREE.MeshToonMaterial({
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
    });
    const frontMat = new THREE.MeshToonMaterial({
      map: facadeTex,
      color: facadeDominant
    });
    const topMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const buildingMats = side < 0
      ? [frontMat, sideMat, topMat, topMat, frontMat, sideMat]  // left building: +X face visible
      : [sideMat, frontMat, topMat, topMat, frontMat, sideMat]  // right building: -X face visible
    const building = new THREE.Mesh(buildingGeo, buildingMats);
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    
    // Rooftop detail
    const roofGeo = new THREE.BoxGeometry(width + 0.3, 0.3, width + 0.3);
    const roofMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height / 2 + 0.15;
    buildingGroup.add(roof);
    
    const bldgZ = -20 - Math.random() * 60;
    buildingGroup.position.set(
      side * (10 + Math.random() * 10),
      height / 2 + getSurfaceY(bldgZ),
      bldgZ
    );
    scene.add(buildingGroup);
    buildingGroup.baseY = height / 2;
    buildingGroup.baseX = buildingGroup.position.x; // store for road curve
    // Store initial position for restart
    buildingGroup.userData.initX = buildingGroup.position.x;
    buildingGroup.userData.initZ = bldgZ;
    buildingGroup.userData.initBaseX = buildingGroup.baseX;
    buildings.push(buildingGroup);
  }
};

/**
 * Creates the ground/road/grass/curbs with procedural textures
 * @param {Object} params - Parameters object
 * @param {THREE.Scene} params.scene - The scene to add elements to
 * @param {THREE.TextureLoader} params.textureLoader - Texture loader for loading assets
 * @param {Function} params.getSurfaceY - Function to get surface Y position at a given Z
 * @returns {Object} Object containing ground mesh references
 */
export function createGround({ scene, textureLoader, getSurfaceY }) {
  // Create detailed cartoon road texture with lane markings
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Base asphalt color
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 512, 1024);
  
  // Add noise/texture
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
  }
  
  // Dashed center line
  ctx.strokeStyle = '#ffdd00';
  ctx.lineWidth = 6;
  ctx.setLineDash([40, 30]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 1024);
  ctx.stroke();
  
  // Side lines (solid white)
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(85, 0);
  ctx.lineTo(85, 1024);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(427, 0);
  ctx.lineTo(427, 1024);
  ctx.stroke();
  
  const groundTexture = new THREE.CanvasTexture(canvas);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(1, 10);
  
  const groundGeo = new THREE.PlaneGeometry(15, 200, 1, 60); // 60 segments for smooth curve
  // Bend the road to follow the earth curve
  const gPos = groundGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const py = gPos.getY(i); // in plane local space, Y is the long axis
    const worldZ = -py - 50; // center at z=-50, so py=0 → z=-50, py=100 → z=-150
    const yOffset = getSurfaceY(worldZ);
    gPos.setZ(i, gPos.getZ(i) + yOffset); // Z in plane = Y in world after rotation
  }
  gPos.needsUpdate = true;
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshToonMaterial({ 
    map: groundTexture,
    color: 0x555555
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; // flat road - curve is via object positions
  ground.position.set(0, 0, -50);
  ground.receiveShadow = false;
  ground.name = 'road';
  scene.add(ground);
  
  // Save original vertex positions for curve animation
  const roadOrigPositions = new Float32Array(gPos.array.length);
  roadOrigPositions.set(gPos.array);
  
  // Add colorful grass borders with AI texture
  // Priority load: grass (large surface area)
  const grassTileTex = textureLoader.load('assets/grass_tile.webp');
  grassTileTex.wrapS = THREE.RepeatWrapping;
  grassTileTex.wrapT = THREE.RepeatWrapping;
  grassTileTex.repeat.set(10, 25);
  grassTileTex.colorSpace = THREE.SRGBColorSpace;
  const grassGeo = new THREE.PlaneGeometry(80, 200, 1, 60); // curve match
  const gPosG = grassGeo.attributes.position;
  for (let i = 0; i < gPosG.count; i++) {
    const py = gPosG.getY(i);
    const worldZ = -py - 50;
    const yOffset = getSurfaceY(worldZ);
    gPosG.setZ(i, gPosG.getZ(i) + yOffset);
  }
  gPosG.needsUpdate = true;
  grassGeo.computeVertexNormals();
  const grassMat = new THREE.MeshToonMaterial({ 
    map: grassTileTex,
    color: 0x8bc34a 
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.1, -50); // just below road
  grass.receiveShadow = false;
  scene.add(grass);
  
  const grassOrigPositions = new Float32Array(gPosG.array.length);
  grassOrigPositions.set(gPosG.array);
  
  // Road edge curbs (curved to match earth)
  const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 200, 1, 1, 60); // 60 segments for curve
  const curbMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
  // Curve curb vertices
  const curbPos = curbGeo.attributes.position;
  for (let i = 0; i < curbPos.count; i++) {
    const cz = curbPos.getZ(i);
    const worldZ = cz - 50; // same offset as road center
    curbPos.setY(i, curbPos.getY(i) + getSurfaceY(worldZ));
  }
  curbPos.needsUpdate = true;
  curbGeo.computeVertexNormals();
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-7.5, 0.07, -50);
  leftCurb.receiveShadow = false;
  scene.add(leftCurb);
  
  const leftCurbOrigPositions = new Float32Array(curbPos.array.length);
  leftCurbOrigPositions.set(curbPos.array);
  
  const rightCurb = new THREE.Mesh(curbGeo.clone(), curbMat.clone());
  rightCurb.position.set(7.5, 0.07, -50);
  rightCurb.receiveShadow = false;
  scene.add(rightCurb);
  
  const rightCurbOrigPositions = new Float32Array(curbPos.array.length);
  rightCurbOrigPositions.set(curbPos.array);
  
  return {
    groundTexture,
    roadMesh: ground,
    grassMesh: grass,
    leftCurbMesh: leftCurb,
    rightCurbMesh: rightCurb,
    roadOrigPositions,
    grassOrigPositions,
    leftCurbOrigPositions,
    rightCurbOrigPositions
  };
}

/**
 * Updates road, grass, and curb mesh vertices based on the current road curve
 * @param {Object} params - Parameters object
 * @param {THREE.Mesh} params.roadMesh - The road mesh
 * @param {THREE.Mesh} params.grassMesh - The grass mesh
 * @param {THREE.Mesh} params.leftCurbMesh - The left curb mesh
 * @param {THREE.Mesh} params.rightCurbMesh - The right curb mesh
 * @param {Float32Array} params.roadOrigPositions - Original road vertex positions
 * @param {Float32Array} params.grassOrigPositions - Original grass vertex positions
 * @param {Float32Array} params.leftCurbOrigPositions - Original left curb vertex positions
 * @param {Float32Array} params.rightCurbOrigPositions - Original right curb vertex positions
 * @param {Function} params.getCurveX - Function to get curve X offset for a given worldZ
 */
export function updateRoadCurve({ roadMesh, grassMesh, leftCurbMesh, rightCurbMesh, roadOrigPositions, grassOrigPositions, leftCurbOrigPositions, rightCurbOrigPositions, getCurveX }) {
  // Bend road/grass/curb mesh vertices based on current roadCurve
  // Each vertex's X offset = getCurveX(worldZ) where worldZ depends on vertex position
  
  if (roadMesh && roadOrigPositions) {
    const pos = roadMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origY = roadOrigPositions[i * 3 + 1]; // Y in plane local = Z axis (long)
      const worldZ = -origY - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, roadOrigPositions[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    roadMesh.geometry.computeVertexNormals();
  }
  
  if (grassMesh && grassOrigPositions) {
    const pos = grassMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origY = grassOrigPositions[i * 3 + 1];
      const worldZ = -origY - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, grassOrigPositions[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    grassMesh.geometry.computeVertexNormals();
  }
  
  // Curbs: vertices are in a BoxGeometry with Z as the long axis
  // Need to also clone for right curb since they share geometry originally
  const applyCurbCurve = (mesh, origPos) => {
    if (!mesh || !origPos) return;
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origZ = origPos[i * 3 + 2]; // Z in box = long axis
      const worldZ = origZ - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, origPos[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  };
  applyCurbCurve(leftCurbMesh, leftCurbOrigPositions);
  applyCurbCurve(rightCurbMesh, rightCurbOrigPositions);
}

/**
 * Updates the day/night cycle with sky color interpolation, stars visibility, and lighting
 * @param {Object} params - Parameters object
 * @param {number} params.delta - Delta time
 * @param {number} params.dayCycleTime - Current day cycle time
 * @param {number} params.DAY_DURATION - Total day cycle duration
 * @param {THREE.Scene} params.scene - The scene
 * @param {Object} params.skyBlendFactorRef - Ref object for sky blend factor { value }
 * @param {Object} params.currentSkyTexRef - Ref object for current sky texture { value }
 * @param {Object} params.prevSkyTexRef - Ref object for previous sky texture { value }
 * @param {Object} params.skyTextures - Sky textures object
 * @param {Object} params.gameStats - Game stats object
 * @param {Function} params.checkAchievements - Check achievements function
 */
export function updateDayNightCycle({ delta, dayCycleTime, DAY_DURATION, scene, skyBlendFactorRef, currentSkyTexRef, prevSkyTexRef, skyTextures, gameStats, checkAchievements }) {
  const cycleProgress = dayCycleTime / DAY_DURATION; // 0 to 1
  
  // 4 stages: sunny(0-0.25), sunset(0.25-0.5), night(0.5-0.75), sunrise(0.75-1.0)
  // Each stage 30s, 5s transition blend between stages
  const TRANSITION = 5 / DAY_DURATION; // 5s as fraction of cycle
  
  // Sky color interpolation with smooth blending
  let skyColor, fogColor;
  const dayColor = new THREE.Color(0x87ceeb);
  const sunsetColor = new THREE.Color(0xff7f50);
  const nightColor = new THREE.Color(0x0a0a2e);
  const sunriseColor = new THREE.Color(0xffb6c1);
  
  // Helper: get stage colors at progress within stage
  const getStageBlend = (progress) => {
    if (progress < 0.25) {
      // Sunny -> Sunset
      const t = progress / 0.25;
      const blendT = Math.min(1, t / (0.25 * TRANSITION * 4));
      return { skyColor: dayColor.clone().lerp(sunsetColor, t), fogColor: null };
    } else if (progress < 0.5) {
      const t = (progress - 0.25) / 0.25;
      return { skyColor: sunsetColor.clone().lerp(nightColor, t), fogColor: null };
    } else if (progress < 0.75) {
      const t = (progress - 0.5) / 0.25;
      return { skyColor: nightColor.clone().lerp(sunriseColor, t), fogColor: null };
    } else {
      const t = (progress - 0.75) / 0.25;
      return { skyColor: sunriseColor.clone().lerp(dayColor, t), fogColor: null };
    }
  };
  
  const stageInfo = getStageBlend(cycleProgress);
  skyColor = stageInfo.skyColor;
  fogColor = skyColor.clone();
  
  scene.background = skyColor;
  scene.fog.color = fogColor;
  
  // Sky texture crossfade using skyBlendFactor
  // Determine current and next sky textures based on cycle progress
  let currentSkyStage, nextSkyStage, blendT;
  const stageKeys = ['sunny', 'sunset', 'night', 'sunset']; // sunrise reuses sunset texture
  const stageBoundaries = [0, 0.25, 0.5, 0.75];
  
  let stageIdx = 0;
  for (let i = stageBoundaries.length - 1; i >= 0; i--) {
    if (cycleProgress >= stageBoundaries[i]) {
      stageIdx = i;
      break;
    }
  }
  
  const stageStart = stageBoundaries[stageIdx];
  const stageEnd = stageIdx < 3 ? stageBoundaries[stageIdx + 1] : 1.0;
  const stageLen = stageEnd - stageStart;
  const stageProgress = (cycleProgress - stageStart) / stageLen;
  
  // Blend factor: smooth transition in last 5s of each stage
  const transitionFraction = 5 / 30; // 5s out of 30s stage
  if (stageProgress > (1 - transitionFraction)) {
    skyBlendFactorRef.value = (stageProgress - (1 - transitionFraction)) / transitionFraction;
    skyBlendFactorRef.value = skyBlendFactorRef.value * skyBlendFactorRef.value * (3 - 2 * skyBlendFactorRef.value); // smoothstep
  } else {
    skyBlendFactorRef.value = 0;
  }
  
  currentSkyTexRef.value = skyTextures[stageKeys[stageIdx]] || null;
  nextSkyStage = stageKeys[(stageIdx + 1) % 4];
  // Map sunrise stage (0.75-1.0) back to sunny texture at the end
  if (stageIdx === 3) nextSkyStage = 'sunny';
  prevSkyTexRef.value = skyTextures[nextSkyStage] || null;
  
  // If we have sky textures and blend is active, mix them
  if (currentSkyTexRef.value && prevSkyTexRef.value && skyBlendFactorRef.value > 0) {
    // Create a blended background using scene background color mixed with textures
    // We'll use a fullscreen overlay approach via scene.background
    // Since Three.js doesn't support texture blending natively in scene.background,
    // we blend the sky colors (which we already do) and just set the dominant texture
    const dominantTex = skyBlendFactorRef.value > 0.5 ? prevSkyTexRef.value : currentSkyTexRef.value;
    scene.background = dominantTex;
  } else if (currentSkyTexRef.value) {
    scene.background = currentSkyTexRef.value;
  } else {
    scene.background = skyColor;
  }
  
  scene.fog.color = fogColor;
  
  // Track night time for achievements
  if (cycleProgress > 0.35 && cycleProgress < 0.65) {
    gameStats.nightTime += delta;
    checkAchievements();
  }
  
  // Adjust lighting
  const directionalLight = scene.children.find(c => c.isDirectionalLight);
  if (directionalLight) {
    directionalLight.intensity = cycleProgress > 0.25 && cycleProgress < 0.75 ? 0.5 : 1.0;
  }
  
  // Stars at night
  if (!scene.userData.starsCreated && (cycleProgress > 0.35 || cycleProgress < 0.15)) {
    createStars(scene);
    scene.userData.starsCreated = true;
  } else if (scene.userData.starsCreated && cycleProgress >= 0.15 && cycleProgress <= 0.35) {
    const stars = scene.getObjectByName('stars');
    if (stars) {
      scene.remove(stars);
      scene.userData.starsCreated = false;
    }
  }
}

/**
 * Updates road curve oscillation - handles curve generation and sweeping front animation
 * @param {Object} params - Parameters object
 * @param {boolean} params.bossActive - Whether boss is currently active
 * @param {boolean} params.roadCurveEnabled - Whether road curves are enabled
 * @param {number} params.curveChangeTimer - Timer for curve changes
 * @param {number} params.nextCurveChange - Time until next curve change
 * @param {number} params.roadCurve - Current road curve value
 * @param {number} params.roadCurveTarget - Target road curve value
 * @param {number} params.curveFrontZ - Z position of curve front
 * @param {number} params.realDelta - Delta time
 * @returns {Object} Updated curve state { curveChangeTimer, nextCurveChange, roadCurveTarget, roadCurve, curveFrontZ }
 */
export function updateRoadCurveOscillation({ bossActive, roadCurveEnabled, curveChangeTimer, nextCurveChange, roadCurve, roadCurveTarget, curveFrontZ, realDelta }) {
  // Curve front sweeps from horizon toward player so you can see it approaching
  if (!bossActive && roadCurveEnabled) {
    curveChangeTimer += realDelta
    if (curveChangeTimer >= nextCurveChange) {
      if (Math.abs(roadCurveTarget) < 0.1) {
        // Start a new curve — front starts at horizon
        roadCurveTarget = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6)
        curveFrontZ = -80 // front starts at horizon, sweeps toward player
        nextCurveChange = 2.5 + Math.random() * 1.5
      } else {
        // Straighten out — when straight, curve doesn't need a front
        roadCurveTarget = 0
        nextCurveChange = 5 + Math.random() * 5
      }
      curveChangeTimer = 0
    }
    // Lerp curve value
    const lerpSpeed = Math.abs(roadCurveTarget) > 0.1 ? Math.min(realDelta * 1.5, 0.1) : Math.min(realDelta * 0.8, 0.05)
    roadCurve += (roadCurveTarget - roadCurve) * lerpSpeed
    // Sweep curve front toward player (0 = right at player)
    // Front moves at road speed so the bend visually approaches
    if (curveFrontZ < 0) {
      curveFrontZ += realDelta * 25 // takes ~3.2 seconds to sweep from -80 to 0
      if (curveFrontZ > 0) curveFrontZ = 0
    }
  } else {
    roadCurve += (0 - roadCurve) * Math.min(realDelta * 1.0, 0.06)
  }
  
  return { curveChangeTimer, nextCurveChange, roadCurveTarget, roadCurve, curveFrontZ }
}
