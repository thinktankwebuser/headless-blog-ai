'use client';

import { memo } from 'react';

interface ContextChipsProps {
  chips: string[];
  activeChip: string;
  onChipClick: (chip: string) => void;
  disabled?: boolean;
}

function ContextChips({
  chips,
  activeChip,
  onChipClick,
  disabled = false
}: ContextChipsProps) {
  if (!chips || chips.length === 0) {
    return null;
  }

  return (
    <div className="context-chips" role="group" aria-label="Blog content scope selection">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onChipClick(chip)}
          disabled={disabled}
          className={`context-chip ${chip === activeChip ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          aria-pressed={chip === activeChip}
          aria-describedby="context-chips-help"
          type="button"
        >
          {chip}
        </button>
      ))}
      <div id="context-chips-help" className="sr-only">
        Choose whether to search this specific blog post or all blog posts
      </div>
    </div>
  );
}

export default memo(ContextChips);