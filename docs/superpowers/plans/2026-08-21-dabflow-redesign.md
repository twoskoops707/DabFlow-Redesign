# DabFlow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual/UX redesign of the DabFlow dab-timer PWA — 8 unlockable themes, SVG arc timer, 3-category home selector, age gate, Vapor Rise completion animation.

**Architecture:** CSS custom properties with `data-theme` attribute on `<html>` for theme switching; SVG arc replaces canvas ring; new `themes.js` and `age-gate.js` modules; Vapor Rise replaces old write-across completion animation.

**Tech Stack:** Vanilla JS, Capacitor 6.x, Chart.js 4.4.0, CSS custom properties, SVG inline timer arc, Google Fonts (Space Mono, Space Grotesk, Share Tech Mono, Cinzel).

**Spec:** `docs/superpowers/specs/2026-08-21-dabflow-redesign.md`

## Global Constraints

- localStorage key prefix: `dabflow2_`
- `window.BUILD_VARIANT` = `'free'` | `'premium'` (injected in index.html)
- Timer phase order unchanged: heat → hold → cool (formulas from MATERIAL_PRESETS)
- Completion animation: ONLY Vapor Rise — no other animations
- All themes: red arc `#EF4444` for heat, `#00C46A` for hold, theme-specific `--arc-cool` for cool
- Home screen: Material (drives formula) · Concentrate (logged only) · Heating Source (logged only, shown dim below pause btn)
- Premium builds: all 8 themes unlocked from install; free builds unlock via achievements
- SVG arc math: viewBox "0 0 100 100", r=44, circumference=276.46, 270° track=207.35, gap=69.11, `transform="rotate(135 50 50)"`
- Working directory: `/data/data/com.termux/files/home/DabFlow-Redesign`
- Target branch: `ui-redesign-modern`

---

### Task 1: CSS Foundation

**Files:**
- Modify: `www/css/design.css`
- Create: `www/css/themes.css`

**Interfaces:**
- Produces: CSS custom properties `--arc-heat`, `--arc-cool`, `--font-display` in `:root`; `[data-theme="X"]` selectors for all 8 themes that override these tokens

- [ ] **Step 1: Add missing tokens to design.css**

Open `www/css/design.css`. After the existing `:root { ... }` block, add or insert inside the existing block:

```css
  /* Arc timer colors */
  --arc-heat: #EF4444;
  --arc-cool: #5B9CF6;
  --arc-hold: #00C46A;

  /* Font display (overridden per theme) */
  --font-display-family: 'Space Grotesk', sans-serif;
```

Also fix the existing `--phase-heat` color from `#5B9CF6` to `#EF4444` (the old blue was wrong — heat is red).

- [ ] **Step 2: Create www/css/themes.css with all 8 themes**

Create the file with this exact content:

```css
/* ── DabFlow Theme Overrides ──────────────────────────────────────────────── */
/* Applied via data-theme attribute on <html>. Base tokens live in design.css. */

/* ── Default (always unlocked) — no overrides needed, uses base tokens ── */

/* ── Kush (1st session) ── */
[data-theme="kush"] {
  --bg-base:     #061209;
  --bg-surface:  #0C1F12;
  --bg-elevated: #132819;
  --accent:      #4ADE80;
  --arc-cool:    #4ADE80;
  --text-primary: #E8F5E9;
  --border:      rgba(74,222,128,0.12);
}

/* ── Terminal (10 sessions) ── */
[data-theme="terminal"] {
  --bg-base:       #000800;
  --bg-surface:    #001200;
  --bg-elevated:   #001A00;
  --accent:        #00FF41;
  --arc-cool:      #00FF41;
  --text-primary:  #00FF41;
  --text-secondary:rgba(0,255,65,0.7);
  --text-muted:    rgba(0,255,65,0.4);
  --border:        rgba(0,255,65,0.15);
  --font-display-family: 'Share Tech Mono', monospace;
}

/* Terminal scanline overlay */
[data-theme="terminal"] body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.15) 2px,
    rgba(0,0,0,0.15) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* Lift arc + UI above scanline overlay */
[data-theme="terminal"] #timer-ring-wrap,
[data-theme="terminal"] #timer-chips,
[data-theme="terminal"] #timer-fuel-label,
[data-theme="terminal"] #timer-controls {
  position: relative;
  z-index: 2;
}

/* ── Bond (7-day streak) ── */
[data-theme="bond"] {
  --bg-base:     #0B0B14;
  --bg-surface:  #111120;
  --bg-elevated: #1A1A2E;
  --accent:      #A0A0C8;
  --arc-cool:    #A0A0C8;
  --text-primary:#E8E8F5;
  --border:      rgba(160,160,200,0.12);
  --font-display-family: 'Cinzel', serif;
}

/* ── Cyberpunk (30 sessions) ── */
[data-theme="cyberpunk"] {
  --bg-base:     #030612;
  --bg-surface:  #06091E;
  --bg-elevated: #0A0E2A;
  --accent:      #00FFFF;
  --arc-cool:    #00FFFF;
  --text-primary:#E0F7FA;
  --border:      rgba(0,255,255,0.12);
}

/* ── Steampunk (50 sessions) ── */
[data-theme="steampunk"] {
  --bg-base:     #120A03;
  --bg-surface:  #1E1208;
  --bg-elevated: #2A1A0C;
  --accent:      #E8B84B;
  --arc-cool:    #E8B84B;
  --text-primary:#F5E6C8;
  --border:      rgba(232,184,75,0.15);
}

/* ── Tie Dye (75 sessions) ── */
[data-theme="tie-dye"] {
  --bg-base:     #0A0612;
  --bg-surface:  #130A1E;
  --bg-elevated: #1C1028;
  --accent:      #FF6B6B;
  --arc-cool:    #FF6B6B;
  --border:      rgba(255,107,107,0.15);
}

/* Rainbow hue-rotate on cool arc progress */
[data-theme="tie-dye"] .arc-progress {
  stroke: #FF6B6B;
  animation: tie-dye-arc 4s linear infinite;
}

@keyframes tie-dye-arc {
  to { filter: hue-rotate(360deg); }
}

/* ── Sugar Skull (100 sessions) ── */
[data-theme="sugar-skull"] {
  --bg-base:     #06000A;
  --bg-surface:  #100015;
  --bg-elevated: #1C0022;
  --accent:      #E91E8C;
  --arc-cool:    #00BCD4;
  --text-primary:#F3E5F5;
  --border:      rgba(233,30,140,0.15);
}
```

