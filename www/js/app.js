'use strict';

const NAV_ICONS = ['home', 'timer', 'stats', 'glass', 'settings'];
let currentScreen = 'home';

const MATERIAL_PRESETS = [
  { id: 'quartz',   label: 'Quartz',   heat: 18, cool: 60 },
  { id: 'titanium', label: 'Titanium', heat: 15, cool: 70 },
  { id: 'ceramic',  label: 'Ceramic',  heat: 20, cool: 75 },
];

// cool-time modifiers per concentrate (matches original app)
const CONCENTRATE_MOD = {
  'Shatter':    1.00, 'Wax':      0.93, 'Live Resin': 1.05,
  'Rosin':      1.08, 'Diamonds': 1.15, 'Crumble':    0.95,
  'Budder':     0.97, 'Sauce':    1.10, 'Hash Rosin': 1.12,
  'Distillate': 0.90,
};

// heat and cool modifiers per heating source (matches original app)
const HEATER_MOD = {
  'Butane':  { heat: 1.1, cool: 1.0  },
  'Propane': { heat: 1.0, cool: 0.95 },
};

const CONCENTRATES = [
  'Shatter','Wax','Live Resin','Rosin','Diamonds',
  'Crumble','Budder','Sauce','Hash Rosin','Distillate',
];

const HEATING_SOURCES = ['Butane', 'Propane'];

// ─────────────────────────────────────────────────────────────────────────────

let _homeMaterial      = 'Quartz';
let _homeConcentrate   = 'Shatter';
let _homeHeatingSource = 'Butane';
let _bangerThickness   = 3.0; // mm — physics: thermal mass ∝ wall thickness

const BANGER_LABELS = { 2:'Thin', 2.5:'Thin+', 3:'Standard', 3.5:'Solid', 4:'Thick', 4.5:'Premium', 5:'Thermal' };
const BANGER_STOPS  = [2, 2.5, 3, 3.5, 4, 4.5, 5];

// Lightweight update — avoids full re-render so slider stays smooth
function setBangerThickness(val) {
  _bangerThickness = parseFloat(val);
  const lbl = document.getElementById('banger-label');
  if (lbl) lbl.textContent = `${_bangerThickness}mm · ${BANGER_LABELS[_bangerThickness] || ''}`;
  BANGER_STOPS.forEach((t, i) => {
    const el = document.getElementById(`banger-stop-${i}`);
    if (!el) return;
    el.style.borderColor = t === _bangerThickness ? 'var(--accent)' : 'rgba(255,255,255,0.18)';
    el.style.transform   = t === _bangerThickness ? 'scaleY(1.18)' : 'scaleY(1)';
  });
  const cfg = calcTimerConfig();
  const heatEl = document.getElementById('home-preview-heat');
  const coolEl = document.getElementById('home-preview-cool');
  if (heatEl) heatEl.textContent = cfg.heat + 's';
  if (coolEl) coolEl.textContent = cfg.cool + 's';
  // Update delta line
  const deltaEl = document.getElementById('banger-delta');
  if (deltaEl) {
    const base = calcTimerConfigBase();
    const dh = cfg.heat - base.heat, dc = cfg.cool - base.cool;
    deltaEl.textContent = (dh === 0 && dc === 0)
      ? '3mm standard baseline'
      : `${dh > 0 ? '+' : ''}${dh}s heat · ${dc > 0 ? '+' : ''}${dc}s cool vs standard`;
    deltaEl.style.color = _bangerThickness > 3 ? 'var(--accent)' : _bangerThickness < 3 ? '#F59E0B' : 'var(--text-muted)';
  }
}

function staggerCards(container) {
  if (!container) return;
  Array.from(container.querySelectorAll('.fade-up')).forEach((card, i) => {
    card.style.animationDelay = `${i * 55}ms`;
  });
}

