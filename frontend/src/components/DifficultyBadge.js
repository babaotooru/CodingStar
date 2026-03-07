import React from 'react';

const difficultyColors = {
  EASY: 'text-green-400 bg-green-400/10 border-green-400/20',
  MEDIUM: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  HARD: 'text-red-400 bg-red-400/10 border-red-400/20',
};

function DifficultyBadge({ difficulty }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${difficultyColors[difficulty] || 'text-dark-300'}`}>
      {difficulty}
    </span>
  );
}

export default DifficultyBadge;
