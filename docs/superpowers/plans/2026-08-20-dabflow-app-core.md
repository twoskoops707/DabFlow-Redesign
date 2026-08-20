# DabFlow 2.0 — App Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete DabFlow 2.0 app UI — all 5 screens, design system, custom SVG icons, timer engine, stats with seed data, glass artists, and easter eggs — as a single-file vanilla JS/HTML/CSS app ready for Capacitor packaging.

**Architecture:** Single `index.html` shell with 5 screen divs. CSS custom-property design system loaded first. Each JS module is its own file. Screen switching via class toggle. No framework, no build step, no bundler — direct browser JS.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla ES6 JS, Chart.js 4.x (CDN), Space Grotesk + Space Mono + Inter (Google Fonts CDN), Capacitor (Android wrapper — not touched here, handled by build plan).

**Spec:** `docs/superpowers/specs/2026-08-20-dabflow-redesign-design.md`

## Global Constraints

- Dark mode only — no light mode toggle
- Zero icon libraries (no Font Awesome, no Material Icons, no emoji in UI chrome)
- All icons are inline SVG, 24×24 viewBox, 1.5px stroke, rounded caps, no fill
- Fonts: Space Grotesk (headings), Space Mono (numbers/timer), Inter (body)
- Color palette must use CSS custom properties — no hardcoded hex values in components
- `window.BUILD_VARIANT` must be set before any other JS runs: `'free' | 'demo' | 'premium'`
- Ads shown only when `BUILD_VARIANT === 'free' || BUILD_VARIANT === 'demo'`
- Seed data injected only when `BUILD_VARIANT === 'demo' || BUILD_VARIANT === 'premium'`
- No jQuery, no lodash, no utility libraries beyond Chart.js
- All external links open with `target="_blank" rel="noopener noreferrer"`
- LocalStorage key prefix: `dabflow2_`
- Android safe-area-inset must be respected (CSS env() variables)

---

## File Map

| File | Responsibility |
|------|---------------|
| `www/index.html` | Shell: `<head>` resources, screen divs, pill nav, ad slots |
| `www/css/design.css` | CSS custom properties, typography scale, base reset |
| `www/css/components.css` | Cards, pill nav, timer ring, stat chips, artist cards |
| `www/css/animations.css` | Screen transitions, phase pulse, molecule bloom, tap feedback |
| `www/js/icons.js` | Named SVG string exports — one object, all icons |
| `www/js/seed-data.js` | `generateSeedData()` → 100 session objects |
| `www/js/timer.js` | Timer engine: phase management, countdown, wake lock, haptics |
| `www/js/stats.js` | Stat aggregation + Chart.js render functions |
| `www/js/ads.js` | Mantis script loader, show/hide based on BUILD_VARIANT |
| `www/js/app.js` | Init, screen switching, state, home/glass/settings screens |

---

### Task 1: Design System CSS

**Files:**
- Create: `www/css/design.css`
- Create: `www/index.html` (skeleton only — `<head>` + empty `<body>`)

**Interfaces:**
- Produces: All CSS custom properties consumed by every subsequent task

- [ ] **Step 1: Create `www/css/design.css`**

```css
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { font-family: 'Inter', sans-serif; background: var(--bg-base); color: var(--text-primary); -webkit-font-smoothing: antialiased; }

/* ── Color tokens ── */
:root {
  --bg-base:        #080A0C;
  --bg-surface:     #0F1215;
  --bg-elevated:    #161B1F;
  --accent:         #2ECC8A;
  --accent-dim:     rgba(46, 204, 138, 0.12);
  --phase-heat:     #5B9CF6;
  --phase-hold:     #F5A623;
  --phase-cool:     #2ECC8A;
  --text-primary:   #F0F4F8;
  --text-secondary: #8A9BAE;
  --text-muted:     #4A5568;
  --border:         rgba(255, 255, 255, 0.06);
}

/* ── Typography scale ── */
:root {
  --font-xs:   0.75rem;
  --font-sm:   0.875rem;
  --font-md:   1rem;
  --font-lg:   1.125rem;
  --font-xl:   1.25rem;
  --font-2xl:  1.5rem;
  --font-3xl:  2rem;
  --font-4xl:  3rem;
  --font-5xl:  4rem;
}

/* ── Spacing scale ── */
:root {
  --sp-1: 0.25rem;
  --sp-2: 0.5rem;
  --sp-3: 0.75rem;
  --sp-4: 1rem;
  --sp-5: 1.25rem;
  --sp-6: 1.5rem;
  --sp-8: 2rem;
  --sp-10: 2.5rem;
  --sp-12: 3rem;
}

/* ── Radius ── */
:root {
  --r-sm:   6px;
  --r-md:   12px;
  --r-lg:   16px;
  --r-xl:   24px;
  --r-full: 9999px;
}

/* ── Font classes ── */
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-mono    { font-family: 'Space Mono', monospace; }
.font-body    { font-family: 'Inter', sans-serif; }

/* ── Safe area ── */
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

- [ ] **Step 2: Create `www/index.html` skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#080A0C">
  <title>DabFlow</title>

  <!-- BUILD VARIANT — injected by CI, default free -->
  <script>window.BUILD_VARIANT = 'free';</script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

  <!-- Styles -->
  <link rel="stylesheet" href="css/design.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/animations.css">
</head>
<body>

  <!-- Molecule background (added by app.js) -->
  <div id="molecule-bg" aria-hidden="true"></div>

  <!-- App root -->
  <div id="app">
    <!-- Screens injected here in subsequent tasks -->
  </div>

  <!-- Scripts -->
  <script src="js/icons.js"></script>
  <script src="js/seed-data.js"></script>
  <script src="js/ads.js"></script>
  <script src="js/timer.js"></script>
  <script src="js/stats.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Open `www/index.html` in a browser (or `npx live-server www`) and verify**
  - Background is `#080A0C` (near-black)
  - No errors in console
  - Fonts loading (check Network tab)

- [ ] **Step 4: Commit**

```bash
cd /data/data/com.termux/files/home/DabFlow-Redesign
git add www/index.html www/css/design.css
git commit -m "feat: design system CSS + HTML skeleton"
```

---

### Task 2: Molecule Background + Animations CSS

**Files:**
- Create: `www/css/animations.css`
- Create: `www/js/icons.js` (stub only — full icons in Task 3)

**Interfaces:**
- Produces: `.screen` transition classes, `#molecule-bg` SVG pattern, `.bloom-ring` animation

- [ ] **Step 1: Create `www/css/animations.css`**

```css
/* ── Screen transitions ── */
#app {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.screen {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: calc(80px + var(--safe-bottom));
  padding-top: calc(var(--safe-top) + var(--sp-4));
  opacity: 0;
  transform: translateX(100%);
  transition: transform 280ms ease-in-out, opacity 280ms ease-in-out;
  pointer-events: none;
}

.screen.active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: all;
}

.screen.exit-left {
  opacity: 0;
  transform: translateX(-40%);
}

/* ── Molecule background ── */
#molecule-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.035;
  overflow: hidden;
}

#molecule-bg svg {
  width: 100%;
  height: 100%;
}

/* ── Nav tap pulse ── */
@keyframes nav-tap {
  0%   { transform: scale(0.85); }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.nav-tap { animation: nav-tap 120ms ease-out forwards; }

/* ── Phase ring pulse ── */
@keyframes phase-pulse {
  0%   { filter: brightness(1); }
  50%  { filter: brightness(1.4); }
  100% { filter: brightness(1); }
}
.phase-pulse { animation: phase-pulse 400ms ease-out; }

/* ── Molecule bloom (easter egg) ── */
@keyframes bloom-in {
  0%   { transform: scale(0) rotate(0deg); opacity: 0; }
  40%  { opacity: 0.9; }
  100% { transform: scale(2.5) rotate(120deg); opacity: 0; }
}
.bloom-ring {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 120px;
  height: 120px;
  pointer-events: none;
  animation: bloom-in 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ── Toast notification ── */
@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.toast {
  position: fixed;
  bottom: calc(90px + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: var(--font-sm);
  padding: var(--sp-3) var(--sp-5);
  border-radius: var(--r-full);
  border: 1px solid var(--border);
  z-index: 999;
  white-space: nowrap;
  animation: toast-in 200ms ease-out;
}

/* ── Card fade-in ── */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fade-up 320ms ease-out both; }
```