function switchScreen(name) {
  const prev = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + name);
  if (!next || currentScreen === name) return;

  if (prev) {
    prev.classList.add('exit-left');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('exit-left'), 320);
  }

  next.classList.add('active');
  currentScreen = name;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.dataset.screen === name;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.classList.remove('nav-tap');
      void btn.offsetWidth;
      btn.classList.add('nav-tap');
      btn.addEventListener('animationend', () => btn.classList.remove('nav-tap'), { once: true });
    }
  });

  if (name === 'timer') setTimeout(initTimer, 50);
  if (name === 'stats') setTimeout(renderStats, 50);
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.innerHTML = getIcon(btn.dataset.screen, 22);
  });
}

function getSessions() {
  return JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
}

function saveSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('dabflow2_sessions', JSON.stringify(sessions));
}

function getStreak() {
  const sessions = getSessions();
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => new Date(s.ts).toDateString()));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
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

// Base config at 3mm standard (used for delta display)
function calcTimerConfigBase() {
  const preset = MATERIAL_PRESETS.find(p => p.label === _homeMaterial) || MATERIAL_PRESETS[0];
  const heater = HEATER_MOD[_homeHeatingSource] || { heat: 1.0, cool: 1.0 };
  const cMod   = CONCENTRATE_MOD[_homeConcentrate] || 1.0;
  return {
    heat: Math.min(35, Math.round(preset.heat * heater.heat)),
    cool: Math.min(110, Math.max(35, Math.round(preset.cool * heater.cool * cMod))),
  };
}

// Piecewise linear offset: below 3mm loses time, above gains time
// Heat: 2mm=-3s … 3mm=0 … 5mm=+8s | Cool: 2mm=-8s … 3mm=0 … 5mm=+14s
function bangerOffset(t) {
  if (t <= 3) {
    const f = (t - 2); // 0→1 across 2–3mm
    return { dHeat: Math.round(-3 + f * 3), dCool: Math.round(-8 + f * 8) };
  } else {
    const f = (t - 3) / 2; // 0→1 across 3–5mm
    return { dHeat: Math.round(f * 8), dCool: Math.round(f * 14) };
  }
}

function calcTimerConfig() {
  const base           = calcTimerConfigBase();
  const { dHeat, dCool } = bangerOffset(_bangerThickness);
  return {
    heat: Math.max(5,  base.heat + dHeat),
    cool: Math.max(25, base.cool + dCool),
  };
}

