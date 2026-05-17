import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm.jsx';
import { submitOrder, generateOrderId } from '../utils/api';
import { openRazorpay } from '../utils/razorpay';
import StepBar from '../components/StepBar';
import './FormPage.css';
import './PaymentPage.css';

const UPI_ID = import.meta.env.VITE_UPI_ID || 'yourname@upi';      // ← set in .env
const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'DonarConnect';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { order, updateOrder } = useOrder();
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = order.totalAmount || order.quantity * order.unitPrice;

  // ── Handlers ─────────────────────────────────────────────

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
      amount:   amount * 100,   // paise
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

  function handleUPI() {
    // Construct UPI deep-link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=DonarConnect+Order`;
    window.location.href = upiLink;

    // After returning, let user confirm manually
    setTimeout(() => {
      const ref = window.prompt('Enter your UPI transaction reference (optional):') || '';
      handleUPIConfirm(ref);
    }, 2000);
  }

  async function handleUPIConfirm(ref) {
    setLoading(true);
    setError('');
    try {
      const orderId = generateOrderId();
      await submitOrder({ ...order, orderId, paymentMethod: 'UPI',
                          paymentStatus: ref ? 'Paid (Unverified)' : 'Pending Verification',
                          upiRef: ref });
      updateOrder({ orderId, paymentMethod: 'UPI',
                    paymentStatus: ref ? 'Paid (Unverified)' : 'Pending', upiRef: ref });
      navigate('/confirmation');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleProceed() {
    if (!method) { setError('Please select a payment method.'); return; }
    setError('');
    if (method === 'COD')      handleCOD();
    if (method === 'RAZORPAY') handleRazorpay();
    if (method === 'UPI')      handleUPI();
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <span className="header-logo">DonarConnect</span>
        <div style={{ width: 60 }} />
      </header>

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
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              {order.quantity}× Kit
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <h4 style={{ marginTop: 24, marginBottom: 12 }}>Select Payment Method</h4>

        <div className="pay-methods">
          <PayOption
            id="COD"
            active={method === 'COD'}
            onClick={() => setMethod('COD')}
            icon="🚚"
            title="Cash on Delivery"
            desc="Pay when the kit arrives at your door"
            badge="Recommended"
          />
          <PayOption
            id="RAZORPAY"
            active={method === 'RAZORPAY'}
            onClick={() => setMethod('RAZORPAY')}
            icon="💳"
            title="Pay Online"
            desc="UPI · Card · Net Banking · Wallet via Razorpay"
            badge="Instant"
          />
          <PayOption
            id="UPI"
            active={method === 'UPI'}
            onClick={() => setMethod('UPI')}
            icon="📱"
            title="Direct UPI"
            desc={`Pay directly to ${UPI_ID}`}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="pay-error mt-16">⚠️ {error}</div>
        )}

        {/* Trust badges */}
        <div className="trust-row mt-16">
          {['🔒 100% Secure','✅ SSL Encrypted','🏦 Trusted Payments'].map((t) => (
            <div key={t} className="trust-badge">{t}</div>
          ))}
        </div>

        <div className="sticky-cta">
          <button
            className="btn btn-primary"
            onClick={handleProceed}
            disabled={loading || !method}
          >
            {loading
              ? <><div className="spinner" /> Processing…</>
              : method === 'COD'
                ? 'Confirm Order (COD)'
                : `Pay ₹${amount} Securely`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayOption({ id, active, onClick, icon, title, desc, badge }) {
  return (
    <div
      className={`pay-option ${active ? 'active' : ''}`}
      onClick={onClick}
      role="radio"
      aria-checked={active}
    >
      <div className="pay-radio">{active ? '●' : '○'}</div>
      <div className="pay-icon">{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{desc}</div>
      </div>
      {badge && <span className="badge badge-green">{badge}</span>}
    </div>
  );
}
