'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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
  const [showTransparencyInfo, setShowTransparencyInfo] = useState(false);
  const [hasSeenCapability, setHasSeenCapability] = useState(false);
  const [showCapabilityToast, setShowCapabilityToast] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<{[key: string]: string[]}>({
    portfolio: [],
    blog: []
  });

  // Touch gesture state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const contextConfig = useContextDetection();
  const { messages, loading, error, sendMessage, clearMessages, getMessagesForContext } = useUnifiedChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const focusTrapRef = useFocusTrap({ isActive: isOpen, restoreFocus: true });

  // Set smart defaults when modal opens (only on initial open, not when context updates)
  useEffect(() => {
    if (isOpen) {
      setActiveTab(contextConfig.defaultTab);
      setActiveChip(contextConfig.contextChips[0] || '');
    }
  }, [isOpen]); // Removed contextConfig dependencies to prevent state reset mid-conversation

  // Get messages for current context
  const currentMessages = getMessagesForContext(activeTab);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-dismissing capability toast
  useEffect(() => {
    if (isOpen && !hasSeenCapability) {
      setShowCapabilityToast(true);
      setHasSeenCapability(true);
    }
  }, [isOpen, hasSeenCapability]);

  // Auto-dismiss timer for capability toast
  useEffect(() => {
    if (showCapabilityToast) {
      const timer = setTimeout(() => {
        setShowCapabilityToast(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showCapabilityToast]);

  // Mobile keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // Detect mobile keyboard by checking viewport height change
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const viewportHeight = window.innerHeight;
        const isKeyboardOpen = viewportHeight < window.screen.height * 0.75;

        // Adjust modal positioning when keyboard is open
        const modal = document.querySelector('.unified-chat-modal') as HTMLElement;
        if (modal) {
          if (isKeyboardOpen) {
            modal.style.alignItems = 'flex-start';
            modal.style.paddingTop = '10px';
          } else {
            modal.style.alignItems = 'flex-end';
            modal.style.paddingTop = '';
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return;

    const question = inputValue.trim();
    setInputValue('');

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
  }, [inputValue, loading, activeTab, activeChip, contextConfig.postSlug, sendMessage]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, tabType: TabType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabType);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const newTab = tabType === 'portfolio' ? 'blog' : 'portfolio';
      setActiveTab(newTab);
    }
  }, []);

  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Don't clear messages - keep conversation history
  }, []);

  const clearMessagesAndQuestions = useCallback((context?: 'portfolio' | 'blog') => {
    clearMessages(context);
    if (context) {
      setUsedQuestions(prev => ({
        ...prev,
        [context]: []
      }));
    } else {
      setUsedQuestions({
        portfolio: [],
        blog: []
      });
    }
  }, [clearMessages]);

  // Reset used questions when switching tabs
  useEffect(() => {
    const contextKey = activeTab === 'portfolio' ? 'portfolio' : 'blog';
    setUsedQuestions(prev => ({
      ...prev,
      [contextKey]: []
    }));
  }, [activeTab]);

  // Touch gesture handlers for swipe-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY === null) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;

    // Only consider downward swipes from the header area
    if (deltaY > 10) {
      setIsDragging(true);
    }
  }, [touchStartY]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY === null || touchStartTime === null) return;

    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    const velocity = deltaY / deltaTime;

    // Swipe down to close: minimum 100px movement or high velocity
    if ((deltaY > 100 && deltaTime < 500) || velocity > 0.5) {
      handleClose();
    }

    // Reset touch state
    setTouchStartY(null);
    setTouchStartTime(null);
    setIsDragging(false);
  }, [touchStartY, touchStartTime, handleClose]);

  const handleQuestionClick = useCallback(async (questionText: string) => {
    setInputValue(questionText);

    // Mark question as used
    const contextKey = activeTab === 'portfolio' ? 'portfolio' : 'blog';
    setUsedQuestions(prev => ({
      ...prev,
      [contextKey]: [...prev[contextKey], questionText]
    }));

    // Auto-send the question
    setTimeout(() => handleSend(), 100);
  }, [handleSend, activeTab]);

  const getCurrentCapabilityStatement = useMemo(() => {
    if (activeTab === 'portfolio') {
      return 'AI Assistant trained on Austin\'s résumé, projects, and case studies. I provide information-only responses and don\'t give personal finance, legal, or investment advice. Please verify important details independently.';
    } else {
      if (activeChip === 'This post') {
        return 'AI Assistant analyzing this specific blog post. I summarize content and cite sections used. Responses are AI-generated based on the post content.';
      } else {
        return 'AI Assistant searching Austin\'s blog posts. I synthesize information across posts and cite sources. All responses are AI-generated and should be verified for accuracy.';
      }
    }
  }, [activeTab, activeChip]);

  const getCurrentExampleQuestions = useMemo(() => {
    const contextKey = activeTab === 'portfolio' ? 'portfolio' : 'blog';
    const usedInContext = usedQuestions[contextKey] || [];

    // Tab-specific questions based on current active tab
    let allQuestions: string[] = [];

    if (activeTab === 'portfolio') {
      allQuestions = [
        'What\'s your experience with finance?',
        'Tell me about your fintech background',
        'Show me a complex integration you\'ve led'
      ];
    } else {
      // Blog tab - different questions based on context chip
      if (activeChip === 'This post') {
        // Use dynamic questions generated by the Q&A bot for this specific post
        allQuestions = contextConfig.dynamicQuestions || [
          'Summarize this post in 5 bullets',
          'What are the key takeaways?'
        ];
      } else {
        allQuestions = [
          'What key insights on AI do we have?',
          'Find posts about payment optimization',
          'How do we approach fintech innovation?'
        ];
      }
    }

    // Filter out used questions
    return allQuestions.filter(question => !usedInContext.includes(question));
  }, [activeTab, activeChip, usedQuestions]);

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDragging ? 'translateY(2px)' : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
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

        {/* Tab Navigation */}
        <div className="chat-tabs" role="tablist" aria-label="Chat mode selection">
          <button
            onClick={() => setActiveTab('portfolio')}
            onKeyDown={(e) => handleTabKeyDown(e, 'portfolio')}
            className={`chat-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            disabled={loading}
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
            onClick={() => setActiveTab('blog')}
            onKeyDown={(e) => handleTabKeyDown(e, 'blog')}
            className={`chat-tab ${activeTab === 'blog' ? 'active' : ''}`}
            disabled={loading}
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

        {/* Auto-dismissing Capability Toast */}
        {showCapabilityToast && (
          <div className="capability-toast">
            <div className="capability-toast-content">
              <span className="capability-toast-icon">💡</span>
              <span className="capability-toast-text">
                {getCurrentCapabilityStatement}
              </span>
              <button
                className="capability-toast-close"
                onClick={() => setShowCapabilityToast(false)}
                aria-label="Dismiss capability information"
              >
                ×
              </button>
            </div>
          </div>
        )}


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
                  {getCurrentExampleQuestions.map((question, index) => (
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
              {getCurrentExampleQuestions.length > 0 && (
                <div className="example-questions persistent">
                  <h5>Try asking:</h5>
                  <div className="question-buttons" role="group" aria-label="Example questions">
                    {getCurrentExampleQuestions.map((question, index) => (
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
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="send-button"
              aria-label={loading ? 'Sending message...' : 'Send message'}
              type="button"
            >
              <span aria-hidden="true">➤</span>
            </button>
          </div>
          {/* COMMENTED OUT FOR SPACE - Character count and transparency footer */}
          {/* <div className="input-footer">
            <div id="character-count" className="character-count">
              <small aria-live="polite">{inputValue.length}/500 characters</small>
            </div>
            <div id="trust-info" className="trust-footer">
              <small>
                🤖 AI-generated responses • Sources cited when available • Accuracy not guaranteed •
                <button
                  type="button"
                  className="transparency-link"
                  onClick={() => setShowTransparencyInfo(!showTransparencyInfo)}
                  aria-expanded={showTransparencyInfo}
                  aria-controls="transparency-details"
                >
                  AI transparency info
                </button>
              </small>
            </div>
          </div> */}
          <div id="chat-input-help" className="sr-only">
            Press Enter to send your message, or Shift+Enter for a new line. Maximum 500 characters.
          </div>
        </footer>

        {/* AI Transparency Details */}
        {showTransparencyInfo && (
          <div id="transparency-details" className="transparency-panel" aria-live="polite">
            <div className="transparency-content">
              <h4>🤖 AI Transparency Information</h4>
              <div className="transparency-grid">
                <div className="transparency-item">
                  <h5>What this AI does</h5>
                  <p>This AI assistant answers questions using Austin's portfolio content and blog posts. Responses are generated by artificial intelligence, not Austin personally.</p>
                </div>
                <div className="transparency-item">
                  <h5>Data processing</h5>
                  <p>Your questions are processed to generate responses. No personal data is stored permanently. Conversations are not saved between sessions.</p>
                </div>
                <div className="transparency-item">
                  <h5>Limitations</h5>
                  <p>AI responses may contain errors. Information should be verified independently. The AI cannot provide legal, financial, or medical advice.</p>
                </div>
                <div className="transparency-item">
                  <h5>Contact</h5>
                  <p>For business inquiries or to speak with Austin directly, use the contact information in the site header.</p>
                </div>
              </div>
              <button
                type="button"
                className="transparency-close"
                onClick={() => setShowTransparencyInfo(false)}
                aria-label="Close transparency information"
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(UnifiedChatWidget);