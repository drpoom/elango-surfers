# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Elango Surfers - Smoke Tests >> version text appears in page
- Location: tests/smoke.spec.ts:28:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "v5."
Received string:    "<!DOCTYPE html><html lang=\"en\"><head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Dr. Poom Kongniratsaikul</title>
    <!-- Google Fonts: Silkscreen for subtle retro headers, Fira Code for modern tech body -->
    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin=\"\">
    <link href=\"https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;600&amp;family=Silkscreen&amp;display=swap\" rel=\"stylesheet\">
    <!-- FontAwesome for Icons -->
    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">
    <!-- Custom CSS -->
    <link rel=\"stylesheet\" href=\"/style.css\">
</head>
<body>·
    <!-- Main Content -->
    <main id=\"main-content\">·········
        <!-- Navigation -->
        <nav class=\"navbar\">
            <div class=\"nav-brand\"><a href=\"/\" style=\"color: var(--accent); text-decoration: none;\">SYS_INIT</a></div>
            <ul class=\"nav-links\">
                <li><a href=\"/#about\">About</a></li>
                <li><a href=\"/#experience\">Experience</a></li>
                <li><a href=\"/#education\">Education</a></li>
                <li><a href=\"/#skills\">Skills</a></li>
                <li><a href=\"/#projects\">Projects</a></li>
                <li><a href=\"/#articles\">Articles</a></li>
                <li><a href=\"/#interests\">Interests</a></li>
                <li><a href=\"/#contact\">Contact</a></li>
            </ul>
        </nav>·
        <!-- Hero / About Section -->
<section id=\"about\" class=\"hero\">
    <div class=\"hero-content\">
        <p class=\"greeting\">Hello, World! I am</p>
        <h1 class=\"title\">Dr. Poom Kongniratsaikul</h1>
        <h2 class=\"subtitle\">Test Manager &amp; System Integration Expert</h2>
        <p class=\"bio\">
            I am a multifaceted engineer with a cross-domain background spanning computers, programming, robotics, and quality assurance. Backed by real academic and industrial experience, I bridge the gap between hardware and software to ensure robust, high-quality systems from prototype to production.
            <br><br>
            My core focus is on developing comprehensive test strategies and automation frameworks for embedded systems. With deep expertise across all levels of testing, my true strengths lie in Integration and System Testing—whether that means SiL, HiL, or validation on real hardware. I have led testing efforts for a wide range of innovative products, including Smartglasses, advanced sensors, ECUs, and automotive headlamps. I am a collaborative, solutions-oriented professional dedicated to driving excellence within dynamic engineering teams.
        </p>
        <div class=\"hero-actions\">
            <a href=\"#contact\" class=\"btn btn-primary\">Initialize Contact</a>
            <a href=\"#experience\" class=\"btn btn-secondary\">View Logs</a>
        </div>
    </div>
    <!-- Profile Image -->
    <div class=\"hero-image\">
        <div class=\"image-wrapper\">
            <img src=\"/resources/photo.png\" alt=\"Dr. Poom Kongniratsaikul\" class=\"profile-photo\">
        </div>
    </div>