function startSession() {
  window._selectedMaterial      = _homeMaterial;
  window._selectedConcentrate   = _homeConcentrate;
  window._selectedHeatingSource = _homeHeatingSource;
  window._bangerThickness       = _bangerThickness;
  window._timerConfig           = calcTimerConfig();
  window._autoStartTimer        = true;
  switchScreen('timer');
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

function renderHome() {
  const streak = getStreak();
  const el     = document.getElementById('screen-home');
  if (!el) return;

  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);margin-bottom:var(--sp-4);">
        <p class="font-body" style="font-size:var(--font-sm);color:var(--text-muted);">Good ${getTimeOfDay()}</p>
        <h1 class="font-display" style="font-size:var(--font-3xl);font-weight:700;color:var(--text-primary);line-height:1.1;">DabFlow</h1>
        ${streak > 0 ? `<div style="margin-top:var(--sp-2);"><span class="font-mono" style="font-size:var(--font-xs);color:var(--accent);">🔥 Day ${streak}</span></div>` : ''}
      </div>

      <!-- Material selector -->
      <p class="section-title" style="margin-bottom:var(--sp-3);">Material</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-3);margin-bottom:var(--sp-5);">
        ${MATERIAL_PRESETS.map(p => `
          <button onpointerdown="selectMaterial('${p.label}')"
            style="
              padding:var(--sp-4) var(--sp-2);border-radius:var(--r-md);
              border:1px solid ${_homeMaterial === p.label ? 'var(--accent)' : 'var(--border)'};
              background:${_homeMaterial === p.label ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface)'};
              color:${_homeMaterial === p.label ? 'var(--accent)' : 'var(--text-secondary)'};
              font-family:'Space Grotesk',sans-serif;font-size:0.75rem;font-weight:600;
              cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;
            ">
            ${p.label}
          </button>`).join('')}
      </div>

      <!-- Concentrate selector -->
      <p class="section-title" style="margin-bottom:var(--sp-3);">Concentrate</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);margin-bottom:var(--sp-5);">
        ${CONCENTRATES.map(c => `
          <button onpointerdown="selectConcentrate('${c}')"
            style="
              padding:var(--sp-3) var(--sp-2);border-radius:var(--r-md);
              border:1px solid ${_homeConcentrate === c ? 'var(--accent)' : 'var(--border)'};
              background:${_homeConcentrate === c ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface)'};
              color:${_homeConcentrate === c ? 'var(--accent)' : 'var(--text-secondary)'};
              font-family:'Space Mono',monospace;font-size:0.7rem;
              cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;
              display:flex;align-items:center;justify-content:center;min-height:44px;
            ">
            ${c}
          </button>`).join('')}
      </div>

      <!-- Heating Source selector -->
      <p class="section-title" style="margin-bottom:var(--sp-3);">Heating Source</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-3);margin-bottom:var(--sp-5);">
        ${HEATING_SOURCES.map(h => `
          <button onpointerdown="selectHeatingSource('${h}')"
            style="
              padding:var(--sp-4);border-radius:var(--r-md);
              border:1px solid ${_homeHeatingSource === h ? 'var(--accent)' : 'var(--border)'};
              background:${_homeHeatingSource === h ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface)'};
              color:${_homeHeatingSource === h ? 'var(--accent)' : 'var(--text-secondary)'};
              font-family:'Space Grotesk',sans-serif;font-size:0.8rem;font-weight:600;
              cursor:pointer;-webkit-tap-highlight-color:transparent;
            ">
            ${h}
          </button>`).join('')}
      </div>

      <!-- Banger thickness gauge -->
      ${(() => {
        const crossSections = BANGER_STOPS.map((t, i) => {
          const w = Math.round(2 + (t - 2) * 5 / 3); // 2px→7px border
          const active = t === _bangerThickness;
          return `<div id="banger-stop-${i}" style="
            width:22px;height:22px;
            border:${w}px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.18)'};
            border-top:none;border-radius:0 0 4px 4px;
            transform:${active ? 'scaleY(1.18)' : 'scaleY(1)'};
            transform-origin:bottom;transition:border-color 120ms,transform 120ms;
          "></div>`;
        }).join('');
        const cfg  = calcTimerConfig();
        const base = calcTimerConfigBase();
        const dh   = cfg.heat - base.heat;
        const dc   = cfg.cool - base.cool;
        const deltaText = (dh === 0 && dc === 0)
          ? '3mm standard baseline'
          : `${dh > 0 ? '+' : ''}${dh}s heat · ${dc > 0 ? '+' : ''}${dc}s cool vs standard`;
        const deltaColor = _bangerThickness > 3 ? 'var(--accent)' : _bangerThickness < 3 ? '#F59E0B' : 'var(--text-muted)';
        return `
        <div style="margin-bottom:var(--sp-5);">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--sp-3);">
            <p class="section-title" style="margin-bottom:0;">Banger Thickness</p>
            <span id="banger-label" class="font-mono" style="font-size:var(--font-xs);color:var(--accent);">${_bangerThickness}mm · ${BANGER_LABELS[_bangerThickness] || ''}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:0 1px;margin-bottom:var(--sp-3);">
            ${crossSections}
          </div>
          <input type="range" min="2" max="5" step="0.5" value="${_bangerThickness}"
            oninput="setBangerThickness(this.value)"
            style="width:100%;accent-color:var(--accent);cursor:pointer;">
          <div style="display:flex;justify-content:space-between;margin-top:var(--sp-1);">
            <span style="font-size:10px;color:var(--text-muted);font-family:'Space Mono',monospace;">2mm thin</span>
            <span style="font-size:10px;color:var(--text-muted);font-family:'Space Mono',monospace;">5mm thermal</span>
          </div>
          <div id="banger-delta" style="margin-top:var(--sp-2);text-align:center;font-family:'Space Mono',monospace;font-size:10px;color:${deltaColor};">${deltaText}</div>
        </div>`;
      })()}

      <!-- Live timer preview -->
      ${(() => {
        const cfg = calcTimerConfig();
        return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-3);margin-bottom:var(--sp-5);">
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-4) var(--sp-2);text-align:center;">
            <div id="home-preview-heat" class="font-mono" style="font-size:1.4rem;font-weight:700;color:#EF4444;">${cfg.heat}s</div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:0.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Heat Up</div>
          </div>
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-4) var(--sp-2);text-align:center;">
            <div id="home-preview-cool" class="font-mono" style="font-size:1.4rem;font-weight:700;color:#5B9CF6;">${cfg.cool}s</div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:0.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Cool Down</div>
          </div>
        </div>`;
      })()}

      <!-- Start button -->
      <button class="btn-primary fade-up" style="width:100%;font-size:1rem;padding:var(--sp-4);" onpointerdown="startSession()">
        START SESSION
      </button>
    </div>`;

  staggerCards(el);
}

