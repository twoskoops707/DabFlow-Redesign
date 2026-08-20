# DabFlow 2.0 — Design Spec
**Date:** 2026-08-20
**Status:** Approved

---

## Overview

Complete ground-up redesign of DabFlow. No visual or structural carry-over from v1. Clean, techie, premium daily-driver feel with hidden cannabis personality — molecule geometry in backgrounds, behavior-triggered easter eggs, no overt leaf imagery.

Three APK variants built on every CI run, all from the same codebase via a build flag.

---

## Build Variants

| Variant | Ads | Seed Data | APK name |
|---------|-----|-----------|----------|
| `free` | Mantis ads | Empty (fresh install) | `DabFlow-free.apk` |
| `demo` | Mantis ads | 100 stat points pre-seeded | `DabFlow-demo.apk` |
| `premium` | No ads | 100 stat points pre-seeded | `DabFlow-premium.apk` |

Build flag injected at CI time via a JS constant: `window.BUILD_VARIANT = 'free' | 'demo' | 'premium'`.  
Ad container shown/hidden and seed data injected based on this flag.

---

## Visual Design System

### Color Palette

```
--bg-base:        #080A0C   /* near-black, primary surface */
--bg-surface:     #0F1215   /* cards, pill nav */
--bg-elevated:    #161B1F   /* modals, popovers */

--accent:         #2ECC8A   /* desaturated green — resting state, active icons */
--accent-dim:     rgba(46,204,138,0.12)

/* Timer phase colors */
--phase-heat:     #5B9CF6   /* blue-white — loading/heat */
--phase-hold:     #F5A623   /* amber — active/peak */
--phase-cool:     #2ECC8A   /* green — cool-down (matches accent) */

--text-primary:   #F0F4F8
--text-secondary: #8A9BAE
--text-muted:     #4A5568

--border:         rgba(255,255,255,0.06)
```

### Typography

All fonts loaded from Google Fonts. No icon font libraries.

| Role | Font | Usage |
|------|------|-------|
| Display | Space Grotesk | Screen titles, headings, card labels |
| Numbers | Space Mono | Timer digits, stat numbers, all numeric readouts |
| Body | Inter | Descriptions, settings text, body copy |

### Background Texture

SVG terpene molecule pattern (hexagonal carbon chains, benzene ring motif) rendered as inline `<svg>` at `position: fixed`, `opacity: 0.035`, `z-index: 0`, pointer-events none. Visible only when the screen is still. Looks like a scientific substrate — cannabis DNA without being obvious.

### Iconography

All icons are custom SVG, drawn specifically for this app. Zero Font Awesome, zero emoji, zero stock libraries.

Required icons (5 nav + feature icons):
- Home (flame/drop hybrid)
- Timer (arc ring)
- Stats (bar pulse)
- Glass (rig silhouette)
- Settings (molecule gear — cross between gear and carbon ring)
- Plus/add, chevrons, lock, crown (premium indicator)

All at 24×24 viewBox, 1.5px stroke, rounded line caps, no fill.

---

## Navigation

**Bottom pill** — a single frosted-dark pill centered at the bottom of the screen, `border-radius: 999px`, containing 5 icon buttons. No labels. No borders on the pill itself — just the surface color.

- Active icon: `--accent` color stroke
- Inactive: `--text-muted`
- Tap feedback: brief scale pulse (0.85 → 1.0, 120ms)
- The pill sits above the Android nav bar with proper safe-area inset

Screen transitions: horizontal slide (CSS transform, 280ms ease-in-out).

---

## Screens

### 1. Home

Quick-start focused. Not a dashboard — just enough to start fast.

- Top: greeting + current streak (e.g. "Day 14") in Space Grotesk
- Center: 3 preset cards (Quartz / Banger / Custom) — tap to jump straight to timer with those settings loaded
- Below: last session summary card (material, time, rating)
- Bottom: pill nav

### 2. Timer

Full-screen focus. Nothing else visible while running.

**Resting state:**
- Large segmented ring, center screen, 80% of screen width
- 3 arc segments separated by 4px gaps: Heat (left 1/3) / Hold (top 1/3) / Cool (right 1/3)
- All segments dimmed (`--border` color) until activated
- Space Mono number in center: `--:--`
- Single START button below ring

**Running state:**
- Segments light up in sequence as each phase begins, using phase colors
- Ring segment fills clockwise within each arc as time passes
- Center number counts down in real time
- Haptic pulse at each phase transition
- Screen stays on (wake lock)

**Easter egg:** Hold START for 4.2 seconds before starting → molecule bloom animation radiates from ring center, dissolves in 1.2s, then timer starts normally.

**Phase config** (editable in Settings):
- Heat time, Hold time, Cool time (in seconds)
- These drive the 3 arc segments proportionally

### 3. Stats

Modernized versions of all original stat types. No new stat categories — same data, better presentation.

