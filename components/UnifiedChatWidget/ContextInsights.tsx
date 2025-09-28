'use client';

import { memo } from 'react';
import { ContextInsight } from '@/hooks/useContextDetection';

interface ContextInsightsProps {
  insights: ContextInsight;
  relatedTopics?: string[];
  className?: string;
}

function ContextInsights({
  insights,
  relatedTopics = [],
  className = ''
}: ContextInsightsProps) {
  const hasInsights = insights.readingTime || insights.wordCount || insights.keyTopics?.length || relatedTopics.length;

  if (!hasInsights) {
    return null;
  }

  const getDifficultyIcon = (difficulty?: string): string => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  const getDifficultyLabel = (difficulty?: string): string => {
    switch (difficulty) {
      case 'beginner': return 'Beginner friendly';
      case 'intermediate': return 'Intermediate level';
      case 'advanced': return 'Advanced topic';
      default: return 'Level unknown';
    }
  };

  return (
    <div className={`context-insights ${className}`}>
      <div className="insights-header">
        <h5>📊 Content Insights</h5>
      </div>

      <div className="insights-grid">
        {/* Reading stats */}
        {(insights.readingTime || insights.wordCount) && (
          <div className="insight-section reading-stats">
            <div className="insight-stats">
              {insights.readingTime && (
                <div className="stat-item">
                  <span className="stat-icon" aria-hidden="true">⏱️</span>
                  <span className="stat-value">{insights.readingTime} min</span>
                  <span className="stat-label">read</span>
                </div>
              )}
              {insights.wordCount && (
                <div className="stat-item">
                  <span className="stat-icon" aria-hidden="true">📝</span>
                  <span className="stat-value">{insights.wordCount.toLocaleString()}</span>
                  <span className="stat-label">words</span>
                </div>
              )}
              {insights.difficulty && (
                <div className="stat-item difficulty">
                  <span className="stat-icon" aria-hidden="true">
                    {getDifficultyIcon(insights.difficulty)}
                  </span>
                  <span className="stat-label">{getDifficultyLabel(insights.difficulty)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key topics */}
        {insights.keyTopics && insights.keyTopics.length > 0 && (
          <div className="insight-section key-topics">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true">🏷️</span>
              <span className="section-title">Key Topics</span>
            </div>
            <div className="topic-tags">
              {insights.keyTopics.slice(0, 5).map((topic, index) => (
                <span key={index} className="topic-tag">
                  {topic}
                </span>
              ))}
              {insights.keyTopics.length > 5 && (
                <span className="topic-tag more-topics">
                  +{insights.keyTopics.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Related topics */}
        {relatedTopics.length > 0 && (
          <div className="insight-section related-topics">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true">🔗</span>
              <span className="section-title">Related Topics</span>
            </div>
            <div className="topic-tags">
              {relatedTopics.slice(0, 6).map((topic, index) => (
                <span key={index} className="topic-tag related">
                  {topic}
                </span>
              ))}
              {relatedTopics.length > 6 && (
                <span className="topic-tag more-topics">
                  +{relatedTopics.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Related content */}
        {insights.relatedContent && insights.relatedContent.length > 0 && (
          <div className="insight-section related-content">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true">📚</span>
              <span className="section-title">Related Content</span>
            </div>
            <div className="related-links">
              {insights.relatedContent.slice(0, 3).map((content, index) => (
                <a
                  key={index}
                  href={content}
                  className="related-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content.split('/').pop()?.replace(/\.(md|html)$/, '')}
                  <span className="external-icon" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="insights-footer">
        <small>
          🤖 Insights generated from content analysis
        </small>
      </div>
    </div>
  );
}

export default memo(ContextInsights);