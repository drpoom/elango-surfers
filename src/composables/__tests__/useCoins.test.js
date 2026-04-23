import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCoins } from '../useCoins';
import * as THREE from 'three';

describe('useCoins', () => {
  let mockDeps;
  let mockScene;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    mockDeps = {
      scene: mockScene,
      laneWidth: 2.5,
      getSurfaceY: vi.fn(() => 0),
      getCurveX: vi.fn(() => 0),
      getSurfaceTilt: vi.fn(() => 0),
      createParticleEffect: vi.fn(),
      createFloatingText: vi.fn(),
      playSound: vi.fn(),
      gameSpeed: { value: 0.25 },
      obstacles: { value: [] },
      activePowerup: { value: null },
      magnetRange: { value: 0 },
      gameStats: {
        maxCombo: 0,
        totalCoins: 0,
        magnetCoins: 0
      },
      score: { value: 0 },
      scoreMultiplier: { value: 1 }
    };
  });

  it('should initialize with empty coins array', () => {
    const { coins } = useCoins(mockDeps);
    expect(coins.value).toEqual([]);
  });

  it('should spawn a coin', () => {
    const { coins, spawnCoin } = useCoins(mockDeps);
    
    spawnCoin();
    
    expect(coins.value.length).toBe(1);
    expect(mockScene.add).toHaveBeenCalled();
    expect(coins.value[0]).toHaveProperty('mesh');
    expect(coins.value[0]).toHaveProperty('lane');
    expect(coins.value[0]).toHaveProperty('collected', false);
  });

  it('should spawn coins in different lanes', () => {
    const { coins, spawnCoin } = useCoins(mockDeps);
    
    // Spawn multiple coins
    for (let i = 0; i < 10; i++) {
      spawnCoin();
    }
    
    // All coins should have valid lane values (0, 1, or 2)
    coins.value.forEach(coin => {
      expect(coin.lane).toBeGreaterThanOrEqual(0);
      expect(coin.lane).toBeLessThanOrEqual(2);
    });
  });

  it('should cleanup all coins', () => {
    const { coins, spawnCoin, cleanupCoins } = useCoins(mockDeps);
    
    // Spawn some coins
    spawnCoin();
    spawnCoin();
    spawnCoin();
    
    expect(coins.value.length).toBe(3);
    
    cleanupCoins();
    
    expect(coins.value.length).toBe(0);
    expect(mockScene.remove).toHaveBeenCalledTimes(3);
  });

  it('should update coin positions', () => {
    const { coins, spawnCoin, updateCoins } = useCoins(mockDeps);
    
    const mockPlayer = {
      position: new THREE.Vector3(0, 1, 0)
    };
    
    spawnCoin();
    const initialZ = coins.value[0].mesh.position.z;
    
    updateCoins(mockPlayer);
    
    // Coin should have moved forward (z increased)
    expect(coins.value[0].mesh.position.z).toBeGreaterThan(initialZ);
  });

  it('should remove coins that go off-screen', () => {
    const { coins, spawnCoin, updateCoins } = useCoins(mockDeps);
    
    const mockPlayer = {
      position: new THREE.Vector3(0, 1, 0)
    };
    
    spawnCoin();
    
    // Manually set coin position to be off-screen
    coins.value[0].mesh.position.z = 16;
    
    updateCoins(mockPlayer);
    
    // Coin should have been removed
    expect(coins.value.length).toBe(0);
  });

  it('should handle coin collection when player is close', () => {
    const { coins, spawnCoin, updateCoins } = useCoins(mockDeps);
    
    const mockPlayer = {
      position: new THREE.Vector3(0, 1, 0)
    };
    
    spawnCoin();
    
    // Move coin close to player
    coins.value[0].mesh.position.set(0, 1, 0.5);
    
    updateCoins(mockPlayer);
    
    // Coin should have been collected
    expect(mockDeps.createParticleEffect).toHaveBeenCalled();
    expect(mockDeps.createFloatingText).toHaveBeenCalled();
    expect(mockDeps.playSound).toHaveBeenCalled();
    expect(coins.value.length).toBe(0);
  });

  it('should increase score on coin collection', () => {
    const { coins, spawnCoin, updateCoins } = useCoins(mockDeps);
    
    const mockPlayer = {
      position: new THREE.Vector3(0, 1, 0)
    };
    
    const initialScore = mockDeps.score.value;
    
    spawnCoin();
    coins.value[0].mesh.position.set(0, 1, 0.5);
    
    updateCoins(mockPlayer);
    
    expect(mockDeps.score.value).toBeGreaterThan(initialScore);
    expect(mockDeps.gameStats.totalCoins).toBe(1);
  });

  it('should handle magnet powerup', () => {
    mockDeps.activePowerup.value = 'magnet';
    mockDeps.magnetRange.value = 10;
    
    const { coins, spawnCoin, updateCoins } = useCoins(mockDeps);
    
    const mockPlayer = {
      position: new THREE.Vector3(0, 1, 0)
    };
    
    spawnCoin();
    // Place coin within magnet range but not immediately collectible
    coins.value[0].mesh.position.set(0, 1, 5);
    
    updateCoins(mockPlayer);
    
    // Coin should be pulled toward player (z should decrease)
    expect(coins.value[0].mesh.position.z).toBeLessThan(5);
  });

  it('should track combo count', () => {
    const { coins, spawnCoin, updateCoins } = useCoins(mockDeps);
    
    const mockPlayer = {
      position: new THREE.Vector3(0, 1, 0)
    };
    
    // Collect multiple coins quickly
    for (let i = 0; i < 3; i++) {
      spawnCoin();
      coins.value[0].mesh.position.set(0, 1, 0.5);
      updateCoins(mockPlayer);
    }
    
    expect(mockDeps.gameStats.maxCombo).toBe(3);
  });
});
