import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="page-header">
      <div className="header-left">
        <span className="header-logo">DonarConnect</span>
      </div>

      <div className="header-right">
        <div className="header-contact">
          <a href="tel:+919597481612" className="contact-phone">+91 9597481612</a>
          <a href="mailto:donar.connect.support@gmail.com" className="contact-email">donar.connect.support@gmail.com</a>
        </div>
        <div className="header-about">
          <a href="/about">About Us</a>
        </div>
        <button className="nav-menu" aria-label="Menu">☰</button>
      </div>
    </header>
  );
}
