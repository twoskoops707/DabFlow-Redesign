'use strict';

let _chartInstances = {};

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function renderStats() {
  const sessions = getSessions();
  const el = document.getElementById('stats-content');
  if (!el) return;

  Object.values(_chartInstances).forEach(c => c.destroy());
  _chartInstances = {};

  const streak     = getStreak();
  const totalTime  = sessions.reduce((t, s) => t + (s.heat||0) + (s.cool||0), 0);
  const bestStreak = calcBestStreak(sessions);
  const hasBrand   = sessions.some(s => s.brand);
  const hasStrain  = sessions.some(s => s.strain);

  el.innerHTML = `
    <div style="padding-top:var(--sp-6);">
      <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-5);">Stats</h1>

      <!-- Summary chips -->
      <div class="fade-up" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-5);">
        ${statChip(sessions.length,            'Sessions',    'chip-sessions')}
        ${statChip(formatTotalTime(totalTime), 'Total Time')}
        ${statChip(streak,                     'Streak',      'chip-streak')}
        ${statChip(bestStreak,                 'Best Streak', 'chip-best')}
      </div>

      ${hasBrand ? `
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Top Brands</p>
          <div style="position:relative;height:160px;"><canvas id="chart-brand"></canvas></div>
        </div>
      </div>` : ''}

      ${hasStrain ? `
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Top Strains</p>
          <div style="position:relative;height:180px;"><canvas id="chart-strain"></canvas></div>
        </div>
      </div>` : ''}

      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Sessions (30 days)</p>
          <div style="position:relative;height:140px;"><canvas id="chart-sessions"></canvas></div>
        </div>
      </div>

      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Time of Day</p>
          <div style="position:relative;height:120px;"><canvas id="chart-hour"></canvas></div>
        </div>
      </div>

      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Material</p>
          <div style="display:flex;align-items:center;gap:var(--sp-6);">
            <canvas id="chart-material" width="120" height="120" style="flex-shrink:0;"></canvas>
            <div id="chart-material-legend" style="flex:1;"></div>
          </div>
        </div>
      </div>

      <div class="card fade-up" style="margin-bottom:var(--sp-8);">
        <div class="card-body">
          <p class="section-title">Achievements</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
            ${renderAchievements(sessions)}
          </div>
        </div>
      </div>
    </div>`;

  if (typeof staggerCards === 'function') staggerCards(el);

  if (streak >= 7) showToast("you've been consistent");

  requestAnimationFrame(() => {
    if (hasBrand)  renderBrandChart(sessions);
    if (hasStrain) renderStrainChart(sessions);
    renderSessionsChart(sessions);
    renderHourChart(sessions);
    renderMaterialChart(sessions);
    animateStatChips(sessions.length, streak, bestStreak);
  });
}

function animateStatChips(sessCount, streak, best) {
  const els = {
    'chip-sessions': sessCount,
    'chip-streak':   streak,
    'chip-best':     best,
  };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateCounter(el, val);
  });
}