- [ ] **Step 3: Verify design.css has the arc token fix**

Open `www/css/design.css`, confirm `--arc-heat: #EF4444` and `--arc-cool: #5B9CF6` are present in `:root`.

- [ ] **Step 4: Commit**

```bash
cd /data/data/com.termux/files/home/DabFlow-Redesign
git add www/css/design.css www/css/themes.css
git commit -m "feat: add arc CSS tokens and 8-theme themes.css"
```

---

### Task 2: themes.js

**Files:**
- Create: `www/js/themes.js`

**Interfaces:**
- Consumes: `dabflow2_sessions` from localStorage, `dabflow2_active_theme` from localStorage, `window.BUILD_VARIANT`
- Produces: `window.THEMES` array, `window.isThemeUnlocked(theme)`, `window.setActiveTheme(id)`, `window.getActiveTheme()`, `window.initThemes()`, `window.checkThemeUnlocks()` — all globally available before DOMContentLoaded

- [ ] **Step 1: Create www/js/themes.js**

```javascript
'use strict';

const THEMES = [
  { id: 'default',     name: 'Default',     arcCool: '#5B9CF6', unlockType: 'always',   unlockVal: 0   },
  { id: 'kush',        name: 'Kush',        arcCool: '#4ADE80', unlockType: 'sessions', unlockVal: 1   },
  { id: 'terminal',    name: 'Terminal',    arcCool: '#00FF41', unlockType: 'sessions', unlockVal: 10  },
  { id: 'bond',        name: 'Bond',        arcCool: '#A0A0C8', unlockType: 'streak',   unlockVal: 7   },
  { id: 'cyberpunk',   name: 'Cyberpunk',   arcCool: '#00FFFF', unlockType: 'sessions', unlockVal: 30  },
  { id: 'steampunk',   name: 'Steampunk',   arcCool: '#E8B84B', unlockType: 'sessions', unlockVal: 50  },
  { id: 'tie-dye',     name: 'Tie Dye',     arcCool: null,      unlockType: 'sessions', unlockVal: 75  },
  { id: 'sugar-skull', name: 'Sugar Skull', arcCool: '#00BCD4', unlockType: 'sessions', unlockVal: 100 },
];

function _themeStreak() {
  const sessions = JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => new Date(s.ts).toDateString()));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function isThemeUnlocked(theme) {
  if (window.BUILD_VARIANT === 'premium') return true;
  if (theme.unlockType === 'always') return true;
  if (theme.unlockType === 'sessions') {
    const sessions = JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
    return sessions.length >= theme.unlockVal;
  }
  if (theme.unlockType === 'streak') {
    return _themeStreak() >= theme.unlockVal;
  }
  return false;
}

function getActiveTheme() {
  return localStorage.getItem('dabflow2_active_theme') || 'default';
}

function setActiveTheme(id) {
  const theme = THEMES.find(t => t.id === id);
  if (!theme || !isThemeUnlocked(theme)) return;
  localStorage.setItem('dabflow2_active_theme', id);
  document.documentElement.setAttribute('data-theme', id);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { id } }));
}

function checkThemeUnlocks() {
  // After a session completes, auto-unlock newly earned themes
  THEMES.forEach(theme => {
    if (isThemeUnlocked(theme)) {
      localStorage.setItem(`dabflow2_theme_unlocked_${theme.id}`, '1');
    }
  });
}

function initThemes() {
  const saved = getActiveTheme();
  const theme = THEMES.find(t => t.id === saved);
  // Fall back to default if saved theme not (yet) unlocked
  const activeId = (theme && isThemeUnlocked(theme)) ? saved : 'default';
  document.documentElement.setAttribute('data-theme', activeId);
}

// Apply theme immediately on script load (before DOMContentLoaded)
initThemes();
```

- [ ] **Step 2: Commit**

```bash
git add www/js/themes.js
git commit -m "feat: add themes.js with 8-theme registry and unlock logic"
```

---

### Task 3: age-gate.js

**Files:**
- Create: `www/js/age-gate.js`

**Interfaces:**
- Consumes: `dabflow2_age_verified` localStorage key
- Produces: shows/hides `#age-gate-overlay` div (which must exist in index.html)

- [ ] **Step 1: Create www/js/age-gate.js**

