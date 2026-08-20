/**
 * Simple Stripe Payment Integration (No Backend Required!)
 * Uses Stripe Payment Links for DabFlow Premium
 */

class SimpleStripePayment {
    constructor() {
        // Stripe Payment Link for DabFlow Premium - $4.99
        this.paymentLinkUrl = 'https://buy.stripe.com/6oUdR97mB865gE89kF9Ve00';
    }

    // Open Stripe payment page
    openPaymentPage() {
        // Save state before leaving
        localStorage.setItem('dabflow_payment_initiated', Date.now().toString());

        // Redirect to Stripe payment page
        window.location.href = this.paymentLinkUrl;
    }

    // Check if user returned from successful payment
    checkForSuccessfulPayment() {
        const urlParams = new URLSearchParams(window.location.search);

        // Stripe redirects back with these parameters
        if (urlParams.get('payment') === 'success') {
            console.log('🎉 Payment successful!');

            // Activate Premium
            if (window.activatePremium) {
                activatePremium();
                showPremiumUnlockAnimation();
            }

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);

            return true;
        }

        if (urlParams.get('payment') === 'cancelled') {
            console.log('❌ Payment cancelled');
            alert('Payment was cancelled. You can try again anytime!');

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);

            return false;
        }

        return null;
    }
}

// Initialize
window.simpleStripePayment = new SimpleStripePayment();

// Check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.simpleStripePayment.checkForSuccessfulPayment();
    });
} else {
    window.simpleStripePayment.checkForSuccessfulPayment();
}
