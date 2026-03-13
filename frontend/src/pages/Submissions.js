import React, { useState, useEffect } from 'react';
import { submissionsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = viewMode === 'my'
          ? await submissionsAPI.getMy(page, 20)
          : await submissionsAPI.getAll(page, 20);
        setSubmissions(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [page, viewMode]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) return <LoadingSpinner text="Loading submissions..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {viewMode === 'my' ? 'My Submissions' : 'All Submissions'}
        </h1>
        <div className="flex bg-dark-800 rounded-lg p-1">
          <button
            onClick={() => { setViewMode('my'); setPage(0); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'my' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            My Submissions
          </button>
          <button
            onClick={() => { setViewMode('all'); setPage(0); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'all' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            All Submissions
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer active:bg-dark-800"
              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{sub.problemTitle}</h3>
                  {viewMode === 'all' && sub.username && (
                    <span className="text-primary-400 text-xs font-medium">by {sub.username}</span>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={sub.status} />
                    <span className="text-dark-400 text-xs">({sub.testCasesPassed}/{sub.totalTestCases})</span>
                  </div>
                  {sub.status === 'ACCEPTED' && (sub.scoreEarned > 0 || sub.starsEarned > 0) && (
                    <div className="flex items-center gap-2 mt-1">
                      {sub.scoreEarned > 0 && <span className="text-yellow-400 text-xs font-medium">+{sub.scoreEarned} pts</span>}
                      {sub.starsEarned > 0 && <span className="text-yellow-300 text-xs">{'⭐'.repeat(sub.starsEarned)}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-dark-400 text-xs">{sub.language}</span>
                  <div className="text-dark-500 text-xs mt-1">{formatDate(sub.submittedAt)}</div>
                </div>
              </div>
            </div>
            {expandedId === sub.id && (
              <div className="px-4 pb-4 border-t border-dark-700">
                <div className="bg-dark-800 rounded-lg p-3 mt-3">
                  <h4 className="text-xs font-semibold text-dark-300 mb-2">Code:</h4>
                  <pre className="text-dark-200 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                    {sub.code}
                  </pre>
                  {sub.errorMessage && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-red-400 mb-1">Error:</h4>
                      <pre className="text-red-300 font-mono text-xs overflow-x-auto">{sub.errorMessage}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="text-center text-dark-400 py-12">
            No submissions yet. Start solving problems!
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Problem</th>
              {viewMode === 'all' && <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">User</th>}
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Language</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Score</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <React.Fragment key={sub.id}>
                <tr
                  className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                >
                  <td className="px-6 py-4 text-white font-medium">{sub.problemTitle}</td>
                  {viewMode === 'all' && <td className="px-6 py-4 text-primary-400 font-medium">{sub.username}</td>}
                  <td className="px-6 py-4 text-dark-300">{sub.language}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} />
                    <span className="text-dark-400 text-xs ml-2">
                      ({sub.testCasesPassed}/{sub.totalTestCases})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sub.scoreEarned > 0 ? (
                      <span className="text-yellow-400 font-medium">+{sub.scoreEarned} pts {'⭐'.repeat(sub.starsEarned)}</span>
                    ) : (
                      <span className="text-dark-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-dark-400">
                    {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 text-dark-400 text-sm">
                    {formatDate(sub.submittedAt)}
                  </td>
                </tr>
                {expandedId === sub.id && (
                  <tr className="border-b border-dark-800">
                    <td colSpan={viewMode === 'all' ? 7 : 6} className="px-6 py-4">
                      <div className="bg-dark-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-dark-300 mb-2">Code:</h4>
                        <pre className="text-dark-200 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                          {sub.code}
                        </pre>
                        {sub.errorMessage && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-red-400 mb-1">Error:</h4>
                            <pre className="text-red-300 font-mono text-xs">{sub.errorMessage}</pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={viewMode === 'all' ? 7 : 6} className="px-6 py-12 text-center text-dark-400">
                  No submissions yet. Start solving problems!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-dark-800 text-white rounded-lg disabled:opacity-30 hover:bg-dark-700 transition-colors text-sm"
          >
            ← Prev
          </button>
          <span className="px-3 py-2 text-dark-400 text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-dark-800 text-white rounded-lg disabled:opacity-30 hover:bg-dark-700 transition-colors text-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Submissions;