```javascript
'use strict';

function initAgeGate() {
  if (localStorage.getItem('dabflow2_age_verified')) return;
  const overlay = document.getElementById('age-gate-overlay');
  if (overlay) overlay.classList.add('show');
}

function ageGateConfirm() {
  localStorage.setItem('dabflow2_age_verified', '1');
  const overlay = document.getElementById('age-gate-overlay');
  if (overlay) overlay.classList.remove('show');
}

function ageGateDeny() {
  const overlay = document.getElementById('age-gate-overlay');
  const content = overlay ? overlay.querySelector('.age-gate-content') : null;
  if (content) {
    content.innerHTML = `
      <div style="font-size:2rem;margin-bottom:1rem;">🚫</div>
      <h2 style="font-family:var(--font-display-family);font-size:1.3rem;margin-bottom:0.75rem;">Adults Only</h2>
      <p style="color:var(--text-muted);font-size:0.85rem;">This app is for adults only.</p>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initAgeGate);
```

- [ ] **Step 2: Commit**

```bash
git add www/js/age-gate.js
git commit -m "feat: add age-gate.js first-launch age verification"
```

---

### Task 4: Vapor Rise animation

**Files:**
- Modify: `www/css/animations.css`

**Interfaces:**
- Produces: `.vapor-rise-overlay`, `.wisp`, `.va`/`.vb`/`.vc` animation classes; `@keyframes wisp-rise`; `.vapor-complete` text style

- [ ] **Step 1: Append Vapor Rise CSS to www/css/animations.css**

Add at the end of the file:

```css
/* ── Age gate overlay ── */
.age-gate-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0,0,0,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
}

.age-gate-overlay.show {
  opacity: 1;
  pointer-events: all;
}

.age-gate-content {
  text-align: center;
  padding: 2rem;
  max-width: 320px;
}

/* ── Vapor Rise completion overlay ── */
.vapor-rise-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 400ms ease;
  background: rgba(0,0,0,0.6);
}

.vapor-rise-overlay.show {
  opacity: 1;
  pointer-events: all;
}

.vapor-bg {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 260px;
  pointer-events: none;
}

.wisp {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.22), transparent 70%);
  filter: blur(6px);
}

.va {
  width: 70px;
  height: 90px;
  left: 10px;
  animation: wisp-a 3s ease-out infinite;
}

.vb {
  width: 90px;
  height: 110px;
  left: 35px;
  animation: wisp-b 3.5s ease-out 0.8s infinite;
}

.vc {
  width: 60px;
  height: 80px;
  left: 60px;
  animation: wisp-a 2.8s ease-out 1.6s infinite;
}

@keyframes wisp-a {
  0%   { opacity: 0; transform: translateY(0) scaleX(1); }
  12%  { opacity: 0.55; }
  70%  { opacity: 0.3; transform: translateY(-90px) scaleX(1.4); }
  100% { opacity: 0; transform: translateY(-130px) scaleX(1.6); }
}

@keyframes wisp-b {
  0%   { opacity: 0; transform: translateY(0) scaleX(1); }
  15%  { opacity: 0.45; }
  65%  { opacity: 0.25; transform: translateY(-80px) scaleX(1.3); }
  100% { opacity: 0; transform: translateY(-120px) scaleX(1.5); }
}

.vapor-text {
  position: relative;
  z-index: 2;
  text-align: center;
  margin-top: -80px;
}

.vapor-complete {
  font-family: 'Space Mono', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.08em;
  text-shadow: 0 0 20px rgba(255,255,255,0.3);
  margin-bottom: 1rem;
}
```

- [ ] **Step 2: Remove or keep old dab-complete-overlay CSS**

The old `.dab-complete-overlay` and `@keyframes write-across` and `.dab-complete-text` CSS in animations.css should be kept as dead CSS for now (it does no harm and `showDabCompleteAnimation` in timer.js will be replaced).

- [ ] **Step 3: Commit**

```bash
git add www/css/animations.css
git commit -m "feat: add Vapor Rise completion animation and age-gate overlay CSS"
```

---

### Task 5: timer.js SVG arc rewrite

**Files:**
- Modify: `www/js/timer.js`

**Interfaces:**
- Consumes: `#timer-ring-wrap` containing `.arc-progress` SVG circle (from index.html Task 6); `#timer-phase-label`; `#timer-display`; `#timer-material-chip`; `#timer-concentrate-chip`; `#timer-fuel-label`; `#vapor-rise-overlay`; `window._selectedMaterial`, `window._selectedConcentrate`, `window._selectedHeatingSource`
- Produces: `initTimer()`, `handleTimerBtn()`, `resetTimer()`, `showVaporRise()`, `dismissVaporRise()`, `selectRating()`, `saveSessionNotes()`, `skipSessionNotes()`, `editSessionByTs()` — all global

Arc math constants:
- Circumference: 276.46
- 270° track length: 207.35
- gap: 69.11
- Progress dasharray at fraction f: `"${(207.35*f).toFixed(2)} ${(276.46-207.35*f).toFixed(2)}"`

- [ ] **Step 1: Update PHASE_COLORS constant in timer.js (lines 3-7)**

Change:
```javascript
const PHASE_COLORS = {
  heat: '#5B9CF6',
  hold: '#F5A623',
  cool: '#2ECC8A',
};
```
To:
```javascript
const PHASE_COLORS = {
  heat: '#EF4444',
  hold: '#00C46A',
  cool: null,   // read from --arc-cool CSS variable at runtime
};
```

- [ ] **Step 2: Replace initTimer() (lines 28-53)**

