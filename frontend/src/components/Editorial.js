import React, { useState } from 'react';

function Editorial({ problem }) {
  const [showHints, setShowHints] = useState([]);
  
  const hints = problem.hints ? problem.hints.split('\n').filter(h => h.trim()) : [];
  const topics = problem.topics ? problem.topics.split(',').map(t => t.trim()) : [];
  const companies = problem.companies ? problem.companies.split(',').map(c => c.trim()) : [];

  const toggleHint = (index) => {
    if (showHints.includes(index)) {
      setShowHints(showHints.filter(i => i !== index));
    } else {
      setShowHints([...showHints, index]);
    }
  };

  const hasEditorialContent = problem.intuition || problem.approach || problem.algorithm || problem.syntaxNotes || hints.length > 0;

  if (!hasEditorialContent && topics.length === 0 && companies.length === 0) {
    return (
      <div className="space-y-4 text-sm">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-yellow-300">
              <p className="font-medium mb-1">Editorial Coming Soon</p>
              <p className="text-yellow-400/80 text-xs">This problem doesn't have editorial content yet. Try solving it on your own and document your approach in the "My Notes" tab!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Topics & Companies */}
      {(topics.length > 0 || companies.length > 0) && (
        <div className="space-y-3">
          {topics.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium border border-primary-500/20">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {companies.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Asked By Companies
              </h3>
              <div className="flex flex-wrap gap-2">
                {companies.map((company, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium border border-blue-500/20">
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hints */}
      {hints.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Hints
          </h3>
          <div className="space-y-2">
            {hints.map((hint, idx) => (
              <div key={idx} className="border border-dark-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleHint(idx)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-dark-800 hover:bg-dark-750 text-left transition-colors"
                >
                  <span className="text-dark-300 font-medium">Hint {idx + 1}</span>
                  <svg
                    className={`w-4 h-4 text-dark-400 transition-transform ${showHints.includes(idx) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showHints.includes(idx) && (
                  <div className="px-4 py-3 bg-dark-850 text-dark-300 border-t border-dark-700">
                    {hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intuition */}
      {problem.intuition && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Intuition
          </h3>
          <div className="bg-dark-800 rounded-lg p-4 text-dark-300 whitespace-pre-wrap border border-dark-700">
            {problem.intuition}
          </div>
        </div>
      )}

      {/* Approach */}
      {problem.approach && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Approach
          </h3>
          <div className="bg-dark-800 rounded-lg p-4 text-dark-300 whitespace-pre-wrap border border-dark-700">
            {problem.approach}
          </div>
        </div>
      )}

      {/* Algorithm */}
      {problem.algorithm && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Algorithm
          </h3>
          <div className="bg-dark-800 rounded-lg p-4 text-dark-300 whitespace-pre-wrap border border-dark-700 font-mono text-xs">
            {problem.algorithm}
          </div>
        </div>
      )}

      {/* Syntax Notes */}
      {problem.syntaxNotes && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Syntax Notes
          </h3>
          <div className="bg-dark-800 rounded-lg p-4 text-dark-300 whitespace-pre-wrap border border-dark-700">
            {problem.syntaxNotes}
          </div>
        </div>
      )}
    </div>
  );
}

export default Editorial;
