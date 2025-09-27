'use client';

import React from 'react';

interface ChatWelcomeProps {
  aiType: 'Portfolio' | 'Blog';
  authorName: string;
  subtitle?: string;
  className?: string;
}

const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  aiType,
  authorName,
  subtitle = 'Try one of these questions:',
  className = ''
}) => {
  return (
    <div className={`chat-welcome ${className}`}>
      <div className="welcome-message">
        <div className="message-assistant">
          <div className="message-content">
            Hi there 👋<br/>
            You are now speaking with {authorName}'s {aiType} AI.<br/>
            How can I help?
          </div>
        </div>
      </div>
      <p className="welcome-subtitle">{subtitle}</p>
    </div>
  );
};

export default ChatWelcome;