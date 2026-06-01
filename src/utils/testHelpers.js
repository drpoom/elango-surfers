/**
 * testHelpers.js — Namespaced debug/test helpers for Playwright tests
 * 
 * Only attached to window in development mode (import.meta.env.DEV).
 * Access via: window.__ElangoSurfers.getSpawnCounts(), etc.
 */

/**
 * Attach test helpers to window.__ElangoSurfers (dev mode only)
 * @param {Object} getters - Object with getter functions for debug state
 * @param {Function} getters.getSpawnCounts - Returns { obstacles, coins }
 * @param {Function} getters.getSpawnDebug - Returns full debug state
 * @param {Function} getters.getRoadMesh - Returns the road mesh reference
 * @param {Object} store - Shared reactive game store (for state polling in tests)
 */
export function attachTestHelpers(getters, store) {
  if (import.meta.env.DEV) {
    window.__ElangoSurfers = {
      getSpawnCounts: getters.getSpawnCounts,
      getSpawnDebug: getters.getSpawnDebug,
      getRoadMesh: getters.getRoadMesh,
      getStore: () => store,
    };
  }
}

/**
 * Remove test helpers from window (for cleanup)
 */
export function detachTestHelpers() {
  if (import.meta.env.DEV && window.__ElangoSurfers) {
    delete window.__ElangoSurfers;
  }
}