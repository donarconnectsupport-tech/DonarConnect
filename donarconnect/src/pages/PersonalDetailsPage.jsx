import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrderForm.jsx';
import StepBar from '../components/StepBar';
import './FormPage.css';
import Header from '../components/Header.jsx';

const STATES = [
  'Tamil Nadu', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'
];

function validate(fields) {
  const err = {};
  if (!fields.fullName.trim())     err.fullName = 'Name is required';
  if (!/^\d{10}$/.test(fields.phone)) err.phone = 'Enter valid 10-digit mobile number';
  if (!fields.address.trim())      err.address = 'Address is required';
  if (!/^\d{6}$/.test(fields.pincode)) err.pincode = 'Enter valid 6-digit pincode';
  if (!fields.city.trim())         err.city = 'City is required';
  if (!fields.state)               err.state = 'Select your state';
  if (!fields.dob) {
    err.dob = 'Date of birth is required';
  } else {
    const dob = new Date(fields.dob);
    if (isNaN(dob.getTime())) {
      err.dob = 'Enter a valid date of birth';
    } else {
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 21 || age > 40) err.dob = 'Age must be between 21 and 40 years';
    }
  }
  return err;
}

export default function PersonalDetailsPage() {
  const navigate = useNavigate();
  const { order, updateOrder } = useOrder();

  // DOB bounds: users must be between 21 and 40 years old
  const _today = new Date();
  const _maxDOB = new Date(_today.getFullYear() - 21, _today.getMonth(), _today.getDate());
  const _minDOB = new Date(_today.getFullYear() - 40, _today.getMonth(), _today.getDate());
  const _toISO = (d) => d.toISOString().split('T')[0];

  const [form, setForm] = useState({
    fullName: order.fullName,
    phone:    order.phone,
    email:    order.email,
    dob:      order.dob,
    address:  order.address,
    pincode:  order.pincode,
    city:     order.city,
    state:    order.state,
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleNext = () => {
    const err = validate(form);
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    updateOrder(form);
    navigate('/order');
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className={`form-input ${errors[key] ? 'error' : ''}`}
        placeholder={placeholder}
        value={form[key]}
        onChange={set(key)}
        onBlur={() => setErrors((e) => ({ ...e, [key]: undefined }))}
        inputMode={type === 'tel' || key === 'pincode' ? 'numeric' : undefined}
        maxLength={key === 'phone' ? 10 : key === 'pincode' ? 6 : undefined}
      />
      {errors[key] && <span className="form-error">{errors[key]}</span>}
    </div>
  );

  return (
    <div>
      <Header />

      <StepBar current={1} total={3} />

      <div className="page-content">
        <h2 className="form-title">Tell us about yourself</h2>
        <p className="form-subtitle">We need your details to process your order and deliver the kit.</p>

        <div className="mt-24">
          {field('fullName', 'Full Name', 'text', 'Enter your full name')}
          {field('phone', 'Mobile Number (WhatsApp)', 'tel', '10-digit mobile number')}

          <div className="form-group">
            <label className="form-label">Email (optional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={form.email}
              onChange={set('email')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-input"
              value={form.dob}
              onChange={set('dob')}
              min={_toISO(_minDOB)}
              max={_toISO(_maxDOB)}
            />
            {errors.dob && <span className="form-error">{errors.dob}</span>}
          </div>

          {field('address', 'Full Address', 'text', 'Door no., Street, Area')}

          <div className="form-row-2">
            {field('pincode', 'Pincode', 'text', '6-digit pincode')}
            {field('city', 'City', 'text', 'Your city')}
          </div>

          <div className="form-group">
            <label className="form-label">State</label>
            <select
              className={`form-input ${errors.state ? 'error' : ''}`}
              value={form.state}
              onChange={set('state')}
            >
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <span className="form-error">{errors.state}</span>}
          </div>
        </div>

        <div className="sticky-cta">
          <button className="btn btn-primary" onClick={handleNext}>
            Next → Review Order
          </button>
        </div>
      </div>
    </div>
  );
}
