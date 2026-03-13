import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const SQL_TOPICS = [
  { key: 'ALL', label: 'All SQL', icon: '🗄️' },
  { key: 'SQL - Basic SELECT', label: 'SELECT', icon: '📄' },
  { key: 'SQL - Filtering', label: 'WHERE', icon: '🔍' },
  { key: 'SQL - Aggregate Functions', label: 'Aggregates', icon: '📊' },
  { key: 'SQL - GROUP BY', label: 'GROUP BY', icon: '📦' },
  { key: 'SQL - HAVING', label: 'HAVING', icon: '🎯' },
  { key: 'SQL - Joins', label: 'Joins', icon: '🔗' },
  { key: 'SQL - Self Join', label: 'Self Join', icon: '🪞' },
  { key: 'SQL - Subqueries', label: 'Subqueries', icon: '📁' },
  { key: 'SQL - Correlated Subqueries', label: 'Correlated', icon: '🔄' },
  { key: 'SQL - Set Operators', label: 'UNION', icon: '➕' },
  { key: 'SQL - Window Functions', label: 'Window', icon: '🪟' },
  { key: 'SQL - CASE Statements', label: 'CASE', icon: '🔀' },
  { key: 'SQL - Date Functions', label: 'Dates', icon: '📅' },
  { key: 'SQL - String Functions', label: 'Strings', icon: '🔤' },
  { key: 'SQL - Data Manipulation', label: 'DML', icon: '✏️' },
  { key: 'SQL - Transactions', label: 'Transactions', icon: '🔒' },
  { key: 'SQL - Indexes & Performance', label: 'Performance', icon: '⚡' },
];

function SQLPractice() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [topicCounts, setTopicCounts] = useState({});

  // Fetch topic counts on mount
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const resp = await problemsAPI.getByCategory('SQL', 0, 1000);
        const all = resp.data.content;
        const counts = {};
        all.forEach(p => {
          counts[p.category] = (counts[p.category] || 0) + 1;
        });
        setTopicCounts(counts);
      } catch (err) {
        console.error('Failed to fetch topic counts:', err);
      }
    };
    fetchCounts();
  }, []);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const prefix = selectedTopic === 'ALL' ? 'SQL' : selectedTopic;
      const diff = difficulty === 'ALL' ? null : difficulty;
      const response = await problemsAPI.getByCategory(prefix, page, 50, diff);
      setProblems(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch SQL problems:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTopic, difficulty]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const difficultyColor = (d) => {
    if (d === 'EASY') return 'text-green-400';
    if (d === 'MEDIUM') return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalSQL = Object.values(topicCounts).reduce((a, b) => a + b, 0);

  if (loading && problems.length === 0) return <LoadingSpinner text="Loading SQL problems..." />;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-xl">🗄️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SQL Practice</h1>
            <p className="text-dark-400 text-sm">{totalSQL} SQL problems across {Object.keys(topicCounts).length} topics</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Topics */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-3 sticky top-20">
            <h3 className="text-dark-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Topics</h3>
            <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {SQL_TOPICS.map((topic) => {
                const count = topic.key === 'ALL' ? totalSQL : (topicCounts[topic.key] || 0);
                return (
                  <button
                    key={topic.key}
                    onClick={() => { setSelectedTopic(topic.key); setPage(0); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedTopic === topic.key
                        ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-sm">{topic.icon}</span>
                      <span className="truncate">{topic.label}</span>
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      selectedTopic === topic.key ? 'bg-blue-500/20 text-blue-300' : 'bg-dark-700 text-dark-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          {/* Difficulty Filter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    difficulty === d
                      ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
                  }`}
                >
                  {d === 'ALL' ? 'All Levels' : d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <span className="text-dark-500 text-sm whitespace-nowrap ml-3">{totalElements} problems</span>
          </div>

          {/* Problems Table */}
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-2">
            {problems.map((problem, idx) => (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className="block bg-dark-800/40 rounded-xl border border-dark-700/50 p-4 hover:bg-dark-800/70 hover:border-blue-500/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-dark-500 text-xs font-mono">{page * 50 + idx + 1}.</span>
                      <h3 className="text-white font-medium text-sm truncate">{problem.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <span className="text-blue-400/60 text-xs">{problem.category?.replace('SQL - ', '')}</span>
                    </div>
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
                  <th className="pl-5 pr-2 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-28">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-48">Topic</th>
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
                        className="text-white group-hover:text-blue-400 transition-colors font-medium text-sm"
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
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium">
                        {problem.category?.replace('SQL - ', '')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {problem.acceptanceRate > 0 ? (
                        <span className="text-dark-400 text-sm tabular-nums">{problem.acceptanceRate}%</span>
                      ) : (
                        <span className="text-dark-600 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {problems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="text-dark-500 text-lg mb-2">No SQL problems found</div>
                      <p className="text-dark-600 text-sm">Try a different topic or difficulty</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-1">
              <span className="text-dark-500 text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SQLPractice;
