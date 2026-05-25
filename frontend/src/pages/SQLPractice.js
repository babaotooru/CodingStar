import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const PAGE_SIZE = 50;

const SQL_TOPIC_ORDER = [
  { key: 'SELECT', label: 'SELECT', icon: '📄' },
  { key: 'FILTERING', label: 'WHERE', icon: '🔍' },
  { key: 'AGGREGATES', label: 'Aggregates', icon: '📊' },
  { key: 'GROUP_BY', label: 'GROUP BY', icon: '📦' },
  { key: 'HAVING', label: 'HAVING', icon: '🎯' },
  { key: 'JOINS', label: 'Joins', icon: '🔗' },
  { key: 'SELF_JOIN', label: 'Self Join', icon: '🪞' },
  { key: 'SUBQUERIES', label: 'Subqueries', icon: '📁' },
  { key: 'CORRELATED', label: 'Correlated', icon: '🔄' },
  { key: 'SET_OPERATORS', label: 'UNION', icon: '➕' },
  { key: 'WINDOW', label: 'Window', icon: '🪟' },
  { key: 'CASE', label: 'CASE', icon: '🔀' },
  { key: 'DATES', label: 'Dates', icon: '📅' },
  { key: 'STRINGS', label: 'Strings', icon: '🔤' },
  { key: 'DML', label: 'DML', icon: '✏️' },
  { key: 'TRANSACTIONS', label: 'Transactions', icon: '🔒' },
  { key: 'PERFORMANCE', label: 'Performance', icon: '⚡' },
  { key: 'OTHER', label: 'Other', icon: '🧩' },
];

function inferSQLTopic(problem) {
  const text = `${problem.title || ''} ${problem.description || ''} ${problem.statement || ''} ${problem.category || ''}`.toLowerCase();

  if (/window functions?/.test(text) || /rank\(|dense_rank\(|row_number\(/.test(text)) return 'WINDOW';
  if (/self join/.test(text)) return 'SELF_JOIN';
  if (/join/.test(text)) return 'JOINS';
  if (/group by/.test(text)) return 'GROUP_BY';
  if (/aggregate|count\(|sum\(|avg\(|min\(|max\(/.test(text)) return 'AGGREGATES';
  if (/having/.test(text)) return 'HAVING';
  if (/subquery|nested query|exists\(|in \(/.test(text)) return 'CORRELATED';
  if (/select basics?|select .*where|projection/.test(text)) return 'SELECT';
  if (/where|filter/.test(text)) return 'FILTERING';
  if (/union|intersect|except|set operator/.test(text)) return 'SET_OPERATORS';
  if (/case /.test(text) || /case statements?/.test(text)) return 'CASE';
  if (/date|time|timestamp/.test(text)) return 'DATES';
  if (/string|substring|concat|like|pattern/.test(text)) return 'STRINGS';
  if (/insert|update|delete|merge/.test(text)) return 'DML';
  if (/transaction|commit|rollback|isolation/.test(text)) return 'TRANSACTIONS';
  if (/index|performance|optimization|query plan/.test(text)) return 'PERFORMANCE';
  return 'OTHER';
}

function SQLPractice() {
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [topicCounts, setTopicCounts] = useState({});

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const resp = await problemsAPI.getByCategory('SQL', 0, 1000);
        const mapped = (resp.data.content || []).map((problem) => ({
          ...problem,
          sqlTopic: inferSQLTopic(problem),
        }));

        setAllProblems(mapped);

        const counts = mapped.reduce((acc, problem) => {
          acc[problem.sqlTopic] = (acc[problem.sqlTopic] || 0) + 1;
          return acc;
        }, {});
        setTopicCounts(counts);
      } catch (err) {
        console.error('Failed to fetch SQL problems:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [selectedTopic, difficulty]);

  const difficultyColor = (d) => {
    if (d === 'EASY') return 'text-green-400';
    if (d === 'MEDIUM') return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredProblems = useMemo(() => {
    return allProblems.filter((problem) => {
      const matchesTopic = selectedTopic === 'ALL' || problem.sqlTopic === selectedTopic;
      const matchesDifficulty = difficulty === 'ALL' || problem.difficulty === difficulty;
      return matchesTopic && matchesDifficulty;
    });
  }, [allProblems, selectedTopic, difficulty]);

  const totalSQL = allProblems.length;
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE));
  const visibleProblems = filteredProblems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const sqlTopics = useMemo(() => {
    const topics = SQL_TOPIC_ORDER.filter((topic) => topic.key === 'OTHER' || (topicCounts[topic.key] || 0) > 0);
    return [{ key: 'ALL', label: 'All SQL', icon: '🗄️' }, ...topics];
  }, [topicCounts]);

  if (loading && allProblems.length === 0) return <LoadingSpinner text="Loading SQL problems..." />;

  return (
    <div className="max-w-6xl mx-auto">
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
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-3 sticky top-20">
            <h3 className="text-dark-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Topics</h3>
            <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {sqlTopics.map((topic) => {
                const count = topic.key === 'ALL' ? totalSQL : (topicCounts[topic.key] || 0);
                return (
                  <button
                    key={topic.key}
                    onClick={() => setSelectedTopic(topic.key)}
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
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
            <span className="text-dark-500 text-sm whitespace-nowrap ml-3">{filteredProblems.length} problems</span>
          </div>

          <div className="block md:hidden space-y-2">
            {visibleProblems.map((problem, idx) => (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className="block bg-dark-800/40 rounded-xl border border-dark-700/50 p-4 hover:bg-dark-800/70 hover:border-blue-500/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-dark-500 text-xs font-mono">{page * PAGE_SIZE + idx + 1}.</span>
                      <h3 className="text-white font-medium text-sm truncate">{problem.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <span className="text-blue-400/60 text-xs">{problem.sqlTopic}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

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
                {visibleProblems.map((problem, idx) => (
                  <tr
                    key={problem.id}
                    className={`group hover:bg-dark-800/40 transition-colors ${idx % 2 === 0 ? 'bg-dark-900/30' : 'bg-dark-900/10'}`}
                  >
                    <td className="pl-5 pr-2 py-3.5">
                      <span className="text-dark-600 text-xs font-mono">{page * PAGE_SIZE + idx + 1}</span>
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
                        {problem.sqlTopic}
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
                {visibleProblems.length === 0 && (
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
