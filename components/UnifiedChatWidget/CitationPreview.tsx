'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { CitationSource } from '@/types/chat';

interface CitationPreviewProps {
  source: CitationSource;
  children: React.ReactNode;
  className?: string;
}

function CitationPreview({ source, children, className = '' }: CitationPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && previewRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const previewRect = previewRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate optimal position
      let top = triggerRect.top - previewRect.height - 8;
      let left = triggerRect.left + (triggerRect.width / 2) - (previewRect.width / 2);

      // Adjust if preview would go off-screen
      if (top < 8) {
        // Show below if not enough space above
        top = triggerRect.bottom + 8;
      }

      if (left < 8) {
        left = 8;
      } else if (left + previewRect.width > viewportWidth - 8) {
        left = viewportWidth - previewRect.width - 8;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}% relevance`;
  };

  const getReadingTime = (text: string): string => {
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <div
      ref={triggerRef}
      className={`citation-preview-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-describedby={isVisible ? `preview-${source.title.replace(/\s+/g, '-')}` : undefined}
      aria-expanded={isVisible}
    >
      {children}

      {isVisible && (
        <div
          ref={previewRef}
          id={`preview-${source.title.replace(/\s+/g, '-')}`}
          className="citation-preview-tooltip"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999
          }}
          role="tooltip"
          aria-live="polite"
        >
          <div className="citation-preview-content">
            <div className="citation-preview-header">
              <h4 className="citation-preview-title">
                {source.title.replace(/\.(md|txt)$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              {source.section && (
                <div className="citation-preview-section">
                  📍 {source.section}
                </div>
              )}
            </div>

            <div className="citation-preview-excerpt">
              <p>{source.excerpt || 'Content preview not available'}</p>
            </div>

            <div className="citation-preview-meta">
              <div className="citation-preview-stats">
                {source.confidence && (
                  <span className="citation-confidence-badge">
                    🎯 {formatConfidence(source.confidence)}
                  </span>
                )}
                {source.excerpt && (
                  <span className="citation-reading-time">
                    ⏱️ {getReadingTime(source.excerpt)}
                  </span>
                )}
              </div>
              <div className="citation-preview-actions">
                <div className="citation-action-hint">
                  Click to {source.section ? 'jump to section' : 'view content'} →
                </div>
                {source.section && (
                  <div className="citation-full-post-hint">
                    <span className="citation-action-separator">•</span>
                    <button
                      className="citation-full-post-link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const postUrl = source.url.split('#')[0]; // Remove anchor
                        window.open(postUrl, '_blank');
                      }}
                      aria-label="View full blog post"
                    >
                      📄 View full post
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="citation-preview-arrow" />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CitationPreview);