'use strict';

let _chartInstances = {};

function renderStats() {
  const sessions = getSessions();
  const el = document.getElementById('stats-content');
  if (!el) return;

  Object.values(_chartInstances).forEach(c => c.destroy());
  _chartInstances = {};

  const streak = getStreak();
  const totalTime = sessions.reduce((t, s) => t + (s.heat||0) + (s.hold||0) + (s.cool||0), 0);
  const bestStreak = calcBestStreak(sessions);

  el.innerHTML = `
    <div style="padding-top:var(--sp-6);">
      <h1 class="font-display" style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--sp-6);">Stats</h1>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-6);">
        ${statChip(sessions.length, 'Sessions')}
        ${statChip(formatTotalTime(totalTime), 'Total Time')}
        ${statChip(streak, 'Streak')}
        ${statChip(bestStreak, 'Best Streak')}
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

      <div class="card fade-up" style="position:relative;margin-bottom:var(--sp-8);">
        <div class="card-body">
          <p class="section-title">Achievements</p>
          <div id="achievements-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
            ${renderAchievements(sessions)}
          </div>
        </div>
        ${(window.BUILD_VARIANT === 'free' || window.BUILD_VARIANT === 'demo') ? `
          <div class="premium-lock">
            <span style="color:var(--accent);">${getIcon('crown', 28)}</span>
            <p class="premium-lock-text">Unlock with Premium</p>
            <button class="btn-ghost" onclick="switchScreen('settings')">Get Premium</button>
          </div>
        ` : ''}
      </div>
    </div>`;

  if (streak >= 7) {
    showToast("you've been consistent 👀");
  }

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
    data: { labels, datasets: [{ data, borderColor: '#2ECC8A', backgroundColor: 'transparent', tension: 0.4, pointRadius: 0, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
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
  const data = Object.values(counts);
  const colors = ['#2ECC8A','#5B9CF6','#F5A623','#8A9BAE'];
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
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