**Layout:** Vertical scroll, card-per-section.

Sections:
1. **Overview row** — 4 stat chips: Total Sessions / Total Time / Current Streak / Best Streak. Space Mono numbers, Space Grotesk labels.
2. **Sessions over time** — Line chart, 30-day window. Smooth curve, `--accent` stroke, no fill.
3. **Time distribution** — Horizontal bar chart by hour of day. Shows when the user typically sessions.
4. **Material breakdown** — Donut chart. Segments per material type.
5. **Temperature preference** — Scatter plot: heat temp (x) vs rating (y).
6. **Achievements** — Grid of milestone cards, locked/unlocked state.

**Chart implementation:** Chart.js (already in codebase). All charts styled to match design system (dark bg, `--accent` primary color, `--text-muted` gridlines).

**Demo/Premium seed data:** 100 stat entries spread across 90 days, varied materials, realistic time distribution (evenings weighted), ratings 3–5. Generated at app init if `BUILD_VARIANT !== 'free'` and localStorage is empty.

**Premium lock:** Achievements section blurred + lock overlay in free/demo builds. One upsell moment only.

**Easter egg:** 7-day streak achieved → small cheeky message appears below the streak chip for 3 seconds ("you've been consistent 👀" — using plain text, no emoji in regular UI, this is the exception).

### 4. Glass / Equipment

Two sections: **Glass Artists** (populated) + **Equipment** (2 blank cards, affiliate-ready).

**Top Artists** (permanent, 5 cards in a 2-col grid):
- Mr Gray Glass — instagram.com/mrgrayglass — Master Glass Artist
- Tristan Hodges — instagram.com/tristanhodgesglass — Elite Functional Art
- Chachi Rodriguez — instagram.com/chachierodriguez — Innovative Heady Glass
- Jesse ESP — instagram.com/espglass — Premium Glass Art
- Mobius Glass — mobiusglass.com — San Luis Obispo, CA

**Featured This Week** (weekly rotation, seeded by week number, shows 4 of 10):
Banjo (OR), Mothership Glass (WA), Joaquim Glass (Berkeley CA), BAGI (Bay Area),
Invest In Headies (Bay Area Gallery), Jason Stropko (SF Bay Area),
Sovereignty Glass (CA), Toro Glass (CA), Humboldt Glassblowers (Arcata CA), Glass Garage (Eureka CA)

Card design: artist name + location + Instagram/site link. No emoji. Custom "link-out" SVG icon.
Tap opens external link. Cards have subtle accent border on hover/press.

**Equipment** (2 blank product cards at bottom of screen):
- Styled identically to artist cards
- Show "Coming Soon" label in accent color
- Affiliate link slot already in data structure, empty for now
- Layout: 2-col grid matching artist card grid

### 5. Settings

- Timer defaults (heat / hold / cool times)
- Material presets (Quartz, Banger, Titanium, Custom)
- Theme toggle (single theme for now — dark only)
- Haptics on/off
- Sound on/off
- Upgrade to Premium CTA (free/demo only) — minimal, not aggressive
- App version + build variant displayed at bottom

---

## Ads (Free & Demo variants only)

Ad network: **Mantis**. Loaded via Mantis script tag.

- One banner ad at bottom of Stats screen, above pill nav
- One interstitial shown after every 5th completed session
- Ad containers have `display: none` in premium builds (BUILD_VARIANT check)

No ads on Timer screen — never interrupt the session experience.

---

## GitHub Actions — 3 APK Builds

Single workflow, 3 parallel jobs sharing the same build steps, each injecting a different BUILD_VARIANT.

Build steps per variant:
1. `npm install`
2. `npx cap add android`
3. Inject `window.BUILD_VARIANT = '<variant>'` into `www/index.html`
4. `npx cap sync android`
5. `./gradlew assembleDebug`
6. Upload APK to GitHub Release as `DabFlow-<variant>.apk`

All 3 APKs attached to the same release, tagged `v2.0.0-<run_number>`.

---

## File Structure

```
www/
  index.html          # single HTML shell
  css/
    design.css        # design system (colors, type, layout)
    components.css    # pill nav, cards, ring timer, charts
    animations.css    # transitions, easter egg animations
  js/
    app.js            # core logic, screen switching, state
    timer.js          # timer engine, phase management, wake lock
    stats.js          # stat calculations, chart rendering
    seed-data.js      # 100-point demo dataset
    ads.js            # Mantis ad integration
    icons.js          # SVG icon definitions (inline)
  icons/
    *.svg             # source SVG files for all custom icons
```

---

## What This Is Not

- No framework (React, Vue, etc.) — vanilla JS, same as v1
- No tab bar
- No Font Awesome or any icon library
- No visible cannabis leaf imagery
- No light mode (dark only for now)
- No iOS build (Android only for this sprint)
