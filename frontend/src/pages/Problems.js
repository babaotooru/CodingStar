import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function Problems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [difficulty, setDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (searchQuery) {
        response = await problemsAPI.search(searchQuery, page, 20);
      } else if (difficulty !== 'ALL') {
        response = await problemsAPI.getByDifficulty(difficulty, page, 20);
      } else {
        response = await problemsAPI.getAll(page, 20);
      }
      setProblems(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setLoading(false);
    }
  }, [page, difficulty, searchQuery]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProblems();
  };

  if (loading) return <LoadingSpinner text="Loading problems..." />;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Problems</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700"
            >
              Search
            </button>
          </form>

          {/* Difficulty Filter */}
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(0); }}
            className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">#</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Title</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Difficulty</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300 hidden md:table-cell">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300 hidden md:table-cell">Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, idx) => (
              <tr key={problem.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                <td className="px-6 py-4 text-dark-400">{page * 20 + idx + 1}</td>
                <td className="px-6 py-4">
                  <Link
                    to={`/problems/${problem.id}`}
                    className="text-white hover:text-primary-400 transition-colors font-medium"
                  >
                    {problem.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>
                <td className="px-6 py-4 text-dark-400 hidden md:table-cell">{problem.category}</td>
                <td className="px-6 py-4 text-dark-400 hidden md:table-cell">
                  {problem.acceptanceRate > 0 ? `${problem.acceptanceRate}%` : 'N/A'}
                </td>
              </tr>
            ))}
            {problems.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-dark-400">
                  No problems found
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

export default Problems;
