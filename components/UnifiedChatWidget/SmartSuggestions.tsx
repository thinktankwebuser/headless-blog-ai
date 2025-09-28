'use client';

import { memo } from 'react';
import { SmartSuggestion } from '@/hooks/useContextDetection';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  onSuggestionClick: (question: string) => void;
  disabled?: boolean;
  className?: string;
}

function SmartSuggestions({
  suggestions,
  onSuggestionClick,
  disabled = false,
  className = ''
}: SmartSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getTypeIcon = (type: SmartSuggestion['type']): string => {
    switch (type) {
      case 'follow-up': return '💬';
      case 'related': return '🔗';
      case 'deep-dive': return '🔍';
      case 'comparison': return '⚖️';
      default: return '💡';
    }
  };

  const getTypeLabel = (type: SmartSuggestion['type']): string => {
    switch (type) {
      case 'follow-up': return 'Follow-up';
      case 'related': return 'Related';
      case 'deep-dive': return 'Deep dive';
      case 'comparison': return 'Compare';
      default: return 'Suggestion';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'confidence-high';
    if (confidence >= 0.8) return 'confidence-medium';
    return 'confidence-low';
  };

  // Group suggestions by category for better organization
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const category = suggestion.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(suggestion);
    return groups;
  }, {} as Record<string, SmartSuggestion[]>);

  return (
    <div className={`smart-suggestions ${className}`}>
      <div className="smart-suggestions-header">
        <h5>🧠 Smart Suggestions</h5>
        <p className="suggestions-subtitle">AI-powered questions tailored to your context</p>
      </div>

      <div className="suggestions-grid">
        {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
          <div key={category} className="suggestion-category">
            {Object.keys(groupedSuggestions).length > 1 && (
              <div className="category-label">
                <span className="category-name">{category}</span>
              </div>
            )}

            <div className="category-suggestions">
              {categorySuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className={`smart-suggestion-card ${getConfidenceColor(suggestion.confidence)}`}
                  onClick={() => onSuggestionClick(suggestion.question)}
                  disabled={disabled}
                  type="button"
                  aria-describedby={`suggestion-help-${category}-${index}`}
                >
                  <div className="suggestion-header">
                    <span className="suggestion-type-icon" aria-hidden="true">
                      {getTypeIcon(suggestion.type)}
                    </span>
                    <span className="suggestion-type-label">
                      {getTypeLabel(suggestion.type)}
                    </span>
                    <div className="suggestion-confidence">
                      <div
                        className="confidence-bar"
                        style={{ width: `${suggestion.confidence * 100}%` }}
                        aria-label={`${Math.round(suggestion.confidence * 100)}% confidence`}
                      />
                    </div>
                  </div>

                  <div className="suggestion-content">
                    <div className="suggestion-question">
                      {suggestion.question}
                    </div>
                    <div className="suggestion-description">
                      {suggestion.description}
                    </div>
                  </div>

                  <div
                    id={`suggestion-help-${category}-${index}`}
                    className="sr-only"
                  >
                    {getTypeLabel(suggestion.type)} question: {suggestion.question}.
                    {suggestion.description}.
                    Confidence: {Math.round(suggestion.confidence * 100)}%.
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="suggestions-footer">
        <small>
          💡 Suggestions are AI-generated based on your current page and context
        </small>
      </div>
    </div>
  );
}

export default memo(SmartSuggestions);