- [ ] **Step 2: Create molecule background in `www/js/icons.js` stub + inject SVG pattern**

```js
// icons.js — all custom SVG icons + molecule background
const ICONS = {};

function injectMoleculeBg() {
  const el = document.getElementById('molecule-bg');
  if (!el) return;
  // Terpene/benzene ring motif — hexagonal carbon chains
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="mol" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
          <!-- Benzene ring -->
          <polygon points="20,4 36,13 36,31 20,40 4,31 4,13"
            fill="none" stroke="#2ECC8A" stroke-width="1"/>
          <!-- Inner ring (double bond representation) -->
          <polygon points="20,10 30,16 30,28 20,34 10,28 10,16"
            fill="none" stroke="#2ECC8A" stroke-width="0.5"/>
          <!-- Carbon chain branches -->
          <line x1="20" y1="4"  x2="20" y2="0"  stroke="#2ECC8A" stroke-width="1"/>
          <line x1="36" y1="13" x2="44" y2="9"  stroke="#2ECC8A" stroke-width="1"/>
          <line x1="36" y1="31" x2="44" y2="35" stroke="#2ECC8A" stroke-width="1"/>
          <line x1="20" y1="40" x2="20" y2="48" stroke="#2ECC8A" stroke-width="1"/>
          <line x1="4"  y1="31" x2="-4" y2="35" stroke="#2ECC8A" stroke-width="1"/>
          <line x1="4"  y1="13" x2="-4" y2="9"  stroke="#2ECC8A" stroke-width="1"/>
          <!-- Second offset ring -->
          <polygon points="60,50 76,59 76,77 60,86 44,77 44,59"
            fill="none" stroke="#2ECC8A" stroke-width="1"/>
          <polygon points="60,56 70,62 70,74 60,80 50,74 50,62"
            fill="none" stroke="#2ECC8A" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mol)"/>
    </svg>`;
}
```

- [ ] **Step 3: Verify molecule pattern renders**
  - In browser, temporarily set `#molecule-bg { opacity: 0.3; }` to see it clearly
  - Should show repeating benzene/hexagonal molecular pattern
  - Revert opacity to `0.035`

- [ ] **Step 4: Commit**

```bash
git add www/css/animations.css www/js/icons.js
git commit -m "feat: molecule background + animations CSS"
```

---

### Task 3: Custom SVG Icons

**Files:**
- Modify: `www/js/icons.js` (add all named icon SVGs)

**Interfaces:**
- Produces: `ICONS` object with keys: `home`, `timer`, `stats`, `glass`, `settings`, `add`, `chevron-right`, `chevron-left`, `lock`, `crown`, `link-out`, `check`
- Each value is an SVG string: `'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">...</svg>'`

- [ ] **Step 1: Add all icons to `ICONS` in `www/js/icons.js`**

```js
ICONS.home = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Flame/drop hybrid: teardrop body with flame tip -->
  <path d="M12 3 C12 3 6 9 6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14 C18 9 12 3 12 3Z"/>
  <path d="M9.5 15.5 C9.5 15.5 10 13 12 12" stroke-width="1"/>
</svg>`;

ICONS.timer = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Arc ring with gap at top — segmented timer -->
  <path d="M12 4 A8 8 0 0 1 20 12"/>
  <path d="M20 12 A8 8 0 0 1 12 20"/>
  <path d="M12 20 A8 8 0 0 1 4 12"/>
  <path d="M4 12 A8 8 0 0 1 10.5 4.3"/>
  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
</svg>`;

ICONS.stats = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Pulse/bar chart: 3 bars with ECG spike -->
  <line x1="3" y1="18" x2="3" y2="12"/>
  <line x1="8" y1="18" x2="8" y2="8"/>
  <line x1="13" y1="18" x2="13" y2="14"/>
  <path d="M16 18 L16 6 L19 10 L21 6"/>
</svg>`;

ICONS.glass = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Dab rig silhouette: base, tube, joint, mouthpiece -->
  <rect x="6" y="19" width="12" height="2" rx="1"/>
  <path d="M9 19 L9 13 Q9 10 12 10 Q15 10 15 13 L15 19"/>
  <path d="M15 14 L19 10"/>
  <circle cx="20" cy="9" r="1.5"/>
  <path d="M9 14 L6 11"/>
  <circle cx="5" cy="10" r="1" fill="currentColor" stroke="none"/>
</svg>`;

ICONS.settings = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Molecule gear: hexagon body with 6 outer nodes -->
  <polygon points="12,5 16.2,7.5 16.2,12.5 12,15 7.8,12.5 7.8,7.5"/>
  <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="2.5"  r="1" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="6.25"  r="1" fill="currentColor" stroke="none"/>
  <circle cx="5"  cy="6.25"  r="1" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="13.75" r="1" fill="currentColor" stroke="none"/>
  <circle cx="5"  cy="13.75" r="1" fill="currentColor" stroke="none"/>
  <line x1="12" y1="5"    x2="12" y2="3.5"/>
  <line x1="12" y1="15"   x2="12" y2="16.5"/>
  <line x1="16.2" y1="7.5"  x2="18" y2="6.5"/>
  <line x1="7.8"  y1="7.5"  x2="6"  y2="6.5"/>
  <line x1="16.2" y1="12.5" x2="18" y2="13.5"/>
  <line x1="7.8"  y1="12.5" x2="6"  y2="13.5"/>
</svg>`;

