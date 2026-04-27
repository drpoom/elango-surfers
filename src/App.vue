<template>
  <div id="game-container">
    <LoadingScreen v-if="showLoadingScreen" :version="VERSION" :progress="loadingProgress" :loaded="isLoaded" @start="onLoadingStart" />
    <div id="game-info">
      <div id="version">{{ VERSION }}</div>
      <div id="score">Score: {{ score }}</div>
      <div id="highscore">High Score: {{ highScore }}</div>
      <div id="combo" v-if="comboCount > 1">🔥 x{{ comboCount }}</div>
      <div id="powerup-indicator" v-if="activePowerup">{{ powerupIcon }} {{ powerupName }} {{ powerupTimeLeft }}s</div>
      <div id="fly-indicator" v-if="micEnabledRef">&#x1F3A4;&#x2708;ï¸</div>
      <div id="stage-indicator" v-if="!gameOver">STAGE {{ currentStage + 1 }}: {{ STAGES[currentStage].name }}</div>
      <!-- Debug mode indicator -->
      <div v-if="debugMode" style="position:fixed;top:10px;left:10px;font-size:18px;z-index:10000">🐛</div>
      <!-- God mode indicator -->
      <div v-if="godMode" style="position:fixed;top:10px;left:40px;font-size:14px;font-weight:bold;color:#ffd700;z-index:10000;text-shadow:0 0 5px #ffd700">GOD MODE</div>
      <div id="boss-warning" v-if="bossWarning && !bossActive" style="color:#ff4444;font-size:20px;font-weight:bold;animation:pulse 0.5s infinite">
        ⚠️ BOSS INCOMING! ⚠️
      </div>
      <div id="boss-bar" v-if="bossActive && !bossDefeated">
        <div class="boss-label">BOSS</div>
        <div class="boss-health-track"><div class="boss-health-fill" :style="{ width: bossHealth + '%' }"></div></div>
      </div>
    </div>
    <!-- DEBUG OVERLAY -->
    <div v-if="showDebugOverlay" id="debug-overlay" style="position:absolute;top:60px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;font-size:10px;padding:8px;border-radius:4px;max-width:280px;z-index:9999;pointer-events:none">
      <div style="font-weight:bold;margin-bottom:4px;color:#ff0">🐛 DEBUG MODE</div>
      <div><strong>TOUCH:</strong> start({{ touchStartX }},{{ touchStartY }}) end({{ touchEndX }},{{ touchEndY }}) delta({{ Math.round(touchEndX - touchStartX) }},{{ Math.round(touchEndY - touchStartY) }})</div>
      <div><strong>TILT:</strong> beta={{ (lastBeta ?? 0).toFixed(1) }} gamma={{ (lastGamma ?? 0).toFixed(1) }} initBeta={{ tiltInitialBeta !== null ? tiltInitialBeta.toFixed(1) : 'null' }} enabled={{ tiltEnabled }}</div>
      <div><strong>MIC:</strong> vol={{ (lastMicVolume ?? 0).toFixed(1) }} ctx={{ audioCtxState }} enabled={{ micEnabledRef }}</div>
      <div><strong>STAGE:</strong> cur={{ currentStage }} debug={{ debugStartStage }} name={{ STAGES[currentStage]?.name || 'N/A' }}</div>
      <div><strong>SPAWN:</strong> grace={{ (gameDuration < 1.5) }} dur={{ gameDuration?.toFixed(2) || 'N/A' }} sinceLast={{ (Date.now() % 10000 / 1000).toFixed(2) }} int={{ spawnInterval?.toFixed(2) }}</div>
      <div><strong>RENDER:</strong> grassY={{ grassY }} grassRO={{ grassRenderOrder }} grassDW={{ grassDepthWrite }} roadY={{ roadY }} roadRO={{ roadRenderOrder }}</div>
    </div>
    <div id="floating-texts">
      <div id="near-miss" v-if="nearMissTextRef">{{ nearMissTextRef }}</div>
      <div id="event-alert" v-if="eventAlertTextRef">{{ eventAlertTextRef }}</div>
      <div id="bonus-zone" v-if="inBonusZoneRef">&#x1F308; BONUS ZONE! {{ Math.ceil(bonusTimerRef) }}s</div>
      <div id="showroom-zone" v-if="inShowroomRef" style="color:#ff69b4;font-size:24px;font-weight:bold;text-shadow:0 0 10px #ff69b4">&#x2728; SHOWROOM! x2 SCORE {{ Math.ceil(showroomTimerRef) }}s</div>
    </div>
    <div id="curve-indicator" v-if="!gameOver && Math.abs(roadCurve) > 0.15"
         :style="{ opacity: Math.min(Math.abs(roadCurve) * 1.5, 1) }">
      {{ roadCurve > 0 ? '➡️' : '⬅️' }}
    </div>
    <div id="pause-indicator" v-if="isPaused" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;font-weight:bold;color:#fff;text-shadow:0 0 20px #000;z-index:9999;pointer-events:none">⏸️ PAUSED<br><span style="font-size:18px">Click/Tap/Press any key to resume</span></div>
    <div id="top-buttons">
      <div id="mic-btn" @click="toggleMic">{{ micEnabledRef ? '🎤' : '🎤🔴' }}</div>
      <div id="tilt-btn" @click="toggleTilt">{{ tiltEnabledRef ? '📱' : '📱🔴' }}</div>
      <div id="mute-btn" @click="toggleMute">{{ muteIcon }}</div>
      <div id="settings-btn" @click="toggleSettings">⚙️</div>
    </div>
    <div id="instructions" v-if="score < 1 && !gameOver">A/D ←/→ Move | W/↑ Jump | S/↓ Slide<br>📱 Swipe | Tilt | 🎤 Blow to fly!</div>
    <div id="game-canvas" tabindex="-1"></div>
    <div id="vignette-glow"></div>
    <div v-if="gameOver" id="game-over">
      <h1>GAME OVER</h1>
      <p>Your Score: {{ score }}</p>
      <p v-if="score >= highScore" style="color: #ffd700; font-weight: bold;">⭐ NEW HIGH SCORE! ⭐</p>
      <!-- Leaderboard -->
      <div id="leaderboard" v-if="leaderboard.length > 0">
        <h3 style="margin:0.5rem 0 0.25rem;color:#ffd700">🌍 GLOBAL Leaderboard <span v-if="syncStatus === 'syncing'" style="color:#888;font-size:0.7em">⏳ syncing…</span><span v-if="syncStatus === 'error'" style="color:#f66;font-size:0.7em">📡 offline</span></h3>
        <div v-for="(entry, i) in leaderboard" :key="i" class="lb-entry">
          <span class="lb-rank">{{ i + 1 }}.</span>
          <span class="lb-name">{{ entry.name }}</span>
          <span class="lb-score">{{ entry.score.toLocaleString() }}</span>
        </div>
      </div>
      <!-- Name entry for high score -->
      <div v-if="showNameEntry" id="name-entry">
        <p style="color:#ffd700;font-weight:bold;margin-bottom:0.5rem">Enter your name (3 chars):</p>
        <input 
          v-model="playerName" 
          maxlength="3" 
          placeholder="AAA"
          @keyup.enter="submitScore"
          id="name-input"
        />
        <button @click="submitScore" :disabled="playerName.trim().length === 0" id="submit-btn">SAVE</button>
        <button @click="showNameEntry = false" id="skip-btn">SKIP</button>
      </div>
      <p style="margin-top:0.75rem;font-size:0.8rem;color:#aaa">Press SPACE or tap to restart</p>
    </div>
    <div v-if="countdownActive" id="countdown">{{ countdownText }}</div>
    <div v-if="showSettings" id="settings-panel">
      <h2>⚙️ Settings</h2>
      <button @click="toggleSettings">Close</button>
      <div class="settings-section" style="border-bottom:1px solid #444;padding-bottom:1rem;margin-bottom:1rem">
        <h3>🎮 Game Settings</h3>
        <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
          <input type="checkbox" v-model="roadCurveEnabled" style="width:20px;height:20px;cursor:pointer" /> Road Curves
        </label>
        <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
          <input type="checkbox" v-model="reduceMotionRef" @change="saveScreenEffects" style="width:20px;height:20px;cursor:pointer" /> Reduce Motion
        </label>
      </div>
      <div class="settings-section" style="border-bottom:1px solid #444;padding-bottom:1rem;margin-bottom:1rem">
        <h3>🗺️ Debug: Start Stage</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button @click="debugStartStage = -1"
            :style="{ background: debugStartStage === -1 ? '#4ecdc4' : '#333', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }">
            Normal
          </button>
          <button v-for="(s, i) in STAGES" :key="i" @click="debugStartStage = i"
            :style="{ background: debugStartStage === i ? '#4ecdc4' : '#333', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }">
            {{ i + 1 }}. {{ s.name }}
          </button>
        </div>
        <div style="color:#888;font-size:11px;margin-top:4px">Next game starts at this stage</div>
      </div>
      <div class="settings-section">
        <h3>🎨 Skins</h3>
        <div class="skin-selector">
          <button 
            v-for="(skin, i) in [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21]" 
            :key="i"
            :style="{ background: '#' + skin.toString(16).padStart(6, '0') }"
            @click="currentSkin = i"
            :disabled="!unlockedSkins.includes(i)"
          >{{ unlockedSkins.includes(i) ? '🎨' : '🔒' }}</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>🎩 Hats</h3>
        <div class="hat-selector">
          <button @click="currentHat = null" :class="{ selected: currentHat === null }">None</button>
          <button 
            v-for="hat in ['cap', 'crown', 'helmet']" 
            :key="hat"
            @click="currentHat = hat"
            :disabled="!unlockedHats.includes(hat)"
            :class="{ selected: currentHat === hat }"
          >{{ unlockedHats.includes(hat) ? hat.charAt(0).toUpperCase() + hat.slice(1) : '🔒 ' + hat }}</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>🏆 Achievements ({{ achievements.filter(a => a.unlocked).length }}/{{ ACHIEVEMENTS.length }})</h3>
        <ul class="achievement-list">
          <li v-for="ach in ACHIEVEMENTS" :key="ach.id" :class="{ unlocked: ach.unlocked }">
            {{ ach.unlocked ? '✅' : '🔒' }} {{ ach.name }}
          </li>
        </ul>
      </div>
      <button @click="toggleDebug" style="margin-top:8px;background:#333;color:#0f0;border:1px solid #0f0;padding:6px 12px;borderRadius:4px;cursor:pointer;fontSize:13px">🐛 Debug {{ showDebugOverlay ? 'ON' : 'OFF' }}</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, onUnmounted, nextTick, watch } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { useAudio } from './composables/useAudio.js'
import { useLeaderboard } from './composables/useLeaderboard.js'
import { useAchievements } from './composables/useAchievements.js'
import { useLoadingProgress } from './composables/useLoadingProgress.js'
import { reduceMotionRef, initScreenEffects, saveScreenEffects } from './composables/useScreenEffects.js'
import { EARTH_R, DAY_DURATION, jumpStrength, slideDuration, laneWidth, FLY_LIFT, FLY_GRAVITY, FLY_MAX_HEIGHT, MIC_THRESHOLD, MIC_PEAK_THRESHOLD, minSwipeDistance, TILT_THRESHOLD, TILT_LR_THRESHOLD, TILT_LANE_COOLDOWN, CALIBRATION_MAX_SAMPLES } from './gameConstants.js'
import { STAGES } from './data/stages.js'
import { useCurve } from './composables/useCurve.js'
import { useMic } from './composables/useMic.js'
import LoadingScreen from './components/LoadingScreen.vue'

// Version - Update this for each release
const VERSION = 'v5.2.13';
// Extract major.minor for version-aware high score key
const VERSION_MAJOR_MINOR = VERSION.replace(/^(v\d+\.\d+)\.\d+$/, '$1').replace(/\./g, '_');

// Building textures (module scope for access in applyStageVisuals)
let buildingTextures = [];
let buildingDominantColors = [];

// Score & High Score refs
const score = ref(0);
const showLoadingScreen = ref(true);
const highScore = ref(0);

// Loading progress tracking
const { loadingProgress, isLoaded, trackTexture, onTextureLoaded, resetProgress } = useLoadingProgress();

// Game state refs
const gameOver = ref(false);
const countdownActive = ref(false);
const countdownText = ref('');
let countdownLocked = false; // prevents input during countdown
let initialCountdownTimeout = null; // Track initial countdown timeout to clear on reset
let stageCountdownTimeout = null; // Track stage countdown timeout
let gameOverShakeInterval = null; // Track game over shake interval
let spawnStateInterval = null; // Track spawn debug interval
const showSettings = ref(false);
const isPaused = ref(false); // Pause state
const debugStartStage = ref(-1);
const tiltEnabledRef = ref(true);
const muteIcon = ref('🔊');

// Clear ALL pending timeouts and intervals - call on stage reset to prevent stale callbacks
const clearAllTimers = () => {
  if (initialCountdownTimeout) { clearTimeout(initialCountdownTimeout); initialCountdownTimeout = null; }
  if (stageCountdownTimeout) { clearTimeout(stageCountdownTimeout); stageCountdownTimeout = null; }
  if (debugKeyTimer) { clearTimeout(debugKeyTimer); debugKeyTimer = null; }
  if (gameOverShakeInterval) { clearInterval(gameOverShakeInterval); gameOverShakeInterval = null; }
  if (spawnStateInterval) { clearInterval(spawnStateInterval); spawnStateInterval = null; }
  if (window._spawnStateInterval) { clearInterval(window._spawnStateInterval); window._spawnStateInterval = null; }
  if (invincibilityTimeout) { clearTimeout(invincibilityTimeout); invincibilityTimeout = null; }
  if (bossDefeatTimeout1) { clearTimeout(bossDefeatTimeout1); bossDefeatTimeout1 = null; }
};

// Debug overlay refs
const showDebugOverlay = ref(false);
const lastBeta = ref(0);
const lastGamma = ref(0);
const lastMicVolume = ref(0);
const grassY = ref(0);
const grassRenderOrder = ref(0);
const grassDepthWrite = ref(false);
const roadY = ref(0);
const roadRenderOrder = ref(0);

const toggleDebug = () => {
  showDebugOverlay.value = !showDebugOverlay.value;
};

const toggleSettings = () => {
  if (showSettings.value) {
    // Closing settings - resume if game was paused
    showSettings.value = false;
    resumeGame();
  } else {
    // Opening settings - pause the game
    if (!gameOver.value && !countdownActive.value) {
      pauseGame();
    }
    showSettings.value = true;
  }
};

// Achievement system — extracted to useAchievements.js
// Composable instantiated after createFloatingText + player are defined

const fovWarpRef = ref(false);
const roadCurveEnabled = ref(true);

// Debug mode state
const debugMode = ref(false);
const godMode = ref(false);
let debugKeyBuffer = '';
let debugKeyTimer = null;

// Stage & road curve state
const currentStage = ref(0)
const stageTime = ref(0)
const bossActive = ref(false)
const bossHealth = ref(100)
const bossDefeated = ref(false)
const bossWarning = ref(false)
const roadCurve = ref(0)
const roadCurveTarget = ref(0)
const stageTransitioning = ref(false)
const curveChangeTimer = ref(0)
const nextCurveChange = ref(3)

// Initialize curve composable
const { getSurfaceY, getSurfaceTilt, getCurveX, curveFrontZ } = useCurve({ roadCurveEnabled, roadCurve })

// Power-up state
let activePowerup = null;
let powerupEndTime = 0;
let powerupIcon = '';
let powerupName = '';
let powerupTimeLeft = ref(0);
let nearMissTextRef = ref('');
let nearMissCountRef = ref(0);
let eventAlertTextRef = ref('');
let inBonusZoneRef = ref(false);
let bonusTimerRef = ref(0);
let scoreMultiplier = 1;
// Showroom shortcut (20% of bonus portals)
let inShowroom = false;
let inShowroomRef = ref(false);
let showroomTimer = 0;
let showroomTimerRef = ref(0);
let isShowroomPortal = false;
let magnetRange = 0;
let isInvincible = false;

// Day/night cycle
let dayCycleTime = 0;

// Stage system
// === STAGE VISUAL TRANSITIONS ===
let cobblestoneTexture = null;
let grassTileTex = null;
let originalGroundTexture = null;
let originalGroundColor = null;

