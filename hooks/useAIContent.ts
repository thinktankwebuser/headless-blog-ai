'use client';

import { useState } from 'react';

type AIContentType = 'overview' | 'takeaways';

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
  generateContent: (type: AIContentType) => Promise<void>;
  clearError: (type: AIContentType) => void;
}

export function useAIContent(postContent: string, postSlug?: string): UseAIContentReturn {
  const [aiContent, setAiContent] = useState<AIContentState>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [errors, setErrors] = useState<ErrorState>({});

  const generateContent = async (type: AIContentType) => {
    // If we already have content for this type, don't regenerate
    if (aiContent[type]) {
      return;
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: '' }));

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent,
          type: type,
          slug: postSlug || 'unknown'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success) {
        setAiContent(prev => ({ ...prev, [type]: data.content }));
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

      setErrors(prev => ({ ...prev, [type]: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const clearError = (type: AIContentType) => {
    setErrors(prev => ({ ...prev, [type]: '' }));
  };

  return {
    aiContent,
    loading,
    errors,
    generateContent,
    clearError,
  };
}