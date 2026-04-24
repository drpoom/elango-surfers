# Elango Surfers - OpenClaw Browser Debug Script

Use this script for live debugging sessions with OpenClaw's browser tool.

## Session 1: Verify Pause/Resume Fix

```javascript
// 1. Open game
browser({ action: "open", url: "https://drpoom.github.io/elango-surfers/" })

// 2. Wait for load, then click to start
browser({ action: "act", kind: "click", ref: "START_BUTTON_REF" })

// 3. Wait 3 seconds
browser({ action: "act", kind: "wait", timeMs: 3000 })

// 4. Take screenshot
browser({ action: "screenshot", fullPage: true })

// 5. Pause (press P)
browser({ action: "act", kind: "press", key: "p" })

// 6. Wait 5 seconds (paused)
browser({ action: "act", kind: "wait", timeMs: 5000 })

// 7. Screenshot of pause state
browser({ action: "screenshot", fullPage: true })

// 8. Resume (press P)
browser({ action: "act", kind: "press", key: "p" })

// 9. Wait 3 seconds (resumed)
browser({ action: "act", kind: "wait", timeMs: 3000 })

// 10. Screenshot of resumed state
browser({ action: "screenshot", fullPage: true })
```

## Session 2: Debug Overlay Inspection

```javascript
// 1. Open game and start
browser({ action: "open", url: "https://drpoom.github.io/elango-surfers/" })
browser({ action: "act", kind: "click", ref: "START_BUTTON" })

// 2. Open settings
browser({ action: "act", kind: "click", ref: "SETTINGS_BTN" })

// 3. Enable debug overlay
browser({ action: "act", kind: "click", ref: "DEBUG_TOGGLE" })

// 4. Take screenshot with debug info
browser({ action: "screenshot", fullPage: true })

// 5. Capture snapshot to read debug values
browser({ action: "snapshot", refs: "role" })
```

## Session 3: Visual Regression Baseline

```javascript
// Capture baseline screenshots for each stage
const stages = [
  { name: "stage1", url: "https://drpoom.github.io/elango-surfers/" },
  { name: "stage2", url: "https://drpoom.github.io/elango-surfers/?stage=2" },
  { name: "stage3", url: "https://drpoom.github.io/elango-surfers/?stage=3" }
];

for (const stage of stages) {
  browser({ action: "navigate", url: stage.url });
  browser({ action: "act", kind: "wait", timeMs: 2000 });
  browser({ action: "screenshot", fullPage: true, filename: `baseline-${stage.name}.png` });
}
```

## Session 4: Boss Fight Recording

```javascript
// Navigate to Stage 3 boss fight (requires debug stage skip or waiting)
browser({ action: "open", url: "https://drpoom.github.io/elango-surfers/" });

// Enable debug mode to skip to Stage 3
// (Would need debug controls implemented)

// Record video of boss fight
browser({ 
  action: "screenshot", 
  fullPage: true, 
  type: "png",
  intervalMs: 1000 // Capture every second
});
```

## Interactive Debug Commands

### Check Current Version
```javascript
browser({ action: "snapshot", refs: "role" });
// Look for version text in snapshot
```

### Force Pause via Keyboard
```javascript
browser({ action: "act", kind: "press", key: "p" });
```

### Toggle Debug Overlay
```javascript
browser({ action: "act", kind: "click", ref: "DEBUG_BTN" });
```

### Extract Debug Values
```javascript
// After enabling debug overlay, snapshot will show:
// - SPAWN: last=X.XX interval=X.XX willSpawn=X
// - PAUSE: isPaused=X pauseTime=X.XX
// - BONUS: active=X timer=X.X noSpawn=X
// - BOSS: active=X state=X timer=X.X
```

## Automation Tips

1. **Use `refs="role"`** for stable element references
2. **Wait for networkidle** before interacting
3. **Capture screenshots** at each state change
4. **Use `timeMs` waits** instead of polling
5. **Check snapshot** for dynamic values

## Example: Automated Bug Report

```javascript
// 1. Open game
browser({ action: "open", url: "https://drpoom.github.io/elango-surfers/" });

// 2. Start game
browser({ action: "act", kind: "click", ref: "START_BTN" });
browser({ action: "act", kind: "wait", timeMs: 3000 });

// 3. Pause
browser({ action: "act", kind: "press", key: "p" });
browser({ action: "act", kind: "wait", timeMs: 10000 }); // Long pause

// 4. Resume
browser({ action: "act", kind: "press", key: "p" });
browser({ action: "act", kind: "wait", timeMs: 5000 });

// 5. Capture evidence
browser({ action: "screenshot", fullPage: true });
browser({ action: "snapshot", refs: "role" });

// 6. Check if coins are spawning (via snapshot analysis)
// If no coins visible after 5s resume → BUG CONFIRMED
```
