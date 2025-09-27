'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { siteConfig } from '@/lib/site-config';
import ChatMessageComponent from '@/components/shared/ChatMessage';
import ChatQuestions, { QuestionData } from '@/components/shared/ChatQuestions';
import ChatLoadingState from '@/components/shared/ChatLoadingState';
import ChatErrorState from '@/components/shared/ChatErrorState';
import ChatWelcome from '@/components/shared/ChatWelcome';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, loading, error, sendMessage, clearMessages } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<QuestionData[]>(
    siteConfig.chat.portfolioQuestions.map((q, i) => ({ text: q, key: `portfolio-${i}` }))
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), siteConfig.chat.timeouts.focus);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const question = inputValue.trim();
    setInputValue('');
    await sendMessage(question);

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, siteConfig.chat.timeouts.focus);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset chat state when modal closes for fresh start
    clearMessages();
    setAvailableQuestions(
      siteConfig.chat.portfolioQuestions.map((q, i) => ({ text: q, key: `portfolio-${i}` }))
    );
  };

  const handleQuestionClick = async (questionText: string, questionKey: string) => {
    // Remove the asked question from available questions
    setAvailableQuestions(prev => prev.filter(q => q.key !== questionKey));

    await sendMessage(questionText);
    // Refocus input after preset question
    setTimeout(() => {
      inputRef.current?.focus();
    }, siteConfig.chat.timeouts.focus);
  };


  if (!isOpen) {
    return (
      <button
        className="chat-launcher"
        onClick={() => setIsOpen(true)}
        aria-label="Chat about my portfolio"
        title="Ask questions about my skills and experience"
      >
        💬
      </button>
    );
  }

  return (
    <div className="chat-modal" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="chat-panel">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-content">
            <h3 id="chat-title">
              <span className="chat-logo">🚀</span>
              {siteConfig.site.title}
            </h3>
            <div className="safety-banner">
              💡 Answers only from my portfolio. No financial advice.
            </div>
          </div>
          <button
            onClick={handleClose}
            className="chat-close"
            aria-label="Close chat"
          >
            ×
          </button>
        </header>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <ChatWelcome
              aiType="Portfolio"
              authorName={siteConfig.author.name}
            />
          )}

          <ChatQuestions
            questions={availableQuestions}
            onQuestionClick={handleQuestionClick}
            disabled={loading}
          />

          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              isHTML={false}
            />
          ))}

          {loading && (
            <ChatLoadingState />
          )}

          {error && (
            <ChatErrorState
              error={error}
              showRetry={false}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about my CV, skills, or projects..."
              className="chat-textarea"
              rows={1}
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="send-button"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
          <div className="input-footer">
            <small>{inputValue.length}/500</small>
          </div>
        </div>
      </div>
    </div>
  );
}