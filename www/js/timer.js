'use strict';

const PHASE_COLORS = {
  heat: '#5B9CF6',
  hold: '#F5A623',
  cool: '#2ECC8A',
};

let _timerInterval = null;
let _timerState = 'idle'; // idle | running | paused | complete
let _phases = [];
let _currentPhaseIdx = 0;
let _phaseElapsed = 0;
let _holdStartHeld = false;
let _holdTimer = null;
let _sessionStart = null;
let _wakeLock = null;

function initTimer() {
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  canvas.width  = (canvas.offsetWidth  * window.devicePixelRatio) || 600;
  canvas.height = (canvas.offsetHeight * window.devicePixelRatio) || 600;

  // Inject reset icon if not yet set
  const rb = document.getElementById('timer-reset-btn');
  if (rb && !rb.dataset.iconSet && typeof getIcon === 'function') {
    rb.innerHTML = getIcon('chevron-left', 20);
    rb.dataset.iconSet = '1';
  }

  drawRingIdle();
  updateTimerDisplay('--:--');
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
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r  = Math.min(W, H) * 0.42;
  const lw = W * 0.07;
  const gap = 0.04; // radians between segments
  return { ctx, W, H, cx, cy, r, lw, gap };
}

function drawRingIdle() {
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  const { ctx, W, H, cx, cy, r, lw, gap } = _ringSetup(canvas);

  // Use a 3-segment idle ring regardless of _phases state
  const idlePhases = [
    { color: PHASE_COLORS.heat },
    { color: PHASE_COLORS.hold },
    { color: PHASE_COLORS.cool },
  ];
  const n = idlePhases.length;
  const segSize = (2 * Math.PI - gap * n) / n;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, W, H);

  idlePhases.forEach((phase, i) => {
    const segStart = startAngle + i * (segSize + gap);
    const segEnd   = segStart + segSize;
    ctx.beginPath();
    ctx.arc(cx, cy, r, segStart, segEnd);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = lw;
    ctx.lineCap     = 'round';
    ctx.stroke();
  });
}

function drawRingProgress(phaseIdx, progress) {
  // progress: 0–1 within current phase
  const canvas = document.getElementById('timer-ring');
  if (!canvas) return;
  const { ctx, W, H, cx, cy, r, lw, gap } = _ringSetup(canvas);

  const phases = _phases;
  if (!phases.length) return;

  const n = phases.length;
  const segSize = (2 * Math.PI - gap * n) / n;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, W, H);

  phases.forEach((phase, i) => {
    const segStart = startAngle + i * (segSize + gap);
    const segEnd   = segStart + segSize;

    // Dim background track
    ctx.beginPath();
    ctx.arc(cx, cy, r, segStart, segEnd);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = lw;
    ctx.lineCap     = 'round';
    ctx.stroke();

    if (i < phaseIdx) {
      // Completed phase — full arc at 50% opacity
      ctx.beginPath();
      ctx.arc(cx, cy, r, segStart, segEnd);
      ctx.strokeStyle  = phase.color;
      ctx.globalAlpha  = 0.5;
      ctx.lineWidth    = lw;
      ctx.lineCap      = 'round';
      ctx.stroke();
      ctx.globalAlpha  = 1;
    } else if (i === phaseIdx) {
      // Current phase — partial fill
      const fillEnd = segStart + segSize * Math.min(progress, 1);
      if (fillEnd > segStart) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, segStart, fillEnd);
        ctx.strokeStyle = phase.color;
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
    }
    // Future phases: dim track only (already drawn above)
  });
}

function updateTimerDisplay(text, sub) {
  const el    = document.getElementById('timer-display');
  const subEl = document.getElementById('timer-sub');
  if (el)    el.textContent  = text;
  if (subEl) subEl.textContent = sub !== undefined ? sub : '';
}

function updatePhaseLabel(text) {
  const el = document.getElementById('timer-phase-label');
  if (el) el.textContent = text;
}

function formatSeconds(s) {
  const secs = Math.max(0, Math.ceil(s));
  const m    = Math.floor(secs / 60);
  const sec  = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function handleTimerBtn() {
  if (_timerState === 'running') {
    pauseTimer();
    return;
  }
  if (_timerState === 'paused') {
    resumeTimer();
    return;
  }
  if (_timerState === 'complete') {
    return; // "Done" state — user must rate or reset
  }

  // idle state — set up hold detection for easter egg
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

  // Normal tap releases pointer before 4.2s — cancel hold and start immediately
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
  const config = window._timerConfig || { heat: 45, hold: 8, cool: 30 };
  _phases          = buildPhases(config);
  _currentPhaseIdx = 0;
  _phaseElapsed    = 0;
  _sessionStart    = Date.now();
  _timerState      = 'running';

  const btn      = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  if (btn)      btn.textContent      = 'Pause';
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
  const ratingEl = document.getElementById('timer-rating');
  if (btn)      btn.textContent        = 'Start';
  if (resetBtn) resetBtn.style.display = 'none';
  if (ratingEl) ratingEl.style.display = 'none';

  updateTimerDisplay('--:--', '');
  updatePhaseLabel('');
  drawRingIdle();
}

function completeSession() {
  clearInterval(_timerInterval);
  _timerInterval = null;
  _timerState    = 'complete';
  _wakeLock?.release().catch(() => {}); _wakeLock = null;

  const btn      = document.getElementById('timer-start-btn');
  const ratingEl = document.getElementById('timer-rating');
  if (btn)      btn.textContent        = 'Done';
  if (ratingEl) ratingEl.style.display = 'block';

  updateTimerDisplay('Done', 'Rate your session');
  updatePhaseLabel('Complete');
  if (_phases.length) drawRingProgress(_phases.length - 1, 1);

  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
}

function rateSession(rating) {
  // Highlight selected stars
  document.querySelectorAll('#timer-rating button').forEach((btn, i) => {
    btn.style.opacity = i < rating ? '1' : '0.3';
  });

  const config = window._timerConfig || {};
  window.dispatchEvent(new CustomEvent('session-complete', {
    detail: {
      ts:       _sessionStart || Date.now(),
      heat:     config.heat     || 0,
      hold:     config.hold     || 0,
      cool:     config.cool     || 0,
      material: window._selectedMaterial || 'Quartz',
      rating,
    },
  }));

  setTimeout(() => {
    resetTimer();
    if (typeof switchScreen === 'function') switchScreen('home');
  }, 800);
}

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
        <circle cx="60" cy="60" r="25"
          stroke="${heat}" stroke-width="1" fill="none"/>
        <circle cx="60" cy="60" r="45"
          stroke="${hold}" stroke-width="0.5" fill="none" opacity="0.4"/>
      </svg>
    </div>`;
  setTimeout(() => { container.innerHTML = ''; }, 1300);
}
