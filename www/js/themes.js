'use strict';

const THEMES = [
  { id: 'default',     name: 'Default',     arcCool: '#5B9CF6', unlockType: 'always',   unlockVal: 0   },
  { id: 'kush',        name: 'Kush',        arcCool: '#4ADE80', unlockType: 'sessions', unlockVal: 1   },
  { id: 'terminal',    name: 'Terminal',    arcCool: '#00FF41', unlockType: 'sessions', unlockVal: 10  },
  { id: 'bond',        name: 'Bond',        arcCool: '#A0A0C8', unlockType: 'streak',   unlockVal: 7   },
  { id: 'cyberpunk',   name: 'Cyberpunk',   arcCool: '#00FFFF', unlockType: 'sessions', unlockVal: 30  },
  { id: 'steampunk',   name: 'Steampunk',   arcCool: '#E8B84B', unlockType: 'sessions', unlockVal: 50  },
  { id: 'tie-dye',     name: 'Tie Dye',     arcCool: null,      unlockType: 'sessions', unlockVal: 75  },
  { id: 'sugar-skull', name: 'Sugar Skull', arcCool: '#00BCD4', unlockType: 'sessions', unlockVal: 100 },
];

function _themeStreak() {
  const sessions = JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => new Date(s.ts).toDateString()));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function isThemeUnlocked(theme) {
  if (window.BUILD_VARIANT === 'premium') return true;
  if (theme.unlockType === 'always') return true;
  if (theme.unlockType === 'sessions') {
    const sessions = JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
    return sessions.length >= theme.unlockVal;
  }
  if (theme.unlockType === 'streak') {
    return _themeStreak() >= theme.unlockVal;
  }
  return false;
}

function getActiveTheme() {
  return localStorage.getItem('dabflow2_active_theme') || 'default';
}

function setActiveTheme(id) {
  const theme = THEMES.find(t => t.id === id);
  if (!theme || !isThemeUnlocked(theme)) return;
  localStorage.setItem('dabflow2_active_theme', id);
  document.documentElement.setAttribute('data-theme', id);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { id } }));
}

function checkThemeUnlocks() {
  THEMES.forEach(theme => {
    if (isThemeUnlocked(theme)) {
      localStorage.setItem(`dabflow2_theme_unlocked_${theme.id}`, '1');
    }
  });
}

function initThemes() {
  const saved = getActiveTheme();
  const theme = THEMES.find(t => t.id === saved);
  const activeId = (theme && isThemeUnlocked(theme)) ? saved : 'default';
  document.documentElement.setAttribute('data-theme', activeId);
}

// Apply theme immediately on parse (before DOMContentLoaded)
initThemes();
