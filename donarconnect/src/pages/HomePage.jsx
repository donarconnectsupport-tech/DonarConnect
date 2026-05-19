import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import Header from '../components/Header.jsx';

const STATS = [
  { label: 'Active Donors', value: '12,450+' },
  { label: 'Need Donors',   value: '5,320+' },
];

const FEATURES = [
  { icon: '🛡️', title: 'Safe & Confidential', desc: 'All samples handled with utmost privacy and care.' },
  { icon: '💰', title: 'Earn ₹35,000/month', desc: 'Get rewarded generously for every eligible donation.' },
  { icon: '🚚', title: 'Home Collection',      desc: 'Kit delivered to your doorstep. No travel needed.' },
  { icon: '✅', title: 'Easy Process',         desc: '3 simple steps. Start earning within days.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* ── Hero ── */}
      <Header />
      <header className="home-hero">

        <div className="hero-body">
          <div className="hero-text">
            <h1>Earn Money.<br />Help Build<br />Families.</h1>
            <p>Join thousands of donors making a difference</p>
            <div className="earning-pill">
              <span className="pill-icon">₹</span>
              <div>
                <div className="pill-amount">₹35,000</div>
                <div className="pill-label">Earn per month</div>
              </div>
            </div>
          </div>
          <div className="hero-img" aria-hidden="true">
            {/* Replace profile SVG with hero image. Place the provided image at `public/hero.jpg` */}
            <img
              src="/hero.jpg"
              alt="Donor"
              className="hero-photo"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo192.svg'; }}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* About section removed; accessible via menu → About Us */}

      {/* ── Eligibility ── */}
      <section className="home-section eligibility-card">
        <div className="flex gap-8" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>🩺</span>
          <div>
            <h4>Eligibility</h4>
            <p style={{ color: 'var(--text-sub)', fontSize: 14, marginTop: 2 }}>Age: 21 – 40 years &nbsp;•&nbsp; Good health &nbsp;•&nbsp; BMI 18–35</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="home-section">
        <div className="section-chip">Why Choose Us</div>
        <div className="features-grid mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h4 style={{ marginTop: 8 }}>{f.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="home-section">
        <div className="section-chip">How It Works</div>
        <div className="steps-list mt-12">
          {[
            { n: 1, t: 'Register', d: 'Fill in your personal details' },
            { n: 2, t: 'Order Kit', d: 'We ship a ₹99 collection kit to you' },
            { n: 3, t: 'Provide Sample', d: 'Follow the simple instructions' },
            { n: 4, t: 'Get Paid', d: 'Receive ₹35,000 directly to your account' },
          ].map((step) => (
            <div key={step.n} className="step-row">
              <div className="step-num">{step.n}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{step.t}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{step.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="home-cta">
        <button className="btn btn-primary" onClick={() => navigate('/details')}>
          Start Earning Now →
        </button>
        <p className="cta-note">100% Secure &amp; Confidential &nbsp;🔒</p>
      </div>
    </div>
  );
}
