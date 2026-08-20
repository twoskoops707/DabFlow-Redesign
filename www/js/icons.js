// icons.js — all custom SVG icons + molecule background
const ICONS = {};

ICONS.home = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Flame/drop hybrid: teardrop body with flame tip -->
  <path d="M12 3 C12 3 6 9 6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14 C18 9 12 3 12 3Z"/>
  <path d="M9.5 15.5 C9.5 15.5 10 13 12 12" stroke-width="1"/>
</svg>`;

ICONS.timer = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Arc ring with gap at top — segmented timer -->
  <path d="M12 4 A8 8 0 0 1 20 12"/>
  <path d="M20 12 A8 8 0 0 1 12 20"/>
  <path d="M12 20 A8 8 0 0 1 4 12"/>
  <path d="M4 12 A8 8 0 0 1 10.5 4.3"/>
  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
</svg>`;

ICONS.stats = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Pulse/bar chart: 3 bars with ECG spike -->
  <line x1="3" y1="18" x2="3" y2="12"/>
  <line x1="8" y1="18" x2="8" y2="8"/>
  <line x1="13" y1="18" x2="13" y2="14"/>
  <path d="M16 18 L16 6 L19 10 L21 6"/>
</svg>`;

ICONS.glass = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Dab rig silhouette: base, tube, joint, mouthpiece -->
  <rect x="6" y="19" width="12" height="2" rx="1"/>
  <path d="M9 19 L9 13 Q9 10 12 10 Q15 10 15 13 L15 19"/>
  <path d="M15 14 L19 10"/>
  <circle cx="20" cy="9" r="1.5"/>
  <path d="M9 14 L6 11"/>
  <circle cx="5" cy="10" r="1" fill="currentColor" stroke="none"/>
</svg>`;

ICONS.settings = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Molecule gear: hexagon body with 6 outer nodes -->
  <polygon points="12,5 16.2,7.5 16.2,12.5 12,15 7.8,12.5 7.8,7.5"/>
  <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="2.5"  r="1" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="6.25"  r="1" fill="currentColor" stroke="none"/>
  <circle cx="5"  cy="6.25"  r="1" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="13.75" r="1" fill="currentColor" stroke="none"/>
  <circle cx="5"  cy="13.75" r="1" fill="currentColor" stroke="none"/>
  <line x1="12" y1="5"    x2="12" y2="3.5"/>
  <line x1="12" y1="15"   x2="12" y2="16.5"/>
  <line x1="16.2" y1="7.5"  x2="18" y2="6.5"/>
  <line x1="7.8"  y1="7.5"  x2="6"  y2="6.5"/>
  <line x1="16.2" y1="12.5" x2="18" y2="13.5"/>
  <line x1="7.8"  y1="12.5" x2="6"  y2="13.5"/>
</svg>`;

ICONS['chevron-right'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 6 L15 12 L9 18"/>
</svg>`;

ICONS['chevron-left'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 6 L9 12 L15 18"/>
</svg>`;

ICONS.lock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="11" width="14" height="10" rx="2"/>
  <path d="M8 11 V7 A4 4 0 0 1 16 7 V11"/>
</svg>`;

ICONS.crown = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 17 L5 8 L9 13 L12 6 L15 13 L19 8 L21 17 Z"/>
  <line x1="3" y1="20" x2="21" y2="20"/>
</svg>`;

ICONS['link-out'] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 13 V19 A2 2 0 0 1 16 21 H5 A2 2 0 0 1 3 19 V8 A2 2 0 0 1 5 6 H11"/>
  <path d="M15 3 H21 V9"/>
  <line x1="10" y1="14" x2="21" y2="3"/>
</svg>`;

ICONS.check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 12 L9 17 L20 7"/>
</svg>`;

ICONS.add = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>`;

ICONS.edit = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

function getIcon(name, size = 24) {
  const svg = ICONS[name];
  if (!svg) return '';
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
}

function injectMoleculeBg() {
  const el = document.getElementById('molecule-bg');
  if (!el) return;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2ECC8A';
  // Terpene/benzene ring motif — hexagonal carbon chains
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="mol" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
          <!-- Benzene ring -->
          <polygon points="20,4 36,13 36,31 20,40 4,31 4,13"
            fill="none" stroke="${accent}" stroke-width="1"/>
          <!-- Inner ring (double bond representation) -->
          <polygon points="20,10 30,16 30,28 20,34 10,28 10,16"
            fill="none" stroke="${accent}" stroke-width="0.5"/>
          <!-- Carbon chain branches -->
          <line x1="20" y1="4"  x2="20" y2="0"  stroke="${accent}" stroke-width="1"/>
          <line x1="36" y1="13" x2="44" y2="9"  stroke="${accent}" stroke-width="1"/>
          <line x1="36" y1="31" x2="44" y2="35" stroke="${accent}" stroke-width="1"/>
          <line x1="20" y1="40" x2="20" y2="48" stroke="${accent}" stroke-width="1"/>
          <line x1="4"  y1="31" x2="-4" y2="35" stroke="${accent}" stroke-width="1"/>
          <line x1="4"  y1="13" x2="-4" y2="9"  stroke="${accent}" stroke-width="1"/>
          <!-- Second offset ring -->
          <polygon points="60,50 76,59 76,77 60,86 44,77 44,59"
            fill="none" stroke="${accent}" stroke-width="1"/>
          <polygon points="60,56 70,62 70,74 60,80 50,74 50,62"
            fill="none" stroke="${accent}" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mol)"/>
    </svg>`;
}
