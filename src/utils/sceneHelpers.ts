/**
 * sceneHelpers.ts — THREE.js scene creation and cleanup utilities
 */

import * as THREE from 'three';

export function createPlayer(currentSkinValue: number, currentHatValue: string): THREE.Group {
  const playerGroup = new THREE.Group();
  const skinColors: number[] = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const skinColor = skinColors[currentSkinValue];
  
  // Torso
  const torsoGeo = new THREE.CapsuleGeometry(0.35, 0.6, 8, 8);
  const torsoMat = new THREE.MeshToonMaterial({ color: skinColor });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.castShadow = true;
  torso.name = 'torso';
  playerGroup.add(torso);
  
  // Head group (rotates to face direction)
  const headGroup = new THREE.Group();
  headGroup.name = 'head-group';
  headGroup.position.y = 0.7;
  
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const headMat = new THREE.MeshToonMaterial({ color: 0xffd93d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  headGroup.add(head);
  
  // Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.12, 0.05, 0.25);
  headGroup.add(leftEyeWhite);
  const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  leftPupil.position.set(-0.12, 0.05, 0.3);
  leftPupil.name = 'left-pupil';
  headGroup.add(leftPupil);
  
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.12, 0.05, 0.25);
  headGroup.add(rightEyeWhite);
  const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  rightPupil.position.set(0.12, 0.05, 0.3);
  rightPupil.name = 'right-pupil';
  headGroup.add(rightPupil);
  
  const mouthGeo = new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.08, 0.28);
  mouth.rotation.x = Math.PI;
  headGroup.add(mouth);
  
  playerGroup.add(headGroup);
  
  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 4);
  const armMat = new THREE.MeshToonMaterial({ color: skinColor });
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.45, 0.2, 0);
  leftArmPivot.name = 'left-arm';
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.y = -0.25;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  playerGroup.add(leftArmPivot);
  
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.45, 0.2, 0);
  rightArmPivot.name = 'right-arm';
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  playerGroup.add(rightArmPivot);
  
  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.35, 4, 4);
  const legMat = new THREE.MeshToonMaterial({ color: 0x333333 });
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, -0.5, 0);
  leftLegPivot.name = 'left-leg';
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.y = -0.25;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  playerGroup.add(leftLegPivot);
  
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, -0.5, 0);
  rightLegPivot.name = 'right-leg';
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.y = -0.25;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  playerGroup.add(rightLegPivot);
  
  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.35);
  const shoeMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.45, 0.05);
  leftShoe.castShadow = true;
  leftLegPivot.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.45, 0.05);
  rightShoe.castShadow = true;
  rightLegPivot.add(rightShoe);
  
  // Hat
  if (currentHatValue === 'cap') {
    const capGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 16);
    const capMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.3;
    cap.castShadow = true;
    headGroup.add(cap);
    
    const brimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.25, 0.22);
    brim.rotation.x = 0.2;
    brim.castShadow = true;
    headGroup.add(brim);
  } else if (currentHatValue === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.3, 6);
    const crownMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.35;
    crown.castShadow = true;
    headGroup.add(crown);
  } else if (currentHatValue === 'helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.3;
    helmet.castShadow = true;
    headGroup.add(helmet);
  }
  
  return playerGroup;
}

export function cleanupMedievalFlowers(medievalFlowers: THREE.Mesh[]): void {
  if (!medievalFlowers) return;
  medievalFlowers.forEach(f => {
    if (f.parent) f.parent.remove(f);
    f.geometry?.dispose();
    f.material?.dispose();
  });
  medievalFlowers.length = 0;
}

export function createMedievalFlowers(scene: THREE.Scene, medievalFlowers: THREE.Mesh[]): void {
  cleanupMedievalFlowers(medievalFlowers);
  
  for (let i = 0; i < 40; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const flowerGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const flowerColor = Math.random() > 0.5 ? 0xff0066 : 0xff6699;
    const flowerMat = new THREE.MeshBasicMaterial({ color: flowerColor });
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    
    flower.position.set(
      side * (4 + Math.random() * 2),
      0.1,
      -Math.random() * 80
    );
    flower.userData = { baseX: flower.position.x, life: 1.0 };
    scene.add(flower);
    medievalFlowers.push(flower);
  }
}

export function createClouds(scene: THREE.Scene, clouds: THREE.Group[]): void {
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
    const mainSize = 1.0 + Math.random() * 0.8;
    const puffCount = 4 + Math.floor(Math.random() * 4);
    
    const mainGeo = new THREE.SphereGeometry(mainSize, 10, 8);
    const main = new THREE.Mesh(mainGeo, cloudMat);
    main.position.set(0, 0, 0);
    main.scale.set(1.4, 0.9, 1.0);
    cloud.add(main);
    
    const shadowGeo = new THREE.SphereGeometry(mainSize * 0.9, 8, 6);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, -mainSize * 0.3, 0);
    shadow.scale.set(1.5, 0.4, 1.1);
    cloud.add(shadow);
    
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

export function createStars(scene: THREE.Scene): void {
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

export function disposeHierarchy(array: THREE.Object3D[], scene: THREE.Scene): void {
  if (!array) return;
  array.forEach(item => {
    scene.remove(item);
    item.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  });
  array.length = 0;
}