function applyStageVisuals(stageIndex) {
  const stage = STAGES[stageIndex];
  if (!roadMesh) return;
  
  // Save originals on first call
  if (!originalGroundTexture) {
    originalGroundTexture = roadMesh.material.map;
    originalGroundColor = roadMesh.material.color.getHex();
  }
  
  if (stage.roadType === 'cobblestone') {
    // Preload Stage 2 textures
    preloadStageTextures(2);
    
    // Set color immediately (visual feedback while texture loads)
    if (roadMesh && roadMesh.material) {
      roadMesh.material.color.set(0x888888);
      roadMesh.material.needsUpdate = true;
      console.log('[STAGE-2] Cobblestone color set (immediate)');
    }
    
    // Load cobblestone texture if not cached
    if (!cobblestoneTexture) {
      cobblestoneTexture = loadTexture('assets/road_cobblestone.webp', () => {
        // Texture loaded - apply immediately
        if (roadMesh && cobblestoneTexture && cobblestoneTexture.image) {
          cobblestoneTexture.offset.y = groundTexture?.offset.y || 0;
          roadMesh.material.map = cobblestoneTexture;
          roadMesh.material.needsUpdate = true;
          console.log('[STAGE-2] Cobblestone texture applied (callback)');
        }
      });
    }
    // Store original material for restoration when leaving Stage 2
    if (!originalRoadMaterial && roadMesh.material && roadMesh.material.map !== cobblestoneTexture) {
      originalRoadMaterial = roadMesh.material;
    }
    // Apply cobblestone texture immediately if already cached/loaded
    if (cobblestoneTexture && cobblestoneTexture.image) {
      cobblestoneTexture.offset.y = groundTexture?.offset.y || 0;
      roadMesh.material.map = cobblestoneTexture;
      roadMesh.material.needsUpdate = true;
      console.log('[STAGE-2] Cobblestone texture applied (immediate)');
    } else if (cobblestoneTexture) {
      console.log('[STAGE-2] Cobblestone texture loading, will apply on load');
    }
    // Preload fachwerkhaus texture for medieval buildings
    loadFachwerk(() => {
      // Apply fachwerk to buildings once texture is ready
      if (buildings.length && fachwerkTexture) {
        applyFachwerkToBuildings();
        console.log('[STAGE-2] Fachwerk texture applied (callback)');
      }
    });
    // Also apply to any buildings created during Stage 2
    if (stage.roadType === 'cobblestone' && buildings.length && fachwerkTexture) {
      applyFachwerkToBuildings();
      console.log('[STAGE-2] Fachwerk texture applied (immediate)');
    }
    // Add rose/flower decorations for Stage 2
    createMedievalFlowers();
    // Tint grass darker for medieval
    if (grassMesh) { grassMesh.material.color.set(0x2d5a1e); grassMesh.material.needsUpdate = true; }
    // Darker sky
    if (scene && scene.fog) { scene.fog.color.set(0x4a5568); scene.background = new THREE.Color(0x4a5568); }
    // Switch to medieval BGM
    switchBGMTrack('medieval');
  } else if (stage.id === 3) {
    // Preload Stage 3 textures
    preloadStageTextures(3);
    
    // Set color immediately (visual feedback while texture loads)
    if (roadMesh && roadMesh.material) {
      roadMesh.material.color.set(0xffffff);
      roadMesh.material.needsUpdate = true;
      console.log('[STAGE-3] Concrete color set (immediate)');
    }
    
    // Stage 3: Concrete Jungle - urban cityscape with concrete and glass
    if (!stage3Textures.road) {
      stage3Textures.road = loadTexture('assets/stage3/road_concrete_asphalt.png', () => {
        if (roadMesh && stage3Textures.road && stage3Textures.road.image) {
          roadMesh.material.map = stage3Textures.road;
          roadMesh.material.needsUpdate = true;
          console.log('[STAGE-3] Concrete texture applied (callback)');
        }
      });
    }
    // Apply immediately if cached
    if (stage3Textures.road && stage3Textures.road.image) {
      roadMesh.material.map = stage3Textures.road;
      roadMesh.material.needsUpdate = true;
      console.log('[STAGE-3] Concrete texture applied (immediate)');
    }
    
    // Replace grass with concrete pavement
    if (!stage3Textures.pavement) {
      stage3Textures.pavement = loadTexture('assets/stage3/pavement_concrete.png');
    }
    if (grassMesh) {
      grassMesh.material.map = stage3Textures.pavement;
      grassMesh.material.color.set(0xffffff);
      grassMesh.material.needsUpdate = true;
    }
    // Urban cityscape sky
    if (scene && scene.fog) { scene.fog.color.set(0x8a9a9a); scene.background = new THREE.Color(0x8a9a9a); }
    // Preload Stage 3 obstacle textures
    loadStage3Textures();
    // Apply glass & steel building facades with callback-based loading
    const applyStage3Facade = () => {
      if (!buildings.length || !stage3Textures.building) return;
      buildings.forEach((b, i) => {
        const mesh = b.children.find(c => c.isMesh)
        if (mesh && mesh.material && Array.isArray(mesh.material)) {
          for (const idx of [0, 1, 4]) {
            if (mesh.material[idx] && mesh.material[idx].map) {
              mesh.material[idx].map = stage3Textures.building
              mesh.material[idx].color.set(0xffffff)
              mesh.material[idx].needsUpdate = true
            }
          }
        }
      })
    };
    
    if (!stage3Textures.building) {
      stage3Textures.building = textureLoader.load('assets/stage3/building_glass_steel.png', () => {
        stage3Textures.building.colorSpace = THREE.SRGBColorSpace;
        // Re-apply once texture is loaded
        applyStage3Facade();
      });
    } else {
      stage3Textures.building.colorSpace = THREE.SRGBColorSpace;
    }
    // Apply immediately if texture already loaded
    if (stage3Textures.building && buildings.length) {
      applyStage3Facade();
    }
    // Replace tree sprites with 3D glass skyscrapers for Stage 3
    if (trees.length) {
      // Load the procedural glass texture from cache
      const glassTex = loadTexture('assets/stage3/skyscraper-glass.png');
      
      trees.forEach((t) => {
        // Remove existing sprite (tree sprites should NOT be visible in Stage 3)
        const sprite = t.children.find(c => c.isSprite);
        if (sprite) {
          t.remove(sprite);
          sprite.material.dispose();
        }
        
        // Remove any existing skyscraper to avoid duplicates
        const existingBuilding = t.children.find(c => c.isMesh && c.userData.isSkyscraper);
        if (existingBuilding) {
          existingBuilding.geometry?.dispose();
          existingBuilding.material?.dispose();
          t.remove(existingBuilding);
        }
        
        // Create 3D skyscraper with cloned material for per-building variation
        const height = 12 + Math.random() * 8;  // 12-20
        const width = 2 + Math.random();         // 2-3
        const depth = 2 + Math.random();         // 2-3
        const geo = new THREE.BoxGeometry(width, height, depth);
        // Clone material and add slight variation per building
        const mat = new THREE.MeshPhysicalMaterial({
          map: glassTex,
          color: new THREE.Color(0x88aacc).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1),
          metalness: 0.85 + (Math.random() - 0.5) * 0.1,
          roughness: 0.15 + (Math.random() - 0.5) * 0.05,
          transparent: true,
          opacity: 0.85 + Math.random() * 0.1,
          envMapIntensity: 1.5
        });
        const building = new THREE.Mesh(geo, mat);
        // Position building so its bottom sits exactly at ground level
        building.position.set(0, height / 2, 0);
        building.castShadow = false;
        building.userData.isSkyscraper = true;
        t.add(building);
      });
    }
    // Switch to urban/city BGM
    switchBGMTrack('highway');
  } else {
    // Highway: restore original
    // Cleanup medieval flowers when leaving Stage 2
    cleanupMedievalFlowers();
    // Dispose cobblestone material if it exists to prevent memory leaks
    if (roadMesh.material !== originalRoadMaterial && roadMesh.material) {
      if (roadMesh.material.map && roadMesh.material.map !== originalGroundTexture) {
        // Don't dispose cobblestoneTexture - it may be reused
      }
      roadMesh.material.dispose();
    }
    roadMesh.material = originalRoadMaterial || roadMesh.material;
    if (originalGroundTexture) {
      roadMesh.material.map = originalGroundTexture;
      roadMesh.material.color.set(originalGroundColor);
      roadMesh.material.needsUpdate = true;
    }
    if (grassMesh) { grassMesh.material.color.set(0x3a7d2c); grassMesh.material.needsUpdate = true; }
    if (scene && scene.fog) { scene.fog.color.set(0x87ceeb); scene.background = new THREE.Color(0x87ceeb); }
    // Restore building facades to original textures
    if (buildings.length) {
      buildings.forEach((b, i) => {
        const mesh = b.children.find(c => c.isMesh)
        if (mesh && mesh.material && Array.isArray(mesh.material)) {
          const texIdx = i % buildingTextures.length
          // Facade can be at index 0, 1, or 4
          for (const idx of [0, 1, 4]) {
            if (mesh.material[idx].map) {
              mesh.material[idx].map = buildingTextures[texIdx]
              mesh.material[idx].color.set(buildingDominantColors[texIdx])
              mesh.material[idx].needsUpdate = true
            }
          }
        }
      })
    }
    // Restore tree sprites (removed in Stage 3)
    if (trees.length) {
      // Load tree textures if not already cached
      const treeRoundTex = textureLoader.load('assets/tree_round_clean.webp');
      const treePineTex = textureLoader.load('assets/tree_pine_clean.webp');
      
      trees.forEach((t) => {
        // Remove any existing 3D building from Stage 3
        const existingBuilding = t.children.find(c => c.isMesh);
        if (existingBuilding) {
          t.remove(existingBuilding);
          if (existingBuilding.geometry) existingBuilding.geometry.dispose();
          if (existingBuilding.material) {
            if (Array.isArray(existingBuilding.material)) {
              existingBuilding.material.forEach(m => m.dispose());
            } else {
              existingBuilding.material.dispose();
            }
          }
        }
        
        // Recreate tree sprite
        const isPine = Math.random() > 0.5;
        const treeTex = isPine ? treePineTex : treeRoundTex;
        const treeH = isPine ? 5.6 : 4.8;
        const treeW = isPine ? 3.2 : 4.0;
        
        const spriteMat = new THREE.SpriteMaterial({ 
          map: treeTex, 
          transparent: true,
          depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(treeW, treeH, 1);
        t.add(sprite);
        
        // Restore scale and position
        const treeScale = 0.7 + Math.random() * 0.3;
        t.scale.setScalar(treeScale);
        const treeBaseY = (treeH / 2) * treeScale;
        t.baseY = treeBaseY;
        if (t.userData.initX !== undefined && t.userData.initZ !== undefined) {
          t.position.set(t.userData.initX, treeBaseY + getSurfaceY(t.userData.initZ), t.userData.initZ);
        }
      });
    }
    // Switch to highway BGM
    switchBGMTrack('highway');
  }
}

// Initialize audio composable
const { playSound, playSFX, startBGM, stopBGM, switchBGMTrack, toggleMute: _toggleMute, initAudio, isBGMPlaying, bgmStarted, startStage3Audio, stopStage3Audio, updateIntercom } = useAudio({ currentStage, STAGES })

// Attempt BGM start from a user gesture context (resolves autoplay policy)
const tryStartBGMFromGesture = () => {
  initAudio();
  if (!bgmStarted && !isBGMPlaying) {
    startBGM();
  }
};

let scene, camera, renderer, player, clock;
let boss = null;
let obstacles = [];
let coins = [];

// Expose spawn counts for Playwright tests (outside animate loop)
window.__getSpawnCounts = () => ({ obstacles: obstacles.length, coins: coins.length });
window.__getSpawnDebug = () => window.__spawnDebug ? window.__spawnDebug() : { error: 'animate loop not running' };
window.__getRoadMesh = () => roadMesh;
let powerups = [];
let particles = [];
let floatingTexts = [];

// Overlap detection constants
const MAX_SPAWN_RETRIES = 3;
const OBSTACLE_OVERLAP_RADIUS = 2.5; // Minimum distance between obstacles
const COIN_OBSTACLE_OVERLAP_RADIUS = 1.8; // Minimum distance between coins and obstacles
const BUILDING_OVERLAP_RADIUS = 8; // Minimum distance between buildings
const TREE_OVERLAP_RADIUS = 4; // Minimum distance between trees

/**
 * Check if a position overlaps with existing objects
 * @param {number} x - X position to check
 * @param {number} z - Z position to check
 * @param {string} objectType - Type: 'obstacle', 'coin', 'building', 'tree'
 * @param {string} excludeType - Optional: exclude certain types from check (e.g., 'boss')
 * @returns {boolean} - true if overlap detected
 */
const checkOverlap = (x, z, objectType, excludeType = null) => {
  const stage = STAGES[currentStage.value];
  const isBossSpawn = excludeType === 'boss';
  
  // Boss spawns are exempt from overlap checks
  if (isBossSpawn) return false;
  
  if (objectType === 'obstacle') {
    // Check against other obstacles
    for (const obs of obstacles) {
      if (obs.mesh && obs.mesh.position) {
        const dx = x - obs.mesh.position.x;
        const dz = z - obs.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < OBSTACLE_OVERLAP_RADIUS) return true;
      }
    }
    // Check against coins (obstacles shouldn't overlap coins)
    for (const coin of coins) {
      if (coin.mesh && coin.mesh.position) {
        const dx = x - coin.mesh.position.x;
        const dz = z - coin.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < COIN_OBSTACLE_OVERLAP_RADIUS) return true;
      }
    }
  } else if (objectType === 'coin') {
    // Check against obstacles (coins shouldn't overlap obstacles)
    for (const obs of obstacles) {
      if (obs.mesh && obs.mesh.position) {
        const dx = x - obs.mesh.position.x;
        const dz = z - obs.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < COIN_OBSTACLE_OVERLAP_RADIUS) return true;
      }
    }
  } else if (objectType === 'building') {
    // Check against other buildings
    for (const bldg of buildings) {
      if (bldg.position) {
        const dx = x - bldg.position.x;
        const dz = z - bldg.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < BUILDING_OVERLAP_RADIUS) return true;
      }
    }
  } else if (objectType === 'tree') {
    // Check against other trees
    for (const tree of trees) {
      if (tree.position) {
        const dx = x - tree.position.x;
        const dz = z - tree.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < TREE_OVERLAP_RADIUS) return true;
      }
    }
    // Stage 3: Also check against buildings to prevent skyscraper-building overlap
    if (stage.id === 3) {
      for (const bldg of buildings) {
        if (bldg.position) {
          const dx = x - bldg.position.x;
          const dz = z - bldg.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          // Larger radius for skyscraper-building separation
          if (distance < 10) return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Attempt to spawn with overlap detection and retry logic
 * @param {Function} spawnFn - Function that creates the object and returns { group, lane, hitWidth? }
 * @param {string} objectType - Type: 'obstacle', 'coin', 'building', 'tree'
 * @param {string} arrayName - Name of array to add to: 'obstacles', 'coins', etc.
 * @param {boolean} isBoss - true if this is a boss spawn (exempt from overlap checks)
 * @returns {boolean} - true if spawn succeeded, false if skipped after retries
 */
const spawnWithOverlapCheck = (spawnFn, objectType, arrayName, isBoss = false) => {
  let attempts = 0;
  let success = false;
  
  while (attempts < MAX_SPAWN_RETRIES && !success) {
    const result = spawnFn();
    if (!result || !result.group) break;
    
    const { group, lane, hitWidth, extraData } = result;
    const spawnX = group.position.x;
    const spawnZ = group.position.z;
    
    // Check for overlap (skip for boss spawns)
    const hasOverlap = checkOverlap(spawnX, spawnZ, objectType, isBoss ? 'boss' : null);
    
    if (hasOverlap) {
      // Overlap detected, remove the object and retry
      scene.remove(group);
      attempts++;
    } else {
      // No overlap, apply Y position and add to array
      group.position.y += getSurfaceY(-50);
      group.baseY = group.position.y - getSurfaceY(-50);
      
      const targetArray = arrayName === 'obstacles' ? obstacles :
                        arrayName === 'coins' ? coins :
                        arrayName === 'powerups' ? powerups : [];
      
      const entry = { mesh: group, lane, collected: false, ...extraData };
      if (hitWidth !== undefined) entry.hitWidth = hitWidth;
      if (objectType === 'obstacle') {
        entry.type = extraData?.type || 'ground';
        if (extraData?.obstacleType) entry.obstacleType = extraData.obstacleType;
      }
      
      targetArray.push(entry);
      success = true;
    }
  }
  
  return success;
};

// Initialize achievement composable (uses lazy getters for player + createFloatingText)
const {
  ACHIEVEMENTS, gameStats, achievements, unlockedSkins, currentSkin,
  unlockedHats, currentHat, loadProgress, saveProgress, checkAchievements
} = useAchievements({
  playSound,
  createFloatingText: (...args) => createFloatingText(...args),
  getPlayer: () => player
})
let currentLane = 1;
let isJumping = false;
let jumpVelocity = 0;
let isSliding = false;
let slideTimer = 0;
// Slippery floor effect
let isSlippery = false;
let slipperyTimer = 0;
let slideVelocity = 0;
const gravity = 0.015;

// Surface/curve math extracted to useCurve.js

// Voice/fly controls
let isFlying = false;
let flyVelocity = 0;
// Speed system: base speed + multiplier with clamping
const SPEED_MIN = 0.15;
const SPEED_MAX = 1.2;
let baseGameSpeed = 0.25; // increases over time
let speedMultiplier = 1.0; // powerups modify this
let gameSpeed = 0.25;
let lastSpawnTime = -2; // grace period before first spawn
let spawnInterval = 1.2;
let gameDuration = 0;
let pauseStartTime = 0; // Track pause start for elapsed time adjustment
let comboCount = 0;
let lastCoinTime = 0;

// Near-miss system
// Near-miss / Bullet time system
let nearMissTimer = 0;
let nearMissCount = 0;
let cameraShakeTimer = 0;
let cameraShakeIntensity = 0;
let originalRoadMaterial = null;
let savedSubstageState = null;
let bonusNoSpawn = false;
let bonusCoins = [];

// Cloud tint colors (module-level to avoid allocation per frame)
const cloudWhiteColor = new THREE.Color(0xffffff);
const cloudNightColor = new THREE.Color(0x667788);
const cloudSunsetColor = new THREE.Color(0xff8866);

// Environmental events
let eventTimer = 0;
let activeEvent = null; // 'fog'
let eventDuration = 0;
let fogDensity = 0;

// Bonus portal
let bonusPortal = null;
let inBonusZone = false;
let bonusTimer = 0;
let bonusPortalSpawned = false;
let bonusPortalType = 'bonus'; // 'bonus' or 'showroom'

// Edge glow (red vignette at max difficulty)
let edgeGlowIntensity = 0;

// FOV warp (settings toggle)
let fovWarpEnabled = false;

// Dynamic sky crossfade
let skyBlendFactor = 0;
let prevSkyTex = null;
let currentSkyTex = null;

// Touch/swipe controls
let touchStartX = 0;
let touchStartY = 0;

// Tilt/gyro controls
let tiltEnabled = true;
let tiltInitialBeta = null; // Calibrate on enable
let tiltInitialGamma = null; // Calibrate sideways center
let lastTiltLaneChange = 0;

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1024);

// Tilt calibration during countdown
let tiltCalibrationSamples = [];
let isCalibrating = false;

const startTiltCalibration = () => {
  tiltCalibrationSamples = [];
  isCalibrating = true;
  tiltInitialBeta = null;
  tiltInitialGamma = null;
};

const finishTiltCalibration = () => {
  if (tiltCalibrationSamples.length === 0) {
    // Fallback: use current single reading or 0
    tiltInitialBeta = tiltInitialBeta ?? 45; // Neutral phone hold
    tiltInitialGamma = tiltInitialGamma ?? 0;
  } else {
    // Average all samples
    const avgBeta = tiltCalibrationSamples.reduce((s, v) => s + v.beta, 0) / tiltCalibrationSamples.length;
    const avgGamma = tiltCalibrationSamples.reduce((s, v) => s + v.gamma, 0) / tiltCalibrationSamples.length;
    tiltInitialBeta = avgBeta;
    tiltInitialGamma = avgGamma;
  }
  isCalibrating = false;
  tiltCalibrationSamples = [];
};

let toggleTilt = () => {
  tiltEnabled = !tiltEnabled;
  tiltEnabledRef.value = tiltEnabled;
  tiltInitialBeta = null;
};

const toggleFovWarp = () => {
  fovWarpEnabled = fovWarpRef.value;
  if (!fovWarpEnabled) {
    camera.fov = 60;
    camera.updateProjectionMatrix();
  }
};

// Mic input — extracted to useMic.js
const { micEnabledRef, initMic, toggleMic: _toggleMic, getMicVolume, cleanupMic, startCalibration } = useMic()
const toggleMic = () => _toggleMic(() => { isFlying = false })
const onLoadingStart = () => {
  initAudio();
  startBGM();
  // Lock game until loading screen fades and countdown completes
  // Prevents any game input or state changes before countdown
  countdownLocked = true;
  stageTransitioning.value = true;
  setTimeout(() => {
    showLoadingScreen.value = false;
    // Start countdown AFTER loading screen fades out (400ms)
    setTimeout(() => {
      if (!gameOver.value && !countdownActive.value) {
        startStageCountdown();
      }
    }, 400);
  }, 400);
};

const toggleMute = () => {
  const isMuted = _toggleMute();
  muteIcon.value = isMuted ? '🔇' : '🔊';
}
// Environment elements
let clouds = [];
let trees = [];
let buildings = [];
let medievalFlowers = [];
let composer;
let groundTexture;
let roadMesh, grassMesh, leftCurbMesh, rightCurbMesh;
let roadOrigPositions, grassOrigPositions, leftCurbOrigPositions, rightCurbOrigPositions;
let skyTextures = {};
let mountainMesh;
let textureLoader = new THREE.TextureLoader();

// === CENTRALIZED TEXTURE MANIFEST ===
// Each stage declares its required textures for preloading
const STAGE_TEXTURES = {
  // Stage 1: Modern Highway (default)
  1: {
    name: 'Modern Highway',
    trees: [
      'assets/tree_round_clean.webp',
      'assets/tree_pine_clean.webp'
    ],
    buildings: [
      'assets/building_pink.webp',
      'assets/building_blue.webp',
      'assets/building_green.webp'
    ],
    road: null, // uses default
    sky: ['assets/sky_sunny.webp'],
    misc: ['assets/mountains.webp', 'assets/grass_tile.webp']
  },
  // Stage 2: Medieval Path
  2: {
    name: 'Medieval Path',
    trees: [
      'assets/tree_round_clean.webp',
      'assets/tree_pine_clean.webp'
    ],
    buildings: [
      'assets/building_fachwerk.webp' // fachwerkhaus (dominant)
    ],
    road: 'assets/road_cobblestone.webp',
    sky: ['assets/sky_sunset.webp'],
    misc: [
      'assets/stage2/brick-wall-layered.png' // for brick-box obstacles
    ]
  },
  // Stage 3: Concrete Jungle (Urban)
  3: {
    name: 'Concrete Jungle',
    trees: [], // no tree sprites - uses 3D skyscrapers
    buildings: [
      'assets/stage3/skyscraper-glass.png' // for 3D skyscrapers
    ],
    road: 'assets/stage3/road_concrete_asphalt.png',
    pavement: 'assets/stage3/pavement_concrete.png',
    sky: ['assets/sky_night.webp'],
    misc: [
      'assets/stage3/trafficCone.png',
      'assets/stage3/dumpster.png',
      'assets/stage3/scaffoldTower.png',
      'assets/stage3/concreteBarrier.png',
      'assets/stage3/billboard.png',
      'assets/stage3/obstacle-metal-beam.png',
      'assets/stage3/boss_spaghetti_meatball.png'
    ]
  }
};

// Texture cache to avoid reloading
const textureCache = {};

// Load texture with caching and callback
const loadTexture = (path, callback) => {
  if (textureCache[path]) {
    if (callback) callback(textureCache[path]);
    return textureCache[path];
  }
  trackTexture();
  const tex = textureLoader.load(path, () => {
    onTextureLoaded();
    if (callback) callback(tex);
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache[path] = tex;
  return tex;
};

// Preload all textures for a stage
const preloadStageTextures = (stageId) => {
  const manifest = STAGE_TEXTURES[stageId];
  if (!manifest) return;
  
  // Load all textures in parallel
  const allTextures = [
    ...(manifest.trees || []),
    ...(manifest.buildings || []),
    ...(manifest.misc || []),
    ...(manifest.road ? [manifest.road] : []),
    ...(manifest.pavement ? [manifest.pavement] : []),
    ...(manifest.sky || [])
  ];
  
  allTextures.forEach(path => loadTexture(path));
};

// Medieval fachwerkhaus texture loader (legacy wrapper)
let fachwerkTexture = null;
const loadFachwerk = (callback) => {
  if (fachwerkTexture) {
    if (callback) callback(fachwerkTexture);
    return fachwerkTexture;
  }
  fachwerkTexture = loadTexture('assets/building_fachwerk.webp', () => {
    if (callback) callback(fachwerkTexture);
  });
  return fachwerkTexture;
};

// Helper to swap building facades to fachwerk
const applyFachwerkToBuildings = () => {
  if (!buildings.length || !fachwerkTexture) return;
  buildings.forEach(b => {
    const mesh = b.children.find(c => c.isMesh)
    if (mesh && mesh.material && Array.isArray(mesh.material)) {
      // Facade can be at index 0 (left building), 1 (right building), or 4 (front)
      for (const idx of [0, 1, 4]) {
        if (mesh.material[idx] && mesh.material[idx].map) { // safety check for material existence
          mesh.material[idx].map = fachwerkTexture
          mesh.material[idx].color.set(0xd4c4a0)
          mesh.material[idx].needsUpdate = true
        }
      }
    }
  })
};

// Stage 3 (Urban Construction) obstacle textures
let stage3Textures = {};
const loadStage3Textures = () => {
  if (Object.keys(stage3Textures).length > 0) return; // already loaded
  
  const textureBase = 'assets/stage3/';
  
  // Urban construction obstacles
  stage3Textures.trafficCone = textureLoader.load(textureBase + 'trafficCone.png');
  stage3Textures.trafficCone.colorSpace = THREE.SRGBColorSpace;
  
  stage3Textures.dumpster = textureLoader.load(textureBase + 'dumpster.png');
  stage3Textures.dumpster.colorSpace = THREE.SRGBColorSpace;
  
  stage3Textures.scaffoldTower = textureLoader.load(textureBase + 'scaffoldTower.png');
  stage3Textures.scaffoldTower.colorSpace = THREE.SRGBColorSpace;
  
  stage3Textures.concreteBarrier = textureLoader.load(textureBase + 'concreteBarrier.png');
  stage3Textures.concreteBarrier.colorSpace = THREE.SRGBColorSpace;
  
  stage3Textures.billboard = textureLoader.load(textureBase + 'billboard.png');
  stage3Textures.billboard.colorSpace = THREE.SRGBColorSpace;
};

// Helper to apply Stage 3 glass/steel facades to buildings
const applyStage3FacadeToBuildings = () => {
  if (!buildings.length || !stage3Textures.building) return;
  buildings.forEach((b, i) => {
    const mesh = b.children.find(c => c.isMesh)
    if (mesh && mesh.material && Array.isArray(mesh.material)) {
      for (const idx of [0, 1, 4]) {
        if (mesh.material[idx] && mesh.material[idx].map) {
          mesh.material[idx].map = stage3Textures.building
          mesh.material[idx].color.set(0xffffff)
          mesh.material[idx].needsUpdate = true
        }
      }
    }
  })
};

// Create medieval rose/flower decorations along road edges for Stage 2
const createMedievalFlowers = () => {
  // Clear existing flowers first
  medievalFlowers.forEach(f => {
    if (f.parent) f.parent.remove(f);
    f.geometry?.dispose();
    f.material?.dispose();
  });
  medievalFlowers = [];
  
  // Create flower clusters along both sides of the road
  for (let i = 0; i < 40; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const flowerGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const flowerColor = Math.random() > 0.5 ? 0xff0066 : 0xff6699; // red or pink roses
    const flowerMat = new THREE.MeshBasicMaterial({ color: flowerColor });
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    
    flower.position.set(
      side * (4 + Math.random() * 2),
      0.1,
      -Math.random() * 80
    );
    flower.userData = { baseX: flower.position.x, life: 1.0 };
    scene.add(flower);
    medievalFlowers.push(flower);
  }
};

// Cleanup medieval flowers
const cleanupMedievalFlowers = () => {
  medievalFlowers.forEach(f => {
    if (f.parent) f.parent.remove(f);
    f.geometry?.dispose();
    f.material?.dispose();
  });
  medievalFlowers = [];
};

window.addEventListener('error', (e) => { console.log('GLOBAL ERROR:', e.message, 'at', e.filename + ':' + e.lineno + ':' + e.colno); });
onMounted(() => {
  const saved = localStorage.getItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`);
  if (saved) highScore.value = parseInt(saved, 10);
  initScreenEffects();
  loadProgress();
  loadLeaderboard(); // async — loads global + local, non-blocking
  checkAchievements();
});

const saveHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`, highScore.value.toString());
  }
};

// === LEADERBOARD === (extracted to useLeaderboard.js)
const { leaderboard, playerName, showNameEntry, isHighScore, submitScore, loadLeaderboard, syncStatus } = useLeaderboard({ VERSION, score, highScore })

const initGame = () => {
  // Preload Stage 1 textures (default starting stage)
  preloadStageTextures(1);
  // Clean up old trees and buildings before creating new scene
  // Remove from scene and dispose geometries/materials to prevent memory leaks
  trees.forEach(tree => {
    scene.remove(tree);
    tree.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  });
  trees = [];
  
  buildings.forEach(building => {
    scene.remove(building);
    building.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  });
  buildings = [];
  
  scene = new THREE.Scene();
  
  // Colorful cartoon sky with gradient fog
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

  // Load AI-generated sky textures
  const skyUrls = {
    sunny: 'assets/sky_sunny.webp',
    sunset: 'assets/sky_sunset.webp',
    night: 'assets/sky_night.webp'
  };
  Object.keys(skyUrls).forEach(key => {
    trackTexture();
    textureLoader.load(skyUrls[key], (tex) => {
      skyTextures[key] = tex;
      onTextureLoaded();
    });
  });
  
  // Load mountain texture for parallax
  trackTexture();
  textureLoader.load('assets/mountains.webp', (tex) => {
    const mtGeo = new THREE.PlaneGeometry(80, 15);
    const mtMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    mountainMesh = new THREE.Mesh(mtGeo, mtMat);
    mountainMesh.position.set(0, 4 + getSurfaceY(-90), -90);
    mountainMesh.renderOrder = -2;
    scene.add(mountainMesh);
    // Second mountain layer (further back, dimmer)
    const mt2 = new THREE.Mesh(mtGeo.clone(), mtMat.clone());
    mt2.material.opacity = 0.5;
    mt2.material.transparent = true;
    mt2.position.set(0, 5 + getSurfaceY(-120), -120);
    mt2.scale.set(2.0, 1.5, 1);
    mt2.renderOrder = -3;
    scene.add(mt2);
    onTextureLoaded();
  });

    // No texture loading - all procedural

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);
  camera.lookAt(0, 0, -5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  renderer.shadowMap.enabled = isMobile ? false : true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  document.getElementById('game-canvas').appendChild(renderer.domElement);

  // Post-processing for bloom effect
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  const bloomRes = isMobile ? 0.5 : 0.75;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth * bloomRes, window.innerHeight * bloomRes),
    0.35,  // strength (reduced for performance)
    0.4,   // radius
    0.85   // threshold
  );
  composer.addPass(bloomPass);


  // Enhanced cartoon lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffd700, 1.0);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  const shadowRes = isMobile ? 512 : 1024;
  directionalLight.shadow.mapSize.width = shadowRes;
  directionalLight.shadow.mapSize.height = shadowRes;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);
  
  // Hemisphere light for colorful sky/ground contrast
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8bc34a, 0.4);
  scene.add(hemiLight);

  // Create textured ground with cartoon style
  createGround();
  
  // Add lane markers
  createLaneMarkers();
  
  // Add decorative environment
  createClouds();
  createBackgroundElements();

  // === ANIMATED CHARACTER (with AI texture skin) ===
  const playerGroup = new THREE.Group();
  const skinColors = [0xff6b35, 0x4ecdc4, 0xff6b9d, 0xa8e6cf, 0xdced21];
  const skinColor = skinColors[currentSkin.value];
  
  // Torso - with clothing texture if available
  const torsoGeo = new THREE.CapsuleGeometry(0.35, 0.6, 8, 8);
  const torsoMat = new THREE.MeshToonMaterial({ color: skinColor });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.castShadow = true;
  torso.name = 'torso';
  playerGroup.add(torso);
  
  // Head group (rotates to face direction)
  const headGroup = new THREE.Group();
  headGroup.name = 'head-group';
  headGroup.position.y = 0.7;
  
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const headMat = new THREE.MeshToonMaterial({ color: 0xffd93d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  headGroup.add(head);
  
  // Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.12, 0.05, 0.25);
  headGroup.add(leftEyeWhite);
  const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  leftPupil.position.set(-0.12, 0.05, 0.3);
  leftPupil.name = 'left-pupil';
  headGroup.add(leftPupil);
  
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.12, 0.05, 0.25);
  headGroup.add(rightEyeWhite);
  const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  rightPupil.position.set(0.12, 0.05, 0.3);
  rightPupil.name = 'right-pupil';
  headGroup.add(rightPupil);
  
  const mouthGeo = new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.08, 0.28);
  mouth.rotation.x = Math.PI;
  headGroup.add(mouth);
  
  playerGroup.add(headGroup);
  
  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 4);
  const armMat = new THREE.MeshToonMaterial({ color: skinColor });
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.45, 0.2, 0);
  leftArmPivot.name = 'left-arm';
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.y = -0.25;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  playerGroup.add(leftArmPivot);
  
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.45, 0.2, 0);
  rightArmPivot.name = 'right-arm';
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  playerGroup.add(rightArmPivot);
  
  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.35, 4, 4);
  const legMat = new THREE.MeshToonMaterial({ color: 0x333333 });
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, -0.5, 0);
  leftLegPivot.name = 'left-leg';
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.y = -0.25;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  playerGroup.add(leftLegPivot);
  
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, -0.5, 0);
  rightLegPivot.name = 'right-leg';
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.y = -0.25;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  playerGroup.add(rightLegPivot);
  
  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.35);
  const shoeMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.45, 0.05);
  leftShoe.castShadow = true;
  leftLegPivot.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.45, 0.05);
  rightShoe.castShadow = true;
  rightLegPivot.add(rightShoe);
  
  // Hat
  if (currentHat.value === 'cap') {
    const capGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 16);
    const capMat = new THREE.MeshToonMaterial({ color: 0xff0000 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.3;
    cap.castShadow = true;
    headGroup.add(cap);
    const brimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.25, 0.22);
    brim.rotation.x = 0.2;
    brim.castShadow = true;
    headGroup.add(brim);
  } else if (currentHat.value === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.3, 6);
    const crownMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.35;
    crown.castShadow = true;
    headGroup.add(crown);
  } else if (currentHat.value === 'helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = new THREE.MeshToonMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.3;
    helmet.castShadow = true;
    headGroup.add(helmet);
  }
  
  player = playerGroup;
  player.position.set(0, 0.5, 0);
  player.rotation.y = Math.PI;
  scene.add(player);
  
  // Update torso texture when loaded async
  clock = new THREE.Clock();
  clock.start(); // CRITICAL: Start the clock for initial game load
  animate();
};

