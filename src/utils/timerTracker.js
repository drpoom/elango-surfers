/**
 * timerTracker.js — Utility to track and clean up all setTimeout/setInterval calls
 * 
 * Prevents ghost callbacks from stale timers by auto-tracking all active IDs.
 * Usage:
 *   const tracker = createTimerTracker();
 *   tracker.setTimeout(fn, delay);  // auto-tracked
 *   tracker.setInterval(fn, delay); // auto-tracked
 *   tracker.clearAll();             // clears ALL tracked timers
 *   tracker.clear(id);              // clear specific timer
 */

export function createTimerTracker() {
  const activeTimeouts = new Set();
  const activeIntervals = new Set();

  const trackedSetTimeout = (fn, delay, ...args) => {
    const id = setTimeout(() => {
      activeTimeouts.delete(id);
      fn(...args);
    }, delay, ...args);
    activeTimeouts.add(id);
    return id;
  };

  const trackedSetInterval = (fn, delay, ...args) => {
    const id = setInterval(fn, delay, ...args);
    activeIntervals.add(id);
    return id;
  };

  const trackedClearTimeout = (id) => {
    clearTimeout(id);
    activeTimeouts.delete(id);
  };

  const trackedClearInterval = (id) => {
    clearInterval(id);
    activeIntervals.delete(id);
  };

  const clear = (id) => {
    if (activeTimeouts.has(id)) {
      trackedClearTimeout(id);
    } else if (activeIntervals.has(id)) {
      trackedClearInterval(id);
    }
  };

  const clearAll = () => {
    for (const id of activeTimeouts) {
      clearTimeout(id);
    }
    for (const id of activeIntervals) {
      clearInterval(id);
    }
    activeTimeouts.clear();
    activeIntervals.clear();
  };

  return {
    setTimeout: trackedSetTimeout,
    setInterval: trackedSetInterval,
    clearTimeout: trackedClearTimeout,
    clearInterval: trackedClearInterval,
    clear,
    clearAll,
    /** For debugging: get count of active timers */
    get activeCount() { return activeTimeouts.size + activeIntervals.size; },
    /** For debugging: get sets of active IDs */
    getActiveTimers: () => ({
      timeouts: new Set(activeTimeouts),
      intervals: new Set(activeIntervals),
    }),
  };
}