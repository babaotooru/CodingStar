import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const asArray = (value) => (Array.isArray(value) ? value : []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await leaderboardAPI.get();
        setLeaderboard(asArray(response.data));
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-amber-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-orange-400 to-amber-600';
      default: return '';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  if (loading) return <LoadingSpinner text="Loading leaderboard..." />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-dark-400 text-sm mt-1">Ranked by stars earned from solving problems</p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1, 0, 2].map((idx) => {
            const entry = leaderboard[idx];
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            return (
              <div
                key={entry.userId}
                className={`relative bg-dark-800/40 rounded-2xl border border-dark-700/50 p-5 text-center transition-all hover:-translate-y-1 ${
                  isFirst ? 'sm:-mt-4 ring-1 ring-yellow-500/20' : ''
                }`}
              >
                {isFirst && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>}
                <div className="text-3xl mb-2">{getRankIcon(entry.rank)}</div>
                <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${getRankStyle(entry.rank)} flex items-center justify-center text-dark-900 text-lg font-bold mb-2`}>
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-white font-semibold text-sm truncate">{entry.username}</h3>
                <div className="text-yellow-400 font-bold text-lg mt-1">{entry.stars} ⭐</div>
                <div className="text-primary-400 text-sm font-medium">{entry.score} pts</div>
                <div className="text-dark-500 text-xs mt-1">{entry.totalSolved} solved</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <div className="rounded-2xl overflow-hidden border border-dark-700/50">
        {/* Desktop */}
        <table className="w-full hidden md:table">
          <thead>
            <tr className="bg-dark-800/50">
              <th className="px-5 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-16">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-24">Stars</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-24">Score</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider w-24">Solved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/50">
            {leaderboard.map((entry, i) => (
              <tr key={entry.userId} className={`hover:bg-dark-800/40 transition-colors ${i % 2 === 0 ? 'bg-dark-900/30' : ''}`}>
                <td className="px-5 py-3.5">
                  {getRankIcon(entry.rank) ? (
                    <span className="text-lg">{getRankIcon(entry.rank)}</span>
                  ) : (
                    <span className="text-dark-500 text-sm font-mono">{entry.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium text-sm">{entry.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-yellow-400 font-bold text-sm">{entry.stars} ⭐</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-primary-400 font-semibold text-sm">{entry.score}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-green-400 text-sm">{entry.totalSolved}</span>
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-dark-500">
                  No users on the leaderboard yet
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-dark-800/30">
          {leaderboard.map((entry) => (
            <div key={entry.userId} className="flex items-center justify-between p-4 hover:bg-dark-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center">
                  {getRankIcon(entry.rank) || <span className="text-dark-500 text-sm font-mono">{entry.rank}</span>}
                </span>
                <div>
                  <div className="text-white font-medium text-sm">{entry.username}</div>
                  <div className="text-dark-500 text-xs">{entry.totalSolved} solved</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold text-sm">{entry.stars} ⭐</div>
                <div className="text-primary-400 text-xs">{entry.score} pts</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center text-dark-500 py-16">No users on the leaderboard yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
