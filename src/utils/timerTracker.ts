/**
 * timerTracker.ts — Utility to track and clean up all setTimeout/setInterval calls
 * 
 * Prevents ghost callbacks from stale timers by auto-tracking all active IDs.
 * Usage:
 *   const tracker = createTimerTracker();
 *   tracker.setTimeout(fn, delay);  // auto-tracked
 *   tracker.setInterval(fn, delay); // auto-tracked
 *   tracker.clearAll();             // clears ALL tracked timers
 *   tracker.clear(id);              // clear specific timer
 */

export interface TimerTracker {
  setTimeout: (fn: (...args: any[]) => void, delay: number, ...args: any[]) => number;
  setInterval: (fn: (...args: any[]) => void, delay: number, ...args: any[]) => number;
  clearTimeout: (id: number) => void;
  clearInterval: (id: number) => void;
  clear: (id: number) => void;
  clearAll: () => void;
  readonly activeCount: number;
  getActiveTimers: () => { timeouts: Set<number>; intervals: Set<number> };
}

export function createTimerTracker(): TimerTracker {
  const activeTimeouts = new Set<number>();
  const activeIntervals = new Set<number>();

  const trackedSetTimeout = (fn: (...args: any[]) => void, delay: number, ...args: any[]): number => {
    const id: number = window.setTimeout(() => {
      activeTimeouts.delete(id);
      fn(...args);
    }, delay, ...args) as unknown as number;
    activeTimeouts.add(id);
    return id;
  };

  const trackedSetInterval = (fn: (...args: any[]) => void, delay: number, ...args: any[]): number => {
    const id: number = window.setInterval(fn, delay, ...args) as unknown as number;
    activeIntervals.add(id);
    return id;
  };

  const trackedClearTimeout = (id: number): void => {
    window.clearTimeout(id);
    activeTimeouts.delete(id);
  };

  const trackedClearInterval = (id: number): void => {
    window.clearInterval(id);
    activeIntervals.delete(id);
  };

  const clear = (id: number): void => {
    if (activeTimeouts.has(id)) {
      trackedClearTimeout(id);
    } else if (activeIntervals.has(id)) {
      trackedClearInterval(id);
    }
  };

  const clearAll = (): void => {
    for (const id of activeTimeouts) {
      window.clearTimeout(id);
    }
    for (const id of activeIntervals) {
      window.clearInterval(id);
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