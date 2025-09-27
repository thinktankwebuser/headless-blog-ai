'use client';

import { useState, useEffect } from 'react';

interface ShareButtonsProps {
  slug: string;
  title: string;
}

export default function ShareButtons({ slug, title }: ShareButtonsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="post-detail-share">
        <div className="post-card-share">
          <span className="share-label">Share this:</span>
          <div className="share-icons">
            <span className="share-icon twitter">𝕏</span>
            <span className="share-icon facebook">f</span>
            <span className="share-icon linkedin">in</span>
            <span className="share-icon email">@</span>
          </div>
        </div>
      </div>
    );
  }

  const postUrl = `${window.location.origin}/blog/${slug}`;

  return (
    <div className="post-detail-share">
      <div className="post-card-share">
        <span className="share-label">Share this:</span>
        <div className="share-icons">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-icon twitter"
            aria-label="Share on X"
          >
            𝕏
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-icon facebook"
            aria-label="Share on Facebook"
          >
            f
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-icon linkedin"
            aria-label="Share on LinkedIn"
          >
            in
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${postUrl}`)}`}
            className="share-icon email"
            aria-label="Share via Email"
          >
            @
          </a>
        </div>
      </div>
    </div>
  );
}