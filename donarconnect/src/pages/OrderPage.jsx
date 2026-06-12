import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm.jsx';
import StepBar from '../components/StepBar';
import './FormPage.css';
import './OrderPage.css';
import Header from '../components/Header.jsx';

const UNIT_PRICE = 399;

export default function OrderPage() {
  const navigate = useNavigate();
  const { order, updateOrder } = useOrder();
  const [qty, setQty] = useState(order.quantity || 1);
  const [showKitInfo, setShowKitInfo] = useState(false);

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
      <Header />

      <StepBar current={2} total={3} />

      <div className="page-content">
        <h2 className="form-title">Sample Collection Kit</h2>
        <p className="form-subtitle">Review your order before payment.</p>

        {/* Kit card */}
        <div className="kit-card mt-16 kit-card-image">
          <div className="kit-image-wrap">
            <img
              src="/product.jpeg"
              alt="DonarConnect Sample Collection Kit"
              className="kit-image"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo192.svg'; }}
            />
          </div>
          <div className="kit-info">
            <h3>Sample Collection Kit</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Sterile, discreet delivery to your address.
            </p>
            <div className="kit-price">₹{UNIT_PRICE} <span>per kit (Inclusive of lab test charges)</span></div>
            <button className="btn btn-outline kit-info-btn" onClick={() => setShowKitInfo(true)}>
              View Product Info
            </button>
          </div>
        </div>

        {showKitInfo && (
          <div className="modal-backdrop" onClick={() => setShowKitInfo(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Sample Collection Kit Info</h3>
              <p style={{ color: 'var(--text-sub)', lineHeight: 1.7 }}>
                The DonarConnect sample collection kit includes a sterile container and lab test charges, sealed return packaging, and detailed instructions to collect and ship your sample safely.
              </p>
              <div className="kit-info-grid">
                <div>
                  <strong>How to collect sample</strong>
                  <ol>
                    <li>Wash your hands thoroughly.</li>
                    <li>Collect the sample in the container.</li>
                    <li>Close the lid tightly.</li>
                    <li>Place the kit in the return box and seal it.</li>
                    <li>Our partner will pick it up.</li>
                  </ol>
                </div>
                <div>
                  <strong>Kit benefits</strong>
                  <ul>
                    <li>Leak proof</li>
                    <li>Sterile &amp; easy to use</li>
                    <li>Confidential handling</li>
                    <li>Home collection support</li>
                  </ul>
                </div>
              </div>
              <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowKitInfo(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

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

        <div className="form-row-2 mt-16">
          <button className="btn btn-outline" onClick={() => navigate('/details')}>
            Edit Personal Details
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
