import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm';
import StepBar from '../components/StepBar';
import './FormPage.css';
import './OrderPage.css';

const UNIT_PRICE = 99;

export default function OrderPage() {
  const navigate = useNavigate();
  const { order, updateOrder } = useOrder();
  const [qty, setQty] = useState(order.quantity || 1);

  const total = qty * UNIT_PRICE;

  const changeQty = (delta) => {
    const next = Math.max(1, Math.min(10, qty + delta));
    setQty(next);
  };

  const handleNext = () => {
    updateOrder({ quantity: qty, totalAmount: total, unitPrice: UNIT_PRICE });
    navigate('/payment');
  };

  return (
    <div>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <span className="header-logo">DonarConnect</span>
        <div style={{ width: 60 }} />
      </header>

      <StepBar current={2} total={3} />

      <div className="page-content">
        <h2 className="form-title">Sample Collection Kit</h2>
        <p className="form-subtitle">Review your order before payment.</p>

        {/* Kit card */}
        <div className="kit-card mt-16">
          <div className="kit-icon-box">
            <span style={{ fontSize: 48 }}>🧪</span>
          </div>
          <div className="kit-info">
            <h3>Sample Collection Kit</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Sterile, discreet delivery to your address
            </p>
            <div className="kit-price">₹{UNIT_PRICE} <span>per kit</span></div>
          </div>
        </div>

        {/* What's included */}
        <div className="card mt-16">
          <h4 style={{ marginBottom: 12 }}>What's included</h4>
          {[
            '✓  Sterile Collection Container',
            '✓  Instruction Guide',
            '✓  Prepaid Return Packaging',
            '✓  100% Secure & Confidential',
          ].map((item) => (
            <div key={item} className="included-item">{item}</div>
          ))}
        </div>

        {/* Quantity selector */}
        <div className="card mt-16">
          <div className="flex-between">
            <span style={{ fontWeight: 600 }}>Quantity</span>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => changeQty(-1)} disabled={qty === 1}>−</button>
              <span className="qty-value">{qty}</span>
              <button className="qty-btn" onClick={() => changeQty(+1)} disabled={qty === 10}>+</button>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="card mt-16 order-summary">
          <h4 style={{ marginBottom: 16 }}>Order Summary</h4>
          <div className="summary-row">
            <span>Testing Charges × {qty}</span>
            <span>₹{qty * UNIT_PRICE}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className="text-accent">FREE</span>
          </div>
          <div className="divider" style={{ margin: '12px 0' }} />
          <div className="summary-row total-row">
            <span>Total Amount</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Deliver to */}
        <div className="card mt-16">
          <h4 style={{ marginBottom: 8 }}>Deliver to</h4>
          <p style={{ fontWeight: 600 }}>{order.fullName}</p>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, marginTop: 4 }}>
            {order.address}, {order.city}, {order.state} – {order.pincode}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>📱 {order.phone}</p>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--navy-light)', fontWeight: 600,
                     fontSize: 13, cursor: 'pointer', padding: 0, marginTop: 8 }}
            onClick={() => navigate('/details')}
          >
            Edit Address →
          </button>
        </div>

        <div className="sticky-cta">
          <button className="btn btn-primary" onClick={handleNext}>
            Proceed to Payment → ₹{total}
          </button>
        </div>
      </div>
    </div>
  );
}