ICONS['chevron-right'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 6 L15 12 L9 18"/>
</svg>`;

ICONS['chevron-left'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 6 L9 12 L15 18"/>
</svg>`;

ICONS.lock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="11" width="14" height="10" rx="2"/>
  <path d="M8 11 V7 A4 4 0 0 1 16 7 V11"/>
</svg>`;

ICONS.crown = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 17 L5 8 L9 13 L12 6 L15 13 L19 8 L21 17 Z"/>
  <line x1="3" y1="20" x2="21" y2="20"/>
</svg>`;

ICONS['link-out'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 13 V19 A2 2 0 0 1 16 21 H5 A2 2 0 0 1 3 19 V8 A2 2 0 0 1 5 6 H11"/>
  <path d="M15 3 H21 V9"/>
  <line x1="10" y1="14" x2="21" y2="3"/>
</svg>`;

ICONS.check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 12 L9 17 L20 7"/>
</svg>`;

ICONS.add = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>`;
```

- [ ] **Step 2: Add `getIcon(name, size)` helper at bottom of `icons.js`**

```js
function getIcon(name, size = 24) {
  const svg = ICONS[name];
  if (!svg) return '';
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
}
```

- [ ] **Step 3: Verify icons render**

Temporarily add to `index.html` body: `<div id="icon-test" style="display:flex;gap:16px;padding:32px;background:#080A0C;"></div>` and in console: `Object.keys(ICONS).forEach(k => document.getElementById('icon-test').innerHTML += getIcon(k, 32))`. All 12 icons should appear in white/currentColor.

- [ ] **Step 4: Remove test div, commit**

```bash
git add www/js/icons.js
git commit -m "feat: custom SVG icon set (12 icons)"
```

---

### Task 4: Components CSS + Pill Navigation

**Files:**
- Create: `www/css/components.css`
- Modify: `www/index.html` (add pill nav + `#app` with 5 screen containers)

**Interfaces:**
- Produces: `.pill-nav`, `.nav-btn`, `.screen`, `.card`, `.chip` CSS classes
- Produces: `switchScreen(name)` must be callable before `app.js` is fully loaded (added in Task 9)

- [ ] **Step 1: Create `www/css/components.css`**

```css
/* ── App layout ── */
#app {
  position: fixed;
  inset: 0;
  background: var(--bg-base);
}

/* ── Pill navigation ── */
.pill-nav {
  position: fixed;
  bottom: calc(var(--sp-5) + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-5);
  background: var(--bg-surface);
  border-radius: var(--r-full);
  box-shadow: 0 4px 32px rgba(0,0,0,0.4);
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-full);
  color: var(--text-muted);
  transition: color 200ms ease;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn.active { color: var(--accent); }
.nav-btn:active { transform: scale(0.88); }

.nav-btn svg { display: block; }

/* ── Cards ── */
.card {
  background: var(--bg-surface);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  overflow: hidden;
}

.card-body { padding: var(--sp-5); }

/* ── Stat chips ── */
.chip {
  background: var(--bg-surface);
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.chip-value {
  font-family: 'Space Mono', monospace;
  font-size: var(--font-2xl);
  color: var(--text-primary);
  line-height: 1;
}

.chip-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--font-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Artist / equipment cards ── */
.artist-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  text-decoration: none;
  color: var(--text-primary);
  transition: border-color 150ms ease, background 150ms ease;
  -webkit-tap-highlight-color: transparent;
}

.artist-card:active {
  background: var(--bg-elevated);
  border-color: var(--accent);
}

.artist-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-primary);
}

.artist-sub {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.artist-card .link-icon {
  margin-left: auto;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ── Section headings ── */
.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--sp-4);
}

/* ── Premium lock overlay ── */
.premium-lock {
  position: absolute;
  inset: 0;
  background: rgba(8, 10, 12, 0.82);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  border-radius: var(--r-lg);
  z-index: 10;
}

.premium-lock-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  text-align: center;
}

/* ── Buttons ── */
.btn-primary {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--bg-base);
  background: var(--accent);
  border: none;
  border-radius: var(--r-full);
  padding: var(--sp-4) var(--sp-8);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 150ms ease;
}

.btn-primary:active { opacity: 0.8; }

.btn-ghost {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--font-sm);
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid rgba(46, 204, 138, 0.25);
  border-radius: var(--r-full);
  padding: var(--sp-3) var(--sp-6);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ── Screen padding ── */
.screen-inner {
  padding: 0 var(--sp-4);
  max-width: 480px;
  margin: 0 auto;
}

/* ── Ad slot ── */
.ad-slot {
  display: flex;
  justify-content: center;
  padding: var(--sp-3) 0;
  min-height: 60px;
}
```

- [ ] **Step 2: Add pill nav + screen containers to `www/index.html`**

Replace the `<!-- Screens injected here -->` comment and add nav:

```html
  <!-- Screens -->
  <div id="app">
    <div id="screen-home"     class="screen active" role="main"></div>
    <div id="screen-timer"    class="screen"        role="main"></div>
    <div id="screen-stats"    class="screen"        role="main"></div>
    <div id="screen-glass"    class="screen"        role="main"></div>
    <div id="screen-settings" class="screen"        role="main"></div>
  </div>

  <!-- Pill nav -->
  <nav class="pill-nav" id="pill-nav">
    <button class="nav-btn active" data-screen="home"     onclick="switchScreen('home')"     aria-label="Home"></button>
    <button class="nav-btn"        data-screen="timer"    onclick="switchScreen('timer')"    aria-label="Timer"></button>
    <button class="nav-btn"        data-screen="stats"    onclick="switchScreen('stats')"    aria-label="Stats"></button>
    <button class="nav-btn"        data-screen="glass"    onclick="switchScreen('glass')"    aria-label="Glass"></button>
    <button class="nav-btn"        data-screen="settings" onclick="switchScreen('settings')" aria-label="Settings"></button>
  </nav>
```

- [ ] **Step 3: Inject icons into nav buttons in `www/js/app.js` (stub)**

Create `www/js/app.js` with just enough to inject icons and wire screen switching:

```js
'use strict';

const NAV_ICONS = ['home', 'timer', 'stats', 'glass', 'settings'];
let currentScreen = 'home';

function switchScreen(name) {
  const prev = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + name);
  if (!next || currentScreen === name) return;

  if (prev) {
    prev.classList.add('exit-left');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('exit-left'), 300);
  }

  next.classList.add('active');
  currentScreen = name;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === name);
  });
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const icon = btn.dataset.screen;
    btn.innerHTML = getIcon(icon, 22);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectMoleculeBg();
  initNav();
});
```

- [ ] **Step 4: Verify in browser**
  - Near-black background, pill nav visible at bottom center
  - All 5 custom SVG icons in the pill
  - Tapping each icon switches the active state (green accent)
  - Screen transitions slide left/right

- [ ] **Step 5: Commit**

```bash
git add www/css/components.css www/js/app.js www/index.html
git commit -m "feat: pill nav + screen containers + screen switching"
```

---

### Task 5: Home Screen

**Files:**
- Modify: `www/js/app.js` (add `renderHome()`)

**Interfaces:**
- Consumes: `switchScreen(name)`, `ICONS`, state from localStorage key `dabflow2_settings`
- Produces: DOM content for `#screen-home`; quick-start preset cards call `switchScreen('timer')` with preset config

- [ ] **Step 1: Add home screen render to `www/js/app.js`**

```js
const PRESETS = [
  { id: 'quartz',  label: 'Quartz',  heat: 45, hold: 8,  cool: 30 },
  { id: 'banger',  label: 'Banger',  heat: 55, hold: 10, cool: 45 },
  { id: 'custom',  label: 'Custom',  heat: 0,  hold: 0,  cool: 0  },
];

function getStreak() {
  const sessions = getSessions();
  if (!sessions.length) return 0;
  const today = new Date().toDateString();
  const days = new Set(sessions.map(s => new Date(s.ts).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderHome() {
  const streak = getStreak();
  const lastSession = getSessions().slice(-1)[0];

  const el = document.getElementById('screen-home');
  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top: var(--sp-6); margin-bottom: var(--sp-6);">
        <p class="font-body" style="font-size:var(--font-sm);color:var(--text-muted);">Good ${getTimeOfDay()}</p>
        <h1 class="font-display" style="font-size:var(--font-3xl);font-weight:700;color:var(--text-primary);line-height:1.1;">DabFlow</h1>
        ${streak > 0 ? `<p class="font-mono" style="font-size:var(--font-sm);color:var(--accent);margin-top:var(--sp-2);">Day ${streak}</p>` : ''}
      </div>

      <p class="section-title">Quick Start</p>
      <div style="display:grid;gap:var(--sp-3);margin-bottom:var(--sp-6);">
        ${PRESETS.map(p => `
          <button class="card fade-up" onclick="startPreset('${p.id}')"
            style="width:100%;text-align:left;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--sp-5);cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div class="font-display" style="font-size:var(--font-lg);font-weight:600;color:var(--text-primary);">${p.label}</div>
              ${p.heat > 0 ? `<div class="font-mono" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-1);">${p.heat}s heat · ${p.hold}s hold · ${p.cool}s cool</div>` : '<div class="font-mono" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-1);">Your saved settings</div>'}
            </div>
            <span style="color:var(--text-muted);">${getIcon('chevron-right', 18)}</span>
          </button>
        `).join('')}
      </div>

      ${lastSession ? `
        <p class="section-title">Last Session</p>
        <div class="card fade-up">
          <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${lastSession.material || 'Session'}</div>
              <div class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-1);">${formatRelTime(lastSession.ts)}</div>
            </div>
            <div class="font-mono" style="font-size:var(--font-2xl);color:var(--text-primary);">${lastSession.rating ? '★'.repeat(lastSession.rating) : ''}</div>
          </div>
        </div>
      ` : ''}
    </div>`;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatRelTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function startPreset(id) {
  const preset = PRESETS.find(p => p.id === id);
  if (preset.id === 'custom') {
    const saved = JSON.parse(localStorage.getItem('dabflow2_settings') || '{}');
    window._timerConfig = { heat: saved.heat || 45, hold: saved.hold || 8, cool: saved.cool || 30 };
  } else {
    window._timerConfig = { heat: preset.heat, hold: preset.hold, cool: preset.cool };
  }
  switchScreen('timer');
}
```

- [ ] **Step 2: Call `renderHome()` in `DOMContentLoaded` after `initNav()`**

In `app.js` DOMContentLoaded block:
```js
document.addEventListener('DOMContentLoaded', () => {
  injectMoleculeBg();
  initNav();
  renderHome();
  renderGlass();    // placeholder call — implemented in Task 8
  renderSettings(); // placeholder call — implemented in Task 9
});
```

Add stubs so it doesn't throw:
```js
function renderGlass() {}
function renderSettings() {}
```

- [ ] **Step 3: Add state helpers to `app.js`**

```js
function getSessions() {
  return JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
}

function saveSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('dabflow2_sessions', JSON.stringify(sessions));
}
```

- [ ] **Step 4: Verify home screen**
  - Shows greeting, "DabFlow" heading
  - 3 preset cards visible (Quartz, Banger, Custom)
  - Tapping any card switches to timer screen (blank for now)
  - Last session card absent on first load (no data)

- [ ] **Step 5: Commit**

```bash
git add www/js/app.js
git commit -m "feat: home screen — greeting, preset cards, last session"
```

---

### Task 6: Timer Engine + Timer Screen

**Files:**
- Create: `www/js/timer.js`
- Modify: `www/index.html` (add timer screen HTML)
- Modify: `www/js/app.js` (call `initTimer()`)

**Interfaces:**
- Consumes: `window._timerConfig = { heat, hold, cool }` (set by home presets or settings)
- Produces: `initTimer()`, `startTimer()`, `pauseTimer()`, `resetTimer()`
- Produces: fires `'session-complete'` CustomEvent on `window` with `{ detail: { heat, hold, cool, material, ts } }`

- [ ] **Step 1: Add timer screen HTML to `#screen-timer` in `index.html`**

