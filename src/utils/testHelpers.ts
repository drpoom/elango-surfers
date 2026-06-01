/**
 * testHelpers.ts — Namespaced debug/test helpers for Playwright tests
 * 
 * Only attached to window in development mode (import.meta.env.DEV).
 * Access via: window.__ElangoSurfers.getSpawnCounts(), etc.
 */

export interface TestHelperGetters {
  getSpawnCounts: () => { obstacles: number; coins: number };
  getSpawnDebug: () => Record<string, unknown>;
  getRoadMesh: () => unknown;
}

export interface ElangoSurfersHelpers extends TestHelperGetters {
  getStore: () => Record<string, unknown>;
}

declare global {
  interface Window {
    __ElangoSurfers?: ElangoSurfersHelpers;
  }
}

/**
 * Attach test helpers to window.__ElangoSurfers (dev mode only)
 */
export function attachTestHelpers(getters: TestHelperGetters, store?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    window.__ElangoSurfers = {
      getSpawnCounts: getters.getSpawnCounts,
      getSpawnDebug: getters.getSpawnDebug,
      getRoadMesh: getters.getRoadMesh,
      getStore: () => store || {},
    };
  }
}

/**
 * Remove test helpers from window (for cleanup)
 */
export function detachTestHelpers(): void {
  if (import.meta.env.DEV && window.__ElangoSurfers) {
    delete window.__ElangoSurfers;
  }
}