</section>·
<!-- Experience Section -->
<section id=\"experience\" class=\"section\">
    <h2 class=\"section-title\">Execution_Logs <span class=\"blink\">_</span></h2>
    <div class=\"timeline\">·········
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Software &amp; System Integration and Test Manager</h3>
                <span class=\"company\">Bosch Sensortec GmbH | Aug 2022 - Present</span>
                <p>Leading testing efforts for a wide range of innovative products, including Smartglasses and advanced sensors. Developing comprehensive test strategies and automation frameworks for embedded systems, bringing deep expertise across all levels of testing, specializing in Integration, System Testing, and full-system validation on real hardware.</p>
            </div>
        </div>·
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Test Automation Engineer</h3>
                <span class=\"company\">Marelli Automotive Lighting Reutlingen | Mar 2013 - Dec 2019</span>
                <p>Developed automation test concepts and tools for automotive ECUs and headlamps (LED Simulator, PSI5 Sensor Simulator, LVDS Simulator). Validated ECU software via requirement-based testing and functional safety. Coordinated international teams across Germany, India, and Romania.</p>
            </div>
        </div>·
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Researcher &amp; Research Assistant</h3>
                <span class=\"company\">University of Duisburg-Essen | Jun 2009 - Feb 2013</span>
                <p>Researched reliability theory applied to engineering systems under high uncertainty, including early design stages and high-voltage direct-current (HVDC) power transmission. Published on IEEE evaluating system reliability. Organized technical courses on digital systems and computer architecture.</p>
            </div>
        </div>·
    </div>
</section>·
<!-- Education Section -->
<section id=\"education\" class=\"section\">
    <h2 class=\"section-title\">Knowledge_Base <span class=\"blink\">_</span></h2>
    <div class=\"timeline\">·········
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Doctor of Engineering (Dr.-Ing.), Computer Engineering</h3>
                <span class=\"company\">University of Duisburg-Essen | 2009 - 2013</span>
                <p>Graduated with an outstanding academic record. Doctoral focus on Reliability Engineering, applying reliability theory to complex engineering systems under high uncertainty to bridge academic theory with industrial applications.</p>
            </div>
        </div>·
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Master of Science, Control and Information Systems</h3>
                <span class=\"company\">University of Duisburg-Essen | 2007 - 2009</span>
                <p>Completed with an outstanding record. Scope encompasses Automation and Robotics, specializing in advanced control systems and information processing, laying the groundwork for expertise in complex system integration.</p>
            </div>
        </div>·
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Bachelor of Engineering, Computer Engineering</h3>
                <span class=\"company\">Kasetsart University | 2003 - 2007</span>
                <p>Built a strong cross-domain foundation in computer hardware, programming, and robotics. Active in academic projects and served as a Teaching Assistant for core engineering courses (Probability, Logic Circuits, C&amp;P).</p>
            </div>
        </div>·
        <div class=\"timeline-item\">
            <div class=\"timeline-marker\"></div>
            <div class=\"timeline-content\">
                <h3>Science and Computer Programme</h3>
                <span class=\"company\">Triam Udom Suksa School | Graduated 2003</span>
                <p>Completed secondary education at a highly competitive, science-focused institution, fostering early foundational skills in computer science, advanced mathematics, and analytical problem-solving.</p>
            </div>
        </div>·
    </div>
</section>·
<!-- Skills Section -->
<section id=\"skills\" class=\"section\">
    <h2 class=\"section-title\">System_Specs <span class=\"blink\">_</span></h2>
    <div class=\"skills-grid\">·········
        <div class=\"skill-category card\">
            <h3><i class=\"fa-solid fa-microchip\"></i> Hardware</h3>
            <ul class=\"skill-list\">
                <li>Embedded Systems</li>
                <li>Sensors &amp; Smartglasses</li>
                <li>Automotive ECUs</li>
                <li>Hardware-in-the-Loop (HiL)</li>
            </ul>
        </div>·
        <div class=\"skill-category card\">
            <h3><i class=\"fa-solid fa-code\"></i> Software &amp; Firmware</h3>
            <ul class=\"skill-list\">
                <li>Python, C/C++</li>
                <li>Test Automation Frameworks</li>
                <li>UNIX-like (Linux, macOS, OpenSolaris)</li>
                <li>SystemC, RTL, FPGA Validation</li>
            </ul>
        </div>·
        <div class=\"skill-category card\">
            <h3><i class=\"fa-solid fa-network-wired\"></i> Testing &amp; Management</h3>
            <ul class=\"skill-list\">
                <li>System &amp; Integration Testing</li>
                <li>All-Level Validation (SiL, HiL, Real HW)</li>
                <li>Cross-functional Leadership</li>
                <li>Languages: English, German, Thai</li>
            </ul>
        </div>·
    </div>
