'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import UnifiedChatWidget from '@/components/UnifiedChatWidget/UnifiedChatWidget';
import ContactModal from '@/components/ContactModal';
import { siteConfig } from '@/lib/site-config';
import './globals.css';

// Note: metadata export removed due to 'use client' directive
// Will be handled at page level

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Link href="/" className="header-brand">
                <span className="brand-name">{siteConfig.site.name}</span>
              </Link>
              <nav className="nav">
                <Link href="/">{siteConfig.navigation.home}</Link>
                <Link href="/blog">{siteConfig.navigation.blog}</Link>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="nav-contact-btn"
                  aria-label="Open contact information"
                >
                  {siteConfig.navigation.contact}
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            {children}
          </div>
        </main>

        <footer className="footer">
          <div className="container">
            © 2025 {siteConfig.author.name}
          </div>
        </footer>

        <UnifiedChatWidget />
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </body>
    </html>
  );
}