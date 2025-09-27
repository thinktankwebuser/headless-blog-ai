'use client';

import React from 'react';

interface ChatLoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
}

const ChatLoadingState: React.FC<ChatLoadingStateProps> = ({
  message = 'Thinking...',
  subtext,
  className = ''
}) => {
  return (
    <div className={`message message-assistant ${className}`}>
      <div className="message-content">
        <div className="chat-loading">
          <div className="chat-spinner"></div>
          {message}
        </div>
        {subtext && (
          <small className="loading-subtext">{subtext}</small>
        )}
      </div>
    </div>
  );
};

export default ChatLoadingState;