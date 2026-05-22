import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm.jsx';
import './ConfirmationPage.css';
import Header from '../components/Header.jsx';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { order } = useOrder();

  // Safety: if someone lands here without order ID, send home
  useEffect(() => {
    if (!order.orderId) navigate('/', { replace: true });
  }, [order.orderId, navigate]);

  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const isPaid = order.paymentStatus === 'Paid' || order.paymentStatus?.startsWith('Paid');

  return (
    <div className="confirm-page">
      <Header />

      <div className="page-content text-center">
        {/* Success animation */}
        <div className="confirm-icon-wrap">
          <div className="confirm-icon">✓</div>
          <div className="confirm-ring" />
        </div>

        <h2 style={{ marginTop: 20 }}>Order Confirmed!</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15 }}>
          Thank you for taking the step.<br />
          Your sample collection kit will be delivered soon.
        </p>

        {/* Order details card */}
        <div className="card confirm-card mt-24">
          {[
            { label: 'Order ID',        value: order.orderId },
            { label: 'Name',            value: order.fullName },
            { label: 'Phone',           value: order.phone },
            { label: 'Amount Paid',     value: `₹${order.totalAmount}` },
            { label: 'Payment Method',  value: order.paymentMethod },
            { label: 'Payment Status',  value: order.paymentStatus,
              highlight: isPaid ? 'green' : 'orange' },
            { label: 'Date',            value: now },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="confirm-row">
              <span className="confirm-label">{label}</span>
              <span className={`confirm-value ${highlight ? `confirm-${highlight}` : ''}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Deliver to */}
        <div className="card mt-12" style={{ textAlign: 'left' }}>
          <h4 style={{ marginBottom: 8 }}>📦 Delivering to</h4>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>
            {order.address}, {order.city},<br />
            {order.state} – {order.pincode}
          </p>
        </div>

        {/* What's next */}
        <div className="whats-next mt-16">
          <h4 style={{ marginBottom: 12 }}>What's Next?</h4>
          {[
            { icon: '📦', text: 'Receive your collection kit (2–5 days)' },
            { icon: '🧪', text: 'Provide your sample as instructed' },
            { icon: '🔬', text: 'We will conduct the screening test' },
            { icon: '💰', text: 'Get eligible & start earning ₹35,000' },
          ].map((item) => (
            <div key={item.text} className="next-row">
              <span className="next-icon">{item.icon}</span>
              <span style={{ fontSize: 14 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* COD notice */}
        {order.paymentMethod === 'COD' && (
          <div className="cod-notice mt-16">
            💵 You have chosen <strong>Cash on Delivery</strong>. Please keep ₹{order.totalAmount} ready when the kit arrives.
          </div>
        )}

        {/* UPI pending */}
        {order.paymentMethod === 'UPI' && !isPaid && (
          <div className="cod-notice mt-16" style={{ borderColor: '#fbd38d', background: '#fffbeb' }}>
            ⏳ Your UPI payment is pending verification. We'll confirm within 24 hrs.
          </div>
        )}

        <button
          className="btn btn-primary mt-24"
          onClick={() => navigate('/', { replace: true })}
        >
          Back to Home
        </button>

        <p className="text-muted mt-12" style={{ fontSize: 13 }}>
          Questions? WhatsApp us at{' '}
          <a href="https://wa.me/919597481612" target="_blank" rel="noreferrer" style={{ color: 'var(--navy)' }}>
            +91 95974 81612
          </a>
        </p>
      </div>
    </div>
  );
}