const TOP_ARTISTS = [
  { name: 'Mr Gray Glass',    sub: 'Master Glass Artist',    url: 'https://www.instagram.com/mrgrayglass/' },
  { name: 'Tristan Hodges',   sub: 'Elite Functional Art',   url: 'https://www.instagram.com/tristanhodgesglass/' },
  { name: 'Chachi Rodriguez', sub: 'Innovative Heady Glass', url: 'https://www.instagram.com/chachierodriguez/' },
  { name: 'Jesse ESP',        sub: 'Premium Glass Art',      url: 'https://www.instagram.com/espglass/' },
  { name: 'Mobius Glass',     sub: 'San Luis Obispo, CA',    url: 'https://www.mobiusglass.com/' },
];

const ROTATING_ARTISTS = [
  { name: 'Banjo',               sub: 'Oregon',           url: 'https://www.instagram.com/banjoglass/' },
  { name: 'Mothership Glass',    sub: 'Washington',       url: 'https://mothershipglass.com/' },
  { name: 'Joaquim Glass',       sub: 'Berkeley, CA',     url: 'https://www.instagram.com/joaquimglass/' },
  { name: 'BAGI',                sub: 'Bay Area',         url: 'https://www.instagram.com/bayareaglassinstitute/' },
  { name: 'Invest In Headies',   sub: 'Bay Area Gallery', url: 'https://investinheadies.com/' },
  { name: 'Jason Stropko',       sub: 'SF Bay Area',      url: 'https://jasonstropko.com/' },
  { name: 'Sovereignty Glass',   sub: 'California',       url: 'https://www.instagram.com/sovereigntyglass/' },
  { name: 'Toro Glass',          sub: 'California',       url: 'https://www.instagram.com/toaboroglass/' },
  { name: 'Humboldt Glassblowers', sub: 'Arcata, CA',    url: 'https://www.instagram.com/humboldtglassblowers/' },
  { name: 'Glass Garage',        sub: 'Eureka, CA',       url: 'https://www.instagram.com/glassgarageeureka/' },
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

function equipmentCard() {
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

function getSettings() {
  return JSON.parse(localStorage.getItem('dabflow2_settings') || '{}');
}

function saveSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  localStorage.setItem('dabflow2_settings', JSON.stringify(s));
}

function adjustSetting(key, delta) {
  const s = getSettings();
  const defaults = { heat: 18, cool: 60 };
  const val = Math.max(5, (s[key] !== undefined ? s[key] : defaults[key]) + delta);
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

function timerSettingRow(key, label, value) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${label}</div>
      <div class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);">seconds</div>
    </div>
    <div style="display:flex;align-items:center;gap:var(--sp-3);">
      <button onpointerdown="adjustSetting('${key}',-5)" style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:1rem;line-height:1;">−</button>
      <span class="font-mono" id="setting-${key}" style="min-width:36px;text-align:center;color:var(--text-primary);">${value}</span>
      <button onpointerdown="adjustSetting('${key}',5)" style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);cursor:pointer;font-size:1rem;line-height:1;">+</button>
    </div>
  </div>`;
}

function colorSettingRow(key, label, value) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${label}</div>
      <div class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);">arc color</div>
    </div>
    <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer;">
      <span id="color-swatch-${key}" style="
        width:36px;height:36px;border-radius:var(--r-sm);
        background:${value};border:1px solid var(--border);
        display:block;flex-shrink:0;pointer-events:none;
      "></span>
      <input type="color" value="${value}"
        oninput="saveSetting('${key}',this.value);document.getElementById('color-swatch-${key}').style.background=this.value;"
        style="width:0;height:0;opacity:0;position:absolute;">
    </label>
  </div>`;
}

