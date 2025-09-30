'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

export type ChatContext = 'portfolio' | 'blog-post' | 'blog-search';
export type TabType = 'portfolio' | 'blog';


export interface ContextConfig {
  defaultTab: TabType;
  context: ChatContext;
  postSlug?: string;
  contextChips: string[];
  icon: string;
  title: string;
  welcomeMessage: string;
  capabilityStatement: string;
  exampleQuestions: string[];
  dynamicQuestions?: string[];
}


export function useContextDetection(): ContextConfig {
  const pathname = usePathname();
  const [dynamicQuestions, setDynamicQuestions] = useState<{[slug: string]: string[]}>({});

  // Load dynamic questions for blog posts
  useEffect(() => {
    const loadDynamicQuestions = async () => {
      if (pathname?.startsWith('/blog/')) {
        const postSlug = pathname.split('/blog/')[1];

        // Check if we already have questions for this post
        if (dynamicQuestions[postSlug]) {
          return;
        }

        try {
          const response = await fetch(`/api/blog-content/${postSlug}`);
          if (response.ok) {
            const data = await response.json();

            // Generate AI questions for this specific post
            if (data.content) {
              try {
                const questionsResponse = await fetch('/api/ai-generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    content: data.content,
                    type: 'questions',
                    slug: postSlug
                  }),
                });

                if (questionsResponse.ok) {
                  const questionsData = await questionsResponse.json();
                  if (questionsData.success) {
                    const cleanedContent = questionsData.content
                      .replace(/^```json\s*/i, '')
                      .replace(/\s*```$/, '')
                      .trim();
                    const questions = JSON.parse(cleanedContent);
                    if (Array.isArray(questions) && questions.length > 0) {
                      // Add 3-second delay to prevent rate limit issues
                      const currentSlug = postSlug;
                      setTimeout(() => {
                        setDynamicQuestions(prev => ({
                          ...prev,
                          [currentSlug]: questions
                        }));
                      }, 3000);
                    }
                  }
                }
              } catch (questionsError) {
                console.error('Error generating dynamic questions:', questionsError);
              }
            }
          }
        } catch (error) {
          console.error('Error loading dynamic questions:', error);
        }
      }
    };

    loadDynamicQuestions();
  }, [pathname, dynamicQuestions]);

  return useMemo(() => {
    // Homepage - Portfolio focus
    if (pathname === '/') {
      const context: ChatContext = 'portfolio';
      return {
        defaultTab: 'portfolio',
        context,
        contextChips: [],
        icon: '🚀',
        title: 'Ask about Austin',
        welcomeMessage: 'Ask about Austin\'s background, skills, and experience',
        capabilityStatement: 'I answer using my résumé, projects, and case studies. I don\'t give personal finance or legal advice.',
        exampleQuestions: [
          'What\'s your experience with finance?',
          'Tell me about your fintech background',
          'Show me a complex integration you\'ve led'
        ],
        dynamicQuestions: [
          'What makes Austin uniquely qualified for fintech roles?',
          'How do we stay current with emerging technologies?',
          'What\'s Austin\'s leadership philosophy?'
        ]
      };
    }

    // Blog index - Search focus
    if (pathname === '/blog') {
      const context: ChatContext = 'blog-search';
      return {
        defaultTab: 'blog',
        context,
        contextChips: ['All posts'],
        icon: '🔍',
        title: 'Search all blog posts',
        welcomeMessage: 'Search across all of Austin\'s blog insights',
        capabilityStatement: 'I search and summarize across all blog posts. I cite the specific posts I reference.',
        exampleQuestions: [
          'What key insights on AI do we have?',
          'Find posts about payment optimization',
          'How do we approach fintech innovation?'
        ],
        dynamicQuestions: [
          'What patterns emerge across Austin\'s content?',
          'How has Austin\'s thinking evolved over time?',
          'What are Austin\'s contrarian views in the industry?'
        ]
      };
    }

    // Individual blog post - Post focus
    if (pathname?.startsWith('/blog/')) {
      const postSlug = pathname.split('/blog/')[1];
      const context: ChatContext = 'blog-post';

      // Always include the first 2 default questions, then append AI-generated ones
      const aiQuestions = dynamicQuestions[postSlug] || [];
      const questionsForPost = [
        'Summarize this post in 5 bullets',
        'What are the key takeaways?',
        ...aiQuestions
      ];

      return {
        defaultTab: 'blog',
        context,
        postSlug,
        contextChips: ['This post', 'All posts'],
        icon: '📝',
        title: 'Ask about this post',
        welcomeMessage: 'Get insights about this post + Austin\'s expertise',
        capabilityStatement: 'I summarize and answer questions about this post. I cite sections I used.',
        exampleQuestions: [
          'Summarize this post in 5 bullets',
          'What are the key takeaways?'
        ],
        dynamicQuestions: questionsForPost
      };
    }

    // Default to portfolio
    const defaultContext: ChatContext = 'portfolio';
    return {
      defaultTab: 'portfolio',
      context: defaultContext,
      contextChips: [],
      icon: '🤖',
      title: 'Austin\'s AI Assistant',
      welcomeMessage: 'Ask about Austin\'s background and expertise',
      capabilityStatement: 'I answer using my résumé, projects, and case studies. I don\'t give personal finance or legal advice.',
      exampleQuestions: [
        'What\'s your experience with AI?',
        'Tell me about your recent projects',
        'What are your core skills?'
      ],
      dynamicQuestions: [
        'What makes Austin uniquely qualified for fintech roles?',
        'How do we stay current with emerging technologies?',
        'What\'s Austin\'s leadership philosophy?'
      ]
    };
  }, [pathname, dynamicQuestions]);
}