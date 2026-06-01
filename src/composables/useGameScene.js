import * as THREE from 'three';
import { STAGES } from '../data/stages.js';
import { EARTH_R, DAY_DURATION, laneWidth, FOG_COLOR, FOG_NEAR, FOG_FAR } from '../gameConstants.js';
import { 
  createClouds as _createClouds, 
  createStars as _createStars, 
  createMedievalFlowers as _createMedievalFlowers, 
  cleanupMedievalFlowers as _cleanupMedievalFlowers 
} from '../utils/sceneHelpers.js';

/**
 * Game scene composable — handles scene creation, textures, day/night cycle, visual effects.
 * 
 * @param {Object} deps
 * @param {Object} deps.store - Shared reactive game store
 * @param {Function} deps.trackTexture - Track texture loading function
 * @param {Function} deps.onTextureLoaded - Texture loaded callback
 * @param {Ref} deps.currentSkin - Current skin ref (from useAchievements)
 * @param {Ref} deps.currentHat - Current hat ref (from useAchievements)
 * @param {Object} deps.gameStats - Game stats object (from useAchievements)
 * @param {Function} deps.checkAchievements - Check achievements function
 */
export function useGameScene({
  store,
  trackTexture,
  onTextureLoaded,
  currentSkin,
  currentHat,
  gameStats,
  checkAchievements
}) {
  // Functions accessed via store (wired in App.vue after init):
  // store.getSurfaceY, store.getCurveX, store.switchBGMTrack
  // store.currentStage, store.roadCurveEnabled, store.roadCurve accessed directly {
  let buildingTextures = [];
  let buildingDominantColors = [];
  let cobblestoneTexture = null;
  let grassTileTex = null;
  let originalGroundTexture = null;
  let originalGroundColor = null;
  let originalRoadMaterial = null;
  let fachwerkTexture = null;
  let stage3Textures = {};
  let textureLoader = new THREE.TextureLoader();
  let textureCache = {};
  let skyTextures = {};
  let mountainMesh = null;

  // Cloud colors
  const cloudWhiteColor = new THREE.Color(0xffffff);
  const cloudNightColor = new THREE.Color(0x667788);
  const cloudSunsetColor = new THREE.Color(0xff8866);

  const loadTexture = (path, callback) => {
    if (textureCache[path]) {
      if (callback) callback(textureCache[path]);
      return textureCache[path];
    }
    trackTexture();
    const tex = textureLoader.load(path, () => {
      onTextureLoaded();
      if (callback) callback(tex);
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[path] = tex;
    return tex;
  };

  const preloadStageTextures = (stageId) => {
    const manifest = STAGE_TEXTURES[stageId];
    if (!manifest) return;
    
    const allTextures = [
      ...(manifest.trees || []),
      ...(manifest.buildings || []),
      ...(manifest.misc || []),
      ...(manifest.road ? [manifest.road] : []),
      ...(manifest.pavement ? [manifest.pavement] : []),
      ...(manifest.sky || [])
    ];
    
    allTextures.forEach(path => loadTexture(path));
  };

  const STAGE_TEXTURES = {
    1: {
      name: 'Modern Highway',
      trees: ['assets/tree_round_clean.webp', 'assets/tree_pine_clean.webp'],
      buildings: ['assets/building_pink.webp', 'assets/building_blue.webp', 'assets/building_green.webp'],
      road: null,
      sky: ['assets/sky_sunny.webp'],
      misc: ['assets/mountains.webp', 'assets/grass_tile.webp']
    },
    2: {
      name: 'Medieval Path',
      trees: ['assets/tree_round_clean.webp', 'assets/tree_pine_clean.webp'],
      buildings: ['assets/building_fachwerk.webp'],
      road: 'assets/road_cobblestone.webp',
      sky: ['assets/sky_sunset.webp'],
      misc: ['assets/stage2/brick-wall-layered.png']
    },
    3: {
      name: 'Concrete Jungle',
      trees: [],
      buildings: ['assets/stage3/skyscraper-glass.png'],
      road: 'assets/stage3/road_concrete_asphalt.png',
      pavement: 'assets/stage3/pavement_concrete.png',
      sky: ['assets/sky_night.webp'],
      misc: [
        'assets/stage3/trafficCone.png',
        'assets/stage3/dumpster.png',
        'assets/stage3/scaffoldTower.png',
        'assets/stage3/concreteBarrier.png',
        'assets/stage3/billboard.png',
        'assets/stage3/obstacle-metal-beam.png',
        'assets/stage3/boss_spaghetti_meatball.png'
      ]
    }
  };

  const loadFachwerk = (callback) => {
    if (fachwerkTexture) {
      if (callback) callback(fachwerkTexture);
      return fachwerkTexture;
    }
    fachwerkTexture = loadTexture('assets/building_fachwerk.webp', () => {
      if (callback) callback(fachwerkTexture);
    });
    return fachwerkTexture;
  };

  const applyFachwerkToBuildings = () => {
    const buildings = store.buildings;
    if (!buildings.length || !fachwerkTexture) return;
    buildings.forEach(b => {
      const mesh = b.children.find(c => c.isMesh);
      if (mesh && mesh.material && Array.isArray(mesh.material)) {
        for (const idx of [0, 1, 4]) {
          if (mesh.material[idx] && mesh.material[idx].map) {
            mesh.material[idx].map = fachwerkTexture;
            mesh.material[idx].color.set(0xd4c4a0);
            mesh.material[idx].needsUpdate = true;
          }
        }
      }
    });
  };

  const loadStage3Textures = () => {
    if (Object.keys(stage3Textures).length > 0) return;
    const textureBase = 'assets/stage3/';
    stage3Textures.trafficCone = textureLoader.load(textureBase + 'trafficCone.png');
    stage3Textures.trafficCone.colorSpace = THREE.SRGBColorSpace;
    stage3Textures.dumpster = textureLoader.load(textureBase + 'dumpster.png');
    stage3Textures.dumpster.colorSpace = THREE.SRGBColorSpace;
    stage3Textures.scaffoldTower = textureLoader.load(textureBase + 'scaffoldTower.png');
    stage3Textures.scaffoldTower.colorSpace = THREE.SRGBColorSpace;
    stage3Textures.concreteBarrier = textureLoader.load(textureBase + 'concreteBarrier.png');
    stage3Textures.concreteBarrier.colorSpace = THREE.SRGBColorSpace;
    stage3Textures.billboard = textureLoader.load(textureBase + 'billboard.png');
    stage3Textures.billboard.colorSpace = THREE.SRGBColorSpace;
    stage3Textures.metalBeam = textureLoader.load(textureBase + 'obstacle-metal-beam.webp');
    stage3Textures.metalBeam.colorSpace = THREE.SRGBColorSpace;
  };

  const applyStage3FacadeToBuildings = () => {
    const buildings = store.buildings;
    if (!buildings.length || !stage3Textures.building) return;
    buildings.forEach((b, i) => {
      const mesh = b.children.find(c => c.isMesh);
      if (mesh && mesh.material && Array.isArray(mesh.material)) {
        for (const idx of [0, 1, 4]) {
          if (mesh.material[idx] && mesh.material[idx].map) {
            mesh.material[idx].map = stage3Textures.building;
            mesh.material[idx].color.set(0xffffff);
            mesh.material[idx].needsUpdate = true;
          }
        }
      }
    });
  };

  const cleanupBackgroundElements = () => {
    if (!store) return;
    
    const disposeNode = (node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach(m => m.dispose());
        } else {
          node.material.dispose();
        }
      }
    };

    if (store.trees) {
      store.trees.forEach(t => {
        t.traverse(disposeNode);
        store.scene.remove(t);
      });
      store.trees.length = 0;
    }

    if (store.buildings) {
      store.buildings.forEach(b => {
        b.traverse(disposeNode);
        store.scene.remove(b);
      });
      store.buildings.length = 0;
    }
  };

  const createMedievalFlowers = () => {
    _createMedievalFlowers(store.scene, store.medievalFlowers);
  };

  const cleanupMedievalFlowers = () => {
    _cleanupMedievalFlowers(store.medievalFlowers);
  };

  const applyStageVisuals = (stageIndex) => {
    const stage = STAGES[stageIndex];
    const roadMesh = store.roadMesh;
    const grassMesh = store.grassMesh;
    const scene = store.scene;
    
    if (!roadMesh) return;
    
    if (!originalGroundTexture) {
      originalGroundTexture = roadMesh.material.map;
      originalGroundColor = roadMesh.material.color.getHex();
    }

    // Clean up all background elements and flowers first on transition
    cleanupBackgroundElements();
    cleanupMedievalFlowers();

    // Recreate stage-specific background elements fresh from scratch
    createBackgroundElements();
    
    if (stage.roadType === 'cobblestone') {
      preloadStageTextures(2);
      // Assign immediately — Three.js handles pending textures gracefully.
      // The loadTexture cache ensures the same object is reused on re-entry.
      if (!cobblestoneTexture) {
        cobblestoneTexture = loadTexture('assets/road_cobblestone.webp', (tex) => {
          tex.repeat.set(1, 10);
          roadMesh.material.map = tex;
          roadMesh.material.color.set(0xcccccc);
          roadMesh.material.needsUpdate = true;
        });
      }
      cobblestoneTexture.repeat.set(1, 10);
      roadMesh.material.map = cobblestoneTexture;
      roadMesh.material.color.set(0xcccccc);
      roadMesh.material.needsUpdate = true;

      createMedievalFlowers();
      if (grassMesh) {
        grassMesh.material.map = grassTileTex;
        grassMesh.material.color.set(0x2d5a1e);
        grassMesh.material.needsUpdate = true;
      }
      if (scene && scene.fog) { scene.fog.color.set(0x4a5568); scene.background = new THREE.Color(0x4a5568); }
      store.switchBGMTrack('medieval');

    } else if (stage.id === 3) {
      preloadStageTextures(3);
      // Always assign immediately so first-time load works without a restart.
      if (!stage3Textures.road) {
        stage3Textures.road = loadTexture('assets/stage3/road_concrete_asphalt.png', (tex) => {
          tex.repeat.set(1, 10);
          roadMesh.material.map = tex;
          roadMesh.material.color.set(0xffffff);
          roadMesh.material.needsUpdate = true;
        });
      }
      stage3Textures.road.repeat.set(1, 10);
      roadMesh.material.map = stage3Textures.road;
      roadMesh.material.color.set(0xffffff);
      roadMesh.material.needsUpdate = true;

      if (!stage3Textures.pavement) {
        stage3Textures.pavement = loadTexture('assets/stage3/pavement_concrete.png');
      }
      if (grassMesh) {
        grassMesh.material.map = stage3Textures.pavement || grassTileTex;
        grassMesh.material.color.set(0xffffff);
        grassMesh.material.needsUpdate = true;
      }

      if (scene && scene.fog) { scene.fog.color.set(0x8a9a9a); scene.background = new THREE.Color(0x8a9a9a); }
      loadStage3Textures();
      store.switchBGMTrack('highway');

    } else {
      // Stage 1
      if (originalGroundTexture) {
        roadMesh.material.map = originalGroundTexture;
        roadMesh.material.color.set(originalGroundColor || 0x555555);
        roadMesh.material.needsUpdate = true;
      }
      if (grassMesh) {
        grassMesh.material.map = grassTileTex;
        grassMesh.material.color.set(0x8bc34a);
        grassMesh.material.needsUpdate = true;
      }
      if (scene && scene.fog) { scene.fog.color.set(FOG_COLOR); scene.background = new THREE.Color(FOG_COLOR); }
      store.switchBGMTrack('highway');
    }
  };

  const createGround = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const canvasCtx = canvas.getContext('2d');
    
    canvasCtx.fillStyle = '#3a3a3a';
    canvasCtx.fillRect(0, 0, 512, 1024);
    
    for (let i = 0; i < 1000; i++) {
      canvasCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      canvasCtx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
    }
    
    canvasCtx.strokeStyle = '#ffdd00';
    canvasCtx.lineWidth = 6;
    canvasCtx.setLineDash([40, 30]);
    canvasCtx.beginPath();
    canvasCtx.moveTo(256, 0);
    canvasCtx.lineTo(256, 1024);
    canvasCtx.stroke();
    
    canvasCtx.setLineDash([]);
    canvasCtx.strokeStyle = '#ffffff';
    canvasCtx.lineWidth = 4;
    canvasCtx.beginPath();
    canvasCtx.moveTo(85, 0);
    canvasCtx.lineTo(85, 1024);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(427, 0);
    canvasCtx.lineTo(427, 1024);
    canvasCtx.stroke();
    
    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(1, 10);
    store.groundTexture = groundTexture;
    
    const groundGeo = new THREE.PlaneGeometry(15, 200, 1, 60);
    const gPos = groundGeo.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const py = gPos.getY(i);
      const worldZ = -py - 50;
      const yOffset = store.getSurfaceY(worldZ);
      gPos.setZ(i, gPos.getZ(i) + yOffset);
    }
    gPos.needsUpdate = true;
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshToonMaterial({ 
      map: groundTexture,
      color: 0x555555
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -50);
    ground.receiveShadow = false;
    ground.name = 'road';
    store.scene.add(ground);
    store.roadMesh = ground;
    
    store.roadOrigPositions = new Float32Array(gPos.array.length);
    store.roadOrigPositions.set(gPos.array);
    
    trackTexture();
    grassTileTex = textureLoader.load('assets/grass_tile.webp', () => {
      onTextureLoaded();
    });
    grassTileTex.wrapS = THREE.RepeatWrapping;
    grassTileTex.wrapT = THREE.RepeatWrapping;
    grassTileTex.repeat.set(10, 25);
    grassTileTex.colorSpace = THREE.SRGBColorSpace;
    store.grassTileTex = grassTileTex;

    const grassGeo = new THREE.PlaneGeometry(80, 200, 1, 60);
    const gPosG = grassGeo.attributes.position;
    for (let i = 0; i < gPosG.count; i++) {
      const py = gPosG.getY(i);
      const worldZ = -py - 50;
      const yOffset = store.getSurfaceY(worldZ);
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
    grass.position.set(0, -0.1, -50);
    grass.receiveShadow = false;
    store.scene.add(grass);
    store.grassMesh = grass;
    
    store.grassOrigPositions = new Float32Array(gPosG.array.length);
    store.grassOrigPositions.set(gPosG.array);
    
    const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 200, 1, 1, 60);
    const curbMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
    const curbPos = curbGeo.attributes.position;
    for (let i = 0; i < curbPos.count; i++) {
      const cz = curbPos.getZ(i);
      const worldZ = cz - 50;
      curbPos.setY(i, curbPos.getY(i) + store.getSurfaceY(worldZ));
    }
    curbPos.needsUpdate = true;
    curbGeo.computeVertexNormals();
    
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-7.5, 0.07, -50);
    leftCurb.receiveShadow = false;
    store.scene.add(leftCurb);
    store.leftCurbMesh = leftCurb;
    
    store.leftCurbOrigPositions = new Float32Array(curbPos.array.length);
    store.leftCurbOrigPositions.set(curbPos.array);
    
    const rightCurb = new THREE.Mesh(curbGeo.clone(), curbMat.clone());
    rightCurb.position.set(7.5, 0.07, -50);
    rightCurb.receiveShadow = false;
    store.scene.add(rightCurb);
    store.rightCurbMesh = rightCurb;
    
    store.rightCurbOrigPositions = new Float32Array(curbPos.array.length);
    store.rightCurbOrigPositions.set(curbPos.array);
  };

  const createLaneMarkers = () => {
    // Lane markers are in the road texture only
  };

  const createClouds = () => {
    _createClouds(store.scene, store.clouds);
  };

  const createBackgroundElements = () => {
    trackTexture();
    buildingTextures = [
      textureLoader.load('assets/building_pink.webp', () => onTextureLoaded()),
      textureLoader.load('assets/building_blue.webp', () => onTextureLoaded()),
      textureLoader.load('assets/building_green.webp', () => onTextureLoaded()),
    ];
    buildingDominantColors = [0xffb6c1, 0x87ceeb, 0x98fb98];
    buildingTextures.forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
    });

    trackTexture();
    const treeRoundTex = textureLoader.load('assets/tree_round_clean.webp', () => onTextureLoaded());
    trackTexture();
    const treePineTex = textureLoader.load('assets/tree_pine_clean.webp', () => onTextureLoaded());
    
    const isStage3 = store.currentStage === 2;
    const isStage2 = store.currentStage === 1;

    // Load Stage 2 Fachwerk / Stage 3 building textures if needed
    if (isStage2 && !fachwerkTexture) {
      fachwerkTexture = loadTexture('assets/building_fachwerk.webp');
    }
    if (isStage3 && !stage3Textures.building) {
      stage3Textures.building = loadTexture('assets/stage3/building_glass_steel.png');
    }

    const glassTex = isStage3 ? loadTexture('assets/stage3/skyscraper-glass.png') : null;

    // 1. Create trees or skyscrapers
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const treeZ = -10 - (i * 4) - Math.random() * 2;
      const tree = new THREE.Group();

      if (isStage3) {
        // Stage 3 Skyscrapers
        const height = 12 + Math.random() * 8;
        const width = 2 + Math.random();
        const depth = 2 + Math.random();
        const geo = new THREE.BoxGeometry(width, height, depth);
        
        const mat = new THREE.MeshPhysicalMaterial({
          map: glassTex,
          color: new THREE.Color(0x557799).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1),
          metalness: 0.7 + (Math.random() - 0.5) * 0.1,
          roughness: 0.3 + (Math.random() - 0.5) * 0.05,
          transparent: true,
          opacity: 0.8 + Math.random() * 0.1,
          envMapIntensity: 0.6
        });
        
        const buildingMesh = new THREE.Mesh(geo, mat);
        // Position mesh so its base sits at y=0 within the group (group itself is at ground level)
        buildingMesh.position.set(0, height / 2, 0);
        buildingMesh.castShadow = false;
        buildingMesh.userData.isSkyscraper = true;
        tree.add(buildingMesh);

        tree.baseY = 0;
        const baseX = side * (7.5 + Math.random() * 3.5);
        tree.baseX = baseX;
        // group sits at ground level; mesh interior is offset up by height/2
        tree.position.set(
          baseX,
          store.getSurfaceY(treeZ),
          treeZ
        );
        tree.userData.initX = baseX;
        tree.userData.initZ = treeZ;
        tree.userData.initBaseX = baseX;
        store.scene.add(tree);
        store.trees.push(tree);
      } else {
        // Stages 1 and 2 trees
        const isPine = Math.random() > 0.5;
        const treeTex = isPine ? treePineTex : treeRoundTex;
        const treeH = isPine ? 5.6 : 4.8;
        const treeW = isPine ? 3.2 : 4.0;
        
        const spriteMat = new THREE.SpriteMaterial({ 
          map: treeTex, 
          transparent: true,
          depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(treeW, treeH, 1);
        tree.add(sprite);
        
        const treeScale = 0.7 + Math.random() * 0.3;
        tree.scale.setScalar(treeScale);
        const treeBaseY = (treeH / 2) * treeScale;
        const baseX = side * (7.5 + Math.random() * 3.5);
        tree.baseY = treeBaseY;
        tree.baseX = baseX;
        tree.position.set(
          baseX,
          treeBaseY + store.getSurfaceY(treeZ),
          treeZ
        );
        tree.userData.initX = baseX;
        tree.userData.initZ = treeZ;
        tree.userData.initBaseX = baseX;
        store.scene.add(tree);
        store.trees.push(tree);
      }
    }
    
    // 2. Create buildings
    const buildingColors = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd, 0xffa07a, 0xadd8e6];
    
    for (let i = 0; i < 12; i++) {
      const height = 5 + Math.random() * 10;
      const width = 3 + Math.random() * 4;
      const buildingGroup = new THREE.Group();
      const side = Math.random() > 0.5 ? 1 : -1;
      const bldgZ = -20 - (i * 6) - Math.random() * 3;

      let building;
      
      if (isStage3 && stage3Textures.building) {
        // Stage 3 Glass/Steel facade building
        const buildingGeo = new THREE.BoxGeometry(width, height, width);
        const sideMat = new THREE.MeshToonMaterial({ color: 0x555555 });
        const frontMat = new THREE.MeshToonMaterial({
          map: stage3Textures.building,
          color: 0xffffff
        });
        const topMat = new THREE.MeshToonMaterial({ color: 0x333333 });
        const buildingMats = side < 0
          ? [frontMat, sideMat, topMat, topMat, frontMat, sideMat]
          : [sideMat, frontMat, topMat, topMat, frontMat, sideMat];
        building = new THREE.Mesh(buildingGeo, buildingMats);
      } else {
        // Stages 1 and 2 standard buildings
        const buildingGeo = new THREE.BoxGeometry(width, height, width);
        const texIdx = Math.floor(Math.random() * buildingTextures.length);
        const facadeTex = isStage2 && fachwerkTexture ? fachwerkTexture : buildingTextures[texIdx];
        const facadeDominant = isStage2 ? 0xd4c4a0 : buildingDominantColors[texIdx];
        
        const sideMat = new THREE.MeshToonMaterial({
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
        });
        const frontMat = new THREE.MeshToonMaterial({
          map: facadeTex,
          color: facadeDominant
        });
        const topMat = new THREE.MeshToonMaterial({ color: 0x555555 });
        const buildingMats = side < 0
          ? [frontMat, sideMat, topMat, topMat, frontMat, sideMat]
          : [sideMat, frontMat, topMat, topMat, frontMat, sideMat];
        building = new THREE.Mesh(buildingGeo, buildingMats);
      }
      
      building.castShadow = true;
      building.receiveShadow = true;
      buildingGroup.add(building);
      
      const roofGeo = new THREE.BoxGeometry(width + 0.3, 0.3, width + 0.3);
      const roofMat = new THREE.MeshToonMaterial({ color: 0x555555 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = height + 0.15;
      buildingGroup.add(roof);
      
      const baseX = side * (14.5 + Math.random() * 8.5);
      buildingGroup.position.set(
        baseX,
        store.getSurfaceY(bldgZ),
        bldgZ
      );
      store.scene.add(buildingGroup);
      buildingGroup.baseY = 0;
      building.position.y = height / 2;
      buildingGroup.baseX = baseX;
      buildingGroup.userData.initX = baseX;
      buildingGroup.userData.initZ = bldgZ;
      buildingGroup.userData.initBaseX = baseX;
      store.buildings.push(buildingGroup);
    }
  };

  const createStars = () => {
    _createStars(store.scene);
  };

  const updateRoadCurve = () => {
    const roadMesh = store.roadMesh;
    const grassMesh = store.grassMesh;
    
    if (roadMesh && store.roadOrigPositions) {
      const pos = roadMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const origY = store.roadOrigPositions[i * 3 + 1];
        const worldZ = -origY - 50;
        const curveX = store.getCurveX(worldZ);
        pos.setX(i, store.roadOrigPositions[i * 3] + curveX);
      }
      pos.needsUpdate = true;
      roadMesh.geometry.computeVertexNormals();
    }
    
    if (grassMesh && store.grassOrigPositions) {
      const pos = grassMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const origY = store.grassOrigPositions[i * 3 + 1];
        const worldZ = -origY - 50;
        const curveX = store.getCurveX(worldZ);
        pos.setX(i, store.grassOrigPositions[i * 3] + curveX);
      }
      pos.needsUpdate = true;
      grassMesh.geometry.computeVertexNormals();
    }
    
    const applyCurbCurve = (mesh, origPos) => {
      if (!mesh || !origPos) return;
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const origZ = origPos[i * 3 + 2];
        const worldZ = origZ - 50;
        const curveX = store.getCurveX(worldZ);
        pos.setX(i, origPos[i * 3] + curveX);
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    };
    applyCurbCurve(store.leftCurbMesh, store.leftCurbOrigPositions);
    applyCurbCurve(store.rightCurbMesh, store.rightCurbOrigPositions);
  };

  const updateDayNightCycle = (delta) => {
    const scene = store.scene;
    const dayCycleTime = store.dayCycleTime;
    const cycleProgress = dayCycleTime / DAY_DURATION;
    const dayColor = new THREE.Color(0x87ceeb);
    const sunsetColor = new THREE.Color(0xff7f50);
    const nightColor = new THREE.Color(0x0a0a2e);
    const sunriseColor = new THREE.Color(0xffb6c1);
    
    const getStageBlend = (progress) => {
      if (progress < 0.25) {
        const t = progress / 0.25;
        return { skyColor: dayColor.clone().lerp(sunsetColor, t) };
      } else if (progress < 0.5) {
        const t = (progress - 0.25) / 0.25;
        return { skyColor: sunsetColor.clone().lerp(nightColor, t) };
      } else if (progress < 0.75) {
        const t = (progress - 0.5) / 0.25;
        return { skyColor: nightColor.clone().lerp(sunriseColor, t) };
      } else {
        const t = (progress - 0.75) / 0.25;
        return { skyColor: sunriseColor.clone().lerp(dayColor, t) };
      }
    };
    
    const stageInfo = getStageBlend(cycleProgress);
    const skyColor = stageInfo.skyColor;
    const fogColor = skyColor.clone();
    
    scene.background = skyColor;
    scene.fog.color = fogColor;
    
    const stageKeys = ['sunny', 'sunset', 'night', 'sunset'];
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
    
    const transitionFraction = 5 / 30;
    let skyBlendFactor = 0;
    if (stageProgress > (1 - transitionFraction)) {
      skyBlendFactor = (stageProgress - (1 - transitionFraction)) / transitionFraction;
      skyBlendFactor = skyBlendFactor * skyBlendFactor * (3 - 2 * skyBlendFactor);
    }
    
    const currentSkyTex = skyTextures[stageKeys[stageIdx]] || null;
    const nextSkyStage = stageIdx === 3 ? 'sunny' : stageKeys[(stageIdx + 1) % 4];
    const prevSkyTex = skyTextures[nextSkyStage] || null;
    
    if (currentSkyTex && prevSkyTex && skyBlendFactor > 0) {
      scene.background = skyBlendFactor > 0.5 ? prevSkyTex : currentSkyTex;
    } else if (currentSkyTex) {
      scene.background = currentSkyTex;
    } else {
      scene.background = skyColor;
    }
    
    scene.fog.color = fogColor;
    
    if (cycleProgress > 0.35 && cycleProgress < 0.65) {
      gameStats.nightTime += delta;
      checkAchievements();
    }
    
    const directionalLight = scene.children.find(c => c.isDirectionalLight);
    if (directionalLight) {
      directionalLight.intensity = cycleProgress > 0.25 && cycleProgress < 0.75 ? 0.5 : 1.0;
    }
    
    if (!scene.userData.starsCreated && (cycleProgress > 0.35 || cycleProgress < 0.15)) {
      createStars();
      scene.userData.starsCreated = true;
    } else if (scene.userData.starsCreated && cycleProgress >= 0.15 && cycleProgress <= 0.35) {
      const stars = scene.getObjectByName('stars');
      if (stars) {
        scene.remove(stars);
        scene.userData.starsCreated = false;
      }
    }
  };

  const initSceneTextures = (sunnyUrl, sunsetUrl, nightUrl, mtUrl) => {
    const skyUrls = { sunny: sunnyUrl, sunset: sunsetUrl, night: nightUrl };
    
    Object.keys(skyUrls).forEach(key => {
      trackTexture();
      textureLoader.load(skyUrls[key], (tex) => {
        skyTextures[key] = tex;
        onTextureLoaded();
      });
    });
    
    trackTexture();
    textureLoader.load(mtUrl, (tex) => {
      const mtGeo = new THREE.PlaneGeometry(80, 15);
      const mtMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      mountainMesh = new THREE.Mesh(mtGeo, mtMat);
      mountainMesh.position.set(0, 4 + store.getSurfaceY(-90), -90);
      mountainMesh.renderOrder = -2;
      store.scene.add(mountainMesh);
      
      const mt2 = new THREE.Mesh(mtGeo.clone(), mtMat.clone());
      mt2.material.opacity = 0.5;
      mt2.material.transparent = true;
      mt2.position.set(0, 5 + store.getSurfaceY(-120), -120);
      mt2.scale.set(2.0, 1.5, 1);
      mt2.renderOrder = -3;
      store.scene.add(mt2);
      onTextureLoaded();
    });
  };

  return {
    createGround,
    createLaneMarkers,
    createClouds,
    createBackgroundElements,
    createStars,
    updateRoadCurve,
    updateDayNightCycle,
    applyStageVisuals,
    preloadStageTextures,
    loadTexture,
    initSceneTextures,
    stage3Textures
  };
}
