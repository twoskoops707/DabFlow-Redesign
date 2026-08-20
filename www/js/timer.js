'use strict';

const PHASE_COLORS = {
  heat: '#5B9CF6',
  hold: '#F5A623',
  cool: '#2ECC8A',
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

// ── Timer ring ──────────────────────────────────────────────────────────────

function initTimer() {
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;

  // Only resize when dimensions actually changed — assigning canvas.width always
  // clears the canvas even when the value is identical, which would erase a
  // running timer's ring for up to 100ms.
  const newW = (canvas.offsetWidth  * window.devicePixelRatio) || 600;
  const newH = (canvas.offsetHeight * window.devicePixelRatio) || 600;
  if (canvas.width !== newW || canvas.height !== newH) {
    canvas.width  = newW;
    canvas.height = newH;
  }

  const rb = document.getElementById('timer-reset-btn');
  if (rb && !rb.dataset.iconSet && typeof getIcon === 'function') {
    rb.innerHTML = getIcon('chevron-left', 20);
    rb.dataset.iconSet = '1';
  }

  // Only reset display and ring when idle — don't overwrite a live timer.
  if (_timerState === 'idle') {
    drawRingIdle();
    updateTimerDisplay('--:--');
  }
}

function buildPhases(config) {
  return [
    { name: 'heat', label: 'Heat',      duration: config.heat, color: PHASE_COLORS.heat },
    { name: 'hold', label: 'Hold',      duration: config.hold, color: PHASE_COLORS.hold },
    { name: 'cool', label: 'Cool Down', duration: config.cool, color: PHASE_COLORS.cool },
  ].filter(p => p.duration > 0);
}

function _ringSetup(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r  = Math.min(W, H) * 0.42;
  const lw = W * 0.07;
  const gap = 0.04;
  return { ctx, W, H, cx, cy, r, lw, gap };
}

function drawRingIdle() {
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  const { ctx, W, H, cx, cy, r, lw, gap } = _ringSetup(canvas);
  const idlePhases = [PHASE_COLORS.heat, PHASE_COLORS.hold, PHASE_COLORS.cool];
  const n = idlePhases.length;
  const segSize = (2 * Math.PI - gap * n) / n;
  const startAngle = -Math.PI / 2;
  ctx.clearRect(0, 0, W, H);
  idlePhases.forEach((_, i) => {
    const s = startAngle + i * (segSize + gap);
    ctx.beginPath();
    ctx.arc(cx, cy, r, s, s + segSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = lw;
    ctx.lineCap  = 'round';
    ctx.stroke();
  });
}

function drawRingProgress(phaseIdx, progress) {
  const canvas = document.getElementById('timer-ring');
  if (!canvas || !_phases.length) return;
  const { ctx, W, H, cx, cy, r, lw, gap } = _ringSetup(canvas);
  const n = _phases.length;
  const segSize = (2 * Math.PI - gap * n) / n;
  const startAngle = -Math.PI / 2;
  ctx.clearRect(0, 0, W, H);
  _phases.forEach((phase, i) => {
    const s = startAngle + i * (segSize + gap);
    const e = s + segSize;
    ctx.beginPath();
    ctx.arc(cx, cy, r, s, e);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = lw;
    ctx.lineCap  = 'round';
    ctx.stroke();
    if (i < phaseIdx) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, s, e);
      ctx.strokeStyle  = phase.color;
      ctx.globalAlpha  = 0.5;
      ctx.lineWidth    = lw;
      ctx.lineCap      = 'round';
      ctx.stroke();
      ctx.globalAlpha  = 1;
    } else if (i === phaseIdx) {
      const fillEnd = s + segSize * Math.min(progress, 1);
      if (fillEnd > s) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, s, fillEnd);
        ctx.strokeStyle = phase.color;
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
    }
  });
}

function updateTimerDisplay(text, sub) {
  const el = document.getElementById('timer-display');
  const subEl = document.getElementById('timer-sub');
  if (el) el.textContent = text;
  if (subEl) subEl.textContent = sub !== undefined ? sub : '';
}

function updatePhaseLabel(text) {
  const el = document.getElementById('timer-phase-label');
  if (el) el.textContent = text;
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
  const config  = window._timerConfig || { heat: 45, hold: 8, cool: 30 };
  _phases          = buildPhases(config);
  _currentPhaseIdx = 0;
  _phaseElapsed    = 0;
  _sessionStart    = Date.now();
  _timerState      = 'running';

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent        = 'Pause';
  if (resetBtn) resetBtn.style.display = 'flex';

  if (_phases.length) updatePhaseLabel(_phases[0].label);

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
      updatePhaseLabel(_phases[_currentPhaseIdx].label);
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

  updateTimerDisplay('--:--', '');
  updatePhaseLabel('');
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

  updateTimerDisplay('Done', 'nice one');
  updatePhaseLabel('Complete');
  if (_phases.length) drawRingProgress(_phases.length - 1, 1);

  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

  // Completion phrase animation, then show session notes panel
  showDabCompleteAnimation();
  setTimeout(() => showSessionNotesPanel(), 1900);
}

// ── Completion animation ─────────────────────────────────────────────────────

function showDabCompleteAnimation() {
  const phrase  = DAB_PHRASES[Math.floor(Math.random() * DAB_PHRASES.length)];
  const overlay = document.getElementById('dab-complete-overlay');
  const text    = document.getElementById('dab-complete-text');
  if (!overlay || !text) return;
  text.textContent = phrase;
  // Force reflow so re-triggering animation works
  void overlay.offsetWidth;
  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 2400);
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
        ts:       _sessionStart || Date.now(),
        heat:     config.heat  || 0,
        hold:     config.hold  || 0,
        cool:     config.cool  || 0,
        material: window._selectedMaterial || 'Quartz',
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
  const cool = cs.getPropertyValue('--phase-cool').trim() || '#2ECC8A';
  const heat = cs.getPropertyValue('--phase-heat').trim() || '#5B9CF6';
  const hold = cs.getPropertyValue('--phase-hold').trim() || '#F5A623';
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
