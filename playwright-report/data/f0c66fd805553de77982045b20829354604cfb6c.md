# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Elango Surfers - Core Gameplay >> obstacles spawn after resume
- Location: tests/gameplay.spec.ts:73:3

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
      - list [ref=e6]:
        - listitem [ref=e7]:
          - link "About" [ref=e8] [cursor=pointer]:
            - /url: /#about
        - listitem [ref=e9]:
          - link "Experience" [ref=e10] [cursor=pointer]:
            - /url: /#experience
        - listitem [ref=e11]:
          - link "Education" [ref=e12] [cursor=pointer]:
            - /url: /#education
        - listitem [ref=e13]:
          - link "Skills" [ref=e14] [cursor=pointer]:
            - /url: /#skills
        - listitem [ref=e15]:
          - link "Projects" [ref=e16] [cursor=pointer]:
            - /url: /#projects
        - listitem [ref=e17]:
          - link "Articles" [ref=e18] [cursor=pointer]:
            - /url: /#articles
        - listitem [ref=e19]:
          - link "Interests" [ref=e20] [cursor=pointer]:
            - /url: /#interests
        - listitem [ref=e21]:
          - link "Contact" [ref=e22] [cursor=pointer]:
            - /url: /#contact
    - generic [ref=e23]:
      - generic [ref=e24]:
        - paragraph [ref=e25]: Hello, World! I am
        - heading "Dr. Poom Kongniratsaikul" [level=1] [ref=e26]
        - heading "Test Manager & System Integration Expert" [level=2] [ref=e27]
        - paragraph [ref=e28]:
          - text: I am a multifaceted engineer with a cross-domain background spanning computers, programming, robotics, and quality assurance. Backed by real academic and industrial experience, I bridge the gap between hardware and software to ensure robust, high-quality systems from prototype to production.
          - text: My core focus is on developing comprehensive test strategies and automation frameworks for embedded systems. With deep expertise across all levels of testing, my true strengths lie in Integration and System Testing—whether that means SiL, HiL, or validation on real hardware. I have led testing efforts for a wide range of innovative products, including Smartglasses, advanced sensors, ECUs, and automotive headlamps. I am a collaborative, solutions-oriented professional dedicated to driving excellence within dynamic engineering teams.
        - generic [ref=e29]:
          - link "Initialize Contact" [ref=e30] [cursor=pointer]:
            - /url: "#contact"
          - link "View Logs" [ref=e31] [cursor=pointer]:
            - /url: "#experience"
      - img "Dr. Poom Kongniratsaikul" [ref=e34]
    - generic [ref=e35]:
      - heading "Execution_Logs _" [level=2] [ref=e36]
      - generic [ref=e37]:
        - generic [ref=e40]:
          - heading "Software & System Integration and Test Manager" [level=3] [ref=e41]
          - generic [ref=e42]: Bosch Sensortec GmbH | Aug 2022 - Present
          - paragraph [ref=e43]: Leading testing efforts for a wide range of innovative products, including Smartglasses and advanced sensors. Developing comprehensive test strategies and automation frameworks for embedded systems, bringing deep expertise across all levels of testing, specializing in Integration, System Testing, and full-system validation on real hardware.
        - generic [ref=e46]:
          - heading "Test Automation Engineer" [level=3] [ref=e47]
          - generic [ref=e48]: Marelli Automotive Lighting Reutlingen | Mar 2013 - Dec 2019
          - paragraph [ref=e49]: Developed automation test concepts and tools for automotive ECUs and headlamps (LED Simulator, PSI5 Sensor Simulator, LVDS Simulator). Validated ECU software via requirement-based testing and functional safety. Coordinated international teams across Germany, India, and Romania.
        - generic [ref=e52]:
          - heading "Researcher & Research Assistant" [level=3] [ref=e53]
          - generic [ref=e54]: University of Duisburg-Essen | Jun 2009 - Feb 2013
          - paragraph [ref=e55]: Researched reliability theory applied to engineering systems under high uncertainty, including early design stages and high-voltage direct-current (HVDC) power transmission. Published on IEEE evaluating system reliability. Organized technical courses on digital systems and computer architecture.
    - generic [ref=e56]:
      - heading "Knowledge_Base _" [level=2] [ref=e57]
      - generic [ref=e58]:
        - generic [ref=e61]:
          - heading "Doctor of Engineering (Dr.-Ing.), Computer Engineering" [level=3] [ref=e62]
          - generic [ref=e63]: University of Duisburg-Essen | 2009 - 2013
          - paragraph [ref=e64]: Graduated with an outstanding academic record. Doctoral focus on Reliability Engineering, applying reliability theory to complex engineering systems under high uncertainty to bridge academic theory with industrial applications.
        - generic [ref=e67]:
          - heading "Master of Science, Control and Information Systems" [level=3] [ref=e68]
          - generic [ref=e69]: University of Duisburg-Essen | 2007 - 2009
          - paragraph [ref=e70]: Completed with an outstanding record. Scope encompasses Automation and Robotics, specializing in advanced control systems and information processing, laying the groundwork for expertise in complex system integration.
        - generic [ref=e73]:
          - heading "Bachelor of Engineering, Computer Engineering" [level=3] [ref=e74]
          - generic [ref=e75]: Kasetsart University | 2003 - 2007
          - paragraph [ref=e76]: Built a strong cross-domain foundation in computer hardware, programming, and robotics. Active in academic projects and served as a Teaching Assistant for core engineering courses (Probability, Logic Circuits, C&P).
        - generic [ref=e79]:
          - heading "Science and Computer Programme" [level=3] [ref=e80]
          - generic [ref=e81]: Triam Udom Suksa School | Graduated 2003
          - paragraph [ref=e82]: Completed secondary education at a highly competitive, science-focused institution, fostering early foundational skills in computer science, advanced mathematics, and analytical problem-solving.
    - generic [ref=e83]:
      - heading "System_Specs _" [level=2] [ref=e84]
      - generic [ref=e85]:
        - generic [ref=e86]:
          - heading " Hardware" [level=3] [ref=e87]:
            - generic [ref=e88]: 
            - text: Hardware
          - list [ref=e89]:
            - listitem [ref=e90]: "> Embedded Systems"
            - listitem [ref=e91]: "> Sensors & Smartglasses"
            - listitem [ref=e92]: "> Automotive ECUs"
            - listitem [ref=e93]: "> Hardware-in-the-Loop (HiL)"
        - generic [ref=e94]:
          - heading " Software & Firmware" [level=3] [ref=e95]:
            - generic [ref=e96]: 
            - text: Software & Firmware
          - list [ref=e97]:
            - listitem [ref=e98]: "> Python, C/C++"
            - listitem [ref=e99]: "> Test Automation Frameworks"
            - listitem [ref=e100]: "> UNIX-like (Linux, macOS, OpenSolaris)"
            - listitem [ref=e101]: "> SystemC, RTL, FPGA Validation"
        - generic [ref=e102]:
          - heading " Testing & Management" [level=3] [ref=e103]:
            - generic [ref=e104]: 
            - text: Testing & Management
          - list [ref=e105]:
            - listitem [ref=e106]: "> System & Integration Testing"
            - listitem [ref=e107]: "> All-Level Validation (SiL, HiL, Real HW)"
            - listitem [ref=e108]: "> Cross-functional Leadership"
            - listitem [ref=e109]: "> Languages: English, German, Thai"
    - generic [ref=e110]:
      - heading "Deployed_Modules _" [level=2] [ref=e111]
      - generic [ref=e112]:
        - generic [ref=e113]:
          - heading "Laser Projector for Smartglasses" [level=3] [ref=e115]
          - paragraph [ref=e116]: Testing and validation of miniature laser projection systems for augmented reality Smartglasses. Managed comprehensive system integration testing.
          - generic [ref=e117]:
            - generic [ref=e118]: Smartglasses
            - generic [ref=e119]: Validation
            - generic [ref=e120]: Hardware
        - generic [ref=e121]:
          - heading "Advanced Sensors" [level=3] [ref=e123]
          - paragraph [ref=e124]: System integration and testing for Barometric pressure sensors and Smart Magnetometers, ensuring high reliability and precision.
          - generic [ref=e125]:
            - generic [ref=e126]: Sensors
            - generic [ref=e127]: IoT
            - generic [ref=e128]: Integration
        - generic [ref=e129]:
          - heading "Automotive LED Headlamps" [level=3] [ref=e131]
          - paragraph [ref=e132]: Developed test automation concepts and validated ECU software for intelligent automotive LED headlamp systems, ensuring functional safety.
          - generic [ref=e133]:
            - generic [ref=e134]: ECU
            - generic [ref=e135]: Functional Safety
            - generic [ref=e136]: Automotive
        - generic [ref=e137]:
          - 'heading "Academic Research: IEEE Publications" [level=3] [ref=e139]'
          - paragraph [ref=e140]: Authored technical papers for IEEE evaluating system reliability considering insufficient knowledge, applied to High-Voltage Direct-Current (HVDC) Converter Stations.
          - generic [ref=e141]:
            - generic [ref=e142]: Research
            - generic [ref=e143]: System Reliability
            - generic [ref=e144]: IEEE
    - generic [ref=e145]:
      - heading "Knowledge_Dump _" [level=2] [ref=e146]
      - generic [ref=e148]:
        - generic [ref=e149]:
          - 'heading "The Agentic Shift: Elevating Test Engineers to Test Analysts" [level=3] [ref=e151]':
            - 'link "The Agentic Shift: Elevating Test Engineers to Test Analysts" [ref=e152] [cursor=pointer]':
              - /url: /testing/ai/embedded/2026/03/18/agentic-ai-system-testing.html
          - paragraph [ref=e153]: The landscape of system testing is undergoing a profound transformation. We are moving away from manual, repetitive test execution and stepping into the era of...
        - generic [ref=e154]:
          - generic [ref=e155]:
            - generic [ref=e156]: 
            - text: March 18, 2026
          - link "Read " [ref=e157] [cursor=pointer]:
            - /url: /testing/ai/embedded/2026/03/18/agentic-ai-system-testing.html
            - text: Read
            - generic [ref=e158]: 
    - generic [ref=e159]:
      - heading "Side_Quests _" [level=2] [ref=e160]
      - generic [ref=e161]:
        - generic [ref=e162]:
          - heading " Stock Investments" [level=3] [ref=e164]:
            - generic [ref=e165]: 
            - text: Stock Investments
          - paragraph [ref=e166]: Deep interest in financial markets, value investing, and market analysis. Invited as a guest speaker on a prominent financial TV program in Thailand to discuss investment strategies and market outlook.
          - link " Watch Interview" [ref=e168] [cursor=pointer]:
            - /url: https://www.youtube.com/watch?v=pPHY7O6SXEY
            - generic [ref=e169]: 
            - text: Watch Interview
        - generic [ref=e170]:
          - heading " Business & Hospitality" [level=3] [ref=e172]:
            - generic [ref=e173]: 
            - text: Business & Hospitality
          - paragraph [ref=e174]: Co-Founder and Business Partner at Hotel Römerkrug Weinhaus Weiler (2020-2022). Managed the implementation of modern hotel infrastructure, CM, PMS, and automation within historical buildings.
          - generic [ref=e175]:
            - generic [ref=e176]: Management
            - generic [ref=e177]: Automation
            - generic [ref=e178]: Hospitality
  - contentinfo [ref=e179]:
    - generic [ref=e180]:
      - heading "Ping_Me _" [level=2] [ref=e181]
      - paragraph [ref=e182]: Ready to collaborate or discuss embedded systems? My inbox is always open.
      - generic [ref=e183]:
        - link "" [ref=e184] [cursor=pointer]:
          - /url: https://www.linkedin.com/in/drpoom/
          - generic [ref=e185]: 
        - link "" [ref=e186] [cursor=pointer]:
          - /url: https://github.com/drpoom
          - generic [ref=e187]: 
        - link "" [ref=e188] [cursor=pointer]:
          - /url: mailto:poomkongniratsaikul@gmail.com
          - generic [ref=e189]: 
      - paragraph [ref=e190]: © 2026 Dr. Poom Kongniratsaikul. Built with minimalist retro tech.
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
  17  |     await page.click('button:has-text("TAP TO START")');
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
> 75  |     await page.click('button:has-text("TAP TO START")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  118 | 
```