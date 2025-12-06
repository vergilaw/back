import React from 'react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Column - Logo & Contact */}
        <div className="footer-column footer-brand">
          <div className="footer-logo">
            <div className="logo-icon">☕</div>
            <span className="logo-text">Bakery Cake</span>
          </div>

          <div className="footer-contact">
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <div className="contact-label">ADDRESS</div>
                <div className="contact-value">No.23, King St. Gold Ave. NY 74521</div>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <div className="contact-label">TEL</div>
                <a href="tel:+18001234567" className="contact-value">+1 (800) 1234 567</a>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <div className="contact-label">TEL</div>
                <a href="tel:+18001234568" className="contact-value">+1 (800) 1234 568</a>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Working Hours */}
        <div className="footer-column footer-hours">
          <h3 className="footer-title">Working Hours</h3>
          
          <div className="hours-section">
            <div className="hours-label">
              <span className="hours-icon">🕒</span>
              OPENING HOURS
            </div>
            <div className="hours-time">Sunday - Thursday 9:00 AM - 12:00 AM</div>
            <div className="hours-time">Friday Saturday 9:00 AM - 2:00 AM</div>
          </div>

          <div className="hours-section">
            <div className="hours-label">
              <span className="hours-icon">🍳</span>
              BREAKFAST BUFFET
            </div>
            <div className="hours-time">Sunday - Thursday 9:00 AM - 12:00 AM</div>
            <div className="hours-time">Friday Saturday 9:00 AM - 2:00 AM</div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="footer-column footer-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976!3d40.697403!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '12px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="XtraCafe Location"
          ></iframe>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2025 XtraCafé. All rights reserved.</p>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}