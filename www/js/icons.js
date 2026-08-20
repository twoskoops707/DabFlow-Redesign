// icons.js — all custom SVG icons + molecule background
const ICONS = {};

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
