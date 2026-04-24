# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-regression.spec.ts >> Elango Surfers - Visual Regression Tests >> debug overlay visual
- Location: tests/visual-regression.spec.ts:93:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.0.18
    - generic: "Score: 1104"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
  - generic:
    - generic: 🐛 DEBUG MODE
    - generic:
      - strong: "TOUCH:"
      - text: start(0,0) end(,) delta(NaN,NaN)
    - generic:
      - strong: "TILT:"
      - text: beta=0.0 gamma=0.0 initBeta=null enabled=true
    - generic:
      - strong: "MIC:"
      - text: vol=0.0 ctx= enabled=false
    - generic:
      - strong: "STAGE:"
      - text: cur=0 debug=-1 name=The Modern Highway
    - generic:
      - strong: "RENDER:"
      - text: grassY=0 grassRO=0 grassDW=false roadY=0 roadRO=0
  - generic: ➡️
  - generic:
    - text: ⏸️ PAUSED
    - text: Click/Tap/Press any key to resume
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]: 🎤🔴
    - generic [ref=e6] [cursor=pointer]: 📱
    - generic [ref=e7] [cursor=pointer]: 🔊
    - generic [ref=e8] [cursor=pointer]: ⚙️
  - generic [ref=e11]:
    - heading "⚙️ Settings" [level=2] [ref=e12]
    - button "Close" [ref=e13] [cursor=pointer]
    - generic [ref=e14]:
      - heading "🎮 Game Settings" [level=3] [ref=e15]
      - generic [ref=e16] [cursor=pointer]:
        - checkbox "Road Curves" [checked] [ref=e17]
        - text: Road Curves
      - generic [ref=e18] [cursor=pointer]:
        - checkbox "Reduce Motion" [ref=e19]
        - text: Reduce Motion
    - generic [ref=e20]:
      - 'heading "🗺️ Debug: Start Stage" [level=3] [ref=e21]'
      - generic [ref=e22]:
        - button "Normal" [ref=e23] [cursor=pointer]
        - button "1. The Modern Highway" [ref=e24] [cursor=pointer]
        - button "2. The Medieval Path" [ref=e25] [cursor=pointer]
        - button "3. The Concrete Jungle" [ref=e26] [cursor=pointer]
      - generic [ref=e27]: Next game starts at this stage
    - generic [ref=e28]:
      - heading "🎨 Skins" [level=3] [ref=e29]
      - generic [ref=e30]:
        - button "🎨" [ref=e31] [cursor=pointer]
        - button "🔒" [disabled] [ref=e32] [cursor=pointer]
        - button "🔒" [disabled] [ref=e33] [cursor=pointer]
        - button "🔒" [disabled] [ref=e34] [cursor=pointer]
        - button "🔒" [disabled] [ref=e35] [cursor=pointer]
    - generic [ref=e36]:
      - heading "🎩 Hats" [level=3] [ref=e37]
      - generic [ref=e38]:
        - button "None" [ref=e39] [cursor=pointer]
        - button "🔒 cap" [disabled] [ref=e40]
        - button "🔒 crown" [disabled] [ref=e41]
        - button "🔒 helmet" [disabled] [ref=e42]
    - generic [ref=e43]:
      - heading "🏆 Achievements (0/12)" [level=3] [ref=e44]
      - list [ref=e45]:
        - listitem [ref=e46]: 🔒 First Coin!
        - listitem [ref=e47]: 🔒 Coin Collector
        - listitem [ref=e48]: 🔒 Survivor
        - listitem [ref=e49]: 🔒 Combo Master
        - listitem [ref=e50]: 🔒 High Flyer
        - listitem [ref=e51]: 🔒 Powered Up
        - listitem [ref=e52]: 🔒 Power User
        - listitem [ref=e53]: 🔒 Night Runner
        - listitem [ref=e54]: 🔒 Fashion Forward
        - listitem [ref=e55]: 🔒 Hat Collector
        - listitem [ref=e56]: 🔒 Untouchable
        - listitem [ref=e57]: 🔒 Magnet Master
    - button "🐛 Debug ON" [active] [ref=e58] [cursor=pointer]