</section>·
<!-- Projects Section -->
<section id=\"projects\" class=\"section\">
    <h2 class=\"section-title\">Deployed_Modules <span class=\"blink\">_</span></h2>
    <div class=\"projects-grid\">·········
        <div class=\"project-card card\">
            <div class=\"project-header\">
                <h3>Laser Projector for Smartglasses</h3>
            </div>
            <p>Testing and validation of miniature laser projection systems for augmented reality Smartglasses. Managed comprehensive system integration testing.</p>
            <div class=\"project-tags\">
                <span>Smartglasses</span> <span>Validation</span> <span>Hardware</span>
            </div>
        </div>·
        <div class=\"project-card card\">
            <div class=\"project-header\">
                <h3>Advanced Sensors</h3>
            </div>
            <p>System integration and testing for Barometric pressure sensors and Smart Magnetometers, ensuring high reliability and precision.</p>
            <div class=\"project-tags\">
                <span>Sensors</span> <span>IoT</span> <span>Integration</span>
            </div>
        </div>·
        <div class=\"project-card card\">
            <div class=\"project-header\">
                <h3>Automotive LED Headlamps</h3>
            </div>
            <p>Developed test automation concepts and validated ECU software for intelligent automotive LED headlamp systems, ensuring functional safety.</p>
            <div class=\"project-tags\">
                <span>ECU</span> <span>Functional Safety</span> <span>Automotive</span>
            </div>
        </div>·
        <div class=\"project-card card\">
            <div class=\"project-header\">
                <h3>Academic Research: IEEE Publications</h3>
            </div>
            <p>Authored technical papers for IEEE evaluating system reliability considering insufficient knowledge, applied to High-Voltage Direct-Current (HVDC) Converter Stations.</p>
            <div class=\"project-tags\">
                <span>Research</span> <span>System Reliability</span> <span>IEEE</span>
            </div>
        </div>·
    </div>
</section>·
<!-- Articles / Blog Section -->
<section id=\"articles\" class=\"section\">
    <h2 class=\"section-title\">Knowledge_Dump <span class=\"blink\">_</span></h2>·····
    <div class=\"projects-grid\">·········
        <div class=\"project-card card\" style=\"display: flex; flex-direction: column; justify-content: space-between;\">
            <div>
                <div class=\"project-header\" style=\"margin-bottom: 0.5rem;\">
                    <h3 style=\"font-size: 1.1rem;\"><a href=\"/testing/ai/embedded/2026/03/18/agentic-ai-system-testing.html\">The Agentic Shift: Elevating Test Engineers to Test Analysts</a></h3>
                </div>
                <p style=\"font-size: 0.9rem; margin-bottom: 1rem;\">The landscape of system testing is undergoing a profound transformation. We are moving away from manual, repetitive test execution and stepping into the era of...</p>
            </div>
            <div class=\"project-tags\">
                <span><i class=\"fa-regular fa-calendar\"></i> March 18, 2026</span>
                <a href=\"/testing/ai/embedded/2026/03/18/agentic-ai-system-testing.html\" style=\"font-size: 0.8rem; margin-left: auto;\">Read <i class=\"fa-solid fa-arrow-right\"></i></a>
            </div>
        </div>·········
    </div>