const createGround = () => {
  // Create detailed cartoon road texture with lane markings
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Base asphalt color
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 512, 1024);
  
  // Add noise/texture
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
  }
  
  // Dashed center line
  ctx.strokeStyle = '#ffdd00';
  ctx.lineWidth = 6;
  ctx.setLineDash([40, 30]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 1024);
  ctx.stroke();
  
  // Side lines (solid white)
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(85, 0);
  ctx.lineTo(85, 1024);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(427, 0);
  ctx.lineTo(427, 1024);
  ctx.stroke();
  
  groundTexture = new THREE.CanvasTexture(canvas);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(1, 10);
  
  const groundGeo = new THREE.PlaneGeometry(15, 200, 1, 60); // 60 segments for smooth curve
  // Bend the road to follow the earth curve
  const gPos = groundGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const py = gPos.getY(i); // in plane local space, Y is the long axis
    const worldZ = -py - 50; // center at z=-50, so py=0 → z=-50, py=100 → z=-150
    const yOffset = getSurfaceY(worldZ);
    gPos.setZ(i, gPos.getZ(i) + yOffset); // Z in plane = Y in world after rotation
  }
  gPos.needsUpdate = true;
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshToonMaterial({ 
    map: groundTexture,
    color: 0x555555
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; // flat road - curve is via object positions
  ground.position.set(0, 0, -50);
  ground.receiveShadow = false;
  ground.name = 'road';
  scene.add(ground);
  roadMesh = ground;
  // Save original vertex positions for curve animation
  roadOrigPositions = new Float32Array(gPos.array.length);
  roadOrigPositions.set(gPos.array);
  
  // Add colorful grass borders with AI texture
  // Priority load: grass (large surface area)
  trackTexture();
  grassTileTex = textureLoader.load('assets/grass_tile.webp', () => {
    onTextureLoaded();
  });
  grassTileTex.wrapS = THREE.RepeatWrapping;
  grassTileTex.wrapT = THREE.RepeatWrapping;
  grassTileTex.repeat.set(10, 25);
  grassTileTex.colorSpace = THREE.SRGBColorSpace;
  const grassGeo = new THREE.PlaneGeometry(80, 200, 1, 60); // curve match
  const gPosG = grassGeo.attributes.position;
  for (let i = 0; i < gPosG.count; i++) {
    const py = gPosG.getY(i);
    const worldZ = -py - 50;
    const yOffset = getSurfaceY(worldZ);
    gPosG.setZ(i, gPosG.getZ(i) + yOffset);
  }
  gPosG.needsUpdate = true;
  grassGeo.computeVertexNormals();
  const grassMat = new THREE.MeshToonMaterial({ 
    map: grassTileTex,
    color: 0x8bc34a 
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.1, -50); // just below road
  grass.receiveShadow = false;
  scene.add(grass);
  grassMesh = grass;
  grassOrigPositions = new Float32Array(gPosG.array.length);
  grassOrigPositions.set(gPosG.array);
  
  // Road edge curbs (curved to match earth)
  const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 200, 1, 1, 60); // 60 segments for curve
  const curbMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
  // Curve curb vertices
  const curbPos = curbGeo.attributes.position;
  for (let i = 0; i < curbPos.count; i++) {
    const cz = curbPos.getZ(i);
    const worldZ = cz - 50; // same offset as road center
    curbPos.setY(i, curbPos.getY(i) + getSurfaceY(worldZ));
  }
  curbPos.needsUpdate = true;
  curbGeo.computeVertexNormals();
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-7.5, 0.07, -50);
  leftCurb.receiveShadow = false;
  scene.add(leftCurb);
  leftCurbMesh = leftCurb;
  leftCurbOrigPositions = new Float32Array(curbPos.array.length);
  leftCurbOrigPositions.set(curbPos.array);
  const rightCurb = new THREE.Mesh(curbGeo.clone(), curbMat.clone());
  rightCurb.position.set(7.5, 0.07, -50);
  rightCurb.receiveShadow = false;
  scene.add(rightCurb);
  rightCurbMesh = rightCurb;
  rightCurbOrigPositions = new Float32Array(curbPos.array.length);
  rightCurbOrigPositions.set(curbPos.array);
};

const updateRoadCurve = () => {
  // Bend road/grass/curb mesh vertices based on current roadCurve
  // Each vertex's X offset = getCurveX(worldZ) where worldZ depends on vertex position
  
  if (roadMesh && roadOrigPositions) {
    const pos = roadMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origY = roadOrigPositions[i * 3 + 1]; // Y in plane local = Z axis (long)
      const worldZ = -origY - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, roadOrigPositions[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    roadMesh.geometry.computeVertexNormals();
  }
  
  if (grassMesh && grassOrigPositions) {
    const pos = grassMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origY = grassOrigPositions[i * 3 + 1];
      const worldZ = -origY - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, grassOrigPositions[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    grassMesh.geometry.computeVertexNormals();
  }
  
  // Curbs: vertices are in a BoxGeometry with Z as the long axis
  // Need to also clone for right curb since they share geometry originally
  const applyCurbCurve = (mesh, origPos) => {
    if (!mesh || !origPos) return;
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origZ = origPos[i * 3 + 2]; // Z in box = long axis
      const worldZ = origZ - 50;
      const curveX = getCurveX(worldZ);
      pos.setX(i, origPos[i * 3] + curveX);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  };
  applyCurbCurve(leftCurbMesh, leftCurbOrigPositions);
  applyCurbCurve(rightCurbMesh, rightCurbOrigPositions);
};

const createLaneMarkers = () => {
  // Lane markers are now in the road texture only
  // No extra 3D lane markers needed
};

const updateDayNightCycle = (delta) => {
  const cycleProgress = dayCycleTime / DAY_DURATION; // 0 to 1
  
  // 4 stages: sunny(0-0.25), sunset(0.25-0.5), night(0.5-0.75), sunrise(0.75-1.0)
  // Each stage 30s, 5s transition blend between stages
  const TRANSITION = 5 / DAY_DURATION; // 5s as fraction of cycle
  
  // Sky color interpolation with smooth blending
  let skyColor, fogColor;
  const dayColor = new THREE.Color(0x87ceeb);
  const sunsetColor = new THREE.Color(0xff7f50);
  const nightColor = new THREE.Color(0x0a0a2e);
  const sunriseColor = new THREE.Color(0xffb6c1);
  
  // Helper: get stage colors at progress within stage
  const getStageBlend = (progress) => {
    if (progress < 0.25) {
      // Sunny -> Sunset
      const t = progress / 0.25;
      const blendT = Math.min(1, t / (0.25 * TRANSITION * 4));
      return { skyColor: dayColor.clone().lerp(sunsetColor, t), fogColor: null };
    } else if (progress < 0.5) {
      const t = (progress - 0.25) / 0.25;
      return { skyColor: sunsetColor.clone().lerp(nightColor, t), fogColor: null };
    } else if (progress < 0.75) {
      const t = (progress - 0.5) / 0.25;
      return { skyColor: nightColor.clone().lerp(sunriseColor, t), fogColor: null };
    } else {
      const t = (progress - 0.75) / 0.25;
      return { skyColor: sunriseColor.clone().lerp(dayColor, t), fogColor: null };
    }
  };
  
  const stageInfo = getStageBlend(cycleProgress);
  skyColor = stageInfo.skyColor;
  fogColor = skyColor.clone();
  
  scene.background = skyColor;
  scene.fog.color = fogColor;
  
  // Sky texture crossfade using skyBlendFactor
  // Determine current and next sky textures based on cycle progress
  let currentSkyStage, nextSkyStage, blendT;
  const stageKeys = ['sunny', 'sunset', 'night', 'sunset']; // sunrise reuses sunset texture
  const stageBoundaries = [0, 0.25, 0.5, 0.75];
  
  let stageIdx = 0;
  for (let i = stageBoundaries.length - 1; i >= 0; i--) {
    if (cycleProgress >= stageBoundaries[i]) {
      stageIdx = i;
      break;
    }
  }
  
  const stageStart = stageBoundaries[stageIdx];
  const stageEnd = stageIdx < 3 ? stageBoundaries[stageIdx + 1] : 1.0;
  const stageLen = stageEnd - stageStart;
  const stageProgress = (cycleProgress - stageStart) / stageLen;
  
  // Blend factor: smooth transition in last 5s of each stage
  const transitionFraction = 5 / 30; // 5s out of 30s stage
  if (stageProgress > (1 - transitionFraction)) {
    skyBlendFactor = (stageProgress - (1 - transitionFraction)) / transitionFraction;
    skyBlendFactor = skyBlendFactor * skyBlendFactor * (3 - 2 * skyBlendFactor); // smoothstep
  } else {
    skyBlendFactor = 0;
  }
  
  currentSkyTex = skyTextures[stageKeys[stageIdx]] || null;
  nextSkyStage = stageKeys[(stageIdx + 1) % 4];
  // Map sunrise stage (0.75-1.0) back to sunny texture at the end
  if (stageIdx === 3) nextSkyStage = 'sunny';
  prevSkyTex = skyTextures[nextSkyStage] || null;
  
  // If we have sky textures and blend is active, mix them
  if (currentSkyTex && prevSkyTex && skyBlendFactor > 0) {
    // Create a blended background using scene background color mixed with textures
    // We'll use a fullscreen overlay approach via scene.background
    // Since Three.js doesn't support texture blending natively in scene.background,
    // we blend the sky colors (which we already do) and just set the dominant texture
    const dominantTex = skyBlendFactor > 0.5 ? prevSkyTex : currentSkyTex;
    scene.background = dominantTex;
  } else if (currentSkyTex) {
    scene.background = currentSkyTex;
  } else {
    scene.background = skyColor;
  }
  
  scene.fog.color = fogColor;
  
  // Track night time for achievements
  if (cycleProgress > 0.35 && cycleProgress < 0.65) {
    gameStats.nightTime += delta;
    checkAchievements();
  }
  
  // Adjust lighting
  const directionalLight = scene.children.find(c => c.isDirectionalLight);
  if (directionalLight) {
    directionalLight.intensity = cycleProgress > 0.25 && cycleProgress < 0.75 ? 0.5 : 1.0;
  }
  
  // Stars at night
  if (!scene.userData.starsCreated && (cycleProgress > 0.35 || cycleProgress < 0.15)) {
    createStars();
    scene.userData.starsCreated = true;
  } else if (scene.userData.starsCreated && cycleProgress >= 0.15 && cycleProgress <= 0.35) {
    const stars = scene.getObjectByName('stars');
    if (stars) {
      scene.remove(stars);
      scene.userData.starsCreated = false;
    }
  }
};

const createStars = () => {
  const starsGroup = new THREE.Group();
  starsGroup.name = 'stars';
  
  const starGeo = new THREE.SphereGeometry(0.1, 4, 4);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  for (let i = 0; i < 200; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(
      (Math.random() - 0.5) * 100,
      20 + Math.random() * 30,
      (Math.random() - 0.5) * 100 - 30
    );
    starsGroup.add(star);
  }
  
  scene.add(starsGroup);
};

const createClouds = () => {
  const cloudMat = new THREE.MeshToonMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.75 
  });
  const shadowMat = new THREE.MeshToonMaterial({ 
    color: 0xdddddd, 
    transparent: true, 
    opacity: 0.5 
  });
  
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();
    // Cumulus cloud: larger center puff, smaller side puffs, arranged horizontally
    const mainSize = 1.0 + Math.random() * 0.8;
    const puffCount = 4 + Math.floor(Math.random() * 4);
    
    // Main large center puff
    const mainGeo = new THREE.SphereGeometry(mainSize, 10, 8);
    const main = new THREE.Mesh(mainGeo, cloudMat);
    main.position.set(0, 0, 0);
    main.scale.set(1.4, 0.9, 1.0);
    cloud.add(main);
    
    // Bottom shadow puff
    const shadowGeo = new THREE.SphereGeometry(mainSize * 0.9, 8, 6);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, -mainSize * 0.3, 0);
    shadow.scale.set(1.5, 0.4, 1.1);
    cloud.add(shadow);
    
    // Side puffs arranged horizontally
    for (let j = 1; j < puffCount; j++) {
      const sideSize = mainSize * (0.4 + Math.random() * 0.5);
      const sideGeo = new THREE.SphereGeometry(sideSize, 8, 6);
      const side = new THREE.Mesh(sideGeo, cloudMat);
      const direction = j % 2 === 0 ? 1 : -1;
      const xOffset = direction * (mainSize * 0.6 + (j * 0.5) + Math.random() * 0.5);
      const yOffset = (Math.random() - 0.5) * mainSize * 0.4;
      const zOffset = (Math.random() - 0.5) * mainSize * 0.5;
      side.position.set(xOffset, yOffset, zOffset);
      side.scale.set(1.2, 0.8, 1.0);
      cloud.add(side);
    }
    
    // Top bumps for fluffy look
    for (let k = 0; k < 2; k++) {
      const bumpSize = mainSize * (0.3 + Math.random() * 0.3);
      const bumpGeo = new THREE.SphereGeometry(bumpSize, 8, 6);
      const bump = new THREE.Mesh(bumpGeo, cloudMat);
      bump.position.set(
        (Math.random() - 0.5) * mainSize,
        mainSize * 0.5 + Math.random() * mainSize * 0.3,
        (Math.random() - 0.5) * mainSize * 0.4
      );
      bump.scale.set(1.0, 0.8, 1.0);
      cloud.add(bump);
    }
    
    const scale = 1.0 + Math.random() * 1.5;
    cloud.scale.setScalar(scale);
    cloud.position.set(
      (Math.random() - 0.5) * 50,
      14 + Math.random() * 6,
      -Math.random() * 60
    );
    cloud.castShadow = false;
    scene.add(cloud);
    clouds.push(cloud);
  }
};

const spawnBonusPortal = () => {
  if (bonusPortal || inBonusZone) return;
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const portalGroup = new THREE.Group();
  
  // Golden ring
  const ringGeo = new THREE.TorusGeometry(1.5, 0.15, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = 'portal-ring';
  portalGroup.add(ring);
  
  // Inner shimmer
  const innerGeo = new THREE.CircleGeometry(1.4, 32);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.name = 'portal-inner';
  portalGroup.add(inner);
  
  // Rainbow particles around portal
  for (let i = 0; i < 8; i++) {
    const sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);
    const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x0000ff, 0x8800ff, 0xff00ff];
    const sparkMat = new THREE.MeshBasicMaterial({ color: colors[i] });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    const angle = (i / 8) * Math.PI * 2;
    spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
    spark.name = 'spark-' + i;
    portalGroup.add(spark);
  }
  
  portalGroup.position.set(laneX, 1.5, -50);
  portalGroup.userData = { lane };
  scene.add(portalGroup);
  bonusPortal = { mesh: portalGroup, lane };
};

const triggerRandomEvent = () => {
  if (activeEvent) return;
  activeEvent = 'fog';
  eventDuration = 6;
  fogDensity = 2; // gentler fog (was 5 — too hard)
  eventAlertTextRef.value = '\u{1F32B}\u{FE0F} FOG!';
};

const updateEvent = (delta) => {
  // Fog decay
  if (activeEvent === 'fog') {
    eventDuration -= delta;
    fogDensity = Math.max(0, fogDensity - delta * 0.3);
    if (eventDuration <= 0 || fogDensity <= 0) {
      fogDensity = 0;
      activeEvent = null;
      eventAlertTextRef.value = '';
    }
  }
  
  // Fog effect on scene fog
  if (scene.fog) {
    const baseNear = 20;
    const baseFar = 80;
    if (fogDensity > 0) {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, baseNear * 0.5, delta * 2);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar * 0.5, delta * 2);
    } else {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, baseNear, delta * 2);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar, delta * 2);
    }
  }
};