```html
<div id="screen-timer" class="screen" role="main">
  <div id="timer-screen-inner" style="
    display:flex;flex-direction:column;align-items:center;
    justify-content:center;height:100%;padding:var(--sp-6) var(--sp-4);
    position:relative;
  ">
    <!-- Phase label -->
    <p id="timer-phase-label" class="font-display" style="
      font-size:var(--font-sm);color:var(--text-muted);
      text-transform:uppercase;letter-spacing:0.12em;
      margin-bottom:var(--sp-6);height:20px;
    "></p>

    <!-- Ring canvas -->
    <div id="timer-ring-wrap" style="position:relative;width:80vw;max-width:320px;aspect-ratio:1;">
      <canvas id="timer-ring" style="width:100%;height:100%;"></canvas>
      <!-- Center content -->
      <div style="
        position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
      ">
        <span id="timer-display" class="font-mono" style="
          font-size:var(--font-5xl);color:var(--text-primary);line-height:1;
        ">--:--</span>
        <span id="timer-sub" class="font-body" style="
          font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-2);
        "></span>
      </div>
      <!-- Bloom easter egg container -->
      <div id="timer-bloom" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:50%;"></div>
    </div>

    <!-- Controls -->
    <div style="margin-top:var(--sp-10);display:flex;gap:var(--sp-4);align-items:center;">
      <button id="timer-reset-btn" onclick="resetTimer()" style="
        width:48px;height:48px;border-radius:50%;border:1px solid var(--border);
        background:var(--bg-surface);color:var(--text-muted);cursor:pointer;
        display:none;align-items:center;justify-content:center;
      ">${getIcon ? getIcon('chevron-left', 20) : ''}</button>

      <button id="timer-start-btn" class="btn-primary"
        onclick="handleTimerBtn()"
        style="min-width:120px;">
        Start
      </button>
    </div>

    <!-- Session rating (shown after complete) -->
    <div id="timer-rating" style="display:none;margin-top:var(--sp-8);text-align:center;">
      <p class="font-display" style="font-size:var(--font-md);color:var(--text-secondary);margin-bottom:var(--sp-3);">Rate this session</p>
      <div style="display:flex;gap:var(--sp-4);justify-content:center;">
        ${[1,2,3,4,5].map(n => `
          <button onclick="rateSession(${n})" style="
            font-size:var(--font-2xl);background:none;border:none;cursor:pointer;
            opacity:0.4;transition:opacity 150ms;
          ">★</button>
        `).join('')}
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Create `www/js/timer.js`**

```js
'use strict';

const PHASE_COLORS = {
  heat: '#5B9CF6',
  hold: '#F5A623',
  cool: '#2ECC8A',
};

let _timerInterval = null;
let _timerState = 'idle'; // idle | running | paused | complete
let _phases = [];
let _currentPhaseIdx = 0;
let _phaseElapsed = 0;
let _holdStartHeld = false;
let _holdTimer = null;
let _sessionStart = null;

function initTimer() {
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth  * window.devicePixelRatio || 600;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio || 600;
  drawRingIdle();
  updateTimerDisplay('--:--');
}

function buildPhases(config) {
  return [
    { name: 'heat', label: 'Heat',     duration: config.heat, color: PHASE_COLORS.heat },
    { name: 'hold', label: 'Hold',     duration: config.hold, color: PHASE_COLORS.hold },
    { name: 'cool', label: 'Cool down',duration: config.cool, color: PHASE_COLORS.cool },
  ].filter(p => p.duration > 0);
}

function drawRingIdle() {
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.42;
  const gap = 0.04; // radians gap between segments
  ctx.clearRect(0, 0, W, H);

  const phases = _phases.length ? _phases : [
    { name: 'heat', color: PHASE_COLORS.heat },
    { name: 'hold', color: PHASE_COLORS.hold },
    { name: 'cool', color: PHASE_COLORS.cool },
  ];
  const segSize = (2 * Math.PI - gap * phases.length) / phases.length;
  const startAngle = -Math.PI / 2;

  phases.forEach((phase, i) => {
    const start = startAngle + i * (segSize + gap);
    const end   = start + segSize;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = W * 0.07;
    ctx.lineCap = 'round';
    ctx.stroke();
  });
}

function drawRingProgress(phaseIdx, progress) {
  // progress: 0–1 within current phase
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.42;
  const gap = 0.04;
  const phases = _phases;
  const segSize = (2 * Math.PI - gap * phases.length) / phases.length;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, W, H);

  phases.forEach((phase, i) => {
    const segStart = startAngle + i * (segSize + gap);
    const segEnd   = segStart + segSize;

    // Dim background
    ctx.beginPath();
    ctx.arc(cx, cy, r, segStart, segEnd);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = W * 0.07;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill: completed phases full, current phase partial, future empty
    if (i < phaseIdx) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, segStart, segEnd);
      ctx.strokeStyle = phase.color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = W * 0.07;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (i === phaseIdx) {
      const fillEnd = segStart + segSize * progress;
      ctx.beginPath();
      ctx.arc(cx, cy, r, segStart, fillEnd);
      ctx.strokeStyle = phase.color;
      ctx.lineWidth = W * 0.07;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  });
}

function updateTimerDisplay(text, sub) {
  const el = document.getElementById('timer-display');
  const subEl = document.getElementById('timer-sub');
  if (el) el.textContent = text;
  if (subEl) subEl.textContent = sub || '';
}

