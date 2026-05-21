import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'contact' | 'about' | null
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function openMenu() { setOpen((s) => !s); }
  function openModal(kind) { setModal(kind); setOpen(false); }
  function closeModal() { setModal(null); }
  const navigate = useNavigate();

  return (
    <header className="page-header" ref={wrapRef}>
      <div className="header-left">
        <span className="header-logo">DonarConnect</span>
      </div>

      <div className="header-right">
        <button className="nav-menu" aria-label="Menu" onClick={openMenu}>☰</button>

        {open && (
          <div className="menu-dropdown" role="menu">
            <button className="menu-item" onClick={() => { setOpen(false); navigate('/'); }}>Home</button>
            <button className="menu-item" onClick={() => openModal('contact')}>Contact Us</button>
            <button className="menu-item" onClick={() => openModal('about')}>About Us</button>
          </div>
        )}
      </div>

      {modal === 'contact' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Contact Us</h3>
            <p><strong>Phone:</strong> <a href="tel:+919597481612">+91 9597481612</a></p>
            <p><strong>Email:</strong> <a href="mailto:donar.connect.support@gmail.com">donar.connect.support@gmail.com</a></p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'about' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>About DonarConnect</h3>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>
              DonarConnect is a trusted platform that connects healthy donors with families in need. We ensure a safe,
              confidential and rewarding experience for all our donors.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