function animateCounter(el, target, duration = 800) {
  if (!target || target === 0) { el.textContent = '0'; return; }
  const start = performance.now();
  function step(now) {
    const t    = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function statChip(value, label, id) {
  return `<div class="chip">
    <span class="chip-value"${id ? ` id="${id}"` : ''}>${value}</span>
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
  const daySet = new Set(sessions.map(s => {
    const d = new Date(s.ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }));
  const days = [...daySet].sort((a, b) => a - b);
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (days[i] - days[i - 1]) / 86400000;
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

const CHART_ANIMATION = { duration: 900, easing: 'easeOutQuart' };

function renderSessionsChart(sessions) {
  const canvas = document.getElementById('chart-sessions');
  if (!canvas) return;
  const now = Date.now();
  const dayMs = 86400000;
  const labels = [], data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    labels.push(i % 5 === 0 ? `${d.getMonth()+1}/${d.getDate()}` : '');
    const dayStr = d.toDateString();
    data.push(sessions.filter(s => new Date(s.ts).toDateString() === dayStr).length);
  }
  _chartInstances['sessions'] = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ data, borderColor: '#2ECC8A', backgroundColor: 'rgba(46,204,138,0.08)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.borderColor } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font, stepSize: 1 }, grid: { color: CHART_DEFAULTS.borderColor }, beginAtZero: true },
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
    data: { labels, datasets: [{ data: hourCounts, backgroundColor: 'rgba(46,204,138,0.5)', borderColor: '#2ECC8A', borderWidth: 1, borderRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }, grid: { display: false } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.borderColor }, beginAtZero: true },
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
  const labels = Object.keys(counts);
  const data   = Object.values(counts);
  const PALETTE = ['#2ECC8A', '#5B9CF6', '#F5A623', '#E879F9', '#FB923C', '#8A9BAE'];
  const colors  = labels.map((_, i) => PALETTE[i % PALETTE.length]);
  _chartInstances['material'] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: false,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
    },
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

function renderBrandChart(sessions) {
  const canvas = document.getElementById('chart-brand');
  if (!canvas) return;
  const counts = {};
  sessions.forEach(s => { if (s.brand) counts[s.brand] = (counts[s.brand] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (!sorted.length) return;
  _chartInstances['brand'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sorted.map(([l]) => l),
      datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: 'rgba(91,156,246,0.65)', borderColor: '#5B9CF6', borderWidth: 1, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.borderColor }, beginAtZero: true },
        y: { ticks: { color: CHART_DEFAULTS.color, font: { ...CHART_DEFAULTS.font, size: 9 }, maxRotation: 0 }, grid: { display: false } },
      },
    },
  });
}

function renderStrainChart(sessions) {
  const canvas = document.getElementById('chart-strain');
  if (!canvas) return;
  const counts = {};
  sessions.forEach(s => { if (s.strain) counts[s.strain] = (counts[s.strain] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!sorted.length) return;
  _chartInstances['strain'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sorted.map(([l]) => l),
      datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: 'rgba(232,121,249,0.55)', borderColor: '#E879F9', borderWidth: 1, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.borderColor }, beginAtZero: true },
        y: { ticks: { color: CHART_DEFAULTS.color, font: { ...CHART_DEFAULTS.font, size: 9 }, maxRotation: 0 }, grid: { display: false } },
      },
    },
  });
}

function renderRecentSessions(sessions) {
  const recent = sessions;
  if (!recent.length) return '';

  return `<div style="position:relative;">
    <!-- Timeline spine -->
    <div style="position:absolute;left:18px;top:8px;bottom:8px;width:1px;background:rgba(255,255,255,0.07);"></div>

    ${recent.map((s, i) => {
      const hasMeta    = s.brand || s.strain || s.concentrate;
      const concentrate = escHtml(s.concentrate || s.strain || '');
      const brand       = escHtml(s.brand || '');
      const ratingDots  = s.rating
        ? Array(5).fill(0).map((_, n) => `<span style="width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:2px;background:${n < s.rating ? 'var(--accent)' : 'rgba(255,255,255,0.12)'};"></span>`).join('')
        : '';
      const materialColors = { Quartz: '#5B9CF6', Titanium: '#8A9BAE', Ceramic: '#F5A623' };
      const dotColor = materialColors[s.material] || 'var(--accent)';

      return `<div style="display:flex;align-items:flex-start;gap:var(--sp-3);margin-bottom:var(--sp-3);">
        <!-- Timeline dot -->
        <div style="
          width:10px;height:10px;border-radius:50%;
          background:${dotColor};flex-shrink:0;margin-top:14px;
          position:relative;z-index:1;box-shadow:0 0 6px ${dotColor}80;
        "></div>

        <!-- Card -->
        <div class="card" style="flex:1;min-width:0;">
          <div class="card-body" style="padding:var(--sp-3) var(--sp-4);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:${hasMeta ? 'var(--sp-2)' : '0'};">
              <div style="display:flex;align-items:center;gap:var(--sp-2);min-width:0;flex:1;">
                <span class="font-display" style="font-size:var(--font-sm);color:var(--text-primary);white-space:nowrap;">${s.material || 'Session'}</span>
                ${concentrate ? `<span style="
                  font-family:'Space Mono',monospace;font-size:0.58rem;
                  padding:1px 6px;border-radius:99px;
                  background:rgba(255,255,255,0.06);border:1px solid var(--border);
                  color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;
                ">${concentrate}</span>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:var(--sp-2);flex-shrink:0;">
                ${ratingDots ? `<div style="display:flex;align-items:center;">${ratingDots}</div>` : ''}
                <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px;-webkit-tap-highlight-color:transparent;opacity:0.6;" onpointerdown="editSessionByTs(${s.ts})">${getIcon('edit', 13)}</button>
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              ${brand ? `<span class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${brand}</span>` : `<span></span>`}
              <span class="font-mono" style="font-size:0.58rem;color:rgba(255,255,255,0.2);white-space:nowrap;">${formatRelTime(s.ts)}</span>
            </div>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

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

  let themeHTML = '';
  if (typeof THEMES !== 'undefined' && typeof isThemeUnlocked === 'function') {
    themeHTML = `
      <div style="grid-column:1/-1;margin-top:var(--sp-4);">
        <p class="section-title" style="margin-bottom:var(--sp-3);">Themes</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);">
          ${THEMES.map(theme => {
            const unlocked = isThemeUnlocked(theme);

            const swatch = theme.arcCool
              ? theme.arcCool
              : 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';
            const hint = !unlocked
              ? (theme.unlockType === 'sessions'
                  ? `${theme.unlockVal} sess`
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

function renderSessionsScreen() {
  const el = document.getElementById('screen-sessions');
  if (!el) return;
  const sessions = getSessions().slice().reverse();

  el.innerHTML = `
    <div class="screen-inner">
      <div style="padding-top:var(--sp-6);margin-bottom:var(--sp-5);">
        <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;">Sessions</h1>
        ${sessions.length ? `<p class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--sp-1);">${sessions.length} total</p>` : ''}
      </div>
      ${sessions.length ? renderRecentSessions(sessions) : `
        <div style="text-align:center;padding:var(--sp-10) 0;color:var(--text-muted);">
          <p class="font-display" style="font-size:var(--font-lg);">No sessions yet</p>
          <p class="font-body" style="font-size:var(--font-sm);margin-top:var(--sp-2);">Start a session to see it here</p>
        </div>`}
    </div>`;
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
