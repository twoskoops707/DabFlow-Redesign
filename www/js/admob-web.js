// Google AdSense Integration for DabFlow Web
// This replaces Capacitor AdMob for web deployment

const ADSENSE_CONFIG = {
    publisher: 'ca-pub-8074324810681981', // Your AdSense Publisher ID
    enabled: true // AdSense ENABLED!
};

let sessionCount = 0;
let adsenseReady = false;

// Initialize Google AdSense
function initAdSense() {
    if (!ADSENSE_CONFIG.enabled) {
        console.log('⚠️ AdSense not configured yet');
        return;
    }

    try {
        // Load AdSense script
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisher}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            adsenseReady = true;
            console.log('✅ AdSense loaded');
            showBannerAds();
        };
        script.onerror = () => {
            console.error('❌ AdSense failed to load');
        };
        document.head.appendChild(script);
    } catch (err) {
        console.error('AdSense init error:', err);
    }
}

// Show banner ads in placeholder divs
function showBannerAds() {
    if (!adsenseReady) return;

    const adContainers = document.querySelectorAll('.ad-container.banner');
    adContainers.forEach((container, index) => {
        // Clear placeholder text
        container.innerHTML = '';

        // Create AdSense ad unit
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', ADSENSE_CONFIG.publisher);
        ins.setAttribute('data-ad-slot', '0000000000'); // Replace with your ad slot
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');

        container.appendChild(ins);

        // Push ad
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense push error:', e);
        }
    });
}

// Show interstitial-style ad every 5 sessions
function showInterstitial() {
    sessionCount++;
    if (sessionCount % 5 !== 0) return;

    // For web, we can't show true interstitials
    // Instead, show a modal with an ad
    if (adsenseReady) {
        console.log('ℹ️ Interstitial ads not supported on web');
    }
}

// Reward ad alternative for web (not available)
function showRewardedForTheme() {
    console.log('ℹ️ Rewarded ads not available on web');
    return Promise.resolve(false);
}

// Export to global
window.DabFlowAds = {
    showInterstitial,
    showRewardedForTheme
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdSense);
} else {
    initAdSense();
}
