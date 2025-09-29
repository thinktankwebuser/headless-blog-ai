'use client';

import React, { useState, useEffect, useRef } from 'react';

// Simple markdown-to-HTML converter for basic formatting
const convertMarkdownToHTML = (markdown: string): string => {
  return markdown
    // Convert ### to h3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Convert ## to h2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Convert # to h1
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Convert **bold** to <strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert line breaks to <br>
    .replace(/\n/g, '<br>');
};

// Detect if content contains markdown
const isMarkdown = (content: string): boolean => {
  return /###|##|#|\*\*|\*/.test(content);
};

export interface ChatMessageData {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { path: string; heading: string }[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  isHTML?: boolean; // For assistant messages that need HTML rendering
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isHTML = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Process content for assistant messages
  const processedContent = message.role === 'assistant' && isHTML ?
    (isMarkdown(message.content) ? convertMarkdownToHTML(message.content) : message.content) :
    message.content;

  // Check if content needs expansion on mobile
  useEffect(() => {
    const checkExpansion = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile && contentRef.current) {
        // Use a small delay to ensure content is rendered
        setTimeout(() => {
          if (contentRef.current) {
            const height = contentRef.current.scrollHeight;
            setNeedsExpansion(height > 120); // ~6-8 lines threshold
          }
        }, 10);
      } else {
        setNeedsExpansion(false);
      }
    };

    checkExpansion();
    window.addEventListener('resize', checkExpansion);
    return () => window.removeEventListener('resize', checkExpansion);
  }, [message.content, processedContent]);

  const handleToggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`message message-${message.role} ${className}`}>
      <div
        ref={contentRef}
        className={`message-content ${
          isMobile && needsExpansion && !isExpanded ? 'collapsed-mobile' : ''
        }`}
      >
        {message.role === 'assistant' && isHTML ? (
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        ) : (
          message.content
        )}
      </div>

      {isMobile && needsExpansion && (
        <button
          onClick={handleToggleExpansion}
          className="read-more-btn"
          type="button"
          aria-label={isExpanded ? 'Show less content' : 'Show more content'}
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {message.citations && message.citations.length > 0 && (
        <div className="message-citations">
          {message.citations.map((citation, index) => (
            <span key={index} className="citation-chip">
              📄 {citation.heading}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;