'use client';

import { useState, useCallback } from 'react';
import { UnifiedChatMessage, UnifiedChatResponse, ChatState, SendMessageOptions } from '@/types/chat';
import { findRelevantSection, createEnhancedCitation, BlogSection } from '@/lib/blog-processor';

// Helper function to determine blog message key
const getBlogKey = (context: string, postSlug?: string): string => {
  if (context === 'blog-post' && postSlug) return postSlug;
  return 'general'; // for blog-search or fallback
};

export function useUnifiedChat() {
  const [state, setState] = useState<ChatState>({
    portfolioMessages: [],
    blogMessages: {},
    loading: false,
    error: null,
  });

  const sendMessage = useCallback(async (
    question: string,
    options: SendMessageOptions
  ): Promise<void> => {
    if (!question.trim() || state.loading) return;

    const messageContext = options.context;
    const userMessage: UnifiedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question.trim(),
      context: messageContext,
      timestamp: new Date(),
    };

    const blogKey = getBlogKey(messageContext, options.postSlug);

    // Add user message to appropriate context
    setState(prev => {
      if (messageContext === 'portfolio') {
        return {
          ...prev,
          portfolioMessages: [...prev.portfolioMessages, userMessage],
          loading: true,
          error: null,
        };
      } else {
        return {
          ...prev,
          blogMessages: {
            ...prev.blogMessages,
            [blogKey]: [...(prev.blogMessages[blogKey] || []), userMessage]
          },
          loading: true,
          error: null,
        };
      }
    });

    try {
      let response: Response;
      let blogPostData: any = null;

      // Route to appropriate API based on context
      if (options.context === 'portfolio') {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.trim(),
            context: 'portfolio'
          }),
        });
      } else {
        // Blog contexts use the ai-generate API
        let blogContent = '';

        if (options.context === 'blog-post' && options.postSlug) {
          const postResponse = await fetch(`/api/blog-content/${options.postSlug}`);
          if (postResponse.ok) {
            const postData = await postResponse.json();
            blogContent = postData.content || '';
            blogPostData = postData;
          }
        } else {
          const postsResponse = await fetch('/api/blog-search-content');
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            blogContent = postsData.content || '';
          }
        }

        response = await fetch('/api/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: blogContent,
            type: options.context === 'blog-post' ? 'custom_question' : 'blog_search',
            question: question.trim(),
            slug: options.postSlug || 'unified-chat',
            context: options.context,
            blogMode: options.blogMode
          }),
        });
      }

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.error || 'Please wait before sending another message');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Create assistant message with simplified logic
      const content = options.context === 'portfolio'
        ? (data.refusal ? data.message : data.answer)
        : (data.success ? data.content : data.error || 'Sorry, I couldn\'t generate a response.');

      const sources = options.context === 'portfolio'
        ? data.citations?.map((citation: any) => ({
            title: citation.path || 'Source',
            url: citation.url || `/?topic=${encodeURIComponent((citation.path || '').toLowerCase().replace(/\.(md|txt)$/i, '').replace(/[^a-z0-9]+/g, '-'))}`,
            section: citation.heading,
            confidence: citation.similarity || 1,
            excerpt: citation.content || ''
          })) || []
        : [];

      const assistantMessage: UnifiedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        context: messageContext,
        sources,
        timestamp: new Date(),
      };

      setState(prev => {
        if (messageContext === 'portfolio') {
          return {
            ...prev,
            portfolioMessages: [...prev.portfolioMessages, assistantMessage],
            loading: false,
          };
        } else {
          return {
            ...prev,
            blogMessages: {
              ...prev.blogMessages,
              [blogKey]: [...(prev.blogMessages[blogKey] || []), assistantMessage]
            },
            loading: false,
          };
        }
      });

    } catch (error) {
      console.error('Unified chat error:', error);

      const errorMessage: UnifiedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        context: messageContext,
        sources: [],
        timestamp: new Date(),
      };

      const errorState = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => {
        const baseUpdate = { ...prev, loading: false, error: errorState };

        if (messageContext === 'portfolio') {
          return {
            ...baseUpdate,
            portfolioMessages: [...prev.portfolioMessages, errorMessage],
          };
        } else {
          return {
            ...baseUpdate,
            blogMessages: {
              ...prev.blogMessages,
              [blogKey]: [...(prev.blogMessages[blogKey] || []), errorMessage]
            },
          };
        }
      });
    }
  }, [state.loading]);

  const clearMessages = useCallback((context?: 'portfolio' | 'blog' | 'all' | string) => {
    setState(prev => {
      if (!context) {
        // Clear all messages
        return {
          ...prev,
          portfolioMessages: [],
          blogMessages: {},
          error: null,
        };
      } else if (context === 'portfolio') {
        // Clear only blog messages, keep portfolio
        return {
          ...prev,
          blogMessages: {},
          error: null,
        };
      } else if (context === 'blog') {
        // Clear only portfolio messages, keep blog
        return {
          ...prev,
          portfolioMessages: [],
          error: null,
        };
      } else {
        // Clear specific blog post by slug
        const newBlogMessages = { ...prev.blogMessages };
        delete newBlogMessages[context];
        return {
          ...prev,
          blogMessages: newBlogMessages,
          error: null,
        };
      }
    });
  }, []);

  const getMessagesForContext = useCallback((context: 'portfolio' | 'blog', postSlug?: string): UnifiedChatMessage[] => {
    if (context === 'portfolio') {
      return state.portfolioMessages;
    } else {
      // Use same logic as sendMessage to determine blog key
      const blogContext = postSlug ? 'blog-post' : 'blog-search';
      const blogKey = getBlogKey(blogContext, postSlug);
      return state.blogMessages[blogKey] || [];
    }
  }, [state.portfolioMessages, state.blogMessages]);

  return {
    messages: state,
    loading: state.loading,
    error: state.error,
    sendMessage,
    clearMessages,
    getMessagesForContext,
  };
}