Replace the entire `initTimer` function:
```javascript
function initTimer() {
  if (_timerState === 'idle') {
    drawRingIdle();
    updateTimerDisplay('--:--');
    updatePhaseLabel('');
  }
  _refreshTimerChips();
}

function _refreshTimerChips() {
  const matEl  = document.getElementById('timer-material-chip');
  const conEl  = document.getElementById('timer-concentrate-chip');
  const fuelEl = document.getElementById('timer-fuel-label');
  if (matEl)  matEl.textContent  = window._selectedMaterial      || '';
  if (conEl)  conEl.textContent  = window._selectedConcentrate   || '';
  if (fuelEl) fuelEl.textContent = window._selectedHeatingSource ? `via ${window._selectedHeatingSource}` : '';
}
```

- [ ] **Step 3: Replace _ringSetup, drawRingIdle, drawRingProgress with SVG versions**

Remove `_ringSetup`, `drawRingIdle`, `drawRingProgress` entirely. Replace with:

```javascript
const ARC_CIRC  = 276.46;
const ARC_TRACK = 207.35;

function _getArcProgress() {
  return document.querySelector('.arc-progress');
}

function drawRingIdle() {
  const arc = _getArcProgress();
  if (arc) {
    arc.setAttribute('stroke-dasharray', `0 ${ARC_CIRC}`);
    arc.setAttribute('stroke', PHASE_COLORS.heat);
  }
}

function _getCoolColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--arc-cool').trim() || '#5B9CF6';
}

function _getPhaseColor(phaseName) {
  if (phaseName === 'heat') return PHASE_COLORS.heat;
  if (phaseName === 'hold') return PHASE_COLORS.hold;
  return _getCoolColor();
}

function drawRingProgress(phaseIdx, progress) {
  if (!_phases.length) return;
  const arc = _getArcProgress();
  if (!arc) return;
  const phase   = _phases[phaseIdx];
  const filled  = Math.min(1, progress) * ARC_TRACK;
  const empty   = ARC_CIRC - filled;
  arc.setAttribute('stroke-dasharray', `${filled.toFixed(2)} ${empty.toFixed(2)}`);
  arc.setAttribute('stroke', _getPhaseColor(phase.name));
}
```

- [ ] **Step 4: Update updatePhaseLabel to accept and apply phase color**

Replace `updatePhaseLabel` (lines 140-143):
```javascript
function updatePhaseLabel(text, phaseName) {
  const el = document.getElementById('timer-phase-label');
  if (!el) return;
  el.textContent = text;
  if (phaseName === 'heat')      el.style.color = PHASE_COLORS.heat;
  else if (phaseName === 'hold') el.style.color = PHASE_COLORS.hold;
  else if (phaseName === 'cool') el.style.color = _getCoolColor();
  else                           el.style.color = '';
}
```

- [ ] **Step 5: Update all callers of updatePhaseLabel in timer.js to pass phaseName**

In `startTimer()` (line ~200): change `updatePhaseLabel(_phases[0].label)` → `updatePhaseLabel(_phases[0].label, _phases[0].name)`

In `timerTick()` (line ~235): change `updatePhaseLabel(_phases[_currentPhaseIdx].label)` → `updatePhaseLabel(_phases[_currentPhaseIdx].label, _phases[_currentPhaseIdx].name)`

In `resetTimer()` (line ~274): change `updatePhaseLabel('')` → `updatePhaseLabel('', '')`

- [ ] **Step 6: Replace completeSession and showDabCompleteAnimation with Vapor Rise**

Replace `completeSession` (lines 280-300):
```javascript
function completeSession() {
  clearInterval(_timerInterval);
  _timerInterval = null;
  _timerState    = 'complete';
  _wakeLock?.release().catch(() => {}); _wakeLock = null;

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Done';
  if (resetBtn) resetBtn.style.display = 'flex';

  updateTimerDisplay('Done', '');
  updatePhaseLabel('Complete', 'cool');
  if (_phases.length) drawRingProgress(_phases.length - 1, 1);

  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

  showVaporRise();
}
```

Replace `showDabCompleteAnimation` (lines 302-314) with:
```javascript
function showVaporRise() {
  const overlay = document.getElementById('vapor-rise-overlay');
  if (overlay) overlay.classList.add('show');
}

function dismissVaporRise() {
  const overlay = document.getElementById('vapor-rise-overlay');
  if (overlay) overlay.classList.remove('show');
  showSessionNotesPanel();
}
```

- [ ] **Step 7: Update saveSessionNotes to include concentrate + heatingSource**

In `saveSessionNotes`, update the CustomEvent dispatch to include new fields:
```javascript
window.dispatchEvent(new CustomEvent('session-complete', {
  detail: {
    ts:            _sessionStart || Date.now(),
    heat:          config.heat  || 0,
    hold:          config.hold  || 0,
    cool:          config.cool  || 0,
    material:      window._selectedMaterial      || 'Quartz',
    concentrate:   window._selectedConcentrate   || '',
    heatingSource: window._selectedHeatingSource || '',
    brand,
    strain,
    rating,
  },
}));
```

- [ ] **Step 8: Remove the timer-sub element reference (no longer in HTML)**

In `updateTimerDisplay(text, sub)`, the `#timer-sub` element is removed from the new HTML. Keep the function signature but make the sub update a no-op (safe — if element absent nothing happens). No code change needed since it already checks `if (subEl)`.

- [ ] **Step 9: Commit**

