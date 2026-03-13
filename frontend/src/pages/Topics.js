import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const topicIcons = {
  'Arrays': '📊', 'Strings': '🔤', 'Hashing': '🔑', 'Two Pointers': '👆',
  'Sliding Window': '🪟', 'Recursion': '🔄', 'Backtracking': '↩️',
  'Linked List': '🔗', 'Stack': '📚', 'Queue': '📬', 'Trees': '🌳',
  'Binary Search': '🔍', 'Heap': '⛰️', 'Graphs': '🕸️', 'DP': '💡',
  'Greedy': '🎯', 'Bit Manipulation': '⚡', 'Trie': '🌿',
  'Segment Tree': '📐', 'Fenwick Tree': '📐', 'Core': '🧮',
  'SQL': '🗄️', 'Java': '☕', 'Python': '🐍',
};

const topicColors = {
  'Arrays': 'from-blue-500 to-blue-700', 'Strings': 'from-green-500 to-green-700',
  'Hashing': 'from-purple-500 to-purple-700', 'Two Pointers': 'from-cyan-500 to-cyan-700',
  'Sliding Window': 'from-teal-500 to-teal-700', 'Recursion': 'from-orange-500 to-orange-700',
  'Backtracking': 'from-red-500 to-red-700', 'Linked List': 'from-indigo-500 to-indigo-700',
  'Stack': 'from-amber-500 to-amber-700', 'Queue': 'from-lime-500 to-lime-700',
  'Trees': 'from-emerald-500 to-emerald-700', 'Binary Search': 'from-violet-500 to-violet-700',
  'Heap': 'from-rose-500 to-rose-700', 'Graphs': 'from-sky-500 to-sky-700',
  'DP': 'from-yellow-500 to-yellow-700', 'Greedy': 'from-pink-500 to-pink-700',
  'Bit Manipulation': 'from-fuchsia-500 to-fuchsia-700', 'Trie': 'from-emerald-400 to-teal-600',
  'Core': 'from-slate-500 to-slate-700', 'SQL': 'from-blue-400 to-indigo-600',
  'Java': 'from-orange-400 to-red-600', 'Python': 'from-yellow-400 to-green-600',
};

function Topics() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [difficulty, setDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await problemsAPI.getCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const fetchProblems = useCallback(async () => {
    if (!selectedTopic) return;
    setProblemsLoading(true);
    try {
      const diff = difficulty !== 'ALL' ? difficulty : null;
      const response = await problemsAPI.getByCategory(selectedTopic, page, 50, diff);
      let filtered = response.data.content;
      if (searchQuery) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      setProblems(filtered);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setProblemsLoading(false);
    }
  }, [selectedTopic, page, difficulty, searchQuery]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Group categories by main topic
  const groupedTopics = categories.reduce((acc, cat) => {
    const mainTopic = cat.category.split(' - ')[0].trim();
    if (!acc[mainTopic]) {
      acc[mainTopic] = { total: 0, subtopics: [] };
    }
    acc[mainTopic].total += cat.count;
    acc[mainTopic].subtopics.push(cat);
    return acc;
  }, {});

  const handleTopicClick = (topicName) => {
    setSelectedTopic(topicName);
    setPage(0);
    setDifficulty('ALL');
    setSearchQuery('');
  };

  const getIcon = (topic) => {
    for (const [key, icon] of Object.entries(topicIcons)) {
      if (topic.startsWith(key)) return icon;
    }
    return '📄';
  };

  const getColor = (topic) => {
    for (const [key, color] of Object.entries(topicColors)) {
      if (topic.startsWith(key)) return color;
    }
    return 'from-gray-500 to-gray-700';
  };

  if (loading) return <LoadingSpinner text="Loading topics..." />;

  return (
    <div className="max-w-6xl mx-auto">
      {!selectedTopic ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Topic-Wise Practice</h1>
            <p className="text-dark-400">Master DSA by solving problems organized by topic. Choose a topic to start practicing.</p>
          </div>

          {/* Topic Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(groupedTopics).map(([topic, data]) => (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                className="group relative bg-dark-900 rounded-xl border border-dark-700/50 p-5 text-left hover:border-dark-600 hover:bg-dark-800/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getColor(topic)} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{getIcon(topic)}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getColor(topic)} text-white`}>
                      {data.total}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">{topic}</h3>
                  <p className="text-dark-500 text-xs">
                    {data.subtopics.length} {data.subtopics.length === 1 ? 'subtopic' : 'subtopics'}
                  </p>
                  {/* Subtopic preview */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {data.subtopics.slice(0, 3).map(sub => (
                      <span key={sub.category} className="px-2 py-0.5 bg-dark-800 text-dark-400 rounded text-[10px] truncate max-w-[120px]">
                        {sub.category.includes(' - ') ? sub.category.split(' - ')[1] : sub.category}
                      </span>
                    ))}
                    {data.subtopics.length > 3 && (
                      <span className="px-2 py-0.5 bg-dark-800 text-dark-500 rounded text-[10px]">
                        +{data.subtopics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Back + Topic Header */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Topics
            </button>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getIcon(selectedTopic)}</span>
              <h1 className="text-2xl font-bold text-white">{selectedTopic}</h1>
              <span className="text-dark-500 text-sm">({totalElements} problems)</span>
            </div>

            {/* Subtopic pills */}
            {groupedTopics[selectedTopic] && groupedTopics[selectedTopic].subtopics.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => { handleTopicClick(selectedTopic); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTopic === selectedTopic.split(' - ')[0]
                      ? 'bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/30'
                      : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  All
                </button>
                {groupedTopics[selectedTopic].subtopics.map(sub => (
                  <button
                    key={sub.category}
                    onClick={() => { setSelectedTopic(sub.category); setPage(0); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedTopic === sub.category
                        ? 'bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/30'
                        : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    {sub.category.includes(' - ') ? sub.category.split(' - ')[1] : sub.category}
                    <span className="ml-1 text-dark-500">({sub.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setPage(0); }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    difficulty === d
                      ? 'bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/30'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
                  }`}
                >
                  {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search in topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-800/80 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder-dark-500"
              />
            </div>
          </div>

          {/* Problems Table */}
          {problemsLoading ? (
            <LoadingSpinner text="Loading problems..." />
          ) : (
            <>
              <div className="rounded-xl overflow-hidden border border-dark-700/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-800/50">
                      <th className="pl-5 pr-2 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-12">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-28">Difficulty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-36">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-20">Solve</th>
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
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-dark-400 text-xs">{problem.category}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            to={`/solve/${problem.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600/20 text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-600/30 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Solve
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {problems.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-dark-500">
                          No problems found for this topic
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 px-1">
                  <span className="text-dark-500 text-sm">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 rounded-lg text-sm bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 rounded-lg text-sm bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Topics;
