// ─────────────────────────────────────────────────────────────
//  api.js  –  Google Sheets / Apps Script backend connector
//
//  SETUP:
//  1. Deploy your Apps Script as a Web App (see SETUP_GUIDE.md)
//  2. Copy the deployment URL into your .env file:
//     REACT_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
// ─────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

/**
 * Generate a unique order ID like DC987654321
 */
export function generateOrderId() {
  const ts = Date.now().toString().slice(-9);
  return `DC${ts}`;
}

/**
 * Submit a new order to Google Sheets via Apps Script
 * @param {Object} orderData - Full order object
 * @returns {Promise<{success: boolean, orderId: string, message: string}>}
 */
export async function submitOrder(orderData) {
  if (!SCRIPT_URL) {
    console.warn('REACT_APP_SCRIPT_URL not set. Using mock response.');
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, orderId: orderData.orderId, message: 'Order saved (mock)' };
  }

  const payload = {
    action: 'submitOrder',
    data: {
      orderId:       orderData.orderId,
      timestamp: new Date().toLocaleString('en-IN', {
       timeZone: 'Asia/Kolkata'}),
      // Personal details
      fullName:      orderData.fullName,
      phone:         orderData.phone,
      email:         orderData.email || '',
      dob:           orderData.dob || '',
      address:       orderData.address,
      pincode:       orderData.pincode,
      city:          orderData.city,
      state:         orderData.state,
      // Order details
      quantity:      orderData.quantity,
      unitPrice:     orderData.unitPrice,
      totalAmount:   orderData.totalAmount,
      productName:   orderData.productName,
      // Payment
      paymentMethod: orderData.paymentMethod,   // 'COD' | 'UPI' | 'RAZORPAY'
      paymentStatus: orderData.paymentStatus,   // 'Pending' | 'Paid'
      razorpayId:    orderData.razorpayId || '',
      upiRef:        orderData.upiRef || '',
      // Status
      orderStatus:   'New',
    },
  };
  // Helpful debug: log payload before sending so devs can inspect values
  try {
    console.debug('[submitOrder] payload:', payload);
    const res = await fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' }, // avoids CORS preflight
      body:    JSON.stringify(payload),
      redirect: 'follow',
    });

    // Try to parse JSON safely – some deployments may return plain text on error
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.debug('[submitOrder] response:', json);
      return json;
    } catch (parseErr) {
      console.warn('[submitOrder] non-JSON response:', text);
      if (!res.ok) throw new Error('Server error: ' + text);
      return { success: true, orderId: orderData.orderId, message: 'Order saved (unverified response)' };
    }
  } catch (err) {
    console.error('submitOrder error:', err);
    throw new Error(err.message || 'Could not reach the server. Please try again.');
  }
}

/**
 * Verify a Razorpay payment server-side (optional extra security)
 */
export async function verifyRazorpayPayment(params) {
  if (!SCRIPT_URL) return { success: true };

  const payload = { action: 'verifyPayment', data: params };
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    return await res.json();
  } catch (err) {
    console.error('verifyPayment error:', err);
    return { success: false };
  }
}