const createBackgroundElements = () => {
  // Priority texture loading: most visible objects first
  // 1. Building facades (most visible, darkest when missing)
  trackTexture();
  buildingTextures = [
    textureLoader.load('assets/building_pink.webp', () => onTextureLoaded()),
    textureLoader.load('assets/building_blue.webp', () => onTextureLoaded()),
    textureLoader.load('assets/building_green.webp', () => onTextureLoaded()),
  ];
  // Set dominant colors as fallback so buildings don't appear dark before texture loads
  buildingDominantColors = [0xffb6c1, 0x87ceeb, 0x98fb98]; // pink, blue, green
  buildingTextures.forEach((tex, idx) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
  });
  // 2. Trees (billboard sprites) — grass already loaded above
  trackTexture();
  const treeRoundTex = textureLoader.load('assets/tree_round_clean.webp', () => onTextureLoaded());
  trackTexture();
  const treePineTex = textureLoader.load('assets/tree_pine_clean.webp', () => onTextureLoaded());
  
  for (let i = 0; i < 20; i++) {
    const isPine = Math.random() > 0.5;
    const side = Math.random() > 0.5 ? 1 : -1;
    const treeZ = -10 - Math.random() * 30;
    
    // Stage 3: create empty tree group (3D buildings added by applyStageVisuals)
    // Other stages use tree sprites
    const tree = new THREE.Group();
    
    if (currentStage.value !== 2) {
      const treeTex = isPine ? treePineTex : treeRoundTex;
      const treeH = isPine ? 5.6 : 4.8;
      const treeW = isPine ? 3.2 : 4.0;
      
      // Billboard tree sprite (always faces camera)
      const spriteMat = new THREE.SpriteMaterial({ 
        map: treeTex, 
        transparent: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      // Offset sprite up so bottom of visible content aligns with ground
      // Tree textures have ~12% bottom padding — shift center up by half
      sprite.scale.set(treeW, treeH, 1);
      tree.add(sprite);
      
      const treeScale = 0.7 + Math.random() * 0.3;
      tree.scale.setScalar(treeScale);
      const treeBaseY = (treeH / 2) * treeScale;
      const treeX = side * (8 + Math.random() * 10);
      tree.baseY = treeBaseY;
      tree.position.set(
        treeX,
        treeBaseY + getSurfaceY(treeZ),
        treeZ
      );
      tree.baseX = tree.position.x; // store for road curve
      // Store initial position for restart
      tree.userData.initX = tree.position.x;
      tree.userData.initZ = treeZ;
      tree.userData.initBaseX = tree.baseX;
      scene.add(tree);
      trees.push(tree);
    } else {
      // Stage 3: empty group, 3D buildings will be added by applyStageVisuals(3)
      // Building bottom is at local Y=0 (positioned at height/2), so no baseY offset needed
      tree.baseY = 0;
      tree.position.set(
        side * (6 + Math.random() * 6),
        getSurfaceY(treeZ),
        treeZ
      );
      tree.baseX = tree.position.x; // store for road curve
      // Store initial position for restart
      tree.userData.initX = tree.position.x;
      tree.userData.initZ = treeZ;
      tree.userData.initBaseX = tree.baseX;
      scene.add(tree);
      trees.push(tree);
    }
  }
  
  // buildingTextures and buildingDominantColors loaded above
  const buildingColors = [0xffb6c1, 0x87ceeb, 0x98fb98, 0xffd700, 0xdda0dd, 0xffa07a, 0xadd8e6];
  
  for (let i = 0; i < 12; i++) {
    const height = 5 + Math.random() * 10;
    const width = 3 + Math.random() * 4;
    const buildingGroup = new THREE.Group();
    
    // Use AI texture on front face, color on sides/back
    const texIdx = Math.floor(Math.random() * buildingTextures.length);
    const facadeTex = buildingTextures[texIdx];
    const facadeDominant = buildingDominantColors[texIdx]; // fallback color before texture loads
    const buildingGeo = new THREE.BoxGeometry(width, height, width);
    // Determine side early so we can texture the camera-visible face
    const side = Math.random() > 0.5 ? 1 : -1;
    // Multi-material: +X right, -X left, +Y top, -Y bottom, +Z front, -Z back
    // Camera-visible side gets facade texture
    const sideMat = new THREE.MeshToonMaterial({
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
    });
    const frontMat = new THREE.MeshToonMaterial({
      map: facadeTex,
      color: facadeDominant
    });
    const topMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const buildingMats = side < 0
      ? [frontMat, sideMat, topMat, topMat, frontMat, sideMat]  // left building: +X face visible
      : [sideMat, frontMat, topMat, topMat, frontMat, sideMat]  // right building: -X face visible
    const building = new THREE.Mesh(buildingGeo, buildingMats);
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    
    // Rooftop detail
    const roofGeo = new THREE.BoxGeometry(width + 0.3, 0.3, width + 0.3);
    const roofMat = new THREE.MeshToonMaterial({ color: 0x555555 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height / 2 + 0.15;
    buildingGroup.add(roof);
    
    const bldgZ = -20 - Math.random() * 60;
    buildingGroup.position.set(
      side * (10 + Math.random() * 10),
      height / 2 + getSurfaceY(bldgZ),
      bldgZ
    );
    scene.add(buildingGroup);
    buildingGroup.baseY = height / 2;
    buildingGroup.baseX = buildingGroup.position.x; // store for road curve
    // Store initial position for restart
    buildingGroup.userData.initX = buildingGroup.position.x;
    buildingGroup.userData.initZ = bldgZ;
    buildingGroup.userData.initBaseX = buildingGroup.baseX;
    buildings.push(buildingGroup);
    // Apply fachwerk texture if in Stage 2
    if (currentStage.value === 1 && fachwerkTexture) {
      applyFachwerkToBuildings();
    }
    // Apply Stage 3 facade if in Stage 3
    if (currentStage.value === 2 && stage3Textures.building) {
      applyStage3FacadeToBuildings();
    }
  }
};

const spawnObstacle = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  // Pick obstacle type based on difficulty
  const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
  const stage = STAGES[currentStage.value]
  const isMedieval = stage.id === 2 // medieval stage
  const isStage3 = stage.id === 3 // IKEA stage
  
  // Base obstacle types — filter for stage theme
  let types = [];
  
  if (isStage3) {
    // Stage 3: Urban construction site obstacles
    types = ['trafficCone', 'metalBeam', 'dumpster', 'scaffoldTower', 'concreteBarrier', 'billboard'];
    if (difficultyMultiplier > 2.2) types.push('slippery');
  } else if (isMedieval) {
    types = ['brickBox', 'brickBox', 'barrel', 'stone']; // medieval: no cars/buses
    if (difficultyMultiplier > 1.3) types.push('stone', 'barrier');
    if (difficultyMultiplier > 1.8) types.push('wall', 'barrel');
    if (difficultyMultiplier > 2.2) types.push('barrier', 'stone');
    if (difficultyMultiplier > 2.8) types.push('wall', 'barrel');
  } else {
    // Modern highway
    types = ['brickBox', 'brickBox', 'car'];
    if (difficultyMultiplier > 1.3) types.push('stone', 'barrier');
    if (difficultyMultiplier > 1.8) types.push('police', 'bus');
    if (difficultyMultiplier > 2.2) types.push('fireengine', 'wall');
    if (difficultyMultiplier > 2.8) types.push('wall', 'barrel');
  }
  
  const obsType = types[Math.floor(Math.random() * types.length)];
  
  let group, obsLane = lane, hitWidth = 1.5;
  
  switch (obsType) {
    case 'brickBox': {
      group = new THREE.Group();
      const brickGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      const brickMat = new THREE.MeshToonMaterial({ 
        map: textureLoader.load('assets/stage2/brick-wall-layered.png'),
        color: 0x8B4513 
      });
      const brick = new THREE.Mesh(brickGeo, brickMat);
      brick.castShadow = false;
      group.add(brick);
      group.position.set(laneX, 0.9, -50);
      break;
    }
    
    case 'car': {
      group = new THREE.Group();
      // Car body
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.0);
      const carColors = [0xff3333, 0x3366ff, 0xffcc00, 0x33cc33, 0xff6600, 0xcc33ff];
      const carMat = new THREE.MeshToonMaterial({ color: carColors[Math.floor(Math.random() * carColors.length)] });
      const body = new THREE.Mesh(bodyGeo, carMat);
      body.position.y = 0.6;
      body.castShadow = false;
      group.add(body);
      // Roof/cabin
      const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 1.5);
      const roofMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 1.2, -0.3);
      group.add(roof);
      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const [wx, wz] of [[-0.9, 1.0], [0.9, 1.0], [-0.9, -1.0], [0.9, -1.0]]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.3, wz);
        group.add(wheel);
      }
      // Headlights
      const hlGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      for (const hx of [-0.6, 0.6]) {
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(hx, 0.6, 1.51);
        group.add(hl);
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'police': {
      group = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.2);
      const bodyMat = new THREE.MeshToonMaterial({ color: 0x111133 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.6;
      body.castShadow = false;
      group.add(body);
      // White stripe
      const stripeGeo = new THREE.BoxGeometry(1.82, 0.2, 2.0);
      const stripeMat = new THREE.MeshToonMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.7, 0);
      group.add(stripe);
      // Roof + lights
      const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 1.5);
      const roofMat = new THREE.MeshToonMaterial({ color: 0x111133 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 1.2, -0.3);
      group.add(roof);
      // Siren lights (flash red/blue)
      const sirenGeo = new THREE.BoxGeometry(0.4, 0.15, 0.3);
      const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const blueMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const sirenL = new THREE.Mesh(sirenGeo, redMat);
      sirenL.position.set(-0.3, 1.55, -0.3);
      sirenL.name = 'siren-red';
      group.add(sirenL);
      const sirenR = new THREE.Mesh(sirenGeo, blueMat);
      sirenR.position.set(0.3, 1.55, -0.3);
      sirenR.name = 'siren-blue';
      group.add(sirenR);
      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const [wx, wz] of [[-0.9, 1.1], [0.9, 1.1], [-0.9, -1.1], [0.9, -1.1]]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.3, wz);
        group.add(wheel);
      }
      group.position.set(laneX, 0, -50);
      group.rotation.y = Math.PI / 2; // Police car across the road
      break;
    }
    
    case 'fireengine': {
      group = new THREE.Group();
      // Long red body
      const bodyGeo = new THREE.BoxGeometry(1.8, 1.2, 5.0);
      const bodyMat = new THREE.MeshToonMaterial({ color: 0xcc0000 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = false;
      group.add(body);
      // Cabin
      const cabGeo = new THREE.BoxGeometry(1.6, 1.0, 1.5);
      const cabMat = new THREE.MeshToonMaterial({ color: 0xcc0000 });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0, 1.8, 1.5);
      group.add(cab);
      // Windshield
      const wsGeo = new THREE.BoxGeometry(1.2, 0.6, 0.05);
      const wsMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      const ws = new THREE.Mesh(wsGeo, wsMat);
      ws.position.set(0, 1.9, 2.26);
      group.add(ws);
      // Ladder on top
      const ladderGeo = new THREE.BoxGeometry(0.15, 0.1, 3.5);
      const ladderMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
      for (const lx of [-0.4, 0.4]) {
        const rail = new THREE.Mesh(ladderGeo, ladderMat);
        rail.position.set(lx, 2.5, -0.5);
        group.add(rail);
      }
      // Ladder rungs
      const rungGeo = new THREE.BoxGeometry(0.8, 0.06, 0.06);
      for (let rz = -2.0; rz <= 1.0; rz += 0.4) {
        const rung = new THREE.Mesh(rungGeo, ladderMat);
        rung.position.set(0, 2.5, rz);
        group.add(rung);
      }
      // Wheels (6 wheels - 3 per side)
      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const wz of [1.8, 0.0, -1.8]) {
        for (const wx of [-0.95, 0.95]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.35, wz);
          group.add(wheel);
        }
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'bus': {
      group = new THREE.Group();
      // Long bus body
      const bodyGeo = new THREE.BoxGeometry(2.0, 1.5, 5.5);
      const busMat = new THREE.MeshToonMaterial({ color: 0xffaa00 });
      const body = new THREE.Mesh(bodyGeo, busMat);
      body.position.y = 1.1;
      body.castShadow = false;
      group.add(body);
      // Windows row
      const winGeo = new THREE.BoxGeometry(0.5, 0.4, 0.05);
      const winMat = new THREE.MeshToonMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      for (let wz = -2.0; wz <= 2.0; wz += 0.8) {
        for (const wx of [-1.0, 1.0]) {
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(wx * (1.01), 1.3, wz);
          win.rotation.y = wx > 0 ? 0 : Math.PI;
          group.add(win);
        }
      }
      // Windshield
      const fwsGeo = new THREE.BoxGeometry(1.6, 0.6, 0.05);
      const fws = new THREE.Mesh(fwsGeo, winMat);
      fws.position.set(0, 1.3, 2.76);
      group.add(fws);
      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
      const wheelMat = new THREE.MeshToonMaterial({ color: 0x222222 });
      for (const wz of [2.0, -2.0]) {
        for (const wx of [-1.0, 1.0]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.35, wz);
          group.add(wheel);
        }
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'stone': {
      group = new THREE.Group();
      const stoneGeo = new THREE.DodecahedronGeometry(1.0, 1);
      const stoneMat = new THREE.MeshToonMaterial({ color: 0x888888 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.y = 0.7;
      stone.castShadow = false;
      // Random rotation for variety
      stone.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      group.add(stone);
      // Moss patches
      const mossGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const mossMat = new THREE.MeshToonMaterial({ color: 0x447744 });
      for (let m = 0; m < 3; m++) {
        const moss = new THREE.Mesh(mossGeo, mossMat);
        moss.position.set((Math.random()-0.5)*0.8, 1.0+Math.random()*0.3, (Math.random()-0.5)*0.8);
        moss.scale.set(1, 0.3, 1);
        group.add(moss);
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'barrier': {
      group = new THREE.Group();
      // Horizontal bar
      const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8);
      const barMat = new THREE.MeshToonMaterial({ color: 0xff6600 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.8;
      group.add(bar);
      // Striped cones
      const coneGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
      for (const cx of [-0.8, 0.0, 0.8]) {
        const coneMat = new THREE.MeshToonMaterial({ color: cx === 0 ? 0xff6600 : 0xffaa00 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(cx, 0.3, 0);
        group.add(cone);
      }
      // Stripes on bar (white bands)
      const stripGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.15, 8);
      const stripMat = new THREE.MeshToonMaterial({ color: 0xffffff });
      for (const sx of [-0.6, -0.2, 0.2, 0.6]) {
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.rotation.z = Math.PI / 2;
        strip.position.set(sx, 0.8, 0);
        group.add(strip);
      }
      group.position.set(laneX, 0, -50);
      break;
    }
    
    case 'wall': {
      group = new THREE.Group();
      // Wall spans 2 lanes — find which 2 to block
      const gapLane = lane; // the lane with the gap
      const blockedLanes = [0, 1, 2].filter(l => l !== gapLane);
      const wallX = ((blockedLanes[0] + blockedLanes[1] - 2) / 2) * laneWidth;
      
      // Brick wall
      const wallGeo = new THREE.BoxGeometry(4.0, 2.0, 0.5);
      const wallMat = new THREE.MeshToonMaterial({ color: 0xcc6633 });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.y = 1.0;
      wall.castShadow = false;
      group.add(wall);
      // Brick lines
      const lineGeo = new THREE.BoxGeometry(4.02, 0.04, 0.52);
      const lineMat = new THREE.MeshToonMaterial({ color: 0x993311 });
      for (let ly = 0.2; ly < 2.0; ly += 0.3) {
        const brickLine = new THREE.Mesh(lineGeo, lineMat);
        brickLine.position.y = ly;
        group.add(brickLine);
      }
      // Vertical brick gaps
      const vlineGeo = new THREE.BoxGeometry(0.04, 0.25, 0.52);
      for (let ly = 0.2; ly < 2.0; ly += 0.3) {
        const offset = (Math.floor(ly / 0.3) % 2) * 0.4;
        for (let lx = -1.8 + offset; lx < 2.0; lx += 0.8) {
          const vline = new THREE.Mesh(vlineGeo, lineMat);
          vline.position.set(lx, ly + 0.15, 0);
          group.add(vline);
        }
      }
      group.position.set(wallX, 0, -50);
      obsLane = gapLane; // gap lane for spawning purposes
      hitWidth = 2.5;
      group.userData.baseX = wallX; // custom X position (between 2 lanes)
      break;
    }
    
    case 'barrel': {
      group = new THREE.Group();
      // Barrel lying on its side: cylinder axis along Z (rolling direction)
      const barrelGroup = new THREE.Group();
      // Main barrel body
      const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 12);
      const barrelMat = new THREE.MeshToonMaterial({ color: 0x336699 });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = Math.PI / 2; // lay on side
      barrelGroup.add(barrel);
      // Hazard stripes on barrel body
      const stripeGeo2 = new THREE.CylinderGeometry(0.52, 0.52, 0.1, 12);
      const stripeMat2 = new THREE.MeshToonMaterial({ color: 0xffcc00 });
      const stripe1 = new THREE.Mesh(stripeGeo2, stripeMat2);
      stripe1.rotation.z = Math.PI / 2;
      stripe1.position.z = 0.3; // offset along barrel length
      barrelGroup.add(stripe1);
      const stripe2 = new THREE.Mesh(stripeGeo2, stripeMat2);
      stripe2.rotation.z = Math.PI / 2;
      stripe2.position.z = -0.3;
      barrelGroup.add(stripe2);
      // Barrel lids on each end
      const lidGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 12);
      const lidMat = new THREE.MeshToonMaterial({ color: 0x224466 });
      const lid1 = new THREE.Mesh(lidGeo, lidMat);
      lid1.rotation.z = Math.PI / 2;
      lid1.position.z = 0.5;
      barrelGroup.add(lid1);
      const lid2 = new THREE.Mesh(lidGeo, lidMat);
      lid2.rotation.z = Math.PI / 2;
      lid2.position.z = -0.5;
      barrelGroup.add(lid2);
      // Position barrel group: center at ground level (radius 0.5)
      barrelGroup.position.y = 0.5;
      group.add(barrelGroup);
      group.position.set(laneX, 0, -50);
      // Barrel rolls sideways across the road
      group.userData = { driftDir: Math.random() > 0.5 ? 1 : -1, driftSpeed: 0.015 + Math.random() * 0.02, barrelGroup };
      break;
    }
    
    case 'slippery': {
      // Slippery floor - wet floor sign sprite
      group = new THREE.Group();
      // Wet floor sign (yellow triangle on pole)
      const signGeo = new THREE.BoxGeometry(0.8, 0.6, 0.05);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.y = 0.8;
      group.add(sign);
      // Warning symbol (black exclamation)
      const symbolGeo = new THREE.BoxGeometry(0.1, 0.3, 0.06);
      const symbolMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const symbol = new THREE.Mesh(symbolGeo, symbolMat);
      symbol.position.set(0, 0.8, 0.03);
      group.add(symbol);
      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
      const poleMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.4;
      group.add(pole);
      // Base
      const baseGeo = new THREE.BoxGeometry(0.4, 0.1, 0.4);
      const baseMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.05;
      group.add(base);
      // Slippery floor patch (visual collision zone)
      const floorGeo = new THREE.PlaneGeometry(2.5, 4);
      const floorMat = new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.01;
      floor.name = 'slippery-zone';
      group.add(floor);
      group.position.set(laneX, 0, -50);
      break;
    }
    
    // Stage 3 (IKEA) obstacles
    case 'meatball': {
      // T3-03: Swedish meatball - uses sprite texture
      group = new THREE.Group();
      const meatballGeo = new THREE.SphereGeometry(0.7, 24, 24);
      const meatballMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.meatball,
        transparent: true
      });
      const meatball = new THREE.Mesh(meatballGeo, meatballMat);
      meatball.castShadow = false;
      meatball.position.y = 0.7;
      group.add(meatball);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.2;
      break;
    }
    
    case 'allenKey': {
      // T3-04: Allen key - 5-frame spritesheet (simple load, animation later)
      group = new THREE.Group();
      const allenKeyGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      const allenKeyMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.allenKey,
        transparent: true
      });
      const allenKey = new THREE.Mesh(allenKeyGeo, allenKeyMat);
      allenKey.castShadow = false;
      allenKey.position.y = 0.6;
      allenKey.name = 'allenKeySprite';
      group.add(allenKey);
      group.position.set(laneX, 0, -50);
      hitWidth = 0.8;
      break;
    }
    
    case 'shoppingCart': {
      // T3-05: Shopping cart - 3-frame spritesheet (simple load, animation later)
      group = new THREE.Group();
      const cartGeo = new THREE.BoxGeometry(0.8, 0.9, 1.2);
      const cartMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.shoppingCart,
        transparent: true
      });
      const cart = new THREE.Mesh(cartGeo, cartMat);
      cart.castShadow = false;
      cart.position.y = 0.5;
      cart.name = 'shoppingCartSprite';
      group.add(cart);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.3;
      break;
    }
    
    case 'bookshelfTower': {
      // T3-06: Bookshelf tower - 4-frame spritesheet (simple load, animation later)
      group = new THREE.Group();
      const shelfGeo = new THREE.BoxGeometry(1.0, 1.8, 0.6);
      const shelfMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.bookshelfTower,
        transparent: true
      });
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.castShadow = false;
      shelf.position.y = 0.9;
      shelf.name = 'bookshelfSprite';
      group.add(shelf);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.4;
      break;
    }
    
    case 'flatpackStack': {
      // T3-08: Flatpack box stack - static sprite
      group = new THREE.Group();
      const flatpackGeo = new THREE.BoxGeometry(1.0, 1.2, 1.0);
      const flatpackMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.flatpackStack,
        transparent: true
      });
      const flatpack = new THREE.Mesh(flatpackGeo, flatpackMat);
      flatpack.castShadow = false;
      flatpack.position.y = 0.6;
      group.add(flatpack);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.3;
      break;
    }
    
    case 'priceTagBanner': {
      // T3-10: Price tag banner - hanging obstacle
      group = new THREE.Group();
      // Banner pole
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8);
      const poleMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.5;
      group.add(pole);
      // Price tag banner (sprite)
      const bannerGeo = new THREE.PlaneGeometry(1.5, 2.0);
      const bannerMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.priceTagBanner,
        transparent: true,
        side: THREE.DoubleSide
      });
      const banner = new THREE.Mesh(bannerGeo, bannerMat);
      banner.position.set(0, 2.2, 0.1);
      banner.name = 'priceTagBanner';
      group.add(banner);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.0;
      break;
    }
    
    case 'wardrobePortal': {
      // T3-07: Wardrobe portal - 2-frame spritesheet (simple load, animation later)
      group = new THREE.Group();
      const portalGeo = new THREE.PlaneGeometry(1.8, 2.5);
      const portalMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.wardrobePortal,
        transparent: true,
        side: THREE.DoubleSide
      });
      const portal = new THREE.Mesh(portalGeo, portalMat);
      portal.castShadow = false;
      portal.position.y = 1.25;
      portal.name = 'wardrobePortalSprite';
      group.add(portal);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.5;
      break;
    }
    
    // Urban construction obstacles
    case 'trafficCone': {
      group = new THREE.Group();
      const coneGeo = new THREE.ConeGeometry(0.4, 0.9, 16);
      const coneMat = new THREE.MeshToonMaterial({ 
        map: stage3Textures.trafficCone,
        color: 0xff6600
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.castShadow = false;
      cone.position.y = 0.45;
      group.add(cone);
      group.position.set(laneX, 0, -50);
      hitWidth = 0.8;
      break;
    }
    
    case 'dumpster': {
      group = new THREE.Group();
      const dumpsterGeo = new THREE.BoxGeometry(1.5, 1.2, 2.0);
      const dumpsterMat = new THREE.MeshToonMaterial({ 
        map: stage3Textures.dumpster,
        color: 0x228822
      });
      const dumpster = new THREE.Mesh(dumpsterGeo, dumpsterMat);
      dumpster.castShadow = false;
      dumpster.position.y = 0.6;
      group.add(dumpster);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.5;
      break;
    }
    
    case 'scaffoldTower': {
      group = new THREE.Group();
      const scaffoldGeo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
      const scaffoldMat = new THREE.MeshToonMaterial({ 
        map: stage3Textures.scaffoldTower,
        color: 0x888888
      });
      const scaffold = new THREE.Mesh(scaffoldGeo, scaffoldMat);
      scaffold.castShadow = false;
      scaffold.position.y = 1.25;
      group.add(scaffold);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.3;
      break;
    }
    
    case 'concreteBarrier': {
      group = new THREE.Group();
      const barrierGeo = new THREE.BoxGeometry(2.0, 0.8, 0.5);
      const barrierMat = new THREE.MeshToonMaterial({ 
        map: stage3Textures.concreteBarrier,
        color: 0xaaaaaa
      });
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.castShadow = false;
      barrier.position.y = 0.4;
      group.add(barrier);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.8;
      break;
    }
    
    case 'billboard': {
      group = new THREE.Group();
      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.0, 8);
      const poleMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.5;
      group.add(pole);
      // Billboard sign
      const signGeo = new THREE.PlaneGeometry(2.5, 1.5);
      const signMat = new THREE.MeshBasicMaterial({ 
        map: stage3Textures.billboard,
        side: THREE.DoubleSide
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 2.8, 0.1);
      group.add(sign);
      group.position.set(laneX, 0, -50);
      hitWidth = 1.5;
      break;
    }
  }
  
  // Add to scene with overlap detection
  scene.add(group);
  group.position.y += getSurfaceY(-50);
  group.baseY = group.position.y - getSurfaceY(-50);
  obstacles.push({ mesh: group, lane: obsLane, type: 'ground', obstacleType: obsType, hitWidth });
};

const spawnFloatingObstacle = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  const ufoGroup = new THREE.Group();
  
  // UFO dome (top)
  const domeGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshToonMaterial({ color: 0x88ff88, emissive: 0x22aa22, emissiveIntensity: 0.3 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0.1;
  dome.castShadow = false;
  ufoGroup.add(dome);
  
  // UFO saucer body (flattened disc)
  const saucerGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 24);
  const saucerMat = new THREE.MeshToonMaterial({ color: 0xcccccc, emissive: 0x444444, emissiveIntensity: 0.2 });
  const saucer = new THREE.Mesh(saucerGeo, saucerMat);
  saucer.castShadow = false;
  ufoGroup.add(saucer);
  
  // UFO bottom ring (glowing)
  const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.15;
  ring.name = 'ufo-ring';
  ufoGroup.add(ring);
  
  // UFO lights around the rim
  const lightGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const lightColors = [0xff0000, 0xffff00, 0x00ff00, 0x0088ff, 0xff00ff];
  for (let i = 0; i < 5; i++) {
    const lightMat = new THREE.MeshBasicMaterial({ color: lightColors[i] });
    const ufoLight = new THREE.Mesh(lightGeo, lightMat);
    const angle = (i / 5) * Math.PI * 2;
    ufoLight.position.set(Math.cos(angle) * 1.1, -0.05, Math.sin(angle) * 1.1);
    ufoLight.name = 'ufo-light-' + i;
    ufoGroup.add(ufoLight);
  }
  
  // Tractor beam (cone below)
  const beamGeo = new THREE.ConeGeometry(1.2, 1.5, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -1.0;
  beam.rotation.x = Math.PI; // Point downward
  ufoGroup.add(beam);
  
  ufoGroup.position.set(laneX, 2.2, -50);
  scene.add(ufoGroup);
  ufoGroup.position.y += getSurfaceY(-50);
  ufoGroup.baseY = ufoGroup.position.y - getSurfaceY(-50);
  obstacles.push({ mesh: ufoGroup, lane, type: 'floating' });
};

// Shared geometry/material caches (avoid re-creating per spawn)
let sharedCoinGeo, sharedCoinMat;
let sharedShadowGeo, sharedShadowMat;

const spawnCoin = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  
  if (!sharedCoinGeo) {
    sharedCoinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    sharedCoinMat = new THREE.MeshToonMaterial({ 
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    });
  }
  const coinObj = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
  coinObj.castShadow = false;
  coinObj.position.set(laneX, 1, -50);
  
  // Add to scene with overlap detection (coins shouldn't overlap obstacles)
  scene.add(coinObj);
  const spawnX = coinObj.position.x;
  const spawnZ = coinObj.position.z;
  
  // Check for overlap with obstacles
  let hasOverlap = false;
  for (const obs of obstacles) {
    if (obs.mesh && obs.mesh.position) {
      const dx = spawnX - obs.mesh.position.x;
      const dz = spawnZ - obs.mesh.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < COIN_OBSTACLE_OVERLAP_RADIUS) {
        hasOverlap = true;
        break;
      }
    }
  }
  
  if (hasOverlap) {
    // Skip this coin spawn - don't add to array
    scene.remove(coinObj);
    return;
  }
  
  coinObj.position.y += getSurfaceY(-50);
  coinObj.baseY = coinObj.position.y - getSurfaceY(-50);
  coins.push({ mesh: coinObj, lane, collected: false });
};

const spawnPowerup = () => {
  const lane = Math.floor(Math.random() * 3);
  const laneX = (lane - 1) * laneWidth;
  const type = Math.random() < 0.33 ? 'shield' : (Math.random() < 0.5 ? 'coldDrink' : 'magnet');
  
  const powerupGroup = new THREE.Group();
  
  if (type === 'shield') {
    const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const orbMat = new THREE.MeshToonMaterial({ 
      color: 0x00bfff, 
      emissive: 0x00bfff, 
      emissiveIntensity: 0.5,
      transparent: true, 
      opacity: 0.8 
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    powerupGroup.add(orb);
    
    const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00bfff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    powerupGroup.add(ring);
  } else if (type === 'coldDrink') {
    // Energy drink / soda can - cylinder shape with can-like colors
    const canGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
    const canMat = new THREE.MeshToonMaterial({ 
      color: 0xff4444, 
      emissive: 0xff4444, 
      emissiveIntensity: 0.3 
    });
    const can = new THREE.Mesh(canGeo, canMat);
    // Add a label/stripe around the can
    const labelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 16);
    const labelMat = new THREE.MeshToonMaterial({ color: 0xffffff });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = 0.1;
    can.add(label);
    // Add top cap
    const topGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
    const topMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.45;
    can.add(top);
    can.rotation.x = Math.PI / 2;
    powerupGroup.add(can);
  } else if (type === 'magnet') {
    // Horseshoe/U-shaped magnet with red and blue poles
    const magnetGroup = new THREE.Group();
    
    // Main horseshoe body (U-shape) using TorusGeometry bent into a U
    const horseshoeGeo = new THREE.TorusGeometry(0.5, 0.12, 8, 24, Math.PI);
    const horseshoeMat = new THREE.MeshToonMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
    const horseshoe = new THREE.Mesh(horseshoeGeo, horseshoeMat);
    horseshoe.rotation.z = -Math.PI / 2; // Open end facing forward
    magnetGroup.add(horseshoe);
    
    // Red pole (left side)
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
    const redMat = new THREE.MeshToonMaterial({ color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 0.4 });
    const redPole = new THREE.Mesh(poleGeo, redMat);
    redPole.position.set(-0.5, 0, 0);
    redPole.rotation.x = Math.PI / 2;
    magnetGroup.add(redPole);
    
    // Blue pole (right side)
    const bluePole = new THREE.Mesh(poleGeo, new THREE.MeshToonMaterial({ color: 0x3333ff, emissive: 0x3333ff, emissiveIntensity: 0.4 }));
    bluePole.position.set(0.5, 0, 0);
    bluePole.rotation.x = Math.PI / 2;
    magnetGroup.add(bluePole);
    
    powerupGroup.add(magnetGroup);
  }
  
  powerupGroup.position.set(laneX, 1 + getSurfaceY(-50), -50);
  powerupGroup.userData = { type };
  powerupGroup.baseY = 1; // flat Y without curve
  scene.add(powerupGroup);
  powerups.push({ mesh: powerupGroup, lane, type, collected: false });
};

const createParticleEffect = (position, color, count = 10) => {
  const particleGeo = new THREE.SphereGeometry(0.1, 4, 4);
  const particleMat = new THREE.MeshBasicMaterial({ color });
  
  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3 + 0.2,
      (Math.random() - 0.5) * 0.3
    );
    particle.life = 1.0;
    scene.add(particle);
    particles.push(particle);
  }
};

const createFloatingText = (text, position, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = color || 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.textAlign = 'center';
  ctx.strokeText(text, 256, 80);
  ctx.fillText(text, 256, 80);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(4, 1, 1);
  sprite.userData = { life: 2.0, velocity: new THREE.Vector3(0, 0.5, 0) };
  scene.add(sprite);
  floatingTexts.push(sprite);
};

// Boss spawn function
// Boss attack state
let bossAttackTimer = 0
let bossNextAttack = 3 // seconds until first attack
let bossProjectiles = []
let bossDebris = [] // debris dropped by giantMeatball boss
let bossCharging = false
let bossChargeTimer = 0
let bossChargeTarget = 0

// Boss AI state machine - T3-30
let bossState = 'idle' // 'idle' | 'charging' | 'vulnerable'
let bossStateTimer = 0
let bossVulnerableOrbs = []

// Boss tuning constants - T3-55
const BOSS_BASE_HEALTH = 100
const BOSS_ORB_DAMAGE = 10
const BOSS_MIN_ORBS = 4
const BOSS_MAX_ORBS = 7
const BOSS_CHARGE_SPEED_MULTIPLIER = 1.35
const BOSS_VULNERABLE_DURATION = 3.5
const BOSS_IDLE_DURATION = 2.5

