'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

export type ChatContext = 'portfolio' | 'blog-post' | 'blog-search';
export type TabType = 'portfolio' | 'blog';

// Enhanced Phase 2 interfaces
export interface SmartSuggestion {
  type: 'follow-up' | 'related' | 'deep-dive' | 'comparison';
  question: string;
  description: string;
  confidence: number;
  category?: string;
}

export interface ContextInsight {
  readingTime?: number;
  wordCount?: number;
  keyTopics?: string[];
  relatedContent?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

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
  // Enhanced Phase 2 features
  smartSuggestions?: SmartSuggestion[];
  contextInsights?: ContextInsight;
  dynamicQuestions?: string[];
  relatedTopics?: string[];
}

// Advanced context detection helpers (Phase 2)
function generateSmartSuggestions(context: ChatContext, postSlug?: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  if (context === 'portfolio') {
    suggestions.push(
      {
        type: 'follow-up',
        question: 'What specific technologies have you worked with recently?',
        description: 'Get detailed technical expertise',
        confidence: 0.9,
        category: 'technical'
      },
      {
        type: 'deep-dive',
        question: 'Walk me through a complex problem you solved',
        description: 'Understand problem-solving approach',
        confidence: 0.85,
        category: 'experience'
      },
      {
        type: 'comparison',
        question: 'How do you approach fintech vs other industry challenges?',
        description: 'Industry-specific insights',
        confidence: 0.8,
        category: 'industry'
      }
    );
  } else if (context === 'blog-post') {
    suggestions.push(
      {
        type: 'follow-up',
        question: 'What are the practical steps to implement this?',
        description: 'Actionable implementation guidance',
        confidence: 0.9,
        category: 'implementation'
      },
      {
        type: 'related',
        question: 'What related concepts should I explore?',
        description: 'Discover connected topics',
        confidence: 0.85,
        category: 'exploration'
      },
      {
        type: 'deep-dive',
        question: 'What are the potential challenges with this approach?',
        description: 'Risk assessment and considerations',
        confidence: 0.8,
        category: 'analysis'
      }
    );
  } else if (context === 'blog-search') {
    suggestions.push(
      {
        type: 'comparison',
        question: 'Compare Austin\'s approaches across different topics',
        description: 'Cross-topic analysis',
        confidence: 0.85,
        category: 'comparison'
      },
      {
        type: 'related',
        question: 'What are Austin\'s latest insights on emerging trends?',
        description: 'Current thinking and trends',
        confidence: 0.8,
        category: 'trends'
      }
    );
  }

  return suggestions;
}


function getRelatedTopics(context: ChatContext, postSlug?: string): string[] {
  // Generate related topics based on context
  const topicMap: Record<ChatContext, string[]> = {
    'portfolio': ['fintech', 'ai', 'payments', 'leadership', 'innovation', 'digital transformation'],
    'blog-post': ['implementation', 'best practices', 'case studies', 'frameworks', 'tools'],
    'blog-search': ['trends', 'insights', 'methodologies', 'industry analysis', 'future outlook']
  };

  return topicMap[context] || [];
}

export function useContextDetection(): ContextConfig {
  const pathname = usePathname();
  const [pageInsights, setPageInsights] = useState<ContextInsight>({});
  const [dynamicQuestions, setDynamicQuestions] = useState<{[slug: string]: string[]}>({});

  // Advanced page content analysis (Phase 2)
  useEffect(() => {
    const analyzePageContent = async () => {
      if (pathname?.startsWith('/blog/')) {
        try {
          const postSlug = pathname.split('/blog/')[1];

          // Check if we already have questions for this post
          if (dynamicQuestions[postSlug]) {
            return;
          }

          const response = await fetch(`/api/blog-content/${postSlug}`);
          if (response.ok) {
            const data = await response.json();
            setPageInsights({
              readingTime: data.readingTime,
              wordCount: data.wordCount,
              keyTopics: data.sections?.map((s: any) => s.title).slice(0, 5) || [],
              relatedContent: [],
              difficulty: data.wordCount > 1500 ? 'advanced' : data.wordCount > 800 ? 'intermediate' : 'beginner'
            });

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
                      // Add 3-second delay before rendering questions to prevent rate limit issues
                      // Capture the postSlug in closure to prevent stale references
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
          console.error('Error analyzing page content:', error);
        }
      }
    };

    analyzePageContent();
  }, [pathname]);

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
        // Enhanced Phase 2 features
        smartSuggestions: generateSmartSuggestions(context),
        contextInsights: pageInsights,
        dynamicQuestions: [
          'What makes Austin uniquely qualified for fintech roles?',
          'How do we stay current with emerging technologies?',
          'What\'s Austin\'s leadership philosophy?'
        ],
        relatedTopics: getRelatedTopics(context)
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
        // Enhanced Phase 2 features
        smartSuggestions: generateSmartSuggestions(context),
        contextInsights: pageInsights,
        dynamicQuestions: [
          'What patterns emerge across Austin\'s content?',
          'How has Austin\'s thinking evolved over time?',
          'What are Austin\'s contrarian views in the industry?'
        ],
        relatedTopics: getRelatedTopics(context)
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
        // Enhanced Phase 2 features
        smartSuggestions: generateSmartSuggestions(context, postSlug),
        contextInsights: pageInsights,
        dynamicQuestions: questionsForPost,
        relatedTopics: getRelatedTopics(context, postSlug)
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
      // Enhanced Phase 2 features
      smartSuggestions: generateSmartSuggestions(defaultContext),
      contextInsights: pageInsights,
      dynamicQuestions: [
        'What makes Austin uniquely qualified for fintech roles?',
        'How do westay current with emerging technologies?',
        'What\'s Austin\'s leadership philosophy?'
      ],
      relatedTopics: getRelatedTopics(defaultContext)
    };
  }, [pathname, pageInsights, dynamicQuestions]);
}