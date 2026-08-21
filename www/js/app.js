'use strict';

const NAV_ICONS = ['home', 'timer', 'stats', 'glass', 'settings'];
let currentScreen = 'home';

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
  if (name === 'stats')  setTimeout(renderStats, 50);
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

function startSession() {
  const preset = MATERIAL_PRESETS.find(p => p.label === _homeMaterial) || MATERIAL_PRESETS[0];
  window._selectedMaterial      = _homeMaterial;
  window._selectedConcentrate   = _homeConcentrate;
  window._selectedHeatingSource = _homeHeatingSource;
  window._timerConfig           = { heat: preset.heat, hold: preset.hold, cool: preset.cool };
  switchScreen('timer');
  setTimeout(initTimer, 50);
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
  const streak      = getStreak();
  const lastSession = getSessions().slice(-1)[0];
  const el          = document.getElementById('screen-home');
  if (!el) return;

  const lastSessionHTML = lastSession ? (() => {
    const meta = [lastSession.brand, lastSession.concentrate || lastSession.strain].filter(Boolean).join(' · ');
    return `
      <p class="section-title" style="margin-bottom:var(--sp-3);">Last Session</p>
      <div class="card fade-up" style="margin-bottom:var(--sp-5);">
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
          <button onpointerdown="selectMaterial('${p.label}')"
            style="
              padding:var(--sp-3) var(--sp-2);border-radius:var(--r-md);
              border:1px solid ${_homeMaterial === p.label ? 'var(--accent)' : 'var(--border)'};
              background:${_homeMaterial === p.label ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface)'};
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
              background:${_homeConcentrate === c ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface)'};
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
              background:${_homeHeatingSource === h ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface)'};
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
  const defaults = { heat: 45, hold: 8, cool: 30 };
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
            ${timerSettingRow('heat', 'Heat Time', s.heat !== undefined ? s.heat : 45)}
            ${timerSettingRow('hold', 'Hold Time', s.hold !== undefined ? s.hold : 8)}
            ${timerSettingRow('cool', 'Cool Time', s.cool !== undefined ? s.cool : 30)}
          </div>
        </div>

        <p class="section-title">Preferences</p>
        <div class="card" style="margin-bottom:var(--sp-4);">
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-4);">
            ${toggleRow('haptics', 'Haptic Feedback', s.haptics !== false)}
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

document.addEventListener('DOMContentLoaded', () => {
  if (window.BUILD_VARIANT === 'demo' || window.BUILD_VARIANT === 'premium') {
    generateSeedData();
  }
  injectMoleculeBg();
  initAds();
  initNav();
  populateBrandList();
  updateStrainList('');
  renderHome();
  renderGlass();
  renderSettings();
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
