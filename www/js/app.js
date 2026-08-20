'use strict';

const NAV_ICONS = ['home', 'timer', 'stats', 'glass', 'settings'];
let currentScreen = 'home';

const PRESETS = [
  { id: 'quartz',  label: 'Quartz',  heat: 45, hold: 8,  cool: 30 },
  { id: 'banger',  label: 'Banger',  heat: 55, hold: 10, cool: 45 },
  { id: 'custom',  label: 'Custom',  heat: 0,  hold: 0,  cool: 0  },
];

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

function renderHome() {
  const streak = getStreak();
  const lastSession = getSessions().slice(-1)[0];
  const el = document.getElementById('screen-home');
  if (!el) return;
  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);margin-bottom:var(--sp-6);">
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
              ${p.heat > 0
                ? `<div class="font-mono" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-1);">${p.heat}s heat · ${p.hold}s hold · ${p.cool}s cool</div>`
                : '<div class="font-mono" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-1);">Your saved settings</div>'}
            </div>
            <span style="color:var(--text-muted);">${getIcon('chevron-right', 18)}</span>
          </button>`).join('')}
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
        </div>` : ''}
    </div>`;
}

// Stubs — filled in later tasks
function renderGlass() {}
function renderSettings() {}
function renderStats() {}
function initTimer() {}

document.addEventListener('DOMContentLoaded', () => {
  if (window.BUILD_VARIANT === 'demo' || window.BUILD_VARIANT === 'premium') {
    if (typeof generateSeedData === 'function') generateSeedData();
  }
  injectMoleculeBg();
  initNav();
  renderHome();
  renderGlass();
  renderSettings();
});

window.addEventListener('session-complete', (e) => {
  saveSession(e.detail);
  renderHome();
});
