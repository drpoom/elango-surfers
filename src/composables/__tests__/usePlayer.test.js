import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayer, createPlayer, updatePlayerAnimation, updatePlayerHat, updatePlayerSkin } from '../usePlayer.js';
import * as THREE from 'three';

describe('usePlayer composable', () => {
  describe('usePlayer()', () => {
    it('returns reactive player state refs', () => {
      const { playerState, handleJump, handleSlide, moveLeft, moveRight } = usePlayer();

      expect(playerState).toBeDefined();
      expect(playerState.currentLane).toBeDefined();
      expect(playerState.isJumping).toBeDefined();
      expect(playerState.jumpVelocity).toBeDefined();
      expect(playerState.isSliding).toBeDefined();
      expect(playerState.slideTimer).toBeDefined();
      expect(playerState.isFlying).toBeDefined();
      expect(playerState.flyVelocity).toBeDefined();
      expect(playerState.currentSkin).toBeDefined();
      expect(playerState.currentHat).toBeDefined();
      expect(playerState.tiltEnabled).toBeDefined();
      expect(playerState.micEnabled).toBeDefined();

      expect(handleJump).toBeTypeOf('function');
      expect(handleSlide).toBeTypeOf('function');
      expect(moveLeft).toBeTypeOf('function');
      expect(moveRight).toBeTypeOf('function');
    });

    it('initializes with default values', () => {
      const { playerState } = usePlayer();

      expect(playerState.currentLane.value).toBe(1);
      expect(playerState.isJumping.value).toBe(false);
      expect(playerState.jumpVelocity.value).toBe(0);
      expect(playerState.isSliding.value).toBe(false);
      expect(playerState.slideTimer.value).toBe(0);
      expect(playerState.isFlying.value).toBe(false);
      expect(playerState.flyVelocity.value).toBe(0);
      expect(playerState.currentSkin.value).toBe(0);
      expect(playerState.currentHat.value).toBe(null);
      expect(playerState.tiltEnabled.value).toBe(true);
      expect(playerState.micEnabled.value).toBe(false);
    });

    it('handleJump sets jumping state when not already jumping/sliding/flying', () => {
      const { playerState, handleJump } = usePlayer();

      handleJump();

      expect(playerState.isJumping.value).toBe(true);
      expect(playerState.jumpVelocity.value).toBeGreaterThan(0);
    });

    it('handleJump does nothing when already jumping', () => {
      const { playerState, handleJump } = usePlayer();

      playerState.isJumping.value = true;
      const prevVelocity = playerState.jumpVelocity.value;
      handleJump();

      expect(playerState.isJumping.value).toBe(true);
      expect(playerState.jumpVelocity.value).toBe(prevVelocity);
    });

    it('handleSlide sets sliding state when not already sliding/jumping/flying', () => {
      const { playerState, handleSlide } = usePlayer();

      handleSlide();

      expect(playerState.isSliding.value).toBe(true);
      expect(playerState.slideTimer.value).toBeGreaterThan(0);
    });

    it('moveLeft decreases lane when > 0', () => {
      const { playerState, moveLeft } = usePlayer();

      playerState.currentLane.value = 2;
      moveLeft();
      expect(playerState.currentLane.value).toBe(1);

      moveLeft();
      expect(playerState.currentLane.value).toBe(0);

      moveLeft();
      expect(playerState.currentLane.value).toBe(0); // Should not go below 0
    });

    it('moveRight increases lane when < 2', () => {
      const { playerState, moveRight } = usePlayer();

      playerState.currentLane.value = 0;
      moveRight();
      expect(playerState.currentLane.value).toBe(1);

      moveRight();
      expect(playerState.currentLane.value).toBe(2);

      moveRight();
      expect(playerState.currentLane.value).toBe(2); // Should not go above 2
    });
  });

  describe('createPlayer()', () => {
    let scene;

    beforeEach(() => {
      scene = new THREE.Scene();
    });

    it('returns a THREE.Group', () => {
      const player = createPlayer(scene);
      expect(player).toBeInstanceOf(THREE.Group);
    });

    it('has expected child meshes', () => {
      const player = createPlayer(scene);

      const torso = player.getObjectByName('torso');
      const headGroup = player.getObjectByName('head-group');
      const leftArm = player.getObjectByName('left-arm');
      const rightArm = player.getObjectByName('right-arm');
      const leftLeg = player.getObjectByName('left-leg');
      const rightLeg = player.getObjectByName('right-leg');

      expect(torso).toBeDefined();
      expect(headGroup).toBeDefined();
      expect(leftArm).toBeDefined();
      expect(rightArm).toBeDefined();
      expect(leftLeg).toBeDefined();
      expect(rightLeg).toBeDefined();
    });

    it('has correct initial position', () => {
      const player = createPlayer(scene);

      expect(player.position.x).toBe(0);
      expect(player.position.y).toBe(0.5);
      expect(player.position.z).toBe(0);
      expect(player.rotation.y).toBe(Math.PI);
    });

    it('is added to the scene', () => {
      const player = createPlayer(scene);
      expect(scene.children).toContain(player);
    });

    it('has meshes with castShadow enabled', () => {
      const player = createPlayer(scene);

      const torso = player.getObjectByName('torso');
      expect(torso.castShadow).toBe(true);

      const leftLeg = player.getObjectByName('left-leg');
      expect(leftLeg.castShadow).toBe(true);
    });
  });

  describe('updatePlayerAnimation()', () => {
    let player;
    let scene;

    beforeEach(() => {
      scene = new THREE.Scene();
      player = createPlayer(scene);
    });

    it('does not throw errors with valid inputs', () => {
      const state = {
        currentLane: 1,
        isJumping: false,
        jumpVelocity: 0,
        isSliding: false,
        isFlying: false,
        flyVelocity: 0
      };

      expect(() => {
        updatePlayerAnimation(0.016, 1.0, player, state, 0.25);
      }).not.toThrow();
    });

    it('handles null player gracefully', () => {
      const state = { currentLane: 1, isJumping: false };
      expect(() => {
        updatePlayerAnimation(0.016, 1.0, null, state, 0.25);
      }).not.toThrow();
    });

    it('applies slide pose when isSliding is true', () => {
      const state = {
        currentLane: 1,
        isJumping: false,
        isSliding: true,
        isFlying: false
      };

      updatePlayerAnimation(0.016, 1.0, player, state, 0.25);

      const leftArm = player.getObjectByName('left-arm');
      const leftLeg = player.getObjectByName('left-leg');

      expect(leftArm.rotation.x).toBeCloseTo(0.8, 1);
      expect(leftLeg.rotation.x).toBeCloseTo(-1.0, 1);
      expect(player.position.y).toBeCloseTo(0.3, 1);
      expect(player.scale.y).toBe(0.5);
    });

    it('applies fly pose when isFlying is true', () => {
      const state = {
        currentLane: 1,
        isJumping: false,
        isSliding: false,
        isFlying: true
      };

      updatePlayerAnimation(0.016, 1.0, player, state, 0.25);

      const leftArm = player.getObjectByName('left-arm');

      expect(leftArm.rotation.z).toBeCloseTo(-1.5, 1);
      expect(player.scale.y).toBe(1.0);
    });

    it('applies running animation when not jumping/sliding/flying', () => {
      const state = {
        currentLane: 1,
        isJumping: false,
        isSliding: false,
        isFlying: false
      };

      updatePlayerAnimation(0.016, 1.0, player, state, 0.25);

      const leftArm = player.getObjectByName('left-arm');
      const leftLeg = player.getObjectByName('left-leg');

      // Running animation should have some rotation
      expect(leftArm.rotation.x).toBeDefined();
      expect(leftLeg.rotation.x).toBeDefined();
      expect(player.scale.y).toBe(1.0);
    });

    it('applies jump pose when isJumping is true', () => {
      const state = {
        currentLane: 1,
        isJumping: true,
        isSliding: false,
        isFlying: false
      };

      updatePlayerAnimation(0.016, 1.0, player, state, 0.25);

      const leftArm = player.getObjectByName('left-arm');

      expect(leftArm.rotation.x).toBeCloseTo(-1.2, 1);
      expect(player.scale.y).toBe(1.0);
    });
  });

  describe('updatePlayerHat()', () => {
    let player;
    let scene;

    beforeEach(() => {
      scene = new THREE.Scene();
      player = createPlayer(scene);
    });

    it('adds cap hat correctly', () => {
      updatePlayerHat(player, 'cap');

      const cap = player.getObjectByName('cap');
      const brim = player.getObjectByName('brim');

      expect(cap).toBeDefined();
      expect(brim).toBeDefined();
    });

    it('adds crown hat correctly', () => {
      updatePlayerHat(player, 'crown');

      const crown = player.getObjectByName('crown');
      expect(crown).toBeDefined();
    });

    it('adds helmet hat correctly', () => {
      updatePlayerHat(player, 'helmet');

      const helmet = player.getObjectByName('helmet');
      expect(helmet).toBeDefined();
    });

    it('removes hat when null is passed', () => {
      updatePlayerHat(player, 'cap');
      expect(player.getObjectByName('cap')).toBeDefined();

      updatePlayerHat(player, null);
      // Hat should be removed
      const headGroup = player.getObjectByName('head-group');
      const hasHat = headGroup.children.some(c => 
        c.name && ['cap', 'brim', 'crown', 'helmet'].includes(c.name.toLowerCase())
      );
      expect(hasHat).toBe(false);
    });
  });

  describe('updatePlayerSkin()', () => {
    let player;
    let scene;

    beforeEach(() => {
      scene = new THREE.Scene();
      player = createPlayer(scene);
    });

    it('updates torso color', () => {
      const originalColor = player.getObjectByName('torso').material.color.getHex();
      updatePlayerSkin(player, 1);
      const newColor = player.getObjectByName('torso').material.color.getHex();
      
      expect(newColor).not.toBe(originalColor);
      expect(newColor).toBe(0x4ecdc4);
    });

    it('handles invalid skin index gracefully', () => {
      expect(() => {
        updatePlayerSkin(player, 99);
      }).not.toThrow();
    });
  });
});
