import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function ProblemDetails() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await problemsAPI.getById(id);
        setProblem(response.data);
      } catch (err) {
        console.error('Failed to fetch problem:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading problem..." />;
  if (!problem) return <div className="text-center text-dark-400 py-12">Problem not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{problem.title}</h1>
            <div className="flex items-center gap-3">
              <DifficultyBadge difficulty={problem.difficulty} />
              <span className="text-dark-400">{problem.category}</span>
            </div>
          </div>
          <Link
            to={`/solve/${problem.id}`}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Solve Problem
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-8 text-sm">
          <div className="text-dark-400">
            Submissions: <span className="text-white">{problem.totalSubmissions}</span>
          </div>
          <div className="text-dark-400">
            Acceptance: <span className="text-white">{problem.acceptanceRate > 0 ? `${problem.acceptanceRate}%` : 'N/A'}</span>
          </div>
          <div className="text-dark-400">
            Time Limit: <span className="text-white">{problem.timeLimitMs}ms</span>
          </div>
          <div className="text-dark-400">
            Memory: <span className="text-white">{problem.memoryLimitMb}MB</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
            <div className="text-dark-300 whitespace-pre-wrap leading-relaxed">{problem.description}</div>
          </div>

          {problem.inputFormat && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Input Format</h2>
              <div className="text-dark-300 whitespace-pre-wrap">{problem.inputFormat}</div>
            </div>
          )}

          {problem.outputFormat && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Output Format</h2>
              <div className="text-dark-300 whitespace-pre-wrap">{problem.outputFormat}</div>
            </div>
          )}

          {problem.constraints && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Constraints</h2>
              <div className="text-dark-300 whitespace-pre-wrap font-mono text-sm bg-dark-800 rounded-lg p-4">{problem.constraints}</div>
            </div>
          )}

          {problem.sampleInput && (
            <div className="border border-blue-500/30 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-blue-900/30 px-4 py-2.5">
                <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                  <span>📥</span> Sample Input
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(problem.sampleInput)}
                  className="text-blue-400 hover:text-blue-200 text-xs flex items-center gap-1 transition-colors"
                >📋 Copy</button>
              </div>
              <pre className="bg-dark-800 p-4 text-green-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">{problem.sampleInput}</pre>
            </div>
          )}

          {problem.sampleOutput && (
            <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-emerald-900/30 px-4 py-2.5">
                <h2 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                  <span>📤</span> Sample Output
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(problem.sampleOutput)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs flex items-center gap-1 transition-colors"
                >📋 Copy</button>
              </div>
              <pre className="bg-dark-800 p-4 text-yellow-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">{problem.sampleOutput}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemDetails;
