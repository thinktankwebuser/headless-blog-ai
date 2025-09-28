'use client';

import { memo } from 'react';
import { CitationSource } from '@/types/chat';
import CitationPreview from './CitationPreview';

interface CitationDisplayProps {
  sources: CitationSource[];
  className?: string;
  hideHeader?: boolean;
}

function CitationDisplay({ sources, className = '', hideHeader = false }: CitationDisplayProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`citation-display ${className}`}>
      {!hideHeader && (
        <div className="citation-header">
          <span className="citation-icon">📚</span>
          <span className="citation-label">Sources used:</span>
        </div>
      )}
      <div className="citation-list">
        {sources.map((source, index) => (
          <div key={index} className="citation-item">
            <CitationPreview source={source}>
              <a
                href={source.url}
                className="citation-link"
                title={`View source: ${source.title.replace(/\.(md|txt)$/i, '').replace(/[-_]/g, ' ')}${source.section ? ` - ${source.section}` : ''}`}
                target={source.url.startsWith('http') ? '_blank' : '_self'}
                rel={source.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <span className="citation-title">
                  {source.title.replace(/\.(md|txt)$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {source.section && (
                  <span className="citation-section">- {source.section}</span>
                )}
                {source.confidence && source.confidence < 1 && (
                  <span className="citation-confidence">
                    ({Math.round(source.confidence * 100)}% match)
                  </span>
                )}
                <span className="citation-preview-indicator" aria-hidden="true">👁️</span>
              </a>
            </CitationPreview>

            {/* Enhanced View Full Post Button (Phase 2) */}
            {source.section && (
              <button
                onClick={() => {
                  const postUrl = source.url.split('#')[0]; // Remove anchor
                  window.open(postUrl, '_blank');
                }}
                className="citation-full-post-btn"
                aria-label="View complete blog post"
                title="View the complete blog post"
              >
                📄 Full Post
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="citation-footer">
        <small>💡 Verify sources before taking action</small>
      </div>
    </div>
  );
}

export default memo(CitationDisplay);