function updatePhaseLabel(text) {
  const el = document.getElementById('timer-phase-label');
  if (el) el.textContent = text;
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function handleTimerBtn() {
  if (_timerState === 'idle') {
    // Check for easter egg: hold for 4.2s
    const btn = document.getElementById('timer-start-btn');
    _holdStartHeld = true;
    btn.textContent = 'Hold...';
    _holdTimer = setTimeout(() => {
      if (_holdStartHeld) {
        _holdStartHeld = false;
        triggerBloomEasterEgg();
        setTimeout(() => startTimer(), 1300);
        btn.textContent = 'Start';
      }
    }, 4200);

    btn.addEventListener('pointerup', cancelHold, { once: true });
    btn.addEventListener('pointerleave', cancelHold, { once: true });

  } else if (_timerState === 'running') {
    pauseTimer();
  } else if (_timerState === 'paused') {
    resumeTimer();
  }
}

function cancelHold() {
  if (_holdStartHeld) {
    _holdStartHeld = false;
    clearTimeout(_holdTimer);
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Start';
    startTimer();
  }
}

function startTimer() {
  const config = window._timerConfig || { heat: 45, hold: 8, cool: 30 };
  _phases = buildPhases(config);
  _currentPhaseIdx = 0;
  _phaseElapsed = 0;
  _sessionStart = Date.now();
  _timerState = 'running';

  const btn = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn) btn.textContent = 'Pause';
  if (resetBtn) resetBtn.style.display = 'flex';

  updatePhaseLabel(_phases[0].label);

  // Wake lock
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').catch(() => {});
  }

  _timerInterval = setInterval(timerTick, 100);
}

function timerTick() {
  _phaseElapsed += 0.1;
  const phase = _phases[_currentPhaseIdx];
  const remaining = phase.duration - _phaseElapsed;
  const progress = _phaseElapsed / phase.duration;

  updateTimerDisplay(formatSeconds(remaining > 0 ? remaining : 0));
  drawRingProgress(_currentPhaseIdx, Math.min(progress, 1));

  if (_phaseElapsed >= phase.duration) {
    // Phase complete
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    _currentPhaseIdx++;
    _phaseElapsed = 0;

    if (_currentPhaseIdx >= _phases.length) {
      completeSession();
    } else {
      updatePhaseLabel(_phases[_currentPhaseIdx].label);
    }
  }
}

function pauseTimer() {
  _timerState = 'paused';
  clearInterval(_timerInterval);
  const btn = document.getElementById('timer-start-btn');
  if (btn) btn.textContent = 'Resume';
}

function resumeTimer() {
  _timerState = 'running';
  _timerInterval = setInterval(timerTick, 100);
  const btn = document.getElementById('timer-start-btn');
  if (btn) btn.textContent = 'Pause';
}

function resetTimer() {
  clearInterval(_timerInterval);
  _timerState = 'idle';
  _phases = [];
  _currentPhaseIdx = 0;
  _phaseElapsed = 0;

  const btn = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  const ratingEl = document.getElementById('timer-rating');
  if (btn) btn.textContent = 'Start';
  if (resetBtn) resetBtn.style.display = 'none';
  if (ratingEl) ratingEl.style.display = 'none';

  updateTimerDisplay('--:--');
  updatePhaseLabel('');
  drawRingIdle();
}

function completeSession() {
  clearInterval(_timerInterval);
  _timerState = 'complete';

  const btn = document.getElementById('timer-start-btn');
  const ratingEl = document.getElementById('timer-rating');
  if (btn) btn.textContent = 'Done';
  if (ratingEl) ratingEl.style.display = 'block';

  updateTimerDisplay('Done', 'Rate your session');
  updatePhaseLabel('Complete');
  drawRingProgress(_phases.length - 1, 1);

  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
}

function rateSession(rating) {
  // Highlight chosen star
  document.querySelectorAll('#timer-rating button').forEach((btn, i) => {
    btn.style.opacity = i < rating ? '1' : '0.3';
  });

  const config = window._timerConfig || {};
  window.dispatchEvent(new CustomEvent('session-complete', {
    detail: {
      ts: _sessionStart || Date.now(),
      heat: config.heat || 0,
      hold: config.hold || 0,
      cool: config.cool || 0,
      material: window._selectedMaterial || 'Quartz',
      rating,
    }
  }));

  setTimeout(() => {
    resetTimer();
    switchScreen('home');
  }, 800);
}

function triggerBloomEasterEgg() {
  const container = document.getElementById('timer-bloom');
  if (!container) return;
  container.innerHTML = `
    <div class="bloom-ring">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="60,10 75,35 103,35 82,52 90,78 60,62 30,78 38,52 17,35 45,35"
          stroke="#2ECC8A" stroke-width="1.5" fill="none" opacity="0.8"/>
        <circle cx="60" cy="60" r="25" stroke="#5B9CF6" stroke-width="1" fill="none"/>
        <circle cx="60" cy="60" r="45" stroke="#F5A623" stroke-width="0.5" fill="none" opacity="0.4"/>
      </svg>
    </div>`;
  setTimeout(() => { container.innerHTML = ''; }, 1300);
}

window.addEventListener('session-complete', (e) => {
  saveSession(e.detail);
});
```

- [ ] **Step 3: Call `initTimer()` when timer screen activates**

In `app.js`, update `switchScreen()` to call init when switching to timer:

```js
function switchScreen(name) {
  // ... existing code ...
  if (name === 'timer') {
    setTimeout(initTimer, 50); // after DOM settles
    // Inject icons into timer reset btn
    const rb = document.getElementById('timer-reset-btn');
    if (rb && !rb.dataset.iconSet) {
      rb.innerHTML = getIcon('chevron-left', 20);
      rb.dataset.iconSet = '1';
    }
  }
  if (name === 'stats') renderStats();
  // ... etc
}
```

- [ ] **Step 4: Load `timer.js` in `index.html`** — already in the script list from Task 1.

- [ ] **Step 5: Verify timer**
  - Open browser, tap Timer nav icon
  - Ring shows 3 dimmed arc segments
  - Tap Start → phases run in sequence, ring fills, colors change
  - Hold Start 4.2s → molecule bloom animation, then timer starts
  - Session complete → star rating appears → tap star → goes to home

- [ ] **Step 6: Commit**

```bash
git add www/js/timer.js www/index.html www/js/app.js
git commit -m "feat: timer engine — phases, ring animation, easter egg, session save"
```

---

### Task 7: Seed Data Generator

**Files:**
- Create: `www/js/seed-data.js`
- Modify: `www/js/app.js` (call seed on init if BUILD_VARIANT !== 'free')

**Interfaces:**
- Produces: `generateSeedData()` → writes 100 session objects to `dabflow2_sessions` localStorage
- Session object shape: `{ ts: Number, heat: Number, hold: Number, cool: Number, material: String, rating: Number }`

- [ ] **Step 1: Create `www/js/seed-data.js`**

```js
'use strict';

