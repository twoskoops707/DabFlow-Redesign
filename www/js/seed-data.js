'use strict';

function generateSeedData() {
  const existing = JSON.parse(localStorage.getItem('dabflow2_sessions') || '[]');
  if (existing.length >= 100) return;

  const materials = ['Quartz', 'Quartz', 'Quartz', 'Banger', 'Banger', 'Titanium'];
  const configs = [
    { heat: 45, hold: 8,  cool: 30 },
    { heat: 55, hold: 10, cool: 45 },
    { heat: 40, hold: 6,  cool: 25 },
    { heat: 60, hold: 12, cool: 50 },
  ];

  const sessions = [];
  const dayMs = 86400000;
  const localMidnight = new Date().setHours(0, 0, 0, 0);

  const activeDays = new Set();
  for (let i = 0; i < 90; i++) {
    if (Math.random() < 0.7) activeDays.add(i);
  }

  const dayList = Array.from(activeDays).sort((a, b) => b - a);
  let count = 0;

  for (const dayOffset of dayList) {
    if (count >= 100) break;
    const sessionsOnDay = count + 2 <= 100 && Math.random() < 0.3 ? 2 : 1;

    for (let s = 0; s < sessionsOnDay && count < 100; s++) {
      const hourWeights = [0,0,0,0,0,0,1,1,2,3,3,3,4,4,5,5,6,8,9,10,9,8,7,4];
      const hour = weightedRandom(hourWeights);
      const minute = Math.floor(Math.random() * 60);
      const ts = localMidnight - (dayOffset * dayMs) + hour * 3600000 + minute * 60000;

      const cfg = configs[Math.floor(Math.random() * configs.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const rating = Math.random() < 0.1 ? 3 : (Math.random() < 0.3 ? 4 : 5);

      sessions.push({ ts, material, rating, heat: cfg.heat, hold: cfg.hold, cool: cfg.cool });
      count++;
    }
  }

  sessions.sort((a, b) => a.ts - b.ts);
  localStorage.setItem('dabflow2_sessions', JSON.stringify(sessions));
}

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
