'use strict';

const NAV_ICONS = ['home', 'timer', 'stats', 'glass', 'settings'];
let currentScreen = 'home';

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

// Stubs — filled in later tasks
function renderHome() {}
function renderGlass() {}
function renderSettings() {}
function renderStats() {}
function initTimer() {}
function getSessions() { return JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]'); }
function saveSession(s) { const arr = getSessions(); arr.push(s); localStorage.setItem('dabflow2_sessions', JSON.stringify(arr)); }
function getStreak() { return 0; }

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