```

# Test source

```ts
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = path.dirname(__filename);
  8   | 
  9   | test.describe('Elango Surfers - Visual Regression Tests', () => {
  10  |   
  11  |   const BASELINE_DIR = path.join(__dirname, '../visual-baselines');
  12  |   
  13  |   test.beforeEach(async ({ page }) => {
  14  |     await page.goto('https://www.drpoom.com/elango-surfers/');
  15  |     await page.waitForLoadState('networkidle');
  16  |     await page.waitForTimeout(3000);
  17  |   });
  18  | 
  19  |   test('title screen matches baseline', async ({ page }) => {
  20  |     const screenshot = await page.screenshot({ fullPage: true });
  21  |     const baselinePath = path.join(BASELINE_DIR, 'title-screen.png');
  22  |     
  23  |     // Ensure baseline directory exists
  24  |     if (!fs.existsSync(BASELINE_DIR)) {
  25  |       fs.mkdirSync(BASELINE_DIR, { recursive: true });
  26  |     }
  27  |     
  28  |     // If baseline doesn't exist, create it
  29  |     if (!fs.existsSync(baselinePath)) {
  30  |       fs.writeFileSync(baselinePath, screenshot);
  31  |       console.log('Created baseline:', baselinePath);
  32  |     } else {
  33  |       // Save current screenshot for comparison
  34  |       const currentPath = path.join(BASELINE_DIR, 'title-screen-current.png');
  35  |       fs.writeFileSync(currentPath, screenshot);
  36  |       console.log('Saved current screenshot for comparison');
  37  |     }
  38  |     
  39  |     expect(screenshot.length).toBeGreaterThan(0);
  40  |   });
  41  | 
  42  |   test('gameplay screen matches baseline', async ({ page }) => {
  43  |     // Start game
  44  |     await page.mouse.click(400, 300);
  45  |     await page.waitForTimeout(5000);
  46  |     
  47  |     const screenshot = await page.screenshot({ fullPage: true });
  48  |     const baselinePath = path.join(BASELINE_DIR, 'gameplay-screen.png');
  49  |     
  50  |     // Ensure baseline directory exists
  51  |     if (!fs.existsSync(BASELINE_DIR)) {
  52  |       fs.mkdirSync(BASELINE_DIR, { recursive: true });
  53  |     }
  54  |     
  55  |     // If baseline doesn't exist, create it
  56  |     if (!fs.existsSync(baselinePath)) {
  57  |       fs.writeFileSync(baselinePath, screenshot);
  58  |       console.log('Created baseline:', baselinePath);
  59  |     } else {
  60  |       // Save current screenshot for comparison
  61  |       const currentPath = path.join(BASELINE_DIR, 'gameplay-screen-current.png');
  62  |       fs.writeFileSync(currentPath, screenshot);
  63  |       console.log('Saved current screenshot for comparison');
  64  |     }
  65  |     
  66  |     expect(screenshot.length).toBeGreaterThan(0);
  67  |   });
  68  | 
  69  |   test('settings panel visual', async ({ page }) => {
  70  |     // Start game
  71  |     await page.mouse.click(400, 300);
  72  |     await page.waitForTimeout(2000);
  73  |     
  74  |     // Open settings
  75  |     await page.click('#settings-btn');
  76  |     await page.waitForTimeout(1000);
  77  |     
  78  |     const screenshot = await page.screenshot({ fullPage: true });
  79  |     const baselinePath = path.join(BASELINE_DIR, 'settings-panel.png');
  80  |     
  81  |     if (!fs.existsSync(BASELINE_DIR)) {
  82  |       fs.mkdirSync(BASELINE_DIR, { recursive: true });
  83  |     }
  84  |     
  85  |     if (!fs.existsSync(baselinePath)) {
  86  |       fs.writeFileSync(baselinePath, screenshot);
  87  |       console.log('Created baseline:', baselinePath);
  88  |     }
  89  |     
  90  |     expect(screenshot.length).toBeGreaterThan(0);
  91  |   });
  92  | 
  93  |   test('debug overlay visual', async ({ page }) => {
  94  |     // Start game
  95  |     await page.mouse.click(400, 300);
  96  |     await page.waitForTimeout(2000);
  97  |     
  98  |     // Open settings
  99  |     await page.click('#settings-btn');
  100 |     await page.waitForTimeout(1000);
  101 |     
  102 |     // Enable debug
  103 |     const debugBtn = page.locator('button:has-text("Debug")');
  104 |     if (await debugBtn.count() > 0) {
  105 |       await debugBtn.click();
> 106 |       await page.waitForTimeout(1000);
      |                  ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  107 |       
  108 |       const screenshot = await page.screenshot({ fullPage: true });
  109 |       const baselinePath = path.join(BASELINE_DIR, 'debug-overlay.png');
  110 |       
  111 |       if (!fs.existsSync(BASELINE_DIR)) {
  112 |         fs.mkdirSync(BASELINE_DIR, { recursive: true });
  113 |       }
  114 |       
  115 |       if (!fs.existsSync(baselinePath)) {
  116 |         fs.writeFileSync(baselinePath, screenshot);
  117 |         console.log('Created baseline:', baselinePath);
  118 |       }
  119 |       
  120 |       expect(screenshot.length).toBeGreaterThan(0);
  121 |     }
  122 |   });
  123 | 
  124 |   test('UI elements are visible', async ({ page }) => {
  125 |     // Start game
  126 |     await page.mouse.click(400, 300);
  127 |     await page.waitForTimeout(3000);
  128 |     
  129 |     // Take screenshot with element highlights
  130 |     const screenshot = await page.screenshot({ fullPage: true });
  131 |     
  132 |     // Verify key UI elements exist
  133 |     const scoreVisible = await page.locator('#score').isVisible();
  134 |     const highScoreVisible = await page.locator('#highscore').isVisible();
  135 |     const versionVisible = await page.locator('#version').isVisible();
  136 |     
  137 |     console.log('UI elements visible:', { scoreVisible, highScoreVisible, versionVisible });
  138 |     
  139 |     expect(scoreVisible).toBe(true);
  140 |     expect(highScoreVisible).toBe(true);
  141 |     expect(versionVisible).toBe(true);
  142 |   });
  143 | });
  144 | 
```