```bash
git add www/js/timer.js
git commit -m "feat: replace canvas ring with SVG arc, add Vapor Rise trigger"
```

---

### Task 6: index.html wiring

**Files:**
- Modify: `www/index.html`

**Interfaces:**
- Consumes: `www/css/themes.css`, `www/js/themes.js`, `www/js/age-gate.js` (new files from Tasks 1-3)
- Produces: `data-theme` on `<html>`; `#age-gate-overlay`; SVG arc `.arc-progress` and `.arc-track`; `#timer-material-chip`, `#timer-concentrate-chip`, `#timer-fuel-label`, `#timer-controls`; `#vapor-rise-overlay`; Google Fonts updated

- [ ] **Step 1: Add data-theme to <html> tag**

Change `<html lang="en">` → `<html lang="en" data-theme="default">`

- [ ] **Step 2: Update Google Fonts link to add Share Tech Mono + Cinzel**

Replace the existing Google Fonts `<link>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&family=Share+Tech+Mono&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Add themes.css link after animations.css**

After `<link rel="stylesheet" href="css/animations.css">`, add:
```html
<link rel="stylesheet" href="css/themes.css">
```

- [ ] **Step 4: Add age gate overlay div before #app**

After `<div id="molecule-bg" aria-hidden="true"></div>` and before `<div id="app">`, insert:
```html
<!-- Age gate — shown on first launch -->
<div id="age-gate-overlay" class="age-gate-overlay" aria-hidden="true">
  <div class="age-gate-content">
    <div style="font-size:2.5rem;margin-bottom:1rem;">🌿</div>
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-primary);">DabFlow</h2>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:2rem;">This app contains content for adults who use cannabis concentrates.</p>
    <button class="btn-primary" style="width:100%;margin-bottom:0.75rem;" onpointerdown="ageGateConfirm()">I am 21 or older</button>
    <button class="btn-ghost" style="width:100%;" onpointerdown="ageGateDeny()">I am under 21</button>
  </div>
</div>
```

- [ ] **Step 5: Replace canvas timer with SVG arc in screen-timer**

Replace the entire `<div id="timer-ring-wrap">` block (lines 47-63 of current index.html):

```html
<!-- SVG arc timer -->
<div id="timer-ring-wrap" class="arc-wrap" style="position:relative;width:80vw;max-width:300px;aspect-ratio:1;">
  <svg viewBox="0 0 100 100" fill="none" style="width:100%;height:100%;display:block;">
    <!-- Track ring (270°, gap at bottom) -->
    <circle class="arc-track" cx="50" cy="50" r="44"
      fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="207.35 69.11" transform="rotate(135 50 50)"/>
    <!-- Progress arc — color + dasharray updated by timer.js -->
    <circle class="arc-progress" cx="50" cy="50" r="44"
      fill="none" stroke="#EF4444" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="0 276.46" transform="rotate(135 50 50)"/>
  </svg>
  <!-- Center display -->
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <span id="timer-display" class="font-mono" style="font-size:2rem;color:var(--text-primary);line-height:1;">--:--</span>
  </div>
  <!-- Bloom easter egg -->
  <div id="timer-bloom" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:50%;"></div>
</div>

<!-- Material + Concentrate chips -->
<div id="timer-chips" style="display:flex;gap:0.75rem;margin-top:1rem;">
  <span id="timer-material-chip" style="
    font-family:'Space Mono',monospace;font-size:0.7rem;
    padding:0.25rem 0.75rem;border-radius:99px;
    background:rgba(255,255,255,0.07);color:var(--text-secondary);
    border:1px solid var(--border);
  "></span>
  <span id="timer-concentrate-chip" style="
    font-family:'Space Mono',monospace;font-size:0.7rem;
    padding:0.25rem 0.75rem;border-radius:99px;
    background:rgba(255,255,255,0.07);color:var(--text-secondary);
    border:1px solid var(--border);
  "></span>
</div>
```

- [ ] **Step 6: Update timer controls to add timer-controls wrapper and fuel label**

Replace the controls div (lines ~66-78):
```html
<!-- Controls -->
<div id="timer-controls" style="margin-top:var(--sp-10);display:flex;gap:var(--sp-4);align-items:center;">
  <button id="timer-reset-btn" onpointerdown="resetTimer()" style="
    width:48px;height:48px;border-radius:50%;border:1px solid var(--border);
    background:var(--bg-surface);color:var(--text-muted);cursor:pointer;
    display:none;align-items:center;justify-content:center;
  "></button>

  <button id="timer-start-btn" class="btn-primary"
    onpointerdown="handleTimerBtn()"
    style="min-width:120px;">
    Start
  </button>
</div>

<!-- Heating source dim label -->
<div id="timer-fuel-label" style="
  margin-top:0.5rem;font-size:0.68rem;
  color:var(--text-muted);opacity:0.5;letter-spacing:0.05em;
  font-family:'Space Mono',monospace;min-height:1rem;
"></div>
```

- [ ] **Step 7: Add Vapor Rise overlay before </body>**

After the `<!-- Session notes panel -->` block and before `<!-- Scripts -->`, add:
```html
<!-- Vapor Rise completion overlay -->
<div id="vapor-rise-overlay" class="vapor-rise-overlay" aria-hidden="true">
  <div class="vapor-bg">
    <div class="wisp va"></div>
    <div class="wisp vb"></div>
    <div class="wisp vc"></div>
  </div>
  <div class="vapor-text">
    <div class="vapor-complete">SESSION COMPLETE ✓</div>
    <button class="btn-primary" style="margin-top:1rem;min-width:140px;" onpointerdown="dismissVaporRise()">
      ADD NOTES
    </button>
  </div>
