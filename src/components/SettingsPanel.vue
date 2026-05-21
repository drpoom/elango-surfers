<template>
  <div id="settings-panel">
    <h2>⚙️ Settings</h2>
    <button @click="$emit('close')">Close</button>
    
    <div class="settings-section" style="border-bottom:1px solid #444;padding-bottom:1rem;margin-bottom:1rem">
      <h3>🎮 Game Settings</h3>
      <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input type="checkbox" :checked="gameSettings.soundEnabled" @change="onSoundChange" style="width:20px;height:20px;cursor:pointer" /> Sound
      </label>
      <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input type="checkbox" :checked="gameSettings.musicEnabled" @change="onMusicChange" style="width:20px;height:20px;cursor:pointer" /> Music
      </label>
      <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input type="checkbox" :checked="gameSettings.sfxEnabled" @change="onSfxChange" style="width:20px;height:20px;cursor:pointer" /> SFX
      </label>
      <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input type="checkbox" :checked="gameSettings.sensorEnabled" @change="onSensorChange" style="width:20px;height:20px;cursor:pointer" /> Tilt Controls
      </label>
      <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input type="checkbox" :checked="roadCurveEnabled" @change="$emit('update:roadCurveEnabled', $event.target.checked)" style="width:20px;height:20px;cursor:pointer" /> Road Curves
      </label>
      <label style="color:#fff;font-size:16px;display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input type="checkbox" :checked="reduceMotion" @change="onReduceMotionChange" style="width:20px;height:20px;cursor:pointer" /> Reduce Motion
      </label>
    </div>

    <div class="settings-section" style="border-bottom:1px solid #444;padding-bottom:1rem;margin-bottom:1rem">
      <h3>🗺️ Debug: Start Stage</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button @click="$emit('update:debugStartStage', -1)"
          :style="{ background: debugStartStage === -1 ? '#4ecdc4' : '#333', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }">
          Normal
        </button>
        <button v-for="(s, i) in STAGES" :key="i" @click="$emit('update:debugStartStage', i)"
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
          @click="$emit('update:currentSkin', i)"
          :disabled="!unlockedSkins.includes(i)"
        >{{ unlockedSkins.includes(i) ? '🎨' : '🔒' }}</button>
      </div>
    </div>

    <div class="settings-section">
      <h3>🎩 Hats</h3>
      <div class="hat-selector">
        <button @click="$emit('update:currentHat', null)" :class="{ selected: currentHat === null }">None</button>
        <button 
          v-for="hat in ['cap', 'crown', 'helmet']" 
          :key="hat"
          @click="$emit('update:currentHat', hat)"
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
    
    <button @click="$emit('toggle-debug')" style="margin-top:8px;background:#333;color:#0f0;border:1px solid #0f0;padding:6px 12px;borderRadius:4px;cursor:pointer;fontSize:13px">
      🐛 Debug {{ showDebugOverlay ? 'ON' : 'OFF' }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  gameSettings: {
    type: Object,
    required: true
  },
  roadCurveEnabled: {
    type: Boolean,
    required: true
  },
  reduceMotion: {
    type: Boolean,
    required: true
  },
  debugStartStage: {
    type: Number,
    required: true
  },
  currentSkin: {
    type: Number,
    required: true
  },
  currentHat: {
    type: [String, null],
    default: null
  },
  STAGES: {
    type: Array,
    required: true
  },
  unlockedSkins: {
    type: Array,
    required: true
  },
  unlockedHats: {
    type: Array,
    required: true
  },
  achievements: {
    type: Array,
    required: true
  },
  ACHIEVEMENTS: {
    type: Array,
    required: true
  },
  showDebugOverlay: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits([
  'close',
  'change-sound',
  'change-music',
  'change-sfx',
  'change-sensor',
  'update:roadCurveEnabled',
  'update:reduceMotion',
  'update:debugStartStage',
  'update:currentSkin',
  'update:currentHat',
  'toggle-debug'
]);

const onSoundChange = (e) => {
  emit('change-sound', e.target.checked);
};

const onMusicChange = (e) => {
  emit('change-music', e.target.checked);
};

const onSfxChange = (e) => {
  emit('change-sfx', e.target.checked);
};

const onSensorChange = (e) => {
  emit('change-sensor', e.target.checked);
};

const onReduceMotionChange = (e) => {
  emit('update:reduceMotion', e.target.checked);
};
</script>
