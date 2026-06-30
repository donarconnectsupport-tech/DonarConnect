import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm.jsx';
import { submitOrder, generateOrderId } from '../utils/api';
import { openRazorpay } from '../utils/razorpay';
import StepBar from '../components/StepBar';
import './FormPage.css';
import './PaymentPage.css';
import Header from '../components/Header.jsx';

const UPI_ID   = import.meta.env.VITE_UPI_ID   || 'dklabs1725@okaxis';
const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'DonarConnect';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { order, updateOrder } = useOrder();
  const [method, setMethod]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState('');

  const amount = order.totalAmount || order.quantity * order.unitPrice;

  // ── Validation ────────────────────────────────────────────
  const isValidDOB = (dob) => {
    if (!dob) return false;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return false;
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 21 && age <= 40;
  };

  // ── Copy helper ───────────────────────────────────────────
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // ── Handlers ──────────────────────────────────────────────

  async function handleCOD() {
    setLoading(true);
    setError('');
    try {
      const orderId = generateOrderId();
      await submitOrder({ ...order, orderId, paymentMethod: 'COD', paymentStatus: 'Pending' });
      updateOrder({ orderId, paymentMethod: 'COD', paymentStatus: 'Pending' });
      navigate('/confirmation');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRazorpay() {
    setLoading(true);
    setError('');
    const orderId = generateOrderId();
    openRazorpay({
      amount:   amount * 100,
      orderId,
      name:     order.fullName,
      phone:    order.phone,
      email:    order.email,
      onSuccess: async (paymentId) => {
        try {
          await submitOrder({ ...order, orderId, paymentMethod: 'RAZORPAY',
                              paymentStatus: 'Paid', razorpayId: paymentId });
          updateOrder({ orderId, paymentMethod: 'RAZORPAY', paymentStatus: 'Paid', razorpayId: paymentId });
          navigate('/confirmation');
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      },
      onFailure: (err) => {
        setError(err.message === 'Payment cancelled' ? 'Payment was cancelled.' : err.message);
        setLoading(false);
      },
    });
  }

  async function handleGPay() {
    setLoading(true);
    setError('');
    try {
      const orderId = generateOrderId();

      // Save order first
      await submitOrder({
        ...order,
        orderId,
        paymentMethod: 'UPI',
        paymentStatus: 'Pending Verification',
        upiRef: ''
      });
      updateOrder({
        orderId,
        paymentMethod: 'UPI',
        paymentStatus: 'Pending (Will be confirmed within 24 hours via Email)',
        upiRef: ''
      });

      // GPay tez:// deep link — works with merchant UPI ID to pre-fill amount
      const gpayLink = `tez://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=DonarConnect+Order+${orderId}`;

      // Open GPay
      window.location.href = gpayLink;

      // Navigate to confirmation after delay (in case GPay redirects back)
      setTimeout(() => {
        navigate('/confirmation');
        setLoading(false);
      }, 3000);

    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  function handleProceed() {
    if (!method) { setError('Please select a payment method.'); return; }
    if (!isValidDOB(order.dob)) {
      setError('Please complete your Date of Birth in Personal Details (age 21–40).');
      navigate('/details');
      return;
    }
    setError('');
    if (method === 'COD')      handleCOD();
    if (method === 'RAZORPAY') handleRazorpay();
    if (method === 'UPI')      handleGPay();
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div>
      <Header />
      <StepBar current={3} total={3} />

      <div className="page-content">
        <h2 className="form-title">Payment</h2>
        <p className="form-subtitle">Secure &amp; encrypted checkout</p>

        {/* Order summary pill */}
        <div className="pay-summary-pill mt-16">
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Total Amount</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>₹{amount}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Order</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{order.quantity}× Kit</div>
          </div>
        </div>

        {/* Payment methods */}
        <h4 style={{ marginTop: 24, marginBottom: 12 }}>Select Payment Method</h4>

        <div className="pay-methods">

          {/* COD */}
          <PayOption
            id="COD"
            active={method === 'COD'}
            onClick={() => setMethod('COD')}
            icon="🚚"
            title="Cash on Delivery"
            desc="Pay when the kit arrives at your door"
            badge="Available"
            disabled={false}
          />

          {/* GPay / UPI */}
          <PayOption
            id="UPI"
            active={method === 'UPI'}
            onClick={() => setMethod('UPI')}
            icon="🟢"
            title="Pay via GPay / UPI"
            desc="Opens Google Pay with amount pre-filled"
            badge="Available"
          />

          {/* GPay info panel — shown when UPI is selected */}
          {method === 'UPI' && (
            <div className="gpay-info-panel">
              <div className="gpay-info-row">
                <div>
                  <div className="gpay-info-label">UPI ID</div>
                  <div className="gpay-info-value">{UPI_ID}</div>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(UPI_ID, 'upi')}
                >
                  {copied === 'upi' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="gpay-info-row" style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 10 }}>
                <div>
                  <div className="gpay-info-label">Amount</div>
                  <div className="gpay-info-value">₹{amount}</div>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(amount.toString(), 'amount')}
                >
                  {copied === 'amount' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
                💡 Clicking "Pay" below will open GPay with the amount pre-filled. If GPay doesn't open, copy the UPI ID and amount manually.
              </p>
            </div>
          )}

          {/* Razorpay - Coming Soon */}
          <PayOption
            id="RAZORPAY"
            active={method === 'RAZORPAY'}
            onClick={() => setMethod('RAZORPAY')}
            icon="💳"
            title="Pay Online"
            desc="UPI · Card · Net Banking · Wallet via Razorpay"
            badge="Coming Soon"
            disabled={true}
          />
          
        </div>

        {/* Error */}
        {error && <div className="pay-error mt-16">⚠️ {error}</div>}

        {/* Trust badges */}
        <div className="trust-row mt-16">
          {['🔒 100% Secure', '✅ SSL Encrypted', '🏦 Trusted Payments'].map((t) => (
            <div key={t} className="trust-badge">{t}</div>
          ))}
        </div>

        {/* Edit buttons */}
        <div className="form-row-2 mt-16">
          <button className="btn btn-outline" onClick={() => navigate('/details')}>
            Edit Information
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/order')}>
            Adjust Quantity
          </button>
        </div>

        {/* Sticky CTA */}
        <div className="sticky-cta">
          <button
            className="btn btn-primary"
            onClick={handleProceed}
            disabled={loading || !method}
          >
            {loading
              ? <><div className="spinner" /> Processing…</>
              : method === 'UPI'
                ? `Open GPay & Pay ₹${amount}`
                : method === 'COD'
                  ? 'Confirm Order (COD)'
                  : `Pay ₹${amount} Securely`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayOption({ id, active, onClick, icon, title, desc, badge, disabled }) {
  return (
    <div
      className={`pay-option ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onClick()}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      role="radio"
      aria-checked={active}
    >
      <div className="pay-radio">{active ? '●' : '○'}</div>
      <div className="pay-icon">{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{desc}</div>
      </div>
      {badge && (
        <span className={`badge ${badge === 'Recommended' ? 'badge-green' : 'badge-orange'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ── ADD THESE STYLES TO YOUR PaymentPage.css ── */
