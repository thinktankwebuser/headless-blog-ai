import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'Headless Blog MVP',
  description: 'A minimal, fast blog powered by WordPress and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Image
                src="/profile.png"
                alt="Austin Puthur"
                width={1947}
                height={215}
                className="profile-banner"
                quality={100}
                priority
              />
              <nav className="nav">
                <Link href="/">Home</Link>
                <Link href="/blog">Blog</Link>
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
            @ 2025 Austin Puthur
          </div>
        </footer>
      </body>
    </html>
  );
}