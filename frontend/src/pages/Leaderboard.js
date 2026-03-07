import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await leaderboardAPI.get();
        setLeaderboard(response.data);
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
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-dark-400';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) return <LoadingSpinner text="Loading leaderboard..." />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Leaderboard</h1>

      {/* Top 3 Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {leaderboard.slice(0, 3).map((entry) => (
            <div
              key={entry.userId}
              className={`bg-dark-900 rounded-xl border border-dark-700 p-6 text-center ${
                entry.rank === 1 ? 'ring-2 ring-yellow-400/30' : ''
              }`}
            >
              <div className="text-4xl mb-3">{getRankIcon(entry.rank)}</div>
              <h3 className={`text-xl font-bold ${getRankStyle(entry.rank)} mb-1`}>
                {entry.username}
              </h3>
              <div className="text-3xl font-bold text-white mb-2">{entry.score}</div>
              <div className="text-dark-400 text-sm">
                {entry.totalSolved} solved | {entry.totalSubmissions} submissions
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Username</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Score</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Problems Solved</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300 hidden md:table-cell">Submissions</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.userId} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                <td className={`px-6 py-4 font-bold ${getRankStyle(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </td>
                <td className="px-6 py-4 text-white font-medium">{entry.username}</td>
                <td className="px-6 py-4 text-primary-400 font-bold">{entry.score}</td>
                <td className="px-6 py-4 text-green-400">{entry.totalSolved}</td>
                <td className="px-6 py-4 text-dark-400 hidden md:table-cell">{entry.totalSubmissions}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-dark-400">
                  No users on the leaderboard yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;
