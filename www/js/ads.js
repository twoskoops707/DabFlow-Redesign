'use strict';

// ── Ad configuration ────────────────────────────────────────────────────────
const ADS_CONFIG = {
  adsterra: {
    banner: 'https://pl25890560.profitablecpmrate.com/37/7f/3f/377f3fef35ebe837c51793d861ec5d33.js',
  },
  admob: {
    appId:            'ca-app-pub-6588738221262894~7650893291',
    interstitialId:   'ca-app-pub-6588738221262894/3570836033',
    testMode:         true,  // flip to false for production
  },
  unity: {
    // Fed into AdMob as a mediation source (configured on the AdMob dashboard)
    gameId:              '800363424',
    cooldownPlacementId: 'Cool_Down',
  },
};

let _admobReady        = false;
let _cooldownAdShown   = false;
let _lastVideoAdAt     = 0;
const VIDEO_MIN_GAP_MS = 5 * 60 * 1000;

// ── Public entry ────────────────────────────────────────────────────────────
function initAds() {
  if (window.BUILD_VARIANT === 'premium') return;

  initAdsterraBanners();
  initAdMobInterstitial();
}

// ── Adsterra banner (drop-in JS, web-loaded) ────────────────────────────────
function initAdsterraBanners() {
  document.querySelectorAll('.ad-slot').forEach(el => {
    el.style.display = 'flex';

    const script = document.createElement('script');
    script.src   = ADS_CONFIG.adsterra.banner;
    script.async = true;
    script.onerror = () => { el.style.display = 'none'; };
    el.appendChild(script);
  });
}

// ── AdMob interstitial (@capacitor-community/admob) ────────────────────────
async function initAdMobInterstitial() {
  const AdMob = window.Capacitor?.Plugins?.AdMob;
  if (!AdMob) {
    console.log('[ads] AdMob plugin unavailable — video disabled');
    return;
  }

  try {
    await AdMob.initialize({
      initializeForTesting: ADS_CONFIG.admob.testMode,
    });
    await AdMob.prepareInterstitial({
      adId:      ADS_CONFIG.admob.interstitialId,
      isTesting: ADS_CONFIG.admob.testMode,
    });
    _admobReady = true;
    console.log('[ads] AdMob interstitial ready');
  } catch (err) {
    console.warn('[ads] AdMob init/prepare failed', err);
  }
}

// ── Called by timer.js when the cool phase begins ──────────────────────────
async function showCooldownAd() {
  if (window.BUILD_VARIANT === 'premium') return;
  if (_cooldownAdShown) return;
  if (Date.now() - _lastVideoAdAt < VIDEO_MIN_GAP_MS) return;
  if (!_admobReady) return;

  const AdMob = window.Capacitor?.Plugins?.AdMob;
  if (!AdMob) return;

  try {
    await AdMob.showInterstitial();
    _cooldownAdShown = true;
    _lastVideoAdAt   = Date.now();

    // Preload the next impression
    AdMob.prepareInterstitial({
      adId:      ADS_CONFIG.admob.interstitialId,
      isTesting: ADS_CONFIG.admob.testMode,
    }).catch(() => {});
  } catch (err) {
    console.warn('[ads] AdMob show failed', err);
  }
}

function resetCooldownAdFlag() {
  _cooldownAdShown = false;
}

window.showCooldownAd      = showCooldownAd;
window.resetCooldownAdFlag = resetCooldownAdFlag;
