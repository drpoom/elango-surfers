# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Elango Surfers - Core Gameplay >> game starts on tap/click
- Location: tests/gameplay.spec.ts:16:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("TAP TO START")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - navigation [ref=e3]:
      - link "SYS_INIT" [ref=e5] [cursor=pointer]:
        - /url: /
    - generic [ref=e6]:
      - generic [ref=e7]:
        - paragraph [ref=e8]: Hello, World! I am
        - heading "Dr. Poom Kongniratsaikul" [level=1] [ref=e9]
        - heading "Test Manager & System Integration Expert" [level=2] [ref=e10]
        - paragraph [ref=e11]:
          - text: I am a multifaceted engineer with a cross-domain background spanning computers, programming, robotics, and quality assurance. Backed by real academic and industrial experience, I bridge the gap between hardware and software to ensure robust, high-quality systems from prototype to production.
          - text: My core focus is on developing comprehensive test strategies and automation frameworks for embedded systems. With deep expertise across all levels of testing, my true strengths lie in Integration and System Testing—whether that means SiL, HiL, or validation on real hardware. I have led testing efforts for a wide range of innovative products, including Smartglasses, advanced sensors, ECUs, and automotive headlamps. I am a collaborative, solutions-oriented professional dedicated to driving excellence within dynamic engineering teams.
        - generic [ref=e12]:
          - link "Initialize Contact" [ref=e13] [cursor=pointer]:
            - /url: "#contact"
          - link "View Logs" [ref=e14] [cursor=pointer]:
            - /url: "#experience"
      - img "Dr. Poom Kongniratsaikul" [ref=e17]
    - generic [ref=e18]:
      - heading "Execution_Logs _" [level=2] [ref=e19]
      - generic [ref=e20]:
        - generic [ref=e23]:
          - heading "Software & System Integration and Test Manager" [level=3] [ref=e24]
          - generic [ref=e25]: Bosch Sensortec GmbH | Aug 2022 - Present
          - paragraph [ref=e26]: Leading testing efforts for a wide range of innovative products, including Smartglasses and advanced sensors. Developing comprehensive test strategies and automation frameworks for embedded systems, bringing deep expertise across all levels of testing, specializing in Integration, System Testing, and full-system validation on real hardware.
        - generic [ref=e29]:
          - heading "Test Automation Engineer" [level=3] [ref=e30]
          - generic [ref=e31]: Marelli Automotive Lighting Reutlingen | Mar 2013 - Dec 2019
          - paragraph [ref=e32]: Developed automation test concepts and tools for automotive ECUs and headlamps (LED Simulator, PSI5 Sensor Simulator, LVDS Simulator). Validated ECU software via requirement-based testing and functional safety. Coordinated international teams across Germany, India, and Romania.
        - generic [ref=e35]:
          - heading "Researcher & Research Assistant" [level=3] [ref=e36]
          - generic [ref=e37]: University of Duisburg-Essen | Jun 2009 - Feb 2013
          - paragraph [ref=e38]: Researched reliability theory applied to engineering systems under high uncertainty, including early design stages and high-voltage direct-current (HVDC) power transmission. Published on IEEE evaluating system reliability. Organized technical courses on digital systems and computer architecture.
    - generic [ref=e39]:
      - heading "Knowledge_Base _" [level=2] [ref=e40]
      - generic [ref=e41]:
        - generic [ref=e44]:
          - heading "Doctor of Engineering (Dr.-Ing.), Computer Engineering" [level=3] [ref=e45]
          - generic [ref=e46]: University of Duisburg-Essen | 2009 - 2013
          - paragraph [ref=e47]: Graduated with an outstanding academic record. Doctoral focus on Reliability Engineering, applying reliability theory to complex engineering systems under high uncertainty to bridge academic theory with industrial applications.
        - generic [ref=e50]:
          - heading "Master of Science, Control and Information Systems" [level=3] [ref=e51]
          - generic [ref=e52]: University of Duisburg-Essen | 2007 - 2009
          - paragraph [ref=e53]: Completed with an outstanding record. Scope encompasses Automation and Robotics, specializing in advanced control systems and information processing, laying the groundwork for expertise in complex system integration.
        - generic [ref=e56]:
          - heading "Bachelor of Engineering, Computer Engineering" [level=3] [ref=e57]
          - generic [ref=e58]: Kasetsart University | 2003 - 2007
          - paragraph [ref=e59]: Built a strong cross-domain foundation in computer hardware, programming, and robotics. Active in academic projects and served as a Teaching Assistant for core engineering courses (Probability, Logic Circuits, C&P).
        - generic [ref=e62]:
          - heading "Science and Computer Programme" [level=3] [ref=e63]
          - generic [ref=e64]: Triam Udom Suksa School | Graduated 2003
          - paragraph [ref=e65]: Completed secondary education at a highly competitive, science-focused institution, fostering early foundational skills in computer science, advanced mathematics, and analytical problem-solving.
    - generic [ref=e66]:
      - heading "System_Specs _" [level=2] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]:
          - heading " Hardware" [level=3] [ref=e70]:
            - generic [ref=e71]: 
            - text: Hardware
          - list [ref=e72]:
            - listitem [ref=e73]: "> Embedded Systems"
            - listitem [ref=e74]: "> Sensors & Smartglasses"
            - listitem [ref=e75]: "> Automotive ECUs"
            - listitem [ref=e76]: "> Hardware-in-the-Loop (HiL)"
        - generic [ref=e77]:
          - heading " Software & Firmware" [level=3] [ref=e78]:
            - generic [ref=e79]: 
            - text: Software & Firmware
          - list [ref=e80]:
            - listitem [ref=e81]: "> Python, C/C++"
            - listitem [ref=e82]: "> Test Automation Frameworks"
            - listitem [ref=e83]: "> UNIX-like (Linux, macOS, OpenSolaris)"
            - listitem [ref=e84]: "> SystemC, RTL, FPGA Validation"
        - generic [ref=e85]:
          - heading " Testing & Management" [level=3] [ref=e86]:
            - generic [ref=e87]: 
            - text: Testing & Management
          - list [ref=e88]:
            - listitem [ref=e89]: "> System & Integration Testing"
            - listitem [ref=e90]: "> All-Level Validation (SiL, HiL, Real HW)"
            - listitem [ref=e91]: "> Cross-functional Leadership"
            - listitem [ref=e92]: "> Languages: English, German, Thai"
    - generic [ref=e93]:
      - heading "Deployed_Modules _" [level=2] [ref=e94]
      - generic [ref=e95]:
        - generic [ref=e96]:
          - heading "Laser Projector for Smartglasses" [level=3] [ref=e98]
          - paragraph [ref=e99]: Testing and validation of miniature laser projection systems for augmented reality Smartglasses. Managed comprehensive system integration testing.
          - generic [ref=e100]:
            - generic [ref=e101]: Smartglasses
            - generic [ref=e102]: Validation
            - generic [ref=e103]: Hardware
        - generic [ref=e104]:
          - heading "Advanced Sensors" [level=3] [ref=e106]
          - paragraph [ref=e107]: System integration and testing for Barometric pressure sensors and Smart Magnetometers, ensuring high reliability and precision.
          - generic [ref=e108]:
            - generic [ref=e109]: Sensors
            - generic [ref=e110]: IoT
            - generic [ref=e111]: Integration
        - generic [ref=e112]:
          - heading "Automotive LED Headlamps" [level=3] [ref=e114]
          - paragraph [ref=e115]: Developed test automation concepts and validated ECU software for intelligent automotive LED headlamp systems, ensuring functional safety.
          - generic [ref=e116]:
            - generic [ref=e117]: ECU
            - generic [ref=e118]: Functional Safety
            - generic [ref=e119]: Automotive
        - generic [ref=e120]:
          - 'heading "Academic Research: IEEE Publications" [level=3] [ref=e122]'
          - paragraph [ref=e123]: Authored technical papers for IEEE evaluating system reliability considering insufficient knowledge, applied to High-Voltage Direct-Current (HVDC) Converter Stations.
          - generic [ref=e124]:
            - generic [ref=e125]: Research
            - generic [ref=e126]: System Reliability
            - generic [ref=e127]: IEEE
    - generic [ref=e128]:
      - heading "Knowledge_Dump _" [level=2] [ref=e129]
      - generic [ref=e131]:
        - generic [ref=e132]:
          - 'heading "The Agentic Shift: Elevating Test Engineers to Test Analysts" [level=3] [ref=e134]':
            - 'link "The Agentic Shift: Elevating Test Engineers to Test Analysts" [ref=e135] [cursor=pointer]':
              - /url: /testing/ai/embedded/2026/03/18/agentic-ai-system-testing.html
          - paragraph [ref=e136]: The landscape of system testing is undergoing a profound transformation. We are moving away from manual, repetitive test execution and stepping into the era of...
        - generic [ref=e137]:
          - generic [ref=e138]:
            - generic [ref=e139]: 
            - text: March 18, 2026
          - link "Read " [ref=e140] [cursor=pointer]:
            - /url: /testing/ai/embedded/2026/03/18/agentic-ai-system-testing.html
            - text: Read
            - generic [ref=e141]: 
    - generic [ref=e142]:
      - heading "Side_Quests _" [level=2] [ref=e143]
      - generic [ref=e144]:
        - generic [ref=e145]:
          - heading " Stock Investments" [level=3] [ref=e147]:
            - generic [ref=e148]: 
            - text: Stock Investments
          - paragraph [ref=e149]: Deep interest in financial markets, value investing, and market analysis. Invited as a guest speaker on a prominent financial TV program in Thailand to discuss investment strategies and market outlook.
          - link " Watch Interview" [ref=e151] [cursor=pointer]:
            - /url: https://www.youtube.com/watch?v=pPHY7O6SXEY
            - generic [ref=e152]: 
            - text: Watch Interview
        - generic [ref=e153]:
          - heading " Business & Hospitality" [level=3] [ref=e155]:
            - generic [ref=e156]: 
            - text: Business & Hospitality
          - paragraph [ref=e157]: Co-Founder and Business Partner at Hotel Römerkrug Weinhaus Weiler (2020-2022). Managed the implementation of modern hotel infrastructure, CM, PMS, and automation within historical buildings.
          - generic [ref=e158]:
            - generic [ref=e159]: Management
            - generic [ref=e160]: Automation
            - generic [ref=e161]: Hospitality
  - contentinfo [ref=e162]:
    - generic [ref=e163]:
      - heading "Ping_Me _" [level=2] [ref=e164]
      - paragraph [ref=e165]: Ready to collaborate or discuss embedded systems? My inbox is always open.
      - generic [ref=e166]:
        - link "" [ref=e167] [cursor=pointer]:
          - /url: https://www.linkedin.com/in/drpoom/
          - generic [ref=e168]: 
        - link "" [ref=e169] [cursor=pointer]:
          - /url: https://github.com/drpoom
          - generic [ref=e170]: 
        - link "" [ref=e171] [cursor=pointer]:
          - /url: mailto:poomkongniratsaikul@gmail.com
          - generic [ref=e172]: 
      - paragraph [ref=e173]: © 2026 Dr. Poom Kongniratsaikul. Built with minimalist retro tech.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Elango Surfers - Core Gameplay', () => {
  4   |   
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |     await page.waitForLoadState('networkidle');
  8   |   });
  9   | 
  10  |   test('game loads and shows title screen', async ({ page }) => {
  11  |     await expect(page.locator('#app')).toBeVisible();
  12  |     await expect(page.locator('text=Elango Surfers')).toBeVisible();
  13  |     await expect(page.locator('button:has-text("TAP TO START")')).toBeVisible();
  14  |   });
  15  | 
  16  |   test('game starts on tap/click', async ({ page }) => {
> 17  |     await page.click('button:has-text("TAP TO START")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  18  |     await page.waitForTimeout(1000);
  19  |     
  20  |     // Score should appear
  21  |     await expect(page.locator('#score')).toBeVisible();
  22  |     
  23  |     // Version should be visible
  24  |     const version = await page.locator('#version').textContent();
  25  |     console.log('Version:', version);
  26  |   });
  27  | 
  28  |   test('pause and resume works', async ({ page }) => {
  29  |     // Start game
  30  |     await page.click('button:has-text("TAP TO START")');
  31  |     await page.waitForTimeout(2000);
  32  |     
  33  |     // Press P to pause
  34  |     await page.keyboard.press('p');
  35  |     await page.waitForTimeout(500);
  36  |     
  37  |     // Pause indicator should appear
  38  |     await expect(page.locator('#pause-indicator')).toBeVisible();
  39  |     
  40  |     // Press P to resume
  41  |     await page.keyboard.press('p');
  42  |     await page.waitForTimeout(500);
  43  |     
  44  |     // Pause indicator should disappear
  45  |     await expect(page.locator('#pause-indicator')).not.toBeVisible();
  46  |   });
  47  | 
  48  |   test('coins spawn after resume', async ({ page }) => {
  49  |     // Start game
  50  |     await page.click('button:has-text("TAP TO START")');
  51  |     await page.waitForTimeout(3000);
  52  |     
  53  |     // Wait for some coins to spawn
  54  |     const initialCoins = await page.locator('[class*="coin"]').count();
  55  |     console.log('Initial coins:', initialCoins);
  56  |     
  57  |     // Pause
  58  |     await page.keyboard.press('p');
  59  |     await page.waitForTimeout(500);
  60  |     
  61  |     // Resume
  62  |     await page.keyboard.press('p');
  63  |     await page.waitForTimeout(3000);
  64  |     
  65  |     // Coins should continue spawning
  66  |     const resumedCoins = await page.locator('[class*="coin"]').count();
  67  |     console.log('Coins after resume:', resumedCoins);
  68  |     
  69  |     // At minimum, coins should still be spawning (count may vary)
  70  |     expect(resumedCoins).toBeGreaterThanOrEqual(0);
  71  |   });
  72  | 
  73  |   test('obstacles spawn after resume', async ({ page }) => {
  74  |     // Start game
  75  |     await page.click('button:has-text("TAP TO START")');
  76  |     await page.waitForTimeout(4000);
  77  |     
  78  |     // Obstacles should exist
  79  |     const obstacles = await page.locator('[class*="obstacle"]').count();
  80  |     console.log('Obstacles before pause:', obstacles);
  81  |     
  82  |     // Pause for 5 seconds
  83  |     await page.keyboard.press('p');
  84  |     await page.waitForTimeout(5000);
  85  |     
  86  |     // Resume
  87  |     await page.keyboard.press('p');
  88  |     await page.waitForTimeout(4000);
  89  |     
  90  |     // Obstacles should continue spawning
  91  |     const resumedObstacles = await page.locator('[class*="obstacle"]').count();
  92  |     console.log('Obstacles after resume:', resumedObstacles);
  93  |   });
  94  | 
  95  |   test('debug overlay can be toggled', async ({ page }) => {
  96  |     await page.click('button:has-text("TAP TO START")');
  97  |     await page.waitForTimeout(1000);
  98  |     
  99  |     // Click settings button to show settings panel
  100 |     await page.click('#settings-btn');
  101 |     await page.waitForTimeout(500);
  102 |     
  103 |     // Click debug button
  104 |     await page.click('button:has-text("Debug")');
  105 |     await page.waitForTimeout(500);
  106 |     
  107 |     // Debug overlay should appear
  108 |     await expect(page.locator('#debug-overlay')).toBeVisible();
  109 |     
  110 |     // Click debug button again to turn off
  111 |     await page.click('button:has-text("Debug")');
  112 |     await page.waitForTimeout(500);
  113 |     
  114 |     // Debug overlay should disappear
  115 |     await expect(page.locator('#debug-overlay')).not.toBeVisible();
  116 |   });
  117 | });
```