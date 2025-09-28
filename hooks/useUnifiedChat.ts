'use client';

import { useState, useCallback } from 'react';
import { UnifiedChatMessage, UnifiedChatResponse, ChatState, SendMessageOptions } from '@/types/chat';
import { findRelevantSection, createEnhancedCitation, BlogSection } from '@/lib/blog-processor';

export function useUnifiedChat() {
  const [state, setState] = useState<ChatState>({
    portfolioMessages: [],
    blogMessages: [],
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

    // Add user message to appropriate context
    setState(prev => ({
      ...prev,
      [messageContext === 'portfolio' ? 'portfolioMessages' : 'blogMessages']: [
        ...(messageContext === 'portfolio' ? prev.portfolioMessages : prev.blogMessages),
        userMessage
      ],
      loading: true,
      error: null,
    }));

    try {
      let response: Response;
      let blogPostData: any = null; // Store enhanced data for Phase 2 - moved to broader scope

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
        // Fetch appropriate content based on context
        let blogContent = '';

        if (options.context === 'blog-post' && options.postSlug) {
          // For individual posts, fetch that specific post content with enhanced section data
          try {
            const postResponse = await fetch(`/api/blog-content/${options.postSlug}`);
            if (postResponse.ok) {
              const postData = await postResponse.json();
              blogContent = postData.content || 'Blog post content not available';

              // Store complete post data for enhanced citations (Phase 2)
              blogPostData = postData;
            } else {
              blogContent = 'Unable to fetch blog post content for analysis';
            }
          } catch (error) {
            console.error('Error fetching post content:', error);
            blogContent = 'Error loading blog post content';
          }
        } else {
          // For blog search, fetch recent blog posts for comprehensive context
          try {
            const postsResponse = await fetch('/api/blog-search-content');
            if (postsResponse.ok) {
              const postsData = await postsResponse.json();
              blogContent = postsData.content || 'Blog content not available';
            } else {
              // Fallback to static summary
              blogContent = `Austin Puthur James is a digital innovation leader specializing in AI, fintech, payment optimization, and digital transformation. His blog covers topics including:

- Modern payment channels and optimization strategies
- Applied AI in financial services and fintech solutions
- Digital transformation and breakthrough innovation ideas
- Self-serve solutions and platform development
- Integration strategies with modern tech stacks (Next.js, AWS, Supabase)
- Product leadership and engineering management insights

Key expertise areas: Payment systems, AI implementation, API integrations, platform architecture, and team leadership in fast-paced fintech environments.`;
            }
          } catch (error) {
            console.error('Error fetching blog search content:', error);
            // Fallback to static summary
            blogContent = `Austin Puthur James is a digital innovation leader specializing in AI, fintech, payment optimization, and digital transformation. His blog covers topics including modern payment channels, AI in financial services, digital transformation, and platform development.`;
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

      // Handle different response formats
      let assistantMessage: UnifiedChatMessage;

      if (options.context === 'portfolio') {
        // Portfolio API response format
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.refusal ? data.message : data.answer,
          context: messageContext,
          sources: data.citations?.map((citation: any) => ({
            title: citation.path || 'Source',
            url: citation.url || `/?topic=${encodeURIComponent((citation.path || '').toLowerCase().replace(/\.(md|txt)$/i, '').replace(/[^a-z0-9]+/g, '-'))}`,
            section: citation.heading,
            confidence: citation.similarity || 1,
            excerpt: citation.content || ''
          })) || [],
          timestamp: new Date(),
        };
      } else {
        // Blog API response format with enhanced citations (Phase 2)
        let enhancedSources: any[] = [];

        // Generate enhanced citations for blog posts with sections
        if (options.context === 'blog-post' && blogPostData && options.postSlug) {
          try {
            const sections = blogPostData.sections || [];
            const postSlug = blogPostData.slug || options.postSlug;
            const postTitle = blogPostData.title || 'Blog Post';

            if (sections.length > 0) {
              // Find the most relevant section based on the user's question
              const relevantSection = findRelevantSection(sections, question.trim());

              // Create enhanced citation
              const enhancedCitation = createEnhancedCitation(
                postSlug,
                postTitle,
                relevantSection,
                relevantSection ? 0.85 : 0.7, // Higher confidence for section matches
                data.content ? data.content.slice(0, 200) + '...' : ''
              );

              enhancedSources = [{
                title: enhancedCitation.title,
                url: enhancedCitation.url,
                section: enhancedCitation.section,
                confidence: enhancedCitation.confidence,
                excerpt: enhancedCitation.excerpt
              }];
            } else {
              // Fallback to basic blog post citation
              enhancedSources = [{
                title: postTitle,
                url: `/blog/${postSlug}`,
                confidence: 0.7,
                excerpt: data.content ? data.content.slice(0, 200) + '...' : ''
              }];
            }
          } catch (error) {
            console.error('Error generating enhanced citations:', error);
          }
        }

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.success ? data.content : data.error || 'Sorry, I couldn\'t generate a response.',
          context: messageContext,
          sources: enhancedSources,
          timestamp: new Date(),
        };
      }

      setState(prev => ({
        ...prev,
        [messageContext === 'portfolio' ? 'portfolioMessages' : 'blogMessages']: [
          ...(messageContext === 'portfolio' ? prev.portfolioMessages : prev.blogMessages),
          assistantMessage
        ],
        loading: false,
      }));

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

      setState(prev => ({
        ...prev,
        [messageContext === 'portfolio' ? 'portfolioMessages' : 'blogMessages']: [
          ...(messageContext === 'portfolio' ? prev.portfolioMessages : prev.blogMessages),
          errorMessage
        ],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [state.loading]);

  const clearMessages = useCallback((context?: 'portfolio' | 'blog') => {
    setState(prev => ({
      ...prev,
      portfolioMessages: context === 'blog' ? prev.portfolioMessages : [],
      blogMessages: context === 'portfolio' ? prev.blogMessages : [],
      error: null,
    }));
  }, []);

  const getMessagesForContext = useCallback((context: 'portfolio' | 'blog'): UnifiedChatMessage[] => {
    return context === 'portfolio' ? state.portfolioMessages : state.blogMessages;
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