</div>
```

- [ ] **Step 8: Add themes.js + age-gate.js to script block**

After `<script src="js/icons.js"></script>` and before `<script src="js/strains.js"></script>`, add:
```html
<script src="js/themes.js"></script>
<script src="js/age-gate.js"></script>
```

- [ ] **Step 9: Commit**

```bash
git add www/index.html
git commit -m "feat: wire SVG arc, age gate, Vapor Rise overlay, themes into index.html"
```

---

### Task 7: app.js — home 3-category selector + settings theme picker

**Files:**
- Modify: `www/js/app.js`

**Interfaces:**
- Consumes: `THEMES`, `isThemeUnlocked`, `setActiveTheme` from themes.js; `switchScreen`, `initTimer` from app.js/timer.js
- Produces: `startSession()`, updated `renderHome()`, updated `renderSettings()`, updated session-complete handler

- [ ] **Step 1: Replace PRESETS with MATERIAL_PRESETS and add CONCENTRATES + HEATING_SOURCES**

Replace the `const PRESETS = [...]` block (lines 6-10) with:

```javascript
const MATERIAL_PRESETS = [
  { id: 'quartz',         label: 'Quartz',         heat: 45, hold: 8,  cool: 30 },
  { id: 'banger',         label: 'Banger',         heat: 55, hold: 10, cool: 45 },
  { id: 'titanium',       label: 'Titanium',       heat: 60, hold: 12, cool: 40 },
  { id: 'ceramic',        label: 'Ceramic',        heat: 50, hold: 10, cool: 35 },
  { id: 'quartz-thermal', label: 'Quartz Thermal', heat: 35, hold: 8,  cool: 25 },
];

const CONCENTRATES = [
  'Live Resin','Live Rosin','Shatter','Wax','Distillate',
  'Budder','Sauce','Diamonds','Hash','Other',
];

const HEATING_SOURCES = ['Torch','E-Nail','E-Rig','Induction Heater'];

let _homeMaterial      = 'Quartz';
let _homeConcentrate   = 'Live Resin';
let _homeHeatingSource = 'Torch';
```

- [ ] **Step 2: Add startSession() function after getWeeklyFeatured (after line ~194)**

```javascript
function startSession() {
  const preset = MATERIAL_PRESETS.find(p => p.label === _homeMaterial) || MATERIAL_PRESETS[0];
  window._selectedMaterial      = _homeMaterial;
  window._selectedConcentrate   = _homeConcentrate;
  window._selectedHeatingSource = _homeHeatingSource;
  window._timerConfig           = { heat: preset.heat, hold: preset.hold, cool: preset.cool };
  switchScreen('timer');
  setTimeout(initTimer, 50);
}
```

- [ ] **Step 3: Replace renderHome() (lines 107-161) with 3-category picker version**

```javascript
function renderHome() {
  const streak      = getStreak();
  const lastSession = getSessions().slice(-1)[0];
  const el          = document.getElementById('screen-home');
  if (!el) return;

  const lastSessionHTML = lastSession ? (() => {
    const meta = [lastSession.brand, lastSession.concentrate || lastSession.strain].filter(Boolean).join(' · ');
    return `
      <p class="section-title" style="margin-bottom:var(--sp-3);">Last Session</p>
      <div class="card fade-up" style="margin-bottom:var(--sp-6);">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);">
          <div style="flex:1;min-width:0;">
            <div class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${lastSession.material || 'Session'}</div>
            <div class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${meta || formatRelTime(lastSession.ts)}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-3);flex-shrink:0;">
            ${lastSession.rating ? `<span style="font-size:var(--font-lg);color:var(--accent);">${'★'.repeat(lastSession.rating)}</span>` : ''}
            <button onpointerdown="editSessionByTs(${lastSession.ts})"
              style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:var(--sp-2);-webkit-tap-highlight-color:transparent;">
              ${getIcon('edit', 18)}
            </button>
          </div>
        </div>
      </div>`;
  })() : '';

  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);margin-bottom:var(--sp-4);">
        <p class="font-body" style="font-size:var(--font-sm);color:var(--text-muted);">Good ${getTimeOfDay()}</p>
        <h1 class="font-display" style="font-size:var(--font-3xl);font-weight:700;color:var(--text-primary);line-height:1.1;">DabFlow</h1>
        ${streak > 0 ? `<p class="font-mono" style="font-size:var(--font-sm);color:var(--accent);margin-top:var(--sp-2);">Day ${streak}</p>` : ''}
      </div>

      ${lastSessionHTML}

      <!-- Material selector -->
      <p class="section-title" style="margin-bottom:var(--sp-3);">Material</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);margin-bottom:var(--sp-5);">
        ${MATERIAL_PRESETS.map(p => `
          <button id="mat-${p.id}" onpointerdown="selectMaterial('${p.label}')"
            style="
              padding:var(--sp-3) var(--sp-2);border-radius:var(--r-md);
              border:1px solid ${_homeMaterial === p.label ? 'var(--accent)' : 'var(--border)'};
              background:${_homeMaterial === p.label ? 'rgba(var(--accent-rgb,46,204,138),0.1)' : 'var(--bg-surface)'};
              color:${_homeMaterial === p.label ? 'var(--accent)' : 'var(--text-secondary)'};
              font-family:'Space Grotesk',sans-serif;font-size:0.7rem;font-weight:600;
              cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;
            ">
            ${p.label}
          </button>`).join('')}
      </div>

      <!-- Concentrate selector -->
      <p class="section-title" style="margin-bottom:var(--sp-3);">Concentrate</p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-5);">
        ${CONCENTRATES.map(c => `
          <button onpointerdown="selectConcentrate('${c}')"
            style="
              padding:var(--sp-2) var(--sp-3);border-radius:99px;
              border:1px solid ${_homeConcentrate === c ? 'var(--accent)' : 'var(--border)'};
              background:${_homeConcentrate === c ? 'rgba(var(--accent-rgb,46,204,138),0.1)' : 'var(--bg-surface)'};
              color:${_homeConcentrate === c ? 'var(--accent)' : 'var(--text-secondary)'};
              font-family:'Space Mono',monospace;font-size:0.65rem;
              cursor:pointer;-webkit-tap-highlight-color:transparent;
            ">
            ${c}
          </button>`).join('')}
      </div>

      <!-- Heating Source selector -->
      <p class="section-title" style="margin-bottom:var(--sp-3);">Heating Source</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-2);margin-bottom:var(--sp-6);">
        ${HEATING_SOURCES.map(h => `
          <button onpointerdown="selectHeatingSource('${h}')"
            style="
              padding:var(--sp-3);border-radius:var(--r-md);
              border:1px solid ${_homeHeatingSource === h ? 'var(--accent)' : 'var(--border)'};
              background:${_homeHeatingSource === h ? 'rgba(var(--accent-rgb,46,204,138),0.1)' : 'var(--bg-surface)'};
              color:${_homeHeatingSource === h ? 'var(--accent)' : 'var(--text-secondary)'};
              font-family:'Space Grotesk',sans-serif;font-size:0.75rem;font-weight:600;
              cursor:pointer;-webkit-tap-highlight-color:transparent;
            ">
            ${h}
          </button>`).join('')}
      </div>

      <!-- Start button -->
      <button class="btn-primary fade-up" style="width:100%;font-size:1rem;padding:var(--sp-4);" onpointerdown="startSession()">
        START SESSION
      </button>
    </div>`;

  staggerCards(el);
}

function selectMaterial(label) {
  _homeMaterial = label;
  renderHome();
}

function selectConcentrate(label) {
  _homeConcentrate = label;
  renderHome();
}

function selectHeatingSource(label) {
  _homeHeatingSource = label;
  renderHome();
}
```