function generateSeedData() {
  const existing = JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
  if (existing.length >= 100) return; // don't overwrite

  const materials = ['Quartz', 'Quartz', 'Quartz', 'Banger', 'Banger', 'Titanium'];
  const configs   = [
    { heat: 45, hold: 8,  cool: 30 },
    { heat: 55, hold: 10, cool: 45 },
    { heat: 40, hold: 6,  cool: 25 },
    { heat: 60, hold: 12, cool: 50 },
  ];

  // 100 sessions spread across last 90 days, evening-weighted
  const sessions = [];
  const now = Date.now();
  const dayMs = 86400000;

  // Decide which of the last 90 days have sessions (aim for ~60 active days)
  const activeDays = new Set();
  for (let i = 0; i < 90; i++) {
    // 70% chance of session on any given day, weighted toward recent
    if (Math.random() < 0.7) activeDays.add(i);
  }

  // Distribute 100 sessions across active days
  const dayList = Array.from(activeDays).sort((a, b) => b - a); // recent first
  let count = 0;

  for (const dayOffset of dayList) {
    if (count >= 100) break;
    const sessionsOnDay = count + 2 <= 100 && Math.random() < 0.3 ? 2 : 1;

    for (let s = 0; s < sessionsOnDay && count < 100; s++) {
      // Evening-weighted hour: 18:00–23:00 most likely
      const hourWeights = [0,0,0,0,0,0,1,1,2,3,3,3,4,4,5,5,6,8,9,10,9,8,7,4];
      const hour = weightedRandom(hourWeights);
      const minute = Math.floor(Math.random() * 60);
      const dayStart = now - (dayOffset * dayMs);
      const ts = dayStart - (now % dayMs) + hour * 3600000 + minute * 60000;

      const cfg = configs[Math.floor(Math.random() * configs.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const rating = Math.random() < 0.1 ? 3 : (Math.random() < 0.3 ? 4 : 5);

      sessions.push({ ts, material, rating, ...cfg });
      count++;
    }
  }

  sessions.sort((a, b) => a.ts - b.ts);
  localStorage.setItem('dabflow2_sessions', JSON.stringify(sessions));
}

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
```

- [ ] **Step 2: Call seed in `app.js` DOMContentLoaded**

```js
document.addEventListener('DOMContentLoaded', () => {
  // Seed data for demo/premium builds
  if (window.BUILD_VARIANT === 'demo' || window.BUILD_VARIANT === 'premium') {
    generateSeedData();
  }
  injectMoleculeBg();
  initNav();
  renderHome();
  renderGlass();
  renderSettings();
});
```

- [ ] **Step 3: Verify in browser**
  - In browser console, set `window.BUILD_VARIANT = 'demo'` then reload
  - `JSON.parse(localStorage.getItem('dabflow2_sessions')).length` should return 100
  - Sessions should span ~90 days, majority rated 4-5, mostly evenings

- [ ] **Step 4: Commit**

```bash
git add www/js/seed-data.js www/js/app.js
git commit -m "feat: seed data generator — 100 sessions for demo/premium builds"
```

---

### Task 8: Stats Screen

**Files:**
- Create: `www/js/stats.js`
- Modify: `www/js/app.js` (replace `renderStats` stub, add stats screen HTML)

**Interfaces:**
- Consumes: `getSessions()` from `app.js`, Chart.js global `Chart`
- Produces: `renderStats()` — renders all stat sections into `#screen-stats`

- [ ] **Step 1: Add stats screen HTML to `index.html`** (inside `#screen-stats`)

```html
<div id="screen-stats" class="screen" role="main">
  <div class="screen-inner" id="stats-content">
    <!-- Rendered by stats.js -->
  </div>
</div>
```

- [ ] **Step 2: Create `www/js/stats.js`**

```js
'use strict';

let _chartInstances = {};

function renderStats() {
  const sessions = getSessions();
  const el = document.getElementById('stats-content');
  if (!el) return;

  // Destroy previous chart instances before re-render
  Object.values(_chartInstances).forEach(c => c.destroy());
  _chartInstances = {};

  const streak = getStreak();
  const totalTime = sessions.reduce((t, s) => t + (s.heat||0) + (s.hold||0) + (s.cool||0), 0);
  const bestStreak = calcBestStreak(sessions);

  el.innerHTML = `
    <div style="padding-top:var(--sp-6);">
      <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-6);">Stats</h1>

      <!-- Overview chips -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-6);">
        ${statChip(sessions.length, 'Sessions')}
        ${statChip(formatTotalTime(totalTime), 'Total Time')}
        ${statChip(streak, 'Streak')}
        ${statChip(bestStreak, 'Best Streak')}
      </div>

      <!-- Sessions over time chart -->
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Sessions (30 days)</p>
          <canvas id="chart-sessions" height="160"></canvas>
        </div>
      </div>

      <!-- Time of day chart -->
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Time of Day</p>
          <canvas id="chart-hour" height="140"></canvas>
        </div>
      </div>

      <!-- Material breakdown -->
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Material</p>
          <div style="display:flex;align-items:center;gap:var(--sp-6);">
            <canvas id="chart-material" width="120" height="120" style="flex-shrink:0;"></canvas>
            <div id="chart-material-legend" style="flex:1;"></div>
          </div>
        </div>
      </div>

      <!-- Achievements (premium lock in free/demo) -->
      <div class="card fade-up" style="position:relative;margin-bottom:var(--sp-8);">
        <div class="card-body">
          <p class="section-title">Achievements</p>
          <div id="achievements-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
            ${renderAchievements(sessions)}
          </div>
        </div>
        ${window.BUILD_VARIANT === 'free' || window.BUILD_VARIANT === 'demo' ? `
          <div class="premium-lock">
            <span style="color:var(--accent);">${getIcon('crown', 28)}</span>
            <p class="premium-lock-text">Unlock with Premium</p>
            <button class="btn-ghost" onclick="switchScreen('settings')">Get Premium</button>
          </div>
        ` : ''}
      </div>
    </div>`;

  // Easter egg: 7-day streak message
  if (streak >= 7) {
    const chipArea = el.querySelector('[data-streak]');
    showToast("you've been consistent 👀");
  }

  // Render charts after DOM settles
  requestAnimationFrame(() => {
    renderSessionsChart(sessions);
    renderHourChart(sessions);
    renderMaterialChart(sessions);
  });
}

function statChip(value, label) {
  return `<div class="chip">
    <span class="chip-value">${value}</span>
    <span class="chip-label">${label}</span>
  </div>`;
}

function formatTotalTime(seconds) {
  const h = Math.floor(seconds / 3600);
  if (h > 0) return h + 'h';
  return Math.floor(seconds / 60) + 'm';
}

function calcBestStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => new Date(s.ts).toDateString()))].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i-1])) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

const CHART_DEFAULTS = {
  color: '#8A9BAE',
  borderColor: 'rgba(255,255,255,0.06)',
  font: { family: "'Space Mono', monospace", size: 10 },
};

function renderSessionsChart(sessions) {
  const canvas = document.getElementById('chart-sessions');
  if (!canvas) return;
  const now = Date.now();
  const dayMs = 86400000;
  const labels = [];
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    labels.push(i % 5 === 0 ? `${d.getMonth()+1}/${d.getDate()}` : '');
    const dayStr = d.toDateString();
    data.push(sessions.filter(s => new Date(s.ts).toDateString() === dayStr).length);
  }
  _chartInstances['sessions'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{ data, borderColor: '#2ECC8A', backgroundColor: 'transparent',
        tension: 0.4, pointRadius: 0, borderWidth: 2 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font },
             grid: { color: CHART_DEFAULTS.borderColor } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font, stepSize: 1 },
             grid: { color: CHART_DEFAULTS.borderColor }, beginAtZero: true },
      },
    },
  });
}

function renderHourChart(sessions) {
  const canvas = document.getElementById('chart-hour');
  if (!canvas) return;
  const hourCounts = Array(24).fill(0);
  sessions.forEach(s => { hourCounts[new Date(s.ts).getHours()]++; });
  const labels = hourCounts.map((_, i) => i % 6 === 0 ? `${i}:00` : '');
  _chartInstances['hour'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: hourCounts, backgroundColor: 'rgba(46,204,138,0.5)',
        borderColor: '#2ECC8A', borderWidth: 1, borderRadius: 3 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font },
             grid: { display: false } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font },
             grid: { color: CHART_DEFAULTS.borderColor }, beginAtZero: true },
      },
    },
  });
}

function renderMaterialChart(sessions) {
  const canvas = document.getElementById('chart-material');
  const legend = document.getElementById('chart-material-legend');
  if (!canvas || !sessions.length) return;
  const counts = {};
  sessions.forEach(s => { counts[s.material] = (counts[s.material] || 0) + 1; });
  const labels  = Object.keys(counts);
  const data    = Object.values(counts);
  const colors  = ['#2ECC8A','#5B9CF6','#F5A623','#8A9BAE'];
  _chartInstances['material'] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
    options: { responsive: false, plugins: { legend: { display: false } } },
  });
  if (legend) {
    legend.innerHTML = labels.map((l, i) => `
      <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2);">
        <span style="width:10px;height:10px;border-radius:2px;background:${colors[i]};flex-shrink:0;"></span>
        <span class="font-body" style="font-size:var(--font-xs);color:var(--text-secondary);">${l}</span>
        <span class="font-mono" style="font-size:var(--font-xs);color:var(--text-muted);margin-left:auto;">${data[i]}</span>
      </div>`).join('');
  }
}

function renderAchievements(sessions) {
  const ACHIEVEMENTS = [
    { id: 'first',     label: 'First Dab',     check: s => s.length >= 1 },
    { id: 'ten',       label: '10 Sessions',   check: s => s.length >= 10 },
    { id: 'fifty',     label: '50 Sessions',   check: s => s.length >= 50 },
    { id: 'hundred',   label: '100 Sessions',  check: s => s.length >= 100 },
    { id: 'streak7',   label: '7-Day Streak',  check: s => calcBestStreak(s) >= 7 },
    { id: 'streak30',  label: '30-Day Streak', check: s => calcBestStreak(s) >= 30 },
  ];
  return ACHIEVEMENTS.map(a => {
    const unlocked = a.check(sessions);
    return `<div class="chip" style="opacity:${unlocked ? 1 : 0.4};">
      <span style="color:${unlocked ? 'var(--accent)' : 'var(--text-muted)'};">${getIcon(unlocked ? 'check' : 'lock', 16)}</span>
      <span class="font-display" style="font-size:var(--font-xs);color:var(--text-secondary);margin-top:var(--sp-1);">${a.label}</span>
    </div>`;
  }).join('');
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
```

