'use strict';

const PHASE_COLORS = {
  heat: '#EF4444',
  cool: null,   // read from --arc-cool at runtime
};

const DAB_PHRASES = ['enjoy', 'glazed', 'elevated', 'sauced', 'lifted', 'zooted'];

let _timerInterval     = null;
let _timerState        = 'idle'; // idle | running | paused | complete
let _phases            = [];
let _currentPhaseIdx   = 0;
let _phaseElapsed      = 0;
let _holdStartHeld     = false;
let _holdTimer         = null;
let _sessionStart      = null;
let _wakeLock          = null;
let _selectedRating    = 0;
let _editMode          = false;
let _editTs            = null;
let _notesAutoClose    = null;
let _countdownInterval = null;

// ── Timer ring (SVG arc) ────────────────────────────────────────────────────

const ARC_CIRC  = 276.46;
const ARC_TRACK = 207.35;

function _getArcProgress() {
  return document.querySelector('.arc-progress');
}

function _getHeatColor() {
  const s = typeof getSettings === 'function' ? getSettings() : {};
  return s.heatColor || '#EF4444';
}

function _getCoolColor() {
  const s = typeof getSettings === 'function' ? getSettings() : {};
  if (s.coolColor) return s.coolColor;
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--arc-cool').trim() || '#5B9CF6';
}

function _getPhaseColor(phaseName) {
  if (phaseName === 'heat') return _getHeatColor();
  return _getCoolColor();
}

function drawRingIdle() {
  const arc = _getArcProgress();
  if (arc) {
    arc.setAttribute('stroke-dasharray', `0 ${ARC_CIRC}`);
    arc.setAttribute('stroke', _getHeatColor());
  }
}

function drawRingProgress(phaseIdx, progress) {
  if (!_phases.length) return;
  const arc = _getArcProgress();
  if (!arc) return;
  const phase  = _phases[phaseIdx];
  const filled = Math.min(1, progress) * ARC_TRACK;
  const empty  = ARC_CIRC - filled;
  arc.setAttribute('stroke-dasharray', `${filled.toFixed(2)} ${empty.toFixed(2)}`);
  arc.setAttribute('stroke', _getPhaseColor(phase.name));
}

function _refreshTimerChips() {
  const matEl  = document.getElementById('timer-material-chip');
  const conEl  = document.getElementById('timer-concentrate-chip');
  const fuelEl = document.getElementById('timer-fuel-label');
  if (matEl)  matEl.textContent  = window._selectedMaterial      || '';
  if (conEl)  conEl.textContent  = window._selectedConcentrate   || '';
  if (fuelEl) fuelEl.textContent = window._selectedHeatingSource
    ? `via ${window._selectedHeatingSource}` : '';
}

function renderTimerHeatmap() {
  const el = document.getElementById('timer-heatmap');
  if (!el) return;

  const sessions  = typeof getSessions === 'function' ? getSessions() : [];
  const WEEKS     = 14;
  const CELL      = 14;
  const GAP       = 2;
  const dayCounts = {};
  sessions.forEach(s => {
    const key = new Date(s.ts).toDateString();
    dayCounts[key] = (dayCounts[key] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(dayCounts), 1);

  const today     = new Date(); today.setHours(0,0,0,0);
  const dow       = (today.getDay() + 6) % 7; // Mon=0…Sun=6
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dow - (WEEKS - 1) * 7);

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Day labels: show M, W, F, S (every other row)
  const DAY_LABELS = ['M','','W','','F','','S'];

  // Month label per week column (show when month changes)
  let prevMonth = -1;
  const monthLabels = [];
  for (let w = 0; w < WEEKS; w++) {
    const wDate = new Date(startDate);
    wDate.setDate(startDate.getDate() + w * 7);
    const m = wDate.getMonth();
    monthLabels.push(m !== prevMonth ? MONTH_ABBR[m] : '');
    prevMonth = m;
  }

  // Build cells
  const cells = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date  = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const key   = date.toDateString();
      const count = dayCounts[key] || 0;
      cells.push({ count, future: date > today });
    }
  }

  const labelStyle = `height:${CELL}px;line-height:${CELL}px;font-family:'Space Mono',monospace;font-size:8px;color:rgba(255,255,255,0.28);text-align:right;padding-right:3px;`;
  const dayLabelCol = DAY_LABELS.map(l =>
    `<div style="${labelStyle}">${l}</div>`
  ).join('');

  const slotW = CELL + GAP;
  const monthRow = monthLabels.map(m =>
    `<div style="width:${CELL}px;font-family:'Space Mono',monospace;font-size:8px;color:rgba(255,255,255,0.28);overflow:hidden;white-space:nowrap;">${m}</div>`
  ).join('');

  const cellsHTML = cells.map(({ count, future }) => {
    if (future) return `<div style="width:${CELL}px;height:${CELL}px;border-radius:3px;"></div>`;
    const alpha = count === 0 ? 0.08 : Math.max(0.3, count / maxCount);
    const bg    = count === 0 ? `rgba(255,255,255,${alpha})` : `rgba(46,204,138,${alpha.toFixed(2)})`;
    return `<div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:${bg};"></div>`;
  }).join('');

  el.style.cssText = 'display:flex;justify-content:center;margin-top:0.5rem;';
  el.innerHTML = `
    <div style="display:inline-flex;flex-direction:column;gap:${GAP}px;">
      <div style="display:flex;gap:${GAP}px;padding-left:${CELL + GAP}px;">
        ${monthRow}
      </div>
      <div style="display:flex;gap:${GAP}px;align-items:start;">
        <div style="display:grid;grid-template-rows:repeat(7,${CELL}px);gap:${GAP}px;width:${CELL}px;">
          ${dayLabelCol}
        </div>
        <div style="display:grid;grid-template-rows:repeat(7,${CELL}px);grid-auto-flow:column;grid-auto-columns:${CELL}px;gap:${GAP}px;">
          ${cellsHTML}
        </div>
      </div>
    </div>`;
}

