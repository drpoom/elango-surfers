# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay.spec.ts >> Elango Surfers - Gameplay Tests >> debug overlay can be toggled
- Location: tests/gameplay.spec.ts:86:3

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: v5.2.1
    - generic: "Score: 846"
    - generic: "High Score: 0"
    - generic: "STAGE 1: The Modern Highway"
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
    - button "🐛 Debug OFF" [ref=e58] [cursor=pointer]
```