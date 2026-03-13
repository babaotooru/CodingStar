import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await contestAPI.getAll();
        setContests(response.data);
      } catch (err) {
        console.error('Failed to fetch contests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'UPCOMING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ENDED': return 'bg-dark-700/50 text-dark-400 border-dark-600';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      );
      case 'UPCOMING': return <span className="text-blue-400">⏰</span>;
      case 'ENDED': return <span className="text-dark-400">✓</span>;
      default: return null;
    }
  };

  const getTimeDisplay = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (contest.status === 'ACTIVE') {
      const diff = end - now;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return `Ends in ${hours}h ${mins}m`;
    } else if (contest.status === 'UPCOMING') {
      const diff = start - now;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) return `Starts in ${days}d ${hours}h`;
      return `Starts in ${hours}h ${mins}m`;
    }
    return new Date(contest.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filtered = filter === 'ALL' ? contests : contests.filter(c => c.status === filter);

  const filters = [
    { value: 'ALL', label: 'All Contests' },
    { value: 'ACTIVE', label: 'Live', dot: 'bg-green-400' },
    { value: 'UPCOMING', label: 'Upcoming', dot: 'bg-blue-400' },
    { value: 'ENDED', label: 'Past', dot: 'bg-dark-500' },
  ];

  if (loading) return <LoadingSpinner text="Loading contests..." />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🏆</span> Contests
          </h1>
          <p className="text-dark-400 mt-1">Compete in timed coding challenges</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-dark-900 rounded-xl p-1.5 border border-dark-700 w-fit">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.value
                ? 'bg-dark-700 text-white shadow-lg'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`}></span>}
            {f.label}
          </button>
        ))}
      </div>

      {/* Active Contests - Featured */}
      {filtered.filter(c => c.status === 'ACTIVE').length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Now
          </h2>
          <div className="grid gap-4">
            {filtered.filter(c => c.status === 'ACTIVE').map(contest => (
              <Link
                key={contest.id}
                to={`/contests/${contest.id}`}
                className="block bg-gradient-to-r from-green-900/20 to-dark-900 rounded-xl border border-green-500/30 p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-500/10 group"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">{contest.title}</h3>
                    <p className="text-dark-400 text-sm mt-1">{contest.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="text-green-400 font-medium">{getTimeDisplay(contest)}</span>
                      <span className="text-dark-500">•</span>
                      <span className="text-dark-400">{contest.problemCount} problems</span>
                      <span className="text-dark-500">•</span>
                      <span className="text-dark-400">{contest.participantCount} participants</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm group-hover:bg-green-500 transition-colors">
                      Enter Contest →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contest Grid */}
      <div className="grid gap-4">
        {filtered.filter(c => c.status !== 'ACTIVE').map((contest, idx) => (
          <Link
            key={contest.id}
            to={`/contests/${contest.id}`}
            className="block bg-dark-900 rounded-xl border border-dark-700 p-5 hover:border-dark-500 transition-all hover:bg-dark-800/50 group animate-slideUp"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(contest.status)}
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusStyle(contest.status)}`}>
                    {contest.status}
                  </span>
                  <span className="text-dark-500 text-sm">{contest.durationMinutes} min</span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                  {contest.title}
                </h3>
                <p className="text-dark-400 text-sm mt-1">{contest.description}</p>
              </div>
              <div className="flex flex-col items-end justify-center gap-1 text-sm">
                <span className="text-dark-400">{getTimeDisplay(contest)}</span>
                <div className="flex items-center gap-3 text-dark-500">
                  <span>{contest.problemCount} problems</span>
                  <span>{contest.participantCount} joined</span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-dark-400">
            <span className="text-5xl mb-4 block">🏆</span>
            <p className="text-lg">No contests found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Contests;