// Stage countdown helper function - starts 3-2-1-GO sequence then resumes game
const startStageCountdown = () => {
  countdownLocked = true
  countdownActive.value = true
  // Calibrate mic ambient noise baseline during countdown
  if (micEnabledRef.value) {
    startCalibration();
  }
  let count = 3
  countdownText.value = count.toString()
  const stageTick = () => {
    count--
    if (count > 0) {
      countdownText.value = count.toString()
      setTimeout(stageTick, 1000)
    } else if (count === 0) {
      countdownText.value = 'GO!'
      playSound('start')
      // 2-second invincibility after stage starts
      isInvincible = true
      gameStartTime = Date.now()
      setTimeout(() => {
        countdownActive.value = false
        countdownLocked = false
        stageTransitioning.value = false // unlock game loop
        gameDuration = 1.5
        lastSpawnTime = clock.getElapsedTime() - spawnInterval
        bossWarning.value = false // defensive: ensure cleared
        const graceGeo = new THREE.SphereGeometry(1.2, 16, 16)
        const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
        const graceMesh = new THREE.Mesh(graceGeo, graceMat)
        graceMesh.name = 'shield-aura'
        player.add(graceMesh)
        invincibilityTimeout = setTimeout(() => {
          isInvincible = false
          invincibilityTimeout = null
          const shield = player.getObjectByName('shield-aura')
          if (shield) player.remove(shield)
        }, 2000)
      }, 500)
    }
  }
  setTimeout(stageTick, 1000)
}

// Pending timeouts that must be cancelled on restart
let bossDefeatTimeout1 = null
let invincibilityTimeout = null
let gameOverTime = 0 // timestamp of game over, prevents instant restart
let gameStartTime = 0 // timestamp when game started, grace period for collisions

// Centralized game-over handler — all death paths must call this
const triggerGameOver = (shakeIntensity = 0.5) => {
  if (gameOver.value) return // already dead, don't double-fire
  gameOver.value = true
  gameOverTime = Date.now() // block restart for 1 second
  // Clean up bonus zone
  if (bonusPortal) { scene.remove(bonusPortal.mesh); bonusPortal = null; }
  inBonusZone = false; inBonusZoneRef.value = false; bonusTimer = 0; bonusTimerRef.value = 0;
  inShowroom = false; inShowroomRef.value = false; showroomTimer = 0; showroomTimerRef.value = 0;
  isShowroomPortal = false; bonusPortalType = 'bonus';
  bonusNoSpawn = false;
  bonusCoins.forEach(bc => scene.remove(bc.mesh));
  bonusCoins = [];
  scene.userData.bonusEnvActive = false;
  if (scene.userData.nyanCat) {
    scene.remove(scene.userData.nyanCat);
    scene.userData.nyanCat = null;
    scene.userData.nyanCatTime = 0;
  }
  // Restore road material if in rainbow mode
  const roadGO = scene.getObjectByName('road');
  if (roadGO && originalRoadMaterial) {
    roadGO.material.dispose();
    roadGO.material = originalRoadMaterial;
    originalRoadMaterial = null;
  }
  // Discard saved substage state (we're starting fresh)
  if (savedSubstageState) {
    savedSubstageState.obstacles.forEach(obs => scene.remove(obs.mesh));
    savedSubstageState.coins.forEach(coin => scene.remove(coin.mesh));
    savedSubstageState = null;
  }
  // Restore building/tree visibility
  buildings.forEach(b => { b.visible = true; });
  trees.forEach(t => { t.visible = true; });
  // Immediately remove all game objects from scene so they can't interfere on restart
  obstacles.forEach(obs => { obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); }); scene.remove(obs.mesh); });
  obstacles.length = 0;
  coins.forEach(coin => scene.remove(coin.mesh));
  coins.length = 0;
  powerups.forEach(pw => scene.remove(pw.mesh));
  powerups.length = 0;
  bossProjectiles.forEach(fb => scene.remove(fb));
  bossProjectiles.length = 0;
  // Clear vulnerable orbs
  bossVulnerableOrbs.forEach(orb => scene.remove(orb.mesh));
  bossVulnerableOrbs.length = 0;
  particles.forEach(p => scene.remove(p));
  particles.length = 0;
  floatingTexts.forEach(t => scene.remove(t));
  floatingTexts.length = 0;
  if (boss) { scene.remove(boss); boss = null; }
  // Cancel any pending boss/stage timeouts
  if (bossDefeatTimeout1) { clearTimeout(bossDefeatTimeout1); bossDefeatTimeout1 = null; }
  bossDefeated.value = false;
  bossCharging = false;
  bossState = 'idle';
  bossStateTimer = 0;

  // Save score + stats
  saveHighScore();
  if (score.value > gameStats.maxScore) gameStats.maxScore = score.value;
  if (gameDuration > gameStats.maxTime) gameStats.maxTime = gameDuration;
  if (score.value > gameStats.bestRun) gameStats.bestRun = score.value;
  saveProgress();
  // Effects
  playSound('crash');
  createParticleEffect(player.position, 0xff0000, 30);
  comboCount = 0;
  // Screen shake
  const originalPos = camera.position.clone();
  let shakeTime = 0;
  gameOverShakeInterval = setInterval(() => {
    shakeTime += 0.05;
    if (shakeTime > 0.5) {
      camera.position.copy(originalPos);
      clearInterval(gameOverShakeInterval);
      gameOverShakeInterval = null;
      return;
    }
    camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
    camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeIntensity * (1 - shakeTime * 2);
  }, 30);
  // Show name entry if high score
  showNameEntry.value = isHighScore.value;
};

function spawnBoss(bossType) {
  if (boss) { scene.remove(boss); boss = null; }
  bossProjectiles = []
  bossAttackTimer = 0
  bossNextAttack = 2 + Math.random() * 2
  bossCharging = false
  bossChargeTimer = 0
  bossState = 'idle'
  bossStateTimer = 0
  bossVulnerableOrbs = []
  
  const group = new THREE.Group()
  group.name = 'boss'
  
  if (bossType === 'truck') {
    // Truck boss — big red box with headlights
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 5),
      new THREE.MeshPhongMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.2 })
    )
    body.position.y = 1.5
    group.add(body)
    // Cab
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshPhongMaterial({ color: 0xcc1111 })
    )
    cab.position.set(0, 3, 1)
    group.add(cab)
    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.2, 6, 6)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff88 })
    const hl = new THREE.Mesh(lightGeo, lightMat)
    hl.position.set(-0.8, 1.5, 2.5)
    group.add(hl)
    const hr = new THREE.Mesh(lightGeo, lightMat)
    hr.position.set(0.8, 1.5, 2.5)
    group.add(hr)
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8)
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
    for (const [x, z] of [[-1.6, 1.5], [1.6, 1.5], [-1.6, -1.5], [1.6, -1.5]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat)
      w.rotation.z = Math.PI / 2
      w.position.set(x, 0.4, z)
      group.add(w)
    }
  } else if (bossType === 'giantMeatball') {
    // Flying Spaghetti Meatball boss — sprite-based with rotating colorful tentacles
    const spriteMat = new THREE.SpriteMaterial({ 
      map: textureLoader.load('assets/stage3/boss_spaghetti_meatball.png'),
      transparent: true
    })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.set(5, 5, 1)
    sprite.position.y = 2.5
    group.add(sprite)
    
    // Add glow at halo center
    const glowLight = new THREE.PointLight(0xff00ff, 2, 10)
    glowLight.position.set(0, 2.5, 0)
    group.add(glowLight)
    
    // Add beholder-style tentacles in crown/halo formation
    const tentacleCount = 12
    const tentacles = []
    for (let i = 0; i < tentacleCount; i++) {
      const tentacleGeo = new THREE.CylinderGeometry(0.2, 0.08, 2.0, 8)
      const tentacleMat = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL((i / tentacleCount) % 1, 0.7, 0.4),
        emissive: new THREE.Color().setHSL((i / tentacleCount) % 1, 0.5, 0.2),
        emissiveIntensity: 0.2
      })
      const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat)
      const angle = (i / tentacleCount) * Math.PI * 2
      // Vertical halo: spread around Y axis
      const radius = 2.5
      const baseY = 2.5 // Center of meatball
      tentacle.position.set(
        Math.cos(angle) * radius,  // X spread
        baseY + Math.sin(angle) * radius,  // Y spread (vertical)
        0  // Z = center
      )
      tentacle.rotation.z = angle
      tentacle.userData = { baseAngle: angle, offset: i }
      group.add(tentacle)
      tentacles.push(tentacle)
    }
    group.userData.tentacles = tentacles
  } else {
    // Dragon boss — detailed polygon dragon
    // Stage 2 (index 1) = red fire dragon, other stages = purple
    const isStage2Dragon = (currentStage.value === 1)
    const dragonColor = isStage2Dragon ? 0xff3300 : 0x9933ff
    const dragonEmissive = isStage2Dragon ? 0xaa2200 : 0x4400aa
    const dragonColorDark = isStage2Dragon ? 0xaa2200 : 0x6622aa
    const dragonEmissiveDark = isStage2Dragon ? 0x661100 : 0x330066
    const dragonColorBelly = isStage2Dragon ? 0xff6644 : 0xcc88ff
    const dragonEmissiveBelly = isStage2Dragon ? 0xcc4400 : 0x8844cc
    const dragonWingColor = isStage2Dragon ? 0xcc4400 : 0x7722cc
    
    const dMat = new THREE.MeshPhongMaterial({ color: dragonColor, emissive: dragonEmissive, emissiveIntensity: 0.25 })
    const dMatDark = new THREE.MeshPhongMaterial({ color: dragonColorDark, emissive: dragonEmissiveDark, emissiveIntensity: 0.2 })
    const dMatBelly = new THREE.MeshPhongMaterial({ color: dragonColorBelly, emissive: dragonEmissiveBelly, emissiveIntensity: 0.15 })
    // Body — elongated ellipsoid
    const bodyGeo = new THREE.SphereGeometry(1, 8, 6)
    bodyGeo.scale(1.2, 0.8, 2.0)
    const body = new THREE.Mesh(bodyGeo, dMat)
    body.position.y = 0
    group.add(body)
    // Belly — slightly protruding underside
    const bellyGeo = new THREE.SphereGeometry(0.7, 6, 4)
    bellyGeo.scale(0.9, 0.6, 1.8)
    const belly = new THREE.Mesh(bellyGeo, dMatBelly)
    belly.position.set(0, -0.3, 0.1)
    group.add(belly)
    // Head — sphere + snout
    const headGeo = new THREE.SphereGeometry(0.6, 8, 6)
    const head = new THREE.Mesh(headGeo, dMat)
    head.position.set(0, 0.5, 2.2)
    group.add(head)
    // Snout
    const snoutGeo = new THREE.ConeGeometry(0.35, 1.0, 6)
    const snout = new THREE.Mesh(snoutGeo, dMat)
    snout.rotation.x = -Math.PI / 2
    snout.position.set(0, 0.3, 3.0)
    group.add(snout)
    // Eyes — glowing
    const eyeGeo = new THREE.SphereGeometry(0.12, 6, 6)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
    const le = new THREE.Mesh(eyeGeo, eyeMat)
    le.position.set(-0.25, 0.7, 2.7)
    group.add(le)
    const re = new THREE.Mesh(eyeGeo, eyeMat)
    re.position.set(0.25, 0.7, 2.7)
    group.add(re)
    // Horns
    const hornGeo = new THREE.ConeGeometry(0.1, 0.8, 5)
    const hornMat = new THREE.MeshPhongMaterial({ color: 0xddcc88 })
    const lh = new THREE.Mesh(hornGeo, hornMat)
    lh.position.set(-0.3, 1.0, 2.1)
    lh.rotation.z = 0.4
    group.add(lh)
    const rh = new THREE.Mesh(hornGeo, hornMat)
    rh.position.set(0.3, 1.0, 2.1)
    rh.rotation.z = -0.4
    group.add(rh)
    // Wings — large bat-like (3 segments each)
    const wingMat = new THREE.MeshPhongMaterial({ color: dragonWingColor, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    // Left wing — 3 triangular flaps
    for (let s = 0; s < 3; s++) {
      const wGeo = new THREE.BufferGeometry()
      const angle = -0.3 - s * 0.3
      const len = 2.5 - s * 0.5
      const wVerts = new Float32Array([0,0,0, -len, 0.8+s*0.3, -0.3+s*0.2, -len*0.6, -0.2, 0.2+s*0.1])
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3))
      wGeo.computeVertexNormals()
      const wMesh = new THREE.Mesh(wGeo, wingMat)
      wMesh.position.set(-0.8, 0.3, -0.5)
      group.add(wMesh)
    }
    // Right wing
    for (let s = 0; s < 3; s++) {
      const wGeo = new THREE.BufferGeometry()
      const len = 2.5 - s * 0.5
      const wVerts = new Float32Array([0,0,0, len, 0.8+s*0.3, -0.3+s*0.2, len*0.6, -0.2, 0.2+s*0.1])
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3))
      wGeo.computeVertexNormals()
      const wMesh = new THREE.Mesh(wGeo, wingMat)
      wMesh.position.set(0.8, 0.3, -0.5)
      group.add(wMesh)
    }
    // Tail — chain of 5 spheres
    for (let t = 0; t < 5; t++) {
      const tGeo = new THREE.SphereGeometry(0.3 - t * 0.04, 6, 4)
      const tMesh = new THREE.Mesh(tGeo, dMatDark)
      tMesh.position.set(0, -0.1 + Math.sin(t*0.5)*0.2, -1.2 - t * 0.6)
      group.add(tMesh)
    }
    // Tail tip — spike
    const tipGeo = new THREE.ConeGeometry(0.15, 0.5, 4)
    const tip = new THREE.Mesh(tipGeo, hornMat)
    tip.rotation.x = Math.PI / 2
    tip.position.set(0, -0.1, -4.4)
    group.add(tip)
    // Legs — 4 stubby
    const legGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 5)
    for (const [x, z] of [[-0.6, 0.8], [0.6, 0.8], [-0.5, -0.5], [0.5, -0.5]]) {
      const leg = new THREE.Mesh(legGeo, dMatDark)
      leg.position.set(x, -0.7, z)
      group.add(leg)
    }
  }
  
  group.position.set(0, bossType === 'truck' ? 0 : 5, -25) // Stage 3 boss closer to avoid fog
  scene.add(group)
  boss = group
}

function spawnBossProjectile(type) {
  if (type === 'truck') {
    // Truck charges — aim for character, then ram straight without changing trajectory
    bossCharging = true
    bossChargeTimer = 0
    bossChargeTarget = -5
    playSFX('truck_rev')
    // Lock target: aim for character's current position, then straight line
    if (boss) {
      boss.userData = boss.userData || {}
      boss.userData.chargeTargetX = player.position.x // aim for character position
      boss.userData.chargeStartX = boss.position.x
      boss.userData.chargeStartZ = boss.position.z
      boss.userData.chargeMissTriggered = false
    }
  } else if (type === 'giantMeatball') {
    // Stage 3 boss (spaghetti meatball): Drops metal beams from above (urban theme)
    // Rapid random spawning - 4-6 beams per volley
    const numBeams = 4 + Math.floor(Math.random() * 3) // 4-6 beams
    const lanes = [0, 1, 2]
    const attackLanes = lanes.sort(() => Math.random() - 0.5).slice(0, Math.min(numBeams, 3))
    
    attackLanes.forEach((lane, idx) => {
      const targetX = (lane - 1) * laneWidth
      
      // Metal beam: use sprite texture for long beam that spreads across z-axis
      const beamSpriteMat = new THREE.SpriteMaterial({
        map: textureLoader.load('assets/stage3/obstacle-metal-beam.png'),
        transparent: true
      })
      const beam = new THREE.Sprite(beamSpriteMat)
      beam.scale.set(1.2, 1.5, 6.0) // long on Z axis
      
      // Start lower, fall straight down with random z spread
      const zSpread = -30 + (Math.random() - 0.5) * 10 // beams at z=-25 to -35
      beam.position.set(targetX, 6 + idx * 1, zSpread)
      beam.userData = { targetX, targetY: 0.5, speed: 0.6 + Math.random() * 0.3, lane, rotationSpeed: 0.15 + Math.random() * 0.2 }
      scene.add(beam)
      bossProjectiles.push(beam)
    })
    createFloatingText('⚠️', new THREE.Vector3(0, 10, -20), '#aaaaaa')
    playSFX('crash_metal', 0.5)
  } else {
    // Dragon fires 2-3 fireballs at different lanes & heights
    const lanes = [0, 1, 2]
    const playerLane = currentLane
    const otherLanes = lanes.filter(l => l !== playerLane).sort(() => Math.random() - 0.5)
    const attackLanes = [playerLane]
    const extra = Math.random() > 0.3 ? 2 : 1
    for (let i = 0; i < Math.min(extra, otherLanes.length); i++) attackLanes.push(otherLanes[i])
    
    attackLanes.forEach((lane, idx) => {
      const targetX = (lane - 1) * laneWidth
      const fbY = 0.3 + Math.random() * 3.2 // random height between 0.3 and 3.5
      
      const fbGeo = new THREE.SphereGeometry(0.5, 8, 8)
      const fbMat = new THREE.MeshBasicMaterial({ color: 0xff6600 })
      const fb = new THREE.Mesh(fbGeo, fbMat)
      const glowGeo = new THREE.SphereGeometry(0.8, 8, 8)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.4 })
      fb.add(new THREE.Mesh(glowGeo, glowMat))
      
      fb.position.set(boss.position.x + (Math.random() - 0.5) * 3, fbY, boss.position.z + 2 + Math.random() * 2)
      fb.userData = { targetX, targetLane: lane, targetY: fbY, speed: 0.3 + Math.random() * 0.3, delay: idx * 0.15 }
      scene.add(fb)
      bossProjectiles.push(fb)
    })
    createFloatingText('\u{1f525}', new THREE.Vector3((attackLanes[0] - 1) * laneWidth, 2, -5), '#ff6600')
    playSFX('fire_shoot', 0.5) // per volley, not per bullet
  }
}

// Comic-book word art for bullet time

