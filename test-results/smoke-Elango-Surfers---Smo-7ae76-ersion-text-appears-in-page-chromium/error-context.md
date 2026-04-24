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