import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm.jsx';
import { submitOrder, generateOrderId } from '../utils/api';
import { openRazorpay } from '../utils/razorpay';
import StepBar from '../components/StepBar';
import './FormPage.css';
import './PaymentPage.css';
import Header from '../components/Header.jsx';

const UPI_ID = import.meta.env.VITE_UPI_ID || 'yourname@upi';      // ← set in .env
const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'DonarConnect';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { order, updateOrder } = useOrder();
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = order.totalAmount || order.quantity * order.unitPrice;

  // Validate DOB: required and user must be between 21 and 40 years old
  const isValidDOB = (dob) => {
    if (!dob) return false;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return false;
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 21 && age <= 40;
  };

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
    // Construct UPI deep-link and open the UPI app
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=DonarConnect+Order`;
    window.location.href = upiLink;

    // Do not prompt for a transaction reference; mark order as pending verification
    setLoading(true);
    setError('');
    (async () => {
      try {
        const orderId = generateOrderId();
        await submitOrder({ ...order, orderId, paymentMethod: 'UPI', paymentStatus: 'Pending Verification', upiRef: '' });
        updateOrder({ orderId, paymentMethod: 'UPI', paymentStatus: 'Pending', upiRef: '' });
        navigate('/confirmation');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }

  function handleProceed() {
    if (!method) { setError('Please select a payment method.'); return; }
    // Enforce DOB is set and valid before submitting any payment/order
    if (!isValidDOB(order.dob)) {
      setError('Please complete your Date of Birth in Personal Details (age 21–40).');
      navigate('/details');
      return;
    }
    setError('');
    if (method === 'COD')      handleCOD();
    if (method === 'RAZORPAY') handleRazorpay();
    if (method === 'UPI')      handleUPI();
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
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              {order.quantity}× Kit
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <h4 style={{ marginTop: 24, marginBottom: 12 }}>Select Payment Method</h4>

        <div className="pay-methods">
          <PayOption
            id="UPI"
            active={method === 'UPI'}
            onClick={() => setMethod('UPI')}
            icon="📱"
            title="Direct UPI"
            desc={`Pay directly via UPI`}
          />
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
          <PayOption
            id="COD"
            active={method === 'COD'}
            onClick={() => setMethod('COD')}
            icon="🚚"
            title="Cash on Delivery"
            desc="Pay when the kit arrives at your door"
            badge="Coming Soon"
            disabled={true}
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

        <div className="form-row-2 mt-16">
          <button className="btn btn-outline" onClick={() => navigate('/details')}>
            Edit Information
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/order')}>
            Adjust Quantity
          </button>
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
      {badge && <span className="badge badge-green">{badge}</span>}
    </div>
  );
}
