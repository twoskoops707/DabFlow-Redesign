'use strict';

const PHASE_COLORS = {
  heat: '#EF4444',
  hold: '#00C46A',
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

function _getCoolColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--arc-cool').trim() || '#5B9CF6';
}

function _getPhaseColor(phaseName) {
  if (phaseName === 'heat') return PHASE_COLORS.heat;
  if (phaseName === 'hold') return PHASE_COLORS.hold;
  return _getCoolColor();
}

function drawRingIdle() {
  const arc = _getArcProgress();
  if (arc) {
    arc.setAttribute('stroke-dasharray', `0 ${ARC_CIRC}`);
    arc.setAttribute('stroke', PHASE_COLORS.heat);
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
  }
  _refreshTimerChips();
}

function buildPhases(config) {
  return [
    { name: 'heat', label: 'Heat',      duration: config.heat, color: PHASE_COLORS.heat },
    { name: 'hold', label: 'Hold',      duration: config.hold, color: PHASE_COLORS.hold },
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
  if (phaseName === 'heat')      el.style.color = PHASE_COLORS.heat;
  else if (phaseName === 'hold') el.style.color = PHASE_COLORS.hold;
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

function startTimer() {
  const config  = window._timerConfig || { heat: 18, hold: 6, cool: 60 };
  _phases          = buildPhases(config);
  _currentPhaseIdx = 0;
  _phaseElapsed    = 0;
  _sessionStart    = Date.now();
  _timerState      = 'running';

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Pause';
  if (resetBtn) resetBtn.style.display = 'flex';

  if (_phases.length) updatePhaseLabel(_phases[0].label, _phases[0].name);

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
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

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
      updatePhaseLabel(_phases[_currentPhaseIdx].label, _phases[_currentPhaseIdx].name);
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

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Start';
  if (resetBtn) resetBtn.style.display = 'none';

  updateTimerDisplay('--:--');
  updatePhaseLabel('', '');
  drawRingIdle();
  hideSessionNotesPanel();
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

  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

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
