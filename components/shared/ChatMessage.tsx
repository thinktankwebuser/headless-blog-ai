'use client';

import React from 'react';

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
  // Process content for assistant messages
  const processedContent = message.role === 'assistant' && isHTML ?
    (isMarkdown(message.content) ? convertMarkdownToHTML(message.content) : message.content) :
    message.content;

  return (
    <div className={`message message-${message.role} ${className}`}>
      <div className="message-content">
        {message.role === 'assistant' && isHTML ? (
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        ) : (
          message.content
        )}
      </div>
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