- [ ] **Step 4: Add themePickerHTML() helper and update renderSettings() to include theme section**

Add before `renderSettings()`:
```javascript
function themePickerHTML() {
  if (typeof THEMES === 'undefined') return '';
  const active = document.documentElement.getAttribute('data-theme') || 'default';
  return `
    <p class="section-title">Themes</p>
    <div class="card" style="margin-bottom:var(--sp-4);">
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);">
          ${THEMES.map(theme => {
            const unlocked = isThemeUnlocked(theme);
            const isActive = theme.id === active;
            const swatch   = theme.arcCool
              ? theme.arcCool
              : 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';
            return `<button
              onpointerdown="${unlocked ? `setActiveTheme('${theme.id}');renderSettings()` : ''}"
              style="
                padding:var(--sp-3) var(--sp-2);border-radius:var(--r-md);
                border:2px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
                background:var(--bg-elevated);cursor:${unlocked ? 'pointer' : 'default'};
                opacity:${unlocked ? 1 : 0.4};
                display:flex;flex-direction:column;align-items:center;gap:var(--sp-1);
                position:relative;-webkit-tap-highlight-color:transparent;
              ">
              <span style="
                width:18px;height:18px;border-radius:50%;
                background:${swatch};display:block;flex-shrink:0;
              "></span>
              <span class="font-display" style="font-size:0.55rem;color:var(--text-secondary);text-align:center;line-height:1.2;">${theme.name}</span>
              ${!unlocked ? `<span style="position:absolute;top:3px;right:3px;font-size:0.5rem;color:var(--text-muted);">${getIcon ? getIcon('lock',8) : '🔒'}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}
```

In `renderSettings()`, after the existing `<p class="section-title">Timer</p>` card, add `${themePickerHTML()}` as the first section:

Change the `el.innerHTML` template — insert `${themePickerHTML()}` before the `<p class="section-title">Timer</p>` line.

- [ ] **Step 5: Update session-complete event handler to call checkThemeUnlocks**

In the `window.addEventListener('session-complete', ...)` block (lines ~354-357), after `saveSession(e.detail)`, add:
```javascript
if (typeof checkThemeUnlocks === 'function') checkThemeUnlocks();
```

- [ ] **Step 6: Remove old startPreset() function (replaced by startSession())**

Delete the `startPreset` function (lines ~94-105) since it's no longer used.

- [ ] **Step 7: Commit**

```bash
git add www/js/app.js
git commit -m "feat: 3-category home selector, startSession, theme picker in settings"
```

---

### Task 8: stats.js — theme unlock in achievements

**Files:**
- Modify: `www/js/stats.js`

**Interfaces:**
- Consumes: `THEMES`, `isThemeUnlocked` from themes.js (globals); `calcBestStreak(sessions)` (local)
- Produces: extended `renderAchievements()` that appends a Themes subsection

- [ ] **Step 1: Update renderAchievements to include theme progress**

Find `renderAchievements` (line 314). Replace the entire function:

```javascript
function renderAchievements(sessions) {
  const ACHIEVEMENTS = [
    { id: 'first',    label: 'First Dab',    check: s => s.length >= 1 },
    { id: 'ten',      label: '10 Sessions',  check: s => s.length >= 10 },
    { id: 'fifty',    label: '50 Sessions',  check: s => s.length >= 50 },
    { id: 'hundred',  label: '100 Sessions', check: s => s.length >= 100 },
    { id: 'streak7',  label: '7-Day Streak', check: s => calcBestStreak(s) >= 7 },
    { id: 'streak30', label: '30-Day Streak',check: s => calcBestStreak(s) >= 30 },
  ];

  const achHTML = ACHIEVEMENTS.map(a => {
    const unlocked = a.check(sessions);
    return `<div class="chip" style="opacity:${unlocked ? 1 : 0.4};">
      <span style="color:${unlocked ? 'var(--accent)' : 'var(--text-muted)'};">${getIcon(unlocked ? 'check' : 'lock', 16)}</span>
      <span class="font-display" style="font-size:var(--font-xs);color:var(--text-secondary);margin-top:var(--sp-1);">${a.label}</span>
    </div>`;
  }).join('');

  // Theme unlock progress
  let themeHTML = '';
  if (typeof THEMES !== 'undefined') {
    const streak = calcBestStreak(sessions);
    themeHTML = `
      <div style="grid-column:1/-1;margin-top:var(--sp-4);">
        <p class="section-title" style="margin-bottom:var(--sp-3);">Themes</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);">
          ${THEMES.map(theme => {
            let unlocked;
            if (window.BUILD_VARIANT === 'premium') unlocked = true;
            else if (theme.unlockType === 'always') unlocked = true;
            else if (theme.unlockType === 'sessions') unlocked = sessions.length >= theme.unlockVal;
            else if (theme.unlockType === 'streak') unlocked = streak >= theme.unlockVal;
            else unlocked = false;

            const swatch = theme.arcCool
              ? theme.arcCool
              : 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';
            const hint = !unlocked
              ? (theme.unlockType === 'sessions'
                  ? `${theme.unlockVal} sess.`
                  : theme.unlockType === 'streak'
                    ? `${theme.unlockVal}-day`
                    : '')
              : '';
            return `<div class="chip" style="opacity:${unlocked ? 1 : 0.4};flex-direction:column;gap:var(--sp-1);align-items:center;padding:var(--sp-2);">
              <span style="width:14px;height:14px;border-radius:50%;background:${swatch};display:block;flex-shrink:0;"></span>
              <span class="font-display" style="font-size:0.55rem;color:${unlocked ? 'var(--text-secondary)' : 'var(--text-muted)'};text-align:center;line-height:1.2;">${theme.name}</span>
              ${!unlocked && hint ? `<span class="font-mono" style="font-size:0.5rem;color:var(--text-muted);">${hint}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  return achHTML + themeHTML;
}
```

- [ ] **Step 2: Commit**

```bash
git add www/js/stats.js
git commit -m "feat: add theme unlock progress in stats achievements"
```

---

### Task 9: Git push to GitHub

**Files:** None (git operation)

- [ ] **Step 1: Verify all files are committed**

```bash
cd /data/data/com.termux/files/home/DabFlow-Redesign
git status
git log --oneline -10
```

Expected: clean working tree, all new commits visible.

- [ ] **Step 2: Push to ui-redesign-modern branch**

```bash
git push origin ui-redesign-modern
```

- [ ] **Step 3: Confirm push succeeded**

```bash
git log --oneline -5 origin/ui-redesign-modern 2>/dev/null || echo "check GitHub"
```

---

## Self-Review Against Spec

**Spec section → Task coverage:**
- 8 themes with data-theme CSS: ✅ Task 1 (themes.css) + Task 2 (themes.js)
- SVG arc timer (270°, heat red / cool theme / hold green): ✅ Task 5 (timer.js) + Task 6 (index.html)
- 3-category home selector: ✅ Task 7 (app.js renderHome)
- Age gate: ✅ Task 3 (age-gate.js) + Task 6 (index.html)
- Vapor Rise completion animation only: ✅ Task 4 (animations.css) + Task 5 (timer.js)
- Theme unlock conditions (sessions + streak): ✅ Task 2 (themes.js isThemeUnlocked)
- Premium = all unlocked: ✅ Task 2 (BUILD_VARIANT check)
- Heating source dim below pause btn: ✅ Task 6 (index.html) + Task 5 (timer.js _refreshTimerChips)
- Material + Concentrate chips on timer: ✅ Task 5 + Task 6
- Settings theme picker: ✅ Task 7 (themePickerHTML)
- Stats achievements with theme progress: ✅ Task 8
- Icons: SVGs already created (icon-a.svg, icon-b.svg, icon-c.svg). PNG export not automated — defer to CI.
- data-theme on html: ✅ Task 6
- localStorage prefix dabflow2_: ✅ all tasks use correct prefix
- concentrate field added to session-complete event: ✅ Task 5 (saveSessionNotes)
- heatingSource logged to session: ✅ Task 5

**Placeholder scan:** None found — all steps have specific code.

**Type consistency:** `THEMES` array defined in themes.js, consumed in app.js and stats.js via globals (loaded before those scripts). `isThemeUnlocked(theme)` takes full theme object — consistent in all callers.
