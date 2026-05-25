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
  const [totalElements, setTotalElements] = useState(0);
  const [difficulty, setDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpPage, setJumpPage] = useState('');
  const [shuffled, setShuffled] = useState(false);

  const asArray = (value) => (Array.isArray(value) ? value : []);

  const formatCount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toLocaleString() : '0';
  };

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (searchQuery) {
        response = await problemsAPI.search(searchQuery, page, 50);
      } else if (difficulty !== 'ALL') {
        response = await problemsAPI.getByDifficulty(difficulty, page, 50);
      } else {
        response = await problemsAPI.getAll(page, 50);
      }
      setProblems(asArray(response.data?.content));
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
      setShuffled(false);
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

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (p >= 1 && p <= totalPages) {
      setPage(p - 1);
    }
    setJumpPage('');
  };

  const handleShuffle = () => {
    const shuffledProblems = [...problems].sort(() => Math.random() - 0.5);
    setProblems(shuffledProblems);
    setShuffled(true);
  };

  const difficultyColor = (d) => {
    if (d === 'EASY') return 'text-green-400';
    if (d === 'MEDIUM') return 'text-yellow-400';
    return 'text-red-400';
  };

  const difficultyTabs = [
    { value: 'ALL', label: 'All Problems' },
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
  ];

  if (loading && problems.length === 0) return <LoadingSpinner text="Loading problems..." />;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Problem Set</h1>
            <p className="text-dark-400 text-sm mt-1">{formatCount(totalElements)} problems available</p>
          </div>
          <button
            onClick={handleShuffle}
            className={`p-2.5 rounded-xl border transition-all ${
              shuffled
                ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
                : 'bg-dark-800/60 border-dark-700 text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
            title="Shuffle problems"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800/80 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 placeholder-dark-500 transition-all"
          />
        </form>
      </div>

      {/* Difficulty Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {difficultyTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setDifficulty(tab.value); setPage(0); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              difficulty === tab.value
                ? 'bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/30'
                : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-2">
        {problems.map((problem, idx) => (
          <Link
            key={problem.id}
            to={`/problems/${problem.id}`}
            className="block bg-dark-800/40 rounded-xl border border-dark-700/50 p-4 hover:bg-dark-800/70 hover:border-dark-600 transition-all active:scale-[0.98]"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-dark-500 text-xs font-mono">{page * 50 + idx + 1}.</span>
                  <h3 className="text-white font-medium text-sm truncate">{problem.title}</h3>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.category && <span className="text-dark-500 text-xs">{problem.category}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-dark-400 text-xs">{problem.acceptanceRate > 0 ? `${problem.acceptanceRate}%` : '—'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl overflow-hidden border border-dark-700/50">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-800/50">
              <th className="pl-5 pr-2 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-12">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-28">Difficulty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-36">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider w-28">Acceptance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/50">
            {problems.map((problem, idx) => (
              <tr
                key={problem.id}
                className={`group hover:bg-dark-800/40 transition-colors ${idx % 2 === 0 ? 'bg-dark-900/30' : 'bg-dark-900/10'}`}
              >
                <td className="pl-5 pr-2 py-3.5">
                  <span className="text-dark-600 text-xs font-mono">{page * 50 + idx + 1}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    to={`/problems/${problem.id}`}
                    className="text-white group-hover:text-primary-400 transition-colors font-medium text-sm"
                  >
                    {problem.title}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-sm font-medium ${difficultyColor(problem.difficulty)}`}>
                    {problem.difficulty.charAt(0) + problem.difficulty.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-dark-400 text-sm">{problem.category || '—'}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {problem.acceptanceRate > 0 ? (
                      <>
                        <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${problem.acceptanceRate >= 60 ? 'bg-green-500' : problem.acceptanceRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(problem.acceptanceRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-dark-400 text-sm tabular-nums">{problem.acceptanceRate}%</span>
                      </>
                    ) : (
                      <span className="text-dark-600 text-sm">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {problems.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center">
                  <div className="text-dark-500 text-lg mb-2">No problems found</div>
                  <p className="text-dark-600 text-sm">Try a different search or filter</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-1">
          <span className="text-dark-500 text-sm">
            Showing {page * 50 + 1}-{Math.min((page + 1) * 50, totalElements)} of {formatCount(totalElements)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-sm"
              title="First"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Page numbers */}
            {(() => {
              const pages = [];
              const range = 2;
              let start = Math.max(0, page - range);
              let end = Math.min(totalPages - 1, page + range);
              if (start > 0) { pages.push(0); if (start > 1) pages.push('...'); }
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages - 1) { if (end < totalPages - 2) pages.push('...'); pages.push(totalPages - 1); }
              return pages.map((p, i) => p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-dark-600">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    page === p ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  {p + 1}
                </button>
              ));
            })()}

            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-sm"
              title="Last"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>

            <div className="ml-2 border-l border-dark-700 pl-2">
              <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  placeholder={`${page + 1}`}
                  className="w-14 px-2 py-1.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/50 placeholder-dark-600"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 text-dark-400 hover:text-white text-xs rounded-lg hover:bg-dark-800 transition-all"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Problems;
