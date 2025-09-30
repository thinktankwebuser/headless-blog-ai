'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useContextDetection, TabType } from '@/hooks/useContextDetection';
import { useUnifiedChat } from '@/hooks/useUnifiedChat';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { siteConfig } from '@/lib/site-config';
import ChatMessageComponent from '@/components/shared/ChatMessage';
import ChatLoadingState from '@/components/shared/ChatLoadingState';
import ChatErrorState from '@/components/shared/ChatErrorState';
import CitationDisplay from './CitationDisplay';
import ContextChips from './ContextChips';
// import SmartSuggestions from './SmartSuggestions'; // COMMENTED OUT FOR SPACE
// import ContextInsights from './ContextInsights'; // COMMENTED OUT FOR SPACE

function UnifiedChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');

  const [activeChip, setActiveChip] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  // Removed: showTransparencyInfo, hasSeenCapability, showCapabilityToast - over-engineered

  // Removed: touch gesture state - unnecessary complexity

  const pathname = usePathname();
  const contextConfig = useContextDetection();
  const { messages, loading, error, sendMessage, clearMessages, getMessagesForContext } = useUnifiedChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const focusTrapRef = useFocusTrap({ isActive: isOpen, restoreFocus: true });
  // Removed: prevPathname - no longer needed for complex navigation tracking


  // Set default chip when switching to blog tab
  useEffect(() => {
    if (activeTab === 'blog' && contextConfig.contextChips.length > 0 && !activeChip) {
      setActiveChip(contextConfig.contextChips[0]);
    }
  }, [activeTab, contextConfig.contextChips, activeChip]);

  // Get messages for current context
  const currentMessages = getMessagesForContext(
    activeTab,
    activeTab === 'blog' && activeChip === 'This post' ? contextConfig.postSlug : undefined
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Use scrollTop instead of scrollIntoView to prevent layout issues
    const messagesContainer = messagesEndRef.current?.closest('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [currentMessages.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Removed: capability toast useEffects - over-engineered

  // Removed: complex navigation tracking - over-engineered

  // Mobile keyboard handling - disabled to prevent header disappearing bug
  // useEffect(() => {
  //   // Commenting out mobile keyboard handling as it was causing header to disappear
  //   // The CSS already handles mobile layout properly
  // }, [isOpen]);

  const handleSend = async (directQuestion?: string) => {
    const question = directQuestion || inputValue.trim();
    if (!question || loading) return;

    if (!directQuestion) {
      setInputValue('');
    }

    // Determine context based on active tab and chip
    let context: 'portfolio' | 'blog-post' | 'blog-search' = 'portfolio';
    let blogMode: 'post' | 'search' | undefined;

    if (activeTab === 'blog') {
      if (activeChip === 'This post' && contextConfig.postSlug) {
        context = 'blog-post';
        blogMode = 'post';
      } else {
        context = 'blog-search';
        blogMode = 'search';
      }
    }

    await sendMessage(question, {
      context,
      postSlug: contextConfig.postSlug,
      blogMode
    });

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, tabType: TabType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabType);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const newTab = tabType === 'portfolio' ? 'blog' : 'portfolio';
      setActiveTab(newTab);
    }
  };

  const handlePortfolioTabClick = () => setActiveTab('portfolio');
  const handleBlogTabClick = () => setActiveTab('blog');

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Don't clear messages - keep conversation history
  };

  // Removed: clearMessagesAndQuestions - over-engineered

  // Removed: getUsedQuestionsContextKey - over-engineered

  // Reset 'blog-current' when switching to a different blog post
  // (handled by pathname change effect below to avoid double resets)

  // Removed: touch gesture handlers - unnecessary complexity

  const handleQuestionClick = async (questionText: string) => {
    if (loading) return;
    setUsedQuestions(prev => [...prev, questionText]);
    await handleSend(questionText);
  };

  // Removed: getCurrentCapabilityStatement - was for removed capability toast

  const getCurrentExampleQuestions = () => {
    let questions: string[] = [];

    if (activeTab === 'portfolio') {
      questions = [
        'What\'s your experience with finance?',
        'Tell me about your fintech background',
        'Show me a complex integration you\'ve led'
      ];
    } else {
      // Blog tab - different questions based on context chip
      if (activeChip === 'This post') {
        questions = contextConfig.dynamicQuestions || [
          'Summarize this post in 5 bullets',
          'What are the key takeaways?'
        ];
      } else {
        questions = [
          'What key insights on AI do we have?',
          'Find posts about payment optimization',
          'How do we approach fintech innovation?'
        ];
      }
    }

    return questions.filter(q => !usedQuestions.includes(q));
  };

  if (!isOpen) {
    return (
      <button
        className="unified-chat-launcher"
        onClick={() => setIsOpen(true)}
        aria-label={`Open AI Assistant - ${contextConfig.title}`}
        aria-describedby="chat-launcher-description"
        title={`${contextConfig.icon} ${contextConfig.title}`}
      >
        <span aria-hidden="true">{contextConfig.icon}</span>
        <span id="chat-launcher-description" className="sr-only">
          AI assistant that adapts to your current page context
        </span>
      </button>
    );
  }

  return (
    <div
      className="unified-chat-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-title"
      aria-describedby="chat-description"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={handleModalKeyDown}
    >
      <div
        className="unified-chat-panel"
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
      >
        {/* Header */}
        <header className="unified-chat-header">
          <div className="chat-header-content">
            <h3 id="chat-title">
              <span className="chat-logo" aria-hidden="true">{contextConfig.icon}</span>
              Thinking in CAPITAL's AI Assistant
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="chat-close"
            aria-label="Close AI Assistant dialog"
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {/* Tab Navigation - Simplified */}
        <div className="chat-tab-container-simple" role="tablist" aria-label="Chat mode selection">
          <button
            onClick={handlePortfolioTabClick}
            onKeyDown={(e) => handleTabKeyDown(e, 'portfolio')}
            className={`chat-tab-simple ${activeTab === 'portfolio' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'portfolio'}
            aria-controls="portfolio-panel"
            id="portfolio-tab"
            tabIndex={activeTab === 'portfolio' ? 0 : -1}
            type="button"
          >
            <span aria-hidden="true">📋</span> Portfolio
          </button>
          <button
            onClick={handleBlogTabClick}
            onKeyDown={(e) => handleTabKeyDown(e, 'blog')}
            className={`chat-tab-simple ${activeTab === 'blog' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'blog'}
            aria-controls="blog-panel"
            id="blog-tab"
            tabIndex={activeTab === 'blog' ? 0 : -1}
            type="button"
          >
            <span aria-hidden="true">📝</span> Blog
          </button>
        </div>

        {/* Context Chips (for blog tab) */}
        {activeTab === 'blog' && contextConfig.contextChips.length > 0 && (
          <ContextChips
            chips={contextConfig.contextChips}
            activeChip={activeChip}
            onChipClick={setActiveChip}
            disabled={loading}
          />
        )}

        {/* Removed: capability toast - over-engineered */}


        {/* Messages */}
        <main
          className="chat-messages"
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
          aria-live="polite"
          aria-relevant="additions"
        >
          {currentMessages.length === 0 ? (
            <div className="chat-welcome">
              <h4>👋 Welcome!</h4>
              <p>{activeTab === 'portfolio'
                ? 'Ask about Austin\'s background, skills, and experience'
                : activeChip === 'This post'
                  ? 'Get insights about this post + our expertise'
                  : 'Search across all of our blog insights'
              }</p>

              {/* Context Insights - Phase 2 enhancement - COMMENTED OUT FOR SPACE */}
              {/* {contextConfig.contextInsights && (
                <ContextInsights
                  insights={contextConfig.contextInsights}
                  relatedTopics={contextConfig.relatedTopics}
                />
              )} */}

              {/* Smart Suggestions - Phase 2 enhancement - COMMENTED OUT FOR SPACE */}
              {/* {contextConfig.smartSuggestions && contextConfig.smartSuggestions.length > 0 && (
                <SmartSuggestions
                  suggestions={contextConfig.smartSuggestions}
                  onSuggestionClick={handleQuestionClick}
                  disabled={loading}
                />
              )} */}

              {/* Enhanced Example Questions */}
              <div className="example-questions">
                <h5>Try asking:</h5>
                <div className="question-buttons" role="group" aria-label="Example questions">
                  {getCurrentExampleQuestions().map((question, index) => (
                    <button
                      key={index}
                      className="example-question-btn"
                      onClick={() => handleQuestionClick(question)}
                      disabled={loading}
                      type="button"
                      aria-describedby="example-questions-help"
                    >
                      {question}
                    </button>
                  ))}
                  <div id="example-questions-help" className="sr-only">
                    Click any example question to get started, or type your own question below
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="message-list">
              {currentMessages.map((message) => (
                <div key={message.id} className="message-container">
                  <ChatMessageComponent
                    message={{
                      id: message.id,
                      role: message.role,
                      content: message.content
                    }}
                    isHTML={message.role === 'assistant'}
                  />
                  {message.role === 'assistant' && message.sources && message.sources.length > 0 &&
                   !(activeTab === 'blog' && activeChip === 'This post') &&
                   activeTab !== 'portfolio' && (
                    <CitationDisplay
                      sources={message.sources}
                    />
                  )}
                </div>
              ))}

              {/* Persistent Example Questions */}
              {getCurrentExampleQuestions().length > 0 && (
                <div className="example-questions persistent">
                  <h5>Try asking:</h5>
                  <div className="question-buttons" role="group" aria-label="Example questions">
                    {getCurrentExampleQuestions().map((question, index) => (
                      <button
                        key={index}
                        className="example-question-btn"
                        onClick={() => handleQuestionClick(question)}
                        disabled={loading}
                        type="button"
                        aria-describedby="example-questions-help"
                      >
                        {question}
                      </button>
                    ))}
                    <div id="example-questions-help" className="sr-only">
                      Click any example question to get started, or type your own question below
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && <ChatLoadingState />}
          {error && (
            <ChatErrorState
              error={error}
              showRetry={false}
            />
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <footer className="chat-input">
          <div className="input-container">
            <label htmlFor="chat-input" className="sr-only">
              {`Ask a question about ${activeTab === 'portfolio' ? 'Austin\u0027s background and skills' : activeChip === 'This post' ? 'this blog post' : 'blog content'}`}
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={`Ask about ${activeTab === 'portfolio' ? 'Austin\u0027s background and skills' : activeChip === 'This post' ? 'this post' : 'any blog post'}...`}
              className="chat-textarea"
              rows={1}
              disabled={loading}
              maxLength={500}
              aria-describedby="chat-input-help character-count trust-info"
              aria-invalid={false}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || loading}
              className="send-button"
              aria-label={loading ? 'Sending message...' : 'Send message'}
              type="button"
            >
              <span aria-hidden="true">➤</span>
            </button>
          </div>
          {/* Removed: character count and transparency footer - over-engineered */}
          <div id="chat-input-help" className="sr-only">
            Press Enter to send your message, or Shift+Enter for a new line. Maximum 500 characters.
          </div>
        </footer>

        {/* Removed: transparency panel - over-engineered */}
      </div>
    </div>
  );
}

export default UnifiedChatWidget;