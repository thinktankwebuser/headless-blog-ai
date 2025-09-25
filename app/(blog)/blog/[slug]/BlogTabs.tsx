'use client';

import { useState, useEffect, useRef } from 'react';
import { useAIContent } from '@/hooks/useAIContent';

interface BlogTabsProps {
  postContent: string;
  postSlug: string;
  originalContent: React.ReactNode;
}

type ContentType = 'overview' | 'takeaways';

const useResponsiveModal = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile;
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
}> = ({ type, aiContent, loading, errors, onRetry, onClose, isOpen, isMobile }) => {
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
        <div className="modal-loading">
          <div className="modal-spinner"></div>
          <p>{type === 'overview' ? 'Generating quick overview...' : 'Extracting key takeaways...'}</p>
        </div>
      );
    }

    if (errors[type]) {
      return (
        <div className="modal-error">
          <p>Error: {errors[type]}</p>
          <button onClick={() => onRetry(type)} className="retry-btn">
            Try Again
          </button>
        </div>
      );
    }

    if (aiContent[type]) {
      return (
        <div className="modal-content">
          <div dangerouslySetInnerHTML={{ __html: aiContent[type].replace(/\n/g, '<br>') }} />
        </div>
      );
    }

    return (
      <div className="modal-loading">
        <div className="modal-spinner"></div>
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

const BlogTabs: React.FC<BlogTabsProps> = ({ postContent, postSlug, originalContent }) => {
  const [activePopover, setActivePopover] = useState<ContentType | null>(null);
  const { aiContent, loading, errors, generateContent, clearError } = useAIContent(postContent, postSlug);
  const isMobile = useResponsiveModal();
  const popoverRefs = useRef<{ [key in ContentType]: HTMLDivElement | null }>({
    overview: null,
    takeaways: null,
  });

  const handleButtonClick = async (type: ContentType) => {
    // Generate content if not already generated
    if (!aiContent[type] && !loading[type] && !errors[type]) {
      await generateContent(type);
    }

    if (isMobile) {
      setActivePopover(type);
    } else {
      // Let the HTML popover API handle the toggling via popovertarget
      // Just track state for other UI needs
      setTimeout(() => {
        const popover = popoverRefs.current[type];
        if (popover) {
          const isOpen = popover.matches(':popover-open');
          setActivePopover(isOpen ? type : null);
        }
      }, 10);
    }
  };

  const handleRetry = (type: ContentType) => {
    clearError(type);
    generateContent(type);
  };

  const handlePopoverToggle = (type: ContentType, event: any) => {
    const isOpen = event.newState === 'open';
    setActivePopover(isOpen ? type : null);

    // Close other popovers when one opens
    if (isOpen) {
      Object.entries(popoverRefs.current).forEach(([otherType, ref]) => {
        if (otherType !== type && ref && ref.matches(':popover-open')) {
          ref.hidePopover();
        }
      });
    }
  };

  const handleModalClose = () => {
    setActivePopover(null);
  };

  const renderPopoverContent = (type: ContentType) => {
    if (loading[type]) {
      return (
        <div className="popover-loading">
          <div className="popover-spinner"></div>
          <p>{type === 'overview' ? 'Loading overview...' : 'Loading takeaways...'}</p>
        </div>
      );
    }

    if (errors[type]) {
      return (
        <div className="popover-error">
          <p>Error loading content</p>
          <button onClick={() => handleRetry(type)} className="retry-btn">
            Try Again
          </button>
        </div>
      );
    }

    if (aiContent[type]) {
      return (
        <div className="popover-content">
          <div dangerouslySetInnerHTML={{ __html: aiContent[type].replace(/\n/g, '<br>') }} />
        </div>
      );
    }

    return (
      <div className="popover-loading">
        <div className="popover-spinner"></div>
        <p>Generating...</p>
      </div>
    );
  };

  return (
    <div className="blog-content">
      <div className="ai-buttons">
        <button
          id="overview-btn"
          className="ai-btn"
          onClick={() => handleButtonClick('overview')}
          disabled={loading.overview}
          aria-expanded={activePopover === 'overview'}
          popoverTarget={!isMobile ? 'overview-popover' : undefined}
        >
          {loading.overview ? 'Loading...' : 'Quick Overview'}
        </button>

        <button
          id="takeaways-btn"
          className="ai-btn"
          onClick={() => handleButtonClick('takeaways')}
          disabled={loading.takeaways}
          aria-expanded={activePopover === 'takeaways'}
          popoverTarget={!isMobile ? 'takeaways-popover' : undefined}
        >
          {loading.takeaways ? 'Loading...' : 'Your Takeaways'}
        </button>
      </div>

      {/* Desktop Popovers */}
      {!isMobile && (
        <>
          <div
            id="overview-popover"
            ref={el => popoverRefs.current.overview = el}
            popover="auto"
            className="ai-popover"
            onToggle={(e: any) => handlePopoverToggle('overview', e)}
          >
            <div className="popover-header">
              <h4>Quick Overview</h4>
              <button
                className="popover-close"
                onClick={() => popoverRefs.current.overview?.hidePopover()}
                aria-label="Close popover"
              >
                ✕
              </button>
            </div>
            {renderPopoverContent('overview')}
          </div>

          <div
            id="takeaways-popover"
            ref={el => popoverRefs.current.takeaways = el}
            popover="auto"
            className="ai-popover"
            onToggle={(e: any) => handlePopoverToggle('takeaways', e)}
          >
            <div className="popover-header">
              <h4>Your Takeaways</h4>
              <button
                className="popover-close"
                onClick={() => popoverRefs.current.takeaways?.hidePopover()}
                aria-label="Close popover"
              >
                ✕
              </button>
            </div>
            {renderPopoverContent('takeaways')}
          </div>
        </>
      )}

      {/* Mobile Modal */}
      {isMobile && activePopover && (
        <AIContentModal
          type={activePopover}
          aiContent={aiContent}
          loading={loading}
          errors={errors}
          onRetry={handleRetry}
          onClose={handleModalClose}
          isOpen={!!activePopover}
          isMobile={isMobile}
        />
      )}

      {/* Main Content */}
      <div className="blog-main-content">
        {originalContent}
      </div>
    </div>
  );
};

export default BlogTabs;