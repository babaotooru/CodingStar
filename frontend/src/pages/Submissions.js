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

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await submissionsAPI.getMy(page, 20);
        setSubmissions(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [page]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) return <LoadingSpinner text="Loading submissions..." />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">My Submissions</h1>

      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Problem</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Language</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300 hidden md:table-cell">Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300 hidden md:table-cell">Submitted</th>
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
                  <td className="px-6 py-4 text-dark-300">{sub.language}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} />
                    <span className="text-dark-400 text-xs ml-2">
                      ({sub.testCasesPassed}/{sub.totalTestCases})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-dark-400 hidden md:table-cell">
                    {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 text-dark-400 text-sm hidden md:table-cell">
                    {formatDate(sub.submittedAt)}
                  </td>
                </tr>
                {expandedId === sub.id && (
                  <tr className="border-b border-dark-800">
                    <td colSpan="5" className="px-6 py-4">
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
                <td colSpan="5" className="px-6 py-12 text-center text-dark-400">
                  No submissions yet. Start solving problems!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-dark-800 text-white rounded-lg disabled:opacity-50 hover:bg-dark-700"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-dark-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-dark-800 text-white rounded-lg disabled:opacity-50 hover:bg-dark-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Submissions;
