'use strict';

function initAgeGate() {
  if (localStorage.getItem('dabflow2_age_verified')) return;
  const overlay = document.getElementById('age-gate-overlay');
  if (overlay) overlay.classList.add('show');
}

function ageGateConfirm() {
  localStorage.setItem('dabflow2_age_verified', '1');
  const overlay = document.getElementById('age-gate-overlay');
  if (overlay) overlay.classList.remove('show');
}

function ageGateDeny() {
  const content = document.querySelector('#age-gate-overlay .age-gate-content');
  if (!content) return;

  content.replaceChildren();

  const icon = document.createElement('div');
  icon.textContent = '🚫';
  icon.style.cssText = 'font-size:2rem;margin-bottom:1rem;';

  const heading = document.createElement('h2');
  heading.textContent = 'Adults Only';
  heading.style.cssText = "font-family:'Space Grotesk',sans-serif;font-size:1.3rem;font-weight:700;margin-bottom:0.75rem;color:var(--text-primary);";

  const msg = document.createElement('p');
  msg.textContent = 'This app is for adults only.';
  msg.style.cssText = 'color:var(--text-muted);font-size:0.85rem;';

  content.append(icon, heading, msg);
}

document.addEventListener('DOMContentLoaded', initAgeGate);
