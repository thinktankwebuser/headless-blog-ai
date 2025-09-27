'use client';

import React from 'react';
import { siteConfig } from '@/lib/site-config';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="contact-modal-backdrop" onClick={handleBackdropClick}>
      <div className="contact-modal">
        <div className="contact-modal-header">
          <div className="contact-modal-title">
            <h2>{siteConfig.author.name}</h2>
            <p className="contact-modal-subtitle">{siteConfig.author.title}</p>
            <p className="contact-modal-company">{siteConfig.author.company}</p>
          </div>
          <button
            onClick={onClose}
            className="contact-modal-close"
            aria-label="Close contact modal"
          >
            ×
          </button>
        </div>

        <div className="contact-modal-content">
          <div className="contact-section">
            <h3>Contact Info</h3>

            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                </svg>
              </div>
              <div className="contact-details">
                <div className="contact-label">Austin's Profile</div>
                <a
                  href={siteConfig.author.linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link"
                >
                  {siteConfig.author.linkedin.display}
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"></path>
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"></path>
                </svg>
              </div>
              <div className="contact-details">
                <div className="contact-label">Email</div>
                <a
                  href={`mailto:${siteConfig.author.email}`}
                  className="contact-link"
                >
                  {siteConfig.author.email}
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                </svg>
              </div>
              <div className="contact-details">
                <div className="contact-label">Location</div>
                <div className="contact-value">{siteConfig.author.location}</div>
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3>Education</h3>
            <div className="education-item">
              <div className="education">{siteConfig.education[0]}</div>
            </div>
          </div>

          <div className="contact-section">
            <h3>About</h3>
            <p className="contact-bio">{siteConfig.author.bio}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;