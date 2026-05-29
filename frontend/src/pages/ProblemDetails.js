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

  const sampleTestcase = Array.isArray(problem.testcases)
    ? problem.testcases.find((testcase) => testcase?.isSample)
    : null;
  const sampleInput = problem.sampleInput || problem.sample_input || sampleTestcase?.input || '';
  const sampleOutput = problem.sampleOutput || problem.sample_output || sampleTestcase?.output || '';
  const sampleExplanation = problem.sampleExplanation || problem.sample_explanation || sampleTestcase?.explanation || '';
  const problemCode = problem.problemCode || (problem.id != null ? `P${String(problem.id).padStart(5, '0')}` : '');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <div className="text-primary-400 text-sm font-mono mb-2">{problemCode}</div>
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

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 text-sm">
          {problem.level && (
            <div className="bg-dark-800/70 border border-dark-700 rounded-lg p-3">
              <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Level</div>
              <div className="text-white">{problem.level}</div>
            </div>
          )}
          {problem.platform && (
            <div className="bg-dark-800/70 border border-dark-700 rounded-lg p-3">
              <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Platform</div>
              <div className="text-white">{problem.platform}</div>
            </div>
          )}
          {problem.kind && (
            <div className="bg-dark-800/70 border border-dark-700 rounded-lg p-3">
              <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Kind</div>
              <div className="text-white">{problem.kind}</div>
            </div>
          )}
          {problem.family && (
            <div className="bg-dark-800/70 border border-dark-700 rounded-lg p-3">
              <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Family</div>
              <div className="text-white">{problem.family}</div>
            </div>
          )}
          {problem.updatedAt && (
            <div className="bg-dark-800/70 border border-dark-700 rounded-lg p-3">
              <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Updated</div>
              <div className="text-white">{new Date(problem.updatedAt).toLocaleString()}</div>
            </div>
          )}
          {sampleExplanation && (
            <div className="bg-dark-800/70 border border-dark-700 rounded-lg p-3 sm:col-span-2 lg:col-span-3">
              <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Sample Explanation</div>
              <div className="text-dark-300 whitespace-pre-wrap">{sampleExplanation}</div>
            </div>
          )}
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

          {sampleInput && (
            <div className="border border-blue-500/30 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-blue-900/30 px-4 py-2.5">
                <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                  <span>📥</span> Sample Input
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(sampleInput)}
                  className="text-blue-400 hover:text-blue-200 text-xs flex items-center gap-1 transition-colors"
                >📋 Copy</button>
              </div>
              <pre className="bg-dark-800 p-4 text-green-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">{sampleInput}</pre>
            </div>
          )}

          {sampleOutput && (
            <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-emerald-900/30 px-4 py-2.5">
                <h2 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                  <span>📤</span> Sample Output
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(sampleOutput)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs flex items-center gap-1 transition-colors"
                >📋 Copy</button>
              </div>
              <pre className="bg-dark-800 p-4 text-yellow-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">{sampleOutput}</pre>
            </div>
          )}

          {Array.isArray(problem.testcases) && problem.testcases.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Test Cases</h2>
              <div className="space-y-3">
                {problem.testcases.map((testcase, index) => (
                  <div key={testcase.id || index} className="bg-dark-800/60 border border-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-medium">Test Case {index + 1}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${testcase.isSample ? 'bg-blue-500/20 text-blue-300' : 'bg-dark-700 text-dark-300'}`}>
                        {testcase.isSample ? 'Sample' : 'Hidden'}
                      </div>
                    </div>
                    {testcase.explanation && (
                      <div className="text-dark-400 text-sm mb-3 whitespace-pre-wrap">{testcase.explanation}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Input</div>
                        <pre className="bg-dark-900 rounded-lg p-3 text-green-300 text-sm whitespace-pre-wrap overflow-x-auto">{testcase.input}</pre>
                      </div>
                      <div>
                        <div className="text-dark-500 text-xs uppercase tracking-wide mb-1">Output</div>
                        <pre className="bg-dark-900 rounded-lg p-3 text-yellow-300 text-sm whitespace-pre-wrap overflow-x-auto">{testcase.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemDetails;