const animate = () => {
  requestAnimationFrame(animate);

  // Freeze everything during loading screen
  if (showLoadingScreen.value) {
    clock.getDelta(); // consume delta to prevent time jump
    return;
  }

  // Handle pause state
  if (isPaused.value) {
    clock.getDelta(); // consume delta to prevent time jump
    composer.render();
    return;
  }

  if (gameOver.value) {
    // Still update powerup timer even when game over
    if (activePowerup) {
      powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
      if (powerupTimeLeft.value <= 0) {
        deactivatePowerup();
      }
    }
    // Still render scene when game over so background stays visible
    camera.lookAt(0, 1, -8);
    composer.render();
    return;
  }

  // Freeze game during countdown
  if (countdownLocked) {
    clock.getDelta(); // consume delta to prevent time jump
    camera.lookAt(0, 1, -8);
    composer.render();
    return;
  }

  const realDelta = clock.getDelta(); // unscaled real time
  const delta = realDelta;
  const time = clock.getElapsedTime();
  
  // === DEBUG OVERLAY UPDATES ===
  if (showDebugOverlay.value) {
    if (roadMesh) {
      roadY.value = roadMesh.position.y;
      roadRenderOrder.value = roadMesh.renderOrder;
    }
    if (grassMesh) {
      grassY.value = grassMesh.position.y;
      grassRenderOrder.value = grassMesh.renderOrder;
      grassDepthWrite.value = grassMesh.material.depthWrite;
    }
  }
  
  const stage = STAGES[currentStage.value];
  const isStage3 = stage.id === 3;
  
  // Update intercom randomizer for Stage 3
  updateIntercom(delta, isStage3);
  
  if (!gameOver.value && !stageTransitioning.value && !countdownLocked) gameDuration += delta;
  if (gameDuration < 3 && Math.random() < 0.05) {
    console.log('[GAME-DURATION] gameDuration=', gameDuration.toFixed(3), 'delta=', delta.toFixed(4), 'stageTransitioning=', stageTransitioning.value, 'countdownLocked=', countdownLocked);
  }
  dayCycleTime = (dayCycleTime + delta) % DAY_DURATION;
  
  // === STAGE TIME TRACKING ===
  if (!countdownLocked && !gameOver.value && !stageTransitioning.value) {
    stageTime.value += realDelta
  }

  // === CURVE OSCILLATION (not during boss, or disabled) ===
  // Curve front sweeps from horizon toward player so you can see it approaching
  if (!bossActive.value && roadCurveEnabled.value) {
    curveChangeTimer.value += realDelta
    if (curveChangeTimer.value >= nextCurveChange.value) {
      if (Math.abs(roadCurveTarget.value) < 0.1) {
        // Start a new curve — front starts at horizon
        roadCurveTarget.value = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6)
        curveFrontZ.value = -80 // front starts at horizon, sweeps toward player
        nextCurveChange.value = 2.5 + Math.random() * 1.5
      } else {
        // Straighten out — when straight, curve doesn't need a front
        roadCurveTarget.value = 0
        nextCurveChange.value = 5 + Math.random() * 5
      }
      curveChangeTimer.value = 0
    }
    // Lerp curve value
    const lerpSpeed = Math.abs(roadCurveTarget.value) > 0.1 ? Math.min(realDelta * 1.5, 0.1) : Math.min(realDelta * 0.8, 0.05)
    roadCurve.value += (roadCurveTarget.value - roadCurve.value) * lerpSpeed
    // Sweep curve front toward player (0 = right at player)
    // Front moves at road speed so the bend visually approaches
    if (curveFrontZ.value < 0) {
      curveFrontZ.value += realDelta * 25 // takes ~3.2 seconds to sweep from -80 to 0
      if (curveFrontZ.value > 0) curveFrontZ.value = 0
    }
  } else {
    roadCurve.value += (0 - roadCurve.value) * Math.min(realDelta * 1.0, 0.06)
  }

  // === UPDATE ROAD MESH CURVE ===
  updateRoadCurve();
  
  // Scroll cobblestone texture (Stage 2 only) - match ground texture scroll direction
  // Note: currentStage is 0-indexed, so === 1 means Stage 2 (Medieval)
  if (cobblestoneTexture && currentStage.value === 1 && cobblestoneTexture.image) {
    cobblestoneTexture.offset.y -= gameSpeed * 0.15;
  }

  // === BOSS WARNING + SPAWN TRIGGER ===
  const bossSpawnTime = stage.stageDuration
  
  // Warning 5s before boss
  if (stageTime.value >= bossSpawnTime - 5 && stageTime.value < bossSpawnTime && !bossActive.value && !bossWarning.value && !bossDefeated.value) {
    bossWarning.value = true
    createFloatingText('\u26A0\uFE0F BOSS INCOMING! \u26A0\uFE0F', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
  }
  
  // Spawn boss
  if (stageTime.value >= bossSpawnTime && !bossActive.value && !bossDefeated.value && !stageTransitioning.value) {
    bossWarning.value = false
    bossActive.value = true
    // Difficulty scaling: boss health increases with game duration
    const difficultyMultiplier = 1 + (gameDuration / 60) // +100% health per 60 seconds
    bossHealth.value = Math.min(250, Math.floor(BOSS_BASE_HEALTH * difficultyMultiplier))
    createFloatingText(`\u26A0\uFE0F ${stage.bossType === 'truck' ? 'ROAD RAGE TRUCK' : 'SKY TERROR DRAGON'} \u26A0\uFE0F`, player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
    playSFX(stage.bossType === 'truck' ? 'truck_honk' : 'dragon_cry', 0.6)
    spawnBoss(stage.bossType)
  }

  // === BOSS TIMER (decrement health over bossDuration seconds) ===
  if (bossActive.value && !bossDefeated.value) {
    bossHealth.value -= (100 / stage.bossDuration) * realDelta
    if (bossHealth.value <= 0) {
      bossDefeated.value = true
      bossActive.value = false
      bossWarning.value = false
      bossHealth.value = 0
      createFloatingText('\u2728 STAGE CLEAR! \u2728', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#44ff44')
      playSFX('stage_clear')
      // Block spawning immediately — stageTransitioning prevents obstacle/coin/powerup spawns
      stageTransitioning.value = true
      // Boss defeat explosion
      if (boss) {
        const bossPos = boss.position.clone()
        for (let i = 0; i < 20; i++) {
          const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
          const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xffaa00 : 0xff4400 })
          const p = new THREE.Mesh(pGeo, pMat)
          p.position.copy(bossPos).add(new THREE.Vector3((Math.random()-0.5)*3, Math.random()*3, (Math.random()-0.5)*3))
          p.userData = { velocity: new THREE.Vector3((Math.random()-0.5)*0.3, Math.random()*0.2, (Math.random()-0.5)*0.3), life: 1.5 }
          scene.add(p)
          particles.push(p)
        }
        scene.remove(boss); boss = null
      }
      // Clean up boss projectiles
      bossProjectiles.forEach(fb => scene.remove(fb))
      bossProjectiles = []
      // Reset world + 3-2-1-GO countdown for next stage (keeps score)
      const nextStage = (currentStage.value + 1) % STAGES.length
      resetStage(true, nextStage) // preserveScore=true, target next stage
      createFloatingText(`STAGE ${nextStage + 1}: ${STAGES[nextStage].name}`, player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffffff')
      stageTransitioning.value = true // keep paused during countdown
      // 3-2-1-GO countdown then resume
      startStageCountdown()
    }
  }

  // === BOSS ANIMATION + ATTACK AI (T3-30 state machine) ===
  if (boss && bossActive.value && !bossDefeated.value) {
    const bossType = STAGES[currentStage.value].bossType
    bossStateTimer += realDelta
    
    // Animate Flying Spaghetti Meatball tentacles (vertical wiggle + disco)
    if (bossType === 'giantMeatball' && boss.userData.tentacles) {
      boss.userData.tentacles.forEach((tentacle, i) => {
        const t = Date.now() * 0.003
        const baseAngle = tentacle.userData.baseAngle
        tentacle.rotation.x = Math.sin(t + i * 0.5) * 0.4
        tentacle.rotation.z = baseAngle + Math.sin(t * 1.5 + i * 0.7) * 0.3
        const hue = (Date.now() * 0.0001 + i * 0.125) % 1
        tentacle.material.color.setHSL(hue, 1, 0.5)
        tentacle.material.emissive.setHSL(hue, 1, 0.3)
      })
    }
    
    // State machine: IDLE -> CHARGING -> VULNERABLE -> IDLE
    // Dragon (bossType !== 'truck') stays in IDLE forever - no charging or vulnerable states
    if (bossState === 'idle') {
      // IDLE: hover/sway, then CHARGE (truck only - dragon stays idle)
      if (bossType === 'truck' && bossStateTimer >= BOSS_IDLE_DURATION) {
        bossState = 'charging'
        bossStateTimer = 0
        bossCharging = true
        bossChargeTimer = 0
        playSFX('truck_rev', 0.4)
        if (boss) {
          boss.userData = boss.userData || {}
          boss.userData.chargeTargetX = player.position.x
          boss.userData.chargeStartX = boss.position.x
          boss.userData.chargeStartZ = boss.position.z
          boss.userData.chargeMissTriggered = false
        }
      } else {
        // Idle hover animation (both truck and dragon)
        const sway = Math.sin(Date.now() * 0.001) * 3
        boss.position.z = -54 + sway
        if (bossType === 'truck') {
          const swivelX = Math.sin(Date.now() * 0.003) * 1.5
          boss.position.x = swivelX + getCurveX(boss.position.z)
          boss.position.y = getSurfaceY(boss.position.z)
          boss.rotation.y = 0
        } else {
          // Dragon idle hover/sway in background
          boss.position.x = getCurveX(boss.position.z)
          boss.position.y = 5 + Math.sin(Date.now() * 0.002) * 1.5 + getSurfaceY(boss.position.z)
          boss.rotation.y = 0
          boss.children.forEach(child => {
            if (child.position.x < -1) {
              child.rotation.z = 0.3 + Math.sin(Date.now() * 0.005) * 0.3
            } else if (child.position.x > 1) {
              child.rotation.z = -0.3 - Math.sin(Date.now() * 0.005) * 0.3
            }
          })
          const tailSway = Math.sin(Date.now() * 0.003) * 0.3
          boss.children.forEach(child => {
            if (child.position.z < -1 && child.geometry?.type === 'SphereGeometry') {
              child.position.x = tailSway * (-child.position.z / 4)
            }
          })
        }
      }
    } else if (bossType === 'truck' && bossState === 'charging') {
      // CHARGE: move toward player Z, dodgeable (truck only)
      bossChargeTimer += realDelta
      // Difficulty scaling: faster charges at higher difficulty
      const difficultyMultiplier = 1 + (gameDuration / 60)
      const chargeSpeed = gameSpeed * BOSS_CHARGE_SPEED_MULTIPLIER * difficultyMultiplier
      boss.position.z += chargeSpeed
      const startZ = boss.userData.chargeStartZ || -54
      const startXX = boss.userData.chargeStartX || boss.position.x
      const targetX = boss.userData.chargeTargetX
      const totalDist = Math.abs(0 - startZ)
      const traveled = Math.abs(boss.position.z - startZ)
      const progress = Math.min(traveled / totalDist, 1)
      boss.position.x = startXX + (targetX - startXX) * progress
      boss.position.x = Math.max(-laneWidth * 1.5, Math.min(laneWidth * 1.5, boss.position.x))
      boss.position.y = getSurfaceY(boss.position.z)
      
      // Charge ends - transition to VULNERABLE (truck only - orbs removed, instant transition back to idle)
      if (boss.position.z > 5 || bossChargeTimer > 1.5 || bossStateTimer >= 1.5) {
        bossState = 'idle'
        bossStateTimer = 0
        bossCharging = false
        boss.userData.retreatPhase = false
        // V4: Truck boss - no orbs/projectiles, instant return to idle
        boss.position.z = -54
        createFloatingText('ARMORED!', boss.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff4444')
      }
    } else if (bossType === 'truck' && bossState === 'idle') {
      // V4: Truck boss - no vulnerable state, no orbs to collect
      // Damage boss via near-misses during charge only
    }
    // Attack timer — only attack during IDLE state
    if (bossState === 'idle') {
      bossAttackTimer += realDelta
      if (bossAttackTimer >= bossNextAttack) {
        bossAttackTimer = 0
        // giantMeatball attacks slower (3-5 sec), dragon/truck faster
        bossNextAttack = bossType === 'giantMeatball' ? 3 + Math.random() * 2 : 0.8 + Math.random() * 0.6
        spawnBossProjectile(bossType)
        cameraShakeTimer = 0.3; cameraShakeIntensity = 0.15
      }
    }
  }
  
  // === BOSS PROJECTILE MOVEMENT + COLLISION ===
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const fb = bossProjectiles[i]
    fb.position.z += fb.userData.speed
    fb.position.x += (fb.userData.targetX - fb.position.x) * 0.05
    fb.position.y += (fb.userData.targetY - fb.position.y) * 0.08 // converge to target height (doubled speed)
    fb.rotation.y += fb.userData.rotationSpeed || 0.1
    
    // Skip collision if game over, countdown, grace period, or stage transition
    if (gameOver.value || countdownLocked || stageTransitioning.value || Date.now() - gameStartTime < 2000) continue;
    // Collision with player - metal beams are instant death (like dragon fireballs)
    const dist = player.position.distanceTo(fb.position)
    if (dist < 1.5) {
      if (!isInvincible) {
        // Metal beam hit = instant death (Stage 3 boss is deadly)
        createFloatingText('HIT!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
        triggerGameOver(0.4)
      }
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
      continue
    }
    
    // Near-miss — player dodges close, damages boss
    if (!fb.userData.nearMissTriggered && dist < 2.5 && dist >= 1.5) {
      fb.userData.nearMissTriggered = true
      bossHealth.value -= 8
      createFloatingText('⚡', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#44ff44')
    }
    
    // Remove if past player
    if (fb.position.z > 10) {
      scene.remove(fb)
      bossProjectiles.splice(i, 1)
    }
  }
  
  // === GIANT MEATBALL DEBRIS MOVEMENT + COLLISION ===
  // Debris falls from top of screen (y=8) down to ground (y=0)
  for (let i = bossDebris.length - 1; i >= 0; i--) {
    const debris = bossDebris[i]
    // Fall downward
    debris.position.y -= debris.userData.speed
    // Rotate as it falls
    debris.rotation.x += debris.userData.rotationSpeed
    debris.rotation.z += debris.userData.rotationSpeed
    
    // Skip collision if game over, countdown, grace period, or stage transition
    if (gameOver.value || countdownLocked || stageTransitioning.value || Date.now() - gameStartTime < 2000) {
      if (debris.position.y < -1) {
        scene.remove(debris)
        bossDebris.splice(i, 1)
      }
      continue
    }
    
    // Collision with player - debris hits when it reaches player height
    const dist = player.position.distanceTo(debris.position)
    if (dist < 1.5 && debris.position.y < 2) {
      if (!isInvincible) {
        // Debris hit = damage (like truck)
        bossHealth.value = Math.min(100, bossHealth.value + 10)
        createFloatingText('HIT', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
        cameraShakeTimer = 0.5; cameraShakeIntensity = 0.25
        isInvincible = true
        invincibilityTimeout = setTimeout(() => { isInvincible = false; invincibilityTimeout = null }, 1500)
      }
      scene.remove(debris)
      bossDebris.splice(i, 1)
      continue
    }
    
    // Remove if hits ground or past player
    if (debris.position.y < 0 || debris.position.z > 10) {
      scene.remove(debris)
      bossDebris.splice(i, 1)
    }
  }
  
  // Boss collision: only during CHARGING state
  if (bossState === 'charging' && boss && !gameOver.value && !countdownLocked && Date.now() - gameStartTime >= 2000) {
    const dx = player.position.x - boss.position.x
    const dz = player.position.z - boss.position.z
    const inZRange = Math.abs(dz) < 3
    if (inZRange && Math.abs(dx) < 2.0 && !isInvincible && !godMode.value) {
      // Boss hit — instant kill
      createFloatingText('HIT!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ff4444')
      triggerGameOver(0.5)
    }
    // Near-miss dodge: close but escaped
    if (inZRange && !boss.userData?.chargeMissTriggered && Math.abs(dx) >= 2.0 && Math.abs(dx) < 4.0) {
      if (!boss.userData) boss.userData = {}
      boss.userData.chargeMissTriggered = true
      bossHealth.value -= 12
      createFloatingText('DODGE!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#44ff44')
    }
  }

  // Day/night cycle
  updateDayNightCycle(delta);
  
  // Progressive difficulty scaling
  // Speed increases every 30 seconds, caps at 3.5x base speed
  const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
  const targetBase = 0.25 * difficultyMultiplier * STAGES[currentStage.value].difficultyMultiplier;
  baseGameSpeed = THREE.MathUtils.lerp(baseGameSpeed, targetBase, Math.min(realDelta * 0.6, 0.01));
  gameSpeed = THREE.MathUtils.clamp(baseGameSpeed * speedMultiplier, SPEED_MIN, SPEED_MAX);
  
  
  // Spawn interval decreases over time (more obstacles)
  spawnInterval = Math.max(0.35, 1.2 - (gameDuration / 80)) / STAGES[currentStage.value].difficultyMultiplier;
  
  score.value += Math.floor(delta * 50 * difficultyMultiplier);

  // === BONUS PORTAL SPAWN (always available, even during boss) ===
  if (!bonusPortal && !inBonusZone && Math.random() < 0.001) {
    // 20% chance to spawn showroom portal (1 per ~45 seconds at 0.001 spawn rate)
    isShowroomPortal = Math.random() < 0.2;
    bonusPortalType = isShowroomPortal ? 'showroom' : 'bonus';
    spawnBonusPortal();
  }
  
  // Bonus portal animation & collection
  if (bonusPortal) {
    bonusPortal.mesh.position.z += gameSpeed;
    // Road curve: absolute position based on lane + curve offset
    bonusPortal.mesh.position.x = ((bonusPortal.lane - 1) * laneWidth) + getCurveX(bonusPortal.mesh.position.z)
    // Curved earth
    bonusPortal.mesh.position.y = (bonusPortal.mesh.baseY || 1.5) + getSurfaceY(bonusPortal.mesh.position.z);
    bonusPortal.mesh.rotation.x = getSurfaceTilt(bonusPortal.mesh.position.z);
    // Spin and pulse portal
    const ring = bonusPortal.mesh.getObjectByName('portal-ring');
    if (ring) ring.rotation.z += 0.05;
    const inner = bonusPortal.mesh.getObjectByName('portal-inner');
    if (inner) {
      inner.material.color.setHSL((clock.getElapsedTime() * 0.5) % 1, 1, 0.5);
    }
    // Sparkle animation
    for (let i = 0; i < 8; i++) {
      const spark = bonusPortal.mesh.getObjectByName('spark-' + i);
      if (spark) {
        const angle = (i / 8) * Math.PI * 2 + clock.getElapsedTime() * 2;
        spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
      }
    }
    // Collision check (only during active gameplay)
    if (!gameOver.value && !countdownLocked) {
      const dist = player.position.distanceTo(bonusPortal.mesh.position);
      if (dist < 2.0) {
        // Enter bonus zone!
        inBonusZone = true;
        bonusTimer = 5;
        inBonusZoneRef.value = true;
        bonusTimerRef.value = 5;
        // Check if this is a showroom portal (20% chance)
        if (bonusPortalType === 'showroom') {
          inShowroom = true;
          inShowroomRef.value = true;
          showroomTimer = 6;
          showroomTimerRef.value = 6;
          scoreMultiplier = 2.0;
          createFloatingText('SHOWROOM!', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ff69b4');
        }
        scene.remove(bonusPortal.mesh);
        bonusPortal = null;
        playSound('powerup');
      }
    }
    // Clean up portal if it passed the player
    if (bonusPortal && bonusPortal.mesh.position.z > 15) {
      scene.remove(bonusPortal.mesh);
      bonusPortal = null;
    }
  } // end if (bonusPortal)
  
  // Bonus zone timer
  if (inBonusZone) {
    // Hide buildings and trees, change road to rainbow
    if (!scene.userData.bonusEnvActive) {
      // Save all current game state
      savedSubstageState = {
        obstacles: obstacles.slice(),
        coins: coins.slice(),
        gameSpeed,
        spawnInterval,
        dayCycleTime,
        buildingVis: buildings.map(b => b.visible),
        treeVis: trees.map(t => t.visible),
      };
      // Remove obstacle and coin meshes from scene, clear arrays (but don't dispose — we restore them!)
      obstacles.forEach(obs => scene.remove(obs.mesh));
      coins.forEach(coin => scene.remove(coin.mesh));
      obstacles.length = 0;
      coins.length = 0;
      bonusNoSpawn = true;
      // Hide buildings and trees
      buildings.forEach(b => b.visible = false);
      trees.forEach(t => t.visible = false);
      // Rainbow road with left-to-right gradient
      const road = scene.getObjectByName('road');
      if (road) {
        originalRoadMaterial = road.material;
        road.material = new THREE.ShaderMaterial({
          transparent: true,
          uniforms: {
            uTime: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              // Left side = different hue from right, cycling over time
              float hue = fract(vUv.x * 1.5 + uTime * 0.15 + vUv.y * 0.3);
              // RGB from HSL (simplified rainbow) — mild and pastel
              float h = hue * 6.0;
              float c = 0.75; // moderately saturated
              float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
              vec3 col;
              if (h < 1.0) col = vec3(c, x, 0.0);
              else if (h < 2.0) col = vec3(x, c, 0.0);
              else if (h < 3.0) col = vec3(0.0, c, x);
              else if (h < 4.0) col = vec3(0.0, x, c);
              else if (h < 5.0) col = vec3(x, 0.0, c);
              else col = vec3(c, 0.0, x);
              // Mix with light base for soft but colorful look
              col = mix(col, vec3(0.95, 0.95, 1.0), 0.25);
              gl_FragColor = vec4(col, 0.9);
            }
          `,
        });
      }
      // Set fixed bonus speed
      savedSubstageState.savedGameSpeed = gameSpeed;
      gameSpeed = 0.3;
      // Spawn bonus coins at ground level
      bonusCoins = [];
      for (let i = 0; i < 40; i++) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const z = -i * 2.5 - 5;
        const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const coinMat = new THREE.MeshToonMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.3 });
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.set(lane * laneWidth, 0.5, z);
        coinMesh.rotation.x = Math.PI / 2;
        scene.add(coinMesh);
        bonusCoins.push({ mesh: coinMesh, collected: false, baseX: lane * laneWidth });
      }
      scene.userData.bonusEnvActive = true;
      
      // Nyan Cat flies across the sky! (meme-accurate PNG sprite)
      const nyanTex = textureLoader.load('assets/nyan_cat.png');
      const nyanSpriteMat = new THREE.SpriteMaterial({
        map: nyanTex,
        transparent: true,
        depthWrite: false
      });
      const nyanCat = new THREE.Sprite(nyanSpriteMat);
      nyanCat.scale.set(5, 5.5, 1); // scale to match real nyan cat proportions
      nyanCat.position.set(-30, 10, -20); // start off-screen LEFT, fly RIGHT
      scene.add(nyanCat);
      scene.userData.nyanCat = nyanCat;
      scene.userData.nyanCatTime = 0;
    }
    // Nyan Cat animation
    if (scene.userData.nyanCat) {
      scene.userData.nyanCatTime += delta * 8; // speed across sky
      const nyanX = -30 + scene.userData.nyanCatTime; // fly RIGHT
      scene.userData.nyanCat.position.x = nyanX;
      scene.userData.nyanCat.position.y = 10 + Math.sin(scene.userData.nyanCatTime * 2) * 0.5; // gentle bob
      // Loop: when off-screen right, restart from left
      if (nyanX > 30) {
        scene.userData.nyanCatTime = 0;
        scene.userData.nyanCat.position.x = -30;
      }
    }
    // Rainbow road animation
    const road = scene.getObjectByName('road');
    if (road && road.material && road.material.uniforms) {
      road.material.uniforms.uTime.value = clock.getElapsedTime();
    }
    bonusTimer -= delta;
    bonusTimerRef.value = Math.ceil(bonusTimer);
    // Showroom timer and score multiplier
    if (inShowroom) {
      showroomTimer -= delta;
      showroomTimerRef.value = Math.ceil(showroomTimer);
      if (showroomTimer <= 0) {
        inShowroom = false;
        inShowroomRef.value = false;
        scoreMultiplier = 1.0;
      }
    }
    if (bonusTimer <= 0) {
      inBonusZone = false;
      inBonusZoneRef.value = false;
      bonusTimerRef.value = 0;
      // Clear bonus coins
      bonusCoins.forEach(bc => scene.remove(bc.mesh));
      bonusCoins = [];
      // Remove Nyan Cat
      if (scene.userData.nyanCat) {
        scene.remove(scene.userData.nyanCat);
        scene.userData.nyanCat = null;
        scene.userData.nyanCatTime = 0;
      }
      // Restore all saved state
      if (savedSubstageState) {
        // Restore obstacles
        obstacles.length = 0;
        savedSubstageState.obstacles.forEach(obs => { scene.add(obs.mesh); obstacles.push(obs); });
        // Restore coins
        coins.length = 0;
        savedSubstageState.coins.forEach(coin => { scene.add(coin.mesh); coins.push(coin); });
        // Restore speed and timing
        gameSpeed = savedSubstageState.savedGameSpeed || savedSubstageState.gameSpeed;
        spawnInterval = savedSubstageState.spawnInterval;
        dayCycleTime = savedSubstageState.dayCycleTime;
        // Restore buildings/trees visibility
        buildings.forEach((b, i) => { if (savedSubstageState.buildingVis[i] !== undefined) b.visible = savedSubstageState.buildingVis[i]; });
        trees.forEach((t, i) => { if (savedSubstageState.treeVis[i] !== undefined) t.visible = savedSubstageState.treeVis[i]; });
        savedSubstageState = null;
      }
      bonusNoSpawn = false;
      // Restore road
      const road = scene.getObjectByName('road');
      if (road && originalRoadMaterial) {
        road.material.dispose();
        road.material = originalRoadMaterial;
        originalRoadMaterial = null;
      }
      scene.userData.bonusEnvActive = false;
      // Particle burst ejection
      createParticleEffect(player.position, 0xff00ff, 30);
      createParticleEffect(player.position, 0x00ffff, 30);
      playSound('achievement');
    }
  }
  
  // === ENVIRONMENTAL EVENTS ===
  eventTimer += delta;
  if (eventTimer > 30 + Math.random() * 15 && !activeEvent) {
    triggerRandomEvent();
    eventTimer = 0;
  }
  updateEvent(delta);
  
  // Clear event alert text after a delay
  if (eventAlertTextRef.value && !activeEvent) {
    if (!scene.userData.eventAlertTimer) scene.userData.eventAlertTimer = 0;
    scene.userData.eventAlertTimer += delta;
    if (scene.userData.eventAlertTimer > 1.5) {
      eventAlertTextRef.value = '';
      scene.userData.eventAlertTimer = 0;
    }
  } else {
    scene.userData.eventAlertTimer = 0;
  }

  // Grace period: don't spawn obstacles for the first 1.5 seconds (but still move existing ones)
  const spawnGraceActive = gameDuration < 1.5;
  const timeSinceLastSpawn = time - lastSpawnTime;
  const willSpawn = !spawnGraceActive && timeSinceLastSpawn > spawnInterval && !bonusNoSpawn && !bossActive.value && !stageTransitioning.value;
  if (!willSpawn && !countdownLocked) {
    if (!window._spawnLogTimer || Date.now() - window._spawnLogTimer > 1000) {
      console.log('[SPAWN-DEBUG] willSpawn=false, checking why...');
      console.log('  - spawnGraceActive:', spawnGraceActive, '(gameDuration=', gameDuration, ')');
      console.log('  - timeSinceLastSpawn:', timeSinceLastSpawn.toFixed(3), '(time=', time.toFixed(3), '- lastSpawnTime=', lastSpawnTime.toFixed(3), ')');
      console.log('  - spawnInterval:', spawnInterval);
      console.log('  - bonusNoSpawn:', bonusNoSpawn);
      console.log('  - bossActive:', bossActive.value);
      console.log('  - stageTransitioning:', stageTransitioning.value);
      console.log('  - countdownLocked:', countdownLocked);
      console.log('  - clock.running:', clock.running);
      window._spawnLogTimer = Date.now();
    }
  }
  // Expose for debugging
  window.__spawnDebug = () => ({
    spawnGraceActive,
    timeSinceLastSpawn: time - lastSpawnTime,
    spawnInterval,
    bonusNoSpawn,
    bossActive: bossActive.value,
    stageTransitioning: stageTransitioning.value,
    gameDuration,
    lastSpawnTime,
    time,
    obstaclesLen: obstacles.length,
    countdownLocked,
    gameSpeed,
    willSpawn,
    clockRunning: clock.running,
    clockElapsedTime: clock.getElapsedTime()
  });

  // Add this ONCE, right after __spawnDebug definition
  if (!window._spawnStateInterval) {
    window._spawnStateInterval = setInterval(() => {
      const debug = window.__spawnDebug();
      console.log('[SPAWN-STATE] willSpawn:', debug.willSpawn, 'gameDuration:', debug.gameDuration.toFixed(2), 'timeSinceLastSpawn:', debug.timeSinceLastSpawn.toFixed(3), 'spawnInterval:', debug.spawnInterval.toFixed(2));
    }, 1000);
  }

  if (willSpawn) {
    if (Math.random() < 0.7) {
      if (Math.random() < 0.3) {
        spawnFloatingObstacle();
      } else {
        spawnObstacle();
      }
    }
    if (Math.random() < 0.5 + (gameDuration / 120)) spawnCoin();
    if (Math.random() < 0.05) spawnPowerup();
    console.log('[SPAWN-TRIGGERED] obstacles:', obstacles.length);
    lastSpawnTime = time;
  }

  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += gameSpeed;
    // Road curvature: shift obstacles laterally based on depth
    const baseX = obs.mesh.userData.baseX !== undefined ? obs.mesh.userData.baseX : ((obs.lane - 1) * laneWidth)
    const laneX = baseX + getCurveX(obs.mesh.position.z)
    // For police/UFO: add accumulated drift offset
    const driftOffset = obs.mesh.userData.driftX || 0
    obs.mesh.position.x = laneX + driftOffset
    obs.mesh.position.y = (obs.mesh.baseY || 0) + getSurfaceY(obs.mesh.position.z);
    obs.mesh.rotation.x = getSurfaceTilt(obs.mesh.position.z);
    // Spin UFOs, ground obstacles gentle spin
    obs.mesh.rotation.y += obs.type === 'floating' ? 0.08 : (obs.obstacleType === 'fruit' ? 0.05 : 0);
    
    // UFO: sin wave + lateral sweep across road
    if (obs.type === 'floating') {
      obs.mesh.position.y = 2.2 + Math.sin(time * 3 + obs.mesh.position.z * 0.1) * 0.5 + getSurfaceY(obs.mesh.position.z);
      // Lateral sweep — random fixed distance movement
      if (!obs.mesh.userData.ufoSwayDir) {
        obs.mesh.userData.ufoSwayDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.ufoSwaySpeed = 0.04 + Math.random() * 0.02;
        obs.mesh.userData.ufoSwayDist = 0;
        obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
        obs.mesh.userData.driftX = 0;
      }
      obs.mesh.userData.driftX += obs.mesh.userData.ufoSwayDir * obs.mesh.userData.ufoSwaySpeed;
      obs.mesh.userData.ufoSwayDist += obs.mesh.userData.ufoSwaySpeed;
      if (obs.mesh.userData.ufoSwayDist >= obs.mesh.userData.ufoSwayMaxDist) {
        obs.mesh.userData.ufoSwayDir *= -1;
        obs.mesh.userData.ufoSwayDist = 0;
        obs.mesh.userData.ufoSwayMaxDist = 1.5 + Math.random() * 2;
      }
      // Keep within road boundaries
      const maxDriftUFO = laneWidth * 1.5;
      if (obs.mesh.userData.driftX < -maxDriftUFO) obs.mesh.userData.ufoSwayDir = 1;
      else if (obs.mesh.userData.driftX > maxDriftUFO) obs.mesh.userData.ufoSwayDir = -1;
    }
    
    // Barrel: roll across street like a log on its side
    if (obs.obstacleType === 'barrel' && obs.mesh.userData.driftDir) {
      obs.mesh.userData.driftX = (obs.mesh.userData.driftX || 0) + obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed;
      const maxDriftBarrel = laneWidth * 1.2;
      if (obs.mesh.userData.driftX < -maxDriftBarrel || obs.mesh.userData.driftX > maxDriftBarrel) {
        obs.mesh.userData.driftDir *= -1;
      }
      // Roll the inner barrel group around its local Z axis (perpendicular to barrel length)
      // This makes the cylinder spin like a rolling log
      const barrelInner = obs.mesh.userData.barrelGroup || obs.mesh.children[0]
      if (barrelInner) {
        barrelInner.rotation.z += obs.mesh.userData.driftDir * obs.mesh.userData.driftSpeed * 8
      }
    }
    // Red car / bus / fireengine: move forward or backward at noticeable speed (slower than player)
    if (obs.obstacleType === 'car' || obs.obstacleType === 'bus' || obs.obstacleType === 'fireengine') {
      if (!obs.mesh.userData.lungeTimer) {
        obs.mesh.userData.lungeTimer = Math.random() * 3;
        obs.mesh.userData.lungeDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.lungeSpeed = 0.02 + Math.random() * 0.03; // noticeable but slower than player
      }
      obs.mesh.userData.lungeTimer -= delta;
      if (obs.mesh.userData.lungeTimer <= 0) {
        obs.mesh.userData.lungeDir *= -1;
        obs.mesh.userData.lungeTimer = 1.5 + Math.random() * 2;
      }
      obs.mesh.position.z += obs.mesh.userData.lungeDir * obs.mesh.userData.lungeSpeed;
    }
    
    // Police car: 90° across the road, slides left or right across lanes
    if (obs.obstacleType === 'police') {
      if (!obs.mesh.userData.policeDir) {
        obs.mesh.userData.policeDir = Math.random() > 0.5 ? 1 : -1;
        obs.mesh.userData.policeSpeed = 0.05 * difficultyMultiplier;
        obs.mesh.userData.driftX = 0;
      }
      obs.mesh.userData.driftX += obs.mesh.userData.policeDir * obs.mesh.userData.policeSpeed * delta * 60;
      // Bounce between road edges — full road width
      const maxDrift = laneWidth * 2; // can cross all 3 lanes
      if (obs.mesh.userData.driftX < -maxDrift) {
        obs.mesh.userData.policeDir = 1;
      } else if (obs.mesh.userData.driftX > maxDrift) {
        obs.mesh.userData.policeDir = -1;
      }
    }
    
    // Police siren flash
    if (obs.obstacleType === 'police') {
      const sirenR = obs.mesh.getObjectByName('siren-red');
      const sirenB = obs.mesh.getObjectByName('siren-blue');
      if (sirenR && sirenB) {
        const flash = Math.sin(time * 15) > 0;
        sirenR.material.color.setHex(flash ? 0xff0000 : 0x440000);
        sirenB.material.color.setHex(flash ? 0x000044 : 0x0000ff);
      }
    }
    
    // Stage 3 obstacle animations - T3-50: simple texture loading (no animation yet)
    // Animation logic to be implemented later

    // Skip collision if game over, countdown, grace period, or stage transition
    if (gameOver.value || countdownLocked || stageTransitioning.value || Date.now() - gameStartTime < 2000) return;
    // Horizontal + Z distance (ignore Y for collision range check)
    const dx = player.position.x - obs.mesh.position.x;
    const dz = player.position.z - obs.mesh.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const collisionDist = obs.hitWidth || 1.5;
    const isFloating = obs.type === 'floating';
    
    // Near-miss detection — rare & rewarding (only once per obstacle, tighter band)
    if (!obs.nearMissTriggered && horizDist < collisionDist + 0.4 && horizDist >= collisionDist && Math.abs(dz) < 1.0) {
      obs.nearMissTriggered = true;
      nearMissCount++;
      score.value += 25; // bonus points for close call
      nearMissTextRef.value = 'CLOSE CALL! +25 \u{1F525}';
      nearMissTimer = 1.0;
      nearMissCountRef.value = nearMissCount;
    }
    
    // Hard grace period: no collisions for 2s after game start
    if (Date.now() - gameStartTime < 2000) return;

    // Ground obstacles: hit if player is on ground level and not flying
    const hitGroundObs = !isFloating && player.position.y < 1.0 && !isFlying;
    // Floating/UFO: hit if player is NOT sliding (must slide under)
    const hitFloatingObs = isFloating && !isSliding;
    // Flying characters still avoid ground obstacles
    if (horizDist < collisionDist && (hitGroundObs || hitFloatingObs)) {
      // Slippery floor - apply effect instead of game over
      if (obs.obstacleType === 'slippery' && !isSlippery) {
        isSlippery = true;
        slipperyTimer = 1.5; // 1.5 seconds of slippery effect
        slideVelocity = gameSpeed * 1.3; // slide faster than normal
        createFloatingText('SLIPPERY!', player.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ffff00');
        playSound('slip');
        // Remove the slippery obstacle after hit
        obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
        scene.remove(obs.mesh);
        obstacles.splice(index, 1);
        return; // skip game over (inside forEach, use return instead of continue)
      }
      
      if (isInvincible || godMode.value) {
        // Shield blocks the hit (or god mode)
        if (godMode.value) {
          // God mode: just remove obstacle, no sound effect
          obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
          scene.remove(obs.mesh);
          obstacles.splice(index, 1);
          return;
        }
        playSound('shield_hit');
        createParticleEffect(obs.mesh.position, 0x00bfff, 15);
        deactivatePowerup();
        obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
        scene.remove(obs.mesh);
        obstacles.splice(index, 1);
      } else {
        // Stage 3 obstacles: use common crash sound (keep crash_metal only for beam impacts)
        if (currentStage.value === 2 && obs.obstacleType === 'metalBeam') {
          playSound('crash_metal');
        } else {
          playSound('crash');
        }
        triggerGameOver(0.5)
      }
    }

    if (obs.mesh.position.z > 15) {
      obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); });
      scene.remove(obs.mesh);
      obstacles.splice(index, 1);
    }
  });

  coins.forEach((coin, index) => {
    if (coin.collected) return;
    
    const dist = player.position.distanceTo(coin.mesh.position);
    
    // Magnet effect - strong pull to player position
    if (magnetRange > 0 && activePowerup === 'magnet' && dist < magnetRange) {
      // Check if there's an obstacle blocking the path (obstacle must be between coin and player)
      const hasObstacle = obstacles.some(obs => {
        // Obstacle must be roughly in the same lane and between coin and player
        const inSameLane = Math.abs(obs.mesh.position.x - coin.mesh.position.x) < 2;
        const betweenCoinAndPlayer = (
          (obs.mesh.position.z > coin.mesh.position.z && obs.mesh.position.z < player.position.z) ||
          (obs.mesh.position.z < coin.mesh.position.z && obs.mesh.position.z > player.position.z)
        );
        const closeToLine = obs.mesh.position.distanceTo(
          new THREE.Vector3(coin.mesh.position.x, 0, coin.mesh.position.z).lerp(
            new THREE.Vector3(player.position.x, 0, player.position.z),
            0.5
          )
        ) < 1.5;
        return inSameLane && betweenCoinAndPlayer && closeToLine;
      });
      
      if (!hasObstacle) {
        // Strong magnet - coins fly directly to player (not just lerp, but override movement)
        const direction = new THREE.Vector3().subVectors(player.position, coin.mesh.position).normalize();
        const pullSpeed = 0.8; // Much faster than gameSpeed
        coin.mesh.position.add(direction.multiplyScalar(pullSpeed));
        coin.mesh.rotation.y += 0.2;
      } else {
        // Blocked by obstacle - continue normal movement
        coin.mesh.position.z += gameSpeed;
        coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
        coin.mesh.rotation.y += 0.1;
      }
    } else {
      // No magnet - normal movement
      coin.mesh.position.z += gameSpeed;
      coin.mesh.position.x = ((coin.lane - 1) * laneWidth) + getCurveX(coin.mesh.position.z);
      coin.mesh.rotation.y += 0.1;
    }
    
    coin.mesh.position.y = (coin.mesh.baseY || 0.5) + getSurfaceY(coin.mesh.position.z);
    coin.mesh.rotation.x = getSurfaceTilt(coin.mesh.position.z);
    
    if (dist < 1.2) {
      coin.collected = true;
      comboCount++;
      if (comboCount > gameStats.maxCombo) gameStats.maxCombo = comboCount;
      const now = Date.now();
      const comboBonus = comboCount > 1 && (now - lastCoinTime) < 1000 ? comboCount * 10 : 0;
      score.value += (100 + comboBonus) * scoreMultiplier;
      lastCoinTime = now;
      gameStats.totalCoins++;
      
      if (magnetRange > 0) gameStats.magnetCoins++;
      
      createParticleEffect(coin.mesh.position, 0xffd700, 15);
      createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), coin.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      playSound('coin', 0.9 + Math.random() * 0.2);
      
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    } else if (coin.mesh.position.z > 15) {
      scene.remove(coin.mesh);
      coins.splice(index, 1);
    }
  });

  // Bonus coins movement and collection
  bonusCoins.forEach((bc, index) => {
    if (bc.collected) return;
    bc.mesh.position.z += gameSpeed;
    bc.mesh.position.x = (bc.baseX || 0) + getCurveX(bc.mesh.position.z);
    bc.mesh.rotation.y += 0.1;
    bc.mesh.position.y = 0.5 + getSurfaceY(bc.mesh.position.z);
    bc.mesh.rotation.x = getSurfaceTilt(bc.mesh.position.z);
    const dist = player.position.distanceTo(bc.mesh.position);
    if (dist < 1.2) {
      bc.collected = true;
      comboCount++;
      if (comboCount > gameStats.maxCombo) gameStats.maxCombo = comboCount;
      const now = Date.now();
      const comboBonus = comboCount > 1 && (now - lastCoinTime) < 1000 ? comboCount * 10 : 0;
      score.value += (100 + comboBonus) * scoreMultiplier;
      lastCoinTime = now;
      gameStats.totalCoins++;
      createParticleEffect(bc.mesh.position, 0xffd700, 15);
      createFloatingText('+' + Math.floor((100 + comboBonus) * scoreMultiplier), bc.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      playSound('coin', 0.9 + Math.random() * 0.2);
      scene.remove(bc.mesh);
      bonusCoins.splice(index, 1);
    } else if (bc.mesh.position.z > 15) {
      scene.remove(bc.mesh);
      bonusCoins.splice(index, 1);
    }
  });

  powerups.forEach((pw, index) => {
    if (pw.collected) return;
    
    pw.mesh.position.z += gameSpeed;
    pw.mesh.position.x = ((pw.lane - 1) * laneWidth) + getCurveX(pw.mesh.position.z);
    pw.mesh.rotation.y += 0.15;
    // Curved earth
    pw.mesh.position.y = (pw.mesh.baseY || 1) + getSurfaceY(pw.mesh.position.z);
    pw.mesh.rotation.x = getSurfaceTilt(pw.mesh.position.z);
    
    // Animate rings
    if (pw.type === 'shield') {
      pw.mesh.children[1].rotation.z += 0.05;
    } else if (pw.type === 'magnet') {
      // Spin the horseshoe magnet
      const magnetGroup = pw.mesh.children.find(c => c.isGroup);
      if (magnetGroup) {
        magnetGroup.rotation.y += 0.05;
      }
    }

    const dist = player.position.distanceTo(pw.mesh.position);
    if (dist < 1.2) {
      pw.collected = true;
      gameStats.powerupsCollected++;
      activatePowerup(pw.type);
      // Stage 3: IKEA powerups sound like assembly
      if (currentStage.value === 2) {
        playSound('assembly');
      } else {
        playSound('powerup', 0.9 + Math.random() * 0.2);
      }
      createParticleEffect(pw.mesh.position, pw.type === 'shield' ? 0x00bfff : (pw.type === 'coldDrink' ? 0xff4444 : 0x9932cc), 20);
      createFloatingText(pw.type === 'shield' ? '🛡️ SHIELD' : (pw.type === 'coldDrink' ? '🥤 SLOW' : '🧲 MAGNET'), pw.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
      
      scene.remove(pw.mesh);
      powerups.splice(index, 1);
    } else if (pw.mesh.position.z > 15) {
      scene.remove(pw.mesh);
      powerups.splice(index, 1);
    }
  });

  // Animate clouds drifting + sky-aware coloring
  const cycleProgress = dayCycleTime / DAY_DURATION;
  clouds.forEach((cloud, i) => {
    cloud.position.z += 0.02;
    if (cloud.position.z > 10) {
      cloud.position.z = -60 - Math.random() * 20;
      cloud.position.x = (Math.random() - 0.5) * 40;
    }
    // Tint clouds based on day/night cycle
    const whiteColor = cloudWhiteColor;
    const nightColor = cloudNightColor;
    const sunsetColor = cloudSunsetColor;
    let targetColor;
    if (cycleProgress > 0.35 && cycleProgress < 0.65) {
      // Night: darker clouds
      const nightT = Math.min((cycleProgress - 0.35) / 0.15, (0.65 - cycleProgress) / 0.15, 1);
      targetColor = whiteColor.clone().lerp(nightColor, nightT);
    } else if ((cycleProgress > 0.2 && cycleProgress < 0.35) || (cycleProgress > 0.85 && cycleProgress < 0.95)) {
      // Sunset/sunrise: pinkish
      const sunsetT = cycleProgress < 0.5
        ? Math.min((cycleProgress - 0.2) / 0.1, (0.35 - cycleProgress) / 0.1, 1)
        : Math.min((cycleProgress - 0.85) / 0.1, (0.95 - cycleProgress) / 0.1, 1);
      targetColor = whiteColor.clone().lerp(sunsetColor, sunsetT);
    } else {
      targetColor = whiteColor;
    }
    // Apply color to main cloud puffs (children)
    cloud.children.forEach(child => {
      if (child.isMesh && child.material && child.material.color && child.material.opacity > 0.6) {
        // Only tint the main cloud material (not shadows with lower opacity)
        child.material.color.lerp(targetColor, 0.05);
      }
    });
  });
  
  // === DUST TRAIL PARTICLES behind player ===
  if (!isJumping && Math.random() < 0.3) {
    const dustGeo = new THREE.SphereGeometry(0.06, 4, 4);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0xccaa88, transparent: true, opacity: 0.6 });
    const dust = new THREE.Mesh(dustGeo, dustMat);
    dust.position.set(
      player.position.x + (Math.random() - 0.5) * 0.5,
      0.1 + Math.random() * 0.2,
      player.position.z + 0.5 + Math.random() * 0.3
    );
    dust.userData = { life: 0.6, velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, 0.02, 0.05) };
    scene.add(dust);
    particles.push(dust);
  }
  
  // === SPEED LINES at high speed ===
  if (difficultyMultiplier > 1.3 && Math.random() < 0.2) {
    const lineGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const speedLine = new THREE.Mesh(lineGeo, lineMat);
    speedLine.position.set(
      (Math.random() - 0.5) * 8,
      0.5 + Math.random() * 3,
      player.position.z - 5 - Math.random() * 10
    );
    speedLine.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    speedLine.userData = { life: 0.4, velocity: new THREE.Vector3(0, 0, 0.3) };
    scene.add(speedLine);
    particles.push(speedLine);
  }
  
  // Animate trees moving
  trees.forEach((tree) => {
    tree.position.z += gameSpeed;
    // Road curve: absolute position from baseX + curve offset
    const treeCurveOffset = getCurveX(tree.position.z);
    tree.position.x = (tree.baseX || 0) + treeCurveOffset;
    tree.position.y = (tree.baseY || 0) + getSurfaceY(tree.position.z);
    if (tree.position.z > 10) {
      // Determine side from baseX (not position.x which has curve offset)
      const side = (tree.baseX || 0) > 0 ? 1 : -1;
    tree.position.z = -Math.random() * 80;
    // Stage 3: spawn skyscrapers closer to road (6-12) to avoid building overlap (buildings at 15-25)
    tree.baseX = currentStage.value === 2 ? side * (6 + Math.random() * 6) : side * (8 + Math.random() * 10);
    tree.position.x = tree.baseX + getCurveX(tree.position.z);
    tree.position.y = (tree.baseY || 0) + getSurfaceY(tree.position.z);
    }
  });
  
  // Animate medieval flowers scrolling (Stage 2 only)
  if (currentStage.value === 1) {
    medievalFlowers.forEach((flower, idx) => {
      flower.position.z += gameSpeed;
      flower.position.x = flower.userData.baseX + getCurveX(flower.position.z);
      if (flower.position.z > 10) {
        flower.position.z = -Math.random() * 80;
        flower.userData.baseX = (flower.userData.baseX > 0 ? 1 : -1) * (4 + Math.random() * 2);
        flower.position.x = flower.userData.baseX + getCurveX(flower.position.z);
      }
    });
  }
  
  // Animate buildings moving
  buildings.forEach((building) => {
    building.position.z += gameSpeed;
    // Road curve: absolute position from baseX + curve offset
    const bldgCurveOffset = getCurveX(building.position.z);
    building.position.x = (building.baseX || 0) + bldgCurveOffset;
    building.position.y = (building.baseY || 0) + getSurfaceY(building.position.z);
    building.rotation.x = getSurfaceTilt(building.position.z);
    if (building.position.z > 20) {
      // Determine side from baseX (not position.x which has curve offset)
      const side = (building.baseX || 0) > 0 ? 1 : -1;
      building.position.z = -20 - Math.random() * 60;
      building.baseX = side * (15 + Math.random() * 10);
      building.position.x = building.baseX + getCurveX(building.position.z);
      building.position.y = (building.baseY || 0) + getSurfaceY(building.position.z);
    }
  });
  
  // Animate floating texts
  floatingTexts.forEach((text, index) => {
    text.position.add(text.userData.velocity);
    text.userData.velocity.y -= 0.02;
    text.userData.life -= 0.02;
    text.material.opacity = text.userData.life / 2.0;
    text.scale.setScalar(text.userData.life);
    
    if (text.userData.life <= 0) {
      scene.remove(text);
      floatingTexts.splice(index, 1);
    }
  });

  // Animate particles (dust, speed lines, effects)
  particles.forEach((particle, index) => {
    if (particle.velocity) {
      particle.position.add(particle.velocity);
      particle.velocity.y -= 0.005;
    }
    if (particle.life !== undefined) {
      particle.life -= 0.02;
      if (particle.material) particle.material.opacity = Math.max(0, particle.life);
      particle.scale.setScalar(Math.max(0.01, particle.life));
    } else {
      particle.life = (particle.life || 1) - 0.02;
      particle.scale.setScalar(Math.max(0.01, particle.life));
    }
    
    if (particle.life <= 0) {
      scene.remove(particle);
      particles.splice(index, 1);
    }
  });

  // Voice/fly - mic input
  const micVolume = getMicVolume();
  if (showDebugOverlay.value) {
    lastMicVolume.value = micVolume;
    if (audioCtx) audioCtxState.value = audioCtx.state;
  }
  if (micEnabledRef.value && micVolume > MIC_PEAK_THRESHOLD && !isJumping && !isFlying && !isSliding && !gameOver.value) {
    // Volume spike → start flying
    isFlying = true;
    flyVelocity = 0.15;
  }
  
  if (isFlying) {
    if (micEnabledRef.value && micVolume > MIC_THRESHOLD) {
      // Still blowing → keep flying (apply lift)
      flyVelocity += FLY_LIFT;
      if (flyVelocity > 0.15) flyVelocity = 0.15; // Cap upward speed
    } else {
      // Volume dropped → fall
      flyVelocity -= FLY_GRAVITY;
    }
    
    player.position.y += flyVelocity;
    
    // Cap max height
    if (player.position.y > FLY_MAX_HEIGHT) {
      player.position.y = FLY_MAX_HEIGHT;
      flyVelocity = 0;
    }
    
    // Landed
    if (player.position.y <= 0.5) {
      player.position.y = 0.5;
      isFlying = false;
      flyVelocity = 0;
    }
  } else if (isJumping) {
    player.position.y += jumpVelocity;
    jumpVelocity -= gravity;
    if (player.position.y <= 0.5) {
      player.position.y = 0.5;
      isJumping = false;
      jumpVelocity = 0;
    }
  }
  
  // Slide timer
  if (isSliding) {
    slideTimer -= delta;
    if (slideTimer <= 0) {
      isSliding = false;
      slideTimer = 0;
    }
  }
  
  // === SCROLL ROAD TEXTURE ===
  if (groundTexture) {
    groundTexture.offset.y -= gameSpeed * 0.15;
    if (grassTileTex) grassTileTex.offset.y += gameSpeed * 0.15;
  }
  // Scroll cobblestone texture with ground when active
  // (removed duplicate - handled above in Stage 2 block)
  // Stage 3: scroll concrete road and pavement textures (same direction as road)
  if (stage3Textures.road) {
    stage3Textures.road.offset.y -= gameSpeed * 0.15;
  }
  if (stage3Textures.pavement) {
    stage3Textures.pavement.offset.y -= gameSpeed * 0.15;
  }
  // Stage 3: also scroll grassMesh texture (pavement) to match road direction
  // grassTileTex is for Stage 1 grass and scrolls opposite; Stage 3 pavement on grassMesh must match road
  if (currentStage.value === 2 && grassMesh && grassMesh.material.map === stage3Textures.pavement) {
    // Pavement texture on grassMesh scrolls with road (negative direction)
    if (grassMesh.material.map) {
      grassMesh.material.map.offset.y -= gameSpeed * 0.15;
    }
  }
  
  // === CHARACTER ANIMATION ===
  const leftArm = player.getObjectByName('left-arm');
  const rightArm = player.getObjectByName('right-arm');
  const leftLeg = player.getObjectByName('left-leg');
  const rightLeg = player.getObjectByName('right-leg');
  const headGroup = player.getObjectByName('head-group');
  const leftPupil = player.getObjectByName('left-pupil');
  const rightPupil = player.getObjectByName('right-pupil');
  
  const playerLaneOffset = getCurveX(player.position.z) // follow road curve at player Z
  const targetX = (currentLane - 1) * laneWidth + playerLaneOffset;
  const moveDir = targetX - player.position.x;
  
  // Running animation - arms and legs swing
  if (isSliding) {
    // Slide pose - character ducks low
    if (leftArm) leftArm.rotation.x = 0.8;
    if (rightArm) rightArm.rotation.x = 0.8;
    if (leftLeg) leftLeg.rotation.x = -1.0;
    if (rightLeg) rightLeg.rotation.x = -1.0;
    player.position.y = 0.3;
    player.scale.y = 0.5;
  } else if (isFlying) {
    // Fly pose - arms spread out like wings
    if (leftArm) leftArm.rotation.z = -1.5;
    if (rightArm) rightArm.rotation.z = 1.5;
    if (leftLeg) leftLeg.rotation.x = 0.3;
    if (rightLeg) rightLeg.rotation.x = 0.3;
    player.scale.y = 1.0;
  } else if (!isJumping) {
    const runSpeed = 8 + gameSpeed * 10;
    const swing = Math.sin(time * runSpeed) * 0.6;
    
    if (leftArm) leftArm.rotation.x = swing;
    if (rightArm) rightArm.rotation.x = -swing;
    if (leftLeg) leftLeg.rotation.x = -swing * 0.8;
    if (rightLeg) rightLeg.rotation.x = swing * 0.8;
    
    player.position.y = 0.5 + Math.abs(Math.sin(time * runSpeed)) * 0.05;
    player.scale.y = 1.0;
  } else {
    if (leftArm) leftArm.rotation.x = -1.2;
    if (rightArm) rightArm.rotation.x = -1.2;
    if (leftLeg) leftLeg.rotation.x = 0.5;
    if (rightLeg) rightLeg.rotation.x = 0.5;
    player.scale.y = 1.0;
  }
  
  // Head faces movement direction
  if (headGroup) {
    const targetHeadRotY = THREE.MathUtils.clamp(moveDir * -0.5, -0.6, 0.6);
    headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadRotY, 0.1);
  }
  
  // Slippery floor effect
  if (isSlippery) {
    slipperyTimer -= delta;
    // Slide forward uncontrollably (faster than normal game speed)
    player.position.z += slideVelocity;
    if (slipperyTimer <= 0) {
      isSlippery = false;
      slideVelocity = 0;
    }
  }
  
  // Smooth lane movement
  player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.15);
  
  // Body lean on turn
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, moveDir * -0.08, 0.1);
  player.rotation.x = 0;
  
  // Body faces forward (base rotation = PI) with slight turn into movement
  const bodyTurn = THREE.MathUtils.clamp(moveDir * 0.15, -0.3, 0.3);
  player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, Math.PI + bodyTurn, 0.08);

  // Power-up timer
  if (activePowerup) {
    powerupTimeLeft.value = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
    if (powerupTimeLeft.value <= 0) {
      deactivatePowerup();
    }
  }
  
  // === NEAR-MISS TIMER ===
  if (nearMissTimer > 0) {
    nearMissTimer -= realDelta;
    if (nearMissTimer <= 0) {
      nearMissTextRef.value = '';
    }
  }
  // === CAMERA SHAKE (regular near-miss) ===
  if (cameraShakeTimer > 0) {
    cameraShakeTimer -= delta;
    const shakeX = (Math.random() - 0.5) * cameraShakeIntensity * 2;
    const shakeY = (Math.random() - 0.5) * cameraShakeIntensity * 2;
    camera.position.x = shakeX; // Set, don't accumulate
    camera.position.y = 6 + shakeY;
    cameraShakeIntensity *= 0.9; // decay
    if (cameraShakeTimer <= 0) {
      cameraShakeIntensity = 0;
      camera.position.x = 0;
      camera.position.y = 6;
    }
  }

  // Camera: always lerp back to default
  camera.position.x += (0 - camera.position.x) * 0.05;
  camera.position.y += (6 - camera.position.y) * 0.05;
  camera.position.z += (12 - camera.position.z) * 0.05;
  camera.lookAt(0, 1, -8);
  camera.fov += (60 - camera.fov) * 0.05;
  camera.updateProjectionMatrix();
  
  // === RED VIGNETTE (edge glow at max difficulty) ===
  if (difficultyMultiplier > 2.5) {
    edgeGlowIntensity = Math.min(1, (difficultyMultiplier - 2.5) / 1.0);
  } else {
    edgeGlowIntensity = 0;
  }
  const vignetteEl = document.getElementById('vignette-glow');
  if (vignetteEl) {
    vignetteEl.style.opacity = edgeGlowIntensity * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 3));
  }

  // Ensure camera always looks at player (unless bullet time is controlling it)
  camera.lookAt(0, 1, -8);
  composer.render();
};

const handleSwipe = (direction) => {
  if (gameOver.value || countdownLocked) return;
  
  if (direction === 'left') {
    if (currentLane > 0) currentLane--;
  } else if (direction === 'right') {
    if (currentLane < 2) currentLane++;
  } else if (direction === 'up') {
    handleJump();
  } else if (direction === 'down') {
    handleSlide();
  }
};

const handleTouchStart = (e) => {
  // Don't intercept touches on UI buttons or name entry
  if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  initAudio(); // Start audio on first touch
  tryStartBGMFromGesture(); // Retry BGM if autoplay blocked it
};

const handleTouchEnd = (e) => {
  if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel, #name-entry')) return;
  e.preventDefault();
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  // If game over, any tap restarts (but not during name entry, and not within 1s of death)
  if (gameOver.value) {
    if (showNameEntry.value) return;
    if (Date.now() - gameOverTime < 1000) return;
    startCountdown();
    return;
  }
  
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  
  // Determine if horizontal or vertical swipe
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(diffY) > minSwipeDistance) {
      if (diffY < 0) {
        handleSwipe('up');
      } else {
        handleSwipe('down');
      }
    }
  }
};

const activatePowerup = (type) => {
  // Deactivate any existing powerup first to prevent duplicates
  if (activePowerup) {
    deactivatePowerup();
  }
  activePowerup = type;
  const now = Date.now();
  
  if (type === 'shield') {
    powerupEndTime = now + 10000; // 10s
    powerupIcon = '🛡️';
    powerupName = 'Shield';
    isInvincible = true;
    
    // Add shield aura to player
    const oldShield = player.getObjectByName('shield-aura');
    if (oldShield) player.remove(oldShield);
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshToonMaterial({ 
      color: 0x00bfff, 
      transparent: true, 
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.name = 'shield-aura';
    player.add(shield);
    
  } else if (type === 'coldDrink') {
    powerupEndTime = now + 5000; // 5s
    powerupIcon = '🥤';
    powerupName = 'Cold Drink';
    speedMultiplier = 0.6; // Slow down the game
    
  } else if (type === 'magnet') {
    powerupEndTime = now + 15000; // 15s
    powerupIcon = '🧲';
    powerupName = 'Magnet';
    magnetRange = 5;
  }
};

const deactivatePowerup = () => {
  const prevPowerup = activePowerup;
  
  if (activePowerup === 'shield') {
    isInvincible = false;
    const shield = player.getObjectByName('shield-aura');
    if (shield) player.remove(shield);
  } else if (activePowerup === 'coldDrink') {
    speedMultiplier = 1.0; // Restore normal game speed
  } else if (activePowerup === 'magnet') {
    magnetRange = 0;
  }
  
  activePowerup = null;
  powerupTimeLeft.value = 0;
  
  // Visual feedback that powerup expired
  if (prevPowerup) {
    const icon = prevPowerup === 'shield' ? '🛡️' : prevPowerup === 'coldDrink' ? '🥤' : '🧲';
    createFloatingText(icon + ' expired!', player.position.clone().add(new THREE.Vector3(0, 2, 0)));
  }
};

const handleJump = () => {
  if (isJumping || isSliding || isFlying) return;
  isJumping = true;
  jumpVelocity = jumpStrength;
  playSound('jump');
};

const handleSlide = () => {
  if (isJumping || isSliding || isFlying) return;
  isSliding = true;
  slideTimer = slideDuration;
  playSound('jump');
};

const handleDeviceOrientation = (e) => {
  if (!tiltEnabled || gameOver.value) return;
  
  const beta = e.beta;  // Front-back tilt (-180 to 180)
  const gamma = e.gamma; // Left-right tilt (-90 to 90)
  
  if (beta === null || gamma === null) return;
  
  // Update debug overlay
  if (showDebugOverlay.value) {
    lastBeta.value = beta;
    lastGamma.value = gamma;
  }
  
  // During calibration (countdown), collect samples
  if (isCalibrating) {
    tiltCalibrationSamples.push({ beta, gamma });
    if (tiltCalibrationSamples.length > CALIBRATION_MAX_SAMPLES) {
      tiltCalibrationSamples.shift();
    }
    return; // Don't process tilt during calibration
  }
  
  // Calibrate on first reading (non-mobile fallback)
  if (tiltInitialBeta === null) {
    tiltInitialBeta = beta;
    tiltInitialGamma = gamma;
    return;
  }
  
  const tiltForward = beta - tiltInitialBeta; // Negative = tilted forward (up)
  const tiltSideways = gamma - (tiltInitialGamma || 0); // Relative to calibrated center
  
  // Tilt phone toward you (beta increases) = jump
  if (tiltForward > TILT_THRESHOLD && !isJumping && !isSliding && !countdownLocked) {
    handleJump();
  }
  
  // Tilt phone away from you (beta decreases) = slide
  if (tiltForward < -TILT_THRESHOLD && !isJumping && !isSliding && !countdownLocked) {
    handleSlide();
  }
  
  // Tilt left/right = lane change
  const now = Date.now();
  if (now - lastTiltLaneChange > TILT_LANE_COOLDOWN && !countdownLocked) {
    if (tiltSideways < -TILT_LR_THRESHOLD) {
      if (currentLane > 0) { currentLane--; lastTiltLaneChange = now; }
    } else if (tiltSideways > TILT_LR_THRESHOLD) {
      if (currentLane < 2) { currentLane++; lastTiltLaneChange = now; }
    }
  }
};

const handleKeyDown = (e) => {
  // Prevent default for game controls to stop page scrolling
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key)) {
    e.preventDefault();
  }
  
  // === SECRET DEBUG CODE: D→E→B→U→G ===
  const key = e.key.toUpperCase();
  if (!debugMode.value && ['D', 'E', 'B', 'U', 'G'].includes(key)) {
    const expectedSeq = 'DEBUG';
    const nextIdx = debugKeyBuffer.length;
    if (key === expectedSeq[nextIdx]) {
      debugKeyBuffer += key;
      // Clear existing timer
      if (debugKeyTimer) clearTimeout(debugKeyTimer);
      // Set 2-second timeout to clear buffer
      debugKeyTimer = setTimeout(() => {
        debugKeyBuffer = '';
      }, 2000);
      // Check if complete sequence entered
      if (debugKeyBuffer === expectedSeq) {
        debugMode.value = true;
        debugKeyBuffer = '';
        if (debugKeyTimer) clearTimeout(debugKeyTimer);
        console.log('[DEBUG] Debug mode activated!');
      }
    } else {
      // Wrong key - reset buffer
      debugKeyBuffer = key === 'D' ? 'D' : '';
      if (debugKeyTimer) clearTimeout(debugKeyTimer);
      if (debugKeyBuffer) {
        debugKeyTimer = setTimeout(() => {
          debugKeyBuffer = '';
        }, 2000);
      }
    }
  }
  
  // === DEBUG MODE CONTROLS (only when debugMode is active) ===
  if (debugMode.value) {
    // Stage jump: 1/2/3 → stage 0/1/2
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      const targetStage = parseInt(e.key, 10) - 1;
      console.log('[DEBUG] Stage jump to', targetStage);
      resetStage(false, targetStage);
      // Debug jumps skip countdown - start spawning immediately
      clock.start();
      lastSpawnTime = clock.getElapsedTime() - spawnInterval - 0.1;
      console.log('[DEBUG-STAGE-JUMP] Clock started, spawning enabled immediately');
      return;
    }
    // Boss early spawn: B key
    if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      if (!bossActive.value && !bossDefeated.value) {
        console.log('[DEBUG] Boss early spawn!');
        bossWarning.value = false;
        bossActive.value = true;
        const difficultyMultiplier = Math.min(1 + (gameDuration / 30), 3.5);
        bossHealth.value = Math.min(250, Math.floor(BOSS_BASE_HEALTH * difficultyMultiplier));
      }
      return;
    }
    // God mode toggle: G key
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      godMode.value = !godMode.value;
      console.log('[DEBUG] God mode', godMode.value ? 'ON' : 'OFF');
      // Apply/remove gold glow effect on player
      if (player && godMode.value) {
        // Add gold emissive glow to player
        player.traverse((child) => {
          if (child.isMesh && child.material) {
            child.userData.originalEmissive = child.material.emissive?.getHex() || 0x000000;
            child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
            if (child.material.emissive) {
              child.material.emissive.setHex(0xffd700);
              child.material.emissiveIntensity = 0.8;
              child.material.needsUpdate = true;
            }
          }
        });
      } else if (player) {
        // Remove gold glow
        player.traverse((child) => {
          if (child.isMesh && child.material) {
            if (child.material.emissive && child.userData.originalEmissive !== undefined) {
              child.material.emissive.setHex(child.userData.originalEmissive);
              child.material.emissiveIntensity = child.userData.originalEmissiveIntensity || 0;
              child.material.needsUpdate = true;
            }
          }
        });
      }
      return;
    }
  }
  
  // Initialize audio on first keypress
  initAudio();
  tryStartBGMFromGesture(); // Retry BGM if autoplay blocked it
  
  // Restart on Space, Enter, or any key when game over (but not during name entry)
  if (gameOver.value) {
    if (showNameEntry.value) return; // Don't restart while entering name
    if (Date.now() - gameOverTime < 1000) return; // Prevent instant restart
    startCountdown();
    return;
  }
  
  if (gameOver.value || countdownLocked) return;
  
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    if (currentLane > 0) currentLane--;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    if (currentLane < 2) currentLane++;
  }
  
  if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !isJumping) {
    handleJump();
  }
  if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && !isSliding) {
    handleSlide();
  }
};

// Reset the game world for a new stage. Optionally preserves score and targets a specific stage.
// Used by both restartGame (game over) and boss-defeat stage transitions.
const resetStage = (preserveScore = false, targetStage = -1) => {
  // CRITICAL: Clear ALL pending timeouts/intervals FIRST to prevent stale callbacks
  clearAllTimers();
  clock.stop(); // Stop clock before resetting state

  // Game state
  if (!preserveScore) {
    score.value = 0;
  }
  gameOver.value = false;
  showNameEntry.value = false;
  playerName.value = '';
  currentLane = 1;
  isJumping = false;
  jumpVelocity = 0;
  isSliding = false;
  slideTimer = 0;
  isFlying = false;
  flyVelocity = 0;

  // Speed & spawning
  gameSpeed = 0.25;
  spawnInterval = 1.2;
  gameDuration = 1.5; // Set to 1.5 to skip spawn grace period (allows immediate spawning)
  countdownLocked = false; // Ensure game is unlocked after a reset
  countdownActive.value = false;

  // CRITICAL: Restart the clock AFTER resetting state
  clock.start();
  lastSpawnTime = 0; // Reset spawn timer
  stageTransitioning.value = false; // Ensure not stuck in transition
  // Cleanup medieval flowers from Stage 2 to prevent pink objects in other stages
  cleanupMedievalFlowers();
  
  console.log('[RESET-STAGE] All timers cleared, countdownLocked=false, countdownActive=false, stageTransitioning=false');
  console.log('[RESET-STAGE] gameDuration=1.5, spawning should start immediately');
  
  // Stage
  currentStage.value = targetStage >= 0 ? targetStage : (debugStartStage.value >= 0 ? debugStartStage.value : 0);
  stageTime.value = targetStage >= 0 ? 0 : (debugStartStage.value >= 0 ? Math.max(0, STAGES[debugStartStage.value].stageDuration - 20) : 0);
  applyStageVisuals(currentStage.value);

  // Road curve
  roadCurve.value = 0;
  roadCurveTarget.value = 0;
  curveChangeTimer.value = 0;
  nextCurveChange.value = 3;
  curveFrontZ.value = 0;

  // Boss state
  bossWarning.value = false;
  bossActive.value = false;
  bossDefeated.value = false;
  bossHealth.value = BOSS_BASE_HEALTH;
  bossCharging = false;
  bossChargeTimer = 0;
  bossChargeTarget = 0;
  bossAttackTimer = 0;
  bossNextAttack = 3;
  bossState = 'idle';
  bossStateTimer = 0;
  bossVulnerableOrbs = [];
  stageTransitioning.value = false;
  if (boss) { scene.remove(boss); boss = null; }
  console.log('[RESET-STAGE] stageTransitioning=false, bossActive=false, bonusNoSpawn=false');

  // Player state
  comboCount = 0;
  lastCoinTime = 0;
  scoreMultiplier = 1;
  magnetRange = 0;
  isInvincible = false;
  activePowerup = null;
  powerupEndTime = 0;
  powerupIcon = '';
  powerupName = '';
  powerupTimeLeft.value = 0;
  const shieldAura = player.getObjectByName('shield-aura');
  if (shieldAura) player.remove(shieldAura);

  // Camera
  cameraShakeTimer = 0;
  cameraShakeIntensity = 0;
  camera.position.set(0, 6, 12);

  // Visual cycles
  dayCycleTime = 0;
  skyBlendFactor = 0;
  nearMissTimer = 0;
  nearMissCount = 0;
  nearMissTextRef.value = '';
  nearMissCountRef.value = 0;

  // Events
  eventTimer = 0;
  activeEvent = null;
  eventDuration = 0;
  fogDensity = 0;
  scene.fog.near = 20;
  scene.fog.far = 80;
  edgeGlowIntensity = 0;
  const vignetteEl = document.getElementById('vignette-glow');
  if (vignetteEl) vignetteEl.style.opacity = '0';

  // Bonus zone
  bonusPortal = null;
  bonusPortalSpawned = false;
  inBonusZone = false;
  bonusTimer = 0;
  inBonusZoneRef.value = false;
  bonusTimerRef.value = 0;
  bonusNoSpawn = false;
  bonusCoins.forEach(bc => scene.remove(bc.mesh));
  bonusCoins = [];
  scene.userData.bonusEnvActive = false;
  if (scene.userData.nyanCat) {
    scene.remove(scene.userData.nyanCat);
    scene.userData.nyanCat = null;
    scene.userData.nyanCatTime = 0;
  }
  if (originalRoadMaterial) {
    const roadCheck = scene.getObjectByName('road');
    if (roadCheck) {
      // Dispose current material if it's not the original
      if (roadCheck.material !== originalRoadMaterial && roadCheck.material) {
        roadCheck.material.dispose();
      }
      roadCheck.material = originalRoadMaterial;
      if (originalGroundTexture) {
        roadCheck.material.map = originalGroundTexture;
        roadCheck.material.color.set(originalGroundColor);
        roadCheck.material.needsUpdate = true;
      }
      originalRoadMaterial = null;
    }
  }
  if (savedSubstageState) {
    savedSubstageState.obstacles.forEach(obs => scene.remove(obs.mesh));
    savedSubstageState.coins.forEach(coin => scene.remove(coin.mesh));
    savedSubstageState = null;
  }

  // Clear all game objects
  obstacles.forEach(obs => { obs.mesh.traverse(c => { if (c.geometry && c.geometry !== sharedCoinGeo) c.geometry.dispose(); }); scene.remove(obs.mesh); });
  obstacles.length = 0;
  coins.forEach(coin => scene.remove(coin.mesh));
  coins.length = 0;
  powerups.forEach(pw => scene.remove(pw.mesh));
  powerups.length = 0;
  bossProjectiles.forEach(fb => scene.remove(fb));
  bossProjectiles.length = 0;
  particles.forEach(p => scene.remove(p));
  particles.length = 0;
  floatingTexts.forEach(t => scene.remove(t));
  floatingTexts = [];
  achievements.value = [];

  // Player position
  player.position.set(0, 0.5, 0);
  player.scale.y = 1.0;
  const stars = scene.getObjectByName('stars');
  if (stars) scene.remove(stars);
  scene.userData.starsCreated = false;

  // Buildings & trees — reset positions (including Y based on baseY)
  buildings.forEach(b => {
    b.visible = true;
    if (b.userData.initZ !== undefined) {
      b.position.z = b.userData.initZ;
      b.position.x = b.userData.initX;
      b.position.y = b.baseY + getSurfaceY(b.userData.initZ);
      b.baseX = b.userData.initBaseX;
    }
  });
  trees.forEach(t => {
    t.visible = true;
    if (t.userData.initZ !== undefined) {
      t.position.z = t.userData.initZ;
      t.position.x = t.userData.initX;
      t.position.y = t.baseY + getSurfaceY(t.userData.initZ);
      t.baseX = t.userData.initBaseX;
    }
  });
  eventAlertTextRef.value = '';
};

const startCountdown = () => {
  // Reset game state immediately
  restartGame();
  countdownLocked = true;
  countdownActive.value = true;
  
  // Start tilt calibration on mobile during countdown (3s of sampling)
  if (isMobile && tiltEnabled) {
    startTiltCalibration();
  }
  
  let count = 3;
  countdownText.value = count.toString();
  
  const tick = () => {
    count--;
    if (count > 0) {
      countdownText.value = count.toString();
      setTimeout(tick, 1000);
    } else if (count === 0) {
      countdownText.value = 'GO!';
      startBGM(); // Start music on GO!
      // Finish tilt calibration — compute average from countdown samples
      if (isMobile && isCalibrating) {
        finishTiltCalibration();
      }
      setTimeout(() => {
        countdownActive.value = false;
        countdownLocked = false;
        gameDuration = 1.5;
        lastSpawnTime = clock.getElapsedTime() - spawnInterval;
        // 2-second invincibility after game starts (green shield)
        isInvincible = true;
        gameStartTime = Date.now();
        const oldGrace = player.getObjectByName('shield-aura');
        if (!oldGrace) {
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          player.add(graceMesh);
        }
        invincibilityTimeout = setTimeout(() => {
          isInvincible = false;
          invincibilityTimeout = null;
          const shield = player.getObjectByName('shield-aura');
          if (shield) player.remove(shield);
        }, 2000);
      }, 500);
    }
  };
  
  setTimeout(tick, 1000);
};

const restartGame = () => {
  stopBGM();
  tiltInitialBeta = null;
  tiltInitialGamma = null;
  tiltCalibrationSamples = [];
  isCalibrating = false;
  // Reset speed system
  baseGameSpeed = 0.25;
  speedMultiplier = 1.0;
  gameSpeed = 0.25;
  resetStage(false); // full reset, score = 0 (already calls applyStageVisuals)
  clock.start();
  playSound('start');
};

// === PAUSE/RESUME SYSTEM ===
const pauseGame = () => {
  if (isPaused.value || gameOver.value || countdownActive.value) return;
  isPaused.value = true;
  pauseStartTime = clock.getElapsedTime(); // Record pause time
  // Show pause indicator
  createFloatingText('⏸️ PAUSED', player.position.clone().add(new THREE.Vector3(0, 3, 0)), '#ffffff');
  console.log('[PAUSE] Game paused');
};

const resumeGame = () => {
  if (!isPaused.value) return;
  isPaused.value = false;
  // Adjust clock to account for pause duration
  const pauseDuration = clock.getElapsedTime() - pauseStartTime;
  clock.elapsedTime -= pauseDuration;
  console.log('[RESUME] Game resumed');
};

const togglePause = () => {
  if (isPaused.value) {
    resumeGame();
  } else {
    pauseGame();
  }
};

// Handle visibility change (tab switch, app switch)
const handleVisibilityChange = () => {
  if (document.hidden) {
    // Tab/app became hidden - pause
    pauseGame();
  } else {
    // Tab/app became visible - resume (with user interaction)
    // Don't auto-resume, wait for user interaction
  }
};

window.addEventListener('error', (e) => { console.log('GLOBAL ERROR:', e.message, 'at', e.filename + ':' + e.lineno + ':' + e.colno); });
onMounted(() => {
  const saved = localStorage.getItem(`elangoSurfersHighScore_${VERSION_MAJOR_MINOR}`);
  if (saved) highScore.value = parseInt(saved, 10);
  initGame();
  // Start with countdown on initial load
  countdownLocked = true;
  countdownActive.value = true;
  let initCount = 3;
  countdownText.value = initCount.toString();
  const initTick = () => {
    initCount--;
    if (initCount > 0) {
      countdownText.value = initCount.toString();
      setTimeout(initTick, 1000);
    } else if (initCount === 0) {
      countdownText.value = 'GO!';
      startBGM(); // Start music on initial GO!
      initialCountdownTimeout = setTimeout(() => {
        countdownActive.value = false;
        countdownLocked = false;
        gameDuration = 1.5;
        lastSpawnTime = clock.getElapsedTime() - spawnInterval - 0.1; // Subtract extra 0.1s to ensure (time - lastSpawnTime) > spawnInterval is true on first frame
        // 2-second invincibility after game starts (green shield)
        isInvincible = true;
        gameStartTime = Date.now();
        const oldGrace = player.getObjectByName('shield-aura');
        if (!oldGrace) {
          const graceGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const graceMat = new THREE.MeshToonMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
          const graceMesh = new THREE.Mesh(graceGeo, graceMat);
          graceMesh.name = 'shield-aura';
          player.add(graceMesh);
        }
        invincibilityTimeout = setTimeout(() => {
          isInvincible = false;
          invincibilityTimeout = null;
          const shield = player.getObjectByName('shield-aura');
          if (shield) player.remove(shield);
        }, 2000);
      }, 500);
    }
  };
  setTimeout(initTick, 1000);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });
  // Only prevent default on touchmove for UI elements, not the whole screen
  // This avoids blocking native scrolling and reduces frame drops
  window.addEventListener('touchmove', (e) => {
    if (e.target.closest('#mute-btn, #tilt-btn, #mic-btn, #settings-btn, #settings-panel')) return;
    // Only prevent default if actively swiping horizontally (gameplay gesture)
    if (touchStartX !== null && Math.abs(e.touches[0].clientX - touchStartX) > 10) {
      e.preventDefault();
    }
  }, { passive: false, capture: true });
  
  // Visibility change (tab/app switch) - pause when hidden
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  window.addEventListener('click', (e) => {
    // Check if click is on settings panel, buttons, or name entry
    if (e.target.closest('#settings-panel') || e.target.closest('#settings-btn') || e.target.closest('#mute-btn') || e.target.closest('#tilt-btn') || e.target.closest('#mic-btn') || e.target.closest('#name-entry')) {
      return;
    }
    // Resume game on any click if paused
    if (isPaused.value) {
      resumeGame();
      return;
    }
    if (gameOver.value && !showNameEntry.value && Date.now() - gameOverTime >= 1000) startCountdown();
    initAudio();
    tryStartBGMFromGesture();
  });
  
  // Resume on any keypress if paused
  window.addEventListener('keydown', (e) => {
    if (isPaused.value && e.key !== 'Escape') {
      resumeGame();
    }
    initAudio();
    tryStartBGMFromGesture();
  });
  
  // Resume on touch if paused
  window.addEventListener('touchstart', () => {
    if (isPaused.value) {
      resumeGame();
    }
    initAudio();
    tryStartBGMFromGesture();
  }, { once: true, passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Pause on P key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      toggleSettings();
    }
  });
  
  // Tilt/gyro controls (mobile)
  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ — request permission on first touch (retry-capable, not once:true)
      let iosTiltPermissionRequested = false;
      const requestTiltPermission = async () => {
        if (iosTiltPermissionRequested) return; // already asked this session
        iosTiltPermissionRequested = true;
        try {
          const state = await DeviceOrientationEvent.requestPermission();
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            tiltEnabled = true;
            tiltEnabledRef.value = true;
          } else {
            // User denied — disable tilt and show hint
            tiltEnabled = false;
            tiltEnabledRef.value = false;
          }
        } catch (err) {
          console.log('iOS tilt permission error:', err);
          tiltEnabled = false;
          tiltEnabledRef.value = false;
        }
      };
      // Attach to tilt button click (user gesture required for iOS permission)
      window.addEventListener('touchstart', () => {
        requestTiltPermission();
      }, { once: true });
      // Also attach to tilt toggle button so user can retry
      const origToggleTilt = toggleTilt;
      toggleTilt = async () => {
        if (!tiltEnabled) {
          // Re-request permission on iOS when re-enabling
          iosTiltPermissionRequested = false;
          await requestTiltPermission();
        } else {
          tiltEnabled = false;
          tiltEnabledRef.value = false;
          tiltInitialBeta = null;
        }
      };
    } else {
      // Android / older iOS — auto-granted
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  } else {
    // No DeviceOrientation API available — disable tilt
    tiltEnabled = false;
    tiltEnabledRef.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
  window.removeEventListener('touchmove', handleTouchEnd, { capture: true });
  window.removeEventListener('deviceorientation', handleDeviceOrientation);
  cleanupMic();
  if (composer) composer.dispose();
  stopBGM();
});
</script>

<style scoped>
@import "./game.css";
</style>
