import { ref, reactive } from 'vue';
import * as THREE from 'three';
import { laneWidth, jumpStrength, slideDuration, FLY_LIFT, FLY_GRAVITY, FLY_MAX_HEIGHT } from '../gameConstants.js';

/**
 * Reactive player state composable
 * @returns {Object} Player state refs and control methods
 */
export function usePlayer() {
  const currentLane = ref(1);
  const isJumping = ref(false);
  const jumpVelocity = ref(0);
  const isSliding = ref(false);
  const slideTimer = ref(0);
  const isFlying = ref(false);
  const flyVelocity = ref(0);
  const currentSkin = ref(0);
  const currentHat = ref(null);
  const tiltEnabled = ref(true);
  const micEnabled = ref(false);

  const playerState = reactive({
    currentLane,
    isJumping,
    jumpVelocity,
    isSliding,
    slideTimer,
    isFlying,
    flyVelocity,
    currentSkin,
    currentHat,
    tiltEnabled,
    micEnabled
  });

  const handleJump = () => {
    if (isJumping.value || isSliding.value || isFlying.value) return;
    isJumping.value = true;
    jumpVelocity.value = jumpStrength;
  };

  const handleSlide = () => {
    if (isJumping.value || isSliding.value || isFlying.value) return;
    isSliding.value = true;
    slideTimer.value = slideDuration;
  };

  const moveLeft = () => {
    if (currentLane.value > 0) currentLane.value--;
  };

  const moveRight = () => {
    if (currentLane.value < 2) currentLane.value++;
  };

  return {
    playerState,
    handleJump,
    handleSlide,
    moveLeft,
    moveRight
  };
}

/**
 * Create the player 3D model
 * @param {THREE.Scene} scene - The scene to add the player to
 * @returns {THREE.Group} The player group
 */
export function createPlayer(scene) {
  const playerGroup = new THREE.Group();
  const skinColors = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const skinColor = skinColors[0]; // Default skin, will be updated by composable

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

  // Mouth
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

  playerGroup.position.set(0, 0.5, 0);
  playerGroup.rotation.y = Math.PI;

  if (scene) {
    scene.add(playerGroup);
  }

  return playerGroup;
}

/**
 * Update player hat (called when hat changes)
 * @param {THREE.Group} player - The player group
 * @param {string|null} hat - Hat type: 'cap', 'crown', 'helmet', or null
 */
export function updatePlayerHat(player, hat) {
  const headGroup = player.getObjectByName('head-group');
  
  // Remove existing hat from headGroup
  if (headGroup) {
    const hatChildren = ['hat', 'cap', 'brim', 'crown', 'helmet'];
    // Iterate backwards to safely remove while iterating
    for (let i = headGroup.children.length - 1; i >= 0; i--) {
      const child = headGroup.children[i];
      if (child.name && hatChildren.includes(child.name.toLowerCase())) {
        headGroup.remove(child);
      }
    }
  }

  if (!hat || !headGroup) return;

  if (hat === 'cap') {
    const capGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 16);
    const capMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.3;
    cap.castShadow = true;
    cap.name = 'cap';
    headGroup.add(cap);

    const brimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.25, 0.22);
    brim.rotation.x = 0.2;
    brim.castShadow = true;
    brim.name = 'brim';
    headGroup.add(brim);
  } else if (hat === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.3, 6);
    const crownMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.35;
    crown.castShadow = true;
    crown.name = 'crown';
    headGroup.add(crown);
  } else if (hat === 'helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = new THREE.MeshToonMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.3;
    helmet.castShadow = true;
    helmet.name = 'helmet';
    headGroup.add(helmet);
  }
}

/**
 * Update player skin color (called when skin changes)
 * @param {THREE.Group} player - The player group
 * @param {number} skinIndex - Skin color index (0-4)
 */
export function updatePlayerSkin(player, skinIndex) {
  const skinColors = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const skinColor = skinColors[skinIndex] || skinColors[0];

  const torso = player.getObjectByName('torso');
  if (torso && torso.material) {
    torso.material.color.setHex(skinColor);
  }

  const leftArm = player.getObjectByName('left-arm');
  const rightArm = player.getObjectByName('right-arm');
  [leftArm, rightArm].forEach(arm => {
    if (arm && arm.children[0] && arm.children[0].material) {
      arm.children[0].material.color.setHex(skinColor);
    }
  });
}

/**
 * Update player animations based on state
 * @param {number} delta - Time delta in seconds
 * @param {number} time - Elapsed time in seconds
 * @param {THREE.Group} player - The player group
 * @param {Object} state - Player state object with currentLane, isJumping, isSliding, isFlying, etc.
 * @param {number} gameSpeed - Current game speed for animation timing
 */
