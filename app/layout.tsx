'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';
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
              <button
                className="header-brand"
                onClick={() => setIsContactModalOpen(true)}
                aria-label="View contact information"
              >
                <Image
                  src={siteConfig.author.avatar}
                  alt={siteConfig.author.name}
                  width={60}
                  height={60}
                  className="profile-avatar"
                  quality={100}
                  priority
                />
                <span className="brand-name">{siteConfig.author.name}</span>
              </button>
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

        <ChatWidget />
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </body>
    </html>
  );
}