'use client';

import React from 'react';

export interface QuestionData {
  text: string;
  key: string;
  loading?: boolean;
}

interface ChatQuestionsProps {
  questions: QuestionData[];
  onQuestionClick: (question: string, key: string) => void;
  disabled?: boolean;
  className?: string;
}

const ChatQuestions: React.FC<ChatQuestionsProps> = ({
  questions,
  onQuestionClick,
  disabled = false,
  className = ''
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, question: QuestionData) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && !question.loading) {
        onQuestionClick(question.text, question.key);
      }
    }
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <div
      className={`chat-questions ${className}`}
      role="group"
      aria-label="Suggested questions"
    >
      {questions.map((question, index) => (
        <button
          key={question.key || index}
          onClick={() => onQuestionClick(question.text, question.key)}
          onKeyDown={(e) => handleKeyDown(e, question)}
          className="preset-button"
          disabled={disabled || question.loading}
          tabIndex={disabled ? -1 : 0}
          aria-describedby={question.loading ? `loading-${question.key || index}` : undefined}
          aria-busy={question.loading}
          type="button"
        >
          {question.loading ? (
            <span>
              <span
                className="chat-spinner"
                role="status"
                aria-hidden="true"
              ></span>
              <span id={`loading-${question.key || index}`}>
                Loading question response...
              </span>
            </span>
          ) : (
            <span>{question.text}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ChatQuestions;