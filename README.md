# 🏄 Elango Surfers — Version History

**An infinite runner game — built entirely by open-source AI models, communicated over Telegram.**

Play it: **[www.drpoom.com/Elango-surfers](https://www.drpoom.com/Elango-surfers)**

---

## 📜 Version History

### v1.x — Foundation (Early Development)

| Version | Features |
|---------|----------|
| **v1.0.0** | Initial commit: Basic infinite runner with lane switching |
| **v1.1.0** | Added jumping, coins, character model, highscore system |
| **v1.2.0** | Wider obstacles (3x), Space/Enter restart, improved collision detection |
| **v1.3.0** | Mobile touch/swipe controls for mobile gaming |
| **v1.3.5** | Progressive difficulty scaling |
| **v1.3.6** | Version display bound to VERSION constant |
| **v1.3.7** | Stronger magnet pull (0.3), obstacle blocking, coins only ahead |
| **v1.3.8** | Prevent scroll on swipe/arrow keys, cleanup on restart |
| **v1.3.9** | Action BGM (electronic loop), auto-start on first touch/key |

---

### v2.x — Graphics & Controls Expansion

| Version | Features |
|---------|----------|
| **v2.0.0** | 🎨 Tier 3: Animated character, road markings, dust trails, speed lines, screen shake, buildings with windows |
| **v2.0.1** | Fix character facing direction, road texture scrolling |
| **v2.0.2** | Fix powerups not deactivating on timer expiry |
| **v2.0.3** | Fix character facing (180° rotate), remove lane markers, magnet safety check |
| **v2.1.0** | Added slide mechanic + floating obstacles |
| **v2.2.0** | 📱 Added tilt/gyro controls for mobile |
| **v2.2.1** | Fix tilt inversion, add tilt toggle, compact mobile UI |
| **v2.3.0** | 🎤 Voice fly — blow into mic to fly! |
| **v2.3.1** | UFO obstacle, fix mobile buttons, voice fly mechanics |
| **v2.3.2** | Fix UFO collision + lower mic threshold |
| **v2.3.3** | Adjust mic sensitivity |
| **v2.4.0** | 🌄 AI-generated sky, mountain parallax backgrounds |
| **v2.4.1** | Fix mountain wall — transparent background, better positioning |
| **v2.4.2** | Push mountains further back, buildings closer — no overlap |
| **v2.5.0** | 🎨 AI-generated character sprites, tree/powerup icons, game over screen |
| **v2.5.1** | Fix sprites — proper bg removal, async loading, building z-fix, coin pulse |
| **v2.5.2** | Restore polygon character with animation, torus coins, AI texture on torso |
| **v2.5.3** | Clothing textures on torso/arms, wider grass, depth fix, freeze fix |
| **v2.5.4** | Procedural trees back, remove unused sprite textures, freeze fix |
| **v2.5.5** | Pure procedural — remove all item/character textures, keep sky+mountains |
| **v2.5.6** | Fix buildings overlapping road, fix double shield glitch |
| **v2.5.7** | Shield cleanup on hit, buildings pushed further |

---

### v3.x — Power-ups & Polish

| Version | Features |
|---------|----------|
| **v3.0.0** | 🎨 Tier 1 graphics upgrade: Colorful cartoon environment |
| **v3.1.0** | Added particle effects system |
| **v3.2.0** | Audio system integration |
| **v3.3.0** | Power-ups: 🛡️ Shield, ⚡ Speed boost, 🧲 Coin magnet |
| **v3.4.0** | Day/night cycle, achievements system, skins & hats |
| **v3.4.5** | Nyan Cat direction fix (left→right), trees 20% smaller, WebP optimization (88% size reduction) |
| **v3.5.0** | Variable declaration order fixes, load priority corrections |
| **v3.6.0** | Canvas resize DPR handling, confetti particle gravity + respawn |
| **v3.7.0** | Fog events with eased transitions |
| **v3.7.4** | Bullet time removed (too many issues) |
| **v3.7.9** | 🐈 Nyan Cat pixel art + chiptune BGM v2 |

---

### v4.x — Boss Battles & Stage System

| Version | Features |
|---------|----------|
| **v4.0.0** | 🏰 Stage system: Highway → Medieval → IKEA-pocalypse cycle |
| **v4.0.8** | Road curve oscillation (quadratic curve propagation) |
| **v4.0.9** | 🐉 Dragon boss: no spin, wings flap, tail sways, mouth opens before attacks |
| **v4.1.0** | Road curve: quadratic propagation (t²), stays straight near player |
| **v4.1.4** | 🎵 Proper medieval BGM — procedural chiptune (Dm→Bb→Gm→A, 100 BPM) |
| **v4.1.5** | Curve front propagation from horizon (z=-80), slower lerp (1.2x) |
| **v4.2.0** | Full restart state audit — 45+ mutable state variables reset properly |
| **v4.2.1** | Centralized `triggerGameOver()`, pending timeout cancellation, iOS tilt permission fix |
| **v4.3.0** | 🏆 Supabase leaderboard integration |
| **v4.3.8** | Dragon fireball randomization (height, speed, trajectory), no-spawn after boss fix |
| **v4.3.9b** | Truck retreat: straight back to center, no re-charge during retreat |
| **v4.4.0** | 🔊 5 new SFX: truck honk, dragon cry, fire shoot, stage clear, truck rev |
| **v4.4.4** | Object spawn after boss fix, "GO!" starts music, 3-2-1 countdown on restart |
| **v4.5.0** | 🔄 `resetStage()` refactor, 3-2-1-GO countdown, boss transition uses resetStage |
| **v4.4.5→v4.4.7** | Stage transition timeout fix, leaderboard version filter |

---

### v5.x — Rollback & Stability

| Version | Features |
|---------|----------|
| **v5.0.0** | Stage 3: IKEA-pocalypse — conveyor road, Swedish flag colors, IKEA building facades |
| **v5.0.1** | 🛣️ Stage 2/3: Fix cobblestone + conveyor textures |
| **v5.0.2** | 🔄 Rollback to v5.0.1 baseline + debug overlay added, FOV warp removed |
| **v5.0.3** | 🛣️ Fix Stage 2 cobblestone material (MeshToonMaterial + proper restore) |
| **v5.0.4** | 🐉 Dragon boss: background hovering (v4 style), no charging at player |

---

## 🤖 How This Was Built

This game was developed **without any human-written code**. Every line was generated by open-source AI models, iterated through Telegram conversations, and deployed by the AI agent itself.

**The human's role:** Final game testing. Nothing more.

- **Code authoring:** Open-source AI models (GLM, via OpenClaw agent framework)
- **Communication channel:** Telegram — the AI agent and human discussed features, bugs, and feedback in real-time chat
- **Iteration loop:** AI writes code → deploys → human tests on device → reports bugs via Telegram → AI fixes → repeat
- **No IDE, no manual coding** — the human never touched a source file

---

## 🎮 How to Play

| Control | Action |
|---------|--------|
| ← → / A D | Switch lanes |
| ↑ / W | Jump |
| ↓ / S | Slide |
| Swipe | Move / Jump / Slide (mobile) |
| Tilt phone | Jump / Slide / Lane change (enable in settings) |
| 🎤 Blow into mic | Fly! |

### Gameplay

- Dodge obstacles (cars, barrels, UFOs, dragons...)
- Collect coins for points — chain coins for combo bonuses
- Grab power-ups: 🛡️ Shield, ⚡ Speed, 🧲 Magnet
- Enter the 🌈 Rainbow Bonus Zone for coin fever
- Survive boss battles (Truck / Dragon) to advance stages
- Stages cycle: Highway → Medieval → IKEA-pocalypse → ...
- Road curves dynamically — watch the bend approaching from the horizon!

---

## 🛠️ Tech Stack

- **Framework:** Vue 3 + Vite
- **3D Engine:** THREE.js
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (leaderboard)
- **Deployment:** GitHub Pages
- **Agent Framework:** OpenClaw
- **AI Models:** GLM, Qwen (open-source via Ollama/OpenRouter)

---

## 📊 Development Stats

- **Total versions:** 80+ releases
- **Development time:** ~7 days (April 2026)
- **Lines of code:** ~4,500 (App.vue) + ~500 (composables)
- **Bundle size:** ~690 KB (minified)
- **Communication:** Telegram chat logs
- **Human coding:** 0 lines

---

## 🏆 Key Achievements

✅ **First playable:** v1.0.0 (basic runner)
✅ **First graphics tier:** v1.3.0 (colorful cartoon environment)
✅ **First power-ups:** v3.3.0 (shield, speed, magnet)
✅ **First boss battle:** v4.0.0 (truck boss)
✅ **First stage system:** v4.0.0 (Highway → Medieval)
✅ **First voice control:** v2.3.0 (blow to fly)
✅ **Full state audit:** v4.2.1 (45+ variables reset properly)
✅ **Supabase leaderboard:** v4.3.0 (global scores with version filtering)

---

## 📝 License

**CC BY-NC-ND 4.0** — Non-commercial, no derivatives.

Built by AI. Tested by Uncle John. 🐕