function initTimer() {
  const rb = document.getElementById('timer-reset-btn');
  if (rb && !rb.dataset.iconSet && typeof getIcon === 'function') {
    rb.innerHTML = getIcon('chevron-left', 20);
    rb.dataset.iconSet = '1';
  }

  if (_timerState === 'idle') {
    drawRingIdle();
    updateTimerDisplay('--:--');
    updatePhaseLabel('', '');
    renderTimerHeatmap();
  }
  _refreshTimerChips();

  if (window._autoStartTimer) {
    window._autoStartTimer = false;
    startTimer();
  }
}

function buildPhases(config) {
  return [
    { name: 'heat', label: 'Heat Up',   duration: config.heat, color: PHASE_COLORS.heat },
    { name: 'cool', label: 'Cool Down', duration: config.cool, color: PHASE_COLORS.cool },
  ].filter(p => p.duration > 0);
}


function updateTimerDisplay(text) {
  const el = document.getElementById('timer-display');
  if (el) el.textContent = text;
}

function updatePhaseLabel(text, phaseName) {
  const el = document.getElementById('timer-phase-label');
  if (!el) return;
  el.textContent = text;
  if (phaseName === 'heat')      el.style.color = _getHeatColor();
  else if (phaseName === 'cool') el.style.color = _getCoolColor();
  else                           el.style.color = '';
}

