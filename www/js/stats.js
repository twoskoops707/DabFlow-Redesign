'use strict';

let _chartInstances = {};

function renderStats() {
  const sessions = getSessions();
  const el = document.getElementById('stats-content');
  if (!el) return;

  Object.values(_chartInstances).forEach(c => c.destroy());
  _chartInstances = {};

  const streak     = getStreak();
  const totalTime  = sessions.reduce((t, s) => t + (s.heat||0) + (s.hold||0) + (s.cool||0), 0);
  const bestStreak = calcBestStreak(sessions);
  const hasBrand   = sessions.some(s => s.brand);
  const hasStrain  = sessions.some(s => s.strain);

  el.innerHTML = `
    <div style="padding-top:var(--sp-6);">
      <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-6);">Stats</h1>

      <div class="fade-up" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-6);">
        ${statChip(sessions.length,            'Sessions',    'chip-sessions')}
        ${statChip(formatTotalTime(totalTime), 'Total Time')}
        ${statChip(streak,                     'Streak',      'chip-streak')}
        ${statChip(bestStreak,                 'Best Streak', 'chip-best')}
      </div>

      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Sessions (30 days)</p>
          <canvas id="chart-sessions" height="160"></canvas>
        </div>
      </div>

      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Time of Day</p>
          <canvas id="chart-hour" height="140"></canvas>
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

      ${hasBrand ? `
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Top Brands</p>
          <canvas id="chart-brand" height="180"></canvas>
        </div>
      </div>` : ''}

      ${hasStrain ? `
      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title" style="margin-bottom:var(--sp-4);">Top Strains</p>
          <canvas id="chart-strain" height="200"></canvas>
        </div>
      </div>` : ''}

      <div class="card fade-up" style="margin-bottom:var(--sp-4);">
        <div class="card-body">
          <p class="section-title">Achievements</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
            ${renderAchievements(sessions)}
          </div>
        </div>
      </div>

      ${sessions.length ? `
      <div class="fade-up" style="margin-bottom:var(--sp-8);">
        <p class="section-title" style="margin-bottom:var(--sp-4);">Recent Sessions</p>
        ${renderRecentSessions(sessions)}
      </div>` : ''}
    </div>`;

  if (typeof staggerCards === 'function') staggerCards(el);

  if (streak >= 7) showToast("you've been consistent");

  requestAnimationFrame(() => {
    renderSessionsChart(sessions);
    renderHourChart(sessions);
    renderMaterialChart(sessions);
    if (hasBrand)  renderBrandChart(sessions);
    if (hasStrain) renderStrainChart(sessions);
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
  return sessions.slice(-10).reverse().map(s => {
    const hasMeta = s.brand || s.strain;
    const meta    = [s.brand, s.strain].filter(Boolean).join(' · ');
    return `<div class="card" style="margin-bottom:var(--sp-3);">
      <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);">
        <div style="flex:1;min-width:0;">
          <div class="font-display" style="font-size:var(--font-sm);color:var(--text-primary);">${s.material || 'Session'}</div>
          <div class="font-body" style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${hasMeta ? meta : formatRelTime(s.ts)}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-2);flex-shrink:0;">
          ${s.rating ? `<span style="font-size:var(--font-sm);color:var(--accent);">${'★'.repeat(s.rating)}</span>` : ''}
          ${!hasMeta
            ? `<button class="btn-ghost" style="padding:var(--sp-2) var(--sp-3);font-size:var(--font-xs);" onpointerdown="editSessionByTs(${s.ts})">Add Notes</button>`
            : `<button style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:var(--sp-2);-webkit-tap-highlight-color:transparent;" onpointerdown="editSessionByTs(${s.ts})">${getIcon('edit', 14)}</button>`
          }
        </div>
      </div>
    </div>`;
  }).join('');
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
  return ACHIEVEMENTS.map(a => {
    const unlocked = a.check(sessions);
    return `<div class="chip" style="opacity:${unlocked ? 1 : 0.4};">
      <span style="color:${unlocked ? 'var(--accent)' : 'var(--text-muted)'};">${getIcon(unlocked ? 'check' : 'lock', 16)}</span>
      <span class="font-display" style="font-size:var(--font-xs);color:var(--text-secondary);margin-top:var(--sp-1);">${a.label}</span>
    </div>`;
  }).join('');
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
