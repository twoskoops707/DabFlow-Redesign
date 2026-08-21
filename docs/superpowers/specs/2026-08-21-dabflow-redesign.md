# DabFlow Full Redesign — Design Spec

## Goal
Complete visual and UX redesign of the DabFlow dab-timer PWA/Capacitor Android app. 8 unlockable themes, SVG arc timer with phase-color rings, 3-category home selector, first-launch age gate, Vapor Rise completion animation, new app icons.

## Architecture
- CSS custom properties + `data-theme` attribute on `<html>` for theme switching (no JS per-file)
- `[data-theme="x"]` selectors in `www/css/themes.css` override base tokens
- `www/js/themes.js` manages unlock state, saves active theme to localStorage
- Timer uses SVG arc (no canvas) with red heat arc / theme-color cool arc
- Completion animation is Vapor Rise (large blurry smoke clouds billowing up)
- Age gate stored as `dabflow2_age_verified` in localStorage

## Tech Stack
- Vanilla JS (no framework), Capacitor 6.x, Chart.js 4.4.0
- CSS custom properties for all design tokens
- SVG for timer arc (inline, dynamically updated via JS)
- Google Fonts: Space Mono, Space Grotesk, Share Tech Mono, Cinzel

## Global Constraints
- localStorage key prefix: `dabflow2_`
- Timer phase order: heat → hold → cool (hardcoded formulas unchanged)
- Home screen selector categories: Material (drives formula) · Concentrate (logged to stats) · Heating Source (logged to stats, displayed dim below timer button)
- Completion animation: ONLY Vapor Rise (option A) — no other animations
- All themes use red arc (#EF4444) for heat phase; theme-specific color for cool phase
- Premium builds: all 8 themes unlocked from install
- Free builds: themes unlock via achievements as specified below

## Theme Unlock Conditions
| Theme       | Unlock Condition      | Cool Arc Color |
|-------------|----------------------|----------------|
| Default     | Always               | #5B9CF6        |
| Kush        | First session        | #4ADE80        |
| Terminal    | 10 sessions          | #00FF41        |
| Bond        | 7-day streak         | #A0A0C8        |
| Cyberpunk   | 30 sessions          | #00FFFF        |
| Steampunk   | 50 sessions          | #E8B84B        |
| Tie Dye     | 75 sessions          | rainbow (CSS)  |
| Sugar Skull | 100 sessions         | #00BCD4        |

## Files Changed / Created

### New Files
- `www/js/themes.js` — theme registry, unlock checks, save/load active theme
- `www/js/age-gate.js` — first-launch age verification screen
- `www/css/themes.css` — `[data-theme]` overrides for all 8 themes

### Modified Files
- `www/index.html` — add `data-theme` attribute, age-gate screen, load themes.js + age-gate.js
- `www/css/design.css` — add missing base tokens (--arc-heat, --arc-cool, --font-display, etc.)
- `www/css/animations.css` — add Vapor Rise animation, completion overlay
- `www/js/timer.js` — replace canvas ring with SVG arc; arc stroke changes per phase; ambient glow div; 3-category display; heating source shown dim below pause button
- `www/js/app.js` — home screen: 3 separate pickers (Material / Concentrate / Heating Source); stagger animations; theme event listeners
- `www/js/settings.js` — theme picker grid UI showing locked/unlocked themes
- `www/js/stats.js` — achievements section shows theme unlock progress

### Icons
- `www/icon-a.svg` — Free APK icon (rig + green arc)
- `www/icon-b.svg` — Premium APK icon (sugar skull + gold arc)
- `www/icon-c.svg` — Alternative (neon flame + cyberpunk arc)
- PNG exports at 512, 192, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 32, 29, 20px

## Timer Screen Layout
```
[phase label — colored per phase]
[SVG arc 270° — red heat / theme-cool / green hold]
  [big number centered inside arc — 2rem Space Mono]
[Material chip]  [Concentrate chip]
[PAUSE button]
[dim: via [Heating Source]]
```

## Home Screen Layout
```
[DabFlow header]
[Last Session card if exists — with edit button]

[Material selector]      ← drives formula
  Quartz / Banger / Titanium / Ceramic / Quartz Thermal

[Concentrate selector]   ← logged to stats, no formula impact
  Live Resin / Live Rosin / Shatter / Wax / Distillate / Budder / Sauce / Diamonds / Hash / Other

[Heating Source selector] ← logged to stats, no formula impact
  Torch / E-Nail / E-Rig / Induction Heater

[START SESSION button]
```

## Age Gate
- Shown only on first launch (localStorage key `dabflow2_age_verified` absent)
- Full-screen overlay with DabFlow logo and "I am 21 or older" / "I am under 21" buttons
- Under 21: shows "This app is for adults only" and stays locked
- 21+: sets key, dismisses overlay, proceeds normally

## Vapor Rise Animation
- Triggered when cool phase ends (session complete)
- 3 large blurry radial-gradient ovals animate upward from bottom center
- Each oval: `background: radial-gradient(ellipse, rgba(255,255,255,0.22), transparent 70%)`, `filter: blur(6px)`
- Animation: scale 0.3 → 2.8, translateY 0 → -130px, opacity 0 → 0.5 → 0 over 2.8-3.5s
- Behind the completion text: "SESSION COMPLETE ✓" then "ADD NOTES" button
- Loops until user dismisses

## Data Model (unchanged)
```js
{ ts, material, concentrate, heatingSource, rating, heat, hold, cool, brand, strain }
```
`concentrate` replaces the old loose `strain`/`brand` concept for the new 3-category system.
Old sessions without `concentrate` field render gracefully (show material only).