export function updatePlayerAnimation(delta, time, player, state, gameSpeed = 0.25) {
  if (!player) return;

  const {
    currentLane = 1,
    isJumping = false,
    jumpVelocity = 0,
    isSliding = false,
    isFlying = false,
    flyVelocity = 0
  } = state;

  const leftArm = player.getObjectByName('left-arm');
  const rightArm = player.getObjectByName('right-arm');
  const leftLeg = player.getObjectByName('left-leg');
  const rightLeg = player.getObjectByName('right-leg');
  const headGroup = player.getObjectByName('head-group');

  // Running animation - arms and legs swing
  if (isSliding) {
    // Slide pose - character ducks low
    if (leftArm) leftArm.rotation.x = 0.8;
    if (rightArm) rightArm.rotation.x = 0.8;
    if (leftLeg) leftLeg.rotation.x = -1.0;
    if (rightLeg) rightLeg.rotation.x = -1.0;
    player.position.y = 0.3;
    player.scale.y = 0.5;
  } else if (isFlying) {
    // Fly pose - arms spread out like wings
    if (leftArm) leftArm.rotation.z = -1.5;
    if (rightArm) rightArm.rotation.z = 1.5;
    if (leftLeg) leftLeg.rotation.x = 0.3;
    if (rightLeg) rightLeg.rotation.x = 0.3;
    player.scale.y = 1.0;
  } else if (!isJumping) {
    const runSpeed = 8 + gameSpeed * 10;
    const swing = Math.sin(time * runSpeed) * 0.6;

    if (leftArm) leftArm.rotation.x = swing;
    if (rightArm) rightArm.rotation.x = -swing;
    if (leftLeg) leftLeg.rotation.x = -swing * 0.8;
    if (rightLeg) rightLeg.rotation.x = swing * 0.8;

    player.position.y = 0.5 + Math.abs(Math.sin(time * runSpeed)) * 0.05;
    player.scale.y = 1.0;
  } else {
    if (leftArm) leftArm.rotation.x = -1.2;
    if (rightArm) rightArm.rotation.x = -1.2;
    if (leftLeg) leftLeg.rotation.x = 0.5;
    if (rightLeg) rightLeg.rotation.x = 0.5;
    player.scale.y = 1.0;
  }

  // Head faces movement direction (based on lane position)
  if (headGroup) {
    const targetX = (currentLane - 1) * laneWidth;
    const moveDir = targetX - player.position.x;
    const targetHeadRotY = THREE.MathUtils.clamp(moveDir * -0.5, -0.6, 0.6);
    headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadRotY, 0.1);
  }

  // Smooth lane movement
  const targetX = (currentLane - 1) * laneWidth;
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.15);

  // Body lean on turn
  const moveDir = targetX - player.position.x;
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, moveDir * -0.08, 0.1);
  player.rotation.x = 0;

  // Body faces forward (base rotation = PI) with slight turn into movement
  const bodyTurn = THREE.MathUtils.clamp(moveDir * 0.15, -0.3, 0.3);
  player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, Math.PI + bodyTurn, 0.08);
}

/**
 * Update player physics (jumping, flying)
 * @param {Object} state - Player state object
 * @param {number} delta - Time delta in seconds
 * @param {number} micVolume - Current microphone volume (0-1)
 * @param {boolean} micEnabled - Whether mic is enabled
 */
export function updatePlayerPhysics(state, delta, micVolume = 0, micEnabled = false) {
  const {
    isJumping,
    jumpVelocity,
    isSliding,
    slideTimer,
    isFlying,
    flyVelocity
  } = state;

  const gravity = 0.015;

  // Flying physics
  if (isFlying.value) {
    if (micEnabled && micVolume > 0.3) {
      // Still blowing → keep flying (apply lift)
      flyVelocity.value += FLY_LIFT;
      if (flyVelocity.value > 0.15) flyVelocity.value = 0.15;
    } else {
      // Volume dropped → fall
      flyVelocity.value -= FLY_GRAVITY;
    }

    // Cap max height
    if (flyVelocity.value > 0 && state.playerY >= FLY_MAX_HEIGHT) {
      flyVelocity.value = 0;
    }

    // Landed
    if (state.playerY <= 0.5) {
      state.playerY = 0.5;
      isFlying.value = false;
      flyVelocity.value = 0;
    }
  } else if (isJumping.value) {
    state.playerY += jumpVelocity.value;
    jumpVelocity.value -= gravity;
    if (state.playerY <= 0.5) {
      state.playerY = 0.5;
      isJumping.value = false;
      jumpVelocity.value = 0;
    }
  }

  // Slide timer
  if (isSliding.value) {
    slideTimer.value -= delta;
    if (slideTimer.value <= 0) {
      isSliding.value = false;
      slideTimer.value = 0;
    }
  }
}

export default {
  usePlayer,
  createPlayer,
  updatePlayerAnimation,
  updatePlayerHat,
  updatePlayerSkin,
  updatePlayerPhysics
};
