'use strict';

function initAds() {
  if (window.BUILD_VARIANT === 'premium') return;

  document.querySelectorAll('.ad-slot').forEach(el => {
    el.style.display = 'flex';
  });

  const script = document.createElement('script');
  script.src = 'https://mantisadnetwork.com/monetize.js';
  script.async = true;
  script.setAttribute('data-website', 'dabflow.app');
  document.head.appendChild(script);
}
