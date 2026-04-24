# Stage 1 BGM - Highway Theme

## Adding Your New Stage 1 BGM

**This folder is where your new Stage 1 BGM should be placed.**

### Supported Formats
- `.ogg` (recommended, smaller file size)
- `.mp3` (widely compatible)

### Instructions
1. Place your new BGM file in this directory: `/public/assets/`
2. Update the `STAGE1_BGM_FILE` constant in `/src/composables/useAudio.js`
3. Optionally provide a fallback: `STAGE1_BGM_FALLBACK` (different format)

### Current Temporary BGM
- `game_music.ogg` - Highway theme (current placeholder)
- `medieval_music.ogg` - Medieval/castle theme (Stage 2)

### File Naming Convention
Recommended: `stage1_bgm.ogg` or `stage1_highway_theme.mp3`

### Audio Specifications
- Format: Ogg Vorbis or MP3
- Sample Rate: 44100 Hz (standard)
- Channels: Stereo or Mono
- Looping: Enabled in code (seamless loops work best)