function formatSeconds(s) {
  const secs = Math.max(0, Math.ceil(s));
  const m = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Timer controls ───────────────────────────────────────────────────────────

function handleTimerBtn() {
  if (_timerState === 'running') { pauseTimer(); return; }
  if (_timerState === 'paused')  { resumeTimer(); return; }
  if (_timerState === 'complete') return;

  // idle — hold detection for easter egg
  const btn = document.getElementById('timer-start-btn');
  _holdStartHeld = true;
  if (btn) btn.textContent = 'Hold...';

  _holdTimer = setTimeout(() => {
    if (_holdStartHeld) {
      _holdStartHeld = false;
      if (btn) btn.textContent = 'Start';
      triggerBloomEasterEgg();
      setTimeout(() => startTimer(), 1300);
    }
  }, 4200);

  btn.addEventListener('pointerup',    cancelHold, { once: true });
  btn.addEventListener('pointerleave', cancelHold, { once: true });
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

function _setHeatmapVisible(visible) {
  const el = document.getElementById('timer-heatmap');
  if (el) el.style.opacity = visible ? '1' : '0';
}

function startTimer() {
  const config  = window._timerConfig || { heat: 18, cool: 60 };
  _phases          = buildPhases(config);
  _currentPhaseIdx = 0;
  _phaseElapsed    = 0;
  _sessionStart    = Date.now();
  _timerState      = 'running';

  _setHeatmapVisible(false);

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Pause';
  if (resetBtn) resetBtn.style.display = 'flex';

  if (_phases.length) updatePhaseLabel(_phases[0].label, _phases[0].name);

  if (typeof resetCooldownAdFlag === 'function') resetCooldownAdFlag();

  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(s => { _wakeLock = s; }).catch(() => {});
  }

  clearInterval(_timerInterval);
  _timerInterval = setInterval(timerTick, 100);
}

function timerTick() {
  _phaseElapsed += 0.1;
  const phase     = _phases[_currentPhaseIdx];
  const remaining = phase.duration - _phaseElapsed;
  const progress  = _phaseElapsed / phase.duration;

  updateTimerDisplay(formatSeconds(remaining));
  drawRingProgress(_currentPhaseIdx, progress);

  if (_phaseElapsed >= phase.duration) {
    // Pulse the ring wrap on phase change
    const wrap = document.getElementById('timer-ring-wrap');
    if (wrap) {
      wrap.classList.add('phase-pulse');
      wrap.addEventListener('animationend', () => wrap.classList.remove('phase-pulse'), { once: true });
    }

    _currentPhaseIdx++;
    _phaseElapsed = 0;

    if (_currentPhaseIdx >= _phases.length) {
      completeSession();
    } else {
      const nextPhase = _phases[_currentPhaseIdx];
      updatePhaseLabel(nextPhase.label, nextPhase.name);

      if (nextPhase.name === 'cool' && typeof showCooldownAd === 'function') {
        showCooldownAd();
      }
    }
  }
}

function pauseTimer() {
  _timerState = 'paused';
  clearInterval(_timerInterval);
  _wakeLock?.release().catch(() => {}); _wakeLock = null;
  const btn = document.getElementById('timer-start-btn');
  if (btn) btn.textContent = 'Resume';
}

function resumeTimer() {
  _timerState    = 'running';
  _timerInterval = setInterval(timerTick, 100);
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(s => { _wakeLock = s; }).catch(() => {});
  }
  const btn = document.getElementById('timer-start-btn');
  if (btn) btn.textContent = 'Pause';
}

function resetTimer() {
  clearInterval(_timerInterval);
  _timerInterval   = null;
  _timerState      = 'idle';
  _wakeLock?.release().catch(() => {}); _wakeLock = null;
  _phases          = [];
  _currentPhaseIdx = 0;
  _phaseElapsed    = 0;
  _holdStartHeld   = false;
  clearTimeout(_holdTimer);
  if (typeof resetCooldownAdFlag === 'function') resetCooldownAdFlag();

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Start';
  if (resetBtn) resetBtn.style.display = 'none';

  updateTimerDisplay('--:--');
  updatePhaseLabel('', '');
  drawRingIdle();
  hideSessionNotesPanel();
  renderTimerHeatmap();
  _setHeatmapVisible(true);
}

function completeSession() {
  clearInterval(_timerInterval);
  _timerInterval = null;
  _timerState    = 'complete';
  _wakeLock?.release().catch(() => {}); _wakeLock = null;

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Done';
  if (resetBtn) resetBtn.style.display = 'flex';

  updateTimerDisplay('Done');
  updatePhaseLabel('Complete', 'cool');
  if (_phases.length) drawRingProgress(_phases.length - 1, 1);

  _setHeatmapVisible(true);
  showVaporRise();
}

// ── Completion animation (Vapor Rise) ────────────────────────────────────────

function showVaporRise() {
  const overlay = document.getElementById('vapor-rise-overlay');
  if (overlay) overlay.classList.add('show');
}

function dismissVaporRise() {
  const overlay = document.getElementById('vapor-rise-overlay');
  if (overlay) overlay.classList.remove('show');
  showSessionNotesPanel();
}

// ── Session notes panel ───────────────────────────────────────────────────────

