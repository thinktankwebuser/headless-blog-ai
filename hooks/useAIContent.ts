'use client';

import { useState } from 'react';

type AIContentType = 'overview' | 'takeaways' | 'questions' | 'custom_question';

interface AIContentState {
  [key: string]: string;
}

interface LoadingState {
  [key: string]: boolean;
}

interface ErrorState {
  [key: string]: string;
}

interface UseAIContentReturn {
  aiContent: AIContentState;
  loading: LoadingState;
  errors: ErrorState;
  generateContent: (type: AIContentType, options?: { question?: string }) => Promise<void>;
  clearError: (type: AIContentType, options?: { question?: string }) => void;
}

/**
 * Custom hook for managing AI-generated content for blog posts
 * @param postContent - The raw content of the blog post
 * @param postSlug - Optional slug for caching purposes
 * @returns Object containing AI content state, loading states, errors, and methods to generate/clear content
 */
export function useAIContent(postContent: string, postSlug?: string): UseAIContentReturn {
  const [aiContent, setAiContent] = useState<AIContentState>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [errors, setErrors] = useState<ErrorState>({});

  const generateContent = async (type: AIContentType, options?: { question?: string }) => {
    // For custom questions, use a unique key that includes the question
    const cacheKey = type === 'custom_question' && options?.question
      ? `${type}:${options.question}`
      : type;

    // If we already have content for this type/question, don't regenerate
    if (aiContent[cacheKey]) {
      return;
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: '' }));

    try {
      const requestBody: any = {
        content: postContent,
        type: type,
        slug: postSlug || 'unknown'
      };

      // Add question for custom_question type
      if (type === 'custom_question' && options?.question) {
        requestBody.question = options.question;
      }

      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success) {
        setAiContent(prev => ({ ...prev, [cacheKey]: data.content }));
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error(`Error generating ${type} content:`, error);

      let errorMessage = 'Failed to generate content';

      if (error instanceof Error) {
        if (error.message.includes('Rate limited')) {
          errorMessage = 'Please wait a moment before trying again';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection';
        } else {
          errorMessage = error.message;
        }
      }

      setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  const clearError = (type: AIContentType, options?: { question?: string }) => {
    // Use same cache key logic as generateContent for consistency
    const cacheKey = type === 'custom_question' && options?.question
      ? `${type}:${options.question}`
      : type;

    setErrors(prev => ({ ...prev, [cacheKey]: '' }));
  };

  return {
    aiContent,
    loading,
    errors,
    generateContent,
    clearError,
  };
}