/**
 * DabFlow — Ember UI Navigation System
 * nav.js — Context bar, section overlay, swipe, ring sync
 *
 * Loads AFTER app.js so window.switchScreen already exists.
 * Enhances it without replacing it.
 */

(function () {
  'use strict';

  // ── Screen order (matches dot indices) ──────────────────────────────────
  var SCREENS = ['home', 'timer', 'stats', 'glass', 'settings'];
  var SCREEN_NAMES = {
    home:     'HOME',
    timer:    'TIMER',
    stats:    'STATS',
    glass:    'GLASS',
    settings: 'SETTINGS',
  };

  var currentIndex = 0;

  // ── DOM refs ─────────────────────────────────────────────────────────────
  var dots         = null;
  var sectionName  = null;
  var overlay      = null;
  var sectionCards = null;
  var ringProgress = null;   // <circle id="ring-progress">
  var timerProgress = null;  // <div id="timer-progress"> (hidden width% bar)
  var timerCircle  = null;   // <div id="timer-circle">

  var RING_CIRCUMFERENCE = 690.8;

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    dots         = document.querySelectorAll('.ctx-dot');
    sectionName  = document.getElementById('ctx-section-name');
    overlay      = document.getElementById('section-overlay');
    sectionCards = document.querySelectorAll('.section-card[data-nav]');
    ringProgress = document.getElementById('ring-progress');
    timerProgress = document.getElementById('timer-progress');
    timerCircle  = document.getElementById('timer-circle');

    // Patch window.switchScreen to also update context bar
    patchSwitchScreen();

    // Swipe detection
    initSwipe();

    // Ring sync — two strategies: MutationObserver on timer-progress + timer-circle
    initRingSync();

    // Determine initial screen (app.js may have already activated one)
    syncFromActiveScreen();

    console.log('[nav.js] Ember UI navigation ready');
  }

  // ── Patch switchScreen ───────────────────────────────────────────────────
  function patchSwitchScreen() {
    var original = window.switchScreen;

    window.switchScreen = function (screenName) {
      // Call original app.js logic first
      if (typeof original === 'function') {
        original(screenName);
      }
      // Then update context bar
      updateContextBar(screenName);
      return false;
    };
  }

  // ── Overlay open / close ─────────────────────────────────────────────────
  window.openSectionOverlay = function () {
    if (!overlay) return;
    // Mark active card
    if (sectionCards) {
      sectionCards.forEach(function (card) {
        var nav = card.getAttribute('data-nav');
        card.classList.toggle('active-section', nav === SCREENS[currentIndex]);
      });
    }
    overlay.classList.add('open');
    // Prevent main scroll while overlay is open
    document.body.style.overflow = 'hidden';
  };

  window.closeSectionOverlay = function () {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  // Click outside the grid card area closes overlay
  window.handleOverlayClick = function (e) {
    if (e.target === overlay) {
      window.closeSectionOverlay();
    }
  };

  // Navigate from overlay card
  window.navTo = function (screenName) {
    window.closeSectionOverlay();
    window.switchScreen(screenName);
  };

  // ── Context bar update ───────────────────────────────────────────────────
  function updateContextBar(screenName) {
    var idx = SCREENS.indexOf(screenName);
    if (idx === -1) return;
    currentIndex = idx;

    // Update dots
    if (dots) {
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === idx);
      });
    }

    // Update label
    if (sectionName) {
      sectionName.textContent = SCREEN_NAMES[screenName] || screenName.toUpperCase();
    }
  }

  // ── Detect which screen is currently active (on load) ────────────────────
  function syncFromActiveScreen() {
    var activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
      var id = activeScreen.id; // e.g. "home-screen"
      var name = id.replace('-screen', '');
      updateContextBar(name);
    }
  }

  // ── Swipe left/right to navigate ────────────────────────────────────────
  function initSwipe() {
    var touchStartX = 0;
    var touchStartY = 0;
    var touchEndX   = 0;
    var touchEndY   = 0;
    var MIN_SWIPE_X = 60;  // px
    var MAX_SWIPE_Y = 80;  // px — avoid triggering on vertical scrolls

    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    mainEl.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    mainEl.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      var dx = touchEndX - touchStartX;
      var dy = Math.abs(touchEndY - touchStartY);

      // Ignore if overlay is open
      if (overlay && overlay.classList.contains('open')) return;
      // Ignore mostly-vertical gestures
      if (dy > MAX_SWIPE_Y) return;

      if (dx < -MIN_SWIPE_X) {
        // Swipe left → next screen
        if (currentIndex < SCREENS.length - 1) {
          window.switchScreen(SCREENS[currentIndex + 1]);
        }
      } else if (dx > MIN_SWIPE_X) {
        // Swipe right → previous screen
        if (currentIndex > 0) {
          window.switchScreen(SCREENS[currentIndex - 1]);
        }
      }
    }
  }

  // ── Ring sync ────────────────────────────────────────────────────────────
  /**
   * app.js controls timer progress by setting the width% of #timer-progress.
   * We observe that element and map width → stroke-dashoffset on #ring-progress.
   *
   * Also observe #timer-circle classList for heating/cooling/done to update
   * the ring diamond indicator color.
   */
  function initRingSync() {
    if (!timerProgress || !ringProgress) return;

    // Strategy 1: MutationObserver on style attribute of #timer-progress
    var styleObserver = new MutationObserver(function () {
      syncRingFromProgress();
    });
    styleObserver.observe(timerProgress, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Strategy 2: Also observe the timer-progress with a setInterval fallback
    // (covers cases where app.js sets width via direct .style without triggering MO)
    var lastWidth = '';
    setInterval(function () {
      var w = timerProgress.style.width;
      if (w !== lastWidth) {
        lastWidth = w;
        syncRingFromProgress();
      }
    }, 100);

    // Observe timer-circle classList for phase changes
    if (timerCircle) {
      var classObserver = new MutationObserver(function () {
        syncRingPhase();
      });
      classObserver.observe(timerCircle, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
  }

  function syncRingFromProgress() {
    if (!ringProgress || !timerProgress) return;

    var widthStr = timerProgress.style.width || '0%';
    var pct = parseFloat(widthStr) / 100; // 0.0 – 1.0
    if (isNaN(pct)) pct = 0;
    pct = Math.max(0, Math.min(1, pct));

    var offset = RING_CIRCUMFERENCE * (1 - pct);
    ringProgress.style.strokeDashoffset = offset;
  }

  function syncRingPhase() {
    if (!timerCircle || !ringProgress) return;

    var cl = timerCircle.classList;
    var diamond = document.getElementById('ring-diamond');

    if (cl.contains('heating')) {
      ringProgress.setAttribute('stroke', 'var(--ember)');
      if (diamond) diamond.setAttribute('fill', '#E24D20');
    } else if (cl.contains('cooling')) {
      ringProgress.setAttribute('stroke', 'var(--amber)');
      if (diamond) diamond.setAttribute('fill', '#F5A623');
    } else if (cl.contains('done')) {
      ringProgress.setAttribute('stroke', 'var(--perfect)');
      if (diamond) diamond.setAttribute('fill', '#22C55E');
    } else {
      ringProgress.setAttribute('stroke', 'var(--ember)');
      if (diamond) diamond.setAttribute('fill', '#E24D20');
    }
  }

  // ── Dot click navigation ─────────────────────────────────────────────────
  function initDotClicks() {
    if (!dots) return;
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        window.switchScreen(SCREENS[i]);
      });
    });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      initDotClicks();
    });
  } else {
    init();
    initDotClicks();
  }

})();