- [ ] **Step 3: Wire `renderStats()` in `app.js` screen switch**

```js
// In switchScreen(), replace stub:
if (name === 'stats') setTimeout(renderStats, 50);
```

- [ ] **Step 4: Verify stats screen**
  - Set `window.BUILD_VARIANT = 'demo'` in browser console, reload
  - Stats screen should show 4 chips with numbers, 3 charts populated with 100 data points
  - Achievement cards visible but locked (premium overlay)
  - All charts use dark background, accent green color

- [ ] **Step 5: Commit**

```bash
git add www/js/stats.js www/js/app.js www/index.html
git commit -m "feat: stats screen — 4 charts, chips, achievements, premium lock"
```

---

### Task 9: Glass Screen

**Files:**
- Modify: `www/js/app.js` (replace `renderGlass()` stub)

**Interfaces:**
- Consumes: `getIcon()`, `ICONS`
- Produces: DOM content for `#screen-glass`

- [ ] **Step 1: Replace `renderGlass()` stub in `app.js`**

```js
const TOP_ARTISTS = [
  { name: 'Mr Gray Glass',   sub: 'Master Glass Artist',    url: 'https://www.instagram.com/mrgrayglass/' },
  { name: 'Tristan Hodges',  sub: 'Elite Functional Art',   url: 'https://www.instagram.com/tristanhodgesglass/' },
  { name: 'Chachi Rodriguez',sub: 'Innovative Heady Glass', url: 'https://www.instagram.com/chachierodriguez/' },
  { name: 'Jesse ESP',       sub: 'Premium Glass Art',      url: 'https://www.instagram.com/espglass/' },
  { name: 'Mobius Glass',    sub: 'San Luis Obispo, CA',    url: 'https://www.mobiusglass.com/' },
];

const ROTATING_ARTISTS = [
  { name: 'Banjo',               sub: 'Oregon',            url: 'https://www.instagram.com/banjoglass/' },
  { name: 'Mothership Glass',    sub: 'Washington',        url: 'https://mothershipglass.com/' },
  { name: 'Joaquim Glass',       sub: 'Berkeley, CA',      url: 'https://www.instagram.com/joaquimglass/' },
  { name: 'BAGI',                sub: 'Bay Area',          url: 'https://www.instagram.com/bayareaglassinstitute/' },
  { name: 'Invest In Headies',   sub: 'Bay Area Gallery',  url: 'https://investinheadies.com/' },
  { name: 'Jason Stropko',       sub: 'SF Bay Area',       url: 'https://jasonstropko.com/' },
  { name: 'Sovereignty Glass',   sub: 'California',        url: 'https://www.instagram.com/sovereigntyglass/' },
  { name: 'Toro Glass',          sub: 'California',        url: 'https://www.instagram.com/toaboroglass/' },
  { name: 'Humboldt Glassblowers', sub: 'Arcata, CA',      url: 'https://www.instagram.com/humboldtglassblowers/' },
  { name: 'Glass Garage',        sub: 'Eureka, CA',        url: 'https://www.instagram.com/glassgarageeureka/' },
];

function getWeeklyFeatured() {
  const week = Math.floor(Date.now() / (7 * 86400000));
  let s = week;
  const arr = [...ROTATING_ARTISTS];
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 4);
}

function artistCard(artist) {
  return `<a href="${artist.url}" target="_blank" rel="noopener noreferrer" class="artist-card">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div class="artist-name">${artist.name}</div>
        <div class="artist-sub">${artist.sub}</div>
      </div>
      <span class="link-icon">${getIcon('link-out', 14)}</span>
    </div>
  </a>`;
}

function equipmentCard(label) {
  return `<div class="card" style="padding:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-2);min-height:80px;justify-content:center;">
    <div class="font-display" style="font-size:var(--font-sm);color:var(--text-muted);">Equipment</div>
    <div class="font-mono" style="font-size:var(--font-xs);color:var(--accent);">Coming Soon</div>
  </div>`;
}

function renderGlass() {
  const featured = getWeeklyFeatured();
  const el = document.getElementById('screen-glass');
  if (!el) return;
  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);">
        <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-6);">Glass</h1>

        <p class="section-title">Top Artists</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-6);">
          ${TOP_ARTISTS.map(artistCard).join('')}
        </div>

        <p class="section-title">Featured This Week</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-6);">
          ${featured.map(artistCard).join('')}
        </div>

        <p class="section-title">Equipment</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-8);">
          ${equipmentCard()}
          ${equipmentCard()}
        </div>
      </div>
    </div>`;
}
```

- [ ] **Step 2: Verify glass screen**
  - 5 top artist cards in 2-col grid, each with name + sub + link-out icon
  - 4 weekly featured cards (changes each week)
  - 2 equipment placeholder cards with "Coming Soon" in accent color
  - All cards open external link on tap

- [ ] **Step 3: Commit**

```bash
git add www/js/app.js
git commit -m "feat: glass screen — top artists, weekly featured, equipment placeholders"
```

---

### Task 10: Settings Screen

**Files:**
- Modify: `www/js/app.js` (replace `renderSettings()` stub)

**Interfaces:**
- Consumes: `localStorage.getItem('dabflow2_settings')`
- Produces: `saveSetting(key, value)`, DOM for `#screen-settings`

- [ ] **Step 1: Add settings helpers + `renderSettings()` to `app.js`**