function toggleRow(key, label, value) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;">
    <span class="font-display" style="font-size:var(--font-md);color:var(--text-primary);">${label}</span>
    <button onpointerdown="toggleSetting('${key}',this)"
      style="width:48px;height:26px;border-radius:var(--r-full);border:none;cursor:pointer;position:relative;transition:background 200ms;background:${value ? 'var(--accent)' : 'var(--bg-elevated)'};"
      data-on="${value}">
      <span style="position:absolute;top:3px;left:${value ? '24px' : '3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left 200ms;"></span>
    </button>
  </div>`;
}

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
              ${!unlocked ? `<span style="position:absolute;top:3px;right:3px;font-size:0.55rem;color:var(--text-muted);">🔒</span>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

function renderSettings() {
  const s = getSettings();
  const el = document.getElementById('screen-settings');
  if (!el) return;
  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);">
        <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-6);">Settings</h1>

        ${themePickerHTML()}

        <p class="section-title">Timer</p>
        <div class="card" style="margin-bottom:var(--sp-4);">
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-5);">
            ${timerSettingRow('heat', 'Heat Time', s.heat !== undefined ? s.heat : 18)}
            ${timerSettingRow('cool', 'Cool Time', s.cool !== undefined ? s.cool : 60)}
          </div>
        </div>

        <p class="section-title">Timer Colors</p>
        <div class="card" style="margin-bottom:var(--sp-4);">
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-5);">
            ${colorSettingRow('heatColor', 'Heat Phase', s.heatColor || '#EF4444')}
            ${colorSettingRow('coolColor', 'Cool Phase', s.coolColor || '#5B9CF6')}
          </div>
        </div>

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

        <div style="text-align:center;padding:var(--sp-6);color:var(--text-muted);">
          <p class="font-mono" style="font-size:var(--font-xs);">DabFlow v2.0.0</p>
          <p class="font-mono" style="font-size:var(--font-xs);margin-top:var(--sp-1);">${window.BUILD_VARIANT || 'free'}</p>
        </div>
      </div>
    </div>`;
}

// Global error surface — any uncaught error at least logs instead of white-screening
window.addEventListener('error', (e) => {
  console.error('[app] uncaught:', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[app] unhandled promise rejection:', e.reason);
});

function _safe(label, fn) {
  try { fn(); }
  catch (err) { console.error(`[app] ${label} failed:`, err); }
}

document.addEventListener('DOMContentLoaded', () => {
  _safe('seed-data', () => {
    if (window.BUILD_VARIANT === 'demo' || window.BUILD_VARIANT === 'premium') {
      generateSeedData();
    }
  });
  _safe('molecule-bg',  () => injectMoleculeBg());
  _safe('ads',          () => { if (!window.DISABLE_ADS) initAds(); });
  _safe('nav',          () => initNav());
  _safe('brand-list',   () => populateBrandList());
  _safe('strain-list',  () => updateStrainList(''));
  _safe('render-home',  () => renderHome());
  _safe('render-glass', () => renderGlass());
  _safe('render-settings', () => renderSettings());
});

window.addEventListener('session-complete', (e) => {
  saveSession(e.detail);
  if (typeof checkThemeUnlocks === 'function') checkThemeUnlocks();
  renderHome();
});

window.addEventListener('session-edit', (e) => {
  const { ts, brand, strain, rating } = e.detail;
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.ts === ts);
  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], brand, strain, rating };
    localStorage.setItem('dabflow2_sessions', JSON.stringify(sessions));
  }
  renderHome();
  if (currentScreen === 'stats' && typeof renderStats === 'function') renderStats();
});
