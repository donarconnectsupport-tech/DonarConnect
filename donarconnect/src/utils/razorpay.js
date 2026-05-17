// ─────────────────────────────────────────────────────────────
//  razorpay.js  –  Razorpay checkout helper
//
//  SETUP:
//  Add to .env:  REACT_APP_RAZORPAY_KEY=rzp_live_XXXXXXXXXX
//  (Use rzp_test_... for testing)
// ─────────────────────────────────────────────────────────────

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_XXXXXXXXXX';

/**
 * Dynamically load the Razorpay checkout script
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay checkout popup
 * @param {Object} opts
 * @param {number}   opts.amount      - Amount in PAISE (e.g. 9900 = ₹99)
 * @param {string}   opts.orderId     - Your internal order ID
 * @param {string}   opts.name        - Customer name
 * @param {string}   opts.phone       - Customer phone (10 digits)
 * @param {string}   opts.email       - Customer email
 * @param {Function} opts.onSuccess   - callback(paymentId, orderId, signature)
 * @param {Function} opts.onFailure   - callback(error)
 */
export async function openRazorpay(opts) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    opts.onFailure(new Error('Failed to load Razorpay. Check your internet connection.'));
    return;
  }

  const options = {
    key:         RAZORPAY_KEY,
    amount:      opts.amount,            // paise
    currency:    'INR',
    name:        'DonarConnect',
    description: 'Sample Collection Kit',
    order_id:    opts.razorpayOrderId || '', // leave empty if not using Razorpay Orders API
    prefill: {
      name:    opts.name,
      contact: opts.phone,
      email:   opts.email || '',
    },
    notes: {
      internal_order_id: opts.orderId,
    },
    theme: {
      color: '#1a3a6b',
    },
    modal: {
      ondismiss: () => opts.onFailure(new Error('Payment cancelled')),
    },
    handler: (response) => {
      opts.onSuccess(
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature
      );
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => {
    opts.onFailure(new Error(response.error.description));
  });
  rzp.open();
}