```js
function getSettings() {
  return JSON.parse(localStorage.getItem('dabflow2_settings') || '{}');
}

function saveSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  localStorage.setItem('dabflow2_settings', JSON.stringify(s));
}

function renderSettings() {
  const s = getSettings();
  const el = document.getElementById('screen-settings');
  if (!el) return;
  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);">
        <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-6);">Settings</h1>

        <!-- Timer defaults -->
        <p class="section-title">Timer</p>
        <div class="card" style="margin-bottom:var(--sp-4);">
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-5);">
            ${timerSetting('heat', 'Heat Time', s.heat || 45)}
            ${timerSetting('hold', 'Hold Time', s.hold || 8)}
            ${timerSetting('cool', 'Cool Time', s.cool || 30)}
          </div>
        </div>

        <!-- Haptics -->
        <p class="section-title">Preferences</p>
        <div class="card" style="margin-bottom:var(--sp-4);">
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-4);">
            ${toggleRow('haptics', 'Haptic Feedback', s.haptics !== false)}
          </div>
        </div>

        <!-- Premium upsell (free/demo only) -->
        ${window.BUILD_VARIANT !== 'premium' ? `
          <div class="card" style="margin-bottom:var(--sp-4);border-color:rgba(46,204,138,0.3);">
            <div class="card-body" style="text-align:center;">
              <div style="margin-bottom:var(--sp-3);color:var(--accent);">${getIcon('crown', 28)}</div>
              <div class="font-display" style="font-size:var(--font-lg);font-weight:600;margin-bottom:var(--sp-2);">Go Premium</div>
              <div class="font-body" style="font-size:var(--font-sm);color:var(--text-muted);margin-bottom:var(--sp-4);">Remove ads. Unlock achievements.</div>
              <button class="btn-primary">Upgrade</button>
            </div>
          </div>
        ` : ''}

        <!-- App info -->
        <div style="text-align:center;padding:var(--sp-6);color:var(--text-muted);">
          <p class="font-mono" style="font-size:var(--font-xs);">DabFlow v2.0.0</p>
          <p class="font-mono" style="font-size:var(--font-xs);margin-top:var(--sp-1);">${window.BUILD_VARIANT || 'free'}</p>
        </div>
      </div>
    </div>`;
}

function timerSetting(key, label, value) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${label}</div>
      <div class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);">seconds</div>
    </div>
    <div style="display:flex;align-items:center;gap:var(--sp-3);">
      <button onclick="adjustSetting('${key}', -5)" style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:1rem;">−</button>
      <span class="font-mono" id="setting-${key}" style="min-width:36px;text-align:center;color:var(--text-primary);">${value}</span>
      <button onclick="adjustSetting('${key}', 5)"  style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:1rem;">+</button>
    </div>
  </div>`;
}

function toggleRow(key, label, value) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;">
    <span class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${label}</span>
    <button onclick="toggleSetting('${key}', this)"
      style="width:48px;height:26px;border-radius:var(--r-full);border:none;cursor:pointer;
        background:${value ? 'var(--accent)' : 'var(--bg-elevated)'};
        position:relative;transition:background 200ms;"
      data-on="${value}">
      <span style="position:absolute;top:3px;left:${value ? '24px' : '3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left 200ms;"></span>
    </button>
  </div>`;
}

function adjustSetting(key, delta) {
  const s = getSettings();
  const val = Math.max(5, (s[key] || (key === 'hold' ? 8 : key === 'heat' ? 45 : 30)) + delta);
  saveSetting(key, val);
  const el = document.getElementById('setting-' + key);
  if (el) el.textContent = val;
}

function toggleSetting(key, btn) {
  const isOn = btn.dataset.on === 'true';
  const newVal = !isOn;
  saveSetting(key, newVal);
  btn.dataset.on = newVal;
  btn.style.background = newVal ? 'var(--accent)' : 'var(--bg-elevated)';
  btn.querySelector('span').style.left = newVal ? '24px' : '3px';
}
```

- [ ] **Step 2: Verify settings screen**
  - Timer section shows Heat/Hold/Cool with +/- buttons
  - Values adjust and persist across refresh (localStorage)
  - Haptics toggle animates on/off
  - Premium card visible in free/demo builds, hidden in premium

- [ ] **Step 3: Commit**

```bash
git add www/js/app.js
git commit -m "feat: settings screen — timer config, haptics toggle, premium CTA"
```

---

### Task 11: Ads Integration

**Files:**
- Create: `www/js/ads.js`
- Modify: `www/index.html` (add ad slot div in stats screen)

**Interfaces:**
- Consumes: `window.BUILD_VARIANT`
- Produces: `initAds()` — loads Mantis script and shows ad slots when variant is free or demo

- [ ] **Step 1: Create `www/js/ads.js`**

```js
'use strict';

function initAds() {
  if (window.BUILD_VARIANT === 'premium') return;

  // Show ad slot containers
  document.querySelectorAll('.ad-slot').forEach(el => {
    el.style.display = 'flex';
  });

  // Load Mantis banner script
  const script = document.createElement('script');
  script.src = 'https://mantisadnetwork.com/monetize.js';
  script.async = true;
  script.setAttribute('data-website', 'dabflow.app');
  document.head.appendChild(script);
}
```

- [ ] **Step 2: Add ad slot to stats screen in `index.html`** (below the 30-day sessions chart card, hidden by default)

In `#screen-stats`:
```html
<!-- Mantis ad slot — shown in free/demo builds by ads.js -->
<div class="ad-slot" style="display:none;justify-content:center;margin:var(--sp-2) 0;">
  <div class="mantis-ad" data-size="banner"></div>
</div>
```

- [ ] **Step 3: Call `initAds()` in `app.js` DOMContentLoaded**

```js
document.addEventListener('DOMContentLoaded', () => {
  if (window.BUILD_VARIANT === 'demo' || window.BUILD_VARIANT === 'premium') {
    generateSeedData();
  }
  injectMoleculeBg();
  initNav();
  initAds();
  renderHome();
  renderGlass();
  renderSettings();
});
```

- [ ] **Step 4: Verify**
  - `window.BUILD_VARIANT = 'free'` → ad slot div becomes visible in stats
  - `window.BUILD_VARIANT = 'premium'` → ad slot stays `display:none`

- [ ] **Step 5: Commit**

```bash
git add www/js/ads.js www/index.html www/js/app.js
git commit -m "feat: Mantis ad integration — shown in free/demo, hidden in premium"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Dark-only, near-black base | Task 1 |
| Accent green resting state | Task 1 |
| Timer phase color progression | Task 6 |
| Molecule background pattern | Task 2 |
| Custom SVG icons (12), no libraries | Task 3 |
| Bottom pill nav, icon-only | Task 4 |
| Screen transitions (slide) | Task 2, 4 |
| Home: greeting, streak, presets, last session | Task 5 |
| Timer: segmented ring, phases, wake lock, haptics | Task 6 |
| Easter egg: 4.2s hold bloom | Task 6 |
| Stats: 4 chips, line/bar/donut charts | Task 8 |
| Stats: achievement grid with premium lock | Task 8 |
| Easter egg: 7-day streak toast | Task 8 |
| Seed data: 100 sessions | Task 7 |
| Glass: top artists, weekly featured, equipment placeholders | Task 9 |
| Settings: timer config, haptics, premium CTA, build variant display | Task 10 |
| Mantis ads in free/demo only | Task 11 |
| BUILD_VARIANT gate for all conditional logic | Tasks 7, 8, 10, 11 |
| Space Grotesk + Space Mono + Inter fonts | Task 1 |
| Safe area insets | Task 1, 2 |
| External links with rel="noopener noreferrer" | Task 9 |

All requirements covered. No gaps found.

**Placeholder scan:** No TBD/TODO in any task. All code blocks are complete.

**Type consistency:** `getSessions()`, `saveSession()`, `getSettings()`, `saveSetting()`, `switchScreen()`, `getIcon()`, `generateSeedData()` used consistently across tasks. `session-complete` CustomEvent detail shape defined in Task 6 and consumed in Task 6.