function showSessionNotesPanel(existing) {
  // Clear any previously-running timers before starting fresh ones
  clearTimeout(_notesAutoClose); _notesAutoClose = null;
  clearInterval(_countdownInterval); _countdownInterval = null;
  _selectedRating = 0;
  // Edit mode when a saved session is explicitly passed in (from stats/home edit
  // button). New sessions call this function with no argument.
  _editMode  = !!existing;
  _editTs    = _editMode ? existing.ts : null;

  // Reset form
  const brandEl  = document.getElementById('session-brand');
  const strainEl = document.getElementById('session-strain');
  const subtitle = document.getElementById('session-notes-subtitle');
  if (brandEl)  brandEl.value  = existing ? (existing.brand  || '') : '';
  if (strainEl) strainEl.value = existing ? (existing.strain || '') : '';
  if (subtitle) subtitle.textContent = _editMode ? 'Editing past session' : 'Log what you\'re smoking';

  // Update strain list for pre-populated brand
  if (typeof updateStrainList === 'function') {
    updateStrainList(brandEl ? brandEl.value.trim() : '');
  }

  // Pre-select rating if editing
  if (existing && existing.rating) selectRating(existing.rating);
  else {
    document.querySelectorAll('#session-stars button').forEach(btn => btn.classList.remove('selected'));
  }

  // Show panel + overlay
  const panel   = document.getElementById('session-notes-panel');
  const overlay = document.getElementById('session-notes-overlay');
  if (panel)   panel.classList.add('open');
  if (overlay) overlay.classList.add('open');

  // 30-second auto-close
  let remaining = 30;
  const countdownEl = document.getElementById('session-notes-countdown');
  if (countdownEl) countdownEl.textContent = '';

  _countdownInterval = setInterval(() => {
    remaining--;
    // Show countdown for last 10 seconds (skip 0 — save fires immediately)
    if (countdownEl && remaining > 0 && remaining <= 10) {
      countdownEl.textContent = `Auto-saving in ${remaining}s`;
    }
    if (remaining <= 0) {
      clearInterval(_countdownInterval);
      saveSessionNotes();
    }
  }, 1000);

  // Belt-and-suspenders: setTimeout as fallback if interval drifts
  _notesAutoClose = setTimeout(() => {
    clearInterval(_countdownInterval);
    saveSessionNotes();
  }, 30000);
}

function hideSessionNotesPanel() {
  clearTimeout(_notesAutoClose);
  clearInterval(_countdownInterval);
  const panel   = document.getElementById('session-notes-panel');
  const overlay = document.getElementById('session-notes-overlay');
  if (panel)   panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  const countdownEl = document.getElementById('session-notes-countdown');
  if (countdownEl) countdownEl.textContent = '';
}

function selectRating(n) {
  _selectedRating = n;
  document.querySelectorAll('#session-stars button').forEach((btn, i) => {
    btn.classList.toggle('selected', i < n);
  });
}

function saveSessionNotes() {
  const rating = _selectedRating || 3;
  const brand  = document.getElementById('session-brand')?.value?.trim()  || '';
  const strain = document.getElementById('session-strain')?.value?.trim() || '';

  if (_editMode && _editTs) {
    window.dispatchEvent(new CustomEvent('session-edit', {
      detail: { ts: _editTs, brand, strain, rating },
    }));
    _editMode = false;
    _editTs   = null;
    hideSessionNotesPanel();
  } else {
    const config = window._timerConfig || {};
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
    hideSessionNotesPanel();
    setTimeout(() => {
      resetTimer();
      if (typeof switchScreen === 'function') switchScreen('home');
    }, 430);
  }
}

function skipSessionNotes() {
  if (!document.getElementById('session-notes-panel')?.classList.contains('open')) return;
  hideSessionNotesPanel();
  if (!_editMode) {
    setTimeout(() => resetTimer(), 430);
  }
}

// Called from stats page "Add Notes" buttons
function editSessionByTs(ts) {
  const sessions = typeof getSessions === 'function' ? getSessions() : [];
  const session  = sessions.find(s => s.ts === ts);
  if (!session) return;
  showSessionNotesPanel(session);
}

// ── Easter eggs ──────────────────────────────────────────────────────────────

function triggerBloomEasterEgg() {
  const container = document.getElementById('timer-bloom');
  if (!container) return;
  const cs   = getComputedStyle(document.documentElement);
  const cool = cs.getPropertyValue('--arc-cool').trim()   || '#5B9CF6';
  const heat = cs.getPropertyValue('--arc-heat').trim()   || '#EF4444';
  const hold = cs.getPropertyValue('--arc-hold').trim()   || '#00C46A';
  container.innerHTML = `
    <div class="bloom-ring">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon
          points="60,10 75,35 103,35 82,52 90,78 60,62 30,78 38,52 17,35 45,35"
          stroke="${cool}" stroke-width="1.5" fill="none" opacity="0.8"/>
        <circle cx="60" cy="60" r="25" stroke="${heat}" stroke-width="1" fill="none"/>
        <circle cx="60" cy="60" r="45" stroke="${hold}" stroke-width="0.5" fill="none" opacity="0.4"/>
      </svg>
    </div>`;
  setTimeout(() => { container.innerHTML = ''; }, 1300);
}
