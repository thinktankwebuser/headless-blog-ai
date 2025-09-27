'use client';

import React from 'react';

interface ChatErrorStateProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

const ChatErrorState: React.FC<ChatErrorStateProps> = ({
  error,
  onRetry,
  showRetry = true,
  className = ''
}) => {
  return (
    <div className={`message message-assistant ${className}`}>
      <div className="message-content">
        <div className="chat-error">
          ❌ {error}
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="chat-retry-btn"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatErrorState;