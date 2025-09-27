'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAIContent } from '@/hooks/useAIContent';
import { siteConfig } from '@/lib/site-config';
import ChatMessageComponent, { ChatMessageData } from '@/components/shared/ChatMessage';
import ChatQuestions, { QuestionData } from '@/components/shared/ChatQuestions';
import ChatLoadingState from '@/components/shared/ChatLoadingState';
import ChatErrorState from '@/components/shared/ChatErrorState';
import ChatWelcome from '@/components/shared/ChatWelcome';

interface BlogAIContentProps {
  postContent: string;
  postSlug: string;
  originalContent: React.ReactNode;
}

type ContentType = 'overview' | 'takeaways';
type ModalType = ContentType | 'chat';

const useResponsiveModal = () => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile ?? false; // Default to false during SSR
};

const AIContentModal: React.FC<{
  type: ContentType;
  aiContent: any;
  loading: any;
  errors: any;
  onRetry: (type: ContentType) => void;
  onClose: () => void;
  isOpen: boolean;
  isMobile: boolean;
  cleanAIContent: (content: string) => string;
}> = ({ type, aiContent, loading, errors, onRetry, onClose, isOpen, isMobile, cleanAIContent }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isMobile) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen, isMobile]);

  const handleDialogClose = () => {
    onClose();
  };

  const renderContent = () => {
    if (loading[type]) {
      return (
        <div className="modal-loading enhanced-loading">
          <div className="loading-animation">
            <div className="chat-spinner"></div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <p className="loading-text">{type === 'overview' ? '🤖 Analyzing content and creating your overview...' : '🎯 Extracting the most valuable insights...'}</p>
          <small className="loading-subtext">This usually takes 5-10 seconds</small>
        </div>
      );
    }

    if (errors[type]) {
      return (
        <div className="modal-error">
          <p>❌ {errors[type]}</p>
          <button onClick={() => onRetry(type)} className="retry-btn">
            Try Again
          </button>
        </div>
      );
    }

    if (aiContent[type]) {
      const cleanedContent = cleanAIContent(aiContent[type]);
      return (
        <div className="modal-content">
          <div dangerouslySetInnerHTML={{ __html: cleanedContent }} />
        </div>
      );
    }

    return (
      <div className="modal-loading">
        <div className="chat-spinner"></div>
        <p>{type === 'overview' ? 'Generating overview...' : 'Generating takeaways...'}</p>
      </div>
    );
  };

  if (isMobile) {
    return (
      <dialog
        ref={dialogRef}
        className="ai-modal"
        onClose={handleDialogClose}
      >
        <div className="modal-header">
          <h3>{type === 'overview' ? 'Quick Overview' : 'Your Takeaways'}</h3>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          {renderContent()}
        </div>
      </dialog>
    );
  }

  return null;
};

interface BlogChatMessage {
  type: 'user' | 'assistant';
  content: string;
  questionType?: ContentType;
}

// Helper function to convert BlogChatMessage to ChatMessageData
const convertToMessageData = (message: BlogChatMessage, index: number): ChatMessageData => ({
  id: `blog-${index}`,
  role: message.type as 'user' | 'assistant',
  content: message.content
});

// Helper function to convert ContentType array to QuestionData array
const convertAvailableQuestions = (questions: ContentType[]): QuestionData[] =>
  questions.map(q => ({
    text: q === 'overview' ? 'Give me quick overview' : 'What are my takeaways?',
    key: q
  }));

// Helper function to convert additional questions to QuestionData array
const convertAdditionalQuestions = (questions: string[], loading: {[key: string]: boolean}): QuestionData[] =>
  questions.map(q => {
    const customKey = `custom_question:${q}`;
    return {
      text: q,
      key: customKey,
      loading: loading[customKey] || false
    };
  });

const BlogAIContent: React.FC<BlogAIContentProps> = ({ postContent, postSlug, originalContent }) => {
  const [activePopover, setActivePopover] = useState<ModalType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [chatMessages, setChatMessages] = useState<BlogChatMessage[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionData[]>([
    { text: 'Give me quick overview', key: 'overview' },
    { text: 'What are my takeaways?', key: 'takeaways' }
  ]);
  const [additionalQuestions, setAdditionalQuestions] = useState<string[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [cachedContentLoading, setCachedContentLoading] = useState<{[key: string]: boolean}>({});
  const { aiContent, loading, errors, generateContent, clearError } = useAIContent(postContent, postSlug);
  const isMobile = useResponsiveModal();
  const timeoutRefs = useRef<{[key: string]: NodeJS.Timeout}>({});
  const processedContentRefs = useRef<{[key: string]: boolean}>({});

  // Memoize combined questions array for performance
  const combinedQuestions = useMemo(() => [
    ...availableQuestions,
    ...convertAdditionalQuestions(additionalQuestions, loading)
  ], [availableQuestions, additionalQuestions, loading]);

  // Memoize disabled state calculation for performance
  const isAnyLoading = useMemo(() =>
    Object.values(loading).some(Boolean) ||
    Object.values(cachedContentLoading).some(Boolean) ||
    questionsLoading,
    [loading, cachedContentLoading, questionsLoading]
  );

  const handleRetry = useCallback((type: ContentType) => {
    clearError(type);
    generateContent(type);
  }, [clearError, generateContent]);


  // Helper function to determine if error should have retry option
  const getErrorRetryProps = (cacheKey: string) => {
    const isCustomQuestion = cacheKey.includes(':');
    return {
      onRetry: !isCustomQuestion ? () => handleRetry(cacheKey as ContentType) : undefined,
      showRetry: !isCustomQuestion
    };
  };

  const cleanAIContent = useCallback((content: string) => {
    if (!content) return content;

    // Remove markdown code block indicators
    let cleaned = content.replace(/^```html\s*/i, '').replace(/\s*```$/, '');

    // Remove any standalone html, HTML, or other language identifiers at the start
    cleaned = cleaned.replace(/^(html|HTML|jsx|JSX|javascript|js)\s*\n?/i, '');

    // Remove broken/incomplete HTML tags at the end (like "</", "</" etc.)
    cleaned = cleaned.replace(/<\/?[^>]*$/g, '');

    // Remove any trailing incomplete tags or fragments
    cleaned = cleaned.replace(/\s*<\s*$/, '');

    // Check if content appears to be truncated/incomplete - if so, return empty to prevent display
    if (cleaned.includes('operational') && !cleaned.includes('</div>') && cleaned.length < 500) {
      console.log('Detected truncated content, returning empty:', cleaned.substring(0, 100));
      return '';
    }

    return cleaned.trim();
  }, []);


  const loadAdditionalQuestions = async () => {
    if (questionsLoaded || questionsLoading || additionalQuestions.length > 0) return;

    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          type: 'questions',
          slug: postSlug || 'unknown'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();

      if (data.success) {
        try {
          // Clean the response by removing markdown code block delimiters
          const cleanedContent = data.content
            .replace(/^```json\s*/i, '')
            .replace(/\s*```$/, '')
            .trim();
          const questions = JSON.parse(cleanedContent);
          if (Array.isArray(questions)) {
            setAdditionalQuestions(questions);
          }
        } catch (parseError) {
          setQuestionsError('Unable to parse questions from server');
        }
      } else {
        setQuestionsError('Server error loading questions');
      }
    } catch (error) {
      setQuestionsError('Network error. Check your connection and try again.');
    } finally {
      setQuestionsLoading(false);
      setQuestionsLoaded(true);
    }
  };

  const retryLoadQuestions = () => {
    setQuestionsLoaded(false);
    setQuestionsError(null);
    loadAdditionalQuestions();
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Reset questions when navigating to a different post
  useEffect(() => {
    setAdditionalQuestions([]);
    setQuestionsLoaded(false);
    setQuestionsLoading(false);
    setQuestionsError(null);
  }, [postContent]); // Reset when post content changes

  // Handle AI content updates for chat messages
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage?.type === 'user') {
      if (lastMessage.questionType) {
        // Handle primary questions (overview, takeaways)
        const questionType = lastMessage.questionType;
        const contentKey = `${questionType}-${lastMessage.content}`;

        if (aiContent[questionType] && !loading[questionType] && !processedContentRefs.current[contentKey]) {
          processedContentRefs.current[contentKey] = true;
          const cleanedContent = cleanAIContent(aiContent[questionType]);
          setChatMessages(prev => [...prev, { type: 'assistant', content: cleanedContent }]);
        }
      } else {
        // Handle custom questions - look for custom_question responses
        const question = lastMessage.content;
        const customKey = `custom_question:${question}`;
        const contentKey = `${customKey}-${question}`;

        if (aiContent[customKey] && !loading[customKey] && !processedContentRefs.current[contentKey]) {
          processedContentRefs.current[contentKey] = true;
          const cleanedContent = cleanAIContent(aiContent[customKey]);
          setChatMessages(prev => [...prev, { type: 'assistant', content: cleanedContent }]);
        }
      }
    }
  }, [aiContent, loading, cleanAIContent]); // Removed chatMessages from dependencies to prevent infinite loop

  const handleButtonClick = async (type: ContentType | 'chat') => {
    if (type === 'chat') {
      // Open the new chat-style modal
      setActivePopover('chat');
      // Load additional questions in the background
      setTimeout(() => {
        loadAdditionalQuestions();
      }, 100); // Small delay to ensure modal is visible before starting to load
      return;
    }

    // Note: Individual content type buttons have been removed in favor of chat interface
    // This function now only handles the chat modal opening
  };

  const handleQuestionClick = async (questionText: string, questionKey: string) => {
    // Check if it's a primary question (overview/takeaways) or custom question
    if (questionKey === 'overview' || questionKey === 'takeaways') {
      // Handle primary questions
      const questionType = questionKey as ContentType;

      // Add user message
      setChatMessages(prev => [...prev, { type: 'user', content: questionText, questionType }]);

      // Remove the asked question from available questions
      setAvailableQuestions(prev => prev.filter(q => q.key !== questionKey));

      // If content already exists, show brief loading then add cached content
      if (aiContent[questionType]) {
        // Prevent race condition - don't set loading if already loading for this question type
        if (cachedContentLoading[questionType]) {
          return; // Exit early if already processing this cached content
        }

        // Clear any existing timeout for this question type
        if (timeoutRefs.current[questionType]) {
          clearTimeout(timeoutRefs.current[questionType]);
        }

        const cleanedContent = cleanAIContent(aiContent[questionType]);

        // Set temporary loading state for visual feedback
        setCachedContentLoading(prev => ({ ...prev, [questionType]: true }));

        // Store timeout reference for cleanup
        timeoutRefs.current[questionType] = setTimeout(() => {
          setChatMessages(prev => [...prev, { type: 'assistant', content: cleanedContent }]);
          // Clear the temporary loading state
          setCachedContentLoading(prev => ({ ...prev, [questionType]: false }));
          // Clean up timeout reference
          delete timeoutRefs.current[questionType];
        }, siteConfig.chat.timeouts.cachedContentDelay);
      } else if (!loading[questionType] && !errors[questionType]) {
        // Generate content if not already generated and not currently loading
        await generateContent(questionType);
        // Response will be added via useEffect when aiContent updates
      }
    } else {
      // Handle custom questions
      const question = questionText;

      // Add user message with the custom question
      setChatMessages(prev => [...prev, { type: 'user', content: question }]);

      // Remove this question from available additional questions
      setAdditionalQuestions(prev => prev.filter(q => q !== question));

      // Generate content using the hook for consistency
      await generateContent('custom_question', { question });
    }
  };

  const handleModalClose = () => {
    setActivePopover(null);
    // Reset chat state when modal closes
    setChatMessages([]);
    setAvailableQuestions([
      { text: 'Give me quick overview', key: 'overview' },
      { text: 'What are my takeaways?', key: 'takeaways' }
    ]);
    setCachedContentLoading({}); // Reset cached content loading states

    // Clean up any pending timeouts to prevent memory leaks
    Object.values(timeoutRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    timeoutRefs.current = {};

    // Reset processed content tracking to allow re-processing
    processedContentRefs.current = {};

    // NOTE: Don't reset additionalQuestions or questionsLoaded - they're specific to this post content
    // setAdditionalQuestions([]);  // Keep questions loaded for this post
    // setQuestionsLoaded(false);   // Keep loaded state for this post
  };

  return (
    <div className="blog-content">
      <button
        id="blog-qa-btn"
        className="floating-qa-button"
        onClick={() => handleButtonClick('chat')}
        aria-label="Open Blog Q&A with AI"
      >
        Q&A
      </button>


      {/* Chat Modal for both mobile and desktop */}
      {isClient && activePopover === 'chat' && (
        <div
          className="chat-modal-backdrop"
          onClick={(e) => {
            // More reliable backdrop click detection
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              handleModalClose();
            }
          }}
          style={{ padding: '20px 0px' }}
        >
          <div className="blog-chat-modal" style={{ margin: '20px auto', maxWidth: '800px', width: 'calc(100% - 40px)' }}>
            <div className="chat-modal-header">
              <h3>🤖 Austin's Blog Q&A with AI</h3>
              <button
                onClick={handleModalClose}
                className="chat-modal-close"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            <div className="chat-modal-body">
              {chatMessages.length === 0 ? (
                <ChatWelcome
                  aiType="Blog"
                  authorName={siteConfig.author.name}
                />
              ) : (
                <div className="chat-messages">
                  {chatMessages.map((message, index) => (
                    <ChatMessageComponent
                      key={index}
                      message={convertToMessageData(message, index)}
                      isHTML={message.type === 'assistant'}
                    />
                  ))}

                  {/* Show loading state */}
                  {(Object.values(loading).some(Boolean) || Object.values(cachedContentLoading).some(Boolean)) && (
                    <ChatLoadingState />
                  )}

                  {/* Show error state */}
                  {Object.entries(errors).map(([cacheKey, error]) => error && (
                    <ChatErrorState
                      key={cacheKey}
                      error={typeof error === 'string' ? error : "Sorry, I couldn't generate that content."}
                      {...getErrorRetryProps(cacheKey)}
                    />
                  ))}
                </div>
              )}

              {/* Question Buttons */}
              {questionsLoading || !questionsLoaded ? (
                <ChatLoadingState
                  message="Thinking of questions..."
                />
              ) : questionsError ? (
                <ChatErrorState
                  error={questionsError}
                  onRetry={retryLoadQuestions}
                  showRetry={true}
                />
              ) : (
                <ChatQuestions
                  questions={combinedQuestions}
                  onQuestionClick={handleQuestionClick}
                  disabled={isAnyLoading}
                />
              )}

            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="blog-main-content">
        {originalContent}
      </div>
    </div>
  );
};

export default BlogAIContent;