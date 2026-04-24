# Elango Surfers - Browser Automation Scripts

Automated browser testing and debugging using OpenClaw's browser tool.

## Quick Start

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug -- tests/gameplay.spec.ts
```

## OpenClaw Browser Commands

### Snapshot Game State
```javascript
browser({
  action: "snapshot",
  url: "https://drpoom.github.io/elango-surfers/",
  refs: "aria"
})
```

### Screenshot for Visual Regression
```javascript
browser({
  action: "screenshot",
  url: "https://drpoom.github.io/elango-surfers/",
  fullPage: true,
  type: "png"
})
```

### Interact with Game
```javascript
// Start game
browser({ action: "act", kind: "click", ref: "e12" })

// Pause game
browser({ action: "act", kind: "press", key: "p" })

// Take screenshot after action
browser({ action: "screenshot", fullPage: true })
```

## Test Coverage

### Gameplay Tests (`tests/gameplay.spec.ts`)
- ✅ Game loads and shows title screen
- ✅ Game starts on tap/click
- ✅ Pause and resume works
- ✅ Coins spawn after resume
- ✅ Obstacles spawn after resume
- ✅ Debug overlay can be toggled

### Boss Tests (`tests/boss.spec.ts`)
- 🔄 Stage 3 boss appears
- 🔄 Boss warning appears before boss fight

## CI/CD Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests to `main`

Results uploaded to GitHub Actions artifacts.

## Debug Mode

Enable in-game debug overlay to see:
- Spawn timers
- Pause state
- Bonus zone status
- Boss state
- Touch/mic/tilt inputs

Click the 🐛 Debug button in settings panel.