</section>·
<!-- Interests Section -->
<section id=\"interests\" class=\"section\">
    <h2 class=\"section-title\">Side_Quests <span class=\"blink\">_</span></h2>
    <div class=\"projects-grid\">·········
        <div class=\"project-card card\">
            <div class=\"project-header\">
                <h3><i class=\"fa-solid fa-chart-line\"></i> Stock Investments</h3>
            </div>
            <p>Deep interest in financial markets, value investing, and market analysis. Invited as a guest speaker on a prominent financial TV program in Thailand to discuss investment strategies and market outlook.</p>
            <div class=\"project-tags\">
                <a href=\"https://www.youtube.com/watch?v=pPHY7O6SXEY\" target=\"_blank\" class=\"btn btn-secondary\" style=\"font-size: 0.8rem; padding: 0.4rem 0.8rem; margin-top: 0.5rem;\"><i class=\"fa-solid fa-play\"></i> Watch Interview</a>
            </div>
        </div>·
        <div class=\"project-card card\">
            <div class=\"project-header\">
                <h3><i class=\"fa-solid fa-building-user\"></i> Business &amp; Hospitality</h3>
            </div>
            <p>Co-Founder and Business Partner at Hotel Römerkrug Weinhaus Weiler (2020-2022). Managed the implementation of modern hotel infrastructure, CM, PMS, and automation within historical buildings.</p>
            <div class=\"project-tags\">
                <span>Management</span> <span>Automation</span> <span>Hospitality</span>
            </div>
        </div>·
    </div>
</section>··
    </main>·
    <!-- Footer / Contact -->
    <footer id=\"contact\" class=\"footer\">
        <div class=\"footer-content\">
            <h2 class=\"section-title\">Ping_Me <span class=\"blink\">_</span></h2>
            <p>Ready to collaborate or discuss embedded systems? My inbox is always open.</p>
            <div class=\"social-links\">
                <a href=\"https://www.linkedin.com/in/drpoom/\" target=\"_blank\" class=\"social-icon\" title=\"LinkedIn\"><i class=\"fa-brands fa-linkedin-in\"></i></a>
                <a href=\"https://github.com/drpoom\" target=\"_blank\" class=\"social-icon\" title=\"GitHub\"><i class=\"fa-brands fa-github\"></i></a>
                <a href=\"mailto:poomkongniratsaikul@gmail.com\" class=\"social-icon\" title=\"Email\"><i class=\"fa-solid fa-envelope\"></i></a>
            </div>
            <p class=\"copyright\">© 2026 Dr. Poom Kongniratsaikul. Built with minimalist retro tech.</p>
        </div>
    </footer>·
    <!-- Custom Script -->
    <script src=\"/script.js\"></script>·
</body></html>"
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Elango Surfers - Smoke Tests', () => {
  4  |   
  5  |   test('page loads successfully', async ({ page }) => {
  6  |     const response = await page.goto('/');
  7  |     expect(response?.status()).toBe(200);
  8  |   });
  9  | 
  10 |   test('page has correct title', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     await expect(page).toHaveTitle('Elango Surfers');
  13 |   });
  14 | 
  15 |   test('canvas element exists', async ({ page }) => {
  16 |     await page.goto('/');
  17 |     await page.waitForSelector('canvas');
  18 |     const canvas = page.locator('canvas');
  19 |     await expect(canvas).toBeVisible();
  20 |   });
  21 | 
  22 |   test('app container exists', async ({ page }) => {
  23 |     await page.goto('/');
  24 |     const app = page.locator('#app');
  25 |     await expect(app).toBeVisible();
  26 |   });
  27 | 
  28 |   test('version text appears in page', async ({ page }) => {
  29 |     await page.goto('/');
  30 |     await page.waitForTimeout(3000); // Wait for Vue mount
  31 |     
  32 |     const pageContent = await page.content();
> 33 |     expect(pageContent).toContain('v5.');
     |                         ^ Error: expect(received).toContain(expected) // indexOf
  34 |   });
  35 | 
  36 |   test('game does not crash for 15 seconds', async ({ page }) => {
  37 |     await page.goto('/');
  38 |     await page.waitForTimeout(15000);
  39 |     
  40 |     // If we get here, game didn't crash
  41 |     const title = await page.title();
  42 |     expect(title).toBe('Elango Surfers');
  43 |   });
  44 | });
  45 | 
```